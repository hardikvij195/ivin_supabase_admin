"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileText, Trash2, Pencil, Info, Search, Plus, Eye, EyeOff } from "lucide-react";
import { LoadingSkeleton } from "@/components/userComponents/LoadingSkeleton";

import Modal from "@/app/dashboard/_components/Modal";
import PaginationBar from "@/app/dashboard/_components/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

const PhoneInput = dynamic(() => import("react-phone-input-2"), { ssr: false });

type Profile = {
  id: string;
  created_at: string;
  full_name: string | null;
  email: string | null;
  phone?: string | null;
  role?: string | null;
  status?: string | null;
};

export default function AdminPage() {
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / limit);

  // modals
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selected, setSelected] = useState<Profile | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [rowData, setRowData] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    full_name: "",
    phone: "",
    role: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Fetch (server-side pagination). Search is client-side.
  const handleFetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabaseBrowser
        .from("profiles")
        .select("*", { count: "exact" })
        .in("role", ["admin", "superadmin"])
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setAdmins(data || []);
      setTotal(count || 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    handleFetchAdmins();
  }, [page, limit, handleFetchAdmins]);

  // ✅ Explicit refresh that triggers a fetch immediately
  const handleRefresh = useCallback(
    async (goFirst = false) => {
      if (goFirst) {
        // setPage will schedule; fetch after it settles
        setPage(1);
        // small microtask to ensure state updates flush before fetching
        await Promise.resolve();
      }
      await handleFetchAdmins();
    },
    [handleFetchAdmins]
  );

  const filteredAdmins = useMemo(() => {
    if (!searchTerm.trim()) return admins;
    const q = searchTerm.toLowerCase();
    return admins.filter((a) =>
      [a.full_name, a.email, a.phone].some((f) =>
        (f || "").toLowerCase().includes(q)
      )
    );
  }, [admins, searchTerm]);

  const handleDeleteUser = async () => {
    if (!rowData) return;
    try {
      setDeleting(true);
      const res = await fetch("/api/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: rowData.id }),
      });

      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Admin deleted!");

      setIsConfirmOpen(false);
      setRowData(null);
      await handleRefresh(); // ✅ re-fetch immediately
    } catch (err: any) {
      toast.error(err.message || "Error deleting admin");
    } finally {
      setDeleting(false);
    }
  };

  const saveEdit = async () => {
    if (!editForm?.id) return;
    setSaving(true);
    try {
      const payload = {
        full_name: editForm.full_name,
        phone: editForm.phone,
        role: editForm.role,
        status: editForm.status,
      };
      const { error } = await supabaseBrowser
        .from("profiles")
        .update(payload)
        .eq("id", editForm.id);

      if (error) throw error;
      toast.success("Admin updated!");
      setIsEditOpen(false);
      await handleRefresh(); // ✅ re-fetch immediately
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.email || !newAdmin.password || !newAdmin.role) {
      toast.error("All fields required!");
      return;
    }

    // Normalize inputs
    const email = newAdmin.email.trim().toLowerCase();
    const full_name = (newAdmin.full_name || "").trim();
    const phone = newAdmin.phone
      ? (newAdmin.phone.startsWith("+") ? newAdmin.phone : `+${newAdmin.phone}`).trim()
      : null;
    const role = newAdmin.role.trim();

    setSaving(true);
    try {
      // Optional pre-check
      await supabaseBrowser
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .maybeSingle(); // ignore error; just a check

      // Create auth user
      const { data: signUpData, error: signUpError } = await supabaseBrowser.auth.signUp({
        email,
        password: newAdmin.password,
        options: { data: { full_name, phone, role } },
      });
      if (signUpError) throw signUpError;

      const userId = signUpData.user?.id;
      if (!userId) throw new Error("Signup failed: no user id returned");

      // Upsert into profiles by email to avoid unique constraint race
      const { error: upsertError } = await supabaseBrowser
        .from("profiles")
        .upsert(
          {
            id: userId,
            email,
            full_name: full_name || null,
            phone,
            role,
            status: "active",
            username: full_name ? full_name.replace(/\s+/g, "").toLowerCase() : null,
            avatar_url: null,
          },
          { onConflict: "email" }
        );
      if (upsertError) throw upsertError;

      toast.success("Admin created!");
      setIsCreateOpen(false);
      setNewAdmin({ email: "", full_name: "", phone: "", role: "", password: "" });

      await handleRefresh(true); // ✅ go to first page and re-fetch
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("duplicate key value") || msg.includes("profiles_email_key")) {
        toast.error("That email already exists in profiles.");
      } else {
        toast.error(msg || "Failed to create admin");
      }
    } finally {
      setSaving(false);
    }
  };

    if (loading) {
      return (
        <div className="relative min-h-screen animate-pulse">
          <LoadingSkeleton />
        </div>
      );
    }

  return (
    <>
     <h1 className="text-xl sm:text-2xl font-semibold mb-4 px-2">Admin Management</h1>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full ">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, email, or phone..."
            className="pl-9 rounded-3xl border-gray-200 bg-white"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-purple-600 text-white rounded-3xl h-10 lg:w-40 md:w-40 w-80">
          <Plus className="w-4 h-4 mr-1" /> Add Admin
        </Button>
      </div> 

      <div className=" bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full border-spacing-0">
            <TableHeader className="bg-gray-50">
              <TableRow className="border-b border-gray-200 ">
                <TableHead className="text-left py-1 lg:px-4 md:px-4 px-3 font-medium text-gray-500 text-xs">NAME</TableHead>
                <TableHead className="text-left py-1 lg:px-4 md:px-4 px-3 font-medium text-gray-500 text-xs">EMAIL</TableHead>
                <TableHead className="text-left py-1 lg:px-4 md:px-4 px-3 font-medium text-gray-500 text-xs">PHONE</TableHead>
                <TableHead className="text-left py-1 lg:px-4 md:px-4 px-3 font-medium text-gray-500 text-xs">ROLE</TableHead>
                <TableHead className="text-left py-1 lg:px-4 md:px-4 px-3 font-medium text-gray-500 text-xs">STATUS</TableHead>
                <TableHead className="text-left py-1 lg:px-4 md:px-4 px-3 font-medium text-gray-500 text-xs">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.length ? (
                filteredAdmins.map((user) => (
                  <TableRow key={user.id} className="border-b border-gray-100 hover:bg-purple-50 transition-colors lg:text-md md:text-md text-sm">
                    <TableCell className="py-4 px-4 text-gray-900">{user.full_name ?? "-"}</TableCell>
                    <TableCell className="py-4 px-4 text-gray-900" >{user.email ?? "-"}</TableCell>
                    <TableCell className="py-4 px-4 text-gray-900"> {user.phone ?? "-"}</TableCell>
                    <TableCell  >
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.role === "superadmin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell >
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell >
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsConfirmOpen(true);
                            setRowData(user);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditForm(user);
                            setIsEditOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelected(user);
                            setIsInfoOpen(true);
                          }}
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p>No Admins Found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationBar
          page={page}
          setPage={setPage}
          totalPage={totalPages}
          totalRecord={total}
          limit={limit}
          setLimit={setLimit}
        />

        {/* Info Modal */}
        <Modal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)}>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">{selected?.full_name}</h2>
            <p>Email: {selected?.email}</p>
            <p>Phone: {selected?.phone}</p>
            <p>Role: {selected?.role}</p>
            <p>Status: {selected?.status}</p>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Edit Admin</h2>
            <Input
              placeholder="Full Name"
              value={editForm.full_name || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, full_name: e.target.value })
              }
            />
            <Input
              placeholder="Phone"
              value={editForm.phone || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, phone: e.target.value })
              }
            />
            <select
              value={editForm.role || ""}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              className="w-full border border-gray-200 rounded-md px-3 py-2"
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
            <div className="flex justify-end gap-2">
              <Button onClick={saveEdit} disabled={saving} className="text-white">
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Create Modal */}
        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Create Admin</h2>
            <Input
              placeholder="Full Name"
              value={newAdmin.full_name}
              onChange={(e) =>
                setNewAdmin({ ...newAdmin, full_name: e.target.value })
              }
            />
            <Input
              placeholder="Email"
              type="email"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={newAdmin.phone}
              onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
            />
            <select
              value={newAdmin.role}
              onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select role</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
            <div className="relative">
              <Input
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={newAdmin.password}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, password: e.target.value })
                }
              />
              <span
                className="absolute right-3 top-2 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-500" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-500" />
                )}
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={handleAddAdmin} disabled={saving} className="text-white">
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Modal */}
        <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
          <h2 className="text-lg font-semibold mb-2">Delete Admin?</h2>
          <p>This action cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="secondary"
              onClick={() => setIsConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-red-600 text-white"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </Modal>
      </div>
    </>
  );
}

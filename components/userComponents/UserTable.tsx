"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { toast } from "sonner";
import Modal from "@/app/dashboard/_components/Modal";
import PaginationBar from "@/app/dashboard/_components/Pagination";
import { displayValidTill } from "@/lib/dateTimeFormatter";
import { FileText, Info, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type Profile = {
  id: string;
  created_at: string;
  full_name: string | null;
  email: string | null;
  phone?: string | null;
  role?: string | null;
  status?: string | null;
};

interface UserTableProps {
  users: Profile[];
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  page: number;
  handleExportFile: () => void;
  totalRecord: number;
  limit: number;
  setLimit?: React.Dispatch<React.SetStateAction<number>>;
  setDeleteRefresh?: React.Dispatch<React.SetStateAction<any>>;
}

export default function UserTable({
  users,
  setPage,
  totalPages,
  page,
  totalRecord,
  limit,
  setLimit,
  setDeleteRefresh,
}: UserTableProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selected, setSelected] = useState<Profile | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [rowData, setRowData] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);

  const handleRefresh = () => {
    setPage(1);
    setDeleteRefresh?.(Math.random());
  };

  const openInfo = (row: Profile) => {
    setSelected(row);
    setIsInfoOpen(true);
  };

  const openEdit = (row: Profile) => {
    setEditForm({
      id: row.id,
      full_name: row.full_name ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
      role: row.role ?? "dealer",
      status: row.status ?? "",
    });
    setIsEditOpen(true);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    if (!editForm?.id) return;
    if (!editForm.email) {
      toast.error("Email is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        full_name: (editForm.full_name ?? "").trim() || null,
        email: (editForm.email ?? "").trim(),
        phone: (editForm.phone ?? "").trim() || null,
        role: (editForm.role ?? "").trim() || null,
        status: (editForm.status ?? "").trim() || null,
      };

      const { error } = await supabaseBrowser
        .from("profiles")
        .update(payload)
        .eq("id", editForm.id);

      if (error) throw error;

      toast.success("User updated successfully");
      setIsEditOpen(false);
      handleRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!rowData) return;
    try {
      setDeleting(true);
      const res = await fetch("/api/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: rowData.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to delete user");
        return;
      }

      toast.success("User deleted successfully!");
      handleRefresh();
      setIsConfirmOpen(false);
      setRowData(null);
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col overflow-hidden">
        {/* Table */}
        <div className="w-full">
          <Table className="w-full border-spacing-0">
            <TableHeader className="bg-gray-50">
              <TableRow className="border-b border-gray-200">
                <TableHead className="py-2 px-3 text-xs font-medium text-gray-500">NAME</TableHead>
                <TableHead className="py-2 px-3 text-xs font-medium text-gray-500">PHONE</TableHead>
                <TableHead className="py-2 px-3 text-xs font-medium text-gray-500">EMAIL</TableHead>
                <TableHead className="py-2 px-3 text-xs font-medium text-gray-500">ROLE</TableHead>
                <TableHead className="py-2 px-3 text-xs font-medium text-gray-500">STATUS</TableHead>
                <TableHead className="py-2 px-3 text-xs font-medium text-gray-500">JOIN DATE</TableHead>
                <TableHead className="py-2 px-3 text-xs font-medium text-gray-500">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {users?.length > 0 ? (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-purple-50 transition-colors text-sm"
                  >
                    <TableCell className="py-3 px-4 text-gray-900">{user.full_name ?? "-"}</TableCell>
                    <TableCell className="py-3 px-4 text-gray-900">{user.phone ?? "-"}</TableCell>
                    <TableCell className="py-3 px-4 text-gray-900">{user.email ?? "-"}</TableCell>
                    <TableCell className="py-3 px-4"><span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.role === "dealer"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >{user.role ?? "-"}</span></TableCell>
                    <TableCell className="py-3 px-4"><span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >{user.status ?? "-"}</span></TableCell>
                    <TableCell className="py-3 px-4 text-gray-600">
                      {user.created_at ? displayValidTill(user.created_at, user.created_at) : "-"}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-x-2">
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
                        <button
                          onClick={() => openInfo(user)}
                          className="cursor-pointer p-2 rounded-md  text-gray-600"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(user)}
                          className="cursor-pointer p-2 rounded-md  text-gray-600 "
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="p-6">
                    <div className="flex flex-col justify-center items-center text-gray-900">
                      <FileText className="w-16 h-16 text-gray-400 mb-4" />
                      <h2 className="text-2xl font-medium">No Data Found</h2>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="shrink-0 border-t border-gray-200">
          <PaginationBar
            page={page}
            setPage={setPage}
            totalPage={totalPages}
            totalRecord={totalRecord}
            limit={limit}
            setLimit={setLimit}
          />
        </div>
      </div>

      {/* DELETE CONFIRM MODAL */}
      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <h2 className="text-lg font-semibold mb-2">Are you sure?</h2>
        <p className="text-sm text-gray-600 mb-4">
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
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

      {/* INFO MODAL */}
      <Modal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)}>
        <div className="max-w-md max-h-[90vh] overflow-y-auto mx-auto bg-white p-6">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h2 className="text-2xl font-medium text-gray-800">
              {selected?.full_name}
            </h2>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-purple-100 text-purple-700">
              {selected?.role ?? "-"}
            </span>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <Row label="Email" value={selected?.email ?? "-"} />
            <Row label="Phone" value={selected?.phone ?? "-"} />
            <Row label="Status" value={selected?.status ?? "-"} />
            <Row
              label="Join Date"
              value={
                selected?.created_at
                  ? displayValidTill(selected.created_at)
                  : "-"
              }
            />
          </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <div className="max-w-xl w-full max-h-[90vh] overflow-y-auto bg-white p-6">
          <h2 className="text-xl font-semibold mb-4">Edit User</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name">
              <input
                name="full_name"
                value={(editForm.full_name as string) ?? ""}
                onChange={handleEditChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                name="email"
                value={(editForm.email as string) ?? ""}
                onChange={handleEditChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </Field>

            <Field label="Phone">
              <input
                name="phone"
                value={(editForm.phone as string) ?? ""}
                onChange={handleEditChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </Field>

            <Field label="Role">
              <select
                name="role"
                value={(editForm.role as string) ?? "dealer"}
                onChange={handleEditChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
              >
                <option value="dealer">Dealer</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </Field>

            <Field label="Status">
              <select
                name="status"
                value={(editForm.status as string) ?? ""}
                onChange={handleEditChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
              >
                <option value="">Select Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={saveEdit} disabled={saving} className="text-white">
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="font-medium text-gray-600">{label}:</span>
      <span className="text-right break-all">{value}</span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

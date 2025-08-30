"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/userComponents/LoadingSkeleton";
import { SearchAndFilter } from "@/components/userComponents/SearchAndFilter";
import UserTable from "@/components/userComponents/UserTable";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { showToast } from "@/hooks/useToast";
import { exportToExcel } from "@/lib/exportToExcel";

function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  const [limit, setLimit] = useState(9); // default rows (desktop)
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteRefresh, setDeleteRefresh] = useState<any>(null);

  // 🔹 Set rows per page depending on screen size
  useEffect(() => {
    const updateLimit = () => {
      if (window.innerWidth < 1024) {
        setLimit(11); // mobile
      } else {
        setLimit(8); // desktop
      }
      setPage(1);
    };

    updateLimit();
    window.addEventListener("resize", updateLimit);
    return () => window.removeEventListener("resize", updateLimit);
  }, []);

  // 🔹 Fetch profiles
  useEffect(() => {
    const handleFetchProfiles = async () => {
      if (!limit) return;
      try {
        setLoading(true);
        setError(null);

        let query = supabaseBrowser
          .from("profiles")
          .select("*", { count: "exact" })
          .eq("role", "dealer", )
          .order("created_at", { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        if (statusFilter && statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        setUsers(data || []);
        setTotal(count || 0);
      } catch (err: any) {
        setError(err.message || "Failed to fetch profiles");
      } finally {
        setLoading(false);
      }
    };

    handleFetchProfiles();
  }, [page, statusFilter, limit, deleteRefresh]);

  // 🔹 Client-side filtering for search
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const q = searchTerm.trim().toLowerCase();
    return users.filter((u: any) => {
      const email = (u.email || "").toLowerCase();
      const name = (u.full_name || "").toLowerCase();
      const phone = (u.phone || "").toLowerCase();
      return email.includes(q) || name.includes(q) || phone.includes(q);
    });
  }, [users, searchTerm]);

  const serverTotalPages = Math.max(1, Math.ceil(total / limit));
  const displayUsers = filteredUsers;
  const totalForDisplay = searchTerm ? filteredUsers.length : total;

  // 🔹 Export to Excel
  const handleExportFile = async () => {
    try {
      const { data, error } = await supabaseBrowser
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error("Something went wrong!");
      await exportToExcel(data, "users");
    } catch {
      showToast({ title: "Error", description: "Something went wrong!" });
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
    <div className="flex flex-col overflow-hidden">
      <h1 className="text-xl sm:text-2xl font-semibold py-2 px-2">
        User Management
      </h1>

      <div className="shrink-0">
        <SearchAndFilter
          searchTerm={searchTerm}
          onSearchChange={(v) => {
            setSearchTerm(v);
            setPage(1);
          }}
          planFilter={planFilter}
          onPlanFilterChange={(v) => setPlanFilter(v)}
          statusFilter={statusFilter}
          onStatusFilterChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        />
      </div>

      <Card className="border border-gray-200 bg-white shadow-sm mt-4 rounded-xl overflow-hidden">
  <CardContent className="p-0">
    <UserTable
      users={displayUsers || []}
      handleExportFile={handleExportFile}
      setPage={setPage}
      page={page}
      totalPages={serverTotalPages}
      limit={limit}
      totalRecord={totalForDisplay}
      setLimit={setLimit}
      setDeleteRefresh={setDeleteRefresh}
    />
  </CardContent>
</Card>

    </div>
  );
}

export default UsersPage;

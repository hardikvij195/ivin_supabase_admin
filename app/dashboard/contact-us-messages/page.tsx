"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Modal from "@/app/dashboard/_components/Modal";
import PaginationBar from "@/app/dashboard/_components/Pagination";
import { FileText, Trash2, Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchAndFilter } from "@/components/userComponents/SearchAndFilter";

type ContactMessage = {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  message: string | null;
};

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecord, setTotalRecord] = useState(0);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [rowData, setRowData] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabaseBrowser
        .from("contact_us_messages")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (searchTerm?.trim()) {
        const q = `%${searchTerm.trim()}%`;
        query = query.or(`name.ilike.${q},email.ilike.${q},message.ilike.${q}`);
      }
      if (planFilter) {
        query = (query as any).eq("plan", planFilter);
      }
      if (statusFilter) {
        query = (query as any).eq("status", statusFilter);
      }

      const { data, error, count } = await (query as any).range(from, to);
      if (error) throw error;

      setMessages((data as ContactMessage[]) || []);
      setTotalRecord(count || 0);
      setTotalPages(Math.max(1, Math.ceil((count || 0) / limit)));
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error(err?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [page, limit, searchTerm, planFilter, statusFilter, refreshKey]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(messages.map((m) => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected messages?`)) return;

    try {
      setDeleting(true);
      const ids = Array.from(selectedIds);
      const { error } = await supabaseBrowser
        .from("contact_us_messages")
        .delete()
        .in("id", ids);
      if (error) throw error;

      toast.success("Selected messages deleted");
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete selected messages");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!rowData) return;
    try {
      setDeleting(true);
      const { error } = await supabaseBrowser
        .from("contact_us_messages")
        .delete()
        .eq("id", rowData.id);
      if (error) throw error;

      toast.success("Message deleted successfully!");
      setIsConfirmOpen(false);
      setRowData(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete message");
    } finally {
      setDeleting(false);
    }
  };

  const allVisibleSelected = useMemo(() => {
    return messages.length > 0 && selectedIds.size === messages.length;
  }, [messages, selectedIds]);

  return (
    <>
      <div className=" mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold py-2 px-2">
          Contact Messages
        </h1>
        <div className="flex items-center gap-3">
          <div className="w-full">
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={(v: string) => {
                setSearchTerm(v);
                setPage(1);
              }}
              planFilter={planFilter}
              onPlanFilterChange={(v: string) => setPlanFilter(v)}
              statusFilter={statusFilter}
              onStatusFilterChange={(v: string) => {
                setStatusFilter(v);
                setPage(1);
              }}
            />
          </div>
          <Button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0 || deleting}
            className="bg-red-600 text-white w-40"
          >
            {deleting ? "Deleting..." : `Delete Selected (${selectedIds.size})`}
          </Button>
        </div>
      </div>

      <div className="flex flex-col rounded-xl shadow-md overflow-hidden">
        <div className="w-full">
          <Table className="w-full border-spacing-0 bg-white  overflow-hidden">
            <TableHeader className="bg-gray-50">
              <TableRow className="border-b border-gray-200">
                <TableHead className="py-2 px-3 text-xs font-medium text-gray-500 w-12">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead className="py-2 px-3 text-xs font-medium text-gray-500">
                  NAME
                </TableHead>
                <TableHead className="py-2 px-3 text-xs font-medium text-gray-500">
                  EMAIL
                </TableHead>
                <TableHead className="py-2 px-3 text-xs font-medium text-gray-500">
                  MESSAGE
                </TableHead>
                <TableHead className="py-2 px-3 text-xs font-medium text-gray-500">
                  DATE
                </TableHead>
                <TableHead className="py-2 px-3 text-xs font-medium text-gray-500">
                  ACTIONS
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell className="py-3 px-4">
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="h-4 w-40 bg-gray-200 rounded"></div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="h-4 w-28 bg-gray-200 rounded"></div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : messages?.length > 0 ? (
                messages.map((msg) => (
                  <TableRow
                    key={msg.id}
                    className="border-b border-gray-100 hover:bg-purple-50 transition-colors text-sm"
                  >
                    <TableCell className="py-3 px-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(msg.id)}
                        onChange={() => toggleSelect(msg.id)}
                      />
                    </TableCell>
                    <TableCell className="py-3 px-4 text-gray-900">
                      {msg.name ?? "-"}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-gray-900">
                      {msg.email ?? "-"}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-gray-900 truncate max-w-xs">
                      {msg.message ?? "-"}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-gray-600">
                      {new Date(msg.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsConfirmOpen(true);
                            setRowData(msg);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                        <button
                          onClick={() => {
                            setSelected(msg);
                            setIsInfoOpen(true);
                          }}
                          className="cursor-pointer p-2 rounded-md text-gray-600"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="p-6">
                    <div className="flex flex-col justify-center items-center text-gray-900">
                      <FileText className="w-16 h-16 text-gray-400 mb-4" />
                      <h2 className="text-2xl font-medium">
                        No Messages Found
                      </h2>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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
            onClick={handleDeleteMessage}
            disabled={deleting}
            className="bg-red-600 text-white"
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)}>
        <div className="max-w-md max-h-[90vh] overflow-y-auto mx-auto bg-white p-6">
          <h2 className="text-xl font-semibold mb-4">Message Details</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <Row label="Name" value={selected?.name ?? "-"} />
            <Row label="Email" value={selected?.email ?? "-"} />
            <Row label="Message" value={selected?.message ?? "-"} />
            <Row
              label="Date"
              value={
                selected?.created_at
                  ? new Date(selected.created_at).toLocaleString()
                  : "-"
              }
            />
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

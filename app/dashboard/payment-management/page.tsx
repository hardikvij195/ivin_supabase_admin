"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Search, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { format } from "date-fns";
import PaymentsTable from "@/components/PaymentTable";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ---------- Types ----------

type Json = Record<string, any>;

export interface Payment {
  payment_id: string;
  vin: string;
  id: string;
  user_id: string | null;
  user_email?: string | null;
  amount: number | string | null;
  currency?: string | null;
  status?: string | null; // e.g., succeeded, failed, pending, refunded
  method?: string | null; // e.g., stripe, razorpay, card, upi
  provider_id?: string | null; // external provider/ch_id/payment_intent
  reference?: string | null; // your internal reference/invoice
  metadata?: Json | null;
  receipt_url?: string | null;
  created_at: string;
}

// ---------- Page (Admin view) ----------

export default function Page() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);

  useEffect(() => {
    let cancelled = false;

    async function fetchPayments() {
      setLoading(true);
      setErr(null);
      try {
        // ADMIN VIEW: fetch ALL payments (no user filter)
        const { data, error } = await supabaseBrowser
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!cancelled) setRows((data ?? []) as Payment[]);
      } catch (e: any) {
        console.error("Supabase fetch error:", e);
        if (!cancelled) {
          setRows([]);
          setErr(e?.message || "Failed to load payments.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPayments();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((p) => {
   
      const amountStr =
        p.amount === null || p.amount === undefined ? "" : String(p.amount);

     
      const hay = [
        p.user_email,
        p.user_id,
        p.reference,
        p.provider_id,
        p.payment_id, 
        p.method,
        p.status,
        p.currency,
        (p as any).vin, 
        amountStr,
      ]
        .map((x) => (x ?? "").toString().toLowerCase())
        .join(" ");

      const qOk = q ? hay.includes(q) : true;

      // keep your explicit dropdown filters too
      const s = (p.status || "").toLowerCase();
      const statusOk = status ? s === status.toLowerCase() : true;

      const m = (p.method || "").toLowerCase();
      const methodOk = method ? m === method.toLowerCase() : true;

      const dateOk = date
        ? (() => {
            const d1 = new Date(p.created_at);
            return (
              d1.getFullYear() === date.getFullYear() &&
              d1.getMonth() === date.getMonth() &&
              d1.getDate() === date.getDate()
            );
          })()
        : true;

      return qOk && statusOk && methodOk && dateOk;
    });
  }, [rows, search, status, method, date]);

  // ------- Pagination -------
  const totalRecord = filtered.length;
  const totalPage = Math.max(1, Math.ceil(totalRecord / limit));
  const currentPage = Math.min(page, totalPage);
  const start = (currentPage - 1) * limit;
  const end = start + limit;
  const paginated = filtered.slice(start, end);

  // Distinct status/method for dropdowns
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.status && set.add(r.status));
    return Array.from(set.values()).sort();
  }, [rows]);

  const methodOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.method && set.add(r.method));
    return Array.from(set.values()).sort();
  }, [rows]);

  return (
    <div className="lg:max-w-screen md:max-w-screen max-w-[320px]">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4 px-2">Payments</h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="relative lg:w-full md:w-full w-80 sm:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by userId, paymentId, amount, method, or status"
            className="h-10 rounded-2xl sm:rounded-3xl bg-white pl-11 pr-4 border shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px] placeholder:text-gray-400"
          />
        </div>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 lg:w-40 md:w-40 w-80  rounded-2xl sm:rounded-3xl bg-white border border-gray-200 px-4 text-[15px]"
        >
          <option value="">Status</option>
          {statusOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

       

        {/* Date picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 lg:w-40 md:w-40 w-80 justify-start rounded-2xl sm:rounded-3xl bg-white border border-gray-200 shadow-none hover:bg-gray-100 text-[15px] px-4 sm:px-5"
            >
              <CalendarIcon className="mr-2 h-5 w-5 text-purple-600" />
              {date ? format(date, "PP") : "Choose Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 bg-white"
            align="start"
            sideOffset={8}
          >
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                setDate(d);
                setPage(1);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {err && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
          {err}
        </div>
      )}

      {loading ? (
        <div className=" bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <Table className="min-w-[1000px] w-full text-sm animate-pulse">
            <TableHeader className="bg-gray-50">
              <TableRow>
                {[
                  "User",
                  "Amount",
                  "Method",
                  "Status",
                  "Reference",
                  "Created",
                  "Action",
                ].map((h) => (
                  <th key={h} className="p-3 text-left text-gray-500">
                    {h}
                  </th>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-t">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j} className="p-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <PaymentsTable
            items={paginated}
            loading={loading}
            page={currentPage}
            setPage={setPage}
            totalPage={totalPage}
            totalRecord={totalRecord}
            limit={limit}
            setLimit={(n) => {
              setLimit(n);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}

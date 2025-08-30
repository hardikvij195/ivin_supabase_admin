"use client";

import React, { Dispatch, SetStateAction } from "react";
import type { Payment } from "@/app/dashboard/payment-management/page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText } from "lucide-react";
import PaginationBar from "@/app/dashboard/_components/Pagination";

// ---------- Types ----------

type Props = {
  items: Payment[];
  loading: boolean;
  // Pagination (controlled from parent)
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  totalPage: number;
  totalRecord: number;
  limit: number;
  setLimit: Dispatch<SetStateAction<number>>;
};

// ---------- Helpers ----------

const fmtCurrency = (amount: number, currency?: string | null) => {
  try {
    const code = (currency ?? "USD").toUpperCase();
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
};

const badge = (status?: string | null) => {
  const s = (status ?? "").toLowerCase();
  if (s === "succeeded" || s === "paid" || s === "completed")
    return <span className="text-green-700">● {status}</span>;
  if (s === "pending" || s === "processing")
    return <span className="text-yellow-700">⚠ {status}</span>;
  if (s === "failed" || s === "canceled" || s === "refunded")
    return <span className="text-red-700">✖ {status}</span>;
  return <span>{status ?? "—"}</span>;
};
// ---------- Component ----------

const PaymentsTable: React.FC<Props> = ({
  items,
  loading,
  page,
  setPage,
  totalPage,
  totalRecord,
  limit,
  setLimit,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl ">
      <Table className="w-full border-spacing-0 ">
        <TableHeader className="bg-gray-50">
          <TableRow className="border-b border-gray-200">
            <TableHead className="text-left py-1 lg:px-4 md:px-4 px-3 font-medium text-gray-500 text-xs">
              USER
            </TableHead>
            <TableHead className="text-left py-1 lg:px-4 md:px-4 px-3 font-medium text-gray-500 text-xs">
              PAYMENT ID
            </TableHead>
            <TableHead className="text-left py-1 lg:px-4 md:px-4 px-3 font-medium text-gray-500 text-xs">
              VIN
            </TableHead>
            <TableHead className="text-left py-1 lg:px-4 md:px-4 px-3 font-medium text-gray-500 text-xs">
              AMOUNT
            </TableHead>
            <TableHead className="text-left py-1 lg:px-4 md:px-4 px-3 font-medium text-gray-500 text-xs">
              METHOD
            </TableHead>
            <TableHead className="text-left py-1 lg:px-4 md:px-4 px-3 font-medium text-gray-500 text-xs">
              STATUS
            </TableHead>
            <TableHead className="text-left py-1 lg:px-4 md:px-4 px-3 font-medium text-gray-500 text-xs">
              CREATED
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="p-6 text-center text-gray-500">
                Loading…
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="p-6 text-center text-gray-500">
                No payments found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((p) => {
              const amountNum = Number(p.amount ?? 0);
              const amountSafe = Number.isFinite(amountNum) ? amountNum : 0;
              const when = p.created_at
                ? new Date(p.created_at).toLocaleString()
                : "—";

              return (
                <TableRow
                  key={p.payment_id}
                  className="border-b border-gray-100 hover:bg-purple-50 transition-colors lg:text-md md:text-md text-sm"
                >
                  <TableCell className="py-4 px-4 text-gray-900">
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[200px]">
                        {p.user_email || p.user_id || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4 text-gray-900">
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[200px]">
                        {p.user_email || p.payment_id || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4 text-gray-900">
                    {p.vin || "—"}
                  </TableCell>

                  <TableCell className="py-4 px-4 text-gray-900">
                    {fmtCurrency(amountSafe, p.currency)}
                  </TableCell>

                  <TableCell className="py-4 px-4 text-gray-900">
                    {p.method || "—"}
                  </TableCell>

                  <TableCell className="py-4 px-4 text-gray-900">
                    {badge(p.status)}
                  </TableCell>

                  <TableCell className="py-4 px-4 text-gray-900">
                    {when}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <div className="mt-4">
        <PaginationBar
          page={page}
          setPage={setPage}
          totalPage={totalPage}
          totalRecord={totalRecord}
          limit={limit}
          setLimit={setLimit}
        />
      </div>
    </div>
  );
};

export default PaymentsTable;

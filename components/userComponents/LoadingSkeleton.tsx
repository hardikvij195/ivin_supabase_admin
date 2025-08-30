import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const LoadingSkeleton = () => {
  return (
    <div className="p-6 space-y-6">
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
    </div>
  );
};

// components/Pagination.tsx
"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Pagination = {
  totalRecord: number;
  totalPage: number;
  page: number;
  limit: number;
  setLimit?: React.Dispatch<React.SetStateAction<number>>;
  setPage?: React.Dispatch<React.SetStateAction<number>>;
};

export default function PaginationBar({
  totalRecord,
  totalPage,
  page,
  limit,
  setLimit,
  setPage,
}: Pagination) {
  return (
    <div className="w-full flex justify-end px-4 py-2 bg-purple-50 text-sm text-gray-700">
      <div className="flex items-center space-x-4">
        

        {/* Prev Arrow */}
        {page > 1 && (
          <button
            onClick={() => setPage && setPage(page - 1)}
            className="cursor-pointer w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 transition"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
        )}

        {/* Current Page Number */}
        <div className="w-8 h-8 flex items-center justify-center rounded bg-purple-600 text-white font-semibold">
          {page || 1}
        </div>

        {/* Next Arrow */}
        <button
          disabled={!totalPage || page == totalPage}
          onClick={() => setPage && setPage(page + 1)}
          className="cursor-pointer w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 transition"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>

       
      </div>
    </div>
  );
}

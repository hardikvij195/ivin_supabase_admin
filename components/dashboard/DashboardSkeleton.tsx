import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Welcome text */}
      <Skeleton className="h-7 w-[200px] animate-pulse" />

      {/* Cards */}
      <div className="flex gap-5 flex-wrap">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-lg  bg-white w-[250px] h-[120px] flex flex-col gap-3"
          >
            <Skeleton className="h-6 w-6 animate-pulse" />
            <Skeleton className="h-5 w-[150px] animate-pulse" />
            <Skeleton className="h-4 w-[100px] animate-pulse" />
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="p-4 rounded-lg  bg-white">
        <Skeleton className="h-6 w-[180px] mb-4 animate-pulse" />
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex justify-between py-2 last:border-0"
          >
            <Skeleton className="h-4 w-[200px] animate-pulse" />
            <Skeleton className="h-4 w-[80px] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

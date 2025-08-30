"use client";

import Image from "next/image";

type Metric = {
  icon: string;
  label: string;
  value: string | number;
  alt: string;
};

export default function DashboardRecentActivity({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="px-6 py-5 flex flex-col gap-3 bg-white rounded-[8px] border border-[#EAEAEA]">
      <div className="flex justify-between">
        <div className="flex gap-[12px]">
          <p className="text-[18px] font-bold">Daily Key Metrics</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-2">
        {/* Header row */}
        <div className="flex">
          <div className="w-2/3">
            <p className="font-semibold text-[15px]">Metric</p>
          </div>
          <div className="w-1/3">
            <p className="font-semibold text-[15px]">Value</p>
          </div>
        </div>

        {/* Data rows */}
        {metrics.map(({ icon, label, value, alt }, index) => (
          <div key={index} className="flex border-t-2 border-[#EDEDED]">
            <div className="w-2/3 flex gap-[12px] pt-4 items-center text-[14px]">
              <Image src={icon} alt={alt} width={20} height={20} />
              <p>{label}</p>
            </div>
            <div className="w-1/3 pt-4">
              <p>{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// dashboard-cards.tsx

interface DashboardCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    linkText?: string;
  }
  
  export default function DashboardCard({ icon, title, value, linkText }: DashboardCardProps) {
    return (
      <div className="px-6 py-5 bg-white flex-1  border border-[#EAEAEA] rounded-[8px] flex flex-col gap-4">
        <p className="font-medium text-[#1C1C1C] flex gap-4 text-md">{title}</p>
        <div className="flex justify-between items-center gap-8">
          <div className="flex gap-[12px] items-center">
            {icon}
            <p className="font-semibold text-[18px] text-[#1C1C1C]">{value}</p>
          </div>
          {linkText && <p className="text-primary text-sm font-semibold">{linkText}</p>}
        </div>
      </div>
    );
  }
  
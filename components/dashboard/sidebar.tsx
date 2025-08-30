"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  CreditCard,
  FileSpreadsheet,
  Mail,
  MessageSquare,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { cn } from "@/lib/utils";

interface SidebarItemConfig {
  icon: React.ElementType;
  title: string;
  path?: string; // logout won’t need a path
}

interface SidebarItemProps extends SidebarItemConfig {
  isActive: boolean;
  showLabels: boolean;
  onClick: () => void;
}

const sidebarItems: SidebarItemConfig[] = [
  { icon: LayoutDashboard, title: "Dashboard", path: "/dashboard" },
  { icon: User, title: "User Management", path: "/dashboard/user-management" },
  { icon: Users, title: "Admin Management", path: "/dashboard/admin-management" },
  { icon: FileBarChart, title: "Vehicle Reports", path: "/dashboard/vehicle-reports" },
  { icon: CreditCard, title: "Payment Management", path: "/dashboard/payment-management" },
  { icon: FileSpreadsheet, title: "Platform Reports", path: "/dashboard/platform-reports" },
  { icon: Mail, title: "Contact Messages", path: "/dashboard/contact-us-messages" },
  { icon: MessageSquare, title: "The Wall", path: "/dashboard/the-wall" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");

    const applyMQ = (mq: MediaQueryList | MediaQueryListEvent) => {
      const matches = "matches" in mq ? mq.matches : (mq as MediaQueryList).matches;
      setIsMobile(matches);
      if (!matches) setCollapsed(false); // desktop expanded
      if (matches) setCollapsed(true); // mobile collapsed
    };

    applyMQ(mql);
    mql.addEventListener?.("change", applyMQ as any);
    setMounted(true);

    return () => mql.removeEventListener?.("change", applyMQ as any);
  }, []);

  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [pathname, isMobile]);

  const showLabels = !collapsed;
  const baseWidth = collapsed ? "w-20" : "w-64";
  const desktopWidth = collapsed ? "lg:w-16" : "lg:w-64";

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut();
    router.push("/"); // redirect to home/login
  };

  return (
    <aside
      className={cn(
        isMobile && !collapsed
          ? "fixed min-h-screen inset-y-0 left-0 top-16 z-50"
          : "static",
        "max-h-screen flex flex-col justify-between", // ✅ allow logout at bottom
        "border border-[#EAEAEA] bg-white shadow-md transition-[width] duration-300 ease-in-out",
        "lg:rounded-[16px] rounded-lg lg:ml-5 lg:my-5",
        baseWidth,
        desktopWidth,
        !mounted && "opacity-0"
      )}
    >
      {/* Main content */}
      <div className="flex flex-col">
        {/* Collapse / Expand */}
        <div className="flex items-center justify-end px-2 py-3">
          <button
            type="button"
            className="p-2 rounded-md hover:bg-gray-100 transition"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-700" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            )}
          </button>
        </div>

        {/* Menu items */}
        <ul className="flex-1 space-y-1 px-2 py-2">
          {sidebarItems.map((item, index) => {
            const isActive = pathname === item.path;
            return (
              <li key={index}>
                <SidebarItem
                  {...item}
                  isActive={isActive}
                  showLabels={showLabels}
                  onClick={() => item.path && router.push(item.path)}
                />
              </li>
            );
          })}
        </ul>
      </div>

      {/* Logout pinned to bottom */}
      <div className="p-2 border-t border-gray-200">
        <SidebarItem
          icon={LogOut}
          title="Log out"
          isActive={false}
          showLabels={showLabels}
          onClick={handleLogout}
        />
      </div>
    </aside>
  );
}

function SidebarItem({
  icon: Icon,
  title,
  isActive,
  showLabels,
  onClick,
}: SidebarItemProps) {
  const isLogout = title === "Log out";
  const color = isLogout ? "#B50F02" : "#0A0A0A";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-colors text-left",
        isActive && !isLogout ? "bg-[#F4EBFF]" : "hover:bg-[#FAFAFA]"
      )}
      title={!showLabels ? title : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" style={{ color }} />
      {showLabels && (
        <span
          className="text-[14px] font-medium leading-normal"
          style={{ color }}
        >
          {title}
        </span>
      )}
    </button>
  );
}

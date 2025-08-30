"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import DashboardCard from "@/components/dashboard/dashboard-cards";
import DashboardRecentActivity from "@/components/dashboard/dashboard-recent-activity";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Card = {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  linkText: string;
};

type Metric = {
  icon: string;
  label: string;
  value: string | number;
  alt: string;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState<Card[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        /** ========= Top Cards ========= */
        // Dealers count
        const { count: dealerCount } = await supabaseBrowser
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "dealer");

        // Total revenue (sum of payments.amount)
        const { data: payments } = await supabaseBrowser
          .from("payments")
          .select("amount");

        const totalRevenue =
          payments?.reduce((sum: number, p: any) => sum + (p?.amount ?? 0), 0) || 0;

        // Format as USD
        const formattedRevenue = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
        }).format(totalRevenue);

        // Reports count (all-time)
        const { count: reportsCount } = await supabaseBrowser
          .from("carfax_reports")
          .select("*", { count: "exact", head: true });

        setCardData([
          {
            icon: (
              <Image
                src="/table-car.svg"
                alt="Total Car Reports Generated"
                width={24}
                height={24}
              />
            ),
            title: "Total Car Reports Generated",
            value: reportsCount || 0,
            linkText: "View Details",
          },
          {
            icon: (
              <Image src="/dealer.svg" alt="Total Dealer" width={24} height={24} />
            ),
            title: "Total Dealer",
            value: dealerCount || 0,
            linkText: "View Details",
          },
          {
            icon: (
              <Image
                src="/money-bag.svg"
                alt="Total Revenue"
                width={24}
                height={24}
              />
            ),
            title: "Total Revenue",
            value: formattedRevenue,
            linkText: "View Details",
          },
        ]);

        /** ========= Daily Metrics ========= */
        // Reports generated today
        const { count: reportsToday } = await supabaseBrowser
          .from("carfax_reports")
          .select("*", { count: "exact", head: true })
          .gte("created_at", new Date().toISOString().split("T")[0]); // since start of today

        // New dealers today
        const { count: dealersToday } = await supabaseBrowser
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "dealer")
          .gte("created_at", new Date().toISOString().split("T")[0]);

        // Revenue today
        const { data: todayPayments } = await supabaseBrowser
          .from("payments")
          .select("amount, created_at")
          .gte("created_at", new Date().toISOString().split("T")[0]);

        const revenueToday =
          todayPayments?.reduce((sum: number, p: any) => sum + (p?.amount ?? 0), 0) || 0;

        const formattedRevenueToday = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(revenueToday);

        setMetrics([
          {
            icon: "/refresh_DKM.svg",
            label: "Reports Generated Today",
            value: reportsToday || 0,
            alt: "Reports generated",
          },
          {
            icon: "/dealers_DKM.svg",
            label: "New Dealers Today",
            value: dealersToday || 0,
            alt: "New dealers",
          },
          {
            icon: "/money_DKM.svg",
            label: "Revenue Today",
            value: formattedRevenueToday,
            alt: "Revenue",
          },
        ]);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="flex flex-col gap-5">
      <p className="font-fredoka font-semibold text-[24px] text-[#1C1C1C]">
        Welcome, Dealer Name
      </p>

      {/* Top Cards */}
      <div className="flex gap-5 flex-wrap">
        {cardData.map((card, index) => (
          <DashboardCard
            key={index}
            icon={card.icon}
            title={card.title}
            value={card.value}
            linkText={card.linkText}
          />
        ))}
      </div>

      {/* Daily Metrics */}
      <DashboardRecentActivity metrics={metrics} />
    </div>
  );
}

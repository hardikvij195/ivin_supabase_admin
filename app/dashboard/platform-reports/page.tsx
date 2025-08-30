"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import DashboardCard from "@/components/dashboard/dashboard-cards";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Users, FileText, DollarSign, MessageSquare, User as UserIcon } from "lucide-react";

type BusinessStats = {
  dealers_count: number;
  reports_count: number;
  revenue_total: number;
  conversations_count: number;
  top_dealers: { user_id: string; reports: number }[];
  revenue_trend: { date: string; total: number }[];
  reports_trend: { date: string; count: number }[];
  dealer_growth: { date: string; count: number }[];
};

type DealerProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [dealerProfiles, setDealerProfiles] = useState<Record<string, DealerProfile>>({});

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data, error } = await supabaseBrowser
        .from("business_stats")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setStats(data);

        // Fetch dealer profiles for top dealers
        if (data.top_dealers?.length > 0) {
          const userIds = data.top_dealers.map((d: any) => d.user_id);
          const { data: profiles } = await supabaseBrowser
            .from("profiles")
            .select("id, full_name, email, avatar_url")
            .in("id", userIds);

          if (profiles) {
            const map: Record<string, DealerProfile> = {};
            profiles.forEach((p) => (map[p.id] = p));
            setDealerProfiles(map);
          }
        }
      }

      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading || !stats) return <DashboardSkeleton />;

  const topDealer = stats.top_dealers?.[0];
  const topDealerProfile = topDealer ? dealerProfiles[topDealer.user_id] : null;

  return (
    <div className="h-screen overflow-y-auto flex flex-col gap-3">
      <h1 className="font-fredoka text-2xl font-semibold text-[#1C1C1C]">
        Business Reports & Analytics
      </h1>

      {/* Summary Cards */}
      <div className="flex flex-wrap gap-5">
        <DashboardCard
          icon={<Users className="w-6 h-6 text-purple-700" />}
          title="Total Dealers"
          value={stats.dealers_count}
          linkText=""
        />
        <DashboardCard
          icon={<FileText className="w-6 h-6 text-purple-700" />}
          title="Total Reports"
          value={stats.reports_count}
          linkText=""
        />
        <DashboardCard
          icon={<DollarSign className="w-6 h-6 text-purple-700" />}
          title="Total Revenue"
          value={`$${stats.revenue_total.toLocaleString()}`}
          linkText=""
        />
        <DashboardCard
          icon={<MessageSquare className="w-6 h-6 text-purple-700" />}
          title="Conversations"
          value={stats.conversations_count}
          linkText=""
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Revenue Trend (7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.revenue_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#6b21a8" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Reports Trend */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Reports Generated (7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.reports_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#9333ea" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dealer Growth */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Dealer Growth (7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.dealer_growth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563eb" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

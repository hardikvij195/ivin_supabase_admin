// app/dashboard/user-management/[id]/edit/page.tsx
"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import EditUserForm from "./EditUserForm";

type Profile = {
  id: string;
  created_at: string;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
  full_name: string | null;
  status: string | null;
  email: string;        // not null in your schema
  phone: string | null;
};

export default function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>; // ← params is a Promise in client components
}) {
  const { id } = use(params);       // ← unwrap with React.use()
  const router = useRouter();

  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErrMsg(null);

        const { data, error } = await supabaseBrowser
          .from("profiles")
          .select(
            "id, created_at, username, avatar_url, role, full_name, status, email, phone"
          )
          .eq("id", id)
          .single();

        if (!alive) return;

        if (error || !data) {
          setErrMsg(error?.message || "User not found");
          setUser(null);
        } else {
          setUser(data as Profile);
        }
      } catch (e: any) {
        if (!alive) return;
        setErrMsg(e?.message || "Failed to load user");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="mx-auto py-2">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard/user-management">
          <ArrowLeft
            size={20}
            className="text-gray-500 hover:text-blue-600 cursor-pointer"
          />
        </Link>
        <span className="text-gray-700 font-medium">Back to Users</span>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {!loading && errMsg && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {errMsg}
          <div className="mt-3">
            <button
              onClick={() => router.push("/dashboard/user-management")}
              className="px-4 py-2 rounded bg-gray-800 text-white"
            >
              Go back
            </button>
          </div>
        </div>
      )}

      {!loading && user && <EditUserForm user={user} />}
    </div>
  );
}

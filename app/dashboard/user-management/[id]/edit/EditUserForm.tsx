"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type Profile = {
  id: string;
  created_at: string;
  username: string | null;
  avatar_url: string | null;
  role: string | null;       // 'dealer' | 'superadmin' | etc.
  full_name: string | null;
  status: string | null;     // e.g. 'active' | 'inactive'
  email: string;             // unique, not null in your schema
  phone: string | null;
};

export default function EditUserForm({ user }: { user: Profile }) {
  const router = useRouter();

  // Work only with columns that exist in your `profiles` schema
  const [formData, setFormData] = useState<Profile>({ ...user });
  const [loading, setLoading] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  // Check current logged-in user's role (from profiles)
  useEffect(() => {
    (async () => {
      const {
        data: { session },
        error: sessionErr,
      } = await supabaseBrowser.auth.getSession();

      if (session && !sessionErr) {
        const { data: me } = await supabaseBrowser
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        setIsSuperadmin(me?.role === "superadmin");
      }
    })();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // (Optional) treat status like a switch: active/inactive
  const toggleActive = () => {
    setFormData((prev) => ({
      ...prev,
      status: prev.status === "active" ? "inactive" : "active",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Only update columns that exist on `profiles`
    const payload: Partial<Profile> = {
      full_name: formData.full_name ?? null,
      email: formData.email,           // required/unique
      phone: formData.phone ?? null,
      status: formData.status ?? null,
      role: formData.role ?? null,
      username: formData.username ?? null,
      avatar_url: formData.avatar_url ?? null,
    };

    const { error } = await supabaseBrowser
      .from("profiles")
      .update(payload)
      .eq("id", user.id);

    setLoading(false);

    if (!error) {
      router.push("/dashboard/users");
      router.refresh();
    } else {
      alert("Error updating user: " + error.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border"
    >
      {/* Full name */}
      <Field label="Full Name">
        <Input
          name="full_name"
          value={formData.full_name ?? ""}
          onChange={handleChange}
          className="mt-1"
        />
      </Field>

      {/* Email */}
      <Field label="Email">
        <Input
          type="email"
          name="email"
          value={formData.email ?? ""}
          onChange={handleChange}
          className="mt-1"
        />
      </Field>

      {/* Phone */}
      <Field label="Phone">
        <Input
          name="phone"
          value={formData.phone ?? ""}
          onChange={handleChange}
          className="mt-1"
        />
      </Field>

      {/* Role (only superadmin should change role) */}
      <Field label="Role">
        <select
          name="role"
          value={formData.role ?? "dealer"}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md p-2 border border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm disabled:opacity-60"
          disabled={!isSuperadmin}
        >
          <option value="dealer">Dealer</option>
          <option value="superadmin">Superadmin</option>
        </select>
      </Field>

      {/* Status */}
      <Field label="Status">
        <select
          name="status"
          value={formData.status ?? ""}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md p-2 border border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
        >
          <option value="">Select Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </Field>

      {/* Username (optional) */}
      <Field label="Username">
        <Input
          name="username"
          value={formData.username ?? ""}
          onChange={handleChange}
          className="mt-1"
        />
      </Field>

      {/* Avatar URL (optional) */}
      <Field label="Avatar URL">
        <Input
          name="avatar_url"
          value={formData.avatar_url ?? ""}
          onChange={handleChange}
          className="mt-1"
        />
      </Field>

      {/* Active switch (maps to status) */}
      <div className="flex items-center gap-3 col-span-1 md:col-span-2">
        <Switch
          checked={(formData.status ?? "") === "active"}
          onCheckedChange={toggleActive}
        />
        <span className="text-sm font-medium text-gray-700">
          {(formData.status ?? "") === "active" ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Actions */}
      <div className="col-span-1 md:col-span-2 flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-48 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update User"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { User } from "lucide-react";

type ProfileData = {
  full_name?: string | null;
  avatar_url?: string | null;
};

export default function Navbar() {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    // ✅ Fetch profile data from localStorage
    const name = localStorage.getItem("user_name");
    const avatar = localStorage.getItem("user_avatar");

    setProfile({
      full_name: name || "User",
      avatar_url: avatar || null,
    });
  }, []);

  return (
    <div className="bg-primary z-9999 text-white">
      <div className="layout h-20 px-4 sm:px-20 flex items-center gap-20">
        {/* Logo */}
        <Image width={116} height={48} alt="ivin logo" src="/ivin-logo.svg" />

        {/* Navbar Links */}
        <nav className="w-full flex gap-6">
          {/* Profile section */}
          <div className="ml-auto flex items-center gap-3">
            {/* Avatar */}
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile Picture"
                width={36}
                height={36}
                className="rounded-full border border-white object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="text-gray-600 w-5 h-5" />
              </div>
            )}

            {/* Name */}
            <span className="font-medium">{profile?.full_name || "User"}</span>
          </div>
        </nav>
      </div>
    </div>
  );
}

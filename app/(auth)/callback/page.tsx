"use client";

import { Loader } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { verifyUser } from "@/store/features/admin/adminSlice";
import { useAppDispatch } from "@/store/hooks";

const AuthCallbackPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        router.replace("/sign-in");
        return;
      }

      // Verify user via Redux action
      const result = await dispatch(verifyUser(token));

      if (verifyUser.fulfilled.match(result)) {
        // ✅ fetch profile data after successful login
        const { data: userRes } = await supabaseBrowser.auth.getUser();
        const userId = userRes?.user?.id;

        if (userId) {
          const { data: profile } = await supabaseBrowser
            .from("profiles")
            .select("role, full_name, avatar_url")
            .eq("id", userId)
            .single();

          if (profile) {
            // ✅ save to localStorage
            localStorage.setItem("user_role", profile.role || "");
            localStorage.setItem("user_name", profile.full_name || "User");
            localStorage.setItem("user_avatar", profile.avatar_url || "");
          }
        }

        router.replace("/dashboard");
      } else {
        router.replace("/sign-in");
      }
    })();
  }, [dispatch, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader className="h-10 w-10 animate-spin text-purple-600" />
        <h3 className="text-xl font-bold">Authenticating...</h3>
        <p>Please wait while we verify your credentials</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;

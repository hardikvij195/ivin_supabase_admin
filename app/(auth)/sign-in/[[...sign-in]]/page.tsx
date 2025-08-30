// app/sign-in/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Eye, EyeOff } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Step 1: Supabase sign-in
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        throw new Error(error?.message || "Invalid credentials");
      }

      const userId = data.user.id;

      // Step 2: Fetch role from profile table
      const { data: profile, error: profileError } = await supabaseBrowser
        .from("profiles") // 👈 replace with your actual table name if different
        .select("role")
        .eq("id", userId)
        .single();

      if (profileError) {
        throw new Error("Failed to fetch user profile");
      }

      // Step 3: Check if role is superadmin
      if (profile?.role !== "superadmin") {
        // Sign out immediately
        await supabaseBrowser.auth.signOut();
        throw new Error("You don't have access to login to this account.");
      }

      // ✅ User is superadmin, proceed
      toast.success("Signed in successfully!");
      router.push("/callback");

    } catch (err: any) {
      toast.error(err?.message || "Sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full h-screen flex justify-center items-center bg-[linear-gradient(180deg,_#D8ACFF_0%,_#ECD7FF_48.08%,_#D8ACFF_100%)]">
      <Toaster />
      <div className="px-6 py-10 rounded-[16px] w-full max-w-140 bg-white flex flex-col">
        {/* Header */}
        <div className="w-full flex flex-col justify-center items-center mb-8">
          <img
            src="/ivin-logo-login.svg"
            alt="ivin logo"
            className="mb-5 w-[200px] h-[50px]"
          />
          <p className="font-fredoka font-medium text-[20px]">
            Sign in to your account
          </p>
          <p className="font-fredoka font-medium text-[14px] text-[#4D4D4D]">
            Enter your details to proceed further
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} className="flex flex-col gap-6">
          {/* Email */}
          <div className="w-full">
            <p className="mb-2 text-[14px] px-2 font-semibold">Email</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#FAFAFA] px-4 py-2 border border-[#E4E4E4] rounded-full w-full focus:outline-primary"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password */}
          <div className="w-full">
            <p className="mb-2 text-[14px] px-2 font-semibold">Password</p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#FAFAFA] px-4 py-2 border border-[#E4E4E4] rounded-full w-full pr-12 focus:outline-primary"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot Password */}
          <div className="flex justify-between items-center">
            <div className="flex gap-[12px] cursor-pointer">
              <input
                className="accent-primary outline-none"
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember" className="text-[16px] cursor-pointer">
                Remember me
              </label>
            </div>
            <p
              onClick={() => router.push("/reset-password")}
              className="text-primary text-[16px] font-semibold cursor-pointer"
            >
              Forgot Password?
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`px-10 py-2 font-fredoka bg-[#5E189D] hover:bg-[#4a1387] text-white font-semibold rounded-full w-full whitespace-nowrap ${
              isLoading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
            }`}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

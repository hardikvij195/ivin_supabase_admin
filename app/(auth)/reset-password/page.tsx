"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Eye, EyeOff } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabaseBrowser.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      toast.success("Password updated successfully!");
      router.push("/sign-in");
    } catch (err: any) {
      toast.error(err?.message || "Failed to reset password.");
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
          <img src="/ivin-logo-login.svg" alt="ivin logo" className="mb-5 w-[200px] h-[50px]" />
          <p className="font-fredoka font-medium text-[24px]">Create New Password</p>
          <p className="font-fredoka font-medium text-[16px] text-[#4D4D4D]">
            Your new password must be different from previous passwords
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleResetPassword} className="flex flex-col gap-6">
          {/* New password */}
          <div className="w-full">
            <p className="mb-2 text-primary font-semibold">New Password</p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-[#FAFAFA] px-8 py-4 border border-[#E4E4E4] rounded-full w-full pr-12 focus:outline-primary"
                placeholder="Enter new password"
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
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters with letters and numbers</p>
          </div>

          {/* Confirm password */}
          <div className="w-full">
            <p className="mb-2 text-primary font-semibold">Confirm New Password</p>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#FAFAFA] px-8 py-4 border border-[#E4E4E4] rounded-full w-full pr-12 focus:outline-primary"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className={`px-10 py-4 font-fredoka bg-primary text-white font-semibold rounded-full w-full whitespace-nowrap ${
              isLoading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
            }`}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>

          {/* Back link */}
          <div className="w-full flex items-center gap-3 justify-center cursor-pointer pt-2">
            <img src="/left-arrow.svg" alt="back" className="w-[20px] h-[20px]" />
            <button
              type="button"
              onClick={() => router.push("/sign-in")}
              className="font-fredoka text-primary text-[18px] font-semibold"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

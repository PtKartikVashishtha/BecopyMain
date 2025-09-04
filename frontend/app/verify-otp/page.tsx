"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/header";
import { authService } from "@/lib/services/authService";
import { useAppDispatch } from "@/store/hooks";
import applyJob from "../../utils/applyJob";
import addCode from "@/utils/addCode";
import { submitContributions } from "@/utils/submitContributions";
import useQueryParams from "@/hooks/useQueryParams";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const userId = searchParams.get("userId");
  const email = searchParams.get("email");
  
  const { fromApplyJob, fromAddCode, fromAddContribution } = useQueryParams() as {
    fromApplyJob?: string;
    fromAddCode?: string;
    fromAddContribution?: string;
  };

  useEffect(() => {
    if (!userId || !email) {
      router.push("/login");
    }
  }, [userId, email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || otpCode.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await authService.verifyOTP({
        userId,
        otpCode,
      });

      if (data.success) {
        // Handle post-login actions
        if (fromApplyJob === "true") await applyJob(data.user.id);
        if (fromAddCode === "true") await addCode(data.user.id);
        if (fromAddContribution === "true") {
          await submitContributions(data.user.email, dispatch);
        }

        // Store auth data
        localStorage.setItem("token", data.token);
        localStorage.setItem("userData", JSON.stringify(data.user));
        localStorage.setItem("userType", data.user.role);
        
        // Redirect to home
        window.location.href = "/";
      }
    } catch (error: any) {
      setError(error.error || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  if (!userId || !email) {
    return null;
  }

  return (
    <>
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card className="flex flex-col gap-6">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-[#0284DA]">
                Verify OTP
              </CardTitle>
              <p className="text-center text-gray-600">
                We've sent a 6-digit code to {email}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(value);
                    }}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                    required
                  />
                </div>
                
                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}
                
                <Button
                  type="submit"
                  className="w-full bg-[#0284DA] hover:bg-[#0284DA]/90"
                  disabled={loading || otpCode.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
                
                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => router.push("/login")}
                    className="text-[#0284DA]"
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
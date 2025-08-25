"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useQueryParams from "@/hooks/useQueryParams";
import { authService } from "@/lib/services/authService";

import Header from "@/components/layout/header";
import Sidebar from "../layout/sidebar";
import { useMediaQuery } from "react-responsive";
import { Program } from "@/types";

type ResetMode = "sendEmail" | "verify" | "linkSent";

export default function VerifyEmail() {
  const [mode, setMode] = useState<ResetMode>("sendEmail");
  const [formData, setFormData] = useState({
    email: "",
    code: 0,
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const { token, email } = useQueryParams();

  useEffect(() => {
    const verifyEmailToken = async () => {
      if (token) {
        setIsRedirecting(true);
      }
      if (!token || !email) return;

      try {
        const data = await authService.verifyEmail({ email, token });
        if (data?.data?.isEmailVerified) {
          router.push("/userauth");
        }
      } catch (error) {
        console.error("Email verification failed:", error);
        setError("Email verification failed. Please try again.");
      } finally {
        setIsRedirecting(false);
      }
    };

    verifyEmailToken();
  }, [token, email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      if (mode === "sendEmail") {
        if (!email) {
          setError("Email address is required");
          setLoading(false);
          return;
        }
        
        console.log("Attempting to send verification email to:", email);
        const data = await authService.sendVerificationEmail({ email });
        console.log("Response from sendVerificationEmail:", data);
        
        if (data && data.success !== false) {
          setMode("linkSent");
        } else {
          setError(data?.message || "Failed to send verification email");
        }
      }
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      setError(error?.message || error?.response?.data?.message || "Failed to send verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const isMobile = useMediaQuery({ maxWidth: 768 });
  
  const onSelectProgram = (program: Program) => {
    window.location.assign(`/?programId=${program._id}`);
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
        <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-green-600 text-lg font-medium">Verifying your email...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait while we redirect you</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {isMobile && (
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          onSelectProgram={onSelectProgram}
          onCloseSidebar={() => setIsSidebarOpen(false)}
          expandedCategories={[]}
          toggleCategory={() => {}}
          onShowJobPosting={() => {}}
          onShowApplyJob={() => {}}
        />
      )}

      {/* Main Content Container */}
      <div className="flex-1 flex items-center justify-center pt-16 pb-8 px-4">
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl sm:text-2xl text-center text-[#0284DA] font-bold">
                Verify Your Email
              </CardTitle>
              <div className="text-center mt-2">
                <p className="text-gray-600 text-sm">
                  {email ? `We need to verify ${email}` : "Please verify your email address"}
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                {mode === "linkSent" ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="text-green-600 text-sm bg-green-50 p-4 rounded-md border border-green-200">
                      <p className="font-medium mb-2">Verification Link Sent!</p>
                      <p>We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>Didn't receive the email? Check your spam folder or try again.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 3.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        Click the button below to send a verification link to your email address.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-[#0284DA] hover:bg-[#0284FF] text-white font-medium text-sm"
                      disabled={loading || !email}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </div>
                      ) : (
                        "Send Verification Link"
                      )}
                    </Button>

                    {!email && (
                      <div className="text-amber-600 text-xs text-center bg-amber-50 p-2 rounded border border-amber-200">
                        Email address is required to send verification link
                      </div>
                    )}
                  </div>
                )}
              </form>
            </CardContent>
            
            <CardFooter className="flex justify-center pt-2 pb-4">
              <Button
                type="button"
                variant="link"
                onClick={() => router.push("/userauth")}
                className="text-blue-500 hover:text-blue-600 text-sm p-0 h-auto"
              >
                Back to Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
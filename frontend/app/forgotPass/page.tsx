"use client";

import { useState, useEffect } from "react";
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

import { authService } from "@/lib/services/authService";

import Header from "@/components/layout/header";

type resetMode = "sendCode" | "matchCode" | "changePass" | "done";

export default function ForgotPass() {
  // 1. Added mounting state for hydration fix
  const [isMounted, setIsMounted] = useState(false);
  
  const [mode, setMode] = useState<resetMode>("sendCode");
  const [codeResent, setCodeResent] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    email: "",
    code: 0,
    password: "",
    confirmPassword: "",
  });
  const router = useRouter(); // 2. Removed 'let' declaration
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 3. Added useEffect for mounting state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 4. Added early return to prevent hydration mismatch
  if (!isMounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "done") {
        router.push("/login");
        return; // 5. Added return for early exit
      }

      if (mode === "sendCode") {
        await authService.sendResetCode({ email: formData.email });
        setMode("matchCode");
        return; // 6. Added return for early exit
      }

      if (mode === "matchCode") {
        const res = await authService.matchCode({ // 7. Changed 'let' to 'const'
          code: formData.code,
          email: formData.email,
        });
        console.log("response", res); // 8. Fixed typo
        if (res.status === 200) {
          setError("");
          setMode("changePass");
          return;
        }
      }

      if (mode === "changePass") {
        await authService.changePass({
          email: formData.email,
          code: formData.code,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });
        setMode("done");
      }
    } catch (error: any) { // 9. Simplified error typing
      setError(error?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async (e: React.FormEvent) => { // 10. Removed 'let' declaration
    e.preventDefault();
    try {
      await authService.sendResetCode({ email: formData.email });
      setCodeResent(true);
    } catch (error: any) {
      setError(error?.message || "Failed to resend code");
    }
  };

  return (
    <>
      <Header isSidebarOpen={false} toggleSidebar={() => {}} />
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card className="flex flex-col gap-6">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-[#0284DA]">
                Reset Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "done" ? (
                  <>
                    <p>Congratulations, Password Changed Successfully</p>
                    <Button
                      type="submit"
                      className="w-full mt-2 bg-[#0284DA] hover:bg-[#0284FF] text-white" // 11. Removed duplicate w-full
                      disabled={loading}
                    >
                      {loading ? "Loading..." : "Log In Now"} {/* 12. Fixed text */}
                    </Button>
                  </>
                ) : (
                  <>
                    {mode === "sendCode" && (
                      <Input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            email: e.target.value,
                          })
                        }
                        required
                        className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                      />
                    )}

                    {mode === "matchCode" && (
                      <>
                        <Input
                          type="number"
                          placeholder="Code"
                          value={formData.code}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              code: parseInt(e.target.value) || 0, // 13. Added fallback for NaN
                            })
                          }
                          required
                          className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                        />

                        {!codeResent ? (
                          <Button type="button" onClick={handleResendCode}> {/* 14. Added type="button" */}
                            Resend Code
                          </Button>
                        ) : (
                          <p className="text-green-500 text-sm text-center">
                            {"We've"} resent the verification code {/* 15. Fixed capitalization */}
                          </p>
                        )}
                      </>
                    )}

                    {mode === "changePass" && (
                      <>
                        <Input
                          type="password"
                          placeholder="Password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          required
                          className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                        />
                        <Input
                          type="password"
                          placeholder="Confirm Password"
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              confirmPassword: e.target.value,
                            })
                          }
                          required
                          className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                        />
                      </>
                    )}

                    {error && (
                      <div className="text-red-500 text-sm text-center">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full mt-2 bg-[#0284DA] hover:bg-[#0284FF] text-white" // 16. Removed duplicate w-full
                      disabled={loading}
                    >
                      {loading ? (
                        "Loading..."
                      ) : (
                        <>
                          {mode === "sendCode" && "Send Code"}
                          {mode === "matchCode" && "Verify"}
                          {mode === "changePass" && "Change Password"}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </form>
            </CardContent>
            <CardFooter className="flex justify-center"></CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
"use client";

import { useState } from "react";
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
  const [mode, setMode] = useState<resetMode>("sendCode");
  const [codeResent, setCodeResent] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    email: "",
    code: 0,
    password: "",
    confirmPassword: "",
  });
  let router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "done") {
        router.push("/login");
      }

      if (mode === "sendCode") {
        await authService.sendResetCode({ email: formData.email });
        setMode("matchCode");
      }

      if (mode === "matchCode") {
        let res = await authService.matchCode({
          code: formData.code,
          email: formData.email,
        });
        console.log("resonse", res);
        if (res.status === 200) {
          setError("");
          return setMode("changePass");
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
    } catch (error: object | any) {
      setError(error?.message);
    } finally {
      setLoading(false);
    }
  };

  let handleResendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    await authService.sendResetCode({ email: formData.email });
    setCodeResent(true);
  };

  return (
    <>
      <Header isSidebarOpen={false} toggleSidebar={() => { }} />
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
                      className="w-full w-full mt-2 bg-[#0284DA] hover:bg-[#0284FF] text-white"
                      disabled={loading}
                    >
                      {loading ? "Loading..." : "Login In Now"}
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
                              code: parseInt(e.target.value),
                            })
                          }
                          required
                          className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                        />

                        {!codeResent ? (
                          <Button onClick={handleResendCode}>
                            Resend Code
                          </Button>
                        ) : (
                          <p className="text-green-500 text-sm text-center">
                            {"We've"} Resend the verification code
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
                      className="w-full w-full mt-2 bg-[#0284DA] hover:bg-[#0284FF] text-white"
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

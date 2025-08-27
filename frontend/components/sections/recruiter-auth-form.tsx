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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/header";
import { authService } from "@/lib/services/authService";
import applyJob from "../../utils/applyJob";
import useQueryParams from "@/hooks/useQueryParams";
import addPost from "@/utils/addCode";
import { useAppDispatch } from "@/store/hooks";
import { newjob } from "@/store/reducers/jobSlice";
import { toast } from "@/hooks/use-toast";
import Sidebar from "../layout/sidebar";
import { useMediaQuery } from "react-responsive";
import { Program } from "@/types";

type AuthMode = "login" | "register";
type UserType = "user" | "recruiter";
type Country = "UK" | "CA" | "US" | "AU" | "Europe";

interface FormData {
  name: string;
  email: string;
  profileLink: string;
  country: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  companyWebsite: string;
  phoneNumber: string;
  description: string;
}

function validateLinkedInUrl(url: string): boolean {
  const regex =
    /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-_]+\/?(?:\?.*)?$/;
  return regex.test(url);
}

export default function RecruiterAuthForm() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const [mode, setMode] = useState<AuthMode>("login");
  const [userType, setUserType] = useState<UserType>("recruiter");
  const [country, setCountry] = useState<Country>("UK");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    profileLink: "",
    country: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyWebsite: "",
    phoneNumber: "",
    description: "",
  });

  const [error, setError] = useState<string>("");
  const [validLinked, setValidLinkedin] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [redirecting, setRedirecting] = useState(false);

  const { fromPostJob } = useQueryParams() as { fromPostJob?: string };

  // Fix hydration mismatch
  const rawIsMobile = useMediaQuery({ maxWidth: 768 });
  const isMobile = isMounted && rawIsMobile;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!isMounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        let isValidLinkedin = validateLinkedInUrl(formData.profileLink);
        if (!isValidLinkedin) return setValidLinkedin(isValidLinkedin);
        const { data, user, success } = await authService.register({
          ...formData,
          userType,
          country,
        });

        if (success) {
          if (fromPostJob === "true") {
            let postJobDataString = localStorage.getItem("postJobData");
            let postJobData = postJobDataString
              ? JSON.parse(postJobDataString)
              : {};
            postJobData.recruiter = data.id;

            let jobPostRes = await dispatch(newjob(postJobData));

            if (jobPostRes.payload.data.status) {
              setRedirecting(true);
              toast({
                title: "Successfully added the job!",
                variant: "success",
              });
              localStorage.removeItem("postJobData");
            } else {
              toast({
                title: "Failed to post the job!",
                variant: "success",
              });
            }

            localStorage.removeItem("postJobData");

            if (user?.isEmailVerified !== true) {
              setRedirecting(true);

              setTimeout(() => {
                return router.push(`/verifyEmail?email=${user.email}`);
              }, 3000);
            } else {
              return router.push("/login");
            }
          } else {
            if (user?.isEmailVerified !== true) {
              return router.push(`/verifyEmail?email=${user.email}`);
            } else {
              return router.push("/login");
            }
          }
        }
      } else {
        const data = await authService.login({
          ...formData,
          userType,
        });

        if (data.success) {
          if (data.token) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("userData", JSON.stringify(data.user));
            localStorage.setItem("userType", userType);
          }

          if (fromPostJob === "true") {
            let postJobDataString = localStorage.getItem("postJobData");
            let postJobData = postJobDataString
              ? JSON.parse(postJobDataString)
              : {};
            postJobData.recruiter = data?.user?.id;

            let jobPostRes = await dispatch(newjob(postJobData));

            if (jobPostRes.payload.status) {
              setRedirecting(true);

              toast({
                title: "Successfully added the job!",
                variant: "success",
              });
              localStorage.removeItem("postJobData");
            } else {
              toast({
                title: "Failed to post the job!",
                variant: "success",
              });
            }

            setTimeout(() => {
              if (data?.user?.isEmailVerified !== true) {
                return router.push(`/verifyEmail?email=${data?.user.email}`);
              } else {
                if (data.token) {
                  return (window.location.href = "/");
                }
              }
            }, 3000);
          } else {
            if (data?.user?.isEmailVerified !== true) {
              return router.push(`/verifyEmail?email=${data?.user.email}`);
            } else {
              if (data.token) {
                return (window.location.href = "/");
              }
            }
          }
        }
      }
    } catch (error: any) {
      setError(
        error.error ||
          error.message ||
          error.data.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const gotoResetPass = () => {
    router.push("/forgotPass");
  };

  const changeProfileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, profileLink: val });
    setValidLinkedin(validateLinkedInUrl(val));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <p className="text-green-600 text-center text-lg">Redirecting...</p>
      </div>
    );
  }

  let onSelectProgram = (program: Program) => {
    window.location.assign(`/?programId=${program._id}`);
  };

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
      <div className="flex-1 flex items-center justify-center pt-12 pb-4 px-4 overflow-hidden">
        <div className="w-full max-w-sm mx-auto h-full flex flex-col">
          <Card className="shadow-lg border-0 bg-white flex-1 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <CardHeader className="pb-2 px-4">
              <CardTitle className="text-lg sm:text-xl text-center text-[#0284DA] font-bold">
                {mode === "login" ? "Login" : "Register"}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="px-4 flex-1">
              <form onSubmit={handleSubmit} className={mode === "login" ? "space-y-4" : "space-y-2"}>
                {mode === "register" && (
                  <Input
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 h-9 text-sm"
                  />
                )}

                <Input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className={`ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 ${mode === "login" ? "h-10 text-sm" : "h-9 text-sm"}`}
                />

                <Input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className={`ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 ${mode === "login" ? "h-10 text-sm" : "h-9 text-sm"}`}
                />

                {mode === "login" && (
                  <div className="flex justify-start">
                    <Button
                      type="button"
                      variant="link"
                      onClick={gotoResetPass}
                      className="text-blue-500 hover:text-blue-600 p-0 h-auto text-sm"
                    >
                      Forgot Password?
                    </Button>
                  </div>
                )}

                {mode === "register" && (
                  <>
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
                      className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 h-9 text-sm"
                    />
                    
                    <Select
                      value={country}
                      onValueChange={(
                        value: "UK" | "CA" | "US" | "AU" | "Europe"
                      ) => setCountry(value)}
                    >
                      <SelectTrigger className="focus:outline-none focus:ring-0 focus:ring-offset-0 h-9 text-sm">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0">
                        <SelectItem value="UK">UK</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="US">USA</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="Europe">Europe</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      type="url"
                      placeholder="LinkedIn Profile URL"
                      value={formData.profileLink}
                      onChange={changeProfileInput}
                      required
                      className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 h-9 text-sm"
                    />

                    {!validLinked && (
                      <div className="text-red-500 text-xs text-center bg-red-50 p-2 rounded">
                        Please enter a valid LinkedIn URL
                      </div>
                    )}

                    {userType === "recruiter" && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Company Name"
                          value={formData.companyName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              companyName: e.target.value,
                            })
                          }
                          required
                          className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 h-9 text-sm"
                        />
                        
                        <Input
                          type="tel"
                          placeholder="Phone Number"
                          value={formData.phoneNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              phoneNumber: e.target.value,
                            })
                          }
                          required
                          className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 h-9 text-sm"
                        />
                        
                        <Input
                          type="url"
                          placeholder="Company Website"
                          value={formData.companyWebsite}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              companyWebsite: e.target.value,
                            })
                          }
                          required
                          className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 h-9 text-sm"
                        />
                        
                        <Input
                          placeholder="Company Description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          required
                          className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 h-9 text-sm"
                        />
                      </div>
                    )}
                  </>
                )}

                {error && (
                  <div className="text-red-500 text-xs text-center bg-red-50 p-2 rounded">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className={`w-full bg-[#0284DA] hover:bg-[#0284FF] text-white font-medium ${mode === "login" ? "h-10 text-sm mt-4" : "h-9 text-sm mt-3"}`}
                  disabled={loading}
                >
                  {loading
                    ? "Processing..."
                    : mode === "login"
                    ? "Sign In"
                    : "Create Account"}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex justify-center pt-1 pb-2 px-4">
              <Button
                type="button"
                variant="link"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-blue-500 hover:text-blue-600 text-xs p-0 h-auto"
              >
                {mode === "login"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
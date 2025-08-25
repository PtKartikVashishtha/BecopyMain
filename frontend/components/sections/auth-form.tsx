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
import addCode from "@/utils/addCode";
import Link from "next/link";
import { submitContributions } from "@/utils/submitContributions";
import { useAppDispatch } from "@/store/hooks";
import { Eye, EyeOff } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";

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

export default function AuthForm(props: any) {
  const router = useRouter();

  let dispatch = useAppDispatch();

  const [mode, setMode] = useState<AuthMode>("login");
  const [userType, setUserType] = useState<UserType>(props.type);
  const [country, setCountry] = useState<Country>("UK");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

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

  const [error, setError] = useState<string | boolean>("");
  const [showPassword, setShowPassword] = useState(false);
  const [validLinked, setValidLinkedin] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const { fromApplyJob, fromAddCode, fromAddContribution } =
    useQueryParams() as {
      fromApplyJob?: string;
      fromAddCode?: string;
      fromAddContribution?: string;
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "register") {
        if (
          fromAddCode === "true" ||
          fromApplyJob === "true" ||
          fromAddContribution === "true"
        ) {
          setLoading(true);
        }

        let isValidLinkedin = validateLinkedInUrl(formData.profileLink);
        if (!isValidLinkedin) return setValidLinkedin(isValidLinkedin);

        const { data, user, success } = await authService.register({
          ...formData,
          userType,
          country,
        });

        if (success) {
          if (fromApplyJob === "true") {
            await applyJob(user._id);
          }
          if (fromAddCode === "true") {
            await addCode(user._id);
          }

          if (fromAddContribution === "true") {
            await submitContributions(user.email, dispatch);
          }

          if (
            fromAddCode == "true" ||
            fromApplyJob == "true" ||
            fromAddContribution === "true"
          ) {
            if (!user?.isEmailVerified) {
              setTimeout(() => {
                return router.push(`/verifyEmail?email=${user.email}`);
              }, 3000);
            }
          } else {
            return router.push(`/verifyEmail?email=${user.email}`);
          }
        }
      } else {
        const data = await authService.login({
          ...formData,
          userType,
        });
        if (
          fromAddCode === "true" ||
          fromApplyJob === "true" ||
          fromAddContribution === "true"
        ) {
          setLoading(true);
        }

        if (fromApplyJob === "true") {
          await applyJob(data.user.id);
        }
        if (fromAddCode === "true") {
          await addCode(data.user.id);
        }
        if (fromAddContribution === "true") {
          await submitContributions(data.user.email, dispatch);
        }

        if (data.user.isEmailVerified !== true) {
          setLoading(false);
          return router.push(`/verifyEmail?email=${data.user.email}`);
        }

        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("userData", JSON.stringify(data.user));
          localStorage.setItem("userType", userType);

          if (
            fromAddCode === "true" ||
            fromApplyJob === "true" ||
            fromAddContribution === "true"
          ) {
            setTimeout(() => {
              return (window.location.href = "/");
            }, 3000);
          }

          window.location.href = "/";
        }
      }
    } catch (error: any) {
      console.log("erro", error);
      setError(error.error || "Something went wrong");
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
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <>
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 xl:hidden"
          onClick={toggleSidebar}
        />
      )}

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={() => {
          setIsSidebarOpen(false);
        }}
      />

      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card className="flex flex-col gap-6">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-[#0284DA]">
                {mode === "login" ? "Login" : "Register"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* <Select
                value={userType}
                onValueChange={(value: "user" | "recruiter") => setUserType(value)}
              >
                <SelectTrigger className="focus:outline-none focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0">
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="recruiter">Recruiter</SelectItem>
                </SelectContent>
              </Select> */}

                {mode === "register" && (
                  <Input
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                  />
                )}

                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                />

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 pr-10" // Add padding-right for the icon
                  />

                  {/* Eye Icon */}
                  {mode === "login" && (
                    <div
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  )}
                </div>

                {mode === "login" && (
                  <Link
                    href="forgotPass"
                    className="text-blue-500 block hover:text-blue-600 mt-3 m-[10px]"
                  >
                    Forgot Password?
                  </Link>
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
                      className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                    />
                    <Select
                      value={country}
                      onValueChange={(
                        value: "UK" | "CA" | "US" | "AU" | "Europe"
                      ) => setCountry(value)}
                    >
                      <SelectTrigger className="focus:outline-none focus:ring-0 focus:ring-offset-0 w-full">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent className="ring-0 w-full focus-visible:ring-offset-0 focus-visible:ring-0">
                        <SelectItem value="UK">UK</SelectItem>
                        <SelectItem value="CA">CA</SelectItem>
                        <SelectItem value="US">US</SelectItem>
                        <SelectItem value="AU">AU</SelectItem>
                        <SelectItem value="Europe">Europe</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="text"
                      placeholder="Profile Link"
                      value={formData.profileLink}
                      onChange={changeProfileInput}
                      required
                      className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                    />

                    {userType === "recruiter" && (
                      <>
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
                          className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                        />
                        <Input
                          placeholder="Phone Number"
                          value={formData.phoneNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              phoneNumber: e.target.value,
                            })
                          }
                          required
                          className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                        />
                        <Input
                          placeholder="Company Website"
                          value={formData.companyWebsite}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              companyWebsite: e.target.value,
                            })
                          }
                          required
                          className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                        />
                        <Input
                          placeholder="Description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          required
                          className="ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                        />
                      </>
                    )}
                  </>
                )}

                {!validLinked && (
                  <div className="text-red-500 text-sm text-center">
                    Please enter a valid LinkedIn profile URL to proceed.
                  </div>
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
                  {loading
                    ? "Loading..."
                    : mode === "login"
                    ? "Login"
                    : "Register"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button
                variant="link"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-blue-500 hover:text-blue-600"
              >
                {mode === "login"
                  ? "Don't have an account? Register"
                  : "Already have an account? Login"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import {
  Card,
  CardContent,
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
import Header from "@/components/layout/header";
import { authService } from "@/lib/services/authService";
import applyJob from "../../utils/applyJob";
import useQueryParams from "@/hooks/useQueryParams";
import addCode from "@/utils/addCode";
import { submitContributions } from "@/utils/submitContributions";
import { useAppDispatch } from "@/store/hooks";
import Sidebar from "@/components/layout/sidebar";
import { useMediaQuery } from "react-responsive";
import { Program } from "@/types";

export const dynamic = "force-dynamic";

type UserType = "user" | "recruiter";
type Country = "UK" | "CA" | "US" | "AU" | "Europe";

export default function LoginPage(props: any) {
  // Mount state FIRST before any other hooks
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state immediately
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Early return BEFORE other hooks
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return <LoginPageContent {...props} />;
}

function LoginPageContent(props: any) {
  const router = useRouter();
  let dispatch = useAppDispatch();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [userType, setUserType] = useState<UserType>("user");
  const [country, setCountry] = useState<Country>("UK");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { fromApplyJob, fromAddCode, fromAddContribution } =
    useQueryParams() as {
      fromApplyJob?: string;
      fromAddCode?: string;
      fromAddContribution?: string;
    };

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const session = await getSession();
      if (session?.user) {
        // User is already logged in, redirect to home
        router.push("/");
      }
    };
    checkAuth();
  }, [router]);

  const handleOAuthSignIn = async (provider: 'google' | 'linkedin') => {
    if (!userType || !country) {
      setError("Please select user type and country first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Store user preferences in localStorage for callback
      localStorage.setItem('pendingUserType', userType);
      localStorage.setItem('pendingCountry', country);
      localStorage.setItem('pendingFromApplyJob', fromApplyJob || 'false');
      localStorage.setItem('pendingFromAddCode', fromAddCode || 'false');
      localStorage.setItem('pendingFromAddContribution', fromAddContribution || 'false');

      // Initiate OAuth sign in
      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: '/login'
      });

      if (result?.error) {
        setError('Authentication failed. Please try again.');
      } else {
        // Check session after sign in
        const session = await getSession();
        if (session?.user) {
          await handleOAuthCallback(session);
        }
      }
    } catch (error: any) {
      console.error('OAuth error:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthCallback = async (session: any) => {
    try {
      const pendingUserType = localStorage.getItem('pendingUserType') || 'user';
      const pendingCountry = localStorage.getItem('pendingCountry') || 'UK';
      const pendingFromApplyJob = localStorage.getItem('pendingFromApplyJob');
      const pendingFromAddCode = localStorage.getItem('pendingFromAddCode');
      const pendingFromAddContribution = localStorage.getItem('pendingFromAddContribution');

      // Clear pending data
      localStorage.removeItem('pendingUserType');
      localStorage.removeItem('pendingCountry');
      localStorage.removeItem('pendingFromApplyJob');
      localStorage.removeItem('pendingFromAddCode');
      localStorage.removeItem('pendingFromAddContribution');

      // Call backend OAuth endpoint
      const response = await authService.oauthAuth({
        email: session.user.email!,
        name: session.user.name!,
        provider: session.user.provider || 'google',
        providerId: session.user.providerAccountId || session.user.id,
        userType: pendingUserType as 'user' | 'recruiter',
        country: pendingCountry
      });

      if (response.success) {
        // Redirect to OTP verification with query params
        const queryParams = new URLSearchParams({
          userId: response.userId,
          email: response.email,
          ...(pendingFromApplyJob === 'true' && { fromApplyJob: 'true' }),
          ...(pendingFromAddCode === 'true' && { fromAddCode: 'true' }),
          ...(pendingFromAddContribution === 'true' && { fromAddContribution: 'true' })
        });
        
        router.push(`/verify-otp?${queryParams.toString()}`);
      }
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      setError(error.error || 'Authentication failed. Please try again.');
    }
  };

  // Check for OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const session = await getSession();
      if (session?.user && localStorage.getItem('pendingUserType')) {
        await handleOAuthCallback(session);
      }
    };
    handleCallback();
  }, []);



  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  let onSelectProgram = (program: Program) => {
    window.location.assign(`/?programId=${program._id}`);
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

      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card className="flex flex-col gap-6">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-[#0284DA]">
                Sign In with OAuth
              </CardTitle>
              <p className="text-center text-gray-600 text-sm mt-2">
                Choose your account type and country, then sign in with Google or LinkedIn
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">User Type</label>
                  <Select
                    value={userType}
                    onValueChange={(value: UserType) => setUserType(value)}
                  >
                    <SelectTrigger className="w-full focus:outline-none focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent className="w-full ring-0 focus-visible:ring-offset-0 focus-visible:ring-0">
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="recruiter">Recruiter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Country</label>
                  <Select
                    value={country}
                    onValueChange={(value: Country) => setCountry(value)}
                  >
                    <SelectTrigger className="w-full focus:outline-none focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="w-full ring-0 focus-visible:ring-offset-0 focus-visible:ring-0">
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="CA">CA</SelectItem>
                      <SelectItem value="US">US</SelectItem>
                      <SelectItem value="AU">AU</SelectItem>
                      <SelectItem value="Europe">Europe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded">
                    {error}
                  </div>
                )}

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={() => handleOAuthSignIn('google')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      "Processing..."
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => handleOAuthSignIn('linkedin')}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      "Processing..."
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        Continue with LinkedIn
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-xs text-gray-500 text-center mt-4">
                  By signing in, you agree to receive an OTP verification code via email for security purposes.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
import RecruiterAuthForm from "@/components/sections/recruiter-auth-form";
import { Suspense } from "react";

export const dynamic = "force-dynamic"; // Ensures it's not statically prerendered

// Loading component for better UX
const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0284DA]"></div>
      <p className="text-[#0284DA] font-medium">Loading login form...</p>
    </div>
  </div>
);

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RecruiterAuthForm />
    </Suspense>
  );
}
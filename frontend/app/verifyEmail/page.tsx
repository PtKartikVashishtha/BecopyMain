import VerifyEmail from "@/components/sections/verify-email";
import { Suspense } from "react";

export const dynamic = "force-dynamic"; // Ensures it's not statically prerendered

// Enhanced loading component with email verification theme
const VerifyEmailLoader = () => (
  <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
    <div className="w-full max-w-md mx-auto px-4">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0284DA]"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[#0284DA]">Loading Email Verification</h3>
            <p className="text-gray-600 text-sm">Please wait while we prepare your verification page...</p>
          </div>
          <div className="flex justify-center space-x-1 pt-2">
            <div className="w-2 h-2 bg-[#0284DA] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[#0284DA] rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
            <div className="w-2 h-2 bg-[#0284DA] rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function Page() {
  return (
    <Suspense fallback={<VerifyEmailLoader />}>
      <VerifyEmail />
    </Suspense>
  );
}
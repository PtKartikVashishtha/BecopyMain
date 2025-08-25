import VerifyEmail from "@/components/sections/verify-email";
import { Suspense } from "react";

export const dynamic = "force-dynamic"; // Ensures it's not statically prerendered

export default function Page() {
  return (
    <Suspense fallback={<div>Loading login form...</div>}>
      <VerifyEmail />
    </Suspense>
  );
}

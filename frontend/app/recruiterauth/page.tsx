import RecruiterAuthForm from "@/components/sections/recruiter-auth-form";
import { Suspense } from "react";

export const dynamic = "force-dynamic"; // Ensures it's not statically prerendered

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading login form...</div>}>
      <RecruiterAuthForm />
    </Suspense>
  );
}

import type { Metadata } from "next";
import { VerifyEmailStep } from "@/components/auth/signup-steps";

export const metadata: Metadata = { title: "Verify your email" };

export default function VerifyEmailPage() {
  return <VerifyEmailStep />;
}

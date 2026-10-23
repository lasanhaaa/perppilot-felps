import type { Metadata } from "next";
import { VerifyEmailStep } from "@/components/auth/verify-email-step";

export const metadata: Metadata = { title: "Verify your email" };

export default function VerifyEmailPage() {
  return <VerifyEmailStep />;
}

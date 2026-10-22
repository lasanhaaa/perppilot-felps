import type { Metadata } from "next";
import { WelcomeStep } from "@/components/auth/signup-steps";

export const metadata: Metadata = { title: "Welcome" };

export default function WelcomePage() {
  return <WelcomeStep />;
}

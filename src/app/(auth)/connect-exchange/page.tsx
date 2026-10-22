import type { Metadata } from "next";
import { ConnectExchangeStep } from "@/components/auth/signup-steps";

export const metadata: Metadata = { title: "Connect an exchange" };

export default function ConnectExchangePage() {
  return <ConnectExchangeStep />;
}

import type { Metadata } from "next";
import { CreatePinStep } from "@/components/auth/signup-steps";

export const metadata: Metadata = { title: "Create your PIN" };

export default function CreatePinPage() {
  return <CreatePinStep />;
}

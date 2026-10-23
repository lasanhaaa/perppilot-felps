import type { Metadata } from "next";
import { GettingStarted } from "@/components/getting-started/getting-started";

export const metadata: Metadata = { title: "Getting started" };

export default function GettingStartedPage() {
  return <GettingStarted />;
}

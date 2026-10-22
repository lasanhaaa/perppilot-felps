import type { Metadata } from "next";
import { BotsOverview } from "@/components/bots/bots-overview";

export const metadata: Metadata = { title: "Bots" };

export default function BotsPage() {
  return <BotsOverview />;
}

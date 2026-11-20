import type { Metadata } from "next";
import { StyleLab } from "@/components/bot-motion/style-lab";

export const metadata: Metadata = { title: "Bot styles" };

/** Prototype: round 2 of the bot faces next to the V1 backup. Outside the platform shell on purpose. */
export default function BotStylesPage() {
  return <StyleLab />;
}

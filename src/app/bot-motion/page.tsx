import type { Metadata } from "next";
import { MotionLab } from "@/components/bot-motion/motion-lab";

export const metadata: Metadata = { title: "Bot motion" };

/** Prototype: every bot animation, one per moment. Outside the platform shell on purpose. */
export default function BotMotionPage() {
  return <MotionLab />;
}

import type { Metadata } from "next";
import { CreateBot } from "@/components/create-bot/create-bot";

export const metadata: Metadata = { title: "Create bot" };

type Props = { searchParams: Promise<{ type?: string }> };

export default async function NewBotPage({ searchParams }: Props) {
  const { type } = await searchParams;
  const kind = type === "pointbot" ? "pointbot" : "v3";
  // keyed so picking the other type in the "Create a new bot" modal resets the form
  return <CreateBot key={kind} initialKind={kind} />;
}

import type { Metadata } from "next";
import { BotRoute } from "@/components/bots/bot-route";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Bot" };

// Bots live in the browser, so the page looks the id up on the client.
export default async function BotPage({ params }: Props) {
  const { id } = await params;
  return <BotRoute id={id} />;
}

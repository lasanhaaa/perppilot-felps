import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BotDetail } from "@/components/bots/bot-detail";
import { bots, getBot } from "@/lib/mock-data";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return bots.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const bot = getBot(id);
  return { title: bot ? `${bot.pair} bot` : "Bot" };
}

export default async function BotPage({ params }: Props) {
  const { id } = await params;
  const bot = getBot(id);
  if (!bot) notFound();
  return <BotDetail bot={bot} />;
}

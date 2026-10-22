"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons";
import { BotTypeLogo } from "@/components/brand";

/** "Create a new bot": pick V3 Bot or PointBot. */
export function NewBotModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const options = [
    { type: "v3" as const, title: "V3 Bot", text: "Advanced V3 Liquidity Pool automation on a single exchange." },
    { type: "pointbot" as const, title: "PointBot", text: "Cross-exchange arbitrage between multiple exchanges" },
  ];
  return (
    <Modal open={open} onClose={onClose} title="Create a new bot" description="Choose the type of bot you want to deploy" className="sm:w-[640px]">
      <div className="flex flex-col gap-2">
        {options.map((o, i) => (
          <Link
            key={o.type}
            href={`/bots/new?type=${o.type}`}
            onClick={onClose}
            className={
              "group flex items-center gap-4 border-t bg-fill-2 p-4 transition-colors hover:bg-fill-3 " +
              (i === 0 ? "border-brand" : "border-white/20")
            }
          >
            <BotTypeLogo type={o.type} />
            <span className="flex flex-1 flex-col">
              <span className="text-[16px]">{o.title}</span>
              <span className="text-[14px] text-white/60">{o.text}</span>
            </span>
            <Icon name="arrow-forward" size={24} className="text-white/60 transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </Link>
        ))}
      </div>
    </Modal>
  );
}

function Benefit({ icon, tone, title, text }: { icon: ReactNode; tone: "brand" | "info"; title: string; text: string }) {
  return (
    <li className="flex items-center gap-3 border-b border-line p-3 last:border-b-0">
      <span className={"grid size-8 shrink-0 place-items-center text-black " + (tone === "brand" ? "bg-brand-soft" : "bg-info")}>{icon}</span>
      <span className="flex flex-col">
        <span className="text-[15px]">{title}</span>
        <span className="text-[12px] text-white/50">{text}</span>
      </span>
    </li>
  );
}

const glyph = (d: string) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <path d={d} />
  </svg>
);

/** Web3 offer modal: "Get a free portfolio analysis". */
export function PortfolioAnalysisModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [booked, setBooked] = useState(false);
  const close = () => {
    onClose();
    setBooked(false);
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title={booked ? "You are on the list" : "Get a free portfolio analysis"}
      description={
        booked
          ? "An analyst will reach out within one business day to pick a time for your call."
          : "Talk to one of our Web3 analysts and see how our strategies could fit your portfolio."
      }
      className="sm:w-[680px]"
    >
      {!booked && (
        <>
          <p className="mb-3 text-[16px]">What you get</p>
          <ul className="border border-line">
            <Benefit tone="brand" icon={glyph("M6 4h10v10H6zM3 7v10h10")} title="All investment strategies" text="Full access to every strategy in our portfolio." />
            <Benefit tone="info" icon={glyph("M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 7c0-3 2.7-5 6-5s6 2 6 5")} title="Direct contact with our analysts" text="They manage over $25M in capital." />
            <Benefit tone="brand" icon={glyph("M7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM3 15c0-2 1.8-4 4-4s4 2 4 4m-2-4c.6-.6 1.6-1 4-1 2.2 0 4 2 4 4")} title="A community of thousands" text="Thousands of active investors, in one place." />
            <Benefit tone="info" icon={glyph("M3 6h10v8H3zM13 9l4-2v6l-4-2")} title="Weekly live calls" text="Updates on our fully transparent portfolio, which returned over 36% last year.*" />
          </ul>
        </>
      )}
      <div className="mt-10 flex flex-col-reverse items-stretch justify-end gap-3 sm:flex-row sm:items-center">
        <Button variant="ghost" className="normal-case font-normal text-[16px]" onClick={close}>
          {booked ? "Close" : "Maybe later"}
        </Button>
        {!booked && (
          <Button iconRight="arrow-forward" onClick={() => setBooked(true)}>
            Book your free portfolio analysis
          </Button>
        )}
      </div>
    </Modal>
  );
}

/** First visit video: "Your PerpPilot journey starts here". */
export function WelcomeVideoModal({ open, onClose, onBook }: { open: boolean; onClose: () => void; onBook: () => void }) {
  const [playing, setPlaying] = useState(false);
  return (
    <Modal
      open={open}
      onClose={() => {
        setPlaying(false);
        onClose();
      }}
      accent
      title="Your PerpPilot journey starts here"
      description="Start with a short introduction to PerpPilot and discover how the platform works."
      className="sm:w-[951px]"
    >
      <div className="relative aspect-[903/527] w-full overflow-hidden bg-[#2a2a2a]">
        <Image src="/images/video-poster.png" alt="" fill sizes="(min-width: 960px) 903px, 100vw" className="object-cover" />
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause video" : "Play video"}
          className="absolute top-1/2 left-1/2 grid size-[61px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-black transition-transform hover:scale-105"
        >
          {playing ? (
            <svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true"><path d="M2 0h5v20H2zM11 0h5v20h-5z" fill="currentColor" /></svg>
          ) : (
            <Icon name="play" size={28} className="translate-x-0.5" />
          )}
        </button>
        {playing && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
            <div className="h-full w-[12%] bg-brand" />
          </div>
        )}
      </div>
      <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[18px]">Let our analysts set up Perppilot with you - 100% for free!</p>
          <p className="text-[14px] text-white/60">We review your portfolio and show you live how to set up Perppilot for your capital.</p>
        </div>
        <Button onClick={onBook} className="shrink-0">
          Book portfolio analysis &amp; demo
        </Button>
      </div>
    </Modal>
  );
}

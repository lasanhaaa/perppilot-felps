"use client";

import Image from "next/image";
import { Button, IconButton } from "@/components/ui/button";
import { useShell } from "./shell-context";

/** Web3 Universe mark used on the "Book now" buttons. */
export function PartnerMark() {
  return (
    <svg width="22" height="21" viewBox="0 0 22 21" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10.9757 16.7003L7.76256 21L0 10.4961L0.452689 9.89161L7.85198 0L11.026 4.29933L14.2379 0L22 10.503L21.5477 11.1067L14.1482 20.9998L10.9755 16.7001L10.9757 16.7003ZM12.5221 6.33025L15.1633 9.89448L15.6338 10.5256L12.5192 14.7167L14.1907 16.9644L18.979 10.4982L14.2118 4.06798L12.5221 6.33044V6.33025ZM3.0202 10.4993L7.78947 16.9332L9.47955 14.6692L6.83711 11.1042L6.36662 10.4727L6.79716 9.89372L9.47955 6.28229L7.80893 4.03384L3.01999 10.4993H3.0202ZM9.33921 10.4335L11.0436 12.7284L12.6629 10.5642L10.9577 8.27005L9.33942 10.4335H9.33921Z"
      />
    </svg>
  );
}

/** Thin bar above the app ("FREE Book a free portfolio analysis…"). */
export function TopBanner({ onClose }: { onClose: () => void }) {
  const { openPortfolioAnalysis } = useShell();
  return (
    <div className="relative z-20 flex min-h-11 items-center justify-center gap-3 bg-gradient-to-r from-[#0b2a5c] via-[#0f4fb0] to-[#0b2a5c] px-12 py-2 text-[14px] sm:gap-6">
      <span className="hidden items-center gap-3 sm:flex">
        <span className="bg-white px-1.5 font-mono text-[12px] text-[#0f4fb0] uppercase">Free</span>
        <span className="text-white/90">Book a free portfolio analysis and live demo with one of our 10+ analysts.</span>
      </span>
      <span className="text-white/90 sm:hidden">Free portfolio analysis with our analysts</span>
      <Button variant="light" size="sm" iconRight="arrow-forward" onClick={openPortfolioAnalysis} className="h-8 text-[12px]">
        <span className="hidden sm:inline">Book your free portfolio analysis</span>
        <span className="sm:hidden">Book</span>
      </Button>
      <IconButton icon="close" label="Dismiss banner" size={32} iconSize={20} onClick={onClose} className="absolute right-2" />
    </div>
  );
}

export function SidebarPromo() {
  const { openPortfolioAnalysis } = useShell();
  return (
    <div className="mx-4 flex flex-col gap-4 border border-info/70 bg-black/40 p-4">
      <Image src="/images/knight.png" alt="" width={64} height={68} className="mix-blend-lighten" />
      <div className="flex flex-col gap-2">
        <p className="font-display text-[18px] leading-[1.2]">Get our analysts&apos; exact setups</p>
        <p className="text-[13px] leading-[1.45] text-white/60">Book a free portfolio analysis and live demo with one of our 10+ analysts.</p>
      </div>
      <button
        type="button"
        onClick={openPortfolioAnalysis}
        className="flex h-11 items-center justify-center gap-3 bg-white text-[14px] font-medium text-black transition-colors hover:bg-white/90"
      >
        <PartnerMark />
        Book now
      </button>
    </div>
  );
}

/** Bottom-right card shown once per session on the bot overview. */
export function PromoToast({ onClose }: { onClose: () => void }) {
  const { openPortfolioAnalysis } = useShell();
  return (
    <div role="status" className="fixed right-4 bottom-4 z-40 flex w-[min(445px,calc(100vw-32px))] animate-pop-in items-center gap-4 border border-line bg-[#141414] py-4 pr-12 pl-4 shadow-2xl shadow-black/60">
      <Image src="/images/knight.png" alt="" width={96} height={103} className="shrink-0 mix-blend-lighten" />
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[16px] font-medium">Free portfolio analysis</p>
          <p className="text-[13px] leading-[1.45] text-white/60">Talk directly to Web3 analysts managing over $25M in capital.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            openPortfolioAnalysis();
            onClose();
          }}
          className="h-9 w-fit bg-white px-6 text-[14px] font-medium text-black hover:bg-white/90"
        >
          Book now
        </button>
      </div>
      <IconButton icon="close" label="Dismiss" size={32} iconSize={20} onClick={onClose} className="absolute top-1/2 right-2 -translate-y-1/2" />
    </div>
  );
}


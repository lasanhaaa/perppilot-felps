"use client";

import Image from "next/image";
import { IconButton } from "@/components/ui/button";
import { useShell } from "./shell-context";

/**
 * Bottom-right promo card, the one place the Web3 Universe offer shows up
 * (Figma: "Banners and popups" / banners, node 1228:10318).
 */
export function PromoToast({ onClose }: { onClose: () => void }) {
  const { openPortfolioAnalysis } = useShell();
  return (
    <aside
      aria-label="Free portfolio analysis"
      className="fixed right-4 bottom-4 z-40 flex w-[min(445px,calc(100vw-32px))] animate-pop-in items-center gap-4 overflow-hidden border-l-2 border-[#267bcc] bg-[#1f1f21] p-4 shadow-2xl shadow-black/60 sm:gap-6"
    >
      <Image
        src="/images/knight.png"
        alt=""
        width={130}
        height={139}
        className="pointer-events-none absolute top-2.5 left-0 h-auto w-[96px] mix-blend-lighten sm:left-2 sm:w-[130px]"
      />
      <span aria-hidden className="w-[72px] shrink-0 sm:w-[115px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-[18px] sm:max-w-[224px]">
        <div className="flex flex-col gap-[7px]">
          <p className="font-display text-[16px] leading-[1.1] tracking-[-0.02em]">Free portfolio analysis</p>
          <p className="text-[12px] leading-[1.5] tracking-[-0.02em] text-white/70">Talk directly to Web3 analysts managing over $25M in capital.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            openPortfolioAnalysis();
            onClose();
          }}
          className="flex h-[34px] w-[131px] items-center justify-center bg-white text-[14px] font-medium tracking-[-0.02em] text-black transition-colors hover:bg-white/90"
        >
          Book now
        </button>
      </div>
      <IconButton icon="close" label="Dismiss" size={32} iconSize={24} onClick={onClose} className="shrink-0 text-white/60 hover:text-white" />
    </aside>
  );
}

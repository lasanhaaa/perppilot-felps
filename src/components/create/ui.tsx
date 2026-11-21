"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { COIN_PRICE, money, priceFmt, series, type Coin } from "@/lib/mock";
import { MARKETS } from "@/lib/draft";
import { CoinIcon } from "@/components/ui/coin";
import { Icon } from "@/components/ui/icons";
import { IconButton } from "@/components/ui/primitives";
import { MotionFace } from "@/components/bot-motion/motion-face";
import { AvatarEditor } from "@/components/bots/avatar-editor";
import { useStore } from "@/lib/store";
import { botAvatarSignature, type BotAvatar } from "@/lib/bot-avatar";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/* ---------- Heading row: back button, optional avatar, title, right slot ---------- */

export function HeadingRow({
  back,
  onBack,
  avatar,
  title,
  description,
  right,
}: {
  back?: string;
  onBack?: () => void;
  avatar?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-5">
      {(back || onBack) && <IconButton href={back} onClick={onBack} label="Back" />}
      {avatar}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h1 className="t-h24 font-medium">{title}</h1>
        {description && <p className="t-b16 text-white/60">{description}</p>}
      </div>
      {right}
    </div>
  );
}

/* ---------- The new bot's face: moves, and opens the avatar editor ---------- */

export function DraftAvatar({
  look,
  original,
  name,
  size = 56,
  onChange,
  badge = true,
}: {
  look: BotAvatar;
  original: BotAvatar;
  name: string;
  size?: number;
  onChange: (look: BotAvatar) => void;
  /** Show the pencil all the time (create flow), not only on hover. */
  badge?: boolean;
}) {
  const { allBots } = useStore();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const taken = useMemo(() => new Set(allBots.map((b) => botAvatarSignature(b.avatar))), [allBots]);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        aria-label={`Edit ${name} avatar`}
        title="Edit avatar"
        className="group relative flex-none rounded-sm outline-offset-4"
      >
        <MotionFace avatar={look} state={hovered ? "looking" : "idle"} size={size} seed={7} paused={reduced} followPointer />
        <span
          className={cn(
            "absolute -right-2 -bottom-2 grid size-5 place-items-center rounded-sm border border-line bg-[#161d22] text-white/80 transition-opacity",
            badge ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          <Icon name="pencil" size={12} />
        </span>
      </button>
      {open && <AvatarEditor name={name} avatar={look} original={original} seed={7} taken={taken} onSave={onChange} onClose={() => setOpen(false)} />}
    </>
  );
}

/* ---------- Settings card ("Bot Card" with title + description) ---------- */

export function SettingsCard({ title, description, children, className }: { title: ReactNode; description?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-sm border border-line bg-card p-5", className)}>
      <div className="flex flex-col">
        <h2 className="text-[18px] leading-[27px] font-medium">{title}</h2>
        {description && <p className="t-b16 text-white/40">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/* ---------- Simple / Advanced switch (Bot Detail / View switch) ---------- */

export function ViewSwitch<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "t-b14 h-[38px] rounded-sm px-4 font-medium transition-colors",
            value === o.value ? "bg-white text-black" : "border border-line bg-raised text-white/80 hover:bg-hover",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Market select ---------- */

export function MarketSelect({ value, onChange }: { value: Coin; onChange: (c: Coin) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);
  return (
    <div className="flex flex-col gap-1" ref={ref}>
      <span className="t-l14 text-white/90">Market</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn("flex h-14 w-full items-center gap-3 rounded-sm border bg-raised p-2 pr-4 text-left transition-colors", open ? "border-brand" : "border-line hover:border-white/20")}
        >
          <CoinIcon coin={value} size={40} />
          <span className="flex flex-1 flex-col gap-1">
            <span className="text-[16px] leading-4 text-white/90">{value} - USD</span>
            <span className="text-[14px] leading-[14px] text-white/60">Mark: ${money(COIN_PRICE[value] * 0.99479)}</span>
          </span>
          <Icon name="menu-chevron-down" size={24} className={cn("opacity-50 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className="anim-fade absolute inset-x-0 top-[60px] z-20 flex flex-col rounded-sm border border-line bg-[#0f1316] p-1 shadow-2xl">
            {MARKETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className={cn("flex h-12 items-center gap-3 rounded-sm px-2 text-left hover:bg-white/5", c === value && "bg-white/5")}
              >
                <CoinIcon coin={c} size={28} />
                <span className="t-b16 flex-1">{c} - USD</span>
                <span className="t-b14 tnum text-white/60">{priceFmt(COIN_PRICE[c])}</span>
                {c === value && <Icon name="check" size={18} className="text-brand" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Simple range bar (domain ±20% around the price) ---------- */

export function RangeBar({ price, lo, hi }: { price: number; lo: number; hi: number }) {
  const x = (pct: number) => `${((pct + 20) / 40) * 100}%`;
  const min = price * (1 + lo / 100);
  const max = price * (1 + hi / 100);
  return (
    <div className="relative h-24 w-full">
      <span className="absolute top-[26px] h-2.5 w-full bg-white/6" />
      <span
        className="absolute top-[26px] h-2.5 border-b border-gain bg-gradient-to-b from-gain/10 to-gain/30 transition-all duration-300"
        style={{ left: x(lo), width: `calc(${x(hi)} - ${x(lo)})` }}
      />
      <span className="absolute top-5 h-[22px] w-px bg-gain transition-all duration-300" style={{ left: x(lo) }} />
      <span className="absolute top-5 h-[22px] w-px bg-gain transition-all duration-300" style={{ left: x(hi) }} />
      <span className="absolute top-3 h-[34px] w-0.5 -translate-x-1/2 bg-white" style={{ left: x(0) }} />
      <span className="absolute -top-2 -translate-x-1/2 text-[14px] leading-[17px] font-medium" style={{ left: x(0) }}>
        {priceFmt(price)}
      </span>
      <span className="absolute top-[54px] flex -translate-x-1/2 flex-col items-center gap-0.5 transition-all duration-300" style={{ left: x(lo) }}>
        <span className="text-[12px] leading-[15px] text-white/40">MIN</span>
        <span className="text-[14px] leading-[17px]">{priceFmt(min)}</span>
      </span>
      <span className="absolute top-[54px] flex -translate-x-1/2 flex-col items-center gap-0.5 transition-all duration-300" style={{ left: x(hi) }}>
        <span className="text-[12px] leading-[15px] text-white/40">MAX</span>
        <span className="text-[14px] leading-[17px]">{priceFmt(max)}</span>
      </span>
      <span className="absolute top-[54px] -translate-x-1/2 text-[13px] leading-4 text-white/40" style={{ left: x(lo / 2) }}>
        −{Math.abs(lo).toFixed(1)}%
      </span>
      <span className="absolute top-[54px] -translate-x-1/2 text-[13px] leading-4 text-white/40" style={{ left: x(hi / 2) }}>
        +{hi.toFixed(1)}%
      </span>
    </div>
  );
}

/* ---------- Position size (two linked inputs) ---------- */

export function PositionSize({ coin, value, onChange }: { coin: Coin; value: number; onChange: (usd: number) => void }) {
  const price = COIN_PRICE[coin];
  const [usdText, setUsdText] = useState(money(value));
  const [coinText, setCoinText] = useState((value / price).toFixed(coin === "BTC" ? 9 : 6));
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCoinText((value / price).toFixed(coin === "BTC" ? 9 : 6));
  }, [coin, price, value]);
  const minUsd = 398.45;
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="flex h-[78px] items-center gap-3 rounded-sm border border-line bg-raised p-4 focus-within:border-brand">
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            inputMode="decimal"
            value={coinText}
            onChange={(e) => {
              setCoinText(e.target.value);
              const n = parseFloat(e.target.value);
              if (!Number.isNaN(n)) {
                onChange(n * price);
                setUsdText(money(n * price));
              }
            }}
            className="w-full bg-transparent text-[24px] leading-6 font-medium"
          />
          <span className="text-[14px] leading-[14px] text-white/60">${money(value * 0.9485)}</span>
        </span>
        <span className="text-[16px] leading-4 text-white/90">{coin}</span>
        <CoinIcon coin={coin} size={40} />
      </label>
      <label className="flex h-[78px] items-center gap-3 rounded-sm border border-line bg-raised p-4 focus-within:border-brand">
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="flex items-center text-[24px] leading-6 font-medium">
            $
            <input
              inputMode="decimal"
              value={usdText}
              onChange={(e) => {
                setUsdText(e.target.value);
                const n = parseFloat(e.target.value.replace(/,/g, ""));
                if (!Number.isNaN(n)) onChange(n);
              }}
              onBlur={() => setUsdText(money(value))}
              className="w-full bg-transparent"
            />
          </span>
          <span className={cn("text-[14px] leading-[14px]", value < minUsd ? "text-error" : "text-white/60")}>
            {value < minUsd ? `Minimum is $${money(minUsd)}` : `$${money(value * 0.9485)} · min $${money(minUsd)}`}
          </span>
        </span>
        <span className="text-[16px] leading-4 text-white/90">USD</span>
        <span className="flex size-10 items-center justify-center bg-white text-[28px] leading-none text-black">$</span>
      </label>
    </div>
  );
}

/* ---------- Stepper card (+ / −) ---------- */

export function StepperCard({
  label,
  value,
  sub,
  onInc,
  onDec,
  size = "lg",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  onInc: () => void;
  onDec: () => void;
  size?: "lg" | "md";
}) {
  const btn = size === "lg" ? "size-[45px] border border-line" : "size-[33px]";
  return (
    <div className="flex flex-1 items-center justify-between gap-4 rounded-sm border border-line bg-card p-5">
      <div className="flex flex-col gap-4">
        <span className="t-l14 text-white/40">{label}</span>
        <span className="flex flex-col gap-1">
          <span className={cn("tnum", size === "lg" ? "text-[28px] leading-[28px] font-medium" : "text-[24px] leading-9 font-semibold")}>{value}</span>
          {sub}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <button type="button" aria-label={`Increase ${label}`} onClick={onInc} className={cn("flex items-center justify-center bg-raised transition-colors hover:bg-hover", btn)}>
          <Icon name="plus" size={24} />
        </button>
        <button type="button" aria-label={`Decrease ${label}`} onClick={onDec} className={cn("flex items-center justify-center bg-raised transition-colors hover:bg-hover", btn)}>
          <Icon name="minus" size={24} />
        </button>
      </div>
    </div>
  );
}

/* ---------- Candle chart with the bot's range band (Advanced) ---------- */

export function CandleRange({ coin, lo, hi, height = 423 }: { coin: Coin; lo: number; hi: number; height?: number }) {
  const price = COIN_PRICE[coin];
  const [tf, setTf] = useState<"1M" | "1W" | "1D">("1M");
  const candles = useMemo(() => {
    const seed = { "1M": 11, "1W": 23, "1D": 37 }[tf] + coin.charCodeAt(0);
    const closes = series(seed, 62, 0.9, 0.0017, 0.03).map((v) => v);
    const last = closes[closes.length - 1];
    const scaled = closes.map((v) => (v / last) * price);
    return scaled.map((c, i) => {
      const o = i ? scaled[i - 1] : c * 0.995;
      const wig = Math.abs(c - o) * 0.6 + price * 0.004;
      return { o, c, h: Math.max(o, c) + wig * ((i * 7) % 5) * 0.25, l: Math.min(o, c) - wig * ((i * 3) % 4) * 0.25 };
    });
  }, [tf, coin, price]);
  const W = 1031;
  const H = height;
  const dLo = price * (1 + Math.min(lo * 1.6, -14) / 100);
  const dHi = price * (1 + Math.max(hi * 1.6, 14) / 100);
  const y = (v: number) => ((dHi - v) / (dHi - dLo)) * H;
  const yMin = y(price * (1 + lo / 100));
  const yMax = y(price * (1 + hi / 100));
  const yNow = y(price);
  const step = W / candles.length;
  const ticks = Array.from({ length: 6 }, (_, i) => dHi - ((dHi - dLo) * i) / 5);
  const months = ["Mar 6", "Aug 28", "Feb 19", "Aug 12", "Feb 3", "Jul 28", "Jan 19", "Jul 11", "Jan 3", "Jun 25"];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between pb-4">
        <div className="flex flex-col gap-1">
          <span className="tnum text-[24px] leading-9">{priceFmt(price * 1.002)}</span>
          <span className="t-l14 text-white/40">Current mid price</span>
        </div>
        <div className="flex">
          {(["1M", "1W", "1D"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTf(t)} className={cn("t-l14 px-3 py-2", tf === t ? "bg-white/5 text-white/80" : "text-white/40 hover:text-white/70")}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex">
        <div className="relative flex-1" style={{ height: H }}>
          <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0" aria-hidden>
            <defs>
              <linearGradient id="cr-up" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#4ade80" stopOpacity="0.16" />
                <stop offset="1" stopColor="#4ade80" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="cr-down" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ff3737" stopOpacity="0.04" />
                <stop offset="1" stopColor="#ff3737" stopOpacity="0.16" />
              </linearGradient>
            </defs>
            {ticks.map((t) => (
              <line key={t} x1="0" x2={W} y1={y(t)} y2={y(t)} stroke="white" strokeOpacity="0.05" vectorEffect="non-scaling-stroke" />
            ))}
            {months.map((_, i) => (
              <line key={i} x1={(i + 0.5) * (W / months.length)} x2={(i + 0.5) * (W / months.length)} y1="0" y2={H} stroke="white" strokeOpacity="0.04" vectorEffect="non-scaling-stroke" />
            ))}
            <rect x="0" y={yMax} width={W} height={Math.max(0, yNow - yMax)} fill="url(#cr-up)" className="transition-all duration-300" />
            <rect x="0" y={yNow} width={W} height={Math.max(0, yMin - yNow)} fill="url(#cr-down)" className="transition-all duration-300" />
            <line x1="0" x2={W} y1={yMax} y2={yMax} stroke="#4ade80" strokeOpacity="0.8" vectorEffect="non-scaling-stroke" />
            <line x1="0" x2={W} y1={yNow} y2={yNow} stroke="white" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />
            <line x1="0" x2={W} y1={yMin} y2={yMin} stroke="#ff3737" strokeOpacity="0.8" vectorEffect="non-scaling-stroke" />
            {candles.map((k, i) => {
              const up = k.c >= k.o;
              const cx = i * step + step / 2;
              const col = up ? "#4ade80" : "#ff3737";
              return (
                <g key={i}>
                  <line x1={cx} x2={cx} y1={y(k.h)} y2={y(k.l)} stroke={col} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <rect x={cx - step * 0.32} y={y(Math.max(k.o, k.c))} width={step * 0.64} height={Math.max(1.5, Math.abs(y(k.o) - y(k.c)))} fill={col} />
                </g>
              );
            })}
          </svg>
          <div className="absolute inset-x-0 -bottom-8 flex justify-around">
            {months.map((m, i) => (
              <span key={i} className="text-[14px] leading-[21px] text-white/20">
                {m}
              </span>
            ))}
          </div>
        </div>
        <div className="relative w-[75px] flex-none border-l border-white/20" style={{ height: H }}>
          {ticks.map((t) => (
            <span key={t} className="absolute left-2 -translate-y-1/2 text-[12px] leading-[18px] text-white/20" style={{ top: y(t) }}>
              {money(t)}
            </span>
          ))}
          <Chip y={yMax} className="bg-gain text-black">
            {money(price * (1 + hi / 100))}
          </Chip>
          <Chip y={yNow} className="bg-white text-black">
            {money(price)}
          </Chip>
          <Chip y={yMin} className="bg-error text-white">
            {money(price * (1 + lo / 100))}
          </Chip>
        </div>
      </div>
      <div className="h-6" />
    </div>
  );
}

function Chip({ y, className, children }: { y: number; className: string; children: ReactNode }) {
  return (
    <span className={cn("absolute -left-px flex h-[22px] -translate-y-1/2 items-center px-1.5 text-[12px] font-medium whitespace-nowrap transition-all duration-300", className)} style={{ top: y }}>
      {children}
    </span>
  );
}

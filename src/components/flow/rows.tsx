"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icons";
import { Checkbox } from "@/components/ui/primitives";

/** "Exchange row" (2066:4727): logo, name + tag, description, difficulty meter, arrow. */
export function OptionRow({
  logo,
  name,
  tag,
  description,
  difficulty,
  href,
  onClick,
  trailing,
  selected,
}: {
  logo: ReactNode;
  name: ReactNode;
  tag?: string;
  description: ReactNode;
  difficulty?: "Easy" | "Medium" | "Advanced";
  href?: string;
  onClick?: () => void;
  trailing?: ReactNode;
  selected?: boolean;
}) {
  const cls = cn(
    "group flex min-h-[81px] w-full items-center gap-4 rounded-sm border py-4 pr-5 pl-4 text-left transition-colors",
    selected ? "border-brand bg-selected" : "border-line bg-raised hover:border-white/20 hover:bg-hover",
  );
  const body = (
    <>
      <span className="flex size-10 flex-none items-center justify-center overflow-hidden">{logo}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="t-b16m">{name}</span>
          {tag && <span className="t-l12 rounded-sm bg-selected px-1.5 text-brand">{tag}</span>}
        </span>
        <span className="t-b14 text-white/60">{description}</span>
      </span>
      {difficulty && <Difficulty level={difficulty} />}
      {trailing ?? <Icon name="arrow-right" size={20} className="text-white/60 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />}
    </>
  );
  if (href)
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

export function Difficulty({ level }: { level: "Easy" | "Medium" | "Advanced" }) {
  const n = { Easy: 1, Medium: 2, Advanced: 3 }[level];
  return (
    <span className="flex w-[111px] flex-none flex-col gap-1">
      <span className="t-l12 text-white/30">Setup difficulty</span>
      <span className="flex items-center gap-1.5">
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={cn("h-3 w-1", i < n ? "bg-white" : "bg-white/30")} />
          ))}
        </span>
        <span className="t-l12 text-white">{level}</span>
      </span>
    </span>
  );
}

/** "Summary row" (2065:4553). */
export function SummaryRow({
  icon,
  title,
  meta,
  status,
  statusTone = "success",
}: {
  icon?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  status?: ReactNode;
  statusTone?: "success" | "muted";
}) {
  return (
    <div className="flex min-h-[50px] items-center py-3 gap-3 rounded-sm border border-line bg-raised px-4">
      {icon && <span className="flex flex-none items-center justify-center overflow-hidden">{icon}</span>}
      <span className="t-b16m">{title}</span>
      {meta && <span className="t-b14 text-white/30">{meta}</span>}
      <span className="flex-1" />
      {status && (
        <span className={cn("t-b14 flex items-center gap-1.5", statusTone === "success" ? "text-success" : "text-white/60")}>
          {statusTone === "success" && <Icon name="check" size={16} />}
          {status}
        </span>
      )}
    </div>
  );
}

/** "Guide step" (2066:4746) list: numbered rail with connector lines. */
export function GuideSteps({ steps }: { steps: { title: string; action?: ReactNode }[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={s.title} className="flex gap-4">
            <span className="flex w-6 flex-none flex-col items-center gap-1">
              <span className="flex size-6 items-center justify-center rounded-[2px] border border-line bg-raised text-[12px] leading-[18px] font-medium">{i + 1}</span>
              {!last && <span className="w-px flex-1 bg-line" />}
            </span>
            <span className={cn("flex flex-col gap-1", last ? "pb-6" : "pb-6")}>
              <span className="t-l12 text-white/30">Step {i + 1}</span>
              <span className="t-b16">{s.title}</span>
              {s.action && <span className="pt-3">{s.action}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** "Link row" (2073:5235). */
export function LinkRow({ title, meta, href }: { title: string; meta: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex h-[77px] items-center gap-3 rounded-sm border border-line bg-field px-4 transition-colors hover:bg-raised"
    >
      <span className="flex flex-1 flex-col">
        <span className="t-b16m">{title}</span>
        <span className="t-b14 text-white/30">{meta}</span>
      </span>
      <span className="t-b14 flex items-center gap-1.5 font-medium text-white group-hover:text-brand">
        Install
        <Icon name="external-link" size={16} />
      </span>
    </a>
  );
}

/** Radio-like row ("Choice row" 2057:3449). */
export function ChoiceRow({ label, selected, onClick, meta }: { label: ReactNode; selected: boolean; onClick: () => void; meta?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "t-b16 flex min-h-[58px] w-full items-center justify-between gap-3 rounded-sm border px-[18px] py-4 text-left transition-colors",
        selected ? "border-brand bg-selected" : "border-line bg-raised hover:bg-hover",
      )}
    >
      <span className="flex flex-col">
        {label}
        {meta && <span className="t-b14 text-white/50">{meta}</span>}
      </span>
      <span className={cn("flex size-4 flex-none items-center justify-center rounded-full border", selected ? "border-white" : "border-white/30")}>
        {selected && <span className="size-2 rounded-full bg-white" />}
      </span>
    </button>
  );
}

/** Checkbox card (referral check, builder fee consent). */
export function CheckCard({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: ReactNode;
  description: ReactNode;
}) {
  return (
    <div
      role="presentation"
      onClick={() => onChange(!checked)}
      className="flex cursor-pointer gap-3 rounded-sm border border-line bg-field p-4 transition-colors hover:border-white/20"
    >
      <span className="pt-[3px]" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={checked} onChange={onChange} />
      </span>
      <span className="flex flex-col gap-1">
        <span className="t-b16m">{title}</span>
        <span className="t-b14 text-white/60">{description}</span>
      </span>
    </div>
  );
}

/** "Video player" (2066:4747): placeholder video with a brand play button. */
export function VideoPlayer({ className, label = "Play video" }: { className?: string; label?: string }) {
  return (
    <div className={cn("relative flex aspect-video items-center justify-center rounded-sm border border-line bg-raised", className)}>
      <button
        type="button"
        aria-label={label}
        className="flex size-16 items-center justify-center rounded-full bg-brand text-black transition-transform hover:scale-105"
      >
        <Icon name="play-solid" size={28} />
      </button>
    </div>
  );
}

/** Panel used by the two-column connect screen. */
export function Panel({ title, description, children, className }: { title: ReactNode; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-5 rounded-sm border border-line bg-card p-6", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="t-h20">{title}</h2>
        {description && <p className="t-b14 text-white/60">{description}</p>}
      </div>
      {children}
    </section>
  );
}

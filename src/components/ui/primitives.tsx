"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./icons";

/* ---------- Button (2056:3456) ---------- */

type ButtonStyle = "primary" | "secondary" | "ghost" | "white" | "danger";

const BTN: Record<ButtonStyle, string> = {
  primary: "bg-brand text-black hover:bg-brand-hover disabled:bg-raised disabled:text-white/30",
  secondary: "bg-raised border border-line text-white hover:bg-hover disabled:border-transparent disabled:text-white/30",
  ghost: "text-white/60 hover:text-white normal-case font-normal",
  white: "bg-white text-black hover:bg-white/90",
  danger: "bg-error text-white hover:bg-[#ff5252]",
};

export function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  href,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonStyle;
  /** md 55px, sm 40px, xs 32px ("Button small" 2142:8347, used in row hover actions). */
  size?: "md" | "sm" | "xs";
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  href?: string;
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-sm transition-colors select-none whitespace-nowrap",
    variant === "ghost" ? "t-b16 p-1" : size === "md" ? "t-btn16 h-[55px] px-6" : size === "sm" ? "t-btn14 uppercase font-semibold h-10 px-4" : "t-btn14 h-8 px-3",
    BTN[variant],
    className,
  );
  const body = (
    <>
      {iconLeft}
      {children}
      {iconRight}
    </>
  );
  if (href && !rest.disabled)
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  return (
    <button type="button" className={cls} {...rest}>
      {body}
    </button>
  );
}

export const ArrowRight = ({ size = 16 }: { size?: number }) => <Icon name="arrow-right" size={size} />;

/* ---------- Icon button (2080:5900) ---------- */

export function IconButton({
  icon = "arrow-left",
  href,
  onClick,
  size = 48,
  label,
  className,
}: {
  icon?: IconName;
  href?: string;
  onClick?: () => void;
  size?: number;
  label: string;
  className?: string;
}) {
  const cls = cn(
    "inline-flex items-center justify-center rounded-sm border border-line bg-raised text-white transition-colors hover:bg-hover",
    className,
  );
  const style = { width: size, height: size };
  if (href)
    return (
      <Link href={href} aria-label={label} className={cls} style={style}>
        <Icon name={icon} size={24} />
      </Link>
    );
  return (
    <button type="button" aria-label={label} onClick={onClick} className={cls} style={style}>
      <Icon name={icon} size={24} />
    </button>
  );
}

/* ---------- Text link (2080:5569) ---------- */

export function TextLink({
  children,
  href,
  onClick,
  icon = "external-link",
  size = 16,
  className,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  icon?: IconName | null;
  size?: 14 | 16;
  className?: string;
}) {
  const cls = cn(
    "inline-flex items-center gap-1.5 font-medium text-brand transition-colors hover:text-brand-hover",
    size === 16 ? "text-[16px] leading-[24px]" : "text-[14px] leading-[21px]",
    className,
  );
  const inner = (
    <>
      {children}
      {icon && <Icon name={icon} size={16} />}
    </>
  );
  if (href)
    return (
      <Link href={href} className={cls} target={href.startsWith("http") ? "_blank" : undefined}>
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/* ---------- Input (2056:3536) ---------- */

export function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
  trailing,
  className,
  autoFocus,
  labelAction,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  trailing?: ReactNode;
  className?: string;
  autoFocus?: boolean;
  /** Small link on the right of the label row, e.g. "Forgot password?". */
  labelAction?: ReactNode;
}) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="flex items-baseline justify-between gap-3">
        <span className="t-l14 text-white/90">{label}</span>
        {labelAction}
      </span>
      <span
        className={cn(
          "flex h-[62px] items-center gap-3 rounded-sm border bg-field px-[18px] transition-colors focus-within:border-brand",
          error ? "border-error" : "border-line",
        )}
      >
        <input
          type={isPw && !show ? "password" : isPw ? "text" : type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          className="t-b16 min-w-0 flex-1 bg-transparent text-white"
        />
        {isPw && (
          <button type="button" onClick={() => setShow((s) => !s)} aria-label="Show password" className="text-white/60 hover:text-white">
            <Icon name="eye" size={20} />
          </button>
        )}
        {trailing}
      </span>
      {error && (
        <span className="t-b14 flex items-center gap-1.5 text-error">
          <Icon name="alert-circle" size={16} />
          {error}
        </span>
      )}
    </label>
  );
}

/* ---------- Notice (2058:3475) ---------- */

export function Notice({ tone = "info", children, className }: { tone?: "info" | "success" | "error"; children: ReactNode; className?: string }) {
  const bg = { info: "bg-info/10", success: "bg-success/10", error: "bg-error/10" }[tone];
  const fg = { info: "text-info", success: "text-success", error: "text-error" }[tone];
  return (
    <div className={cn("t-b14 flex items-start gap-2 rounded-sm py-2 pr-3 pl-2.5 text-white", bg, className)}>
      <Icon name={tone === "success" ? "check" : "alert-circle"} size={21} className={fg} />
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

/* ---------- Status tag (2100:6950) and pills ---------- */

export type Tone = "success" | "warning" | "neutral" | "error" | "gain" | "info";

const TONE: Record<Tone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  neutral: "bg-raised text-white/90",
  error: "bg-error/10 text-error",
  gain: "bg-gain/10 text-gain",
  info: "bg-info/10 text-info",
};

export function StatusTag({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("t-l12 inline-flex h-[22px] items-center px-1.5 whitespace-nowrap", TONE[tone], className)}>{children}</span>;
}

/** Grey label chip (e.g. "±8% RANGE", "V3 BOT"). */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-[22px] items-center bg-raised px-1.5 text-[12px] leading-[18px] text-white/80", className)}>{children}</span>;
}

/* ---------- Checkbox (2065:4552) ---------- */

export function Checkbox({ checked, onChange, className }: { checked: boolean; onChange?: (v: boolean) => void; className?: string }) {
  const cls = cn(
    "inline-flex size-[18px] flex-none items-center justify-center rounded-[2px] transition-colors",
    checked ? "bg-brand text-black" : "border border-line-strong hover:border-white/60",
    className,
  );
  // Without onChange the box only shows state inside a clickable row, so it can't be a nested <button>.
  if (!onChange)
    return (
      <span aria-hidden className={cls}>
        {checked && <Icon name="check" size={14} />}
      </span>
    );
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)} className={cls}>
      {checked && <Icon name="check" size={14} />}
    </button>
  );
}

export function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex size-4 flex-none items-center justify-center rounded-full border",
        checked ? "border-[3px] border-white" : "border-line-strong",
      )}
    />
  );
}

/* ---------- Card ---------- */

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-sm border border-line bg-card", className)}>{children}</div>;
}

/* ---------- Segmented toggle (Performance / Exchange toggles) ---------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  size?: "md" | "sm";
  className?: string;
}) {
  return (
    <div className={cn("inline-flex border border-line p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "t-b14 transition-colors",
            size === "md" ? "h-[33px] px-3.5" : "h-[29px] px-3",
            o.value === value ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Empty state (2065:4516) ---------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
  bordered = true,
  className,
}: {
  icon: IconName;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  bordered?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-sm px-10 py-20 text-center",
        bordered && "border border-line bg-card",
        className,
      )}
    >
      <span className="inline-flex size-12 items-center justify-center rounded-sm border border-line bg-raised text-white">
        <Icon name={icon} size={24} />
      </span>
      <div className="flex max-w-[460px] flex-col gap-2">
        <p className="t-h18">{title}</p>
        <p className="t-b16 text-white/60">{description}</p>
      </div>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ---------- PIN input (2058:3401) ---------- */

export function PinInput({ value, onChange, length = 6 }: { value: string; onChange: (v: string) => void; length?: number }) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(true);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className="relative flex gap-2.5" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        className="absolute inset-0 opacity-0"
        aria-label="PIN"
      />
      {Array.from({ length }, (_, i) => {
        const active = focused && i === Math.min(value.length, length - 1) && value.length < length;
        const filled = i < value.length;
        return (
          <span
            key={i}
            className={cn(
              "flex h-20 w-16 items-center justify-center rounded-sm border bg-field",
              active ? "border-brand" : "border-line",
            )}
          >
            {active ? (
              <span className="caret-blink h-8 w-[2px] bg-brand" />
            ) : (
              <span className={cn("t-d32", filled ? "text-white" : "text-white/30")}>•</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/* ---------- Modal shell ---------- */

export function Modal({ children, onClose, width = 560, className }: { children: ReactNode; onClose: () => void; width?: number; className?: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="anim-fade fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-scrim p-6 pt-[100px]" onMouseDown={onClose}>
      <div
        className={cn("anim-rise rounded-sm border border-line bg-screen", className)}
        style={{ width }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- Dropdown (filters, sort) ---------- */

export function Dropdown<T extends string>({
  value,
  onChange,
  options,
  icon,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  icon?: IconName;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);
  const current = options.find((o) => o.value === value);
  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "t-b14 flex h-10 w-full items-center gap-2 rounded-sm border bg-raised px-3 text-white/80 transition-colors hover:bg-hover",
          open ? "border-white/30" : "border-line",
        )}
      >
        {icon && <Icon name={icon} size={16} className="opacity-70" />}
        <span className="flex-1 text-left whitespace-nowrap">{current?.label}</span>
        <Icon name="menu-chevron-down" size={20} className={cn("opacity-60 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="anim-fade absolute right-0 z-30 mt-1 flex min-w-full flex-col rounded-sm border border-line bg-[#0f1316] p-1 shadow-2xl">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={cn("t-b14 flex h-9 items-center justify-between gap-6 rounded-sm px-2.5 text-left whitespace-nowrap hover:bg-white/5", o.value === value && "text-white")}
            >
              {o.label}
              {o.value === value && <Icon name="check" size={16} className="text-white/80" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

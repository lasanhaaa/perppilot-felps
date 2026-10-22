"use client";

import { useId, useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";

export function FieldLabel({ htmlFor, children, className }: { htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("text-[14px] leading-[1.5] font-medium uppercase text-white/90", className)}>
      {children}
    </label>
  );
}

/** Auth style input: label above, 1px border at 10% white, 55px tall. */
export function TextField({
  label,
  hint,
  error,
  className,
  inputClassName,
  ...rest
}: { label: ReactNode; hint?: ReactNode; error?: string; inputClassName?: string } & ComponentProps<"input">) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        className={cn(
          "h-[55px] w-full border border-line bg-transparent px-4 text-[14px] text-white outline-none transition-colors placeholder:text-white/40 hover:border-white/20 focus:border-brand/70",
          error && "border-danger/70",
          inputClassName,
        )}
        {...rest}
      />
      {(error || hint) && (
        <p id={`${id}-msg`} className={cn("text-[13px]", error ? "text-danger" : "text-white/40")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

/** Six boxes for the PIN screens. Digits are kept in a string. */
export function PinInput({
  value,
  onChange,
  length = 6,
  autoFocus,
  label = "PIN",
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  label?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const setAt = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, length));
  };

  return (
    <div role="group" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          aria-label={`${label} digit ${i + 1}`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          value={d}
          onChange={(e) => {
            const digit = e.target.value.replace(/\D/g, "").slice(-1);
            setAt(i, digit);
            if (digit && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (!pasted) return;
            e.preventDefault();
            onChange(pasted);
            refs.current[Math.min(pasted.length, length - 1)]?.focus();
          }}
          placeholder="0"
          className="aspect-[68/92] w-full min-w-0 bg-fill-2 text-center font-display text-[28px] text-white caret-brand outline-none placeholder:text-white/20 focus:bg-fill-3 focus:ring-1 focus:ring-brand/60"
        />
      ))}
    </div>
  );
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-[14px] text-white/60 select-none">
      <span className={cn("grid size-5 place-items-center border transition-colors", checked ? "border-brand bg-brand text-black" : "border-white/20 bg-fill-2")}>
        {checked && <Icon name="check" size={16} />}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}

/** Radio row with the blue ring when selected (Spread mode, Cloning speed). */
export function RadioRow({
  checked,
  onSelect,
  title,
  description,
  children,
  name,
}: {
  checked: boolean;
  onSelect: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  name: string;
}) {
  return (
    <label className={cn("flex cursor-pointer gap-3 px-3 py-3 transition-colors", checked ? "bg-fill-3" : "bg-fill-2 hover:bg-fill-3")}>
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="peer sr-only" />
      <span
        aria-hidden
        className={cn(
          "mt-[3px] grid size-4 shrink-0 place-items-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand",
          checked ? "border-info border-[3px]" : "border-white/30",
        )}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn("text-[16px] leading-[1.4]", checked ? "text-white" : "text-white/70")}>{title}</span>
        {description && <span className="text-[14px] text-white/50">{description}</span>}
        {children}
      </span>
    </label>
  );
}

/** Value card with +/- buttons (min/max price, position size, leverage). */
export function StepperCard({
  label,
  value,
  sub,
  onIncrement,
  onDecrement,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  onIncrement: () => void;
  onDecrement: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 bg-fill-2 p-4", className)}>
      <div className="flex min-w-0 flex-col gap-2">
        <span className="text-[12px] font-medium uppercase text-white/50">{label}</span>
        <span className="font-display text-[24px] leading-[1.2] tabular">{value}</span>
        {sub}
      </div>
      <div className="flex flex-col gap-1.5">
        <button type="button" aria-label="Increase" onClick={onIncrement} className="grid size-8 place-items-center bg-fill-2 text-white/80 hover:bg-white/10">
          <Icon name="add" size={20} />
        </button>
        <button type="button" aria-label="Decrease" onClick={onDecrement} className="grid size-8 place-items-center bg-fill-2 text-white/80 hover:bg-white/10">
          <Icon name="remove" size={20} />
        </button>
      </div>
    </div>
  );
}

/** Grey panel with title + description used across the create bot form. */
export function Section({ title, description, children, className, action }: { title?: ReactNode; description?: ReactNode; children?: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("bg-fill-2 p-4 sm:p-5", className)}>
      {(title || description) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="text-[16px] leading-[1.5] text-white">{title}</h3>}
            {description && <p className="text-[14px] leading-[1.5] text-white/50">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

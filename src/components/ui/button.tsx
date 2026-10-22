import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/icons";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-[0.01em] whitespace-nowrap transition-[background-color,color,opacity,filter] duration-150 disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-black hover:brightness-110 active:brightness-95",
  secondary: "bg-fill-2 text-white/80 hover:bg-white/10 hover:text-white",
  danger: "bg-danger text-black hover:brightness-110",
  ghost: "text-white/70 hover:text-white hover:bg-fill-2",
  light: "bg-white text-black hover:bg-white/90",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-12 px-4 text-[14px]",
  lg: "h-[55px] px-6 text-[16px]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  children?: ReactNode;
  className?: string;
};

function Content({ icon, iconRight, children, size }: Pick<CommonProps, "icon" | "iconRight" | "children" | "size">) {
  const iconSize = size === "sm" ? 18 : 20;
  return (
    <>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  children,
  className,
  type = "button",
  ...rest
}: CommonProps & Omit<ComponentProps<"button">, keyof CommonProps>) {
  return (
    <button type={type} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      <Content icon={icon} iconRight={iconRight} size={size}>
        {children}
      </Content>
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  children,
  className,
  ...rest
}: CommonProps & Omit<ComponentProps<typeof Link>, keyof CommonProps>) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      <Content icon={icon} iconRight={iconRight} size={size}>
        {children}
      </Content>
    </Link>
  );
}

/** Square icon-only button (close, back, stepper +/-). */
export function IconButton({
  icon,
  label,
  size = 40,
  iconSize = 24,
  className,
  ...rest
}: { icon: IconName; label: string; size?: number; iconSize?: number } & ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30",
        className,
      )}
      style={{ width: size, height: size }}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}

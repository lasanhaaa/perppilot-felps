"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "./button";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Green 1px line on top of the panel, as on the "Create a new bot" and video modals. */
  accent?: boolean;
  hideClose?: boolean;
};

export function Modal({ open, onClose, title, description, children, className, accent, hideClose }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panelRef.current?.querySelector<HTMLElement>("input, button:not([data-close]), [href], select, textarea");
    (first ?? panelRef.current)?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div aria-hidden className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "relative max-h-[92dvh] w-full animate-pop-in overflow-y-auto bg-[#141414] p-6 scrollbar-thin outline-none sm:w-auto",
          accent && "border-t border-brand",
          className,
        )}
      >
        {(title || !hideClose) && (
          <div className="mb-6 flex items-start justify-between gap-6">
            {title ? (
              <div className="flex flex-col gap-1">
                <h2 id={titleId} className="font-display text-[28px] leading-[1.2] tracking-[-0.02em] sm:text-[32px]">
                  {title}
                </h2>
                {description && <p className="text-[14px] leading-[1.5] text-white/60">{description}</p>}
              </div>
            ) : (
              <span />
            )}
            {!hideClose && <IconButton data-close icon="close" label="Close" onClick={onClose} className="-mr-2 -mt-1" />}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

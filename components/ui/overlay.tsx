"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/util";
import { XIcon } from "../icons";

interface Props {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** side: 데스크톱 오른쪽 패널 / center: 가운데 모달. 모바일에서는 둘 다 아래에서 올라오는 시트 */
  variant?: "side" | "center";
  size?: "md" | "lg";
}

export function Overlay({ open, onClose, title, children, footer, variant = "center", size = "md" }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-ink-950/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "absolute flex flex-col bg-white shadow-lift outline-none",
          "inset-x-0 bottom-0 max-h-[92dvh] animate-slide-up rounded-t-3xl",
          variant === "side"
            ? "md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[min(560px,100vw)] md:animate-slide-in-right md:rounded-none md:rounded-l-3xl"
            : cn(
                "md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[86vh] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl",
                size === "lg" ? "md:w-[720px]" : "md:w-[460px]",
              ),
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-ink-100 px-5 py-4">
          <div className="min-w-0 text-[17px] font-semibold text-ink-900">{title}</div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-500 hover:bg-ink-50 hover:text-ink-900"
            aria-label="닫기"
          >
            <XIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="border-t border-ink-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

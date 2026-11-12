"use client";

import { useRef } from "react";
import { cn, prettyDate, shortDate } from "@/lib/util";
import { CalendarIcon } from "../icons";

interface Props {
  label: string;
  value: string;
  min: string;
  max: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function DateField({ label, value, min, max, onChange, disabled, placeholder = "날짜 선택", className }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label
      className={cn(
        "relative flex cursor-pointer items-center gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3 transition hover:border-ink-300 has-[:focus-visible]:border-brand-500",
        disabled && "cursor-not-allowed bg-ink-50 opacity-60 hover:border-ink-200",
        className,
      )}
      onClick={() => {
        try {
          ref.current?.showPicker?.();
        } catch {
          /* 일부 브라우저는 showPicker 미지원 */
        }
      }}
    >
      <CalendarIcon className="shrink-0 text-ink-400" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-ink-500">{label}</span>
        <span className={cn("block truncate text-[17px] font-semibold", value ? "text-ink-900" : "font-medium text-ink-300")}>
          {disabled ? "편도" : value ? (
            <>
              <span className="sm:hidden">{shortDate(value)}</span>
              <span className="hidden sm:inline">{prettyDate(value)}</span>
            </>
          ) : (
            placeholder
          )}
        </span>
      </span>
      <input
        ref={ref}
        type="date"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label={label}
      />
    </label>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { CABIN_LABEL, MAX_PASSENGERS } from "@/lib/query";
import type { Cabin } from "@/lib/types";
import { cn } from "@/lib/util";
import { ChevronDown, UserIcon } from "../icons";

interface Props {
  adults: number;
  childCount: number;
  cabin: Cabin;
  onChange: (v: { adults: number; children: number; cabin: Cabin }) => void;
  compact?: boolean;
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const btn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-lg text-ink-700 transition hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-ink-200 disabled:hover:text-ink-700";
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-semibold text-ink-900">{label}</div>
        <div className="text-xs text-ink-500">{hint}</div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`${label} 감소`}>
          −
        </button>
        <span className="w-5 text-center font-semibold tabular-nums" aria-live="polite">
          {value}
        </span>
        <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`${label} 증가`}>
          +
        </button>
      </div>
    </div>
  );
}

export function PassengerField({ adults, childCount, cabin, onChange, compact }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const total = adults + childCount;
  const summary = `${childCount ? `성인 ${adults} · 소아 ${childCount}` : `성인 ${adults}명`}, ${CABIN_LABEL[cabin]}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-2 rounded-full text-sm font-medium transition",
          compact ? "px-3 py-1.5 text-ink-700 hover:bg-ink-50" : "px-3 py-1.5 text-ink-700 hover:bg-ink-50",
        )}
      >
        <UserIcon width={16} height={16} className="text-ink-400" />
        {summary}
        <ChevronDown width={14} height={14} className={cn("text-ink-400 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] animate-fade-in rounded-2xl border border-ink-200 bg-white p-4 shadow-lift sm:left-0 sm:right-auto">
          <div className="divide-y divide-ink-100">
            <Stepper
              label="성인"
              hint="만 12세 이상"
              value={adults}
              min={1}
              max={MAX_PASSENGERS - childCount}
              onChange={(n) => onChange({ adults: n, children: childCount, cabin })}
            />
            <Stepper
              label="소아"
              hint="만 2~11세 · 운임 약 75%"
              value={childCount}
              min={0}
              max={MAX_PASSENGERS - adults}
              onChange={(n) => onChange({ adults, children: n, cabin })}
            />
          </div>
          <div className="mt-3 border-t border-ink-100 pt-4">
            <div className="mb-2 text-sm font-semibold text-ink-900">좌석 등급</div>
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-ink-50 p-1">
              {(Object.keys(CABIN_LABEL) as Cabin[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange({ adults, children: childCount, cabin: c })}
                  className={cn(
                    "rounded-lg px-2 py-2 text-xs font-medium transition",
                    cabin === c ? "bg-white text-brand-700 shadow-sm" : "text-ink-500 hover:text-ink-800",
                  )}
                >
                  {c === "premium" ? "프리미엄" : CABIN_LABEL[c]}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-ink-400">최대 {MAX_PASSENGERS}명 · 현재 {total}명</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-white hover:bg-ink-800"
            >
              완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

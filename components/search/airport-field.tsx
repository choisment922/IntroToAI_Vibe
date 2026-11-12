"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { type Airport, searchAirports } from "@/lib/airports";
import { cn } from "@/lib/util";

interface Props {
  label: string;
  value: string;
  onChange: (code: string) => void;
  pool: Airport[];
  icon: React.ReactNode;
  placeholder: string;
  className?: string;
}

export function AirportField({ label, value, onChange, pool, icon, placeholder, className }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selected = pool.find((a) => a.code === value);
  const results = useMemo(() => searchAirports(query, pool), [query, pool]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function openPanel() {
    setQuery("");
    setActive(0);
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function choose(a: Airport) {
    onChange(a.code);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={openPanel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="group flex h-full w-full items-center gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-left transition hover:border-ink-300 focus-visible:border-brand-500"
      >
        <span className="text-ink-400 group-hover:text-ink-500">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-ink-500">{label}</span>
          {selected ? (
            <span className="flex items-baseline gap-1.5 truncate">
              <span className="text-[17px] font-semibold text-ink-900">{selected.city}</span>
              <span className="font-mono text-sm font-medium text-ink-500">{selected.code}</span>
            </span>
          ) : (
            <span className="block text-[17px] font-medium text-ink-300">{placeholder}</span>
          )}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-0 z-40 w-full min-w-[min(20rem,calc(100vw-2rem))] animate-fade-in overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-lift">
          <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3">
            <span className="text-brand-500">{icon}</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="도시, 공항 이름, 코드"
              className="w-full bg-transparent text-[16px] outline-none placeholder:text-ink-300"
              role="combobox"
              aria-controls={listId}
              aria-expanded
              aria-activedescendant={results[active] ? `${listId}-${results[active].code}` : undefined}
              aria-label={`${label} 검색`}
            />
          </div>
          <ul id={listId} role="listbox" className="max-h-72 overflow-y-auto py-1.5">
            {results.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-400">검색 결과가 없어요</li>}
            {results.map((a, i) => (
              <li
                key={a.code}
                id={`${listId}-${a.code}`}
                role="option"
                aria-selected={a.code === value}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(a)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-4 py-2.5",
                  i === active ? "bg-brand-50" : "",
                )}
              >
                <span className="inline-flex h-8 w-11 shrink-0 items-center justify-center rounded-lg bg-ink-50 font-mono text-xs font-semibold text-ink-700">
                  {a.code}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink-900">
                    {a.city} <span className="font-normal text-ink-400">· {a.country}</span>
                  </span>
                  <span className="block truncate text-xs text-ink-500">{a.name}</span>
                </span>
                {a.code === value && <span className="text-xs font-medium text-brand-600">선택됨</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

"use client";

import { getAirline } from "@/lib/airlines";
import { cn, wonShort } from "@/lib/util";
import { BagIcon, CheckIcon } from "../icons";
import { AirlineMark } from "../flight-parts";
import { EMPTY_FILTERS, type Filters, type Group, slotOf, TIME_SLOTS } from "./model";

interface Props {
  groups: Group[];
  filters: Filters;
  onChange: (f: Filters) => void;
  needBag: boolean;
  onNeedBag: (v: boolean) => void;
}

function toggle<T>(list: T[], v: T) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="border-b border-ink-100 py-5 last:border-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Check({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
        checked ? "border-brand-500 bg-brand-500 text-white" : "border-ink-300 bg-white",
      )}
    >
      {checked && <CheckIcon width={14} height={14} strokeWidth={2.6} />}
    </span>
  );
}

export function FiltersPanel({ groups, filters, onChange, needBag, onNeedBag }: Props) {
  const directMin = Math.min(...groups.filter((g) => g.itinerary.legs.every((l) => l.stops === 0)).map((g) => g.price));
  const anyMin = Math.min(...groups.map((g) => g.price));

  const airlineMap = new Map<string, number>();
  for (const g of groups) {
    const a = g.itinerary.airline;
    airlineMap.set(a, Math.min(airlineMap.get(a) ?? Infinity, g.price));
  }
  const airlines = [...airlineMap.entries()].sort((a, b) => a[1] - b[1]);

  const slotCounts = Object.fromEntries(TIME_SLOTS.map((s) => [s.id, 0])) as Record<string, number>;
  for (const g of groups) slotCounts[slotOf(g.itinerary.legs[0].dep)]++;

  const active = filters.directOnly || filters.slots.length > 0 || filters.airlines.length > 0;

  return (
    <div className="px-5 lg:px-0">
      <Section title="위탁 수하물">
        <button
          type="button"
          role="switch"
          aria-checked={needBag}
          onClick={() => onNeedBag(!needBag)}
          className={cn(
            "flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition",
            needBag ? "border-brand-300 bg-brand-50" : "border-ink-200 bg-white hover:border-ink-300",
          )}
        >
          <BagIcon className={needBag ? "text-brand-600" : "text-ink-400"} />
          <span className="flex-1">
            <span className="block text-sm font-semibold text-ink-900">수하물 1개 포함 가격으로 비교</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
              수하물이 빠진 운임에 추가 요금을 더해 순위를 다시 매겨요.
            </span>
          </span>
          <span
            className={cn(
              "relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition",
              needBag ? "bg-brand-500" : "bg-ink-200",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                needBag ? "left-[18px]" : "left-0.5",
              )}
            />
          </span>
        </button>
      </Section>

      <Section title="경유">
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: false, label: "전체", min: anyMin },
            { v: true, label: "직항만", min: directMin },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => onChange({ ...filters, directOnly: o.v })}
              disabled={!Number.isFinite(o.min)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-40",
                filters.directOnly === o.v ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-ink-200 hover:border-ink-300",
              )}
            >
              <span className="block text-sm font-semibold text-ink-900">{o.label}</span>
              <span className="block text-xs tabular-nums text-ink-500">
                {Number.isFinite(o.min) ? `${wonShort(o.min)}원~` : "없음"}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="가는 편 출발 시간">
        <div className="grid grid-cols-4 gap-1.5 lg:grid-cols-2">
          {TIME_SLOTS.map((s) => {
            const on = filters.slots.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                disabled={slotCounts[s.id] === 0}
                onClick={() => onChange({ ...filters, slots: toggle(filters.slots, s.id) })}
                className={cn(
                  "rounded-xl border px-2 py-2 text-center transition disabled:cursor-not-allowed disabled:opacity-35",
                  on ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500" : "border-ink-200 text-ink-700 hover:border-ink-300",
                )}
              >
                <span className="block text-sm font-semibold">{s.label}</span>
                <span className="block text-[11px] text-ink-500">{s.range}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="항공사"
        action={
          filters.airlines.length > 0 && (
            <button className="text-xs font-medium text-brand-600" onClick={() => onChange({ ...filters, airlines: [] })}>
              전체 선택
            </button>
          )
        }
      >
        <ul className="space-y-0.5">
          {airlines.map(([code, min]) => {
            const on = filters.airlines.includes(code);
            return (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => onChange({ ...filters, airlines: toggle(filters.airlines, code) })}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-ink-50"
                >
                  <Check checked={on} />
                  <AirlineMark code={code} size={24} />
                  <span className="flex-1 truncate text-sm text-ink-800">{getAirline(code).name}</span>
                  <span className="text-xs tabular-nums text-ink-500">{wonShort(min)}원</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      {active && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="mb-4 w-full rounded-xl border border-ink-200 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
        >
          필터 초기화
        </button>
      )}
    </div>
  );
}

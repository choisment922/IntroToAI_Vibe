"use client";

import { useEffect, useMemo, useState } from "react";
import { queryToParams } from "@/lib/query";
import type { CalendarDay, SearchQuery } from "@/lib/types";
import { addDays, cn, diffDays, parseYmd, todayKST, weekday, wonShort } from "@/lib/util";
import { CalendarIcon, ChevronLeft, ChevronRight } from "../icons";
import { Overlay } from "../ui/overlay";

/* ---------- 데이터 ---------- */

const memo = new Map<string, Promise<CalendarDay[]>>();

function calendarKey(q: SearchQuery, month: string) {
  const p = queryToParams(q);
  p.delete("depart");
  p.delete("return");
  if (q.trip === "round" && q.ret) p.set("stay", String(diffDays(q.depart, q.ret)));
  p.set("month", month);
  return p.toString();
}

function fetchMonth(q: SearchQuery, month: string) {
  const key = calendarKey(q, month);
  let p = memo.get(key);
  if (!p) {
    p = fetch(`/api/calendar?${key}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: { days: CalendarDay[] }) => d.days);
    p.catch(() => memo.delete(key));
    memo.set(key, p);
  }
  return p;
}

function useMonths(q: SearchQuery, months: string[]) {
  const id = calendarKey(q, months.join(","));
  const [data, setData] = useState<{ id: string; days: CalendarDay[] } | null>(null);
  useEffect(() => {
    let alive = true;
    Promise.all(months.map((m) => fetchMonth(q, m)))
      .then((all) => alive && setData({ id, days: all.flat() }))
      .catch(() => alive && setData({ id, days: [] }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return data?.id === id ? data.days : null;
}

/** 가격 구간: 하위 30% 저렴, 상위 30% 비쌈 */
function tiers(days: CalendarDay[]) {
  const prices = days.flatMap((d) => (d.price ? [d.price] : [])).sort((a, b) => a - b);
  if (prices.length === 0) return { low: 0, high: Infinity, min: 0 };
  return {
    low: prices[Math.floor(prices.length * 0.3)],
    high: prices[Math.floor(prices.length * 0.7)],
    min: prices[0],
  };
}

function tierOf(price: number | null, t: ReturnType<typeof tiers>) {
  if (price === null) return "none";
  if (price <= t.low) return "low";
  if (price >= t.high) return "high";
  return "mid";
}

const TIER_CLASS = {
  low: "bg-mint-50 text-mint-700",
  mid: "bg-white text-ink-700",
  high: "bg-coral-50 text-coral-600",
  none: "bg-transparent text-ink-300",
};

/* ---------- 결과 상단 날짜 스트립 ---------- */

export function DateStrip({ query, onPick, onOpenCalendar }: { query: SearchQuery; onPick: (d: string) => void; onOpenCalendar: () => void }) {
  const range = useMemo(() => Array.from({ length: 15 }, (_, i) => addDays(query.depart, i - 7)), [query.depart]);
  const months = useMemo(() => [...new Set(range.map((d) => d.slice(0, 7)))], [range]);
  const days = useMonths(query, months);
  const byDate = useMemo(() => new Map((days ?? []).map((d) => [d.date, d.price])), [days]);
  const visible = range.map((date) => ({ date, price: byDate.get(date) ?? null }));
  const t = tiers(visible);
  const today = todayKST();

  return (
    <div className="flex items-stretch gap-2">
      <div className="no-scrollbar -mx-1 flex flex-1 snap-x gap-1.5 overflow-x-auto px-1 py-1">
        {visible.map(({ date, price }) => {
          const past = diffDays(today, date) < 0;
          const sel = date === query.depart;
          const tier = tierOf(price, t);
          const d = parseYmd(date);
          return (
            <button
              key={date}
              type="button"
              disabled={past || price === null}
              onClick={() => onPick(date)}
              ref={sel ? (el) => el?.scrollIntoView({ inline: "center", block: "nearest" }) : undefined}
              className={cn(
                "flex w-[4.6rem] shrink-0 snap-center flex-col items-center rounded-2xl border px-1 py-2 transition disabled:cursor-not-allowed",
                sel ? "border-ink-900 bg-ink-900 text-white" : cn("border-ink-100 hover:border-ink-300", TIER_CLASS[tier]),
                past && "opacity-40",
              )}
            >
              <span className={cn("text-[11px]", sel ? "text-white/70" : "text-ink-500")}>
                {d.getUTCMonth() + 1}/{d.getUTCDate()} ({weekday(date)})
              </span>
              <span className="mt-0.5 text-sm font-semibold tabular-nums">
                {days === null ? <span className="skeleton inline-block h-4 w-10 rounded" /> : price ? wonShort(price) : "–"}
              </span>
              {price !== null && price === t.min && !sel && <span className="mt-0.5 text-[10px] font-semibold text-mint-600">최저</span>}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onOpenCalendar}
        className="flex w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-ink-100 bg-white text-[11px] font-medium text-ink-600 transition hover:border-brand-300 hover:text-brand-600"
      >
        <CalendarIcon width={18} height={18} />
        달력
      </button>
    </div>
  );
}

/* ---------- 한 달 캘린더 ---------- */

function shiftMonth(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function MonthGrid({ query, month, onPick }: { query: SearchQuery; month: string; onPick: (d: string) => void }) {
  const days = useMonths(query, [month]);
  const t = tiers(days ?? []);
  const [y, m] = month.split("-").map(Number);
  const lead = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const byDate = new Map((days ?? []).map((d) => [d.date, d.price]));

  return (
    <div>
      <div className="mb-2 text-center text-sm font-semibold text-ink-900">
        {y}년 {m}월
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-ink-400">
        {["일", "월", "화", "수", "목", "금", "토"].map((w, i) => (
          <div key={w} className={cn("py-1", i === 0 && "text-coral-500", i === 6 && "text-brand-500")}>
            {w}
          </div>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, "0")}`;
          const price = byDate.get(date) ?? null;
          const tier = tierOf(price, t);
          const sel = date === query.depart;
          return (
            <button
              key={date}
              type="button"
              disabled={price === null}
              onClick={() => onPick(date)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-xl text-xs transition disabled:cursor-default",
                sel ? "bg-ink-900 text-white" : cn(TIER_CLASS[tier], price !== null && "ring-1 ring-ink-100 hover:ring-ink-400"),
              )}
            >
              <span className="font-semibold">{i + 1}</span>
              <span className="text-[10px] tabular-nums">
                {days === null ? "" : price ? wonShort(price) : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarModal({
  open,
  onClose,
  query,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  query: SearchQuery;
  onPick: (d: string) => void;
}) {
  const [month, setMonth] = useState(query.depart.slice(0, 7));
  const thisMonth = todayKST().slice(0, 7);
  const stay = query.trip === "round" && query.ret ? diffDays(query.depart, query.ret) : null;

  return (
    <Overlay
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span>
          날짜별 최저가
          <span className="block text-xs font-normal text-ink-500">
            {stay !== null ? `${stay}박 ${stay + 1}일 왕복 기준` : "편도 기준"} · 전 인원 최종 결제 금액
          </span>
        </span>
      }
    >
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            disabled={month <= thisMonth}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-30"
            aria-label="이전 달"
          >
            <ChevronLeft width={18} height={18} />
          </button>
          <div className="flex gap-3 text-[11px] text-ink-500">
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-mint-50 ring-1 ring-mint-100" />
              저렴
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-white ring-1 ring-ink-200" />
              보통
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-coral-50 ring-1 ring-coral-500/20" />
              비쌈
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-600 hover:bg-ink-50"
            aria-label="다음 달"
          >
            <ChevronRight width={18} height={18} />
          </button>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <MonthGrid query={query} month={month} onPick={onPick} />
          <div className="hidden md:block">
            <MonthGrid query={query} month={shiftMonth(month, 1)} onPick={onPick} />
          </div>
        </div>
        <p className="mt-4 text-xs text-ink-500">
          가는 날을 누르면 같은 여행 기간으로 다시 검색해요. 가격은 수하물 비용을 제외한 판매처 최저 결제 금액이에요.
        </p>
      </div>
    </Overlay>
  );
}

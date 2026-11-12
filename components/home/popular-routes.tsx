"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { browser } from "react-dom";
import { getDestination } from "@/lib/airports";
import { searchHref } from "@/lib/query";
import type { CalendarDay } from "@/lib/types";
import { addDays, shortDate, todayKST, won } from "@/lib/util";
import { ArrowRight } from "../icons";

const ROUTES = [
  { to: "NRT", stay: 3, tint: ["#ff7a59", "#ffb347"] },
  { to: "KIX", stay: 3, tint: ["#f15b8a", "#ff9a8b"] },
  { to: "FUK", stay: 2, tint: ["#5b7cfa", "#8fb3ff"] },
  { to: "DAD", stay: 4, tint: ["#0fb59a", "#7be0c3"] },
  { to: "BKK", stay: 4, tint: ["#8e5cf7", "#c4a3ff"] },
  { to: "TPE", stay: 3, tint: ["#2fa5d6", "#88d6f2"] },
  { to: "CEB", stay: 4, tint: ["#00a3a3", "#6fe3d6"] },
  { to: "CDG", stay: 7, tint: ["#2f4bd6", "#7b8dff"] },
] as const;

interface Deal {
  to: string;
  date: string;
  price: number;
}

async function cheapestIn(to: string, stay: number, today: string): Promise<Deal | null> {
  // 2~8주 뒤 구간에서 가장 싼 출발일
  const start = addDays(today, 14);
  const end = addDays(today, 56);
  const months = [...new Set([start.slice(0, 7), addDays(today, 35).slice(0, 7), end.slice(0, 7)])];
  const all = await Promise.all(
    months.map((m) =>
      fetch(`/api/calendar?from=ICN&to=${to}&trip=round&stay=${stay}&month=${m}`)
        .then((r) => (r.ok ? r.json() : { days: [] }))
        .then((d: { days: CalendarDay[] }) => d.days),
    ),
  );
  const days = all.flat().filter((d) => d.price !== null && d.date >= start && d.date <= end);
  if (!days.length) return null;
  const best = days.reduce((a, b) => (b.price! < a.price! ? b : a));
  return { to, date: best.date, price: best.price! };
}

export function PopularRoutes() {
  use(browser("노선별 최저가는 오늘 날짜를 기준으로 계산합니다."));
  const [today] = useState(todayKST);
  const [deals, setDeals] = useState<Record<string, Deal | null>>({});

  useEffect(() => {
    let alive = true;
    for (const r of ROUTES) {
      cheapestIn(r.to, r.stay, today).then((d) => alive && setDeals((prev) => ({ ...prev, [r.to]: d })));
    }
    return () => {
      alive = false;
    };
  }, [today]);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {ROUTES.map((r) => {
        const dest = getDestination(r.to)!;
        const deal = deals[r.to];
        const depart = deal?.date ?? addDays(today, 28);
        const href = searchHref({
          from: "ICN",
          to: r.to,
          trip: "round",
          depart,
          ret: addDays(depart, r.stay),
          adults: 1,
          children: 0,
          cabin: "economy",
        });
        return (
          <Link
            key={r.to}
            href={href}
            className="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-3xl p-4 text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lift sm:aspect-[5/6]"
            style={{ background: `linear-gradient(150deg, ${r.tint[0]}, ${r.tint[1]})` }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-6 -right-3 font-mono text-[5.5rem] font-black leading-none text-white/15 transition group-hover:text-white/25"
            >
              {r.to}
            </span>
            <div>
              <div className="text-xs font-medium text-white/80">{dest.country}</div>
              <div className="text-xl font-bold tracking-tight">{dest.city}</div>
              <div className="text-xs text-white/75">
                {r.stay}박 {r.stay + 1}일 왕복
              </div>
            </div>
            <div className="relative">
              {deal === undefined ? (
                <div className="h-11 w-28 animate-pulse rounded-lg bg-white/20" />
              ) : deal ? (
                <>
                  <div className="text-[11px] text-white/80">{shortDate(deal.date)} 출발</div>
                  <div className="text-lg font-bold tabular-nums">{won(deal.price)}~</div>
                </>
              ) : (
                <div className="text-sm text-white/85">최저가 보기</div>
              )}
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white/90">
                검색하기 <ArrowRight width={14} height={14} className="transition group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function PopularRoutesFallback() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-hidden>
      {ROUTES.map((r) => (
        <div key={r.to} className="skeleton aspect-[4/5] rounded-3xl sm:aspect-[5/6]" />
      ))}
    </div>
  );
}

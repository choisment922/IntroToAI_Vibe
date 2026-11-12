"use client";

import Link from "next/link";
import { use, useState } from "react";
import { browser } from "react-dom";
import { getAirport } from "@/lib/airports";
import { searchHref } from "@/lib/query";
import { diffDays, shortDate, todayKST } from "@/lib/util";
import { ClockIcon } from "../icons";
import { loadRecent } from "../results/use-search-stream";
import { defaultQuery, SearchForm } from "../search/search-form";

export function HomeSearch() {
  use(browser("기본 여행 날짜와 최근 검색은 사용자의 기기에서 계산합니다."));
  const [initial] = useState(() => {
    const recent = loadRecent().find((q) => diffDays(todayKST(), q.depart) >= 0);
    return recent ?? defaultQuery();
  });
  const [recent] = useState(() => loadRecent().filter((q) => diffDays(todayKST(), q.depart) >= 0).slice(0, 4));

  return (
    <>
      <SearchForm initial={initial} />
      {recent.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 text-white/60">
            <ClockIcon width={14} height={14} /> 최근 검색
          </span>
          {recent.map((q) => (
            <Link
              key={searchHref(q)}
              href={searchHref(q)}
              className="rounded-full bg-white/10 px-3 py-1.5 text-white/90 ring-1 ring-white/15 transition hover:bg-white/20"
            >
              {getAirport(q.to)?.city} · {shortDate(q.depart)}
              {q.ret ? `–${shortDate(q.ret).split(" ")[0]}` : ""}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export function HomeSearchFallback() {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-lift sm:p-5" aria-hidden>
      <div className="mb-3 flex justify-between">
        <div className="skeleton h-9 w-36 rounded-full" />
        <div className="skeleton h-9 w-40 rounded-full" />
      </div>
      <div className="grid gap-2 lg:grid-cols-[1fr_1fr_0.85fr_0.85fr_auto]">
        <div className="skeleton h-[66px] rounded-2xl" />
        <div className="skeleton h-[66px] rounded-2xl" />
        <div className="skeleton h-[66px] rounded-2xl" />
        <div className="skeleton h-[66px] rounded-2xl" />
        <div className="h-14 rounded-2xl bg-brand-500 lg:h-auto lg:w-[110px]" />
      </div>
    </div>
  );
}

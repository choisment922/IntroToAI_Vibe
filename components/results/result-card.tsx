"use client";

import { getAirline } from "@/lib/airlines";
import { cn, won } from "@/lib/util";
import { BagIcon, ChevronRight } from "../icons";
import { AirlineMark, LegSummary } from "../flight-parts";
import type { Group } from "./model";

interface Props {
  group: Group;
  pax: number;
  needBag: boolean;
  tags: string[];
  onSelect: () => void;
}

const TAG_STYLE: Record<string, string> = {
  최저가: "bg-sun-100 text-sun-700",
  최단시간: "bg-brand-100 text-brand-700",
  추천: "bg-mint-100 text-mint-700",
};

export function ResultCard({ group, pax, needBag, tags, onSelect }: Props) {
  const { itinerary, offers, best, price, minDisplay } = group;
  const airline = getAirline(itinerary.airline);
  const gap = price - minDisplay;
  const bagState = best.baggageIncluded ? "included" : needBag ? "added" : "excluded";

  return (
    <article className="group animate-fade-in overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card transition hover:border-ink-200 hover:shadow-lift">
      <button type="button" onClick={onSelect} className="block w-full text-left" aria-label={`${airline.name} 항공편 상세 보기`}>
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <AirlineMark code={itinerary.airline} size={28} />
              <span className="text-sm font-semibold text-ink-800">{airline.name}</span>
              {airline.lcc && <span className="rounded-md bg-ink-50 px-1.5 py-0.5 text-[11px] font-medium text-ink-500">LCC</span>}
              {tags.map((t) => (
                <span key={t} className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", TAG_STYLE[t])}>
                  {t}
                </span>
              ))}
            </div>
            <div className="space-y-3">
              {itinerary.legs.map((leg, i) => (
                <LegSummary key={i} leg={leg} label={itinerary.legs.length > 1 ? (i === 0 ? "가는 편" : "오는 편") : undefined} />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-dashed border-ink-200 bg-ink-50/50 p-4 sm:px-5 md:w-60 md:flex-col md:items-end md:justify-center md:border-l md:border-t-0">
            <div className="md:text-right">
              <div className="text-[11px] font-medium text-ink-500">
                최종 결제 금액{pax > 1 ? ` · ${pax}명` : ""}
              </div>
              <div className="text-[22px] font-bold leading-tight tracking-tight tabular-nums text-ink-900">{won(price)}</div>
              {pax > 1 && <div className="text-xs tabular-nums text-ink-500">1인 약 {won(Math.round(price / pax / 10) * 10)}</div>}
              {gap > 1000 && (
                <div className="mt-1 text-[11px] leading-snug text-coral-600">
                  목록 표시가 {won(minDisplay)}보다 <b>+{won(gap)}</b>
                </div>
              )}
              <div
                className={cn(
                  "mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium",
                  bagState === "included" ? "text-mint-600" : bagState === "added" ? "text-brand-600" : "text-ink-500",
                )}
              >
                <BagIcon width={13} height={13} />
                {bagState === "included" ? "위탁 수하물 포함" : bagState === "added" ? "수하물 요금 반영됨" : "위탁 수하물 별도"}
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white transition group-hover:bg-brand-500">
              {offers.length}곳 비교
              <ChevronRight width={16} height={16} />
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}

export function ResultSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <div className="skeleton h-7 w-7 rounded-lg" />
        <div className="skeleton h-4 w-24 rounded" />
      </div>
      <div className="flex items-center gap-4">
        <div className="skeleton h-10 w-16 rounded-lg" />
        <div className="skeleton h-2 flex-1 rounded" />
        <div className="skeleton h-10 w-16 rounded-lg" />
        <div className="skeleton ml-6 hidden h-12 w-36 rounded-xl md:block" />
      </div>
    </div>
  );
}

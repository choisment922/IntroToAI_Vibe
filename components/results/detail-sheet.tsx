"use client";

import { useState } from "react";
import { getAirline } from "@/lib/airlines";
import { getAirport } from "@/lib/airports";
import { queryToParams } from "@/lib/query";
import type { FxInfo, Leg, Offer, SearchQuery, Seller } from "@/lib/types";
import { clockKST, cn, duration, hhmm, prettyDate, won } from "@/lib/util";
import { BagIcon, BellIcon, ChevronDown, ClockIcon, ExternalIcon, InfoIcon } from "../icons";
import { AirlineMark, dayShift } from "../flight-parts";
import { Overlay } from "../ui/overlay";
import { type Group, offerPrice } from "./model";
import type { SellerStatus } from "./use-search-stream";

interface Props {
  group: Group | null;
  query: SearchQuery;
  sellers: Seller[];
  status: Record<string, SellerStatus>;
  fx: FxInfo | null;
  needBag: boolean;
  onClose: () => void;
  onAlert: () => void;
}

function sellerLabel(o: Offer, sellers: Seller[], airlineCode: string) {
  if (o.sellerId === "airline") return `${getAirline(airlineCode).name} 공식`;
  return sellers.find((s) => s.id === o.sellerId)?.name ?? o.sellerId;
}

function LegTimeline({ leg, title }: { leg: Leg; title: string }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h4 className="text-sm font-semibold text-ink-900">
          {title} <span className="ml-1 font-normal text-ink-500">{prettyDate(leg.dep.slice(0, 10))}</span>
        </h4>
        <span className="text-xs text-ink-500">총 {duration(leg.durationMin)}</span>
      </div>
      <ol className="relative space-y-0">
        {leg.segments.map((s, i) => {
          const from = getAirport(s.from);
          const to = getAirport(s.to);
          const lay = leg.layovers[i];
          const arrShift = dayShift({ ...leg, dep: leg.dep, arr: s.arr });
          return (
            <li key={s.flightNo + i}>
              <div className="grid grid-cols-[3.25rem_1rem_1fr] gap-x-3">
                <div className="text-right text-[15px] font-semibold tabular-nums text-ink-900">{hhmm(s.dep)}</div>
                <div className="flex flex-col items-center pt-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-ink-900 bg-white" />
                  <span className="w-px flex-1 bg-ink-200" />
                </div>
                <div className="pb-4">
                  <div className="text-[15px] font-semibold text-ink-900">
                    {from?.city} <span className="font-mono text-sm font-medium text-ink-500">{s.from}</span>
                  </div>
                  <div className="text-xs text-ink-500">{from?.name}</div>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs text-ink-600">
                    <AirlineMark code={s.airline} size={18} />
                    {getAirline(s.airline).name} · <span className="font-mono">{s.flightNo}</span> · {duration(s.durationMin)}
                  </div>
                </div>
                <div className="text-right text-[15px] font-semibold tabular-nums text-ink-900">
                  {hhmm(s.arr)}
                  {arrShift > 0 && <sup className="text-[10px] text-coral-600">+{arrShift}</sup>}
                </div>
                <div className="flex justify-center pt-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-ink-900" />
                </div>
                <div className="pb-2">
                  <div className="text-[15px] font-semibold text-ink-900">
                    {to?.city} <span className="font-mono text-sm font-medium text-ink-500">{s.to}</span>
                  </div>
                  <div className="text-xs text-ink-500">{to?.name}</div>
                </div>
              </div>
              {lay && (
                <div className="my-3 ml-[4.25rem] flex items-center gap-2 rounded-xl border border-dashed border-coral-500/40 bg-coral-50 px-3 py-2 text-xs text-coral-600">
                  <ClockIcon width={14} height={14} />
                  {getAirport(lay.airport)?.city}에서 {duration(lay.minutes)} 대기
                  {lay.minutes >= 240 && " · 긴 대기"}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function OfferRow({
  offer,
  rank,
  label,
  query,
  needBag,
  fx,
  defaultOpen,
}: {
  offer: Offer;
  rank: number;
  label: string;
  query: SearchQuery;
  needBag: boolean;
  fx: FxInfo | null;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const price = offerPrice(offer, needBag);
  const b = offer.breakdown;
  const gap = price - offer.displayKRW;
  const href = `/api/out?${new URLSearchParams({
    seller: offer.sellerId,
    itinerary: offer.itineraryId,
    price: String(price),
    q: queryToParams(query).toString(),
  }).toString()}`;

  const rows: [string, number, string?][] = [
    ["항공 운임", b.fare],
    ["세금·유류할증료", b.taxes],
  ];
  if (b.ticketingFee) rows.push([offer.sellerId === "farehub" ? "서비스 수수료" : "발권 수수료", b.ticketingFee]);
  if (b.paymentFee) rows.push([offer.sellerId === "farehub" ? "해외 결제 수수료 (1.5%)" : "카드 결제 수수료", b.paymentFee]);
  if (needBag && !offer.baggageIncluded) rows.push(["위탁 수하물 1개 (사전 구매)", offer.baggageFeeKRW]);

  return (
    <li className={cn("rounded-2xl border p-4 transition", rank === 0 ? "border-brand-200 bg-brand-50/40" : "border-ink-100 bg-white")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-ink-900">{label}</span>
            {rank === 0 && <span className="rounded-full bg-sun-100 px-2 py-0.5 text-[11px] font-semibold text-sun-700">최저가</span>}
            {offer.currency === "USD" && (
              <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-600">USD 결제</span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-ink-500">{offer.fareName}</div>
          <div
            className={cn(
              "mt-1.5 inline-flex items-center gap-1 text-xs font-medium",
              offer.baggageIncluded ? "text-mint-600" : "text-ink-500",
            )}
          >
            <BagIcon width={13} height={13} />
            {offer.baggageIncluded ? "위탁 수하물 포함" : `수하물 별도 (+${won(offer.baggageFeeKRW)})`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold tabular-nums text-ink-900">{won(price)}</div>
          {gap > 0 && (
            <div className="text-[11px] tabular-nums text-ink-500">
              표시가 <span className="line-through decoration-coral-500/60">{won(offer.displayKRW)}</span>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-3 flex w-full items-center justify-between rounded-lg text-xs font-medium text-ink-600 hover:text-ink-900"
      >
        <span>
          결제 금액 구성 {gap > 0 && <span className="text-coral-600">· 표시가 대비 +{won(gap)}</span>}
        </span>
        <ChevronDown width={14} height={14} className={cn("transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-2 animate-fade-in rounded-xl bg-white p-3 text-xs ring-1 ring-ink-100">
          <div className="mb-2 flex justify-between text-ink-500">
            <span>판매처 표시 금액 ({offer.displayNote})</span>
            <span className="tabular-nums">{won(offer.displayKRW)}</span>
          </div>
          <dl className="space-y-1.5 border-t border-ink-100 pt-2">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between text-ink-700">
                <dt>{k}</dt>
                <dd className="tabular-nums">{won(v)}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-ink-100 pt-1.5 font-semibold text-ink-900">
              <dt>최종 결제 금액</dt>
              <dd className="tabular-nums">{won(price)}</dd>
            </div>
          </dl>
          {offer.currency === "USD" && offer.originalAmount && fx && (
            <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
              판매처 표시 ${offer.originalAmount.toFixed(2)} · 1 USD = {fx.usdKrw.toLocaleString("ko-KR")}원 ({clockKST(fx.asOf)} 기준) 환산.
              실제 청구액은 카드사 환율에 따라 달라질 수 있어요.
            </p>
          )}
        </div>
      )}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "mt-3 flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold transition",
          rank === 0 ? "bg-brand-500 text-white hover:bg-brand-600" : "bg-ink-900 text-white hover:bg-ink-800",
        )}
      >
        {label}에서 예약하기
        <ExternalIcon width={15} height={15} />
      </a>
    </li>
  );
}

export function DetailSheet({ group, query, sellers, status, fx, needBag, onClose, onAlert }: Props) {
  if (!group) return null;
  const { itinerary, offers } = group;
  const airline = getAirline(itinerary.airline);
  const fetched = offers
    .map((o) => status[o.sellerId])
    .flatMap((s) => (s?.state === "done" ? [s.fetchedAt] : []))
    .sort()[0];
  const missing = sellers.filter((s) => status[s.id]?.state === "error");

  return (
    <Overlay
      open
      onClose={onClose}
      variant="side"
      title={
        <span className="flex items-center gap-2.5">
          <AirlineMark code={itinerary.airline} size={30} />
          <span>
            {airline.name}
            <span className="block text-xs font-normal text-ink-500">
              {itinerary.legs.map((l) => l.segments.map((s) => s.flightNo).join("·")).join(" / ")}
            </span>
          </span>
        </span>
      }
    >
      <div className="space-y-6 p-5">
        <section className="space-y-6 rounded-2xl border border-ink-100 p-4">
          {itinerary.legs.map((leg, i) => (
            <LegTimeline key={i} leg={leg} title={itinerary.legs.length > 1 ? (i === 0 ? "가는 편" : "오는 편") : "여정"} />
          ))}
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h3 className="font-semibold text-ink-900">판매처별 최종 결제 금액</h3>
            <span className="text-xs text-ink-500">{offers.length}곳 · 낮은 가격순</span>
          </div>
          <ul className="space-y-3">
            {offers.map((o, i) => (
              <OfferRow
                key={o.id}
                offer={o}
                rank={i}
                label={sellerLabel(o, sellers, itinerary.airline)}
                query={query}
                needBag={needBag}
                fx={fx}
                defaultOpen={i === 0}
              />
            ))}
          </ul>
          {missing.length > 0 && (
            <p className="mt-3 text-xs text-ink-500">
              {missing.map((s) => s.name).join(", ")}은(는) 응답이 없어 비교에서 제외됐어요.
            </p>
          )}
        </section>

        <button
          type="button"
          onClick={onAlert}
          className="flex w-full items-center gap-3 rounded-2xl border border-ink-200 p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <BellIcon />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-ink-900">아직 비싸다면, 가격 알림 받기</span>
            <span className="block text-xs text-ink-500">이 노선이 목표 가격 아래로 내려가면 이메일로 알려드려요.</span>
          </span>
        </button>

        <p className="flex gap-2 rounded-xl bg-ink-50 p-3 text-xs leading-relaxed text-ink-500">
          <InfoIcon width={16} height={16} className="shrink-0" />
          <span>
            {fetched ? `${clockKST(fetched)} 조회 기준 가격입니다. ` : ""}실제 가격과 좌석은 예약처에서 달라질 수 있으며, 결제는 각 판매처에서
            진행됩니다.
          </span>
        </p>
      </div>
    </Overlay>
  );
}

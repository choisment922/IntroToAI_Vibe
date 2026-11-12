"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getAirport } from "@/lib/airports";
import { CABIN_LABEL, parseQuery, searchHref, shiftDepart } from "@/lib/query";
import type { SearchQuery } from "@/lib/types";
import { clockKST, cn, duration, shortDate, todayKST, won } from "@/lib/util";
import { AlertModal } from "../alerts/alert-modal";
import { AlertIcon, BellIcon, CheckIcon, ChevronDown, FilterIcon, InfoIcon, Spinner } from "../icons";
import { SearchForm } from "../search/search-form";
import { Overlay } from "../ui/overlay";
import { CalendarModal, DateStrip } from "./calendar";
import { DetailSheet } from "./detail-sheet";
import { FiltersPanel } from "./filters-panel";
import { applyFilters, buildGroups, EMPTY_FILTERS, type Filters, type SortKey, sortGroups } from "./model";
import { ResultCard, ResultSkeleton } from "./result-card";
import { type SearchState, useSearchStream } from "./use-search-stream";

const PAGE = 12;

export function SearchResults() {
  const sp = useSearchParams();
  const key = sp.toString();
  const parsed = useMemo(() => parseQuery(new URLSearchParams(key), todayKST()), [key]);

  if (!parsed.ok) return <InvalidQuery message={parsed.error} />;
  // 검색 조건이 바뀌면 필터·정렬 상태를 초기화
  return <Results key={key} query={parsed.query} />;
}

function InvalidQuery({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-start gap-3 rounded-2xl bg-coral-50 p-4 text-coral-600">
        <AlertIcon className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">검색 조건을 확인해 주세요</p>
          <p className="text-sm">{message}</p>
        </div>
      </div>
      <SearchForm initial={defaultFromToday()} />
    </div>
  );
}

function defaultFromToday(): SearchQuery {
  const today = todayKST();
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 28);
  const depart = d.toISOString().slice(0, 10);
  d.setUTCDate(d.getUTCDate() + 4);
  return { from: "ICN", to: "NRT", trip: "round", depart, ret: d.toISOString().slice(0, 10), adults: 1, children: 0, cabin: "economy" };
}

function Results({ query }: { query: SearchQuery }) {
  const router = useRouter();
  const [retry, setRetry] = useState(0);
  const state = useSearchStream(query, retry);
  const [sort, setSort] = useState<SortKey>("best");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [needBag, setNeedBag] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [editing, setEditing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  const groups = useMemo(() => buildGroups(state.itineraries, state.offers, needBag), [state.itineraries, state.offers, needBag]);
  const filtered = useMemo(() => applyFilters(groups, filters), [groups, filters]);
  const sorted = useMemo(() => sortGroups(filtered, sort), [filtered, sort]);

  const cheapest = useMemo(() => sortGroups(filtered, "price")[0], [filtered]);
  const fastest = useMemo(() => sortGroups(filtered, "fastest")[0], [filtered]);
  const best = sorted[0] && sort === "best" ? sorted[0] : sortGroups(filtered, "best")[0];
  const overallLowest = groups.length ? Math.min(...groups.map((g) => g.price)) : null;

  const pax = query.adults + query.children;
  const selected = groups.find((g) => g.itinerary.id === selectedId) ?? null;
  const loading = !state.done;
  const activeFilterCount = (filters.directOnly ? 1 : 0) + filters.slots.length + filters.airlines.length;

  const pickDate = (d: string) => {
    setCalendarOpen(false);
    router.push(searchHref(shiftDepart(query, d)));
  };

  const tagsFor = (id: string) => {
    const t: string[] = [];
    if (cheapest?.itinerary.id === id) t.push("최저가");
    if (fastest?.itinerary.id === id && fastest.itinerary.id !== cheapest?.itinerary.id) t.push("최단시간");
    if (best?.itinerary.id === id && !t.length) t.push("추천");
    return t;
  };

  return (
    <>
      <SummaryBar query={query} editing={editing} onToggle={() => setEditing((v) => !v)} />

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="pt-4">
          <DateStrip query={query} onPick={pickDate} onOpenCalendar={() => setCalendarOpen(true)} />
        </div>

        <SellerProgress state={state} onRetry={() => setRetry((r) => r + 1)} />

        <div className="mt-4 grid gap-6 lg:grid-cols-[17rem_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl border border-ink-100 bg-white px-5 shadow-card">
              {groups.length > 0 ? (
                <FiltersPanel groups={groups} filters={filters} onChange={setFilters} needBag={needBag} onNeedBag={setNeedBag} />
              ) : (
                <div className="space-y-4 py-5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="skeleton h-16 rounded-xl" />
                  ))}
                </div>
              )}
            </div>
          </aside>

          <main className="min-w-0">
            {/* 정렬 탭 */}
            <div className="mb-3 grid grid-cols-3 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
              {(
                [
                  ["best", "추천순", best],
                  ["price", "최저가순", cheapest],
                  ["fastest", "최단시간순", fastest],
                ] as const
              ).map(([k, label, g]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setSort(k);
                    setLimit(PAGE);
                  }}
                  aria-pressed={sort === k}
                  className={cn(
                    "relative border-r border-ink-100 px-2 py-3 text-center transition last:border-r-0 sm:px-4",
                    sort === k ? "bg-ink-900 text-white" : "hover:bg-ink-50",
                  )}
                >
                  <span className={cn("block text-xs font-medium sm:text-sm", sort === k ? "text-white/80" : "text-ink-500")}>{label}</span>
                  <span className="block text-sm font-bold tabular-nums sm:text-base">{g ? won(g.price) : "—"}</span>
                  <span className={cn("hidden text-[11px] sm:block", sort === k ? "text-white/60" : "text-ink-400")}>
                    {g ? duration(g.itinerary.totalDurationMin) : " "}
                  </span>
                </button>
              ))}
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-ink-500">
                {groups.length > 0 ? (
                  <>
                    항공편 <b className="text-ink-900">{filtered.length}</b>개
                    {filtered.length !== groups.length && <span className="text-ink-400"> / 전체 {groups.length}</span>}
                    {needBag && <span className="ml-1.5 text-brand-600">· 수하물 포함 가격</span>}
                  </>
                ) : loading ? (
                  "판매처에서 가격을 불러오는 중…"
                ) : null}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 lg:hidden"
                >
                  <FilterIcon width={16} height={16} />
                  필터{activeFilterCount + (needBag ? 1 : 0) > 0 && <span className="text-brand-600">{activeFilterCount + (needBag ? 1 : 0)}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setAlertOpen(true)}
                  disabled={!overallLowest}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-50"
                >
                  <BellIcon width={16} height={16} />
                  가격 알림
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {sorted.slice(0, limit).map((g) => (
                <ResultCard
                  key={g.itinerary.id}
                  group={g}
                  pax={pax}
                  needBag={needBag}
                  tags={tagsFor(g.itinerary.id)}
                  onSelect={() => setSelectedId(g.itinerary.id)}
                />
              ))}
              {loading && groups.length === 0 && [0, 1, 2, 3].map((i) => <ResultSkeleton key={i} />)}
            </div>

            {sorted.length > limit && (
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE)}
                className="mt-4 flex w-full items-center justify-center gap-1 rounded-2xl border border-ink-200 bg-white py-3.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
              >
                {sorted.length - limit}개 더 보기 <ChevronDown width={16} height={16} />
              </button>
            )}

            {!loading && groups.length > 0 && filtered.length === 0 && (
              <EmptyState
                title="조건에 맞는 항공편이 없어요"
                body="필터를 조금 넓혀 보세요."
                action={{ label: "필터 초기화", onClick: () => setFilters(EMPTY_FILTERS) }}
              />
            )}
            {!loading && groups.length === 0 && !state.fatal && (
              <EmptyState
                title="검색 결과가 없어요"
                body={
                  query.cabin !== "economy"
                    ? `이 노선에는 ${CABIN_LABEL[query.cabin]}을 운영하는 항공편이 없거나, 판매처가 응답하지 않았어요.`
                    : "판매처가 응답하지 않았어요. 잠시 후 다시 시도해 주세요."
                }
                action={{ label: "다시 검색", onClick: () => setRetry((r) => r + 1) }}
              />
            )}
            {state.fatal && (
              <EmptyState title="검색하지 못했어요" body={state.fatal} action={{ label: "다시 시도", onClick: () => setRetry((r) => r + 1) }} />
            )}

            {groups.length > 0 && (
              <p className="mt-6 flex gap-2 text-xs leading-relaxed text-ink-500">
                <InfoIcon width={16} height={16} className="shrink-0" />
                모든 금액은 세금·유류할증료·판매처 수수료를 포함한 {pax}명 기준 최종 결제 금액이에요. 가격은 조회 시각 기준이며 실제 가격은 예약처에서
                달라질 수 있어요.
              </p>
            )}
          </main>
        </div>
      </div>

      <Overlay
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="필터"
        footer={
          <button onClick={() => setFiltersOpen(false)} className="w-full rounded-xl bg-ink-900 py-3.5 font-semibold text-white">
            {filtered.length}개 항공편 보기
          </button>
        }
      >
        <FiltersPanel groups={groups} filters={filters} onChange={setFilters} needBag={needBag} onNeedBag={setNeedBag} />
      </Overlay>

      <DetailSheet
        group={selected}
        query={query}
        sellers={state.sellers}
        status={state.status}
        fx={state.fx}
        needBag={needBag}
        onClose={() => setSelectedId(null)}
        onAlert={() => {
          setSelectedId(null);
          setAlertOpen(true);
        }}
      />
      {calendarOpen && <CalendarModal open onClose={() => setCalendarOpen(false)} query={query} onPick={pickDate} />}
      {alertOpen && <AlertModal open onClose={() => setAlertOpen(false)} query={query} currentLowest={overallLowest} />}
    </>
  );
}

function SummaryBar({ query, editing, onToggle }: { query: SearchQuery; editing: boolean; onToggle: () => void }) {
  const from = getAirport(query.from);
  const to = getAirport(query.to);
  return (
    <div className="border-b border-ink-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 text-left" aria-expanded={editing}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 truncate text-[17px] font-semibold text-ink-900">
              {from?.city} <span className="font-mono text-sm text-ink-400">{query.from}</span>
              <span className="text-ink-300">{query.trip === "round" ? "⇄" : "→"}</span>
              {to?.city} <span className="font-mono text-sm text-ink-400">{query.to}</span>
            </div>
            <div className="truncate text-sm text-ink-500">
              {shortDate(query.depart)}
              {query.ret ? ` – ${shortDate(query.ret)}` : " · 편도"} · {query.children ? `성인 ${query.adults}, 소아 ${query.children}` : `성인 ${query.adults}명`} ·{" "}
              {CABIN_LABEL[query.cabin]}
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-ink-200 px-3.5 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
            {editing ? "닫기" : "검색 변경"}
            <ChevronDown width={14} height={14} className={cn("transition", editing && "rotate-180")} />
          </span>
        </button>
        {editing && (
          <div className="animate-fade-in pb-2 pt-4">
            <SearchForm initial={query} variant="bar" onSubmitted={onToggle} />
          </div>
        )}
      </div>
    </div>
  );
}

function SellerProgress({ state, onRetry }: { state: SearchState; onRetry: () => void }) {
  const total = state.sellers.length || 4;
  const finished = Object.values(state.status).filter((s) => s.state !== "pending").length;
  const failedCount = Object.values(state.status).filter((s) => s.state === "error").length;
  const failed = failedCount > 0;
  const done = state.done;
  const fetchedTimes = Object.values(state.status).flatMap((s) => (s.state === "done" ? [s.fetchedAt] : []));
  const oldest = fetchedTimes.sort()[0];
  const anyCached = Object.values(state.status).some((s) => s.state === "done" && s.cached);

  return (
    <div className="mt-3 rounded-2xl border border-ink-100 bg-white px-4 py-3 shadow-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-800">
          {done ? <CheckIcon width={18} height={18} className="text-mint-600" /> : <Spinner className="text-brand-500" />}
          {done ? `판매처 ${total - failedCount}곳 비교 완료` : `판매처 ${finished}/${total}곳 응답`}
        </div>
        <ul className="flex flex-wrap gap-1.5">
          {state.sellers.map((s) => {
            const st = state.status[s.id];
            return (
              <li
                key={s.id}
                title={st?.state === "error" ? st.message : s.description}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                  st?.state === "done" && "bg-mint-50 text-mint-700",
                  st?.state === "error" && "bg-coral-50 text-coral-600",
                  (!st || st.state === "pending") && "bg-ink-50 text-ink-500",
                )}
              >
                {st?.state === "done" ? <CheckIcon width={12} height={12} strokeWidth={2.6} /> : st?.state === "error" ? "!" : <Spinner className="h-3 w-3" />}
                {s.name}
                {st?.state === "done" && <span className="tabular-nums opacity-70">{st.count}</span>}
                {st?.state === "error" && <span className="opacity-80">응답 없음</span>}
              </li>
            );
          })}
        </ul>
        {done && failed && (
          <button type="button" onClick={onRetry} className="text-xs font-semibold text-brand-600 hover:underline">
            다시 조회
          </button>
        )}
      </div>
      {!done && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${Math.max(8, (finished / total) * 100)}%` }} />
        </div>
      )}
      {(oldest || state.fx) && (
        <p className="mt-2 text-[11px] text-ink-400">
          {oldest && `조회 ${clockKST(oldest)}${anyCached ? " (10분 캐시)" : ""}`}
          {state.fx && ` · 환율 1 USD = ${state.fx.usdKrw.toLocaleString("ko-KR")}원 (${clockKST(state.fx.asOf)} 기준)`}
          {state.firstResultMs !== null && ` · 첫 결과 ${(state.firstResultMs / 1000).toFixed(1)}초`}
        </p>
      )}
    </div>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action: { label: string; onClick: () => void } }) {
  return (
    <div className="mt-2 flex flex-col items-center rounded-3xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
      <svg width="64" height="64" viewBox="0 0 64 64" className="mb-4 text-ink-200" aria-hidden>
        <circle cx="32" cy="32" r="30" fill="currentColor" opacity=".35" />
        <path d="m28 35-7 7-3-.7-.8-2.2 6.5-5-5.8-5 2.3-2.3 9.4 2.5 6.9-6.9c1.7-1.7 4.1-2.1 5.4-.8 1.3 1.3.9 3.7-.8 5.4l-6.9 6.9 2.5 9.4-2.3 2.3-5-5.8Z" fill="#7a8ca5" />
      </svg>
      <h3 className="font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500">{body}</p>
      <button onClick={action.onClick} className="mt-5 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-800">
        {action.label}
      </button>
    </div>
  );
}

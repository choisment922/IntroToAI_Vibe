"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { DESTINATIONS, GMP_ROUTES, ORIGINS } from "@/lib/airports";
import { MAX_DAYS_AHEAD, parseQuery, queryToParams, searchHref } from "@/lib/query";
import type { Cabin, SearchQuery, TripType } from "@/lib/types";
import { addDays, cn, diffDays, todayKST } from "@/lib/util";
import { AlertIcon, PlaneLandIcon, PlaneTakeoffIcon, SearchIcon, Spinner } from "../icons";
import { AirportField } from "./airport-field";
import { DateField } from "./date-field";
import { PassengerField } from "./passenger-field";

export function defaultQuery(today = todayKST()): SearchQuery {
  const depart = addDays(today, 28);
  return {
    from: "ICN",
    to: "NRT",
    trip: "round",
    depart,
    ret: addDays(depart, 4),
    adults: 1,
    children: 0,
    cabin: "economy",
  };
}

interface Props {
  initial: SearchQuery;
  variant?: "hero" | "bar";
  onSubmitted?: () => void;
}

export function SearchForm({ initial, variant = "hero", onSubmitted }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const today = todayKST();
  const maxDate = addDays(today, MAX_DAYS_AHEAD);

  const [trip, setTrip] = useState<TripType>(initial.trip);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [depart, setDepart] = useState(initial.depart);
  const [ret, setRet] = useState(initial.ret ?? addDays(initial.depart, 4));
  const [adults, setAdults] = useState(initial.adults);
  const [children, setChildren] = useState(initial.children);
  const [cabin, setCabin] = useState<Cabin>(initial.cabin);
  const [error, setError] = useState<string | null>(null);

  const destPool = useMemo(
    () => (from === "GMP" ? DESTINATIONS.filter((d) => GMP_ROUTES[d.code]) : DESTINATIONS.filter((d) => d.carriers.length || d.connections?.length)),
    [from],
  );

  function changeFrom(code: string) {
    setFrom(code);
    setError(null);
    if (code === "GMP" && !GMP_ROUTES[to]) {
      // 김포에서 운항하지 않는 노선이면 같은 도시의 대체 공항으로
      const alt: Record<string, string> = { NRT: "HND", TPE: "TSA", PVG: "SHA" };
      setTo(alt[to] ?? "");
    }
  }

  function changeDepart(v: string) {
    setDepart(v);
    setError(null);
    if (v && ret && diffDays(v, ret) < 0) setRet(addDays(v, Math.max(1, diffDays(depart || v, ret))));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q: SearchQuery = { from, to, trip, depart, ret: trip === "round" ? ret : undefined, adults, children, cabin };
    const parsed = parseQuery(queryToParams(q), today);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setError(null);
    startTransition(() => {
      router.push(searchHref(parsed.query));
      onSubmitted?.();
    });
  }

  const hero = variant === "hero";

  return (
    <form onSubmit={submit} className={cn(hero ? "rounded-3xl bg-white p-4 shadow-lift sm:p-5" : "")} noValidate>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div role="radiogroup" aria-label="여정 유형" className="inline-flex rounded-full bg-ink-50 p-1 text-sm font-medium">
          {(
            [
              ["round", "왕복"],
              ["oneway", "편도"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={trip === v}
              onClick={() => setTrip(v)}
              className={cn(
                "rounded-full px-4 py-1.5 transition",
                trip === v ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <PassengerField
          adults={adults}
          childCount={children}
          cabin={cabin}
          onChange={(v) => {
            setAdults(v.adults);
            setChildren(v.children);
            setCabin(v.cabin);
          }}
        />
      </div>

      <div className="grid gap-2 lg:grid-cols-[1fr_1fr_0.85fr_0.85fr_auto]">
        <div className="grid gap-2 sm:grid-cols-2 lg:col-span-2">
          <AirportField
            label="출발"
            value={from}
            onChange={changeFrom}
            pool={ORIGINS}
            icon={<PlaneTakeoffIcon />}
            placeholder="출발 공항"
          />
          <AirportField
            label="도착"
            value={to}
            onChange={(c) => {
              setTo(c);
              setError(null);
            }}
            pool={destPool}
            icon={<PlaneLandIcon />}
            placeholder="어디로 떠나세요?"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 lg:col-span-2">
          <DateField label="가는 날" value={depart} min={today} max={maxDate} onChange={changeDepart} />
          <DateField
            label="오는 날"
            value={trip === "round" ? ret : ""}
            min={depart || today}
            max={maxDate}
            onChange={(v) => {
              setRet(v);
              setError(null);
            }}
            disabled={trip === "oneway"}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand-500 px-7 text-[16px] font-semibold text-white shadow-[0_8px_20px_-8px_rgb(61_104_255/0.8)] transition hover:bg-brand-600 active:scale-[0.98] disabled:opacity-70 lg:h-auto"
        >
          {pending ? <Spinner className="h-5 w-5" /> : <SearchIcon />}
          검색
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-coral-50 px-3 py-2.5 text-sm text-coral-600">
          <AlertIcon width={18} height={18} className="mt-px shrink-0" />
          {error}
        </p>
      )}
    </form>
  );
}

"use client";

import { useEffect, useReducer } from "react";
import { queryToParams } from "@/lib/query";
import type { FxInfo, Itinerary, Offer, SearchQuery, Seller, StreamMessage } from "@/lib/types";

export type SellerStatus =
  | { state: "pending" }
  | { state: "done"; count: number; latencyMs: number; cached: boolean; fetchedAt: string }
  | { state: "error"; message: string };

export interface SearchState {
  key: string;
  sellers: Seller[];
  status: Record<string, SellerStatus>;
  itineraries: Record<string, Itinerary>;
  offers: Offer[];
  fx: FxInfo | null;
  done: boolean;
  fatal: string | null;
  firstResultMs: number | null;
  startedAt: number;
}

type Action =
  | { type: "reset"; key: string; at: number }
  | { type: "msg"; msg: StreamMessage }
  | { type: "fatal"; error: string };

function initial(key: string, startedAt = 0): SearchState {
  return {
    key,
    sellers: [],
    status: {},
    itineraries: {},
    offers: [],
    fx: null,
    done: false,
    fatal: null,
    firstResultMs: null,
    startedAt,
  };
}

function reducer(s: SearchState, a: Action): SearchState {
  if (a.type === "reset") return initial(a.key, a.at);
  if (a.type === "fatal") return { ...s, fatal: a.error, done: true };
  const m = a.msg;
  switch (m.type) {
    case "meta":
      return {
        ...s,
        sellers: m.sellers,
        fx: m.fx,
        status: Object.fromEntries(m.sellers.map((x) => [x.id, { state: "pending" } as SellerStatus])),
      };
    case "result": {
      const itineraries = { ...s.itineraries };
      for (const it of m.itineraries) itineraries[it.id] ??= it;
      return {
        ...s,
        itineraries,
        offers: [...s.offers, ...m.offers],
        firstResultMs: s.firstResultMs ?? Date.now() - s.startedAt,
        status: {
          ...s.status,
          [m.sellerId]: {
            state: "done",
            count: m.offers.length,
            latencyMs: m.latencyMs,
            cached: m.cached,
            fetchedAt: m.fetchedAt,
          },
        },
      };
    }
    case "error":
      return { ...s, status: { ...s.status, [m.sellerId]: { state: "error", message: m.message } } };
    case "done":
      return { ...s, done: true };
  }
}

const RECENT_KEY = "flyscope:recent";

export function saveRecent(q: SearchQuery) {
  try {
    const list: SearchQuery[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    const k = queryToParams(q).toString();
    const next = [q, ...list.filter((x) => queryToParams(x).toString() !== k)].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* 저장소 사용 불가 */
  }
}

export function loadRecent(): SearchQuery[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function useSearchStream(q: SearchQuery | null, retryToken = 0) {
  const key = q ? `${queryToParams(q).toString()}#${retryToken}` : "";
  const [state, dispatch] = useReducer(reducer, key, (k: string) => initial(k));

  useEffect(() => {
    if (!q) return;
    const ac = new AbortController();
    dispatch({ type: "reset", key, at: Date.now() });
    saveRecent(q);

    (async () => {
      try {
        const res = await fetch(`/api/search?${queryToParams(q).toString()}`, { signal: ac.signal });
        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}));
          dispatch({ type: "fatal", error: body.error ?? "검색 중 문제가 발생했어요." });
          return;
        }
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += value;
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (line) dispatch({ type: "msg", msg: JSON.parse(line) as StreamMessage });
          }
        }
        dispatch({ type: "msg", msg: { type: "done", elapsedMs: 0 } });
      } catch (e) {
        if (ac.signal.aborted) return;
        dispatch({ type: "fatal", error: e instanceof Error ? "네트워크 연결을 확인해 주세요." : "검색 중 문제가 발생했어요." });
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 이전 검색 상태가 남아 있지 않도록 key가 다르면 초기 상태로 취급
  return state.key === key ? state : initial(key);
}

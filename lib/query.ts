import { getDestination, isOrigin, routeExists } from "./airports";
import type { Cabin, SearchQuery, TripType } from "./types";
import { addDays, diffDays, isValidYmd } from "./util";

export const CABIN_LABEL: Record<Cabin, string> = {
  economy: "일반석",
  premium: "프리미엄 일반석",
  business: "비즈니스석",
};

export const MAX_PASSENGERS = 9;
/** 검색 가능한 최대 기간(일) */
export const MAX_DAYS_AHEAD = 330;

type ParamSource = { get(name: string): string | null };

export type ParseResult = { ok: true; query: SearchQuery } | { ok: false; error: string };

function int(v: string | null, fallback: number) {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

export function parseQuery(sp: ParamSource, today: string): ParseResult {
  const from = (sp.get("from") ?? "").toUpperCase();
  const to = (sp.get("to") ?? "").toUpperCase();
  const trip: TripType = sp.get("trip") === "oneway" ? "oneway" : "round";
  const depart = sp.get("depart");
  const ret = sp.get("return");
  const adults = int(sp.get("adults"), 1);
  const children = int(sp.get("children"), 0);
  const cabinRaw = sp.get("cabin");
  const cabin: Cabin = cabinRaw === "premium" || cabinRaw === "business" ? cabinRaw : "economy";

  if (!isOrigin(from)) return { ok: false, error: "출발지는 인천(ICN) 또는 김포(GMP)만 지원합니다." };
  if (!getDestination(to)) return { ok: false, error: "도착지를 목록에서 선택해 주세요." };
  if (!routeExists(from, to))
    return { ok: false, error: "김포 출발 국제선은 도쿄(하네다)·오사카·타이베이(쑹산)·상하이(훙차오)만 운항합니다." };
  if (!isValidYmd(depart)) return { ok: false, error: "가는 날을 선택해 주세요." };
  if (diffDays(today, depart) < 0) return { ok: false, error: "지난 날짜는 검색할 수 없습니다." };
  if (diffDays(today, depart) > MAX_DAYS_AHEAD) return { ok: false, error: "약 11개월 이내의 날짜만 검색할 수 있습니다." };
  if (trip === "round") {
    if (!isValidYmd(ret)) return { ok: false, error: "오는 날을 선택해 주세요." };
    if (diffDays(depart, ret) < 0) return { ok: false, error: "오는 날은 가는 날 이후여야 합니다." };
    if (diffDays(today, ret) > MAX_DAYS_AHEAD) return { ok: false, error: "약 11개월 이내의 날짜만 검색할 수 있습니다." };
  }
  if (adults < 1) return { ok: false, error: "성인은 1명 이상이어야 합니다." };
  if (children < 0 || adults + children > MAX_PASSENGERS)
    return { ok: false, error: `탑승객은 최대 ${MAX_PASSENGERS}명까지 검색할 수 있습니다.` };

  return {
    ok: true,
    query: {
      from,
      to,
      trip,
      depart,
      ret: trip === "round" ? ret! : undefined,
      adults,
      children,
      cabin,
    },
  };
}

export function queryToParams(q: SearchQuery): URLSearchParams {
  const p = new URLSearchParams({
    from: q.from,
    to: q.to,
    trip: q.trip,
    depart: q.depart,
  });
  if (q.trip === "round" && q.ret) p.set("return", q.ret);
  p.set("adults", String(q.adults));
  if (q.children) p.set("children", String(q.children));
  if (q.cabin !== "economy") p.set("cabin", q.cabin);
  return p;
}

export function searchHref(q: SearchQuery) {
  return `/search?${queryToParams(q).toString()}`;
}

export function cacheKey(q: SearchQuery) {
  return [q.from, q.to, q.trip, q.depart, q.ret ?? "-", q.adults, q.children, q.cabin].join("|");
}

/** 날짜만 바꾼 쿼리 (왕복이면 여행 기간 유지) */
export function shiftDepart(q: SearchQuery, newDepart: string): SearchQuery {
  if (q.trip === "round" && q.ret) {
    const stay = diffDays(q.depart, q.ret);
    return { ...q, depart: newDepart, ret: addDays(newDepart, stay) };
  }
  return { ...q, depart: newDepart };
}

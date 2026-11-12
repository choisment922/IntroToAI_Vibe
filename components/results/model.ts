import type { Itinerary, Offer } from "@/lib/types";
import { minutesOfDay } from "@/lib/util";

export type SortKey = "best" | "price" | "fastest";

export interface Group {
  itinerary: Itinerary;
  offers: Offer[];
  best: Offer;
  price: number;
  /** 판매처 목록에 보이는 가장 낮은 표시 가격 */
  minDisplay: number;
}

export const TIME_SLOTS = [
  { id: "dawn", label: "새벽", range: "00–06시", from: 0, to: 360 },
  { id: "morning", label: "오전", range: "06–12시", from: 360, to: 720 },
  { id: "afternoon", label: "오후", range: "12–18시", from: 720, to: 1080 },
  { id: "evening", label: "저녁", range: "18–24시", from: 1080, to: 1440 },
] as const;

export type SlotId = (typeof TIME_SLOTS)[number]["id"];

export interface Filters {
  directOnly: boolean;
  slots: SlotId[];
  airlines: string[];
}

export const EMPTY_FILTERS: Filters = { directOnly: false, slots: [], airlines: [] };

export function offerPrice(o: Offer, needBag: boolean) {
  return o.totalKRW + (needBag ? o.baggageFeeKRW : 0);
}

export function buildGroups(itineraries: Record<string, Itinerary>, offers: Offer[], needBag: boolean): Group[] {
  const by = new Map<string, Offer[]>();
  for (const o of offers) {
    const list = by.get(o.itineraryId);
    if (list) list.push(o);
    else by.set(o.itineraryId, [o]);
  }
  const groups: Group[] = [];
  for (const [id, list] of by) {
    const itinerary = itineraries[id];
    if (!itinerary) continue;
    const sorted = [...list].sort((a, b) => offerPrice(a, needBag) - offerPrice(b, needBag));
    groups.push({
      itinerary,
      offers: sorted,
      best: sorted[0],
      price: offerPrice(sorted[0], needBag),
      minDisplay: Math.min(...sorted.map((o) => o.displayKRW)),
    });
  }
  return groups;
}

export function slotOf(dt: string): SlotId {
  const m = minutesOfDay(dt);
  return TIME_SLOTS.find((s) => m >= s.from && m < s.to)!.id;
}

export function applyFilters(groups: Group[], f: Filters) {
  return groups.filter((g) => {
    const legs = g.itinerary.legs;
    if (f.directOnly && legs.some((l) => l.stops > 0)) return false;
    if (f.slots.length && !f.slots.includes(slotOf(legs[0].dep))) return false;
    if (f.airlines.length && !f.airlines.includes(g.itinerary.airline)) return false;
    return true;
  });
}

function stops(g: Group) {
  return g.itinerary.legs.reduce((n, l) => n + l.stops, 0);
}

export function sortGroups(groups: Group[], key: SortKey): Group[] {
  const list = [...groups];
  if (key === "price") return list.sort((a, b) => a.price - b.price || a.itinerary.totalDurationMin - b.itinerary.totalDurationMin);
  if (key === "fastest") return list.sort((a, b) => a.itinerary.totalDurationMin - b.itinerary.totalDurationMin || a.price - b.price);

  if (list.length === 0) return list;
  const prices = list.map((g) => g.price);
  const durs = list.map((g) => g.itinerary.totalDurationMin);
  const [pMin, pMax] = [Math.min(...prices), Math.max(...prices)];
  const [dMin, dMax] = [Math.min(...durs), Math.max(...durs)];
  const score = (g: Group) => {
    const p = (g.price - pMin) / (pMax - pMin || 1);
    const d = (g.itinerary.totalDurationMin - dMin) / (dMax - dMin || 1);
    const dep = minutesOfDay(g.itinerary.legs[0].dep);
    const redEye = dep < 360 ? 0.06 : 0;
    return p * 0.62 + d * 0.28 + stops(g) * 0.08 + redEye;
  };
  return list.sort((a, b) => score(a) - score(b));
}

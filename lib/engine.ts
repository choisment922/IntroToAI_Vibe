/**
 * 데모 데이터 엔진.
 *
 * PRD 0단계(데이터 소스 검증)가 끝나기 전까지 사용하는 결정적(deterministic) 시뮬레이터다.
 * 같은 조건이면 항상 같은 스케줄과 가격을 만들어 내므로, 캘린더·알림·검색 결과가 서로 일관된다.
 * 실제 연동 시에는 판매처별 어댑터가 이 모듈 대신 Itinerary/Offer를 만들어 반환하면 된다.
 */
import { getAirline } from "./airlines";
import { connectionOptions, directCarriers, getAirport, getDestination, type Airport } from "./airports";
import { SELLERS, type SellerConfig } from "./sellers";
import type { Cabin, Itinerary, Leg, Offer, SearchQuery, Segment } from "./types";
import { addMinutes, atMinutes, dayOfWeek, diffDays, parseYmd, rng } from "./util";

export const USD_KRW = 1384.5;

const HUB_MIN: Record<string, number> = { MNL: 230 };

function hubMinutes(code: string) {
  return getDestination(code)?.directMin ?? HUB_MIN[code] ?? 180;
}

/* ---------- 스케줄 ---------- */

interface FlightPlan {
  airline: string;
  via?: string;
  depMin: number; // 출발지 현지 시각 (분)
  flightNo: string;
  flightNo2?: string;
  seg1Min: number;
  layoverMin: number;
  seg2Min: number;
  durationVar: number;
}

function plansFor(origin: string, dest: Airport, direction: "out" | "in"): FlightPlan[] {
  const plans: FlightPlan[] = [];
  const longHaul = dest.directMin > 500;
  const lccNight = dest.region === "SEA" || dest.region === "PAC";

  for (const code of directCarriers(origin, dest)) {
    const airline = getAirline(code);
    const r = rng(`sched|${origin}|${dest.code}|${code}|${direction}`);
    const major = code === "KE" || code === "OZ";
    const count = longHaul ? 1 : major ? 2 + Math.floor(r() * 2) : 1 + Math.floor(r() * 2);
    const base = 100 + Math.floor(r() * 800);
    for (let i = 0; i < count; i++) {
      let dep: number;
      if (airline.lcc && lccNight && r() < 0.6) dep = 19 * 60 + Math.floor(r() * 48) * 5; // 19:00~22:55
      else dep = 6 * 60 + 30 + Math.floor(((i + r()) / count) * 15 * 12) * 5; // 06:30~21:30
      const num = base + i * 2 + (direction === "in" ? 1 : 0);
      plans.push({
        airline: code,
        depMin: dep,
        flightNo: `${code}${num}`,
        seg1Min: 0,
        layoverMin: 0,
        seg2Min: 0,
        durationVar: Math.round((r() - 0.5) * 20),
      });
    }
  }

  for (const [code, via] of connectionOptions(origin, dest)) {
    const r = rng(`conn|${origin}|${dest.code}|${code}|${via}|${direction}`);
    const count = 1 + Math.floor(r() * 2);
    const hub = hubMinutes(via);
    for (let i = 0; i < count; i++) {
      const dep = 7 * 60 + Math.floor(((i + r()) / count) * 14 * 12) * 5;
      const n1 = 100 + Math.floor(r() * 800);
      const n2 = 100 + Math.floor(r() * 800);
      plans.push({
        airline: code,
        via,
        depMin: dep,
        flightNo: `${code}${n1}`,
        flightNo2: `${code}${n2}`,
        seg1Min: hub + Math.round((r() - 0.5) * 15),
        layoverMin: 70 + Math.floor(r() * 30) * 6,
        seg2Min: Math.max(90, dest.directMin - hub) + 60,
        durationVar: 0,
      });
    }
  }
  return plans;
}

function returnFactor(dest: Airport) {
  if (dest.region === "US") return 1.14; // 편서풍 역방향
  if (dest.region === "EU") return 0.95;
  return 1.04;
}

function buildLeg(plan: FlightPlan, origin: string, dest: Airport, date: string, direction: "out" | "in"): Leg {
  const from = direction === "out" ? origin : dest.code;
  const to = direction === "out" ? dest.code : origin;
  const tzFrom = getAirport(from)?.tzOffset ?? 0;
  const tzTo = getAirport(to)?.tzOffset ?? 0;
  const dep = atMinutes(date, plan.depMin);
  const factor = direction === "in" ? returnFactor(dest) : 1;

  if (!plan.via) {
    const durationMin = Math.round((dest.directMin + plan.durationVar) * factor / 5) * 5;
    const arr = addMinutes(dep, durationMin + (tzTo - tzFrom) * 60);
    const seg: Segment = { flightNo: plan.flightNo, airline: plan.airline, from, to, dep, arr, durationMin };
    return { from, to, dep, arr, durationMin, stops: 0, segments: [seg], layovers: [] };
  }

  const via = plan.via;
  const tzVia = getAirport(via)?.tzOffset ?? 0;
  const firstMin = Math.round(((direction === "out" ? plan.seg1Min : plan.seg2Min) * factor) / 5) * 5;
  const secondMin = Math.round(((direction === "out" ? plan.seg2Min : plan.seg1Min) * factor) / 5) * 5;
  const arr1 = addMinutes(dep, firstMin + (tzVia - tzFrom) * 60);
  const dep2 = addMinutes(arr1, plan.layoverMin);
  const arr2 = addMinutes(dep2, secondMin + (tzTo - tzVia) * 60);
  const segments: Segment[] = [
    { flightNo: plan.flightNo, airline: plan.airline, from, to: via, dep, arr: arr1, durationMin: firstMin },
    { flightNo: plan.flightNo2!, airline: plan.airline, from: via, to, dep: dep2, arr: arr2, durationMin: secondMin },
  ];
  const durationMin = firstMin + plan.layoverMin + secondMin;
  return {
    from,
    to,
    dep,
    arr: arr2,
    durationMin,
    stops: 1,
    segments,
    layovers: [{ airport: via, minutes: plan.layoverMin }],
  };
}

/* ---------- 운임 ---------- */

function seasonFactor(date: string) {
  const d = parseYmd(date);
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  if ((m === 12 && day >= 20) || (m === 1 && day <= 3)) return 1.38;
  if (m === 7 && day >= 20) return 1.3;
  if (m === 8 && day <= 15) return 1.32;
  if (m === 1 || m === 2) return 1.08;
  if (m === 7 || m === 8) return 1.15;
  if (m === 11 || m === 3) return 0.92;
  return 1;
}

const WEEKDAY_FACTOR = [1.1, 0.98, 0.9, 0.88, 0.96, 1.16, 1.08]; // 일~토

function leadFactor(daysAhead: number) {
  if (daysAhead < 4) return 1.42;
  if (daysAhead < 8) return 1.28;
  if (daysAhead < 15) return 1.14;
  if (daysAhead < 30) return 1.04;
  if (daysAhead < 100) return 0.94;
  return 1.0;
}

function timeFactor(depMin: number) {
  if (depMin < 7 * 60 || depMin >= 21 * 60) return 0.87;
  if (depMin >= 8 * 60 && depMin < 11 * 60) return 1.07;
  return 1;
}

const CABIN_FACTOR: Record<Cabin, number> = { economy: 1, premium: 1.75, business: 3.4 };

function legFare(plan: FlightPlan, dest: Airport, date: string, today: string, cabin: Cabin, direction: string) {
  const airline = getAirline(plan.airline);
  const airlineFactor = airline.lcc ? 0.6 : ["KE", "OZ"].includes(plan.airline) ? 1 : 0.9;
  const stopsFactor = plan.via ? 0.8 : 1;
  const noise = 0.86 + rng(`fare|${plan.flightNo}|${date}|${direction}`)() * 0.32;
  const raw =
    dest.baseFare *
    airlineFactor *
    stopsFactor *
    seasonFactor(date) *
    WEEKDAY_FACTOR[dayOfWeek(date)] *
    leadFactor(diffDays(today, date)) *
    timeFactor(plan.depMin) *
    CABIN_FACTOR[cabin] *
    noise;
  return Math.round(raw / 100) * 100;
}

function legTaxes(dest: Airport, lcc: boolean) {
  const fuel = Math.round((dest.directMin * (lcc ? 85 : 115)) / 100) * 100;
  return 14000 + fuel;
}

function baggageFeePerLeg(dest: Airport, lcc: boolean, sellerId: string) {
  if (lcc) {
    const base = dest.directMin <= 150 ? 33000 : dest.directMin <= 320 ? 45000 : 60000;
    return sellerId === "airline" ? Math.round(base * 0.85 / 1000) * 1000 : base; // 공식 사전 구매 할인
  }
  return dest.directMin <= 300 ? 40000 : dest.directMin <= 500 ? 60000 : 90000;
}

/* ---------- 조립 ---------- */

interface Built {
  itinerary: Itinerary;
  plans: FlightPlan[];
  /** 1인(성인) 기준 운임·세금 */
  adultFare: number;
  adultTaxes: number;
  lcc: boolean;
}

function buildItineraries(q: SearchQuery, today: string): Built[] {
  const dest = getDestination(q.to);
  if (!dest) return [];
  const out = plansFor(q.from, dest, "out");
  const inbound = q.trip === "round" ? plansFor(q.from, dest, "in") : [];
  const results: Built[] = [];

  const usable = (p: FlightPlan) => q.cabin === "economy" || getAirline(p.airline).premiumCabins;

  for (const o of out.filter(usable)) {
    const outLeg = buildLeg(o, q.from, dest, q.depart, "out");
    const lcc = getAirline(o.airline).lcc;
    const outFare = legFare(o, dest, q.depart, today, q.cabin, "out");
    const tax = legTaxes(dest, lcc);

    if (q.trip === "oneway" || !q.ret) {
      results.push({
        itinerary: {
          id: `${o.flightNo}${o.flightNo2 ? "-" + o.flightNo2 : ""}@${q.depart}`,
          airline: o.airline,
          legs: [outLeg],
          totalDurationMin: outLeg.durationMin,
        },
        plans: [o],
        adultFare: outFare,
        adultTaxes: tax,
        lcc,
      });
      continue;
    }

    const returns = inbound.filter((p) => p.airline === o.airline && p.via === o.via && usable(p));
    for (const r of returns) {
      const inLeg = buildLeg(r, q.from, dest, q.ret, "in");
      // 같은 날 왕복이면 도착 이후 출발편만
      if (q.ret === q.depart && inLeg.dep <= addMinutes(outLeg.arr, 180)) continue;
      const inFare = legFare(r, dest, q.ret, today, q.cabin, "in");
      const discount = lcc ? 1 : 0.94;
      results.push({
        itinerary: {
          id: `${o.flightNo}${o.flightNo2 ? "-" + o.flightNo2 : ""}@${q.depart}~${r.flightNo}${r.flightNo2 ? "-" + r.flightNo2 : ""}@${q.ret}`,
          airline: o.airline,
          legs: [outLeg, inLeg],
          totalDurationMin: outLeg.durationMin + inLeg.durationMin,
        },
        plans: [o, r],
        adultFare: Math.round(((outFare + inFare) * discount) / 100) * 100,
        adultTaxes: tax * 2,
        lcc,
      });
    }
  }
  return results;
}

const roundTo = (n: number, unit = 10) => Math.round(n / unit) * unit;

function makeOffer(b: Built, seller: SellerConfig, q: SearchQuery, dest: Airport): Offer | null {
  const id = b.itinerary.id;
  if (seller.id !== "airline" && rng(`cov|${seller.id}|${id}`)() > seller.coverage) return null;

  const pax = q.adults + q.children;
  const jitter = 1 + (rng(`jit|${seller.id}|${id}|${q.depart}`)() - 0.5) * 0.04;
  const mult = seller.fareMult * jitter;
  const adultFare = roundTo(b.adultFare * mult, 100);
  const childFare = roundTo(adultFare * 0.75, 100);
  const fare = adultFare * q.adults + childFare * q.children;
  const taxes = roundTo(b.adultTaxes * q.adults + b.adultTaxes * 0.9 * q.children, 100);
  const legs = b.itinerary.legs.length;

  let ticketingFee = 0;
  let paymentFee = 0;
  let displayKRW = fare + taxes;
  let displayNote = "세금 포함";
  let fareName = b.lcc ? "기본 운임" : "일반 운임";
  let baggageIncluded = !b.lcc;
  let originalAmount: number | undefined;

  if (seller.id === "skypick") {
    ticketingFee = 10000 * pax;
    displayNote = "세금 포함 · 발권 수수료 별도";
    fareName = b.lcc ? "특가 운임" : "할인 운임";
  } else if (seller.id === "tripnest") {
    paymentFee = roundTo((fare + taxes) * 0.012);
    displayKRW = fare;
    displayNote = "세금·유류할증료 별도";
    fareName = "라이트 운임";
    baggageIncluded = false;
  } else if (seller.id === "farehub") {
    const serviceUsd = 9 * pax;
    ticketingFee = roundTo(serviceUsd * USD_KRW);
    paymentFee = roundTo((fare + taxes + ticketingFee) * 0.015);
    displayNote = "세금 포함 · 서비스·해외결제 수수료 별도";
    fareName = b.lcc ? "Basic" : "Economy Saver";
    originalAmount = Math.round(((fare + taxes) / USD_KRW) * 100) / 100;
  } else {
    fareName = b.lcc ? "공식 기본 운임" : "공식 일반 운임";
  }

  if (q.cabin !== "economy") {
    fareName = q.cabin === "business" ? "비즈니스" : "프리미엄 일반석";
    baggageIncluded = true;
  }

  const baggageFeeKRW = baggageIncluded ? 0 : baggageFeePerLeg(dest, b.lcc, seller.id) * legs * pax;

  return {
    id: `${seller.id}:${id}`,
    itineraryId: id,
    sellerId: seller.id,
    fareName,
    currency: seller.currency,
    displayKRW,
    displayNote,
    originalAmount,
    breakdown: { fare, taxes, ticketingFee, paymentFee },
    totalKRW: fare + taxes + ticketingFee + paymentFee,
    baggageIncluded,
    baggageFeeKRW,
  };
}

/** 특정 판매처가 반환하는 검색 결과 */
export function searchSeller(sellerId: string, q: SearchQuery, today: string) {
  const seller = SELLERS.find((s) => s.id === sellerId);
  const dest = getDestination(q.to);
  if (!seller || !dest) return { itineraries: [], offers: [] };
  const itineraries: Itinerary[] = [];
  const offers: Offer[] = [];
  for (const b of buildItineraries(q, today)) {
    const offer = makeOffer(b, seller, q, dest);
    if (!offer) continue;
    itineraries.push(b.itinerary);
    offers.push(offer);
  }
  return { itineraries, offers };
}

/** 전체 판매처 중 최저 결제 금액 (캘린더·알림용, 지연 없음) */
export function lowestTotal(q: SearchQuery, today: string): number | null {
  const dest = getDestination(q.to);
  if (!dest) return null;
  let min: number | null = null;
  for (const b of buildItineraries(q, today)) {
    for (const s of SELLERS) {
      const o = makeOffer(b, s, q, dest);
      if (o && (min === null || o.totalKRW < min)) min = o.totalKRW;
    }
  }
  return min;
}

/** 판매처 지연·장애 시뮬레이션용 */
export function simulatedLatency(seller: SellerConfig, q: SearchQuery) {
  const r = rng(`lat|${seller.id}|${q.from}${q.to}${q.depart}|${Date.now() >> 12}`)();
  const [min, max] = seller.latency;
  return Math.round(min + r * (max - min));
}

export function simulatedFailure(seller: SellerConfig) {
  return Math.random() < seller.failRate;
}



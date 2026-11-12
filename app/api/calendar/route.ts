import type { NextRequest } from "next/server";
import { lowestTotal } from "@/lib/engine";
import { MAX_DAYS_AHEAD, parseQuery } from "@/lib/query";
import type { CalendarDay } from "@/lib/types";
import { addDays, diffDays, monthDays, todayKST } from "@/lib/util";

/**
 * GET /api/calendar?from=ICN&to=NRT&trip=round&stay=4&month=2026-12&adults=1&cabin=economy
 * 한 달치 날짜별 최저 결제 금액. 왕복이면 stay(박) 동안 머무는 일정 기준.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const today = todayKST();
  const month = sp.get("month") ?? today.slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return Response.json({ error: "month 형식은 YYYY-MM 입니다." }, { status: 400 });
  }
  const trip = sp.get("trip") === "oneway" ? "oneway" : "round";
  const stay = Math.min(30, Math.max(0, Number.parseInt(sp.get("stay") ?? "4", 10) || 0));

  // 날짜 이외의 조건은 검색과 동일한 규칙으로 검증
  const probe = new URLSearchParams(sp);
  probe.set("depart", today);
  probe.set("trip", trip);
  probe.set("return", addDays(today, stay));
  const parsed = parseQuery(probe, today);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  const days: CalendarDay[] = monthDays(month).map((date) => {
    const ahead = diffDays(today, date);
    const ret = addDays(date, stay);
    if (ahead < 0 || ahead > MAX_DAYS_AHEAD || (trip === "round" && diffDays(today, ret) > MAX_DAYS_AHEAD)) {
      return { date, price: null };
    }
    const q = { ...parsed.query, depart: date, ret: trip === "round" ? ret : undefined };
    return { date, price: lowestTotal(q, today) };
  });

  return Response.json(
    { month, trip, stay, days, generatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "private, max-age=600" } },
  );
}

"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { browser } from "react-dom";
import { CABIN_LABEL, searchHref } from "@/lib/query";
import { clockKST, cn, diffDays, shortDate, todayKST, won } from "@/lib/util";
import { BellIcon, TrashIcon, TrendIcon } from "../icons";
import { loadAlerts, routeLabel, type StoredAlert, storeAlerts } from "./alert-modal";

type Live = Record<string, number | null | "missing">;

export function AlertList() {
  use(browser("가격 알림 목록은 이 기기의 브라우저에 저장됩니다."));
  const [alerts, setAlerts] = useState<StoredAlert[]>(loadAlerts);
  const [live, setLive] = useState<Live>({});
  const today = todayKST();

  useEffect(() => {
    let alive = true;
    for (const a of loadAlerts()) {
      fetch(`/api/alerts?id=${encodeURIComponent(a.id)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => alive && setLive((prev) => ({ ...prev, [a.id]: d ? d.currentPrice : "missing" })));
    }
    return () => {
      alive = false;
    };
  }, []);

  async function remove(id: string) {
    const next = alerts.filter((a) => a.id !== id);
    setAlerts(next);
    storeAlerts(next);
    await fetch(`/api/alerts?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-ink-200 bg-white px-6 py-16 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500">
          <BellIcon width={26} height={26} />
        </span>
        <h2 className="font-semibold text-ink-900">등록한 가격 알림이 없어요</h2>
        <p className="mt-1 max-w-sm text-sm text-ink-500">항공권을 검색한 뒤 결과 화면의 ‘가격 알림’ 버튼으로 목표 가격을 등록해 보세요.</p>
        <Link href="/" className="mt-5 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-800">
          항공권 검색하기
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {alerts.map((a) => {
        const expired = diffDays(today, a.depart) < 0;
        const now = live[a.id];
        const price = typeof now === "number" ? now : null;
        const hit = price !== null && price <= a.targetPrice;
        const progress = price !== null ? Math.min(100, Math.max(4, (a.targetPrice / price) * 100)) : 0;
        const href = searchHref({ ...a });
        return (
          <li key={a.id} className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={href} className="font-semibold text-ink-900 hover:text-brand-600">
                    {routeLabel(a)}
                  </Link>
                  {expired ? (
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">지난 일정</span>
                  ) : hit ? (
                    <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[11px] font-semibold text-mint-700">목표 가격 도달!</span>
                  ) : (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">감시 중</span>
                  )}
                </div>
                <div className="mt-0.5 text-sm text-ink-500">
                  {shortDate(a.depart)}
                  {a.ret ? ` – ${shortDate(a.ret)}` : " 편도"} · {a.adults + a.children}명 · {CABIN_LABEL[a.cabin]}
                </div>
                <div className="mt-0.5 text-xs text-ink-400">
                  {a.emailMasked} · {clockKST(a.createdAt)} 등록
                </div>
              </div>
              <button
                onClick={() => remove(a.id)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-400 hover:bg-coral-50 hover:text-coral-600"
                aria-label="알림 삭제"
              >
                <TrashIcon width={18} height={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-ink-50 p-3 text-center">
              <div>
                <div className="text-[11px] text-ink-500">등록 당시</div>
                <div className="text-sm font-semibold tabular-nums text-ink-700">{a.priceAtCreation ? won(a.priceAtCreation) : "—"}</div>
              </div>
              <div>
                <div className="text-[11px] text-ink-500">현재 최저가</div>
                <div className={cn("text-sm font-semibold tabular-nums", hit ? "text-mint-600" : "text-ink-900")}>
                  {now === undefined ? <span className="skeleton inline-block h-4 w-16 rounded" /> : price !== null ? won(price) : "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-ink-500">목표 가격</div>
                <div className="text-sm font-semibold tabular-nums text-brand-600">{won(a.targetPrice)}</div>
              </div>
            </div>
            {price !== null && !expired && (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div className={cn("h-full rounded-full", hit ? "bg-mint-500" : "bg-brand-500")} style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-500">
                  <TrendIcon width={14} height={14} />
                  {hit ? "지금이 예약하기 좋은 때예요." : `목표까지 ${won(price - a.targetPrice)} 남았어요.`}
                </p>
              </div>
            )}
            {now === "missing" && (
              <p className="mt-3 text-xs text-ink-400">서버에서 알림을 찾을 수 없어요 (데모 서버가 재시작되면 알림이 초기화돼요).</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

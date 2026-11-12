/**
 * 가격 알림 저장소 (데모: 메모리).
 * 운영 시에는 DB에 저장하고, 스케줄러(예: 6시간마다)로 checkAlerts()를 실행해 이메일을 보낸다.
 * PRD 개인정보 원칙: 알림 발송용 이메일 외에는 저장하지 않는다.
 */
import { lowestTotal } from "./engine";
import type { PriceAlert } from "./types";
import { diffDays, todayKST } from "./util";

export const ALERT_CHECK_INTERVAL_HOURS = 6;

const g = globalThis as unknown as { __flyscopeAlerts?: Map<string, PriceAlert> };
const store = (g.__flyscopeAlerts ??= new Map());

export function saveAlert(alert: PriceAlert) {
  store.set(alert.id, alert);
}

export function deleteAlert(id: string) {
  return store.delete(id);
}

export function getAlert(id: string) {
  return store.get(id);
}

export function currentPrice(a: PriceAlert, today = todayKST()) {
  if (diffDays(today, a.depart) < 0) return null;
  return lowestTotal(
    {
      from: a.from,
      to: a.to,
      trip: a.trip,
      depart: a.depart,
      ret: a.ret,
      adults: a.adults,
      children: a.children,
      cabin: a.cabin,
    },
    today,
  );
}

/** 목표 가격 이하로 내려간 알림 목록. 실제로는 여기서 이메일 발송 작업을 큐에 넣는다. */
export function checkAlerts() {
  const today = todayKST();
  const triggered: { alert: PriceAlert; price: number }[] = [];
  for (const a of store.values()) {
    const price = currentPrice(a, today);
    if (price !== null && price <= a.targetPrice) triggered.push({ alert: a, price });
  }
  return triggered;
}

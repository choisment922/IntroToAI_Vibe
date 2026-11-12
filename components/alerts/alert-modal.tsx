"use client";

import { useState } from "react";
import { getAirport } from "@/lib/airports";
import { CABIN_LABEL } from "@/lib/query";
import type { PriceAlert, SearchQuery } from "@/lib/types";
import { shortDate, won } from "@/lib/util";
import { AlertIcon, BellIcon, CheckIcon, Spinner } from "../icons";
import { Overlay } from "../ui/overlay";

const KEY = "flyscope:alerts";

export type StoredAlert = Omit<PriceAlert, "email"> & { emailMasked: string };

export function loadAlerts(): StoredAlert[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function storeAlerts(list: StoredAlert[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* 저장소 사용 불가 */
  }
}

function mask(email: string) {
  const [id, domain] = email.split("@");
  return `${id.slice(0, 2)}${"•".repeat(Math.max(1, id.length - 2))}@${domain}`;
}

export function routeLabel(q: Pick<SearchQuery, "from" | "to">) {
  return `${getAirport(q.from)?.city ?? q.from} → ${getAirport(q.to)?.city ?? q.to}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  query: SearchQuery;
  currentLowest: number | null;
}

export function AlertModal({ open, onClose, query, currentLowest }: Props) {
  const suggested = currentLowest ? Math.floor((currentLowest * 0.9) / 1000) * 1000 : 0;
  const [email, setEmail] = useState("");
  const [target, setTarget] = useState(suggested ? String(suggested) : "");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setError("이메일 수집·이용에 동의해 주세요.");
      return;
    }
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          targetPrice: Number(target.replace(/[^\d]/g, "")),
          from: query.from,
          to: query.to,
          trip: query.trip,
          depart: query.depart,
          return: query.ret,
          adults: query.adults,
          children: query.children,
          cabin: query.cabin,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "등록하지 못했어요.");
      const { email: rawEmail, ...rest } = body.alert as PriceAlert;
      storeAlerts([{ ...rest, emailMasked: mask(rawEmail) }, ...loadAlerts()]);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록하지 못했어요.");
      setState("idle");
    }
  }

  const targetNum = Number(target.replace(/[^\d]/g, ""));

  return (
    <Overlay
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <BellIcon className="text-brand-500" /> 가격 알림 받기
        </span>
      }
    >
      {state === "done" ? (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mint-100 text-mint-600">
            <CheckIcon width={28} height={28} strokeWidth={2.4} />
          </span>
          <h3 className="text-lg font-semibold text-ink-900">알림을 등록했어요</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            {routeLabel(query)} 노선이 <b className="text-ink-800">{won(targetNum)}</b> 이하로 내려가면
            <br />
            {email}로 알려드릴게요. (6시간마다 확인)
          </p>
          <div className="mt-6 flex gap-2">
            <a href="/alerts" className="rounded-full border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
              내 알림 보기
            </a>
            <button onClick={onClose} className="rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-800">
              확인
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5 p-5" noValidate>
          <div className="rounded-2xl bg-ink-50 p-4">
            <div className="font-semibold text-ink-900">{routeLabel(query)}</div>
            <div className="mt-0.5 text-sm text-ink-500">
              {shortDate(query.depart)}
              {query.ret ? ` – ${shortDate(query.ret)}` : " 편도"} · {query.adults + query.children}명 · {CABIN_LABEL[query.cabin]}
            </div>
            {currentLowest && (
              <div className="mt-3 flex items-baseline justify-between border-t border-ink-200 pt-3 text-sm">
                <span className="text-ink-500">지금 최저가</span>
                <span className="font-bold tabular-nums text-ink-900">{won(currentLowest)}</span>
              </div>
            )}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-800">목표 가격 (전 인원 합계)</span>
            <div className="flex items-center rounded-xl border border-ink-200 px-4 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
              <input
                inputMode="numeric"
                value={target ? Number(target.replace(/[^\d]/g, "") || 0).toLocaleString("ko-KR") : ""}
                onChange={(e) => setTarget(e.target.value.replace(/[^\d]/g, ""))}
                className="w-full bg-transparent py-3 text-lg font-semibold tabular-nums outline-none"
                placeholder="0"
                required
              />
              <span className="text-ink-500">원</span>
            </div>
            {currentLowest && (
              <div className="mt-2 flex gap-1.5">
                {[0.95, 0.9, 0.85].map((r) => {
                  const v = Math.floor((currentLowest * r) / 1000) * 1000;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTarget(String(v))}
                      className="rounded-full border border-ink-200 px-3 py-1 text-xs text-ink-600 hover:border-brand-300 hover:text-brand-600"
                    >
                      -{Math.round((1 - r) * 100)}%
                    </button>
                  );
                })}
              </div>
            )}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-800">알림 받을 이메일</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-ink-200 px-4 py-3 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              required
            />
          </label>

          <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-ink-500">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand-500"
            />
            <span>
              가격 알림 발송을 위해 이메일 주소를 수집·이용하는 데 동의합니다. 알림 해제 시 즉시 삭제되며, 이메일 외의 개인정보는 수집하지 않습니다.
            </span>
          </label>

          {error && (
            <p role="alert" className="flex items-center gap-2 rounded-xl bg-coral-50 px-3 py-2.5 text-sm text-coral-600">
              <AlertIcon width={16} height={16} /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={state === "sending"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 font-semibold text-white hover:bg-brand-600 disabled:opacity-70"
          >
            {state === "sending" && <Spinner />}
            알림 등록
          </button>
        </form>
      )}
    </Overlay>
  );
}

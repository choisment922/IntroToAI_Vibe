/**
 * 서버 전용 검색 서비스.
 * - 판매처에 동시에 요청하고, 먼저 도착한 결과부터 스트리밍한다.
 * - 판매처별 결과를 10분간 캐시한다 (실패 응답은 캐시하지 않음).
 * - 한 판매처가 실패하거나 시간 초과돼도 나머지 결과는 정상 반환한다.
 */
import { lowestTotal, searchSeller, simulatedFailure, simulatedLatency, USD_KRW } from "./engine";
import { cacheKey } from "./query";
import { publicSellers, SELLERS, type SellerConfig } from "./sellers";
import type { FxInfo, Itinerary, Offer, SearchQuery, StreamMessage } from "./types";

export const CACHE_TTL_MS = 10 * 60 * 1000;
const SELLER_TIMEOUT_MS = 4000;

interface CacheEntry {
  itineraries: Itinerary[];
  offers: Offer[];
  fetchedAt: string;
  expires: number;
}

// 개발 서버의 HMR에도 유지되도록 globalThis에 둔다. 운영에서는 Redis 등으로 교체.
const g = globalThis as unknown as { __flyscopeCache?: Map<string, CacheEntry> };
const cache = (g.__flyscopeCache ??= new Map());

function readCache(key: string): CacheEntry | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expires < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return hit;
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("aborted"));
    });
  });
}

async function callSeller(seller: SellerConfig, q: SearchQuery, today: string, signal: AbortSignal) {
  // 실제 구현: 판매처 API 호출 (API 키는 서버 환경 변수에서만 읽는다)
  await sleep(simulatedLatency(seller, q), signal);
  if (simulatedFailure(seller)) throw new Error("판매처 응답 오류");
  return searchSeller(seller.id, q, today);
}

function withTimeout<T>(p: Promise<T>, ms: number, controller: AbortController): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      controller.abort();
      reject(new Error("응답 시간 초과"));
    }, ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export function currentFx(now = new Date()): FxInfo {
  const asOf = new Date(now);
  asOf.setUTCMinutes(0, 0, 0);
  return { usdKrw: USD_KRW, asOf: asOf.toISOString() };
}

export function streamSearch(q: SearchQuery, today: string, requestSignal: AbortSignal): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const started = Date.now();
  const key = cacheKey(q);

  return new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (msg: StreamMessage) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(msg) + "\n"));
        } catch {
          closed = true;
        }
      };

      send({ type: "meta", query: q, sellers: publicSellers(), fx: currentFx() });

      await Promise.all(
        SELLERS.map(async (seller) => {
          const ck = `${seller.id}|${key}`;
          const hit = readCache(ck);
          if (hit) {
            send({
              type: "result",
              sellerId: seller.id,
              itineraries: hit.itineraries,
              offers: hit.offers,
              fetchedAt: hit.fetchedAt,
              cached: true,
              latencyMs: 0,
            });
            return;
          }
          const t0 = Date.now();
          const ac = new AbortController();
          requestSignal.addEventListener("abort", () => ac.abort());
          try {
            const res = await withTimeout(callSeller(seller, q, today, ac.signal), SELLER_TIMEOUT_MS, ac);
            const fetchedAt = new Date().toISOString();
            cache.set(ck, { ...res, fetchedAt, expires: Date.now() + CACHE_TTL_MS });
            send({
              type: "result",
              sellerId: seller.id,
              ...res,
              fetchedAt,
              cached: false,
              latencyMs: Date.now() - t0,
            });
          } catch (e) {
            send({ type: "error", sellerId: seller.id, message: e instanceof Error ? e.message : "알 수 없는 오류" });
          }
        }),
      );

      send({ type: "done", elapsedMs: Date.now() - started });
      if (!closed) controller.close();
    },
  });
}

export { lowestTotal };

import type { Seller } from "./types";

export interface SellerConfig extends Seller {
  /** 응답 지연 범위(ms) — 데모용 시뮬레이션 */
  latency: [number, number];
  /** 전체 항공편 중 판매하는 비율 */
  coverage: number;
  /** 요청 실패 확률 — 장애 대응 데모용 */
  failRate: number;
  fareMult: number;
}

/**
 * 데모 판매처. 실제 서비스에서는 각 항목이 공식 API·제휴 프로그램 어댑터로 교체된다.
 * 판매처 이름은 모두 가상의 이름이다.
 */
export const SELLERS: SellerConfig[] = [
  {
    id: "airline",
    name: "항공사 공식",
    kind: "airline",
    description: "항공사 공식 홈페이지 직판 운임. 수수료 없음.",
    currency: "KRW",
    latency: [700, 1500],
    coverage: 1,
    failRate: 0.03,
    fareMult: 1,
  },
  {
    id: "skypick",
    name: "스카이픽",
    kind: "ota",
    description: "국내 여행사. 결제 단계에서 발권 수수료가 추가됩니다.",
    currency: "KRW",
    latency: [350, 900],
    coverage: 0.85,
    failRate: 0.04,
    fareMult: 0.965,
  },
  {
    id: "tripnest",
    name: "트립네스트",
    kind: "ota",
    description: "검색 목록에 세금 제외 운임만 표시. 수하물 미포함 라이트 운임 위주.",
    currency: "KRW",
    latency: [900, 2000],
    coverage: 0.7,
    failRate: 0.06,
    fareMult: 0.93,
  },
  {
    id: "farehub",
    name: "FareHub",
    kind: "ota",
    description: "해외 여행사. 달러(USD) 결제, 서비스 수수료·해외 결제 수수료 별도.",
    currency: "USD",
    latency: [1600, 3300],
    coverage: 0.75,
    failRate: 0.22,
    fareMult: 0.925,
  },
];

export function getSeller(id: string) {
  return SELLERS.find((s) => s.id === id);
}

export function publicSellers(): Seller[] {
  return SELLERS.map(({ id, name, kind, description, currency }) => ({ id, name, kind, description, currency }));
}

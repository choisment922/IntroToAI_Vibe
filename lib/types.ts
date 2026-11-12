export type TripType = "round" | "oneway";
export type Cabin = "economy" | "premium" | "business";

export interface SearchQuery {
  from: string;
  to: string;
  depart: string; // YYYY-MM-DD
  ret?: string; // YYYY-MM-DD (왕복일 때)
  trip: TripType;
  adults: number;
  children: number;
  cabin: Cabin;
}

export interface Segment {
  flightNo: string;
  airline: string;
  from: string;
  to: string;
  /** 현지 시각 YYYY-MM-DDTHH:mm */
  dep: string;
  arr: string;
  durationMin: number;
}

export interface Leg {
  from: string;
  to: string;
  dep: string;
  arr: string;
  durationMin: number;
  stops: number;
  segments: Segment[];
  layovers: { airport: string; minutes: number }[];
}

export interface Itinerary {
  id: string;
  /** 대표 운항 항공사 */
  airline: string;
  legs: Leg[];
  totalDurationMin: number;
}

export interface PriceBreakdown {
  fare: number;
  taxes: number;
  ticketingFee: number;
  paymentFee: number;
}

export interface Offer {
  id: string;
  itineraryId: string;
  sellerId: string;
  fareName: string;
  currency: "KRW" | "USD";
  /** 판매처 화면에 표시되는 금액(원화 환산) */
  displayKRW: number;
  /** 표시 금액이 무엇을 포함하는지 */
  displayNote: string;
  /** USD 판매처일 때 원 통화 금액 */
  originalAmount?: number;
  breakdown: PriceBreakdown;
  /** 수하물 비용 제외 최종 결제 금액 */
  totalKRW: number;
  baggageIncluded: boolean;
  /** 위탁 수하물 1개 추가 시 비용(왕복·전 인원 합계) */
  baggageFeeKRW: number;
}

export interface Seller {
  id: string;
  name: string;
  kind: "airline" | "ota";
  description: string;
  currency: "KRW" | "USD";
}

export interface FxInfo {
  usdKrw: number;
  asOf: string; // ISO
}

export type StreamMessage =
  | {
      type: "meta";
      query: SearchQuery;
      sellers: Seller[];
      fx: FxInfo;
    }
  | {
      type: "result";
      sellerId: string;
      itineraries: Itinerary[];
      offers: Offer[];
      fetchedAt: string;
      cached: boolean;
      latencyMs: number;
    }
  | { type: "error"; sellerId: string; message: string }
  | { type: "done"; elapsedMs: number };

export interface CalendarDay {
  date: string;
  price: number | null;
}

export interface PriceAlert {
  id: string;
  email: string;
  from: string;
  to: string;
  depart: string;
  ret?: string;
  trip: TripType;
  adults: number;
  children: number;
  cabin: Cabin;
  targetPrice: number;
  priceAtCreation: number | null;
  createdAt: string;
}

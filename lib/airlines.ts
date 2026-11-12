export interface Airline {
  code: string;
  name: string;
  /** 저비용 항공사 여부 — 기본 운임에 위탁 수하물 미포함 */
  lcc: boolean;
  color: string;
  /** 비즈니스석 운영 여부 */
  premiumCabins: boolean;
}

const LIST: Airline[] = [
  { code: "KE", name: "대한항공", lcc: false, color: "#1E6FD9", premiumCabins: true },
  { code: "OZ", name: "아시아나항공", lcc: false, color: "#B5232F", premiumCabins: true },
  { code: "7C", name: "제주항공", lcc: true, color: "#F26522", premiumCabins: false },
  { code: "LJ", name: "진에어", lcc: true, color: "#5B8C1E", premiumCabins: false },
  { code: "TW", name: "티웨이항공", lcc: true, color: "#D3123E", premiumCabins: false },
  { code: "BX", name: "에어부산", lcc: true, color: "#1A5BAA", premiumCabins: false },
  { code: "ZE", name: "이스타항공", lcc: true, color: "#C8102E", premiumCabins: false },
  { code: "RS", name: "에어서울", lcc: true, color: "#2BB3A6", premiumCabins: false },
  { code: "JL", name: "일본항공", lcc: false, color: "#CC0000", premiumCabins: true },
  { code: "NH", name: "전일본공수", lcc: false, color: "#13448F", premiumCabins: true },
  { code: "MM", name: "피치항공", lcc: true, color: "#D6157D", premiumCabins: false },
  { code: "BR", name: "에바항공", lcc: false, color: "#00704A", premiumCabins: true },
  { code: "CI", name: "중화항공", lcc: false, color: "#C5466F", premiumCabins: true },
  { code: "CX", name: "캐세이퍼시픽", lcc: false, color: "#006564", premiumCabins: true },
  { code: "MU", name: "중국동방항공", lcc: false, color: "#1B4C8C", premiumCabins: true },
  { code: "TG", name: "타이항공", lcc: false, color: "#5C2D91", premiumCabins: true },
  { code: "VN", name: "베트남항공", lcc: false, color: "#00627A", premiumCabins: true },
  { code: "VJ", name: "비엣젯항공", lcc: true, color: "#E2231A", premiumCabins: false },
  { code: "5J", name: "세부퍼시픽", lcc: true, color: "#F2B31B", premiumCabins: false },
  { code: "PR", name: "필리핀항공", lcc: false, color: "#1C3F94", premiumCabins: true },
  { code: "SQ", name: "싱가포르항공", lcc: false, color: "#F1A42B", premiumCabins: true },
  { code: "TR", name: "스쿠트", lcc: true, color: "#E6B800", premiumCabins: false },
  { code: "GA", name: "가루다인도네시아", lcc: false, color: "#0C6E8A", premiumCabins: true },
  { code: "AF", name: "에어프랑스", lcc: false, color: "#002157", premiumCabins: true },
];

const MAP = new Map(LIST.map((a) => [a.code, a]));

export function getAirline(code: string): Airline {
  return MAP.get(code) ?? { code, name: code, lcc: false, color: "#64748B", premiumCabins: true };
}

export const AIRLINES = LIST;

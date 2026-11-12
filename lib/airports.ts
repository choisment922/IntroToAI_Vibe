export type Region =
  | "KR"
  | "JP"
  | "CN"
  | "TW"
  | "HK"
  | "SEA"
  | "PAC"
  | "EU"
  | "US"
  | "OCE";

export interface Airport {
  code: string;
  name: string;
  city: string;
  cityEn: string;
  country: string;
  region: Region;
  /** 인천 출발 직항 기준 비행 시간(분) */
  directMin: number;
  /** 일반석 편도 기준 운임(세금 제외, 원) */
  baseFare: number;
  /** KST 대비 시차(시간) */
  tzOffset: number;
  /** 인천 출발 직항 운항사 */
  carriers: string[];
  /** 경유편: [항공사, 경유 공항] */
  connections?: [string, string][];
  aliases?: string[];
}

export const ORIGINS: Airport[] = [
  {
    code: "ICN",
    name: "인천국제공항",
    city: "서울/인천",
    cityEn: "Seoul Incheon",
    country: "대한민국",
    region: "KR",
    directMin: 0,
    baseFare: 0,
    tzOffset: 0,
    carriers: [],
    aliases: ["서울", "인천", "seoul", "incheon"],
  },
  {
    code: "GMP",
    name: "김포국제공항",
    city: "서울/김포",
    cityEn: "Seoul Gimpo",
    country: "대한민국",
    region: "KR",
    directMin: 0,
    baseFare: 0,
    tzOffset: 0,
    carriers: [],
    aliases: ["서울", "김포", "seoul", "gimpo"],
  },
];

/** 김포 출발 국제선이 있는 목적지와 운항사 */
export const GMP_ROUTES: Record<string, string[]> = {
  HND: ["KE", "OZ", "JL", "NH"],
  KIX: ["KE", "OZ", "7C"],
  TSA: ["BR", "CI", "TW"],
  SHA: ["KE", "OZ", "MU"],
};

export const DESTINATIONS: Airport[] = [
  // 일본
  { code: "NRT", name: "나리타국제공항", city: "도쿄", cityEn: "Tokyo", country: "일본", region: "JP", directMin: 140, baseFare: 168000, tzOffset: 0, carriers: ["KE", "OZ", "7C", "LJ", "TW", "ZE", "JL", "MM"], aliases: ["tokyo", "나리타", "narita"] },
  { code: "HND", name: "하네다공항", city: "도쿄", cityEn: "Tokyo", country: "일본", region: "JP", directMin: 135, baseFare: 196000, tzOffset: 0, carriers: ["KE", "OZ", "7C", "JL", "NH", "MM"], aliases: ["tokyo", "하네다", "haneda"] },
  { code: "KIX", name: "간사이국제공항", city: "오사카", cityEn: "Osaka", country: "일본", region: "JP", directMin: 105, baseFare: 142000, tzOffset: 0, carriers: ["KE", "OZ", "7C", "LJ", "TW", "BX", "ZE", "MM"], aliases: ["osaka", "간사이", "kansai", "교토"] },
  { code: "FUK", name: "후쿠오카공항", city: "후쿠오카", cityEn: "Fukuoka", country: "일본", region: "JP", directMin: 80, baseFare: 118000, tzOffset: 0, carriers: ["KE", "OZ", "7C", "LJ", "TW", "BX", "RS"], aliases: ["fukuoka", "하카타"] },
  { code: "CTS", name: "신치토세공항", city: "삿포로", cityEn: "Sapporo", country: "일본", region: "JP", directMin: 170, baseFare: 212000, tzOffset: 0, carriers: ["KE", "OZ", "7C", "LJ", "TW"], aliases: ["sapporo", "홋카이도", "hokkaido"] },
  { code: "OKA", name: "나하공항", city: "오키나와", cityEn: "Okinawa", country: "일본", region: "JP", directMin: 140, baseFare: 176000, tzOffset: 0, carriers: ["KE", "OZ", "7C", "LJ", "TW"], aliases: ["okinawa", "naha", "나하"] },
  { code: "NGO", name: "주부국제공항", city: "나고야", cityEn: "Nagoya", country: "일본", region: "JP", directMin: 115, baseFare: 158000, tzOffset: 0, carriers: ["KE", "OZ", "7C", "LJ"], aliases: ["nagoya"] },
  // 중화권
  { code: "TPE", name: "타오위안국제공항", city: "타이베이", cityEn: "Taipei", country: "대만", region: "TW", directMin: 150, baseFare: 172000, tzOffset: -1, carriers: ["KE", "OZ", "7C", "LJ", "TW", "BR", "CI"], aliases: ["taipei", "대만", "taiwan"] },
  { code: "TSA", name: "쑹산공항", city: "타이베이", cityEn: "Taipei", country: "대만", region: "TW", directMin: 145, baseFare: 198000, tzOffset: -1, carriers: [], aliases: ["taipei", "대만", "songshan"] },
  { code: "HKG", name: "홍콩국제공항", city: "홍콩", cityEn: "Hong Kong", country: "홍콩", region: "HK", directMin: 215, baseFare: 214000, tzOffset: -1, carriers: ["KE", "OZ", "CX", "7C", "LJ", "TW"], aliases: ["hongkong", "hong kong"] },
  { code: "PVG", name: "푸둥국제공항", city: "상하이", cityEn: "Shanghai", country: "중국", region: "CN", directMin: 120, baseFare: 168000, tzOffset: -1, carriers: ["KE", "OZ", "MU", "7C"], aliases: ["shanghai", "푸동"] },
  { code: "SHA", name: "훙차오국제공항", city: "상하이", cityEn: "Shanghai", country: "중국", region: "CN", directMin: 115, baseFare: 205000, tzOffset: -1, carriers: [], aliases: ["shanghai", "홍차오"] },
  // 동남아
  { code: "BKK", name: "수완나품국제공항", city: "방콕", cityEn: "Bangkok", country: "태국", region: "SEA", directMin: 345, baseFare: 268000, tzOffset: -2, carriers: ["KE", "OZ", "TG", "7C", "LJ", "TW", "ZE"], connections: [["CX", "HKG"], ["VN", "HAN"]], aliases: ["bangkok", "태국", "thailand"] },
  { code: "DAD", name: "다낭국제공항", city: "다낭", cityEn: "Da Nang", country: "베트남", region: "SEA", directMin: 290, baseFare: 232000, tzOffset: -2, carriers: ["KE", "OZ", "VN", "7C", "LJ", "TW", "VJ", "BX"], aliases: ["danang", "da nang", "베트남", "호이안"] },
  { code: "SGN", name: "떤선녓국제공항", city: "호찌민", cityEn: "Ho Chi Minh City", country: "베트남", region: "SEA", directMin: 320, baseFare: 248000, tzOffset: -2, carriers: ["KE", "OZ", "VN", "VJ", "7C"], aliases: ["hochiminh", "호치민", "사이공", "saigon"] },
  { code: "HAN", name: "노이바이국제공항", city: "하노이", cityEn: "Hanoi", country: "베트남", region: "SEA", directMin: 280, baseFare: 236000, tzOffset: -2, carriers: ["KE", "OZ", "VN", "VJ", "7C"], aliases: ["hanoi"] },
  { code: "CEB", name: "막탄세부국제공항", city: "세부", cityEn: "Cebu", country: "필리핀", region: "SEA", directMin: 275, baseFare: 224000, tzOffset: -1, carriers: ["KE", "7C", "LJ", "5J"], connections: [["PR", "MNL"]], aliases: ["cebu", "필리핀"] },
  { code: "SIN", name: "창이국제공항", city: "싱가포르", cityEn: "Singapore", country: "싱가포르", region: "SEA", directMin: 380, baseFare: 312000, tzOffset: -1, carriers: ["KE", "OZ", "SQ", "TR"], connections: [["CX", "HKG"]], aliases: ["singapore"] },
  { code: "DPS", name: "응우라라이국제공항", city: "발리", cityEn: "Bali", country: "인도네시아", region: "SEA", directMin: 430, baseFare: 356000, tzOffset: -1, carriers: ["KE", "GA"], connections: [["SQ", "SIN"], ["CX", "HKG"], ["TR", "SIN"]], aliases: ["bali", "덴파사르", "denpasar"] },
  // 태평양
  { code: "GUM", name: "괌국제공항", city: "괌", cityEn: "Guam", country: "미국령 괌", region: "PAC", directMin: 260, baseFare: 248000, tzOffset: 1, carriers: ["KE", "7C", "LJ", "TW"], aliases: ["guam"] },
  // 장거리
  { code: "LAX", name: "로스앤젤레스국제공항", city: "로스앤젤레스", cityEn: "Los Angeles", country: "미국", region: "US", directMin: 660, baseFare: 812000, tzOffset: -17, carriers: ["KE", "OZ"], connections: [["JL", "NRT"], ["NH", "HND"]], aliases: ["la", "los angeles", "엘에이", "미국"] },
  { code: "JFK", name: "존 F. 케네디국제공항", city: "뉴욕", cityEn: "New York", country: "미국", region: "US", directMin: 855, baseFare: 968000, tzOffset: -14, carriers: ["KE", "OZ"], connections: [["JL", "HND"], ["NH", "HND"]], aliases: ["newyork", "new york", "미국"] },
  { code: "CDG", name: "샤를드골공항", city: "파리", cityEn: "Paris", country: "프랑스", region: "EU", directMin: 830, baseFare: 924000, tzOffset: -8, carriers: ["KE", "AF"], connections: [["CX", "HKG"], ["SQ", "SIN"]], aliases: ["paris", "프랑스", "유럽"] },
  { code: "LHR", name: "히스로공항", city: "런던", cityEn: "London", country: "영국", region: "EU", directMin: 860, baseFare: 956000, tzOffset: -9, carriers: ["KE", "OZ"], connections: [["CX", "HKG"], ["JL", "HND"]], aliases: ["london", "영국", "유럽"] },
  { code: "FCO", name: "피우미치노공항", city: "로마", cityEn: "Rome", country: "이탈리아", region: "EU", directMin: 795, baseFare: 902000, tzOffset: -8, carriers: ["KE", "OZ"], connections: [["CX", "HKG"]], aliases: ["rome", "이탈리아", "유럽"] },
  { code: "SYD", name: "킹스포드스미스공항", city: "시드니", cityEn: "Sydney", country: "호주", region: "OCE", directMin: 620, baseFare: 724000, tzOffset: 2, carriers: ["KE", "OZ"], connections: [["CX", "HKG"], ["SQ", "SIN"]], aliases: ["sydney", "호주", "australia"] },
];

type AirportLite = Pick<Airport, "code" | "name" | "city" | "tzOffset">;

/** 경유지로만 쓰이는 공항 */
const HUBS: AirportLite[] = [{ code: "MNL", name: "니노이아키노국제공항", city: "마닐라", tzOffset: -1 }];

export const ALL_AIRPORTS: Airport[] = [...ORIGINS, ...DESTINATIONS];

const AIRPORT_MAP = new Map<string, AirportLite>([...ALL_AIRPORTS, ...HUBS].map((a) => [a.code, a]));

export function getAirport(code: string | null | undefined): AirportLite | undefined {
  if (!code) return undefined;
  return AIRPORT_MAP.get(code.toUpperCase());
}

export function getDestination(code: string) {
  return DESTINATIONS.find((a) => a.code === code);
}

export function isOrigin(code: string) {
  return ORIGINS.some((o) => o.code === code);
}

/** 출발지에서 목적지까지 운항하는 직항 항공사 */
export function directCarriers(origin: string, dest: Airport): string[] {
  if (origin === "GMP") return GMP_ROUTES[dest.code] ?? [];
  return dest.carriers;
}

export function connectionOptions(origin: string, dest: Airport): [string, string][] {
  if (origin === "GMP") return [];
  return dest.connections ?? [];
}

export function routeExists(origin: string, destCode: string) {
  const dest = getDestination(destCode);
  if (!dest || !isOrigin(origin)) return false;
  return directCarriers(origin, dest).length + connectionOptions(origin, dest).length > 0;
}

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, "");
}

export function searchAirports(query: string, pool: Airport[]): Airport[] {
  const q = normalize(query);
  if (!q) return pool;
  return pool
    .map((a) => {
      const fields = [a.code, a.city, a.cityEn, a.name, a.country, ...(a.aliases ?? [])].map(normalize);
      let score = -1;
      if (normalize(a.code) === q) score = 100;
      else if (fields.some((f) => f.startsWith(q))) score = 60;
      else if (fields.some((f) => f.includes(q))) score = 30;
      return { a, score };
    })
    .filter((x) => x.score >= 0)
    .sort((x, y) => y.score - x.score)
    .map((x) => x.a);
}

/* ---------- 결정적 난수 ---------- */

export function hash(str: string): number {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0) * 4294967296 + (h1 >>> 0);
}

export function rng(seed: string) {
  let a = hash(seed) % 4294967296;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- 날짜 (모두 "벽시계" 문자열, 타임존 없음) ---------- */

const pad = (n: number) => String(n).padStart(2, "0");

export function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toYmd(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function isValidYmd(s: string | null | undefined): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return toYmd(parseYmd(s)) === s;
}

export function addDays(ymd: string, n: number): string {
  const d = parseYmd(ymd);
  d.setUTCDate(d.getUTCDate() + n);
  return toYmd(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseYmd(b).getTime() - parseYmd(a).getTime()) / 86400000);
}

export function dayOfWeek(ymd: string): number {
  return parseYmd(ymd).getUTCDay();
}

/** "YYYY-MM-DD" + 분 → "YYYY-MM-DDTHH:mm" */
export function atMinutes(ymd: string, minutes: number): string {
  const d = parseYmd(ymd);
  d.setUTCMinutes(minutes);
  return `${toYmd(d)}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function addMinutes(dt: string, minutes: number): string {
  const [ymd, hm] = dt.split("T");
  const [h, m] = hm.split(":").map(Number);
  return atMinutes(ymd, h * 60 + m + minutes);
}

/** 한국 시간 기준 오늘 */
export function todayKST(now = new Date()): string {
  return toYmd(new Date(now.getTime() + 9 * 3600000));
}

export function monthDays(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => `${y}-${pad(m)}-${pad(i + 1)}`);
}

/* ---------- 포맷 ---------- */

const KRW = new Intl.NumberFormat("ko-KR");

export function won(n: number): string {
  return `${KRW.format(Math.round(n))}원`;
}

export function wonShort(n: number): string {
  if (n >= 10000) {
    const man = n / 10000;
    return `${man >= 100 ? Math.round(man) : man.toFixed(1).replace(/\.0$/, "")}만`;
  }
  return KRW.format(Math.round(n));
}

export function duration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

export function hhmm(dt: string): string {
  return dt.slice(11, 16);
}

export function minutesOfDay(dt: string): number {
  const [h, m] = dt.slice(11, 16).split(":").map(Number);
  return h * 60 + m;
}

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

export function weekday(ymd: string): string {
  return WEEK[dayOfWeek(ymd)];
}

export function prettyDate(ymd: string): string {
  const d = parseYmd(ymd);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${weekday(ymd)})`;
}

export function shortDate(ymd: string): string {
  const d = parseYmd(ymd);
  return `${d.getUTCMonth() + 1}.${d.getUTCDate()} (${weekday(ymd)})`;
}

export function clockKST(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 3600000);
  return `${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

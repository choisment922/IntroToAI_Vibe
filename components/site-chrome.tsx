import Link from "next/link";
import { BellIcon } from "./icons";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const text = tone === "light" ? "text-white" : "text-ink-900";
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${text}`}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r="15" fill="#3d68ff" />
        <circle cx="16" cy="16" r="9.5" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1.5" />
        <path d="M16 3v5M16 24v5M3 16h5M24 16h5" stroke="#fff" strokeOpacity=".35" strokeWidth="1.5" />
        <path
          d="m14.6 17.4-3.2 3.2-1.8-.4-.4-1.1 3.1-2.4-2.8-2.4 1.1-1.1 4.5 1.2 3.3-3.3c.8-.8 2-1 2.6-.4.6.6.4 1.8-.4 2.6l-3.3 3.3 1.2 4.5-1.1 1.1-2.4-2.8Z"
          fill="#fff"
        />
      </svg>
      <span className="text-[19px]">
        Fly<span className="text-brand-500">Scope</span>
      </span>
    </span>
  );
}

export function SiteHeader({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const light = tone === "light";
  return (
    <header
      className={
        light
          ? "absolute inset-x-0 top-0 z-30"
          : "sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70"
      }
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="FlyScope 홈">
          <Logo tone={tone} />
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            href="/#how"
            className={`hidden rounded-full px-3 py-2 sm:inline-block ${light ? "text-white/80 hover:text-white" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"}`}
          >
            비교 방식
          </Link>
          <Link
            href="/alerts"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 ${light ? "bg-white/10 text-white hover:bg-white/20" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"}`}
          >
            <BellIcon width={16} height={16} />내 가격 알림
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-ink-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-ink-500 sm:px-6 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-md leading-relaxed">
            FlyScope는 인천·김포 출발 해외 항공권을 세금·수수료·수하물까지 포함한 <b className="text-ink-700">실제 결제 금액</b>
            으로 비교합니다. 예약과 결제는 각 판매처에서 진행됩니다.
          </p>
        </div>
        <ul className="space-y-2 leading-relaxed">
          <li>· 표시 가격은 조회 시각 기준이며, 실제 가격은 예약처에서 달라질 수 있습니다.</li>
          <li>· 외화 결제 금액은 표시된 기준 시각의 환율로 원화 환산했습니다.</li>
          <li>· 가격 알림용 이메일 외에는 개인정보를 수집하지 않습니다.</li>
          <li className="text-ink-400">· 현재 데모 버전으로, 항공편과 가격은 시뮬레이션 데이터입니다.</li>
        </ul>
      </div>
    </footer>
  );
}

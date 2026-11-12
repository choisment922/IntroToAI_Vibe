import { Suspense } from "react";
import { HomeSearch, HomeSearchFallback } from "@/components/home/home-search";
import { PopularRoutes, PopularRoutesFallback } from "@/components/home/popular-routes";
import { BagIcon, BellIcon, CalendarIcon, ReceiptIcon } from "@/components/icons";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

function HeroArt() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1200 640" aria-hidden>
      <defs>
        <radialGradient id="glow" cx="78%" cy="18%" r="60%">
          <stop offset="0" stopColor="#3d68ff" stopOpacity=".45" />
          <stop offset="1" stopColor="#3d68ff" stopOpacity="0" />
        </radialGradient>
        <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.2" fill="#fff" fillOpacity=".07" />
        </pattern>
        <linearGradient id="arc" x1="0" x2="1">
          <stop offset="0" stopColor="#8eabff" stopOpacity="0" />
          <stop offset=".5" stopColor="#8eabff" stopOpacity=".7" />
          <stop offset="1" stopColor="#ffc24a" stopOpacity=".9" />
        </linearGradient>
      </defs>
      <rect width="1200" height="640" fill="url(#dots)" />
      <rect width="1200" height="640" fill="url(#glow)" />
      <path d="M140 520 C 420 120, 860 80, 1110 260" fill="none" stroke="url(#arc)" strokeWidth="2" strokeDasharray="2 9" strokeLinecap="round" />
      <path d="M140 520 C 380 300, 700 260, 980 420" fill="none" stroke="#8eabff" strokeOpacity=".22" strokeWidth="1.5" strokeDasharray="2 9" strokeLinecap="round" />
      <circle cx="140" cy="520" r="5" fill="#8eabff" />
      <circle cx="140" cy="520" r="14" fill="none" stroke="#8eabff" strokeOpacity=".4" />
      <circle cx="1110" cy="260" r="5" fill="#ffc24a" />
      <circle cx="1110" cy="260" r="16" fill="none" stroke="#ffc24a" strokeOpacity=".4" />
    </svg>
  );
}

function Row({ k, v, muted = false, add = false }: { k: string; v: string; muted?: boolean; add?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${muted ? "text-ink-400" : "text-ink-700"}`}>
      <span>{k}</span>
      <span className={`tabular-nums ${add ? "text-coral-600" : ""}`}>{v}</span>
    </div>
  );
}

function ReceiptCompare() {
  return (
    <div className="relative grid gap-4 sm:grid-cols-2">
      <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
        <div className="mb-1 text-xs font-semibold text-ink-400">여행사 A · 검색 목록</div>
        <div className="flex items-baseline justify-between">
          <span className="font-semibold text-ink-900">도쿄 왕복</span>
          <span className="rounded-full bg-sun-100 px-2 py-0.5 text-[11px] font-semibold text-sun-700">최저가처럼 보임</span>
        </div>
        <div className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-ink-900">189,000원</div>
        <div className="my-4 border-t border-dashed border-ink-200" />
        <div className="space-y-1.5">
          <Row k="세금·유류할증료" v="+58,600원" add />
          <Row k="발권 수수료" v="+10,000원" add />
          <Row k="위탁 수하물 (왕복)" v="+66,000원" add />
        </div>
        <div className="mt-3 flex items-baseline justify-between border-t border-ink-100 pt-3">
          <span className="text-sm font-semibold text-ink-900">실제 결제</span>
          <span className="text-xl font-bold tabular-nums text-coral-600">323,600원</span>
        </div>
      </div>
      <div className="rounded-3xl border-2 border-brand-500 bg-white p-5 shadow-lift">
        <div className="mb-1 text-xs font-semibold text-brand-600">항공사 공식 · FlyScope 기준</div>
        <div className="flex items-baseline justify-between">
          <span className="font-semibold text-ink-900">도쿄 왕복</span>
          <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[11px] font-semibold text-mint-700">실제 최저가</span>
        </div>
        <div className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-ink-900">286,400원</div>
        <div className="my-4 border-t border-dashed border-ink-200" />
        <div className="space-y-1.5">
          <Row k="세금·유류할증료" v="포함" muted />
          <Row k="수수료" v="없음" muted />
          <Row k="위탁 수하물 15kg" v="포함" muted />
        </div>
        <div className="mt-3 flex items-baseline justify-between border-t border-ink-100 pt-3">
          <span className="text-sm font-semibold text-ink-900">실제 결제</span>
          <span className="text-xl font-bold tabular-nums text-brand-600">286,400원</span>
        </div>
      </div>
      <p className="text-xs text-ink-400 sm:col-span-2">* 이해를 돕기 위한 예시 금액입니다.</p>
    </div>
  );
}

const FEATURES = [
  {
    icon: ReceiptIcon,
    title: "최종 결제 금액으로 비교",
    body: "세금·유류할증료·발권 수수료·해외 결제 수수료까지 모두 더한 금액으로 순위를 매겨요. 표시가와의 차이도 함께 보여드려요.",
  },
  {
    icon: BagIcon,
    title: "수하물까지 같은 기준으로",
    body: "저비용 항공사와 라이트 운임은 수하물이 빠져 있어요. 스위치 하나로 수하물 1개 포함 가격을 다시 계산해 비교해요.",
  },
  {
    icon: CalendarIcon,
    title: "날짜별 최저가 캘린더",
    body: "같은 여행 기간으로 날짜만 옮겼을 때의 최저가를 색으로 보여줘요. 하루만 바꿔도 몇만 원이 달라질 수 있어요.",
  },
  {
    icon: BellIcon,
    title: "목표 가격 알림",
    body: "원하는 가격을 정해두면 6시간마다 확인해서, 내려가면 이메일로 알려드려요. 이메일 외 개인정보는 받지 않아요.",
  },
];

const FAQ = [
  {
    q: "FlyScope에서 바로 결제할 수 있나요?",
    a: "아니요. FlyScope는 가격 비교 서비스예요. 원하는 판매처를 고르면 해당 사이트의 예약 페이지로 이동하고, 결제는 판매처에서 진행돼요.",
  },
  {
    q: "표시된 가격과 실제 결제 금액이 다를 수 있나요?",
    a: "항공권 가격은 실시간으로 바뀌기 때문에 조회 시각 이후 달라질 수 있어요. 모든 가격 옆에 조회 시각을 표시하고, 같은 조건 검색은 10분 동안 같은 결과를 보여드려요.",
  },
  {
    q: "달러로 결제하는 판매처는 어떻게 계산하나요?",
    a: "표시된 기준 시각의 환율로 원화 환산하고, 해외 결제 수수료(약 1.5%)까지 더해 비교해요. 실제 청구액은 카드사 환율에 따라 조금 달라질 수 있어요.",
  },
  {
    q: "어느 공항에서 출발하는 항공권을 찾을 수 있나요?",
    a: "지금은 인천(ICN)과 김포(GMP) 출발 국제선을 지원해요. 김포에서는 도쿄(하네다)·오사카·타이베이(쑹산)·상하이(훙차오) 노선을 검색할 수 있어요.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-ink-900 pb-16 pt-28 sm:pb-24 sm:pt-36">
        <HeroArt />
        <SiteHeader tone="light" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-200 ring-1 ring-white/15">
            <span className="h-1.5 w-1.5 rounded-full bg-sun-400" />
            인천·김포 출발 해외 항공권 가격 비교
          </p>
          <h1 className="max-w-3xl text-[2.1rem] font-bold leading-[1.18] tracking-tight text-white sm:text-5xl sm:leading-[1.12]">
            보이는 가격 말고,
            <br />
            <span className="bg-gradient-to-r from-brand-300 to-sun-400 bg-clip-text text-transparent">실제로 내는 가격</span>으로.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70 sm:text-base">
            항공사와 여행사 가격을 한 번에 모아, 세금·수수료·수하물까지 더한 최종 결제 금액으로 비교해 드려요.
          </p>
          <div className="mt-8">
            <Suspense fallback={<HomeSearchFallback />}>
              <HomeSearch />
            </Suspense>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.7rem]">지금 떠나기 좋은 노선</h2>
              <p className="mt-1 text-sm text-ink-500">인천 출발 · 2~8주 뒤 출발일 중 최저 결제 금액 (성인 1명)</p>
            </div>
          </div>
          <Suspense fallback={<PopularRoutesFallback />}>
            <PopularRoutes />
          </Suspense>
        </section>

        <section id="how" className="scroll-mt-20 border-y border-ink-100 bg-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="text-sm font-semibold text-brand-600">왜 FlyScope인가요?</span>
              <h2 className="mt-2 text-2xl font-bold leading-snug tracking-tight text-ink-900 sm:text-[1.9rem]">
                검색 목록의 최저가가
                <br />
                결제 화면에서도 최저가일까요?
              </h2>
              <p className="mt-4 leading-relaxed text-ink-600">
                판매처마다 가격에 포함하는 항목이 달라요. 어떤 곳은 세금을 빼고, 어떤 곳은 수수료를 결제 단계에서 붙이고, 수하물은 따로 팔죠. 그래서
                목록에서는 가장 싸 보이던 항공권이 결제할 땐 가장 비싸지기도 해요.
              </p>
              <p className="mt-3 leading-relaxed text-ink-600">
                FlyScope는 모든 판매처 가격을 <b className="text-ink-900">같은 기준(최종 결제 금액)</b>으로 맞춘 다음 비교해요.
              </p>
            </div>
            <ReceiptCompare />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <f.icon />
                </span>
                <h3 className="mt-4 font-semibold text-ink-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
          <h2 className="mb-5 text-center text-2xl font-bold tracking-tight text-ink-900">자주 묻는 질문</h2>
          <div className="divide-y divide-ink-100 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink-900">
                  {f.q}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-50 text-ink-500 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

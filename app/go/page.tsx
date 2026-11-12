import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalIcon, InfoIcon } from "@/components/icons";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getSeller } from "@/lib/sellers";
import { won } from "@/lib/util";

export const metadata: Metadata = {
  title: "판매처로 이동",
  robots: { index: false },
};

async function Handoff({ searchParams }: { searchParams: PageProps<"/go">["searchParams"] }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const seller = getSeller(one(sp.seller) ?? "");
  const price = Number(one(sp.price));
  const itinerary = one(sp.itinerary) ?? "";
  const q = one(sp.q);
  const flights = itinerary
    .split("~")
    .map((p) => p.split("@")[0].replace(/-/g, " → "))
    .join(" / ");

  return (
    <div className="w-full max-w-md rounded-3xl border border-ink-100 bg-white p-6 text-center shadow-lift sm:p-8">
      <div className="mx-auto mb-5 flex items-center justify-center gap-3">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500 [animation-delay:300ms]" />
      </div>
      <h1 className="text-xl font-bold text-ink-900">{seller ? `${seller.name}(으)로 이동합니다` : "판매처로 이동합니다"}</h1>
      {flights && <p className="mt-2 font-mono text-sm text-ink-500">{flights}</p>}
      {Number.isFinite(price) && price > 0 && (
        <p className="mt-4 text-sm text-ink-500">
          FlyScope 조회 금액 <b className="block text-2xl tabular-nums text-ink-900">{won(price)}</b>
        </p>
      )}
      <div className="mt-6 flex gap-2 rounded-2xl bg-sun-50 p-4 text-left text-xs leading-relaxed text-sun-700">
        <InfoIcon width={16} height={16} className="shrink-0" />
        <span>
          데모 버전에서는 실제 판매처 예약 페이지 대신 이 안내 화면을 보여드려요. 정식 서비스에서는 이 단계에서 판매처의 해당 항공편 예약 페이지로 바로
          연결되며, 결제는 판매처에서 진행됩니다.
        </span>
      </div>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        {q && (
          <Link href={`/search?${q}`} className="flex-1 rounded-xl border border-ink-200 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-50">
            검색 결과로 돌아가기
          </Link>
        )}
        <span className="flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-ink-900/90 py-3 text-sm font-semibold text-white/80">
          판매처 열기 (데모) <ExternalIcon width={15} height={15} />
        </span>
      </div>
    </div>
  );
}

export default function GoPage(props: PageProps<"/go">) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center bg-ink-50 px-4 py-16">
        <Suspense fallback={<div className="skeleton h-80 w-full max-w-md rounded-3xl" />}>
          <Handoff searchParams={props.searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

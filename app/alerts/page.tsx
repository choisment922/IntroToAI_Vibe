import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertList } from "@/components/alerts/alert-list";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "내 가격 알림",
};

export default function AlertsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">내 가격 알림</h1>
        <p className="mb-6 mt-1 text-sm text-ink-500">
          등록한 노선의 최저 결제 금액을 6시간마다 확인해, 목표 가격 이하로 내려가면 이메일로 알려드려요.
        </p>
        <Suspense
          fallback={
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="skeleton h-44 rounded-3xl" />
              ))}
            </div>
          }
        >
          <AlertList />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

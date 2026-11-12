import type { Metadata } from "next";
import { Suspense } from "react";
import { ResultSkeleton } from "@/components/results/result-card";
import { SearchResults } from "@/components/results/search-results";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "항공권 검색 결과",
  robots: { index: false },
};

function Fallback() {
  return (
    <div>
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-3 sm:px-6">
          <div className="skeleton h-5 w-56 rounded" />
          <div className="skeleton h-4 w-72 rounded" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-6 sm:px-6">
        <div className="skeleton h-16 rounded-2xl" />
        <div className="skeleton h-14 rounded-2xl" />
        {[0, 1, 2].map((i) => (
          <ResultSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex-1">
        <Suspense fallback={<Fallback />}>
          <SearchResults />
        </Suspense>
      </div>
      <SiteFooter />
    </>
  );
}

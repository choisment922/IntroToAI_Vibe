import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FlyScope — 실제 결제 금액으로 비교하는 해외 항공권",
    template: "%s · FlyScope",
  },
  description:
    "인천·김포 출발 해외 항공권을 여러 판매처에서 한 번에. 세금·수수료·수하물까지 포함한 최종 결제 금액으로 비교하고, 날짜별 최저가와 가격 알림까지.",
};

export const viewport: Viewport = {
  themeColor: "#0b1a2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

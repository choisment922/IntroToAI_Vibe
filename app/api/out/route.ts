import type { NextRequest } from "next/server";
import { getSeller } from "@/lib/sellers";

/**
 * GET /api/out?seller=skypick&itinerary=...&price=...&q=...
 * 예약처 이동 클릭을 기록(지표: 예약처 이동률)한 뒤 판매처로 리다이렉트한다.
 * 데모에서는 실제 판매처 대신 안내 페이지(/go)로 보낸다.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const seller = getSeller(sp.get("seller") ?? "");
  if (!seller) return Response.json({ error: "알 수 없는 판매처입니다." }, { status: 400 });

  console.info(
    JSON.stringify({
      event: "outbound_click",
      seller: seller.id,
      itinerary: sp.get("itinerary"),
      price: Number(sp.get("price")) || null,
      at: new Date().toISOString(),
    }),
  );

  const target = new URL("/go", request.nextUrl.origin);
  for (const k of ["seller", "itinerary", "price", "airline", "q"]) {
    const v = sp.get(k);
    if (v) target.searchParams.set(k, v);
  }
  return Response.redirect(target, 302);
}

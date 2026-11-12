import type { NextRequest } from "next/server";
import { currentPrice, deleteAlert, getAlert, saveAlert } from "@/lib/alerts";
import { parseQuery } from "@/lib/query";
import type { PriceAlert } from "@/lib/types";
import { todayKST } from "@/lib/util";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** POST /api/alerts — 가격 알림 등록 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json({ error: "올바른 이메일 주소를 입력해 주세요." }, { status: 400 });
  }
  const targetPrice = Number(body.targetPrice);
  if (!Number.isFinite(targetPrice) || targetPrice < 10000 || targetPrice > 50_000_000) {
    return Response.json({ error: "목표 가격을 확인해 주세요." }, { status: 400 });
  }

  const params = new URLSearchParams();
  for (const k of ["from", "to", "trip", "depart", "return", "adults", "children", "cabin"]) {
    const v = body[k];
    if (v !== undefined && v !== null) params.set(k, String(v));
  }
  const parsed = parseQuery(params, todayKST());
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  const q = parsed.query;
  const alert: PriceAlert = {
    id: crypto.randomUUID(),
    email,
    ...q,
    targetPrice: Math.round(targetPrice),
    priceAtCreation: null,
    createdAt: new Date().toISOString(),
  };
  alert.priceAtCreation = currentPrice(alert);
  saveAlert(alert);

  return Response.json({ alert }, { status: 201 });
}

/** GET /api/alerts?id=... — 현재 최저가 확인 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const alert = id ? getAlert(id) : undefined;
  if (!alert) return Response.json({ error: "알림을 찾을 수 없습니다." }, { status: 404 });
  return Response.json({ id: alert.id, currentPrice: currentPrice(alert) });
}

/** DELETE /api/alerts?id=... — 알림 해제 */
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "id가 필요합니다." }, { status: 400 });
  deleteAlert(id);
  return new Response(null, { status: 204 });
}

import type { NextRequest } from "next/server";
import { parseQuery } from "@/lib/query";
import { streamSearch } from "@/lib/search-service";
import { todayKST } from "@/lib/util";

/**
 * GET /api/search?from=ICN&to=NRT&trip=round&depart=2026-12-10&return=2026-12-14&adults=1
 * 응답: NDJSON 스트림 (meta → result|error ... → done)
 */
export async function GET(request: NextRequest) {
  const parsed = parseQuery(request.nextUrl.searchParams, todayKST());
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  return new Response(streamSearch(parsed.query, todayKST(), request.signal), {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

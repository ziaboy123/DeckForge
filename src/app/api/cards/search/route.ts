import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseSearchParams } from "@/lib/cardSearch";
import { cardLookupLimit } from "@/lib/cardLimits";
import { UpstreamBusyError, searchCards } from "@/lib/ygoprodeck";

export async function GET(req: Request) {
  // only the deck builder uses this, so it's for signed-in users only
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized", data: [] }, { status: 401 });

  const limited = cardLookupLimit(req, session.user.id, { data: [] });
  if (limited) return limited;

  const parsed = parseSearchParams(new URL(req.url).searchParams);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error, data: [] }, { status: 400 });

  try {
    const result = await searchCards(parsed.filters);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof UpstreamBusyError) {
      return NextResponse.json({ error: "Card search is busy. Try again in a moment.", data: [] }, { status: 503, headers: { "Retry-After": "2" } });
    }
    console.error("[cards/search]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Card search isn't working right now. Try again later.", data: [] }, { status: 502 });
  }
}

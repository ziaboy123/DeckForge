import { NextResponse } from "next/server";
import { searchCards } from "@/lib/ygoprodeck";
import type { SearchFilters, Attribute } from "@/types/yugioh";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const filters: SearchFilters = {
    name: searchParams.get("name") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    race: searchParams.get("race") ?? undefined,
    attribute: (searchParams.get("attribute") as Attribute) ?? undefined,
    level: searchParams.get("level") ? Number(searchParams.get("level")) : undefined,
    archetype: searchParams.get("archetype") ?? undefined,
    banlist: (searchParams.get("banlist") as SearchFilters["banlist"]) ?? undefined,
    frameType: (searchParams.get("frameType") as SearchFilters["frameType"]) ?? undefined,
    sort: (searchParams.get("sort") as SearchFilters["sort"]) ?? "name",
    num: searchParams.get("num") ? Number(searchParams.get("num")) : 60,
    offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : 0,
  };

  try {
    const result = await searchCards(filters);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to search cards";
    return NextResponse.json({ error: message, data: [] }, { status: 200 });
  }
}

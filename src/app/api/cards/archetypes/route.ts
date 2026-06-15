import { NextResponse } from "next/server";
import { getArchetypes } from "@/lib/ygoprodeck";

export async function GET() {
  try {
    const archetypes = await getArchetypes();
    return NextResponse.json({ archetypes }, { headers: { "Cache-Control": "s-maxage=86400" } });
  } catch {
    return NextResponse.json({ archetypes: [] });
  }
}

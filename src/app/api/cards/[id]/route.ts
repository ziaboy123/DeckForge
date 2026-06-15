import { NextResponse } from "next/server";
import { getCardById } from "@/lib/ygoprodeck";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cardId = parseInt(id);

  if (isNaN(cardId)) {
    return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
  }

  const card = await getCardById(cardId);

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json({ card });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cardLookupLimit } from "@/lib/cardLimits";
import { getCardById } from "@/lib/ygoprodeck";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = cardLookupLimit(req, session.user.id);
  if (limited) return limited;

  const { id } = await params;
  // card passcodes are plain numbers of up to 10 digits
  if (!/^\d{1,10}$/.test(id)) {
    return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
  }
  const cardId = Number(id);

  const card = await getCardById(cardId);

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json({ card });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const source = await prisma.deck.findUnique({
    where: { id },
    include: { cards: true },
  });

  if (!source) return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  if (source.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const copy = await prisma.deck.create({
    data: {
      name: `${source.name} (Copy)`,
      description: source.description,
      format: source.format,
      userId: session.user.id,
      cards: {
        createMany: {
          data: source.cards.map((c) => ({
            cardId: c.cardId,
            zone: c.zone,
            quantity: c.quantity,
            sortOrder: c.sortOrder,
          })),
        },
      },
    },
  });

  return NextResponse.json({ deck: copy }, { status: 201 });
}

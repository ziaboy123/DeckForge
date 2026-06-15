import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  format: z.enum(["ADVANCED", "TRADITIONAL", "SPEED_DUEL", "RUSH_DUEL"]).default("ADVANCED"),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decks = await prisma.deck.findMany({
    where: { userId: session.user.id },
    include: { cards: { select: { id: true, cardId: true, zone: true, quantity: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ decks });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const deck = await prisma.deck.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ deck }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

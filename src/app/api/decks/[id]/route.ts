import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  format: z.enum(["ADVANCED", "TRADITIONAL", "SPEED_DUEL", "RUSH_DUEL"]).optional(),
  isPublic: z.boolean().optional(),
  cards: z
    .array(
      z.object({
        cardId: z.number().int().positive(),
        zone: z.enum(["MAIN", "EXTRA", "SIDE"]),
        quantity: z.number().int().min(1).max(3),
        sortOrder: z.number().int().optional(),
      })
    )
    .optional(),
});

async function getDeckOrForbid(id: string, userId: string) {
  const deck = await prisma.deck.findUnique({ where: { id } });
  if (!deck) return { error: "Deck not found", status: 404 };
  if (deck.userId !== userId) return { error: "Forbidden", status: 403 };
  return { deck };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getDeckOrForbid(id, session.user.id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const deck = await prisma.deck.findUnique({
    where: { id },
    include: {
      cards: {
        orderBy: [{ zone: "asc" }, { sortOrder: "asc" }],
      },
    },
  });

  return NextResponse.json({ deck });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const check = await getDeckOrForbid(id, session.user.id);
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const { cards, ...deckData } = data;

    const updated = await prisma.$transaction(async (tx) => {
      const deck = await tx.deck.update({
        where: { id },
        data: { ...deckData, updatedAt: new Date() },
      });

      if (cards !== undefined) {
        await tx.deckCard.deleteMany({ where: { deckId: id } });
        if (cards.length > 0) {
          await tx.deckCard.createMany({
            data: cards.map((c, idx) => ({
              deckId: id,
              cardId: c.cardId,
              zone: c.zone,
              quantity: c.quantity,
              sortOrder: c.sortOrder ?? idx,
            })),
          });
        }
      }

      return tx.deck.findUnique({
        where: { id: deck.id },
        include: { cards: { orderBy: [{ zone: "asc" }, { sortOrder: "asc" }] } },
      });
    });

    return NextResponse.json({ deck: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[deck PUT]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const check = await getDeckOrForbid(id, session.user.id);
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  await prisma.deck.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

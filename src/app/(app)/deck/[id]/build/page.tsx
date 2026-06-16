import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCardsByIds } from "@/lib/ygoprodeck";
import { DeckBuilderClient } from "./DeckBuilderClient";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const deck = await prisma.deck.findUnique({ where: { id }, select: { name: true } });
  return { title: deck ? `Edit: ${deck.name}` : "Deck Builder" };
}

export default async function DeckBuilderPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const deck = await prisma.deck.findUnique({
    where: { id },
    include: { cards: { orderBy: [{ zone: "asc" }, { sortOrder: "asc" }] } },
  });

  if (!deck) notFound();
  if (deck.userId !== session!.user.id) redirect("/dashboard");

  const cardIds = [...new Set(deck.cards.map((c) => c.cardId))];
  const cardData = cardIds.length > 0 ? await getCardsByIds(cardIds) : [];
  const cardMap = Object.fromEntries(cardData.map((c) => [c.id, c]));

  return (
    <DeckBuilderClient
      deck={{
        id: deck.id,
        name: deck.name,
        description: deck.description,
        format: deck.format,
        isPublic: deck.isPublic,
        createdAt: deck.createdAt.toISOString(),
        updatedAt: deck.updatedAt.toISOString(),
        cards: deck.cards.map((c) => ({
          cardId: c.cardId,
          zone: c.zone as "MAIN" | "EXTRA" | "SIDE",
          quantity: c.quantity,
        })),
      }}
      initialCardData={cardMap}
    />
  );
}

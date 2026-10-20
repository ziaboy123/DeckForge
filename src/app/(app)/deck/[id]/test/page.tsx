import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDeckCardData } from "@/lib/deckCards";
import { HandTesterClient } from "./HandTesterClient";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const deck = await prisma.deck.findUnique({ where: { id }, select: { name: true } });
  return { title: deck ? `Test: ${deck.name}` : "Hand Tester" };
}

export default async function HandTesterPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  // pages render alongside the layout, so its sign-in redirect doesn't stop this from running: check here too
  // (a signed-out visitor or a login ended by a password change has no session)
  if (!session) redirect("/login");
  const { id } = await params;

  const deck = await prisma.deck.findUnique({
    where: { id },
    include: { cards: true },
  });

  if (!deck) notFound();
  if (deck.userId !== session.user.id) redirect("/dashboard");

  const cardIds = [...new Set(deck.cards.map((c) => c.cardId))];
  const cardData = await getDeckCardData(cardIds, session.user.id);
  const cardMap = Object.fromEntries(cardData.map((c) => [c.id, c]));

  return (
    <HandTesterClient
      deckId={deck.id}
      deckName={deck.name}
      entries={deck.cards.map((c) => ({
        cardId: c.cardId,
        zone: c.zone as "MAIN" | "EXTRA" | "SIDE",
        quantity: c.quantity,
      }))}
      initialCardData={cardMap}
    />
  );
}

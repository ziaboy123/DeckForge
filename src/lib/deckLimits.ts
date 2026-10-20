import { prisma } from "@/lib/db";

// Storage limits for decks. Millennium Arena saves into the same tables with these same numbers, so a deck saved on
// one site always saves on the other. They only stop nonsense: the real 40-60 / 15 / 15 rules show as legality
// warnings in the builder, so an unfinished deck can still be saved.
export const MAX_DECKS = 300;
export const MAX_CARDS_PER_ZONE = 90;
export const MAX_COPIES = 3;
export const DECK_LIMIT_REACHED = `You can have up to ${MAX_DECKS} decks. Delete some to make room.`;

/** True once this account has as many decks as it's allowed. */
export async function deckLimitReached(userId: string) {
  return (await prisma.deck.count({ where: { userId } })) >= MAX_DECKS;
}

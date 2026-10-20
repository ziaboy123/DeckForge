import { headers } from "next/headers";
import { cardLookupAllowed } from "@/lib/cardLimits";
import { clientIp } from "@/lib/rateLimit";
import { getCardsByIds } from "@/lib/ygoprodeck";
import type { YgoCard } from "@/types/yugioh";

/**
 * Card data for a deck page (build, test, analyze), from the local copy of the card database. Only while there's no
 * copy do cards have to come from YGOPRODeck; each time that happens it counts as one of this user's card lookups, so
 * saving made-up ids and reloading over and over can't hog the shared YGOPRODeck budget. Past the limit the page
 * still loads, just without the missing cards' details.
 */
export async function getDeckCardData(cardIds: number[], userId: string): Promise<YgoCard[]> {
  if (cardIds.length === 0) return [];
  const ip = clientIp(await headers());
  return getCardsByIds(cardIds, { canFetch: () => cardLookupAllowed(userId, ip) });
}

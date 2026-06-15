"use client";

import { useState, useCallback, useMemo } from "react";
import { shuffle, expandDeckToCards } from "@/lib/utils";
import type { YgoCard, DeckEntry, HandCard } from "@/types/yugioh";

export function useHandTest(
  mainEntries: DeckEntry[],
  cardCache: Map<number, YgoCard>
) {
  const [hand, setHand] = useState<HandCard[]>([]);
  const [deckPile, setDeckPile] = useState<YgoCard[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [handSize, setHandSize] = useState<5 | 6>(5);

  const mainCards = useMemo(
    () => expandDeckToCards(mainEntries, cardCache),
    [mainEntries, cardCache]
  );

  const initDeck = useCallback(() => {
    const shuffled = shuffle(mainCards);
    setDeckPile(shuffled);
    setHand([]);
    setIsShuffled(true);
    return shuffled;
  }, [mainCards]);

  const drawHand = useCallback(
    (size: 5 | 6 = handSize) => {
      const deck = initDeck();
      const drawn = deck.slice(0, size).map((card, i) => ({
        instanceId: `${card.id}-${i}-${Date.now()}`,
        card,
      }));
      setHand(drawn);
      setDeckPile(deck.slice(size));
    },
    [handSize, initDeck]
  );

  const drawOne = useCallback(() => {
    if (deckPile.length === 0) return;
    const [card, ...rest] = deckPile;
    setHand((prev) => [
      ...prev,
      { instanceId: `${card.id}-${Date.now()}`, card },
    ]);
    setDeckPile(rest);
  }, [deckPile]);

  const reset = useCallback(() => {
    setHand([]);
    setDeckPile([]);
    setIsShuffled(false);
  }, []);

  const deckCount = deckPile.length;
  const totalMainDeck = mainCards.length;

  return {
    hand,
    deckCount,
    totalMainDeck,
    isShuffled,
    handSize,
    setHandSize,
    drawHand,
    drawOne,
    reset,
    initDeck,
  };
}

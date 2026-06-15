"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { isExtraDeckCard, getCardZone } from "@/lib/utils";
import type { YgoCard, DeckEntry, DeckZone } from "@/types/yugioh";

interface UseDeckOptions {
  initialEntries?: DeckEntry[];
}

export function useDeck({ initialEntries = [] }: UseDeckOptions = {}) {
  const [entries, setEntries] = useState<DeckEntry[]>(initialEntries);
  const [cardCache, setCardCache] = useState<Map<number, YgoCard>>(new Map());

  const registerCard = useCallback((card: YgoCard) => {
    setCardCache((prev) => {
      if (prev.has(card.id)) return prev;
      const next = new Map(prev);
      next.set(card.id, card);
      return next;
    });
  }, []);

  const addCard = useCallback((card: YgoCard) => {
    registerCard(card);

    const banTcg = card.banlist_info?.ban_tcg;
    const maxCopies = banTcg === "Banned" ? 0 : banTcg === "Limited" ? 1 : banTcg === "Semi-Limited" ? 2 : 3;
    const zone: DeckZone = getCardZone(card);

    setEntries((prev) => {
      const existing = prev.find((e) => e.cardId === card.id && e.zone === zone);
      const currentTotal = prev
        .filter((e) => e.cardId === card.id)
        .reduce((s, e) => s + e.quantity, 0);

      if (currentTotal >= maxCopies) {
        toast.error(
          banTcg === "Banned"
            ? `${card.name} is banned`
            : `Max ${maxCopies} cop${maxCopies === 1 ? "y" : "ies"} of ${card.name} allowed`
        );
        return prev;
      }

      if (existing) {
        return prev.map((e) =>
          e.cardId === card.id && e.zone === zone
            ? { ...e, quantity: e.quantity + 1 }
            : e
        );
      }
      return [...prev, { cardId: card.id, zone, quantity: 1, card }];
    });
  }, [registerCard]);

  const removeCard = useCallback((cardId: number, zone?: DeckZone) => {
    setEntries((prev) => {
      const targetZone = zone ?? prev.find((e) => e.cardId === cardId)?.zone;
      return prev
        .map((e) => {
          if (e.cardId !== cardId || (targetZone && e.zone !== targetZone)) return e;
          return { ...e, quantity: e.quantity - 1 };
        })
        .filter((e) => e.quantity > 0);
    });
  }, []);

  const clearDeck = useCallback(() => setEntries([]), []);

  const loadEntries = useCallback((newEntries: DeckEntry[], newCards: Map<number, YgoCard>) => {
    setEntries(newEntries);
    setCardCache((prev) => {
      const next = new Map(prev);
      newCards.forEach((v, k) => next.set(k, v));
      return next;
    });
  }, []);

  const mainEntries = useMemo(() => entries.filter((e) => e.zone === "MAIN"), [entries]);
  const extraEntries = useMemo(() => entries.filter((e) => e.zone === "EXTRA"), [entries]);
  const sideEntries = useMemo(() => entries.filter((e) => e.zone === "SIDE"), [entries]);

  const cardCounts = useMemo(() => {
    const map = new Map<number, number>();
    entries.forEach((e) => map.set(e.cardId, (map.get(e.cardId) ?? 0) + e.quantity));
    return map;
  }, [entries]);

  const totalCards = useMemo(
    () => entries.reduce((s, e) => s + e.quantity, 0),
    [entries]
  );

  return {
    entries,
    mainEntries,
    extraEntries,
    sideEntries,
    cardCache,
    cardCounts,
    totalCards,
    addCard,
    removeCard,
    clearDeck,
    loadEntries,
    registerCard,
  };
}

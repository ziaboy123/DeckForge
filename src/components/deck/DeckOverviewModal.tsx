"use client";

import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { CardTooltip } from "@/components/cards/CardTooltip";
import { getCardImageUrl } from "@/lib/ygoprodeck";
import { cn } from "@/lib/utils";
import type { YgoCard, DeckEntry, FrameType } from "@/types/yugioh";

function cardTypeOrder(frameType: FrameType): number {
  const order: Partial<Record<FrameType, number>> = {
    normal: 0,
    effect: 1,
    ritual: 2,
    normal_pendulum: 10,
    effect_pendulum: 11,
    ritual_pendulum: 12,
    fusion: 20,
    fusion_pendulum: 21,
    synchro: 30,
    synchro_pendulum: 31,
    xyz: 40,
    xyz_pendulum: 41,
    link: 50,
    token: 60,
    skill: 70,
    spell: 100,
    trap: 200,
  };
  return order[frameType] ?? 5;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckName: string;
  mainEntries: DeckEntry[];
  extraEntries: DeckEntry[];
  sideEntries: DeckEntry[];
  cards: Map<number, YgoCard>;
}

interface SectionProps {
  title: string;
  entries: DeckEntry[];
  cards: Map<number, YgoCard>;
  max: number;
  countClass: string;
  borderClass: string;
  bgClass: string;
}

function Section({ title, entries, cards, max, countClass, borderClass, bgClass }: SectionProps) {
  const total = entries.reduce((s, e) => s + e.quantity, 0);

  const sortedEntries = [...entries].sort((a, b) => {
    const ca = cards.get(a.cardId);
    const cb = cards.get(b.cardId);
    if (!ca || !cb) return 0;
    return cardTypeOrder(ca.frameType) - cardTypeOrder(cb.frameType);
  });

  const expanded: Array<{ card: YgoCard; key: string }> = [];
  sortedEntries.forEach((entry) => {
    const card = cards.get(entry.cardId);
    if (!card) return;
    for (let i = 0; i < entry.quantity; i++) {
      expanded.push({ card, key: `${entry.cardId}-${i}` });
    }
  });

  return (
    <div className={cn("rounded-xl border p-4", borderClass, bgClass)}>
      <div className="flex items-baseline gap-3 mb-3">
        <h3 className="font-semibold text-primary">{title}</h3>
        <span className={cn("text-sm font-mono font-bold", countClass)}>
          {total} / {max}
        </span>
      </div>

      {expanded.length === 0 ? (
        <p className="text-muted text-sm py-6 text-center">No cards added</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {expanded.map(({ card, key }) => (
            <CardTooltip key={key} card={card}>
              <div className="relative w-[68px] h-[99px] rounded-lg overflow-hidden border border-white/5 hover:border-brand-gold/50 transition-all duration-150 hover:scale-110 hover:z-10 cursor-default shadow-md">
                <Image
                  src={getCardImageUrl(card.id, "small")}
                  alt={card.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </CardTooltip>
          ))}
        </div>
      )}
    </div>
  );
}

export function DeckOverviewModal({
  open,
  onOpenChange,
  deckName,
  mainEntries,
  extraEntries,
  sideEntries,
  cards,
}: Props) {
  const mainTotal = mainEntries.reduce((s, e) => s + e.quantity, 0);
  const extraTotal = extraEntries.reduce((s, e) => s + e.quantity, 0);
  const sideTotal = sideEntries.reduce((s, e) => s + e.quantity, 0);
  const grandTotal = mainTotal + extraTotal + sideTotal;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`${deckName} — ${grandTotal} card${grandTotal !== 1 ? "s" : ""}`}
      size="full"
      className="max-h-[90vh] flex flex-col"
    >
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1 min-h-0">
        <Section
          title="Main Deck"
          entries={mainEntries}
          cards={cards}
          max={60}
          countClass={
            mainTotal > 60
              ? "text-red-400"
              : mainTotal < 40 && mainTotal > 0
              ? "text-yellow-400"
              : "text-orange-400"
          }
          borderClass="border-orange-500/20"
          bgClass="bg-orange-950/10"
        />
        <Section
          title="Extra Deck"
          entries={extraEntries}
          cards={cards}
          max={15}
          countClass={extraTotal > 15 ? "text-red-400" : "text-violet-400"}
          borderClass="border-violet-500/20"
          bgClass="bg-violet-950/10"
        />
        <Section
          title="Side Deck"
          entries={sideEntries}
          cards={cards}
          max={15}
          countClass={sideTotal > 15 ? "text-red-400" : "text-blue-400"}
          borderClass="border-blue-500/20"
          bgClass="bg-blue-950/10"
        />
      </div>
    </Modal>
  );
}

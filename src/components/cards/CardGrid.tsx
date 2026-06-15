"use client";

import { Plus, Minus } from "lucide-react";
import Image from "next/image";
import { cn, getFrameColorHex } from "@/lib/utils";
import { getCardImageUrl } from "@/lib/ygoprodeck";
import { CardTooltip } from "./CardTooltip";
import { Badge } from "@/components/ui/Badge";
import type { YgoCard, DeckZone } from "@/types/yugioh";

interface CardGridProps {
  cards: YgoCard[];
  onAddCard?: (card: YgoCard) => void;
  onAddCardToSide?: (card: YgoCard) => void;
  onRemoveCard?: (card: YgoCard) => void;
  cardCounts?: Map<number, number>;
  loading?: boolean;
}

export function CardGrid({
  cards,
  onAddCard,
  onAddCardToSide,
  onRemoveCard,
  cardCounts,
  loading,
}: CardGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="aspect-[59/86] rounded-lg shimmer" />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-secondary text-sm">No cards found</p>
        <p className="text-muted text-xs mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {cards.map((card) => (
        <CardGridItem
          key={card.id}
          card={card}
          count={cardCounts?.get(card.id) ?? 0}
          onAdd={onAddCard}
          onAddToSide={onAddCardToSide}
          onRemove={onRemoveCard}
        />
      ))}
    </div>
  );
}

interface CardGridItemProps {
  card: YgoCard;
  count: number;
  onAdd?: (card: YgoCard) => void;
  onAddToSide?: (card: YgoCard) => void;
  onRemove?: (card: YgoCard) => void;
}

function CardGridItem({ card, count, onAdd, onAddToSide, onRemove }: CardGridItemProps) {
  const accentColor = getFrameColorHex(card.frameType);
  const isMaxed = count >= 3;
  const banTcg = card.banlist_info?.ban_tcg;
  const maxAllowed = banTcg === "Banned" ? 0 : banTcg === "Limited" ? 1 : banTcg === "Semi-Limited" ? 2 : 3;

  return (
    <CardTooltip card={card} side="right">
      <div
        className={cn(
          "group relative rounded-lg overflow-hidden cursor-pointer",
          "border transition-all duration-200",
          count > 0
            ? "border-2 shadow-md"
            : "border-border/50 hover:border-border"
        )}
        style={count > 0 ? { borderColor: accentColor, boxShadow: `0 0 12px ${accentColor}30` } : {}}
      >
        {/* Card image */}
        <div className="relative aspect-[59/86]">
          <Image
            src={getCardImageUrl(card.id, "small")}
            alt={card.name}
            fill
            className="object-cover"
            unoptimized
          />

          {/* Overlay controls */}
          {(onAdd || onAddToSide || onRemove) && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
              <div className="flex items-center gap-1">
                {onRemove && count > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(card); }}
                    title="Remove"
                    className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow-card"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                )}
                {onAdd && count < maxAllowed && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onAdd(card); }}
                    title="Add to deck"
                    className="w-6 h-6 rounded-full bg-brand-gold text-bg-base flex items-center justify-center hover:bg-brand-gold-light transition-colors shadow-card"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
              {onAddToSide && count < maxAllowed && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAddToSide(card); }}
                  title="Add to Side Deck"
                  className="h-5 px-2 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-500 transition-colors shadow-card text-[10px] font-bold tracking-wide"
                >
                  SIDE
                </button>
              )}
            </div>
          )}

          {/* Count badge */}
          {count > 0 && (
            <div
              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-bg-base shadow"
              style={{ backgroundColor: accentColor }}
            >
              {count}
            </div>
          )}

          {/* Banned overlay */}
          {banTcg === "Banned" && (
            <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center">
              <span className="text-red-400 text-xs font-bold bg-red-900/80 px-1.5 py-0.5 rounded">BANNED</span>
            </div>
          )}
        </div>
      </div>
    </CardTooltip>
  );
}

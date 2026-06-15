"use client";

import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import { cn, getFrameColorHex } from "@/lib/utils";
import { getCardImageUrl } from "@/lib/ygoprodeck";
import { CardTooltip } from "@/components/cards/CardTooltip";
import type { YgoCard, DeckEntry, DeckZone as DeckZoneType } from "@/types/yugioh";

interface DeckZoneProps {
  zone: DeckZoneType;
  entries: DeckEntry[];
  cards: Map<number, YgoCard>;
  onAdd?: (cardId: number) => void;
  onRemove?: (cardId: number) => void;
  maxSize?: number;
  title: string;
  emptyMessage?: string;
}

const ZONE_MAX: Record<DeckZoneType, number> = {
  MAIN: 60,
  EXTRA: 15,
  SIDE: 15,
};

export function DeckZone({
  zone,
  entries,
  cards,
  onAdd,
  onRemove,
  title,
  emptyMessage,
}: DeckZoneProps) {
  const total = entries.reduce((s, e) => s + e.quantity, 0);
  const max = ZONE_MAX[zone];
  const pct = Math.min((total / max) * 100, 100);
  const isOverLimit = total > max;
  const isUnderMinimum = zone === "MAIN" && total < 40 && total > 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-mono font-semibold",
              isOverLimit ? "text-red-400" : isUnderMinimum ? "text-yellow-400" : "text-secondary"
            )}
          >
            {total}/{max}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isOverLimit ? "bg-red-500" : isUnderMinimum ? "bg-yellow-500" : "bg-brand-gold"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Cards list */}
      <div className="space-y-px max-h-[400px] overflow-y-auto pr-1">
        {entries.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center">{emptyMessage ?? "No cards"}</p>
        ) : (
          entries.map((entry) => {
            const card = cards.get(entry.cardId);
            if (!card) return null;
            return (
              <DeckZoneCard
                key={entry.cardId}
                card={card}
                quantity={entry.quantity}
                onAdd={onAdd ? () => onAdd(entry.cardId) : undefined}
                onRemove={onRemove ? () => onRemove(entry.cardId) : undefined}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

interface DeckZoneCardProps {
  card: YgoCard;
  quantity: number;
  onAdd?: () => void;
  onRemove?: () => void;
}

function DeckZoneCard({ card, quantity, onAdd, onRemove }: DeckZoneCardProps) {
  const accentColor = getFrameColorHex(card.frameType);
  const banTcg = card.banlist_info?.ban_tcg;
  const maxAllowed = banTcg === "Banned" ? 0 : banTcg === "Limited" ? 1 : banTcg === "Semi-Limited" ? 2 : 3;

  return (
    <CardTooltip card={card} side="left">
      <div className="group flex items-center gap-2 px-2 py-1 rounded hover:bg-bg-elevated transition-colors cursor-default">
        {/* Tiny image */}
        <div className="shrink-0 w-7 h-10 rounded overflow-hidden">
          <Image
            src={getCardImageUrl(card.id, "small")}
            alt={card.name}
            width={28}
            height={40}
            className="object-cover w-full h-full"
            unoptimized
          />
        </div>

        {/* Name */}
        <span
          className="flex-1 text-xs truncate font-medium"
          style={{ color: accentColor }}
        >
          {card.name}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {onRemove && (
            <button
              onClick={onRemove}
              className="w-5 h-5 rounded flex items-center justify-center text-muted hover:text-red-400 hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Minus className="w-3 h-3" />
            </button>
          )}
          <span className="text-xs font-bold text-secondary w-4 text-center">
            {quantity}
          </span>
          {onAdd && (
            <button
              onClick={onAdd}
              disabled={quantity >= maxAllowed}
              className="w-5 h-5 rounded flex items-center justify-center text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </CardTooltip>
  );
}

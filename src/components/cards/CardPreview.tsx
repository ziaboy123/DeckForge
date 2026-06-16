"use client";

import Image from "next/image";
import { getCardImageUrl } from "@/lib/ygoprodeck";
import { getFrameColorHex } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { YgoCard } from "@/types/yugioh";

interface CardPreviewProps {
  card: YgoCard | null;
}

export function CardPreview({ card }: CardPreviewProps) {
  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <p className="text-muted text-sm">Click any card to preview it here</p>
      </div>
    );
  }

  const accentColor = getFrameColorHex(card.frameType);
  const banTcg = card.banlist_info?.ban_tcg;
  const isMonster = !["spell", "trap", "token", "skill"].includes(card.frameType);

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pr-1">
      {/* Full card image */}
      <div className="relative w-full aspect-[59/86] rounded-lg overflow-hidden shadow-card flex-shrink-0">
        <Image
          src={getCardImageUrl(card.id, "normal")}
          alt={card.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Card info */}
      <div className="space-y-3">
        <h3 className="font-bold text-base leading-tight" style={{ color: accentColor }}>
          {card.name}
        </h3>

        <p className="text-xs text-muted">{card.type}</p>

        {isMonster && (
          <div className="flex flex-wrap gap-2 text-xs text-secondary">
            {card.attribute && <span className="font-medium">{card.attribute}</span>}
            {card.level != null && <span>★ {card.level}</span>}
            {card.linkval != null && <span>LINK-{card.linkval}</span>}
            {card.race && <span>{card.race}</span>}
          </div>
        )}

        {(card.atk != null || card.def != null) && (
          <div className="flex gap-4 font-mono text-sm">
            {card.atk != null && (
              <span><span className="text-muted text-xs">ATK</span> <span className="text-primary font-bold">{card.atk}</span></span>
            )}
            {card.def != null && (
              <span><span className="text-muted text-xs">DEF</span> <span className="text-primary font-bold">{card.def}</span></span>
            )}
          </div>
        )}

        {banTcg && (
          <Badge
            variant={
              banTcg === "Banned" ? "banned"
              : banTcg === "Limited" ? "limited"
              : banTcg === "Semi-Limited" ? "semi-limited"
              : "unlimited"
            }
          >
            {banTcg}
          </Badge>
        )}

        {card.archetype && (
          <p className="text-xs text-muted">Archetype: <span className="text-secondary">{card.archetype}</span></p>
        )}

        <p className="text-xs text-secondary leading-relaxed border-t border-border pt-3 whitespace-pre-line">
          {card.desc}
        </p>
      </div>
    </div>
  );
}

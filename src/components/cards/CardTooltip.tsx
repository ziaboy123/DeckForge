"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import Image from "next/image";
import { cn, getFrameColorHex } from "@/lib/utils";
import { getCardImageUrl } from "@/lib/ygoprodeck";
import { Badge } from "@/components/ui/Badge";
import type { YgoCard } from "@/types/yugioh";

interface CardTooltipProps {
  card: YgoCard;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

export function CardTooltip({ card, children, side = "right" }: CardTooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={400}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={8}
            className={cn(
              "z-50 w-72 rounded-xl border border-border bg-bg-card shadow-card",
              "animate-fade-in pointer-events-none"
            )}
          >
            <CardTooltipContent card={card} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

function CardTooltipContent({ card }: { card: YgoCard }) {
  const accentColor = getFrameColorHex(card.frameType);
  const banTcg = card.banlist_info?.ban_tcg;

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex gap-3">
        <div className="shrink-0">
          <Image
            src={getCardImageUrl(card.id, "small")}
            alt={card.name}
            width={60}
            height={88}
            className="rounded"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4
            className="text-sm font-semibold leading-tight"
            style={{ color: accentColor }}
          >
            {card.name}
          </h4>
          <p className="text-xs text-muted mt-0.5">{card.type}</p>

          {/* Stats */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {card.level !== undefined && (
              <Badge variant="default">⭐ {card.level}</Badge>
            )}
            {card.linkval !== undefined && (
              <Badge variant="default">🔗 {card.linkval}</Badge>
            )}
            {card.attribute && (
              <Badge variant="default">{card.attribute}</Badge>
            )}
            {banTcg && (
              <Badge
                variant={
                  banTcg === "Banned"
                    ? "banned"
                    : banTcg === "Limited"
                    ? "limited"
                    : "semi-limited"
                }
              >
                {banTcg}
              </Badge>
            )}
          </div>

          {/* ATK/DEF */}
          {(card.atk !== undefined || card.def !== undefined) && (
            <div className="flex gap-3 mt-1.5 text-xs text-secondary font-mono">
              {card.atk !== undefined && <span>ATK {card.atk}</span>}
              {card.def !== undefined && <span>DEF {card.def}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-secondary leading-relaxed line-clamp-5 border-t border-border pt-2">
        {card.desc}
      </p>
    </div>
  );
}

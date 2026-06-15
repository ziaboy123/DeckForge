"use client";

import Image from "next/image";
import { useState } from "react";
import { cn, getFrameColorHex } from "@/lib/utils";
import { getCardImageUrl } from "@/lib/ygoprodeck";
import type { YgoCard } from "@/types/yugioh";

interface CardImageProps {
  card: YgoCard;
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
  showName?: boolean;
}

const sizeConfig = {
  sm: { width: 64, height: 93, className: "w-16" },
  md: { width: 100, height: 146, className: "w-24" },
  lg: { width: 160, height: 234, className: "w-40" },
};

export function CardImage({ card, size = "md", className, priority, showName }: CardImageProps) {
  const [error, setError] = useState(false);
  const cfg = sizeConfig[size];
  const imageUrl = getCardImageUrl(card.id, size === "sm" ? "small" : "normal");
  const accentColor = getFrameColorHex(card.frameType);

  return (
    <div className={cn("relative flex-shrink-0", cfg.className, className)}>
      {error ? (
        <CardPlaceholder card={card} accentColor={accentColor} />
      ) : (
        <Image
          src={imageUrl}
          alt={card.name}
          width={cfg.width}
          height={cfg.height}
          className="rounded object-cover w-full h-auto"
          priority={priority}
          onError={() => setError(true)}
          unoptimized
        />
      )}
      {showName && (
        <div className="mt-1 text-center text-xs text-secondary truncate max-w-full px-0.5">
          {card.name}
        </div>
      )}
    </div>
  );
}

function CardPlaceholder({
  card,
  accentColor,
}: {
  card: YgoCard;
  accentColor: string;
}) {
  return (
    <div
      className="aspect-[59/86] w-full rounded flex flex-col items-center justify-center p-1"
      style={{ backgroundColor: `${accentColor}22`, border: `1px solid ${accentColor}44` }}
    >
      <div
        className="text-[10px] font-semibold text-center leading-tight px-1 truncate w-full"
        style={{ color: accentColor }}
      >
        {card.name}
      </div>
    </div>
  );
}

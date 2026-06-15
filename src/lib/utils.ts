import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { YgoCard, DeckEntry, DeckStats, FrameType } from "@/types/yugioh";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isExtraDeckCard(card: YgoCard): boolean {
  const extraTypes = ["Fusion Monster", "Synchro Monster", "XYZ Monster", "Link Monster"];
  const extraFrames: FrameType[] = ["fusion", "synchro", "xyz", "link", "fusion_pendulum", "synchro_pendulum", "xyz_pendulum"];
  return (
    extraTypes.some((t) => card.type.includes(t)) ||
    extraFrames.includes(card.frameType)
  );
}

export function getCardZone(card: YgoCard): "MAIN" | "EXTRA" | "SIDE" {
  if (isExtraDeckCard(card)) return "EXTRA";
  return "MAIN";
}

export function getFrameColor(frameType: FrameType): string {
  const map: Record<FrameType, string> = {
    normal: "card-normal",
    effect: "card-effect",
    ritual: "card-ritual",
    ritual_pendulum: "card-ritual",
    fusion: "card-fusion",
    fusion_pendulum: "card-fusion",
    synchro: "card-synchro",
    synchro_pendulum: "card-synchro",
    xyz: "card-xyz",
    xyz_pendulum: "card-xyz",
    link: "card-link",
    normal_pendulum: "card-pendulum",
    effect_pendulum: "card-pendulum",
    spell: "card-spell",
    trap: "card-trap",
    token: "bg-gray-500",
    skill: "bg-blue-700",
  };
  return map[frameType] ?? "bg-gray-600";
}

export function getFrameColorHex(frameType: FrameType): string {
  const map: Record<FrameType, string> = {
    normal: "#fde68a",
    effect: "#fb923c",
    ritual: "#93c5fd",
    ritual_pendulum: "#93c5fd",
    fusion: "#a78bfa",
    fusion_pendulum: "#a78bfa",
    synchro: "#e2e8f0",
    synchro_pendulum: "#e2e8f0",
    xyz: "#374151",
    xyz_pendulum: "#374151",
    link: "#60a5fa",
    normal_pendulum: "#34d399",
    effect_pendulum: "#34d399",
    spell: "#34d399",
    trap: "#f472b6",
    token: "#6b7280",
    skill: "#1d4ed8",
  };
  return map[frameType] ?? "#6b7280";
}

export function calculateDeckStats(entries: DeckEntry[], cards: Map<number, YgoCard>): DeckStats {
  const main = entries.filter((e) => e.zone === "MAIN");
  const extra = entries.filter((e) => e.zone === "EXTRA");
  const side = entries.filter((e) => e.zone === "SIDE");

  const mainTotal = main.reduce((s, e) => s + e.quantity, 0);
  const extraTotal = extra.reduce((s, e) => s + e.quantity, 0);
  const sideTotal = side.reduce((s, e) => s + e.quantity, 0);

  let monsterCount = 0;
  let spellCount = 0;
  let trapCount = 0;
  let normalMonsterCount = 0;
  let effectMonsterCount = 0;
  let fusionCount = 0;
  let synchroCount = 0;
  let xyzCount = 0;
  let linkCount = 0;
  let ritualCount = 0;
  let pendulumCount = 0;
  const archetypeBreakdown: Record<string, number> = {};
  const attributeBreakdown: Record<string, number> = {};
  const levelBreakdown: Record<string, number> = {};
  const legalityErrors: string[] = [];
  const cardCopyCounts = new Map<number, number>();

  for (const entry of entries) {
    const card = cards.get(entry.cardId);
    const qty = entry.quantity;
    cardCopyCounts.set(entry.cardId, (cardCopyCounts.get(entry.cardId) ?? 0) + qty);

    if (!card) continue;

    const ft = card.frameType;

    if (entry.zone === "MAIN") {
      if (card.type.includes("Spell")) spellCount += qty;
      else if (card.type.includes("Trap")) trapCount += qty;
      else {
        monsterCount += qty;
        if (ft === "normal") normalMonsterCount += qty;
        else if (ft === "effect") effectMonsterCount += qty;
        else if (ft.includes("ritual")) ritualCount += qty;
        else if (ft.includes("pendulum")) pendulumCount += qty;
      }
    } else if (entry.zone === "EXTRA") {
      if (ft.includes("fusion")) fusionCount += qty;
      else if (ft.includes("synchro")) synchroCount += qty;
      else if (ft.includes("xyz")) xyzCount += qty;
      else if (ft === "link") linkCount += qty;
    }

    if (card.archetype) {
      archetypeBreakdown[card.archetype] = (archetypeBreakdown[card.archetype] ?? 0) + qty;
    }

    if (card.attribute) {
      attributeBreakdown[card.attribute] = (attributeBreakdown[card.attribute] ?? 0) + qty;
    }

    if (card.level) {
      const levelKey = `Level ${card.level}`;
      levelBreakdown[levelKey] = (levelBreakdown[levelKey] ?? 0) + qty;
    }
    if (card.linkval) {
      const linkKey = `Link ${card.linkval}`;
      levelBreakdown[linkKey] = (levelBreakdown[linkKey] ?? 0) + qty;
    }
  }

  // Legality checks
  if (mainTotal < 40) legalityErrors.push(`Main Deck has ${mainTotal} cards (minimum 40)`);
  if (mainTotal > 60) legalityErrors.push(`Main Deck has ${mainTotal} cards (maximum 60)`);
  if (extraTotal > 15) legalityErrors.push(`Extra Deck has ${extraTotal} cards (maximum 15)`);
  if (sideTotal > 15) legalityErrors.push(`Side Deck has ${sideTotal} cards (maximum 15)`);
  cardCopyCounts.forEach((count, id) => {
    if (count > 3) {
      const card = cards.get(id);
      legalityErrors.push(`${card?.name ?? `Card #${id}`} has ${count} copies (maximum 3)`);
    }
  });

  return {
    totalCards: mainTotal + extraTotal + sideTotal,
    mainDeckCount: mainTotal,
    extraDeckCount: extraTotal,
    sideDeckCount: sideTotal,
    monsterCount,
    spellCount,
    trapCount,
    normalMonsterCount,
    effectMonsterCount,
    fusionCount,
    synchroCount,
    xyzCount,
    linkCount,
    ritualCount,
    pendulumCount,
    archetypeBreakdown,
    attributeBreakdown,
    levelBreakdown,
    isLegal: legalityErrors.length === 0,
    legalityErrors,
  };
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function expandDeckToCards(
  entries: DeckEntry[],
  cards: Map<number, YgoCard>
): YgoCard[] {
  const result: YgoCard[] = [];
  for (const entry of entries) {
    const card = cards.get(entry.cardId);
    if (!card) continue;
    for (let i = 0; i < entry.quantity; i++) {
      result.push(card);
    }
  }
  return result;
}

export function parseDeckList(text: string): { cardName: string; quantity: number; zone: string }[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const result: { cardName: string; quantity: number; zone: string }[] = [];
  let currentZone = "MAIN";

  for (const line of lines) {
    if (/^#main/i.test(line)) { currentZone = "MAIN"; continue; }
    if (/^#extra/i.test(line)) { currentZone = "EXTRA"; continue; }
    if (/^#side/i.test(line)) { currentZone = "SIDE"; continue; }
    if (line.startsWith("#") || line.startsWith("!")) continue;

    // Format: "3 Dark Magician" or "Dark Magician x3" or "Dark Magician"
    const matchPrefix = line.match(/^(\d+)\s+(.+)$/);
    const matchSuffix = line.match(/^(.+?)\s*[xX](\d+)$/);

    if (matchPrefix) {
      result.push({ quantity: parseInt(matchPrefix[1]), cardName: matchPrefix[2].trim(), zone: currentZone });
    } else if (matchSuffix) {
      result.push({ quantity: parseInt(matchSuffix[2]), cardName: matchSuffix[1].trim(), zone: currentZone });
    } else {
      result.push({ quantity: 1, cardName: line.trim(), zone: currentZone });
    }
  }

  return result;
}

export function exportDeckList(
  entries: DeckEntry[],
  cards: Map<number, YgoCard>,
  deckName: string
): string {
  const main = entries.filter((e) => e.zone === "MAIN");
  const extra = entries.filter((e) => e.zone === "EXTRA");
  const side = entries.filter((e) => e.zone === "SIDE");

  const lines = [`#deck: ${deckName}`, "#main"];
  for (const e of main) {
    const name = cards.get(e.cardId)?.name ?? `Unknown (${e.cardId})`;
    lines.push(`${e.quantity} ${name}`);
  }
  if (extra.length) {
    lines.push("#extra");
    for (const e of extra) {
      const name = cards.get(e.cardId)?.name ?? `Unknown (${e.cardId})`;
      lines.push(`${e.quantity} ${name}`);
    }
  }
  if (side.length) {
    lines.push("#side");
    for (const e of side) {
      const name = cards.get(e.cardId)?.name ?? `Unknown (${e.cardId})`;
      lines.push(`${e.quantity} ${name}`);
    }
  }
  return lines.join("\n");
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

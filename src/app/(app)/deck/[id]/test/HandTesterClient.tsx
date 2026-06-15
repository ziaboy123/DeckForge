"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Shuffle,
  ChevronLeft,
  RotateCcw,
  ChevronsRight,
  Plus,
  Edit3,
  BarChart3,
  Layers,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CardTooltip } from "@/components/cards/CardTooltip";
import { Badge } from "@/components/ui/Badge";
import { useDeck } from "@/hooks/useDeck";
import { useHandTest } from "@/hooks/useHandTest";
import { getCardImageUrl } from "@/lib/ygoprodeck";
import { getFrameColorHex, cn, shuffle, expandDeckToCards } from "@/lib/utils";
import type { DeckEntry, YgoCard } from "@/types/yugioh";

interface Props {
  deckId: string;
  deckName: string;
  entries: DeckEntry[];
  initialCardData: Record<number, YgoCard>;
}

type Mode = "hand" | "goldfish";

export function HandTesterClient({ deckId, deckName, entries, initialCardData }: Props) {
  const [mode, setMode] = useState<Mode>("hand");

  const { mainEntries, cardCache, loadEntries } = useDeck({ initialEntries: entries });

  useEffect(() => {
    const cardMap = new Map(
      Object.entries(initialCardData).map(([k, v]) => [Number(k), v])
    );
    loadEntries(entries, cardMap);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { hand, deckCount, totalMainDeck, isShuffled, handSize, setHandSize, drawHand, drawOne, reset } =
    useHandTest(mainEntries, cardCache);

  const mainCardCount = mainEntries.reduce((s, e) => s + e.quantity, 0);
  const hasEnoughCards = mainCardCount >= 5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </Button>
        <h1 className="text-lg font-bold text-primary flex-1">{deckName}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/deck/${deckId}/build`}>
              <Edit3 className="w-4 h-4" /> Edit
            </Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/deck/${deckId}/analyze`}>
              <BarChart3 className="w-4 h-4" /> Analyze
            </Link>
          </Button>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 border-b border-border pb-4">
        <button
          onClick={() => setMode("hand")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            mode === "hand"
              ? "bg-bg-elevated text-primary border border-border"
              : "text-secondary hover:text-primary"
          )}
        >
          <Shuffle className="w-4 h-4" />
          Hand Testing
        </button>
        <button
          onClick={() => setMode("goldfish")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            mode === "goldfish"
              ? "bg-bg-elevated text-primary border border-border"
              : "text-secondary hover:text-primary"
          )}
        >
          <Zap className="w-4 h-4" />
          Goldfish Mode
        </button>
      </div>

      {mode === "hand" ? (
        <HandTestingMode
          hand={hand}
          deckCount={deckCount}
          totalMainDeck={totalMainDeck}
          handSize={handSize}
          setHandSize={setHandSize}
          drawHand={drawHand}
          drawOne={drawOne}
          reset={reset}
          isShuffled={isShuffled}
          hasEnoughCards={hasEnoughCards}
          mainCardCount={mainCardCount}
        />
      ) : (
        <GoldfishMode entries={mainEntries} cardCache={cardCache} />
      )}
    </div>
  );
}

// ─── Hand Testing Mode ─────────────────────────────────────────────────────

interface HandTestingModeProps {
  hand: { instanceId: string; card: YgoCard }[];
  deckCount: number;
  totalMainDeck: number;
  handSize: 5 | 6;
  setHandSize: (s: 5 | 6) => void;
  drawHand: (size?: 5 | 6) => void;
  drawOne: () => void;
  reset: () => void;
  isShuffled: boolean;
  hasEnoughCards: boolean;
  mainCardCount: number;
}

function HandTestingMode({
  hand, deckCount, totalMainDeck, handSize, setHandSize,
  drawHand, drawOne, reset, isShuffled, hasEnoughCards, mainCardCount,
}: HandTestingModeProps) {
  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-bg-card border border-border rounded-xl">
        <div className="flex items-center gap-1 bg-bg-base rounded-lg p-1 border border-border">
          <button
            onClick={() => setHandSize(5)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              handSize === 5 ? "bg-brand-gold text-bg-base" : "text-secondary hover:text-primary"
            )}
          >
            5 cards
          </button>
          <button
            onClick={() => setHandSize(6)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              handSize === 6 ? "bg-brand-gold text-bg-base" : "text-secondary hover:text-primary"
            )}
          >
            6 cards
          </button>
        </div>

        <Button
          onClick={() => drawHand(handSize)}
          disabled={!hasEnoughCards}
          leftIcon={<Shuffle className="w-4 h-4" />}
        >
          Draw opening hand
        </Button>

        {isShuffled && (
          <>
            <Button
              variant="secondary"
              onClick={drawOne}
              disabled={deckCount === 0}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Draw one
            </Button>
            <Button
              variant="secondary"
              onClick={reset}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reset
            </Button>
          </>
        )}

        <div className="ml-auto flex items-center gap-4 text-sm text-secondary">
          <span>
            <span className="font-bold text-primary">{hand.length}</span> in hand
          </span>
          <span>
            <span className="font-bold text-primary">{deckCount}</span>/{totalMainDeck} in deck
          </span>
        </div>
      </div>

      {!hasEnoughCards && (
        <div className="p-4 border border-yellow-500/30 bg-yellow-900/10 rounded-xl text-sm text-yellow-400">
          Your main deck needs at least 5 cards to test hands. Currently has {mainCardCount}.
        </div>
      )}

      {hand.length === 0 && hasEnoughCards && (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl">
          <Shuffle className="w-12 h-12 text-muted mb-4" />
          <p className="text-secondary font-medium">Click &quot;Draw opening hand&quot; to begin</p>
          <p className="text-muted text-sm mt-1">Your hand will appear here</p>
        </div>
      )}

      {hand.length > 0 && (
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {hand.map((hc, i) => (
              <HandCardDisplay key={hc.instanceId} card={hc.card} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HandCardDisplay({ card, index }: { card: YgoCard; index: number }) {
  const color = getFrameColorHex(card.frameType);
  return (
    <CardTooltip card={card} side="top">
      <div
        className="relative flex flex-col items-center gap-2 animate-slide-up"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div
          className="rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-2 cursor-default"
          style={{ boxShadow: `0 4px 24px ${color}30` }}
        >
          <Image
            src={getCardImageUrl(card.id, "normal")}
            alt={card.name}
            width={100}
            height={146}
            className="w-24 sm:w-28 h-auto object-cover"
            unoptimized
          />
        </div>
        <p className="text-xs text-secondary text-center max-w-[100px] truncate">{card.name}</p>
      </div>
    </CardTooltip>
  );
}

// ─── Goldfish Mode ─────────────────────────────────────────────────────────

type GoldfishZone = "deck" | "hand" | "field" | "graveyard" | "banished";

interface GoldfishCard { instanceId: string; card: YgoCard }
type GoldfishState = Record<GoldfishZone, GoldfishCard[]>;

interface GoldfishModeProps {
  entries: DeckEntry[];
  cardCache: Map<number, YgoCard>;
}

function GoldfishMode({ entries, cardCache }: GoldfishModeProps) {
  const emptyState: GoldfishState = { deck: [], hand: [], field: [], graveyard: [], banished: [] };
  const [zones, setZones] = useState<GoldfishState>(emptyState);

  const initGame = useCallback(() => {
    const cards = shuffle(expandDeckToCards(entries, cardCache));
    const tagged: GoldfishCard[] = cards.map((c, i) => ({ instanceId: `${c.id}-${i}-${Date.now()}`, card: c }));
    setZones({
      deck: tagged.slice(5),
      hand: tagged.slice(0, 5),
      field: [],
      graveyard: [],
      banished: [],
    });
  }, [entries, cardCache]);

  const moveCard = useCallback((instanceId: string, from: GoldfishZone, to: GoldfishZone) => {
    setZones((prev) => {
      const card = prev[from].find((c) => c.instanceId === instanceId);
      if (!card) return prev;
      return {
        ...prev,
        [from]: prev[from].filter((c) => c.instanceId !== instanceId),
        [to]: [...prev[to], card],
      };
    });
  }, []);

  const drawCard = useCallback(() => {
    setZones((prev) => {
      if (prev.deck.length === 0) return prev;
      const [top, ...rest] = prev.deck;
      return { ...prev, deck: rest, hand: [...prev.hand, top] };
    });
  }, []);

  const isInitialized = Object.values(zones).some((z) => z.length > 0);

  const zoneConfig: { key: GoldfishZone; label: string; color: string }[] = [
    { key: "hand", label: "Hand", color: "#f0c040" },
    { key: "field", label: "Field", color: "#22c55e" },
    { key: "graveyard", label: "Graveyard", color: "#6b7280" },
    { key: "banished", label: "Banished", color: "#a78bfa" },
    { key: "deck", label: "Deck", color: "#3b82f6" },
  ];

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl">
        <Zap className="w-12 h-12 text-muted mb-4" />
        <p className="text-secondary font-medium mb-2">Goldfish Mode</p>
        <p className="text-muted text-sm mb-6 text-center max-w-xs">
          Draw an opening hand and move cards freely between zones to test your combo lines. No rules engine.
        </p>
        <Button onClick={initGame} leftIcon={<Shuffle className="w-4 h-4" />}>
          Start goldfish
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={drawCard} disabled={zones.deck.length === 0}>
          <ChevronsRight className="w-4 h-4" /> Draw
        </Button>
        <Button variant="secondary" size="sm" onClick={initGame}>
          <RotateCcw className="w-4 h-4" /> Restart
        </Button>
        <span className="text-xs text-muted ml-auto">
          Click a card, then choose a zone to move it
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {zoneConfig.map(({ key, label, color }) => (
          <GoldfishZonePanel
            key={key}
            zoneKey={key}
            label={label}
            color={color}
            cards={zones[key]}
            onMove={(instanceId, to) => moveCard(instanceId, key, to)}
            otherZones={zoneConfig.filter((z) => z.key !== key)}
          />
        ))}
      </div>
    </div>
  );
}

function GoldfishZonePanel({
  zoneKey,
  label,
  color,
  cards,
  onMove,
  otherZones,
}: {
  zoneKey: GoldfishZone;
  label: string;
  color: string;
  cards: GoldfishCard[];
  onMove: (instanceId: string, to: GoldfishZone) => void;
  otherZones: { key: GoldfishZone; label: string; color: string }[];
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="rounded-xl border bg-bg-card p-4" style={{ borderColor: `${color}40` }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color }}>
          <Layers className="w-4 h-4" />
          {label}
        </h3>
        <Badge variant="default">{cards.length}</Badge>
      </div>

      {selected && (
        <div className="mb-3 p-2 bg-bg-elevated rounded-lg border border-border space-y-1.5">
          <p className="text-xs text-secondary">Move to:</p>
          <div className="flex flex-wrap gap-1.5">
            {otherZones.map((z) => (
              <button
                key={z.key}
                onClick={() => { onMove(selected, z.key); setSelected(null); }}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                style={{ background: `${z.color}20`, color: z.color, border: `1px solid ${z.color}40` }}
              >
                {z.label}
              </button>
            ))}
            <button
              onClick={() => setSelected(null)}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-bg-hover text-secondary border border-border"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 min-h-[64px]">
        {zoneKey === "deck" ? (
          <p className="text-xs text-muted self-center">
            {cards.length} card{cards.length !== 1 ? "s" : ""} remaining
          </p>
        ) : (
          cards.map((c) => (
            <CardTooltip key={c.instanceId} card={c.card} side="top">
              <button
                onClick={() => setSelected((p) => (p === c.instanceId ? null : c.instanceId))}
                className={cn(
                  "rounded overflow-hidden transition-all duration-150 hover:scale-105",
                  selected === c.instanceId && "ring-2 ring-brand-gold scale-110 z-10 relative"
                )}
              >
                <Image
                  src={getCardImageUrl(c.card.id, "small")}
                  alt={c.card.name}
                  width={36}
                  height={52}
                  className="w-9 h-auto object-cover"
                  unoptimized
                />
              </button>
            </CardTooltip>
          ))
        )}
      </div>
    </div>
  );
}

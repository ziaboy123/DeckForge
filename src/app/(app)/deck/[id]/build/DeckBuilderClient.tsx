"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Save,
  Search,
  Download,
  Upload,
  TestTube,
  BarChart3,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  X,
  Minus,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CardGrid } from "@/components/cards/CardGrid";
import { CardFilters } from "@/components/cards/CardFilters";
import { CardTooltip } from "@/components/cards/CardTooltip";
import { CardPreview } from "@/components/cards/CardPreview";
import { Modal } from "@/components/ui/Modal";
import { useDeck } from "@/hooks/useDeck";
import { cn, calculateDeckStats, exportDeckList, parseDeckList } from "@/lib/utils";
import { getCardImageUrl } from "@/lib/ygoprodeck";
import type { DeckData, DeckEntry, SearchFilters, YgoCard } from "@/types/yugioh";

interface Props {
  deck: DeckData;
  initialCardData: Record<number, YgoCard>;
}

function cardTypeOrder(frameType: string): number {
  const order: Record<string, number> = {
    normal: 0, effect: 1, ritual: 2,
    normal_pendulum: 10, effect_pendulum: 11, ritual_pendulum: 12,
    fusion: 20, fusion_pendulum: 21,
    synchro: 30, synchro_pendulum: 31,
    xyz: 40, xyz_pendulum: 41,
    link: 50, token: 60, skill: 70,
    spell: 100, trap: 200,
  };
  return order[frameType] ?? 5;
}

interface DeckSectionProps {
  title: string;
  zone: "MAIN" | "EXTRA" | "SIDE";
  entries: DeckEntry[];
  cards: Map<number, YgoCard>;
  max: number;
  countClass: string;
  onRemove: (cardId: number) => void;
  onMoveToSide?: (cardId: number) => void;
  onSelectCard?: (card: YgoCard) => void;
}

function DeckSection({ title, zone, entries, cards, max, countClass, onRemove, onMoveToSide, onSelectCard }: DeckSectionProps) {
  const total = entries.reduce((s, e) => s + e.quantity, 0);
  const pct = Math.min((total / max) * 100, 100);
  const isOver = total > max;
  const isUnder = title === "Main Deck" && total < 40 && total > 0;

  const sorted = [...entries].sort((a, b) => {
    const ca = cards.get(a.cardId);
    const cb = cards.get(b.cardId);
    if (!ca || !cb) return 0;
    return cardTypeOrder(ca.frameType) - cardTypeOrder(cb.frameType);
  });

  const expanded: Array<{ card: YgoCard; cardId: number; key: string }> = [];
  sorted.forEach((entry) => {
    const card = cards.get(entry.cardId);
    if (!card) return;
    for (let i = 0; i < entry.quantity; i++) {
      expanded.push({ card, cardId: entry.cardId, key: `${entry.cardId}-${i}` });
    }
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-primary">{title}</span>
        <span className={cn("text-sm font-mono font-bold ml-auto", countClass)}>
          {total} / {max}
        </span>
      </div>
      <div className="h-1 bg-bg-elevated rounded-full overflow-hidden mb-3">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isOver ? "bg-red-500" : isUnder ? "bg-yellow-500" : "bg-brand-gold"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {expanded.length === 0 ? (
        <p className="text-xs text-muted text-center py-3">No cards</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {expanded.map(({ card, cardId, key }) => (
            <CardTooltip key={key} card={card} side="right">
              <div
                className="group relative w-[72px] h-[105px] rounded overflow-hidden border border-white/5 hover:border-brand-gold/40 transition-all duration-150 cursor-pointer"
                onClick={() => onSelectCard?.(card)}
              >
                <Image
                  src={getCardImageUrl(card.id, "small")}
                  alt={card.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-all pointer-events-none" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(cardId); }}
                    className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  {onMoveToSide && zone !== "SIDE" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onMoveToSide(cardId); }}
                      className="h-5 px-2 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-500 transition-colors shadow text-[10px] font-bold tracking-wide"
                    >
                      SIDE
                    </button>
                  )}
                </div>
              </div>
            </CardTooltip>
          ))}
        </div>
      )}
    </div>
  );
}

export function DeckBuilderClient({ deck, initialCardData }: Props) {
  const router = useRouter();
  const [deckName, setDeckName] = useState(deck.name);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isSaving, setIsSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [selectedCard, setSelectedCard] = useState<YgoCard | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const initialCards = new Map(Object.entries(initialCardData).map(([k, v]) => [Number(k), v]));

  const { entries, mainEntries, extraEntries, sideEntries, cardCache, cardCounts, addCard, removeCard, loadEntries } =
    useDeck({ initialEntries: deck.cards });

  useEffect(() => {
    const newMap = new Map(initialCards);
    loadEntries(deck.cards, newMap);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchEnabled = searchQuery.length >= 2 || Object.values(filters).some(Boolean);
  const { data: searchData, isFetching } = useQuery({
    queryKey: ["card-search", searchQuery, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("name", searchQuery);
      if (filters.type) params.set("type", filters.type);
      if (filters.race) params.set("race", filters.race);
      if (filters.attribute) params.set("attribute", filters.attribute);
      if (filters.level) params.set("level", String(filters.level));
      if (filters.archetype) params.set("archetype", filters.archetype);
      if (filters.banlist) params.set("banlist", filters.banlist);
      if (filters.sort) params.set("sort", filters.sort);
      params.set("num", "60");
      const res = await fetch(`/api/cards/search?${params}`);
      const json = await res.json();
      return (json.data as YgoCard[]) ?? [];
    },
    enabled: searchEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const { data: archetypes } = useQuery({
    queryKey: ["archetypes"],
    queryFn: async () => {
      const res = await fetch("/api/cards/archetypes");
      const json = await res.json();
      return json.archetypes as string[];
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  const searchResults = searchData ?? [];

  useEffect(() => {
    if (searchResults.length > 0) {
      const newMap = new Map(cardCache);
      searchResults.forEach((c) => newMap.set(c.id, c));
    }
  }, [searchResults, cardCache]);

  const handleAddCard = useCallback((card: YgoCard) => addCard(card), [addCard]);
  const handleAddCardToSide = useCallback((card: YgoCard) => addCard(card, "SIDE"), [addCard]);
  const handleMoveToSide = useCallback((cardId: number, fromZone: "MAIN" | "EXTRA") => {
    const card = cardCache.get(cardId);
    if (!card) return;
    removeCard(cardId, fromZone);
    addCard(card, "SIDE");
  }, [cardCache, removeCard, addCard]);

  const stats = calculateDeckStats(entries, cardCache);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cards = entries.map((e, idx) => ({
        cardId: e.cardId,
        zone: e.zone,
        quantity: e.quantity,
        sortOrder: idx,
      }));
      const res = await fetch(`/api/decks/${deck.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deckName, cards }),
      });
      if (res.ok) {
        toast.success("Deck saved!");
      } else {
        const json = await res.json();
        toast.error(json.error ?? "Failed to save");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const text = exportDeckList(entries, cardCache, deckName);
    setImportText(text);
    setExportOpen(true);
  };

  const handleImport = async () => {
    const parsed = parseDeckList(importText);
    if (parsed.length === 0) {
      toast.error("No cards found in the import text");
      return;
    }
    toast.loading("Looking up cards…", { id: "import" });
    try {
      const fetchedCards: YgoCard[] = [];
      for (const { cardName, quantity, zone } of parsed) {
        try {
          const res = await fetch(`/api/cards/search?name=${encodeURIComponent(cardName)}&num=1`);
          const json = await res.json();
          if (json.data?.length > 0) {
            fetchedCards.push({ ...json.data[0], _importQuantity: quantity, _importZone: zone });
          }
        } catch { /* skip */ }
      }

      const newEntries = fetchedCards.map((c: YgoCard & { _importQuantity?: number; _importZone?: string }) => ({
        cardId: c.id,
        zone: (c._importZone as "MAIN" | "EXTRA" | "SIDE") ?? "MAIN",
        quantity: Math.min(c._importQuantity ?? 1, 3),
        card: c,
      }));

      const newCardMap = new Map<number, YgoCard>();
      fetchedCards.forEach((c) => newCardMap.set(c.id, c));
      loadEntries(newEntries, newCardMap);
      toast.success(`Imported ${newEntries.length} cards`, { id: "import" });
      setImportOpen(false);
      setImportText("");
    } catch {
      toast.error("Import failed", { id: "import" });
    }
  };

  const mainTotal = mainEntries.reduce((s, e) => s + e.quantity, 0);
  const extraTotal = extraEntries.reduce((s, e) => s + e.quantity, 0);
  const sideTotal = sideEntries.reduce((s, e) => s + e.quantity, 0);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-4rem-3rem)] min-h-0">
      {/* Top bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </Button>

        <div className="flex-1 min-w-40">
          <input
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            className="text-lg font-bold text-primary bg-transparent border-none outline-none focus:text-brand-gold transition-colors w-full"
            onBlur={handleSave}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {stats.isLegal ? (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" /> Legal
            </span>
          ) : (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5" />
              {stats.legalityErrors.length} issue{stats.legalityErrors.length !== 1 ? "s" : ""}
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/deck/${deck.id}/test`}>
              <TestTube className="w-4 h-4" />
              Test
            </Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/deck/${deck.id}/analyze`}>
              <BarChart3 className="w-4 h-4" />
              Analyze
            </Link>
          </Button>
          <Button size="sm" isLoading={isSaving} onClick={handleSave}>
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Far left — Card preview (xl screens only) */}
        <div className="hidden xl:flex xl:flex-col w-80 flex-shrink-0 border-r border-border pr-4 overflow-hidden">
          <CardPreview card={selectedCard} />
        </div>

        {/* Deck overview */}
        <div className="flex-1 min-w-0 flex flex-col gap-2 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
            <DeckSection
              title="Main Deck"
              zone="MAIN"
              entries={mainEntries}
              cards={cardCache}
              max={60}
              countClass={
                mainTotal > 60 ? "text-red-400"
                : mainTotal < 40 && mainTotal > 0 ? "text-yellow-400"
                : "text-orange-400"
              }
              onRemove={(id) => removeCard(id, "MAIN")}
              onMoveToSide={(id) => handleMoveToSide(id, "MAIN")}
              onSelectCard={setSelectedCard}
            />
            <div className="h-px bg-border" />
            <DeckSection
              title="Extra Deck"
              zone="EXTRA"
              entries={extraEntries}
              cards={cardCache}
              max={15}
              countClass={extraTotal > 15 ? "text-red-400" : "text-violet-400"}
              onRemove={(id) => removeCard(id, "EXTRA")}
              onMoveToSide={(id) => handleMoveToSide(id, "EXTRA")}
              onSelectCard={setSelectedCard}
            />
            <div className="h-px bg-border" />
            <DeckSection
              title="Side Deck"
              zone="SIDE"
              entries={sideEntries}
              cards={cardCache}
              max={15}
              countClass={sideTotal > 15 ? "text-red-400" : "text-blue-400"}
              onRemove={(id) => removeCard(id, "SIDE")}
              onSelectCard={setSelectedCard}
            />
          </div>

          {/* Mini stats */}
          <div className="border-t border-border pt-3 grid grid-cols-3 gap-2 text-center text-xs flex-shrink-0">
            <div>
              <div className="font-bold text-orange-400">{stats.monsterCount}</div>
              <div className="text-muted">Monsters</div>
            </div>
            <div>
              <div className="font-bold text-emerald-400">{stats.spellCount}</div>
              <div className="text-muted">Spells</div>
            </div>
            <div>
              <div className="font-bold text-pink-400">{stats.trapCount}</div>
              <div className="text-muted">Traps</div>
            </div>
          </div>
        </div>

        {/* Right — Search + results */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
          <Input
            ref={searchInputRef}
            placeholder="Search cards… (min 2 chars)"
            leftIcon={<Search className="w-4 h-4" />}
            rightIcon={
              searchQuery ? (
                <button onClick={() => setSearchQuery("")} className="hover:text-primary">
                  <X className="w-4 h-4" />
                </button>
              ) : undefined
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <CardFilters
            filters={filters}
            onChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
            archetypes={archetypes}
          />
          <div className="flex-1 overflow-y-auto min-h-0">
            {!searchEnabled ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Search className="w-10 h-10 text-muted mb-3" />
                <p className="text-secondary text-sm font-medium">Search for cards</p>
                <p className="text-muted text-xs mt-1">Type a name or apply filters</p>
              </div>
            ) : (
              <CardGrid
                cards={searchResults}
                onAddCard={handleAddCard}
                onAddCardToSide={handleAddCardToSide}
                onRemoveCard={(card) => removeCard(card.id)}
                onSelectCard={setSelectedCard}
                cardCounts={cardCounts}
                loading={isFetching}
                columns={3}
              />
            )}
          </div>
        </div>

      </div>

      {/* Import modal */}
      <Modal open={importOpen} onOpenChange={setImportOpen} title="Import deck list" size="lg">
        <div className="space-y-4">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={`#main\n3 Dark Magician\n2 Dark Magician Girl\n...\n#extra\n...\n#side\n...`}
            className="w-full h-64 rounded-lg border border-border bg-bg-base px-3 py-2 text-sm text-primary placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold font-mono"
          />
          <p className="text-xs text-muted">
            Supported formats: <code>#main</code> / <code>#extra</code> / <code>#side</code> section headers, one card per line with optional quantity prefix (e.g. <code>3 Dark Magician</code>) or suffix (<code>Dark Magician x3</code>).
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleImport} disabled={!importText.trim()}>
              Import
            </Button>
          </div>
        </div>
      </Modal>

      {/* Export modal */}
      <Modal open={exportOpen} onOpenChange={setExportOpen} title="Export deck list" size="lg">
        <div className="space-y-4">
          <textarea
            readOnly
            value={importText}
            className="w-full h-64 rounded-lg border border-border bg-bg-base px-3 py-2 text-sm text-primary resize-none focus:outline-none font-mono"
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                navigator.clipboard.writeText(importText);
                toast.success("Copied to clipboard!");
              }}
            >
              Copy to clipboard
            </Button>
            <Button className="flex-1" onClick={() => setExportOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

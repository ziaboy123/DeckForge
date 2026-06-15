"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Edit3,
  TestTube,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { useDeck } from "@/hooks/useDeck";
import { calculateDeckStats, cn } from "@/lib/utils";
import { calculateCardProbability, calculateComboProbability, formatPercent } from "@/lib/probability";
import type { DeckEntry, YgoCard } from "@/types/yugioh";

interface Props {
  deckId: string;
  deckName: string;
  entries: DeckEntry[];
  initialCardData: Record<number, YgoCard>;
}

const COLORS = {
  monster: "#fb923c",
  spell: "#34d399",
  trap: "#f472b6",
  normal: "#fde68a",
  effect: "#fb923c",
  ritual: "#93c5fd",
  fusion: "#a78bfa",
  synchro: "#e2e8f0",
  xyz: "#6b7280",
  link: "#60a5fa",
  pendulum: "#34d399",
};

const ATTRIBUTE_COLORS: Record<string, string> = {
  DARK: "#a78bfa",
  LIGHT: "#fde68a",
  WATER: "#60a5fa",
  FIRE: "#f87171",
  EARTH: "#a3a3a3",
  WIND: "#34d399",
  DIVINE: "#f0c040",
};

export function AnalyzeClient({ deckId, deckName, entries, initialCardData }: Props) {
  const { mainEntries, extraEntries, sideEntries, cardCache, loadEntries } = useDeck({ initialEntries: entries });

  useEffect(() => {
    const cardMap = new Map(
      Object.entries(initialCardData).map(([k, v]) => [Number(k), v])
    );
    loadEntries(entries, cardMap);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(
    () => calculateDeckStats(entries, cardCache),
    [entries, cardCache]
  );

  const typeData = [
    { name: "Monsters", value: stats.monsterCount, color: COLORS.monster },
    { name: "Spells", value: stats.spellCount, color: COLORS.spell },
    { name: "Traps", value: stats.trapCount, color: COLORS.trap },
  ].filter((d) => d.value > 0);

  const monsterTypeData = [
    { name: "Normal", value: stats.normalMonsterCount, color: COLORS.normal },
    { name: "Effect", value: stats.effectMonsterCount - stats.pendulumCount - stats.ritualCount, color: COLORS.effect },
    { name: "Ritual", value: stats.ritualCount, color: COLORS.ritual },
    { name: "Pendulum", value: stats.pendulumCount, color: COLORS.pendulum },
    { name: "Fusion", value: stats.fusionCount, color: COLORS.fusion },
    { name: "Synchro", value: stats.synchroCount, color: COLORS.synchro },
    { name: "XYZ", value: stats.xyzCount, color: COLORS.xyz },
    { name: "Link", value: stats.linkCount, color: COLORS.link },
  ].filter((d) => d.value > 0);

  const attributeData = Object.entries(stats.attributeBreakdown).map(([name, value]) => ({
    name,
    value,
    color: ATTRIBUTE_COLORS[name] ?? "#6b7280",
  }));

  const levelData = Object.entries(stats.levelBreakdown)
    .sort(([a], [b]) => {
      const aNum = parseInt(a.replace(/[^\d]/g, "")) || 0;
      const bNum = parseInt(b.replace(/[^\d]/g, "")) || 0;
      return aNum - bNum;
    })
    .map(([name, value]) => ({ name, value }));

  const archetypeData = Object.entries(stats.archetypeBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const hasCards = stats.mainDeckCount > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard"><ChevronLeft className="w-4 h-4" />Dashboard</Link>
        </Button>
        <h1 className="text-lg font-bold text-primary flex-1">{deckName} — Analysis</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/deck/${deckId}/build`}><Edit3 className="w-4 h-4" /> Edit</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/deck/${deckId}/test`}><TestTube className="w-4 h-4" /> Test</Link>
          </Button>
        </div>
      </div>

      {/* Legality */}
      <div className={cn(
        "flex items-start gap-3 p-4 rounded-xl border",
        stats.isLegal
          ? "border-emerald-500/30 bg-emerald-900/10"
          : "border-red-500/30 bg-red-900/10"
      )}>
        {stats.isLegal ? (
          <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
        )}
        <div>
          <p className={cn("font-semibold text-sm", stats.isLegal ? "text-emerald-400" : "text-red-400")}>
            {stats.isLegal ? "Deck is legal (Advanced Format)" : "Deck has legality issues"}
          </p>
          {!stats.isLegal && (
            <ul className="mt-1 space-y-0.5">
              {stats.legalityErrors.map((e, i) => (
                <li key={i} className="text-xs text-red-300">{e}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {!hasCards && (
        <div className="flex items-center gap-3 p-4 border border-yellow-500/30 bg-yellow-900/10 rounded-xl">
          <Info className="w-5 h-5 text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-400">Add cards to your deck to see analytics.</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Main Deck", value: stats.mainDeckCount, max: 60, color: "text-brand-gold" },
          { label: "Extra Deck", value: stats.extraDeckCount, max: 15, color: "text-blue-400" },
          { label: "Side Deck", value: stats.sideDeckCount, max: 15, color: "text-violet-400" },
          { label: "Monsters", value: stats.monsterCount, color: "text-orange-400" },
          { label: "Spells", value: stats.spellCount, color: "text-emerald-400" },
          { label: "Traps", value: stats.trapCount, color: "text-pink-400" },
        ].map((s) => (
          <div key={s.label} className="bg-bg-card border border-border rounded-xl p-4 text-center">
            <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
            <div className="text-xs text-muted mt-0.5">{s.label}</div>
            {s.max && <div className="text-xs text-muted">/ {s.max}</div>}
          </div>
        ))}
      </div>

      {hasCards && (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Type breakdown */}
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-primary mb-4">Card Types</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {typeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#151c2e", border: "1px solid #2a3554", borderRadius: "8px", color: "#e8eaf0" }}
                    formatter={(value: number) => [`${value} cards`, ""]}
                  />
                  <Legend
                    formatter={(v) => <span className="text-xs text-secondary">{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Attribute breakdown */}
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-primary mb-4">Attributes</h3>
              {attributeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={attributeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {attributeData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#151c2e", border: "1px solid #2a3554", borderRadius: "8px", color: "#e8eaf0" }}
                      formatter={(value: number) => [`${value} cards`, ""]}
                    />
                    <Legend formatter={(v) => <span className="text-xs text-secondary">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted text-sm">No monsters</div>
              )}
            </div>

            {/* Monster subtypes */}
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-primary mb-4">Monster Breakdown</h3>
              {monsterTypeData.length > 0 ? (
                <div className="space-y-2">
                  {monsterTypeData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-secondary flex-1">{d.name}</span>
                      <span className="text-xs font-medium text-primary">{d.value}</span>
                      <div className="w-16 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(d.value / stats.monsterCount) * 100}%`, background: d.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted text-sm">No monsters</div>
              )}
            </div>
          </div>

          {/* Level distribution */}
          {levelData.length > 0 && (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-primary mb-4">Level / Rank / Link Distribution</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={levelData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="name" tick={{ fill: "#8892a4", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#8892a4", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "#151c2e", border: "1px solid #2a3554", borderRadius: "8px", color: "#e8eaf0" }}
                  />
                  <Bar dataKey="value" fill="#f0c040" radius={[4, 4, 0, 0]} name="Cards" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Archetype breakdown */}
          {archetypeData.length > 0 && (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-primary mb-4">Top Archetypes</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={archetypeData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 80 }}>
                  <XAxis type="number" tick={{ fill: "#8892a4", fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#8892a4", fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{ background: "#151c2e", border: "1px solid #2a3554", borderRadius: "8px", color: "#e8eaf0" }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Cards" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Probability calculator */}
          <ProbabilityCalculator deckSize={stats.mainDeckCount} />
        </>
      )}
    </div>
  );
}

// ─── Probability Calculator ───────────────────────────────────────────────

function ProbabilityCalculator({ deckSize }: { deckSize: number }) {
  const [copies, setCopies] = useState(3);
  const [handSize, setHandSize] = useState<5 | 6>(5);
  const [pieces, setPieces] = useState([{ copies: 3, needed: 1 }]);

  const singleResult = useMemo(
    () => calculateCardProbability(deckSize, copies, handSize),
    [deckSize, copies, handSize]
  );

  const comboProb = useMemo(
    () => calculateComboProbability(deckSize, handSize, pieces),
    [deckSize, handSize, pieces]
  );

  if (deckSize < 5) return null;

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5 space-y-6">
      <h3 className="text-sm font-semibold text-primary">Probability Calculator</h3>
      <p className="text-xs text-muted -mt-4">
        Uses exact hypergeometric distribution. Deck size: <strong className="text-secondary">{deckSize}</strong>
      </p>

      {/* Single card probability */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-secondary uppercase tracking-wide">Single Card</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-secondary">Copies in deck</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setCopies(n)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                    copies === n
                      ? "bg-brand-gold text-bg-base border-brand-gold"
                      : "border-border text-secondary hover:border-border-strong"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-secondary">Opening hand size</label>
            <div className="flex gap-2">
              {([5, 6] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setHandSize(n)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                    handSize === n
                      ? "bg-brand-gold text-bg-base border-brand-gold"
                      : "border-border text-secondary hover:border-border-strong"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ProbStat
            label={`0 copies`}
            value={singleResult.exactly[0] ?? 0}
            color="text-secondary"
          />
          {singleResult.exactly.slice(1).map((p, i) => (
            <ProbStat key={i + 1} label={`Exactly ${i + 1}`} value={p} />
          ))}
          <ProbStat label="≥ 1 copy" value={singleResult.atLeastOne} color="text-brand-gold" highlight />
          {copies >= 2 && (
            <ProbStat label="≥ 2 copies" value={singleResult.atLeastTwo} />
          )}
          <ProbStat
            label="Expected copies"
            value={null}
            display={singleResult.expected.toFixed(2)}
            color="text-blue-400"
          />
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Combo probability */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-secondary uppercase tracking-wide">Multi-Piece Combo</h4>
        <div className="space-y-2">
          {pieces.map((piece, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted w-16 shrink-0">Piece {i + 1}</span>
              <div className="flex items-center gap-1">
                <label className="text-xs text-muted">Copies:</label>
                <select
                  value={piece.copies}
                  onChange={(e) => {
                    const newPieces = [...pieces];
                    newPieces[i] = { ...piece, copies: Number(e.target.value) };
                    setPieces(newPieces);
                  }}
                  className="bg-bg-elevated border border-border rounded px-2 py-1 text-xs text-primary"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-muted">Need:</label>
                <select
                  value={piece.needed}
                  onChange={(e) => {
                    const newPieces = [...pieces];
                    newPieces[i] = { ...piece, needed: Number(e.target.value) };
                    setPieces(newPieces);
                  }}
                  className="bg-bg-elevated border border-border rounded px-2 py-1 text-xs text-primary"
                >
                  {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              {pieces.length > 1 && (
                <button
                  onClick={() => setPieces(pieces.filter((_, j) => j !== i))}
                  className="text-muted hover:text-red-400 transition-colors text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {pieces.length < 4 && (
            <button
              onClick={() => setPieces([...pieces, { copies: 3, needed: 1 }])}
              className="text-xs text-brand-gold hover:underline"
            >
              + Add piece
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-bg-elevated rounded-xl px-6 py-3 text-center border border-border">
            <div className="text-2xl font-bold text-brand-gold">{formatPercent(comboProb)}</div>
            <div className="text-xs text-muted mt-1">
              Opening a {handSize}-card hand with all pieces
            </div>
          </div>
          <p className="text-xs text-muted max-w-xs">
            Approximation using conditional probability. For exact multi-piece calculations, check the individual piece probabilities and combine.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProbStat({
  label,
  value,
  display,
  color = "text-primary",
  highlight,
}: {
  label: string;
  value: number | null;
  display?: string;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 text-center border",
        highlight ? "border-brand-gold/30 bg-brand-gold/5" : "border-border bg-bg-elevated"
      )}
    >
      <div className={cn("text-xl font-bold", color)}>
        {display ?? (value !== null ? formatPercent(value) : "—")}
      </div>
      <div className="text-xs text-muted mt-0.5">{label}</div>
    </div>
  );
}

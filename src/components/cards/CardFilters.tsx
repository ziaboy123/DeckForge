"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { SearchFilters, Attribute } from "@/types/yugioh";

const CARD_TYPES = [
  { value: "", label: "All Types" },
  { value: "Monster", label: "Monster" },
  { value: "Spell Card", label: "Spell" },
  { value: "Trap Card", label: "Trap" },
];

const MONSTER_TYPES = [
  { value: "", label: "All Races" },
  { value: "Aqua", label: "Aqua" },
  { value: "Beast", label: "Beast" },
  { value: "Beast-Warrior", label: "Beast-Warrior" },
  { value: "Cyberse", label: "Cyberse" },
  { value: "Dinosaur", label: "Dinosaur" },
  { value: "Dragon", label: "Dragon" },
  { value: "Fairy", label: "Fairy" },
  { value: "Fiend", label: "Fiend" },
  { value: "Fish", label: "Fish" },
  { value: "Insect", label: "Insect" },
  { value: "Machine", label: "Machine" },
  { value: "Plant", label: "Plant" },
  { value: "Psychic", label: "Psychic" },
  { value: "Reptile", label: "Reptile" },
  { value: "Rock", label: "Rock" },
  { value: "Sea Serpent", label: "Sea Serpent" },
  { value: "Spellcaster", label: "Spellcaster" },
  { value: "Thunder", label: "Thunder" },
  { value: "Warrior", label: "Warrior" },
  { value: "Winged Beast", label: "Winged Beast" },
  { value: "Wyrm", label: "Wyrm" },
  { value: "Zombie", label: "Zombie" },
];

const ATTRIBUTES: { value: string; label: string }[] = [
  { value: "", label: "All Attributes" },
  { value: "DARK", label: "DARK" },
  { value: "LIGHT", label: "LIGHT" },
  { value: "WATER", label: "WATER" },
  { value: "FIRE", label: "FIRE" },
  { value: "EARTH", label: "EARTH" },
  { value: "WIND", label: "WIND" },
  { value: "DIVINE", label: "DIVINE" },
];

const LEVELS = [
  { value: "", label: "Any Level" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Level ${i + 1}`,
  })),
];

const BANLIST = [
  { value: "", label: "Any Status" },
  { value: "Banned", label: "Banned" },
  { value: "Limited", label: "Limited (1)" },
  { value: "Semi-Limited", label: "Semi-Limited (2)" },
  { value: "Unlimited", label: "Unlimited (3)" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Name (A–Z)" },
  { value: "atk", label: "ATK (high)" },
  { value: "def", label: "DEF (high)" },
  { value: "level", label: "Level (high)" },
];

interface CardFiltersProps {
  filters: SearchFilters;
  onChange: (filters: Partial<SearchFilters>) => void;
  archetypes?: string[];
}

export function CardFilters({ filters, onChange, archetypes = [] }: CardFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const archetypeOptions = [
    { value: "", label: "All Archetypes" },
    ...archetypes.map((a) => ({ value: a, label: a })),
  ];

  const hasActiveFilters =
    filters.type || filters.race || filters.attribute || filters.level || filters.archetype || filters.banlist;

  return (
    <div className="border border-border rounded-lg bg-bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-secondary hover:text-primary hover:bg-bg-elevated transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-brand-gold" />
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-0 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Card Type"
              options={CARD_TYPES}
              value={filters.type ?? ""}
              onValueChange={(v) => onChange({ type: v || undefined })}
            />
            <Select
              label="Attribute"
              options={ATTRIBUTES}
              value={filters.attribute ?? ""}
              onValueChange={(v) => onChange({ attribute: (v as Attribute) || undefined })}
            />
            <Select
              label="Monster Type"
              options={MONSTER_TYPES}
              value={filters.race ?? ""}
              onValueChange={(v) => onChange({ race: v || undefined })}
            />
            <Select
              label="Level / Rank"
              options={LEVELS}
              value={filters.level ? String(filters.level) : ""}
              onValueChange={(v) => onChange({ level: v ? Number(v) : undefined })}
            />
            <Select
              label="Archetype"
              options={archetypeOptions}
              value={filters.archetype ?? ""}
              onValueChange={(v) => onChange({ archetype: v || undefined })}
            />
            <Select
              label="Banlist Status"
              options={BANLIST}
              value={filters.banlist ?? ""}
              onValueChange={(v) =>
                onChange({ banlist: (v as SearchFilters["banlist"]) || undefined })
              }
            />
            <Select
              label="Sort By"
              options={SORT_OPTIONS}
              value={filters.sort ?? "name"}
              onValueChange={(v) =>
                onChange({ sort: v as SearchFilters["sort"] })
              }
            />
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onChange({
                      type: undefined,
                      race: undefined,
                      attribute: undefined,
                      level: undefined,
                      archetype: undefined,
                      banlist: undefined,
                    })
                  }
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

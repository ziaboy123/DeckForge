export type CardType =
  | "Normal Monster"
  | "Effect Monster"
  | "Ritual Monster"
  | "Fusion Monster"
  | "Synchro Monster"
  | "XYZ Monster"
  | "Pendulum Effect Monster"
  | "Pendulum Normal Monster"
  | "Pendulum Fusion Monster"
  | "Synchro Pendulum Effect Monster"
  | "XYZ Pendulum Effect Monster"
  | "Link Monster"
  | "Ritual Effect Monster"
  | "Spell Card"
  | "Trap Card"
  | "Skill Card"
  | "Token";

export type FrameType =
  | "normal"
  | "effect"
  | "ritual"
  | "fusion"
  | "synchro"
  | "xyz"
  | "link"
  | "normal_pendulum"
  | "effect_pendulum"
  | "ritual_pendulum"
  | "fusion_pendulum"
  | "synchro_pendulum"
  | "xyz_pendulum"
  | "spell"
  | "trap"
  | "token"
  | "skill";

export type Attribute =
  | "DARK"
  | "LIGHT"
  | "WATER"
  | "FIRE"
  | "EARTH"
  | "WIND"
  | "DIVINE";

export type BanStatus = "Banned" | "Limited" | "Semi-Limited" | "Unlimited";

// Just the passcode of each artwork: the picture's address comes from getCardImageUrl() in lib/cardImages.ts
// (Millennium Arena's copies on this site, not YGOPRODeck's image server).
export interface CardImage {
  id: number;
}

export interface BanlistInfo {
  ban_tcg?: BanStatus;
  ban_ocg?: BanStatus;
}

// A card as DeckForge keeps it: YGOPRODeck's card data cut down to what the app uses (see slimCard in lib/cardIndex.ts).
export interface YgoCard {
  id: number;
  name: string;
  type: CardType;
  frameType: FrameType;
  desc: string;
  race: string;
  attribute?: Attribute;
  level?: number;
  atk?: number;
  def?: number;
  linkval?: number;
  linkmarkers?: string[];
  scale?: number;
  archetype?: string;
  banlist_info?: BanlistInfo;
  card_images: CardImage[];
}

export interface SearchFilters {
  name?: string;
  type?: string;
  race?: string;
  attribute?: Attribute;
  level?: number;
  atk?: number | string;
  def?: number | string;
  archetype?: string;
  banlist?: BanStatus;
  frameType?: FrameType;
  sort?: "name" | "atk" | "def" | "level" | "id";
  num?: number;
  offset?: number;
}

export type DeckZone = "MAIN" | "EXTRA" | "SIDE";

export interface DeckEntry {
  cardId: number;
  zone: DeckZone;
  quantity: number;
  card?: YgoCard;
}

export interface DeckData {
  id: string;
  name: string;
  description?: string | null;
  format: "ADVANCED" | "TRADITIONAL" | "SPEED_DUEL" | "RUSH_DUEL";
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  cards: DeckEntry[];
}

export interface DeckStats {
  totalCards: number;
  mainDeckCount: number;
  extraDeckCount: number;
  sideDeckCount: number;
  monsterCount: number;
  spellCount: number;
  trapCount: number;
  normalMonsterCount: number;
  effectMonsterCount: number;
  fusionCount: number;
  synchroCount: number;
  xyzCount: number;
  linkCount: number;
  ritualCount: number;
  pendulumCount: number;
  archetypeBreakdown: Record<string, number>;
  attributeBreakdown: Record<string, number>;
  levelBreakdown: Record<string, number>;
  isLegal: boolean;
  legalityErrors: string[];
}

export interface HandCard {
  instanceId: string;
  card: YgoCard;
}

export type GoldfishZone = "deck" | "hand" | "field" | "graveyard" | "banished" | "extra";

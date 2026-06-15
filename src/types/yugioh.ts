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

export interface CardImage {
  id: number;
  image_url: string;
  image_url_small: string;
  image_url_cropped?: string;
}

export interface CardSet {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_rarity_code: string;
  set_price?: string;
}

export interface CardPrice {
  cardmarket_price: string;
  tcgplayer_price: string;
  ebay_price: string;
  amazon_price: string;
  coolstuffinc_price: string;
}

export interface BanlistInfo {
  ban_tcg?: BanStatus;
  ban_ocg?: BanStatus;
}

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
  ygoprodeck_utility?: string;
  banlist_info?: BanlistInfo;
  card_sets?: CardSet[];
  card_images: CardImage[];
  card_prices?: CardPrice[];
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

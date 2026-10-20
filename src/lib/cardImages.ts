// Card pictures. YGOPRODeck asks sites not to hotlink its image server, so DeckForge shows the copies Millennium Arena
// keeps on the same site (/millenniumarena/img/cards, /small and /cropped, named by passcode like YGOPRODeck's).
// They live outside DeckForge's /deckforge basePath, so next/image can't optimise them: every <Image> of a card is
// `unoptimized` (next.config.ts also turns optimisation off). For local development, set NEXT_PUBLIC_CARD_IMAGES to
// https://daniyalzia.co.uk/millenniumarena/img to use the live site's copies.
const BASE = (process.env.NEXT_PUBLIC_CARD_IMAGES || "/millenniumarena/img").replace(/\/+$/, "");

const FOLDERS = { normal: "cards", small: "small", cropped: "cropped" } as const;

export type CardImageSize = keyof typeof FOLDERS;

export function getCardImageUrl(cardId: number, size: CardImageSize = "normal"): string {
  return `${BASE}/${FOLDERS[size]}/${cardId}.jpg`;
}

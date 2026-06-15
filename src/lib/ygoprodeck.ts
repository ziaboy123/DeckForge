import type { YgoCard, SearchFilters } from "@/types/yugioh";

const BASE_URL = "https://db.ygoprodeck.com/api/v7";

async function apiFetch<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {}
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YGOPRODeck API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function searchCards(
  filters: SearchFilters
): Promise<{ data: YgoCard[] }> {
  const params: Record<string, string | number | undefined> = {
    fname: filters.name || undefined,
    type: filters.type || undefined,
    race: filters.race || undefined,
    attribute: filters.attribute || undefined,
    level: filters.level || undefined,
    archetype: filters.archetype || undefined,
    banlist: filters.banlist || undefined,
    sort: filters.sort || "name",
    num: filters.num || 60,
    offset: filters.offset || 0,
  };

  if (filters.atk !== undefined && filters.atk !== "") {
    params["atk"] = filters.atk;
  }
  if (filters.def !== undefined && filters.def !== "") {
    params["def"] = filters.def;
  }

  return apiFetch<{ data: YgoCard[] }>("/cardinfo.php", params);
}

export async function getCardById(id: number): Promise<YgoCard | null> {
  try {
    const result = await apiFetch<{ data: YgoCard[] }>("/cardinfo.php", { id });
    return result.data[0] ?? null;
  } catch {
    return null;
  }
}

export async function getCardsByIds(ids: number[]): Promise<YgoCard[]> {
  if (ids.length === 0) return [];
  try {
    const result = await apiFetch<{ data: YgoCard[] }>("/cardinfo.php", {
      id: ids.join(","),
    });
    return result.data;
  } catch {
    return [];
  }
}

export async function getArchetypes(): Promise<string[]> {
  try {
    const result = await apiFetch<{ archetype_name: string }[]>(
      "/archetypes.php"
    );
    return result.map((a) => a.archetype_name).sort();
  } catch {
    return [];
  }
}

export async function getRandomCard(): Promise<YgoCard | null> {
  try {
    const result = await apiFetch<{ data: YgoCard[] }>("/randomcard.php");
    return result.data[0] ?? null;
  } catch {
    return null;
  }
}

export function getCardImageUrl(cardId: number, size: "normal" | "small" | "cropped" = "normal"): string {
  switch (size) {
    case "small":
      return `https://images.ygoprodeck.com/images/cards_small/${cardId}.jpg`;
    case "cropped":
      return `https://images.ygoprodeck.com/images/cards_cropped/${cardId}.jpg`;
    default:
      return `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`;
  }
}

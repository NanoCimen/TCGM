const POKEMON_TCG_API_BASE = "https://api.pokemontcg.io/v2";

export interface TCGCard {
  name: string;
  setName: string;
  number: string;
  marketPrice: number | null;
  imageUrl: string | null;
}

interface PokemonTCGPrice {
  market?: number;
}

interface PokemonTCGCard {
  name: string;
  number: string;
  set: { name: string };
  images?: { large?: string; small?: string };
  tcgplayer?: {
    prices?: {
      holofoil?: PokemonTCGPrice;
      normal?: PokemonTCGPrice;
      reverseHolofoil?: PokemonTCGPrice;
    };
  };
}

interface PokemonTCGResponse {
  data: PokemonTCGCard[];
}

function extractMarketPrice(card: PokemonTCGCard): number | null {
  const prices = card.tcgplayer?.prices;
  return (
    prices?.holofoil?.market ??
    prices?.normal?.market ??
    prices?.reverseHolofoil?.market ??
    null
  );
}

function toTCGCard(card: PokemonTCGCard): TCGCard {
  return {
    name: card.name,
    setName: card.set.name,
    number: card.number,
    marketPrice: extractMarketPrice(card),
    imageUrl: card.images?.large ?? card.images?.small ?? null,
  };
}

function buildHeaders(): HeadersInit | undefined {
  const apiKey = process.env.POKEMON_TCG_API_KEY;
  if (!apiKey) return undefined;
  return { "X-Api-Key": apiKey };
}

async function runQuery(
  query: string,
  pageSize: number
): Promise<TCGCard[]> {
  try {
    const res = await fetch(
      `${POKEMON_TCG_API_BASE}/cards?q=${encodeURIComponent(query)}&pageSize=${pageSize}&orderBy=-set.releaseDate`,
      { next: { revalidate: 3600 }, headers: buildHeaders() }
    );

    if (!res.ok) return [];

    const json = (await res.json()) as PokemonTCGResponse;
    return (json.data ?? []).map(toTCGCard);
  } catch {
    return [];
  }
}

/** "Ethan's Magcargo" -> "Magcargo" (drops possessive tokens like "Ethan's") */
function stripPossessive(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => !/^[\w.]+['’]s$/i.test(word))
    .join(" ")
    .trim();
}

export async function searchCard(
  cardName: string,
  setName?: string
): Promise<TCGCard | null> {
  const baseName = stripPossessive(cardName);

  const attempts: { label: string; query: string }[] = [
    {
      label: "exact quoted name",
      query:
        `name:"${cardName}"` + (setName ? `+set.name:"${setName}"` : ""),
    },
  ];

  if (baseName && baseName !== cardName) {
    attempts.push({
      label: "possessive stripped",
      query: `name:"${baseName}"`,
    });
  }

  attempts.push({
    label: "unquoted fuzzy",
    query: `name:${baseName || cardName}`,
  });

  let firstWithoutPrice: TCGCard | null = null;

  for (let index = 0; index < attempts.length; index++) {
    const attempt = attempts[index];
    const results = await runQuery(attempt.query, 5);
    if (!results.length) continue;

    const withPrice = results.find((card) => card.marketPrice != null);
    if (withPrice) {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[pokemon-tcg] attempt ${index + 1} (${attempt.label}) succeeded for "${cardName}" → ${withPrice.name} (${withPrice.setName}) $${withPrice.marketPrice}`
        );
      }
      return withPrice;
    }

    firstWithoutPrice ??= results[0];
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[pokemon-tcg] no priced result for "${cardName}"${firstWithoutPrice ? ` — returning unpriced match ${firstWithoutPrice.name}` : " — no results at all"}`
    );
  }

  return firstWithoutPrice;
}

/**
 * Multi-result search for manual lookup. Tries an exact name match first,
 * then falls back to a wildcard on the first word.
 */
export async function searchCards(
  rawQuery: string,
  pageSize = 6
): Promise<TCGCard[]> {
  const cleaned = rawQuery.trim();
  if (!cleaned) return [];

  const exact = await runQuery(`name:"${cleaned}"`, pageSize);
  if (exact.length) return exact;

  const firstWord = cleaned.split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, "");
  if (!firstWord) return [];

  return runQuery(`name:${firstWord}*`, pageSize);
}

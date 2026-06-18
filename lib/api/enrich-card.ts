const POKEMON_TCG_API_BASE = "https://api.pokemontcg.io/v2";

const RARITY_TO_VARIANT: Record<string, string> = {
  Common: "Regular",
  Uncommon: "Regular",
  Rare: "Regular",
  "Rare Holo": "Holo",
  "Rare Holo EX": "Holo",
  "Rare Holo GX": "Holo",
  "Rare Holo V": "Holo",
  "Rare Holo VMAX": "Holo",
  "Rare Holo VSTAR": "Holo",
  "Double Rare": "Holo",
  "Rare Break": "Holo",
  "Rare Shiny": "Holo",
  "Rare Shiny GX": "Holo",
  "Amazing Rare": "Holo",
  "Shiny Rare": "Holo",
  "Trainer Gallery Rare Holo": "Holo",
  "Rare Prism Star": "Holo",
  "Rare Ultra": "Full Art",
  "Rare ACE": "Full Art",
  "ACE SPEC Rare": "Full Art",
  "Rare Rainbow": "Hyper Rare / Rainbow",
  "Hyper Rare": "Hyper Rare / Rainbow",
  "Shiny Ultra Rare": "Special Illustration Rare",
  "Rare Secret": "Gold Rare",
  "Illustration Rare": "Illustration Rare",
  "Special Illustration Rare": "Special Illustration Rare",
  Classic: "Regular",
  LEGEND: "Regular",
};

type ApiCard = {
  name: string;
  number: string;
  rarity?: string;
  set: { name: string; total: number; printedTotal?: number };
  images?: { large?: string; small?: string };
};

type ApiResponse = {
  data?: ApiCard[];
};

export type EnrichedCard = {
  cardName: string;
  setName: string;
  cardNumber: string;
  variant: string;
  officialImageUrl: string;
  confirmed: boolean;
};

function mapVariant(rarity: string | undefined): string {
  if (!rarity) return "Regular";
  return RARITY_TO_VARIANT[rarity] ?? "Regular";
}

/**
 * Parse "106/130" into { number: "106", total: "130" }.
 * Returns total=null when no slash is present.
 */
function extractParts(cardNumber: string): { number: string; total: string | null } {
  const [number, total] = cardNumber.split("/").map((s) => s.trim());
  return { number, total: total || null };
}

export async function enrichCard(
  cardName: string,
  cardNumber: string
): Promise<EnrichedCard | null> {
  const name = cardName.trim();
  const { number, total } = extractParts(cardNumber.trim());

  if (!name || !number) return null;

  const apiKey = process.env.POKEMON_TCG_API_KEY;
  const headers: HeadersInit = apiKey ? { "X-Api-Key": apiKey } : {};

  // Build query attempts from most to least specific.
  // set.printedTotal matches the number physically on the card (e.g. "/130").
  // set.total is a fallback for sets where printedTotal isn't indexed separately.
  const baseQuery = `number:${number} name:"${name}"`;
  const queries: string[] = [];

  if (total) {
    queries.push(`${baseQuery} set.printedTotal:${total}`);
    queries.push(`${baseQuery} set.total:${total}`);
  }
  queries.push(baseQuery);

  for (const query of queries) {
    try {
      const url = `${POKEMON_TCG_API_BASE}/cards?q=${encodeURIComponent(query)}&pageSize=5&orderBy=-set.releaseDate`;
      const res = await fetch(url, { headers, next: { revalidate: 3600 } });

      if (!res.ok) continue;

      const json = (await res.json()) as ApiResponse;
      const cards = json.data ?? [];

      if (!cards.length) continue;

      const exact = cards.find((c) => c.number === number) ?? cards[0];
      const variant = mapVariant(exact.rarity);
      const officialImageUrl = exact.images?.large ?? exact.images?.small ?? "";

      // Use printedTotal when available — it matches what's physically on the card.
      // This preserves Claude's original total (e.g. "130") rather than replacing
      // it with a potentially larger set.total that includes secret-rare slots.
      const printed = exact.set.printedTotal ?? exact.set.total;

      return {
        cardName: exact.name,
        setName: exact.set.name,
        cardNumber: `${exact.number}/${printed}`,
        variant,
        officialImageUrl,
        confirmed: true,
      };
    } catch {
      return null;
    }
  }

  return null;
}

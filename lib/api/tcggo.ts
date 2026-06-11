const TCGGO_BASE = "https://pokemon-tcg-api.p.rapidapi.com";
const TCGGO_HOST = "pokemon-tcg-api.p.rapidapi.com";

export type TcggoCardResult = {
  name: string;
  setName: string;
  marketPrice: number | null;
  imageUrl: string | null;
  number?: string;
};

type GradedEntry = {
  median_price?: number | string | null;
  sample_size?: number;
};

type TcggoApiCard = {
  name?: string;
  number?: string;
  url?: string;
  image?: string;
  image_url?: string;
  images?: { large?: string; small?: string };
  set?: { name?: string };
  set_name?: string;
  prices?: {
    tcg_player?: {
      market_price?: number | string | null;
      mid_price?: number | string | null;
    };
    cardmarket?: {
      lowest_near_mint?: number | string | null;
      "7d_average"?: number | string | null;
      "30d_average"?: number | string | null;
    };
    ebay?: {
      graded?: {
        psa?: Record<string, GradedEntry>;
        cgc?: Record<string, GradedEntry>;
        bgs?: Record<string, GradedEntry>;
      };
    };
  };
};

export type TCGPriceResult = {
  // Ungraded
  tcgPlayerPrice: number | null;
  cardmarketLowest: number | null;
  cardmarket7d: number | null;
  displayPrice: number | null;
  displayCurrency: "USD" | "EUR";
  priceSource: string;
  // Graded — eBay median prices (USD)
  psa10: number | null;
  psa9: number | null;
  psa8: number | null;
  psa7: number | null;
  psa10s: number | null;
  psa9s: number | null;
  psa8s: number | null;
  psa7s: number | null;
  cgc10: number | null;
  cgc9: number | null;
  cgc10s: number | null;
  cgc9s: number | null;
  bgs10: number | null;
  bgs10s: number | null;
  // Meta
  officialImage: string | null;
  tcggoUrl: string | null;
};

type TcggoApiResponse = {
  data?: TcggoApiCard[];
  cards?: TcggoApiCard[];
  results?: TcggoApiCard[];
};

const VARIANT_SUFFIX: Record<string, string> = {
  "Reverse Holo": "reverse holo",
  Holo: "holo",
  "Full Art": "full art",
  "Illustration Rare": "illustration rare",
  "Special Illustration Rare": "special illustration rare",
  "Hyper Rare / Rainbow": "rainbow rare",
  "Gold Rare": "gold rare",
};

function stripTotal(cardNumber: string): string {
  return cardNumber.split("/")[0].trim();
}

function buildHeaders(): HeadersInit | null {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.warn("[tcggo] WARNING: RAPIDAPI_KEY not set — price lookups will be skipped");
    return null;
  }
  return {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": TCGGO_HOST,
  };
}

function parseMarketPrice(value: unknown): number | null {
  if (value == null) return null;
  const num = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(num) ? num : null;
}

function extractGrade(
  graded: Record<string, GradedEntry> | undefined,
  key: string
): { price: number | null; samples: number | null } {
  const entry = graded?.[key];
  if (!entry || (entry.sample_size ?? 0) < 1) return { price: null, samples: null };
  return {
    price: parseMarketPrice(entry.median_price),
    samples: entry.sample_size ?? null,
  };
}

function mapCard(raw: TcggoApiCard): TcggoCardResult | null {
  if (!raw.name) return null;
  return {
    name: raw.name,
    setName: raw.set?.name ?? raw.set_name ?? "",
    number: raw.number,
    marketPrice: parseMarketPrice(raw.prices?.tcg_player?.market_price),
    imageUrl: raw.image ?? raw.image_url ?? raw.images?.large ?? raw.images?.small ?? null,
  };
}

function mapFullCard(raw: TcggoApiCard): TCGPriceResult | null {
  if (!raw.name) return null;

  const tcgPlayerPrice = parseMarketPrice(raw.prices?.tcg_player?.market_price);
  const cardmarketLowest = parseMarketPrice(raw.prices?.cardmarket?.lowest_near_mint);
  const cardmarket7d = parseMarketPrice(raw.prices?.cardmarket?.["7d_average"]);

  let displayPrice: number | null = null;
  let displayCurrency: "USD" | "EUR" = "USD";
  let priceSource = "";

  if (tcgPlayerPrice != null) {
    displayPrice = tcgPlayerPrice;
    displayCurrency = "USD";
    priceSource = "TCGPlayer market price";
  } else if (cardmarketLowest != null) {
    const approxUsd = Math.round(cardmarketLowest * 1.08 * 100) / 100;
    displayPrice = approxUsd;
    displayCurrency = "USD";
    priceSource = `Cardmarket (€${cardmarketLowest.toFixed(2)} EUR → ~$${approxUsd.toFixed(2)} USD)`;
  }

  const graded = raw.prices?.ebay?.graded;
  const psa10d = extractGrade(graded?.psa, "10");
  const psa9d = extractGrade(graded?.psa, "9");
  const psa8d = extractGrade(graded?.psa, "8");
  const psa7d = extractGrade(graded?.psa, "7");
  const cgc10d = extractGrade(graded?.cgc, "10");
  const cgc9d = extractGrade(graded?.cgc, "9");
  const bgs10d = extractGrade(graded?.bgs, "10");

  return {
    tcgPlayerPrice,
    cardmarketLowest,
    cardmarket7d,
    displayPrice,
    displayCurrency,
    priceSource,
    psa10: psa10d.price,
    psa9: psa9d.price,
    psa8: psa8d.price,
    psa7: psa7d.price,
    psa10s: psa10d.samples,
    psa9s: psa9d.samples,
    psa8s: psa8d.samples,
    psa7s: psa7d.samples,
    cgc10: cgc10d.price,
    cgc9: cgc9d.price,
    cgc10s: cgc10d.samples,
    cgc9s: cgc9d.samples,
    bgs10: bgs10d.price,
    bgs10s: bgs10d.samples,
    officialImage: raw.image ?? raw.image_url ?? raw.images?.large ?? raw.images?.small ?? null,
    tcggoUrl: raw.url ?? null,
  };
}

function extractCards(json: TcggoApiResponse): TcggoApiCard[] {
  return json.data ?? json.cards ?? json.results ?? [];
}

async function fetchRawCards(
  name: string,
  pageSize = 6,
  cardNumber?: string
): Promise<TcggoApiCard[]> {
  const headers = buildHeaders();
  if (!headers) return [];

  const params = new URLSearchParams({ name });
  if (pageSize > 1) params.set("pageSize", String(pageSize));
  if (cardNumber) params.set("card_number", cardNumber);

  const url = `${TCGGO_BASE}/cards?${params.toString()}`;
  console.log("[tcggo] fetching URL:", url);

  try {
    const res = await fetch(url, { headers, next: { revalidate: 3600 } });

    if (!res.ok) {
      console.warn(
        `[tcggo] search failed (${res.status}): ${name}${cardNumber ? ` #${cardNumber}` : ""}`
      );
      return [];
    }

    const json = (await res.json()) as TcggoApiResponse;
    console.log("[tcggo] raw API response:", JSON.stringify(json).slice(0, 500));
    return extractCards(json);
  } catch (err) {
    console.warn("[tcggo] request error:", err);
    return [];
  }
}

async function fetchCards(
  name: string,
  pageSize = 6,
  cardNumber?: string
): Promise<TcggoCardResult[]> {
  const rawCards = await fetchRawCards(name, pageSize, cardNumber);
  const mapped = rawCards.map(mapCard).filter((c): c is TcggoCardResult => c != null);

  console.log(
    "[tcggo] extracted cards:",
    mapped.map((c) => `${c.name} | price: ${c.marketPrice ?? "null"}`)
  );

  return mapped;
}

/**
 * Single-card price lookup — returns full TCGPriceResult with graded data.
 * Three attempts: name+number → name+variant → name only.
 */
export async function searchCardPrice(
  cardName: string,
  cardNumber?: string,
  variant?: string
): Promise<TCGPriceResult | null> {
  const name = cardName.trim();
  if (!name) return null;

  const number = cardNumber ? stripTotal(cardNumber) : undefined;
  const variantSuffix = variant ? VARIANT_SUFFIX[variant] : undefined;

  type Attempt = { label: string; name: string; cardNumber?: string };
  const attempts: Attempt[] = [];

  if (number) {
    attempts.push({ label: `name=${name}&card_number=${number}`, name, cardNumber: number });
  }
  if (variantSuffix) {
    attempts.push({ label: `name="${name} ${variantSuffix}"`, name: `${name} ${variantSuffix}` });
  }
  attempts.push({ label: `name=${name}`, name });

  for (const attempt of attempts) {
    const rawCards = await fetchRawCards(attempt.name, 10, attempt.cardNumber);

    if (!rawCards.length) {
      console.log(`[tcggo] no results for ${attempt.label} — trying fallback`);
      continue;
    }

    const withPrice = rawCards.find((r) => {
      const tcp = parseMarketPrice(r.prices?.tcg_player?.market_price);
      const cm = parseMarketPrice(r.prices?.cardmarket?.lowest_near_mint);
      return tcp != null || cm != null;
    });
    const raw = withPrice ?? rawCards[0];
    const result = mapFullCard(raw);

    if (!result) continue;

    console.log(
      `[tcggo] matched ${attempt.label} → ${raw.name} price=$${result.displayPrice ?? "—"}`
    );

    return result;
  }

  console.log(`[tcggo] all attempts exhausted for "${name}"`);
  return null;
}

/**
 * Multi-result search for manual lookup in the sell flow.
 */
export async function searchCardPrices(
  query: string,
  pageSize = 6
): Promise<TcggoCardResult[]> {
  const search = query.trim();
  if (!search) return [];
  return fetchCards(search, pageSize);
}

export function isTcggoConfigured(): boolean {
  return !!process.env.RAPIDAPI_KEY;
}

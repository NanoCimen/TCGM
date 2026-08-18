import { createPublicClient } from "@/lib/supabase/public";
import type {
  MarketplaceCard,
  MarketplaceStats,
  TrendingCard,
} from "@/lib/marketplace/types";
import type { CardStatus } from "@/lib/supabase/types";

type CardRow = {
  id: string;
  card_name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string | null;
  official_image_url: string | null;
  price_usd: number | null;
  tcg_market_price: number | null;
  status: CardStatus;
  created_at: string;
  variant: string | null;
  language: string | null;
  is_graded: boolean | null;
  grade: string | null;
  grade_company: string | null;
  users: { username: string | null } | { username: string | null }[] | null;
};

function mapCard(row: CardRow): MarketplaceCard {
  const seller = Array.isArray(row.users) ? row.users[0] : row.users;

  return {
    id: row.id,
    card_name: row.card_name,
    set_name: row.set_name,
    card_number: row.card_number,
    // Prefer the official card artwork over the seller's own photo, same
    // as the card detail/dashboard/collection views.
    image_url: row.official_image_url ?? row.image_url,
    price_usd: row.price_usd,
    tcg_market_price: row.tcg_market_price,
    status: row.status,
    created_at: row.created_at,
    seller_name: seller?.username ?? "Vendedor",
    variant: row.variant ?? "Regular",
    language: row.language ?? "EN",
    is_graded: row.is_graded ?? false,
    grade: row.grade,
    grade_company: row.grade_company,
  };
}

export async function getMarketplaceCards(): Promise<MarketplaceCard[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("cards")
    .select(
      `
      id,
      card_name,
      set_name,
      card_number,
      image_url,
      official_image_url,
      price_usd,
      tcg_market_price,
      status,
      created_at,
      variant,
      language,
      is_graded,
      grade,
      grade_company,
      users!seller_id ( username )
    `
    )
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) {
    console.error("getMarketplaceCards:", error.message);
    return [];
  }

  if (!data) return [];

  return (data as CardRow[]).map(mapCard);
}

export async function getMarketplaceStats(
  cards: MarketplaceCard[]
): Promise<MarketplaceStats> {
  const supabase = createPublicClient();

  const prices = cards
    .map((c) => c.price_usd)
    .filter((p): p is number => p != null);

  const withImages = cards.filter((c) => c.image_url);

  // `cards` is capped at 24 (getMarketplaceCards' page size), so it can't be
  // used for the real totals below — query them separately.
  //
  // Volume comes from accepted offers, not cards.status = 'sold' — a sold
  // card's status resets to 'draft'/'available' if the buyer relists it, so
  // a status-based sum would silently erase real historical sales the
  // moment a card gets resold. Offers are append-only, so this total is
  // cumulative across every user, forever.
  const [{ data: acceptedOffers }, { data: availableCards }] = await Promise.all([
    supabase
      .from("offers")
      .select("offer_price, cards:card_id ( status )")
      .eq("status", "accepted"),
    supabase
      .from("cards")
      .select("price_usd")
      .eq("status", "available")
      .not("price_usd", "is", null),
  ]);

  // Buy Now / accepting an offer flips offers.status to 'accepted'
  // immediately, before the seller confirms delivery — the card sits in
  // 'hold' until then. Exclude those still-in-progress transactions so the
  // total only reflects sales that actually completed.
  const soldVolume = (acceptedOffers ?? []).reduce((sum, o) => {
    const card = Array.isArray(o.cards) ? o.cards[0] : o.cards;
    if (card?.status === "hold") return sum;
    return sum + (o.offer_price ?? 0);
  }, 0);
  const listingValue = (availableCards ?? []).reduce(
    (sum, c) => sum + (c.price_usd ?? 0),
    0
  );

  return {
    listingValue,
    floorPrice: prices.length ? Math.min(...prices) : null,
    soldVolume,
    heroImage: withImages[0]?.image_url ?? null,
    thumbnailImage:
      withImages[1]?.image_url ?? withImages[0]?.image_url ?? null,
  };
}

// "Trending" ranks live listings by community activity for that card name:
// wishlist adds (strongest signal of demand), completed sales (proven
// transactions — stands in for both "buys" and "sells" since a sale is
// both), and how often the card gets listed at all. There's no dedicated
// interaction-event log, so this composites the signals we already have.
const INTERACTION_WEIGHTS = { wish: 3, sold: 2, listing: 1 };

export async function getTrendingCards(limit = 6): Promise<TrendingCard[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("cards")
    .select(
      `
      id,
      card_name,
      set_name,
      card_number,
      image_url,
      official_image_url,
      price_usd,
      tcg_market_price,
      status,
      created_at,
      variant,
      language,
      is_graded,
      grade,
      grade_company,
      users!seller_id ( username )
    `
    )
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data?.length) {
    if (error) console.error("getTrendingCards:", error.message);
    return [];
  }

  const [{ data: allCards }, { data: demand }] = await Promise.all([
    supabase.from("cards").select("card_name, status").limit(5000),
    supabase.rpc("get_wishlist_demand", { limit_count: 500 }),
  ]);

  const soldCount = new Map<string, number>();
  const listingCount = new Map<string, number>();
  for (const row of allCards ?? []) {
    const key = row.card_name.toLowerCase();
    listingCount.set(key, (listingCount.get(key) ?? 0) + 1);
    if (row.status === "sold") {
      soldCount.set(key, (soldCount.get(key) ?? 0) + 1);
    }
  }

  const wishCount = new Map<string, number>();
  for (const d of (demand ?? []) as { card_name: string; wish_count: number }[]) {
    const key = d.card_name.toLowerCase();
    wishCount.set(key, (wishCount.get(key) ?? 0) + Number(d.wish_count));
  }

  const scored: (MarketplaceCard & { interactionScore: number })[] = (
    data as CardRow[]
  ).map(mapCard).map((card) => {
    const key = card.card_name.toLowerCase();
    const interactionScore =
      (wishCount.get(key) ?? 0) * INTERACTION_WEIGHTS.wish +
      (soldCount.get(key) ?? 0) * INTERACTION_WEIGHTS.sold +
      (listingCount.get(key) ?? 0) * INTERACTION_WEIGHTS.listing;
    return { ...card, interactionScore };
  });

  scored.sort((a, b) => {
    if (b.interactionScore !== a.interactionScore) {
      return b.interactionScore - a.interactionScore;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Multiple listings of the same card (different sellers, or a resold
  // card under a new listing) share the same interactionScore, since it's
  // computed per card_name — without this, they could both land in the
  // top N and show the same card twice. Keep only the highest-ranked
  // listing per distinct card name.
  const seenNames = new Set<string>();
  const deduped = scored.filter((c) => {
    const key = c.card_name.toLowerCase();
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });

  const top = deduped.slice(0, limit);
  const topIds = top.map((c) => c.id);

  // RLS on offers only lets a user read their own offers, so a plain select
  // would show 0 for everyone else's cards — use the public aggregate RPC
  // instead (see get_offers_count, mirrors get_wishlist_demand).
  const offersCount = new Map<string, number>();
  if (topIds.length) {
    const { data: offerRows } = await supabase.rpc("get_offers_count", {
      card_ids: topIds,
    });
    for (const row of (offerRows ?? []) as {
      card_id: string;
      offers_count: number;
    }[]) {
      offersCount.set(row.card_id, Number(row.offers_count));
    }
  }

  return top.map((card) => ({
    ...card,
    offersCount: offersCount.get(card.id) ?? 0,
  }));
}

export type { MarketplaceCard, MarketplaceStats, TrendingCard };

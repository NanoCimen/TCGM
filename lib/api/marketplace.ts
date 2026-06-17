import { createClient } from "@/lib/supabase/server";
import type {
  MarketplaceCard,
  MarketplaceStats,
} from "@/lib/marketplace/types";
import type { CardStatus } from "@/lib/supabase/types";

type CardRow = {
  id: string;
  card_name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string | null;
  price_usd: number | null;
  tcg_market_price: number | null;
  status: CardStatus;
  created_at: string;
  variant: string | null;
  language: string | null;
  is_graded: boolean | null;
  grade: string | null;
  grade_company: string | null;
  users: { display_name: string | null } | { display_name: string | null }[] | null;
};

function mapCard(row: CardRow): MarketplaceCard {
  const seller = Array.isArray(row.users) ? row.users[0] : row.users;

  return {
    id: row.id,
    card_name: row.card_name,
    set_name: row.set_name,
    card_number: row.card_number,
    image_url: row.image_url,
    price_usd: row.price_usd,
    tcg_market_price: row.tcg_market_price,
    status: row.status,
    created_at: row.created_at,
    seller_name: seller?.display_name ?? "Vendedor",
    variant: row.variant ?? "Regular",
    language: row.language ?? "EN",
    is_graded: row.is_graded ?? false,
    grade: row.grade,
    grade_company: row.grade_company,
  };
}

export async function getMarketplaceCards(): Promise<MarketplaceCard[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cards")
    .select(
      `
      id,
      card_name,
      set_name,
      card_number,
      image_url,
      price_usd,
      tcg_market_price,
      status,
      created_at,
      variant,
      language,
      is_graded,
      grade,
      grade_company,
      users!seller_id ( display_name )
    `
    )
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(100);

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
  const supabase = await createClient();

  const prices = cards
    .map((c) => c.price_usd)
    .filter((p): p is number => p != null);

  const withImages = cards.filter((c) => c.image_url);

  // Total value of completed sales for volume display
  const { data: soldCards } = await supabase
    .from("cards")
    .select("price_usd")
    .eq("status", "sold");

  const soldVolume = (soldCards ?? []).reduce(
    (sum, c) => sum + (c.price_usd ?? 0),
    0
  );

  return {
    listingCount: cards.length,
    floorPrice: prices.length ? Math.min(...prices) : null,
    soldVolume,
    heroImage: withImages[0]?.image_url ?? null,
    thumbnailImage:
      withImages[1]?.image_url ?? withImages[0]?.image_url ?? null,
  };
}

export type { MarketplaceCard, MarketplaceStats };

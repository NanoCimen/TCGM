import type { CardStatus } from "@/lib/supabase/types";

export interface MarketplaceCard {
  id: string;
  card_name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string | null;
  price_usd: number | null;
  tcg_market_price: number | null;
  status: CardStatus;
  created_at: string;
  seller_name: string;
  variant: string;
  language: string;
  is_graded: boolean;
  grade: string | null;
  grade_company: string | null;
}

export interface MarketplaceStats {
  listingCount: number;
  floorPrice: number | null;
  soldVolume: number;
  heroImage: string | null;
  thumbnailImage: string | null;
}

// Aggregate demand for a card across ALL users' wishlists — a "hot cards"
// leaderboard, not any single person's personal wishlist. Never carries a
// user identity, only counts (see get_wishlist_demand SQL function).
export interface WishlistDemand {
  pokemon_tcg_id: string;
  card_name: string;
  card_number: string | null;
  set_name: string | null;
  image_url: string | null;
  variant: string | null;
  wish_count: number;
}

// A marketplace listing ranked by combined community activity (wishlist
// adds, sales, and listing frequency for that card name) — see
// getTrendingCards in lib/api/marketplace.ts for the scoring.
export interface TrendingCard extends MarketplaceCard {
  interactionScore: number;
}

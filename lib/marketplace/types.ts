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

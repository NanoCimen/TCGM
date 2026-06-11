export type CardStatus = "available" | "sold" | "hold";

export interface User {
  id: string;
  phone: string | null;
  display_name: string | null;
  avatar_url: string | null;
  invite_code_used: string | null;
  created_at: string;
}

export interface Card {
  id: string;
  seller_id: string;
  card_name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string | null;
  price_usd: number | null;
  tcg_market_price: number | null;
  status: CardStatus;
  notes: string | null;
  created_at: string;
}

export interface Invite {
  id: string;
  code: string;
  created_by: string | null;
  used_by: string | null;
  used_at: string | null;
}

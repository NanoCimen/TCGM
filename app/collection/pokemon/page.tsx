import { createClient } from "@/lib/supabase/server";
import PokemonCollectionPage, {
  type CollectionCard,
  type CollectionStats,
  type SaleActivity,
} from "@/components/collection/PokemonCollectionPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pokémon TCG — TCGRD",
  description: "Explora todas las cartas Pokémon disponibles en el mercado.",
};

type CardRow = {
  id: string;
  card_name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string | null;
  official_image_url: string | null;
  price_usd: number | null;
  tcg_market_price: number | null;
  status: string;
  created_at: string;
  seller_id: string;
  variant: string | null;
  language: string | null;
  is_graded: boolean | null;
  grade: string | null;
  grade_company: string | null;
  users: { display_name: string | null } | { display_name: string | null }[] | null;
};

type OfferRow = {
  id: string;
  offer_price: number;
  responded_at: string | null;
  created_at: string;
  cards: { card_name: string; image_url: string | null; official_image_url: string | null } | { card_name: string; image_url: string | null; official_image_url: string | null }[] | null;
  buyer: { display_name: string | null } | { display_name: string | null }[] | null;
  seller: { display_name: string | null } | { display_name: string | null }[] | null;
};

function firstOf<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function PokemonCollection() {
  const supabase = await createClient();

  const [{ data: cards }, { data: soldCards }, { data: sellerRows }, { data: sales }] =
    await Promise.all([
      supabase
        .from("cards")
        .select(
          `id, card_name, set_name, card_number, image_url, official_image_url,
           price_usd, tcg_market_price, status, created_at, seller_id,
           variant, language, is_graded, grade, grade_company,
           users!seller_id ( display_name )`
        )
        .in("status", ["available", "hold", "sold"])
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
        .from("cards")
        .select("price_usd")
        .eq("status", "sold"),
      supabase
        .from("cards")
        .select("seller_id")
        .eq("status", "available"),
      supabase
        .from("offers")
        .select(
          `id, offer_price, responded_at, created_at,
           cards:card_id ( card_name, image_url, official_image_url ),
           buyer:users!buyer_id ( display_name ),
           seller:users!seller_id ( display_name )`
        )
        .eq("status", "accepted")
        .order("responded_at", { ascending: false })
        .limit(30),
    ]);

  const soldVolume = (soldCards ?? []).reduce(
    (sum, c) => sum + (c.price_usd ?? 0),
    0
  );
  const uniqueSellers = new Set((sellerRows ?? []).map((r) => r.seller_id)).size;

  const mapped: CollectionCard[] = ((cards ?? []) as CardRow[]).map((row) => {
    const seller = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      id: row.id,
      card_name: row.card_name,
      set_name: row.set_name,
      card_number: row.card_number,
      image_url: row.image_url,
      official_image_url: row.official_image_url,
      price_usd: row.price_usd,
      tcg_market_price: row.tcg_market_price,
      status: row.status,
      created_at: row.created_at,
      seller_id: row.seller_id,
      seller_name: seller?.display_name ?? "Vendedor",
      variant: row.variant ?? "Regular",
      language: row.language ?? "EN",
      is_graded: row.is_graded ?? false,
      grade: row.grade,
      grade_company: row.grade_company,
    };
  });

  const available = mapped.filter((c) => c.status === "available");
  const prices = available.map((c) => c.price_usd).filter((p): p is number => p != null);
  const floorPrice = prices.length ? Math.min(...prices) : null;

  const stats: CollectionStats = {
    floorPrice,
    listedCount: available.length,
    soldVolume,
    uniqueSellers,
  };

  const salesActivity: SaleActivity[] = ((sales ?? []) as OfferRow[])
    .map((row) => {
      const card = firstOf(row.cards);
      const buyer = firstOf(row.buyer);
      const seller = firstOf(row.seller);
      if (!card) return null;
      return {
        id: row.id,
        cardName: card.card_name,
        cardImage: card.official_image_url ?? card.image_url,
        priceUsd: row.offer_price,
        buyerName: buyer?.display_name ?? "Comprador",
        sellerName: seller?.display_name ?? "Vendedor",
        date: row.responded_at ?? row.created_at,
      };
    })
    .filter((s): s is SaleActivity => s != null);

  return (
    <PokemonCollectionPage cards={mapped} stats={stats} sales={salesActivity} />
  );
}

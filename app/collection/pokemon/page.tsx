import { createPublicClient } from "@/lib/supabase/public";
import PokemonCollectionPage, {
  type CollectionCard,
  type CollectionStats,
  type SaleActivity,
} from "@/components/collection/PokemonCollectionPage";

// Public market data only (no per-user query here — logged-in state,
// wishlist, etc. are fetched client-side inside PokemonCollectionPage), so
// this can be cached instead of re-fetched from Supabase on every visit.
export const revalidate = 60;

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
  published_at: string | null;
  seller_id: string;
  variant: string | null;
  language: string | null;
  is_graded: boolean | null;
  grade: string | null;
  grade_company: string | null;
  users: { username: string | null } | { username: string | null }[] | null;
};

type OfferRow = {
  id: string;
  offer_price: number;
  responded_at: string | null;
  created_at: string;
  cards: { card_name: string; image_url: string | null; official_image_url: string | null; status: string } | { card_name: string; image_url: string | null; official_image_url: string | null; status: string }[] | null;
  buyer: { username: string | null } | { username: string | null }[] | null;
  seller: { username: string | null } | { username: string | null }[] | null;
};

type SoldOfferCard = {
  id: string;
  card_name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string | null;
  official_image_url: string | null;
  variant: string | null;
  language: string | null;
  is_graded: boolean | null;
  grade: string | null;
  grade_company: string | null;
  status: string;
};

type SoldOfferRow = {
  id: string;
  offer_price: number;
  responded_at: string | null;
  created_at: string;
  cards: SoldOfferCard | SoldOfferCard[] | null;
  seller: { username: string | null } | { username: string | null }[] | null;
};

function firstOf<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function PokemonCollection() {
  const supabase = createPublicClient();

  const [{ data: cards }, { data: soldOffers }, { data: sales }] =
    await Promise.all([
      supabase
        .from("cards")
        .select(
          `id, card_name, set_name, card_number, image_url, official_image_url,
           price_usd, tcg_market_price, status, created_at, published_at, seller_id,
           variant, language, is_graded, grade, grade_company,
           users!seller_id ( username )`
        )
        // Reserved (hold) and sold cards are handled elsewhere: hold is
        // pulled off the market entirely, and sold cards come from the
        // offers-based history below instead of cards.status (see comment
        // there), so this only needs the live listings.
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(300),
      // The "Vendidas" tab and market volume both come from accepted
      // offers, not cards.status = 'sold' — a sold card's status resets to
      // draft/available if the buyer relists it, so a status-based query
      // would silently drop real historical sales (and zero out the
      // volume) the moment a card gets resold. Offers are append-only, so
      // this is a permanent record and also naturally shows a card more
      // than once if it's been sold multiple times.
      supabase
        .from("offers")
        .select(
          `id, offer_price, responded_at, created_at,
           cards:card_id ( id, card_name, set_name, card_number, image_url, official_image_url, variant, language, is_graded, grade, grade_company, status ),
           seller:users!seller_id ( username )`
        )
        .eq("status", "accepted")
        .order("responded_at", { ascending: false })
        .limit(300),
      supabase
        .from("offers")
        .select(
          `id, offer_price, responded_at, created_at,
           cards:card_id ( card_name, image_url, official_image_url, status ),
           buyer:users!buyer_id ( username ),
           seller:users!seller_id ( username )`
        )
        .eq("status", "accepted")
        .order("responded_at", { ascending: false })
        .limit(30),
    ]);

  // Buy Now / accepting an offer flips offers.status to 'accepted'
  // immediately, before the seller confirms delivery — the card sits in
  // 'hold' until then. Exclude those still-in-progress transactions so
  // volume/history/activity only reflect sales that actually completed
  // (cards.status moves off 'hold' once delivery is confirmed, or the card
  // is resold — see the PATCH/relist routes).
  const completedSoldOffers = ((soldOffers ?? []) as SoldOfferRow[]).filter(
    (row) => firstOf(row.cards)?.status !== "hold"
  );
  const completedSales = ((sales ?? []) as OfferRow[]).filter(
    (row) => firstOf(row.cards)?.status !== "hold"
  );

  const soldVolume = completedSoldOffers.reduce(
    (sum, o) => sum + (o.offer_price ?? 0),
    0
  );

  const soldHistory: CollectionCard[] = completedSoldOffers
    .map((row): CollectionCard | null => {
      const card = firstOf(row.cards);
      const seller = firstOf(row.seller);
      if (!card) return null;
      return {
        id: card.id,
        card_name: card.card_name,
        set_name: card.set_name,
        card_number: card.card_number,
        image_url: card.image_url,
        official_image_url: card.official_image_url,
        price_usd: row.offer_price,
        tcg_market_price: null,
        status: "sold",
        created_at: row.responded_at ?? row.created_at,
        published_at: null,
        // seller_id isn't the card's *current* seller_id (which may have
        // changed via a resell) — it's irrelevant here anyway, since a
        // sold-history row is never buyable, so isOwn/canBuy don't apply.
        seller_id: "",
        seller_name: seller?.username ?? "Vendedor",
        variant: card.variant ?? "Regular",
        language: card.language ?? "EN",
        is_graded: card.is_graded ?? false,
        grade: card.grade,
        grade_company: card.grade_company,
      };
    })
    .filter((c): c is CollectionCard => c !== null);

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
      published_at: row.published_at,
      seller_id: row.seller_id,
      seller_name: seller?.username ?? "Vendedor",
      variant: row.variant ?? "Regular",
      language: row.language ?? "EN",
      is_graded: row.is_graded ?? false,
      grade: row.grade,
      grade_company: row.grade_company,
    };
  });

  // `cards` was already queried as status = "available" only.
  const available = mapped;
  const prices = available.map((c) => c.price_usd).filter((p): p is number => p != null);
  const floorPrice = prices.length ? Math.min(...prices) : null;

  const stats: CollectionStats = {
    floorPrice,
    listedCount: available.length,
    soldVolume,
  };

  const salesActivity: SaleActivity[] = completedSales
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
        buyerName: buyer?.username ?? "Comprador",
        sellerName: seller?.username ?? "Vendedor",
        date: row.responded_at ?? row.created_at,
      };
    })
    .filter((s): s is SaleActivity => s != null);

  return (
    <PokemonCollectionPage
      cards={mapped}
      soldHistory={soldHistory}
      stats={stats}
      sales={salesActivity}
    />
  );
}

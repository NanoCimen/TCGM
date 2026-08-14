import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import CardDetailClient, { type CardActivityEntry } from "@/components/cards/CardDetailClient";
import type { CardStatus } from "@/lib/supabase/types";
import type { OfferWithDetails } from "@/components/dashboard/MyCardsDashboard";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = await createClient();
  const { data: card } = await supabase
    .from("cards")
    .select("card_name, set_name, image_url, official_image_url, price_usd")
    .eq("id", params.id)
    .maybeSingle<{
      card_name: string;
      set_name: string | null;
      image_url: string | null;
      official_image_url: string | null;
      price_usd: number | null;
    }>();

  if (!card) return { title: "Carta | TCGRD" };

  const title = `${card.card_name}${card.set_name ? ` · ${card.set_name}` : ""} | TCGRD`;
  const description = `${card.card_name}${card.set_name ? ` de ${card.set_name}` : ""} disponible en TCGRD.${card.price_usd ? ` Precio: $${card.price_usd.toFixed(2)} USD` : ""}`;
  const image = card.official_image_url ?? card.image_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(image && { images: [{ url: image, width: 600, height: 840, alt: card.card_name }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

type CardRow = {
  id: string;
  seller_id: string;
  owner_id: string | null;
  card_name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string | null;
  official_image_url: string | null;
  price_usd: number | null;
  tcg_market_price: number | null;
  status: CardStatus;
  notes: string | null;
  created_at: string;
  variant: string | null;
  language: string | null;
  is_graded: boolean | null;
  grade: string | null;
  grade_company: string | null;
  users: { display_name: string | null } | { display_name: string | null }[] | null;
};

export default async function CardDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const [{ data: card }, { data: { user } }] = await Promise.all([
    supabase
      .from("cards")
      .select(
        `
        id,
        seller_id,
        owner_id,
        card_name,
        set_name,
        card_number,
        image_url,
        official_image_url,
        price_usd,
        tcg_market_price,
        status,
        notes,
        created_at,
        variant,
        language,
        is_graded,
        grade,
        grade_company,
        users!seller_id ( display_name )
      `
      )
      .eq("id", params.id)
      .single<CardRow>(),
    supabase.auth.getUser(),
  ]);

  if (!card) notFound();

  // Check if the current user already has a pending offer on this card
  let existingOffer: { id: string; offer_price: number } | null = null;
  if (user && user.id !== card.seller_id) {
    const { data } = await supabase
      .from("offers")
      .select("id, offer_price")
      .eq("card_id", card.id)
      .eq("buyer_id", user.id)
      .eq("status", "pending")
      .maybeSingle<{ id: string; offer_price: number }>();
    existingOffer = data ?? null;
  }

  // Seller's phone is only fetched for a logged-in, non-owner viewer — both
  // because that's the only case it's needed, and because `phone` requires an
  // authenticated session at the DB level (anon callers can't select it at all).
  let sellerPhone: string | null = null;
  if (user && user.id !== card.seller_id) {
    const { data: sellerRow } = await supabase
      .from("users")
      .select("phone")
      .eq("id", card.seller_id)
      .maybeSingle<{ phone: string | null }>();
    sellerPhone = sellerRow?.phone ?? null;
  }

  const seller = Array.isArray(card.users) ? card.users[0] : card.users;

  // Pending offers on this card are public — any visitor can see who's
  // offering what (see the "Anyone can read pending offers" policy), so
  // buyers can gauge the competition instead of bidding blind. Phone is
  // deliberately NOT selected here (unlike the seller's own dashboard
  // view) — phone numbers stay restricted to buyer/seller pairs who've
  // actually transacted, not exposed to every visitor.
  const { data: cardOffersData } = await supabase
    .from("offers")
    .select(
      `
      id,
      card_id,
      offer_price,
      message,
      status,
      is_buy_now,
      created_at,
      responded_at,
      cards ( id, card_name, set_name, image_url, official_image_url, price_usd ),
      buyer:users!buyer_id ( id, display_name ),
      seller:users!seller_id ( id, display_name )
    `
    )
    .eq("card_id", card.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const cardOffers = (cardOffersData ?? []) as unknown as OfferWithDetails[];

  // Completed transaction history for this exact card — every accepted
  // offer across however many times it's been bought and resold. Accepted
  // offers are public (see the "Anyone can read accepted offers" policy),
  // so this shows for any visitor, not just the current owner.
  const { data: activityRows } = await supabase
    .from("offers")
    .select(
      `
      id,
      offer_price,
      is_buy_now,
      created_at,
      responded_at,
      buyer:users!buyer_id ( display_name ),
      seller:users!seller_id ( display_name )
    `
    )
    .eq("card_id", card.id)
    .eq("status", "accepted")
    .order("responded_at", { ascending: false });

  type ActivityRow = {
    id: string;
    offer_price: number;
    is_buy_now: boolean;
    created_at: string;
    responded_at: string | null;
    buyer: { display_name: string | null } | { display_name: string | null }[] | null;
    seller: { display_name: string | null } | { display_name: string | null }[] | null;
  };

  const firstOf = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

  // "Last sale" for this exact card — a resold card keeps the same row
  // (status just flips back to available/hold, see get_offers_count.sql's
  // sibling comment), so its accepted-offer history here already covers
  // every time it's changed hands. activityRows is ordered most-recent
  // first, so the first entry is the last sale.
  const lastSaleUsd = (activityRows as ActivityRow[] | null)?.[0]?.offer_price ?? null;

  const cardActivity: CardActivityEntry[] = ((activityRows ?? []) as ActivityRow[]).map(
    (row, index) => {
      // Only the most recent accepted offer's outcome is still open — every
      // earlier one necessarily completed, since a card can't be resold
      // (and get a new accepted offer) until delivery was confirmed on it.
      const isLatest = index === 0;
      const status: "hold" | "sold" = isLatest && card.status === "hold" ? "hold" : "sold";
      return {
        id: row.id,
        priceUsd: row.offer_price,
        isBuyNow: row.is_buy_now,
        date: row.responded_at ?? row.created_at,
        buyerName: firstOf(row.buyer)?.display_name ?? "Comprador",
        sellerName: firstOf(row.seller)?.display_name ?? "Vendedor",
        status,
      };
    }
  );

  return (
    <CardDetailClient
      card={card}
      sellerId={card.seller_id}
      sellerName={seller?.display_name ?? "Vendedor"}
      sellerPhone={sellerPhone}
      currentUserId={user?.id ?? null}
      existingOffer={existingOffer}
      lastSaleUsd={lastSaleUsd}
      cardOffers={cardOffers}
      cardActivity={cardActivity}
    />
  );
}

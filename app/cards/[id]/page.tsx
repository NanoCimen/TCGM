import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import CardDetailClient from "@/components/cards/CardDetailClient";
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

  const { data: lastSaleRow } = await supabase
    .from("cards")
    .select("price_usd")
    .eq("card_name", card.card_name)
    .eq("status", "sold")
    .neq("id", params.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ price_usd: number | null }>();

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

  // Offers made on this specific card — only the seller gets to see them.
  let cardOffers: OfferWithDetails[] = [];
  if (user && user.id === card.seller_id) {
    const { data } = await supabase
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
        buyer:users!buyer_id ( id, display_name, phone ),
        seller:users!seller_id ( id, display_name, phone )
      `
      )
      .eq("card_id", card.id)
      .order("created_at", { ascending: false });
    cardOffers = (data ?? []) as unknown as OfferWithDetails[];
  }

  return (
    <CardDetailClient
      card={card}
      sellerId={card.seller_id}
      sellerName={seller?.display_name ?? "Vendedor"}
      sellerPhone={sellerPhone}
      currentUserId={user?.id ?? null}
      existingOffer={existingOffer}
      lastSaleUsd={lastSaleRow?.price_usd ?? null}
      cardOffers={cardOffers}
    />
  );
}

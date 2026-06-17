import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { searchCardPrice } from "@/lib/api/tcggo";
import CardDetailClient from "@/components/cards/CardDetailClient";
import type { CardStatus } from "@/lib/supabase/types";

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

  const skipLive = card.language === "JP" || card.language === "KR";
  const livePrice =
    !skipLive && card.card_name
      ? await searchCardPrice(
          card.card_name,
          card.card_number ?? undefined,
          card.variant ?? undefined
        )
      : null;

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

  const seller = Array.isArray(card.users) ? card.users[0] : card.users;

  return (
    <CardDetailClient
      card={card}
      sellerId={card.seller_id}
      sellerName={seller?.display_name ?? "Vendedor"}
      currentUserId={user?.id ?? null}
      existingOffer={existingOffer}
      lastSaleUsd={lastSaleRow?.price_usd ?? null}
      livePrice={livePrice}
    />
  );
}

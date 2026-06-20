import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { searchCardPrice } from "@/lib/api/tcggo";
import CardDetailClient from "@/components/cards/CardDetailClient";
import type { CardStatus } from "@/lib/supabase/types";
import type { ChatMessage } from "@/components/cards/ChatPanel";

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

  // Fetch initial chat messages for buyer↔seller thread
  let initialMessages: ChatMessage[] = [];
  if (user && user.id !== card.seller_id) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, read, created_at")
      .eq("card_id", card.id)
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${card.seller_id}),and(sender_id.eq.${card.seller_id},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });
    initialMessages = (msgs ?? []) as ChatMessage[];
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
      initialMessages={initialMessages}
    />
  );
}

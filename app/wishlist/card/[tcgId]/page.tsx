import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WishlistCardDetail, {
  type TcgCard,
  type MarketListing,
} from "@/components/wishlist/WishlistCardDetail";

async function fetchTcgCard(id: string): Promise<TcgCard | null> {
  try {
    const res = await fetch(`https://api.pokemontcg.io/v2/cards/${id}`, {
      headers: process.env.POKEMON_TCG_API_KEY
        ? { "X-Api-Key": process.env.POKEMON_TCG_API_KEY }
        : {},
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const { data } = await res.json();
    return data as TcgCard;
  } catch {
    return null;
  }
}

export default async function WishlistCardPage({
  params,
}: {
  params: { tcgId: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the Pokemon TCG card
  const card = await fetchTcgCard(params.tcgId);
  if (!card) notFound();

  // Find marketplace listings with this card name
  const { data: listingRows } = await supabase
    .from("cards")
    .select(
      "id, card_name, price_usd, status, variant, language, image_url, users!seller_id(display_name)"
    )
    .eq("card_name", card.name)
    .eq("status", "available")
    .order("price_usd", { ascending: true })
    .limit(10);

  const listings: MarketListing[] = (listingRows ?? []).map((row: Record<string, unknown>) => {
    const seller = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      id: row.id as string,
      card_name: row.card_name as string,
      price_usd: row.price_usd as number | null,
      status: row.status as string,
      variant: row.variant as string | null,
      language: row.language as string | null,
      image_url: row.image_url as string | null,
      seller_name: (seller as { display_name?: string } | null)?.display_name ?? "Vendedor",
    };
  });

  // Check if the current user has this card in their wishlist
  let isInWishlist = false;
  let wishlistItemId: string | null = null;
  if (user) {
    const { data: wItem } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("pokemon_tcg_id", params.tcgId)
      .maybeSingle<{ id: string }>();
    isInWishlist = !!wItem;
    wishlistItemId = wItem?.id ?? null;
  }

  return (
    <WishlistCardDetail
      card={card}
      listings={listings}
      isInWishlist={isInWishlist}
      wishlistItemId={wishlistItemId}
    />
  );
}

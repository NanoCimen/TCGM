import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WishlistCardDetail, {
  type TcgCard,
  type MarketListing,
} from "@/components/wishlist/WishlistCardDetail";

type WishlistRow = {
  id: string;
  card_name: string;
  card_number: string | null;
  set_name: string | null;
  set_id: string | null;
  image_url: string | null;
  variant: string | null;
};

// The upstream Pokemon TCG API intermittently 500s on otherwise-valid
// lookups (see app/api/pokemon-search/route.ts) — retry before giving up.
async function fetchTcgCard(id: string): Promise<TcgCard | null> {
  const MAX_ATTEMPTS = 3;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`https://api.pokemontcg.io/v2/cards/${id}`, {
        headers: process.env.POKEMON_TCG_API_KEY
          ? { "X-Api-Key": process.env.POKEMON_TCG_API_KEY }
          : {},
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const { data } = await res.json();
        return data as TcgCard;
      }
    } catch {
      // fall through to retry
    }
    if (attempt < MAX_ATTEMPTS - 1) await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

// Builds a card view from what we already have in the wishlist row —
// used whenever the external API is unavailable, so a flaky third-party
// lookup never turns into a hard error for the user.
function cardFromWishlistRow(tcgId: string, row: WishlistRow): TcgCard {
  return {
    id: tcgId,
    name: row.card_name,
    number: row.card_number ?? "",
    set: { id: row.set_id ?? "", name: row.set_name ?? "Set desconocido" },
    images: { small: row.image_url ?? "", large: row.image_url ?? undefined },
    rarity: row.variant && row.variant !== "Regular" ? row.variant : undefined,
  };
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

  // Check if the current user has this card in their wishlist — also
  // doubles as a fallback data source if the external TCG API is down.
  let wishlistItem: WishlistRow | null = null;
  if (user) {
    const { data: wItem } = await supabase
      .from("wishlist")
      .select("id, card_name, card_number, set_name, set_id, image_url, variant")
      .eq("user_id", user.id)
      .eq("pokemon_tcg_id", params.tcgId)
      .maybeSingle<WishlistRow>();
    wishlistItem = wItem ?? null;
  }

  const apiCard = await fetchTcgCard(params.tcgId);
  const card = apiCard ?? (wishlistItem ? cardFromWishlistRow(params.tcgId, wishlistItem) : null);
  if (!card) notFound();

  // Find marketplace listings with this card name — sourced entirely from
  // our own DB, so this never depends on the external API being up.
  const { data: listingRows } = await supabase
    .from("cards")
    .select(
      "id, card_name, price_usd, status, variant, language, image_url, users!seller_id(username)"
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
      seller_name: (seller as { username?: string } | null)?.username ?? "Vendedor",
    };
  });

  return (
    <WishlistCardDetail
      card={card}
      listings={listings}
      isInWishlist={!!wishlistItem}
      wishlistItemId={wishlistItem?.id ?? null}
    />
  );
}

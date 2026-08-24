import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WishlistClient, { type WishlistItem } from "@/components/wishlist/WishlistClient";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: profile }, { data: rows, error: wishlistError }] = await Promise.all([
    supabase.from("users").select("username, avatar_url, theme_color").eq("id", user.id).single(),
    supabase
      .from("wishlist")
      .select("id, pokemon_tcg_id, card_name, card_number, set_name, image_url, variant, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  // A failed query here (bad RLS policy, transient error, etc.) used to be
  // indistinguishable from a legitimately empty wishlist — `rows` is null
  // either way, and `(rows ?? [])` below quietly treats it as "0 cards."
  // Logging it means a real failure shows up in server logs instead of
  // just looking like an empty wishlist with no explanation. If you see
  // "cards aren't appearing" again, check the Vercel/server logs for this
  // line first — Supabase's own status page only reflects infra health,
  // not whether this specific query/policy is actually working.
  if (wishlistError) {
    console.error("[wishlist page] failed to load wishlist rows:", wishlistError);
  }

  // Check which wishlist cards are currently listed in the marketplace
  const cardNames = (rows ?? []).map((r) => r.card_name);
  let marketNames = new Set<string>();
  if (cardNames.length > 0) {
    const { data: listed } = await supabase
      .from("cards")
      .select("card_name")
      .eq("status", "available")
      .in("card_name", cardNames);
    marketNames = new Set(
      (listed ?? []).map((c: { card_name: string }) => c.card_name.toLowerCase())
    );
  }

  const items: WishlistItem[] = (rows ?? []).map((r) => ({
    ...r,
    inMarket: marketNames.has(r.card_name.toLowerCase()),
  }));

  return (
    <WishlistClient
      initialItems={items}
      username={profile?.username ?? ""}
      email={user.email ?? ""}
      avatarUrl={profile?.avatar_url ?? null}
      themeColor={profile?.theme_color ?? null}
      loadError={Boolean(wishlistError)}
    />
  );
}

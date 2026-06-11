import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WishlistClient, { type WishlistItem } from "@/components/wishlist/WishlistClient";

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from("users").select("display_name, avatar_url").eq("id", user.id).single(),
    supabase
      .from("wishlist")
      .select("id, pokemon_tcg_id, card_name, card_number, set_name, image_url, variant, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

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
      displayName={profile?.display_name ?? ""}
      email={user.email ?? ""}
      avatarUrl={profile?.avatar_url ?? null}
    />
  );
}

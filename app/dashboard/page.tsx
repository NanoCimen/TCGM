import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MyCardsDashboard, {
  type DashboardCard,
  type OfferWithDetails,
} from "@/components/dashboard/MyCardsDashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const offerSelect = `
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
  `;

  const [
    { data: profile },
    { data: cards },
    { data: receivedOffers },
    { data: madeOffers },
    { data: pendingOfferCounts },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("cards")
      .select(
        "id, card_name, set_name, image_url, official_image_url, price_usd, status, created_at"
      )
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("offers")
      .select(offerSelect)
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("offers")
      .select(offerSelect)
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("offers")
      .select("card_id")
      .eq("seller_id", user.id)
      .eq("status", "pending"),
  ]);

  // Build a map of cardId → pending offer count
  const offerCountByCard: Record<string, number> = {};
  for (const row of pendingOfferCounts ?? []) {
    const id = (row as { card_id: string }).card_id;
    offerCountByCard[id] = (offerCountByCard[id] ?? 0) + 1;
  }

  return (
    <MyCardsDashboard
      displayName={profile?.display_name ?? ""}
      email={user.email ?? ""}
      avatarUrl={profile?.avatar_url ?? null}
      cards={(cards ?? []) as DashboardCard[]}
      receivedOffers={(receivedOffers ?? []) as unknown as OfferWithDetails[]}
      madeOffers={(madeOffers ?? []) as unknown as OfferWithDetails[]}
      offerCountByCard={offerCountByCard}
    />
  );
}

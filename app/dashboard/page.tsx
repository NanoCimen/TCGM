import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MyCardsDashboard, {
  type DashboardCard,
  type OfferWithDetails,
  type RawMessage,
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
    buyer:users!buyer_id ( id, display_name, phone ),
    seller:users!seller_id ( id, display_name, phone )
  `;

  const [
    { data: profile },
    { data: cards },
    { data: receivedOffers },
    { data: madeOffers },
    { data: pendingOfferCounts },
    { data: allMessages },
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
    supabase
      .from("messages")
      .select(
        "id, card_id, sender_id, receiver_id, content, read, created_at, cards:card_id ( card_name, image_url ), sender:sender_id ( display_name )"
      )
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(300),
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
      userId={user.id}
      allMessages={(allMessages ?? []) as unknown as RawMessage[]}
    />
  );
}

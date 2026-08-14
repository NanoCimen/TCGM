import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MyCardsDashboard, {
  type DashboardCard,
  type OfferWithDetails,
  type RawMessage,
  type ClosedConversation,
} from "@/components/dashboard/MyCardsDashboard";

export const dynamic = "force-dynamic";

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
    cards ( id, card_name, set_name, image_url, official_image_url, price_usd, status ),
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
    { data: closedConversations },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("display_name, avatar_url, theme_color")
      .eq("id", user.id)
      .single(),
    supabase
      .from("cards")
      .select(
        "id, card_name, set_name, card_number, variant, image_url, official_image_url, price_usd, status, created_at, seller_id, owner_id"
      )
      // Cards I'm selling, plus cards I bought (owner_id set once the
      // seller confirms delivery) — the latter show up in "Colección" too.
      .or(`seller_id.eq.${user.id},owner_id.eq.${user.id}`)
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
    supabase
      .from("closed_conversations")
      .select("card_id, other_user_id, closed_at")
      .eq("user_id", user.id),
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
      themeColor={profile?.theme_color ?? null}
      cards={(cards ?? []) as DashboardCard[]}
      receivedOffers={(receivedOffers ?? []) as unknown as OfferWithDetails[]}
      madeOffers={(madeOffers ?? []) as unknown as OfferWithDetails[]}
      offerCountByCard={offerCountByCard}
      userId={user.id}
      allMessages={(allMessages ?? []) as unknown as RawMessage[]}
      closedConversations={(closedConversations ?? []) as ClosedConversation[]}
    />
  );
}

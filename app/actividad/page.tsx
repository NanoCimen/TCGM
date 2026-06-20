import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ActividadPage from "@/components/dashboard/ActividadPage";
import type { OfferWithDetails } from "@/components/dashboard/MyCardsDashboard";

export default async function ActividadRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  const offerSelect = `
    id, card_id, offer_price, message, status, is_buy_now, created_at, responded_at,
    cards ( id, card_name, set_name, image_url, official_image_url, price_usd ),
    buyer:users!buyer_id ( id, display_name, phone ),
    seller:users!seller_id ( id, display_name, phone )
  `;

  const [{ data: asSellerOffers }, { data: asBuyerOffers }] = await Promise.all([
    supabase
      .from("offers")
      .select(offerSelect)
      .eq("seller_id", user.id)
      .eq("status", "accepted")
      .order("responded_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("offers")
      .select(offerSelect)
      .eq("buyer_id", user.id)
      .eq("status", "accepted")
      .order("responded_at", { ascending: false, nullsFirst: false }),
  ]);

  const name = profile?.display_name || user.email || "";
  const initials = name.substring(0, 2).toUpperCase();

  return (
    <DashboardShell
      active="actividad"
      avatarUrl={profile?.avatar_url ?? null}
      initials={initials}
    >
      <ActividadPage
        userId={user.id}
        asSellerOffers={(asSellerOffers ?? []) as unknown as OfferWithDetails[]}
        asBuyerOffers={(asBuyerOffers ?? []) as unknown as OfferWithDetails[]}
      />
    </DashboardShell>
  );
}

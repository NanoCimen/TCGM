import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ActividadPage from "@/components/dashboard/ActividadPage";
import type { OfferWithDetails } from "@/components/dashboard/MyCardsDashboard";

export const dynamic = "force-dynamic";

export default async function ActividadRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("users")
    .select("username, avatar_url, theme_color")
    .eq("id", user.id)
    .single();

  const offerSelect = `
    id, card_id, offer_price, message, status, is_buy_now, created_at, responded_at,
    cards ( id, card_name, set_name, image_url, official_image_url, price_usd, status ),
    buyer:users!buyer_id ( id, username, phone ),
    seller:users!seller_id ( id, username, phone )
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

  const name = profile?.username || user.email || "";
  const initials = name.substring(0, 2).toUpperCase();

  return (
    <DashboardShell
      active="actividad"
      avatarUrl={profile?.avatar_url ?? null}
      initials={initials}
      email={user.email ?? null}
      accentColor={profile?.theme_color ?? null}
    >
      <ActividadPage
        avatarUrl={profile?.avatar_url ?? null}
        initials={initials}
        userId={user.id}
        asSellerOffers={(asSellerOffers ?? []) as unknown as OfferWithDetails[]}
        asBuyerOffers={(asBuyerOffers ?? []) as unknown as OfferWithDetails[]}
      />
    </DashboardShell>
  );
}

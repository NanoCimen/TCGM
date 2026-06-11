import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MyCardsDashboard, {
  type DashboardCard,
} from "@/components/dashboard/MyCardsDashboard";

export default async function DashboardPage() {
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

  const { data: cards } = await supabase
    .from("cards")
    .select("id, card_name, set_name, image_url, official_image_url, price_usd, status, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <MyCardsDashboard
      displayName={profile?.display_name ?? ""}
      email={user.email ?? ""}
      avatarUrl={profile?.avatar_url ?? null}
      cards={(cards ?? []) as DashboardCard[]}
    />
  );
}

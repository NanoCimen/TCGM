import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileSettings from "@/components/profile/ProfileSettings";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const [{ data: profile }, { data: invites }] = await Promise.all([
    supabase
      .from("users")
      .select("display_name, avatar_url, banner_url, phone")
      .eq("id", user.id)
      .single(),
    supabase
      .from("invites")
      .select("id, code, used_by, used_at")
      .eq("created_by", user.id)
      .order("used_at", { ascending: true, nullsFirst: true }),
  ]);

  return (
    <ProfileSettings
      userId={user.id}
      email={user.email ?? ""}
      initialDisplayName={profile?.display_name ?? ""}
      initialPhone={profile?.phone ?? null}
      initialAvatarUrl={profile?.avatar_url ?? null}
      initialBannerUrl={profile?.banner_url ?? null}
      initialNotifications={{
        marketplace: user.user_metadata?.notif_marketplace ?? true,
        productUpdates: user.user_metadata?.notif_product_updates ?? true,
      }}
      initialInvites={invites ?? []}
    />
  );
}

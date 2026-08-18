import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileSettings from "@/components/profile/ProfileSettings";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const windowStart = new Date();
  windowStart.setMonth(windowStart.getMonth() - 6);

  const [{ data: profile }, { data: invites }, { data: recentUsernameChanges }] =
    await Promise.all([
      supabase
        .from("users")
        .select("username, avatar_url, theme_color, phone, username_claimed")
        .eq("id", user.id)
        .single(),
      supabase
        .from("invites")
        .select("id, code, used_by, used_at")
        .eq("created_by", user.id)
        .order("used_at", { ascending: true, nullsFirst: true }),
      supabase
        .from("username_changes")
        .select("changed_at")
        .eq("user_id", user.id)
        .gte("changed_at", windowStart.toISOString())
        .order("changed_at", { ascending: true }),
    ]);

  const USERNAME_CHANGE_LIMIT = 2;
  const usedChanges = recentUsernameChanges?.length ?? 0;
  const remainingUsernameChanges = Math.max(0, USERNAME_CHANGE_LIMIT - usedChanges);
  let usernameChangeResetAt: string | null = null;
  if (remainingUsernameChanges === 0 && recentUsernameChanges && recentUsernameChanges.length > 0) {
    const reset = new Date(recentUsernameChanges[0].changed_at);
    reset.setMonth(reset.getMonth() + 6);
    usernameChangeResetAt = reset.toISOString();
  }

  return (
    <ProfileSettings
      userId={user.id}
      email={user.email ?? ""}
      initialUsername={profile?.username ?? ""}
      initialPhone={profile?.phone ?? null}
      initialAvatarUrl={profile?.avatar_url ?? null}
      initialThemeColor={profile?.theme_color ?? "#00e559"}
      initialNotifications={{
        marketplace: user.user_metadata?.notif_marketplace ?? true,
        productUpdates: user.user_metadata?.notif_product_updates ?? true,
      }}
      initialInvites={invites ?? []}
      usernameClaimed={profile?.username_claimed ?? false}
      remainingUsernameChanges={remainingUsernameChanges}
      usernameChangeResetAt={usernameChangeResetAt}
    />
  );
}

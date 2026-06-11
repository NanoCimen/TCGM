import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SimpleDashboardPage from "@/components/dashboard/SimpleDashboardPage";

export default async function ActividadPage() {
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

  return (
    <SimpleDashboardPage
      active="actividad"
      title="Actividad"
      emptyTitle="Sin actividad reciente"
      emptySubtitle="Tus compras, ventas y ofertas aparecerán aquí."
      displayName={profile?.display_name ?? ""}
      email={user.email ?? ""}
      avatarUrl={profile?.avatar_url ?? null}
    />
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SellFlow from "@/components/sell/SellFlow";

export default async function SellPage() {
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

  const name = profile?.display_name || user.email || "";
  const initials = name.substring(0, 2).toUpperCase();

  return (
    <DashboardShell
      active={null}
      avatarUrl={profile?.avatar_url ?? null}
      initials={initials}
    >
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-black tracking-tighter text-white mb-1">
          Vender carta
        </h1>
        <p className="text-sm text-gray-500">
          Publica una carta en el mercado
        </p>
      </div>
      <SellFlow />
    </DashboardShell>
  );
}

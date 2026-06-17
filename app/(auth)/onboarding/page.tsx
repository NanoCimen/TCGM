"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Ticket } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [refCode, setRefCode] = useState("");
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setDisplayName(user.email?.split("@")[0] ?? "");

      const savedRef = sessionStorage.getItem("tcgm_ref");
      if (savedRef) setRefCode(savedRef);

      setChecking(false);
    }
    init();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) return;

    setError("");
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error: upsertError } = await supabase.from("users").upsert(
      { id: user.id, display_name: name },
      { onConflict: "id" }
    );

    if (upsertError) {
      setError(upsertError.message);
      setLoading(false);
      return;
    }

    // Claim referral code silently — don't block on failure
    const code = refCode.toUpperCase().trim();
    if (code) {
      const { data: claimed } = await supabase
        .from("invites")
        .update({ used_by: user.id, used_at: new Date().toISOString() })
        .eq("code", code)
        .is("used_by", null)
        .select("id");

      if (claimed && claimed.length > 0) {
        await supabase
          .from("users")
          .update({ invite_code_used: code })
          .eq("id", user.id);
      }

      sessionStorage.removeItem("tcgm_ref");
    }

    router.replace("/");
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <AuthLayout
      title="¿Cómo te llamas?"
      subtitle="Este nombre aparece en tus listados del mercado."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          autoFocus
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            if (error) setError("");
          }}
          placeholder="Tu nombre"
          maxLength={40}
          className="w-full bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 focus:border-yap-primary rounded-2xl py-4 px-4 text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-yap-primary/20 text-[15px] font-medium transition-all duration-300"
        />

        <div className="relative group">
          <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-yap-primary transition-colors pointer-events-none" />
          <input
            type="text"
            value={refCode}
            onChange={(e) => setRefCode(e.target.value.toUpperCase())}
            placeholder="Código de referido (opcional)"
            maxLength={6}
            className="w-full bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 focus:border-yap-primary rounded-2xl py-4 pl-11 pr-4 text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-yap-primary/20 text-[15px] font-mono tracking-widest transition-all duration-300"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs pl-1 font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={!displayName.trim() || loading}
          className="w-full bg-yap-primary hover:bg-yap-hover text-black font-bold py-4 rounded-2xl shadow-[0_0_20px_-5px_rgba(0,255,132,0.3)] hover:shadow-[0_0_25px_-5px_rgba(0,255,132,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2 text-[15px]"
        >
          {loading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : (
            <>
              Entrar al mercado <ArrowRight size={18} strokeWidth={2.5} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}

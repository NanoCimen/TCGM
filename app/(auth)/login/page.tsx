"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) sessionStorage.setItem("tcgm_ref", ref.toUpperCase().trim());
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Ingresa un email valido");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    sessionStorage.setItem("tcgm_email", trimmed);
    router.push("/verify");
  }

  return (
    <AuthLayout title="Iniciar sesion">
      <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
        <div className={`group relative ${error ? "animate-shake" : ""}`}>
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-yap-primary transition-colors duration-300 pointer-events-none" />
          <input
            type="email"
            autoFocus
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            className={`auth-input w-full pl-12 pr-4 py-4 bg-zinc-900/50 border rounded-2xl outline-none transition-all duration-300 font-medium text-white placeholder:text-zinc-500 focus:ring-1 ${
              error
                ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                : "border-zinc-800 hover:border-zinc-700 focus:border-yap-primary focus:ring-yap-primary/20"
            }`}
            placeholder="tu@email.com"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs pl-1 font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={!email.trim() || loading}
          className="w-full bg-yap-primary hover:bg-yap-hover text-black font-bold py-4 rounded-2xl shadow-[0_0_20px_-5px_rgba(0,255,132,0.3)] hover:shadow-[0_0_25px_-5px_rgba(0,255,132,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2 text-[15px]"
        >
          {loading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : (
            <>Enviar link <ArrowRight size={18} strokeWidth={2.5} /></>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

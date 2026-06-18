"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import OtpInput from "@/components/auth/OtpInput";
import { createClient } from "@/lib/supabase/client";

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("tcgm_email");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setEmail(stored);
  }, [router]);

  async function verify(otp: string) {
    if (otp.length < 6 || loading) return;
    setError("");
    setLoading(true);
    const supabase = createClient();

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (verifyError) {
      setError("Código incorrecto o expirado. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    sessionStorage.removeItem("tcgm_email");

    // Route new users through onboarding
    const { data: profile } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", (await supabase.auth.getUser()).data.user!.id)
      .single();

    if (!profile?.display_name) {
      router.replace("/onboarding");
    } else {
      router.replace("/");
    }
  }

  async function resend() {
    if (resending || !email) return;
    setResending(true);
    setResent(false);
    setError("");
    const supabase = createClient();
    await supabase.auth.signInWithOtp({ email });
    setResending(false);
    setResent(true);
    setCode("");
  }

  return (
    <AuthLayout
      title="Ingresa el código"
      subtitle={
        email ? (
          <span className="inline-block bg-zinc-800/60 border border-white/5 px-3 py-1 rounded-full text-xs text-white font-medium">
            {email}
          </span>
        ) : undefined
      }
      footer={
        <Link
          href="/login"
          className="text-xs text-zinc-500 hover:text-yap-primary transition-colors font-medium"
        >
          Usar otro email
        </Link>
      }
    >
      <div className="flex flex-col items-center space-y-6 animate-slide-up py-2">
        <p className="text-sm text-zinc-400 text-center">
          Te enviamos un código de 6 dígitos.
          <br />
          <span className="text-zinc-600 text-xs">Revisa tu bandeja de entrada y spam.</span>
        </p>

        <OtpInput
          value={code}
          onChange={setCode}
          isDark={true}
          disabled={loading}
          onComplete={verify}
        />

        {error && (
          <p className="text-red-400 text-xs font-medium text-center">{error}</p>
        )}

        {loading && (
          <Loader2 className="w-5 h-5 animate-spin text-yap-primary" />
        )}

        <button
          type="button"
          onClick={() => verify(code)}
          disabled={code.length < 6 || loading}
          className="w-full bg-yap-primary hover:bg-yap-hover text-black font-bold py-4 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[15px]"
        >
          Verificar
        </button>

        <button
          type="button"
          onClick={resend}
          disabled={resending}
          className="text-xs text-zinc-500 hover:text-yap-primary transition-colors"
        >
          {resending ? "Enviando..." : resent ? "¡Código reenviado!" : "Reenviar código"}
        </button>
      </div>
    </AuthLayout>
  );
}

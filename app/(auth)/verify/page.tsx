"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("tcgm_email");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setEmail(stored);
  }, [router]);

  return (
    <AuthLayout
      title="Revisa tu email"
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
        {/* Icon */}
        <div className="w-16 h-16 bg-yap-primary/10 rounded-full flex items-center justify-center ring-1 ring-yap-primary/30">
          <Mail className="w-8 h-8 text-yap-primary" />
        </div>

        {/* Copy */}
        <div className="text-center space-y-2">
          <p className="text-sm text-zinc-300 leading-relaxed">
            Te enviamos un link a tu email.<br />
            Revisa tu bandeja de entrada.
          </p>
          <p className="text-xs text-zinc-600">
            El link expira en unos minutos. Si no lo ves, revisa spam.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

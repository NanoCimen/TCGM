"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import OtpInput from "@/components/auth/OtpInput";

type Step = "confirm" | "otp";

type DeleteAccountModalProps = {
  open: boolean;
  email: string;
  onCancel: () => void;
  onDeleted: () => void;
};

export default function DeleteAccountModal({
  open,
  email,
  onCancel,
  onDeleted,
}: DeleteAccountModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("confirm");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setStep("confirm");
      setOtp("");
      setError("");
      setLoading(false);
      setResendCooldown(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function sendCode() {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setResendCooldown(60);
    setStep("otp");
  }

  async function verifyAndDelete(code: string) {
    if (code.length !== 6 || loading) return;
    setError("");
    setLoading(true);
    const supabase = createClient();

    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    const accessToken = verifyData?.session?.access_token;

    if (verifyError || !accessToken) {
      setError("Código incorrecto o expirado.");
      setOtp("");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setLoading(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "No se pudo eliminar la cuenta. Intenta de nuevo.");
      setOtp("");
      return;
    }

    onDeleted();
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            disabled={loading}
            onClick={onCancel}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle className="h-5 w-5" strokeWidth={2} />
            </div>

            {step === "confirm" ? (
              <>
                <h2
                  id="delete-account-title"
                  className="text-lg font-black tracking-tight text-white"
                >
                  Eliminar tu cuenta
                </h2>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  Esto borra tu perfil, cartas publicadas, ofertas, mensajes y
                  wishlist de forma permanente. No se puede deshacer.
                </p>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                  Te enviaremos un código a{" "}
                  <span className="font-bold text-white">{email}</span> para
                  confirmar que eres tú.
                </p>

                {error && (
                  <p className="mt-3 text-red-400 text-xs font-medium">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={onCancel}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={sendCode}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-400 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Enviar código"
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2
                  id="delete-account-title"
                  className="text-lg font-black tracking-tight text-white"
                >
                  Confirma con el código
                </h2>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  Ingresa el código de 6 dígitos que enviamos a{" "}
                  <span className="font-bold text-white">{email}</span> para
                  eliminar tu cuenta permanentemente.
                </p>

                <div className="mt-5">
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    isDark={true}
                    disabled={loading}
                    // No onComplete — this is a destructive action, so
                    // finishing the code should only fill it in. Deletion
                    // only happens when the user explicitly clicks
                    // "Eliminar cuenta" below.
                  />
                </div>

                {error && (
                  <p className="mt-3 text-red-400 text-xs font-medium text-center">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={onCancel}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={otp.length < 6 || loading}
                    onClick={() => verifyAndDelete(otp)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Eliminar cuenta"
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={sendCode}
                  disabled={resendCooldown > 0 || loading}
                  className="mt-4 w-full text-center text-xs text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  {resendCooldown > 0
                    ? `Reenviar código (${resendCooldown}s)`
                    : "Reenviar código"}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

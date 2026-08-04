"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, Lock, Eye, EyeOff, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [isDark, setIsDark] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tcgrd-theme");
    setIsDark(saved !== "light");
  }, []);

  const muted = isDark ? "text-gray-400" : "text-gray-500";
  const text = isDark ? "text-white" : "text-gray-900";
  const border = isDark ? "border-gray-700" : "border-gray-200";
  const inputBg = isDark
    ? "bg-gray-900/50 text-white placeholder:text-gray-500"
    : "bg-white text-gray-900 placeholder:text-gray-400";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setLoading(false);
      setError(
        updateError.message === "Auth session missing!"
          ? "El link expiró o ya fue usado. Solicita uno nuevo."
          : updateError.message
      );
      return;
    }

    // The recovery link signs the user in temporarily so updateUser can run.
    // Sign back out so this page doesn't leave them authenticated.
    await supabase.auth.signOut();
    setLoading(false);
    setDone(true);
  }

  return (
    <main
      className={`min-h-screen w-full flex items-center justify-center p-4 ${
        isDark ? "bg-[#0a0a0a]" : "bg-gray-50"
      }`}
    >
      <div
        className={`relative w-full max-w-[420px] rounded-3xl shadow-2xl px-8 pt-8 pb-7 border ${
          isDark ? "bg-[#111] border-gray-800" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex justify-center mb-8">
          <Image
            src="/solo-logo.png"
            alt="TCGRD"
            width={44}
            height={44}
            className="h-11 w-11"
          />
        </div>

        {done ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center">
                <Check className="w-8 h-8 text-black" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <p className={`text-sm font-semibold ${text}`}>
                ¡Contraseña actualizada!
              </p>
              <p className={`text-sm mt-2 ${muted}`}>
                Ya puedes cerrar esta página e iniciar sesión con tu nueva
                contraseña.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className={`text-center text-sm mb-6 ${muted}`}>
              Crea tu nueva contraseña
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div
                className={`relative flex items-center border rounded-xl overflow-hidden ${border}`}
              >
                <Lock className={`w-4 h-4 ml-4 flex-shrink-0 ${muted}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  autoFocus
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Nueva contraseña (mín. 8 caracteres)"
                  className={`flex-1 py-3.5 pl-3 pr-10 text-sm outline-none bg-transparent ${inputBg}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={`absolute right-3 p-1 ${muted} hover:text-brand transition-colors`}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div
                className={`relative flex items-center border rounded-xl overflow-hidden ${border}`}
              >
                <Lock className={`w-4 h-4 ml-4 flex-shrink-0 ${muted}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Confirmar contraseña"
                  className={`flex-1 py-3.5 pl-3 pr-4 text-sm outline-none bg-transparent ${inputBg}`}
                />
              </div>

              {error && (
                <p className="text-red-500 text-xs pl-1 font-medium">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!password || !confirmPassword || loading}
                className="w-full bg-brand text-black text-sm font-bold py-3.5 rounded-xl hover:bg-[#00c64b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Guardar contraseña"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

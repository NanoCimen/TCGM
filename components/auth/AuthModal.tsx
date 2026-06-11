"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  X,
  Mail,
  Loader2,
  Lock,
  ArrowLeft,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import OtpInput from "./OtpInput";

export type AuthMode = "login" | "register";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: AuthMode;
  isDark: boolean;
};

type RegisterStep = "email" | "otp" | "terms" | "password" | "success";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export default function AuthModal({
  isOpen,
  onClose,
  mode,
  isDark,
}: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("email");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [singleAccount, setSingleAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
    null
  );
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const resetState = useCallback(() => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setOtp("");
    setRegisterStep("email");
    setAcceptedTerms(false);
    setSingleAccount(false);
    setLoading(false);
    setOauthLoading(null);
    setError("");
    setResendCooldown(0);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
      return;
    }
    setRegisterStep("email");
    setError("");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
  }, [isOpen, mode, resetState]);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const muted = isDark ? "text-gray-400" : "text-gray-500";
  const text = isDark ? "text-white" : "text-gray-900";
  const border = isDark ? "border-gray-700" : "border-gray-200";
  const inputBg = isDark
    ? "bg-gray-900/50 text-white placeholder:text-gray-500"
    : "bg-white text-gray-900 placeholder:text-gray-400";
  const btnOutline = isDark
    ? "border-gray-700 text-white hover:bg-gray-800"
    : "border-gray-200 text-gray-800 hover:bg-gray-50";

  async function sendRegisterOtp(targetEmail: string) {
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: { shouldCreateUser: true },
    });
    if (otpError) throw otpError;
    setResendCooldown(RESEND_COOLDOWN);
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Ingresa un email valido");
      return;
    }
    if (!password) {
      setError("Ingresa tu contraseña");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos"
          : signInError.message
      );
      return;
    }

    onClose();
  }

  async function handleRegisterEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Ingresa un email valido");
      return;
    }

    setLoading(true);
    try {
      await sendRegisterOtp(trimmed);
      setRegisterStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el código");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtpCode(code: string) {
    if (code.length !== OTP_LENGTH || loading) return;

    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "email",
    });
    setLoading(false);

    if (verifyError) {
      setError("Código invalido o expirado");
      setOtp("");
      return;
    }

    setRegisterStep("terms");
  }

  async function handleResendOtp() {
    if (resendCooldown > 0 || loading) return;
    setError("");
    setLoading(true);
    try {
      await sendRegisterOtp(email.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reenviar el código");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
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
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setRegisterStep("success");
  }

  async function handleOAuth(provider: "google" | "apple") {
    setError("");
    setOauthLoading(provider);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(null);
    }
  }

  function handleBack() {
    setError("");
    if (registerStep === "otp") {
      setOtp("");
      setRegisterStep("email");
    } else if (registerStep === "terms") {
      setRegisterStep("otp");
    } else if (registerStep === "password") {
      setRegisterStep("terms");
    }
  }

  const showBack =
    mode === "register" &&
    ["otp", "terms", "password"].includes(registerStep);

  const showLogo =
    mode === "login" ||
    registerStep === "email" ||
    registerStep === "success";

  const title =
    mode === "login"
      ? "Iniciar sesión"
      : registerStep === "email"
        ? "Registrar"
        : registerStep === "otp"
          ? "Ingresa el código de confirmación"
          : registerStep === "terms"
            ? "Acepta los términos"
            : registerStep === "password"
              ? "Crea tu contraseña"
              : "¡Éxito!";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`relative w-full max-w-[420px] rounded-3xl shadow-2xl px-8 pt-8 pb-7 border ${
              isDark ? "bg-[#111] border-gray-800" : "bg-white border-gray-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {showBack && (
              <button
                type="button"
                onClick={handleBack}
                className={`absolute top-5 left-5 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  isDark
                    ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                }`}
                aria-label="Volver"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                isDark
                  ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <p
              id="auth-modal-title"
              className={`text-center text-sm mb-6 ${showBack ? "px-8" : ""} ${muted}`}
            >
              {title}
            </p>

            {showLogo && (
              <div className="flex justify-center mb-8">
                <Image
                  src="/solo-logo.png"
                  alt="TCGRD"
                  width={44}
                  height={44}
                  className="h-11 w-11"
                />
              </div>
            )}

            {registerStep === "otp" && mode === "register" && (
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-brand" strokeWidth={1.5} />
                </div>
              </div>
            )}

            {registerStep === "terms" && mode === "register" && (
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center">
                  <Check className="w-7 h-7 text-brand" strokeWidth={2.5} />
                </div>
              </div>
            )}

            {registerStep === "success" && mode === "register" && (
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center">
                  <Check className="w-8 h-8 text-black" strokeWidth={2.5} />
                </div>
              </div>
            )}

            {/* Login */}
            {mode === "login" && (
              <>
                <form onSubmit={handleLoginSubmit} className="space-y-3 mb-4">
                  <div
                    className={`relative flex items-center border rounded-xl overflow-hidden ${border}`}
                  >
                    <Mail
                      className={`w-4 h-4 ml-4 flex-shrink-0 ${muted}`}
                    />
                    <input
                      type="email"
                      autoFocus
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="tu@email.com"
                      className={`flex-1 py-3.5 pl-3 pr-4 text-sm outline-none bg-transparent ${inputBg}`}
                    />
                  </div>
                  <div
                    className={`relative flex items-center border rounded-xl overflow-hidden ${border}`}
                  >
                    <Lock
                      className={`w-4 h-4 ml-4 flex-shrink-0 ${muted}`}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="Contraseña"
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
                  {error && (
                    <p className="text-red-500 text-xs pl-1">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={!email.trim() || !password || loading}
                    className="w-full bg-brand text-black text-sm font-bold py-3.5 rounded-xl hover:bg-[#00c64b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Iniciar sesión"
                    )}
                  </button>
                </form>

                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={!!oauthLoading}
                    onClick={() => handleOAuth("google")}
                    className={`w-full flex items-center justify-center gap-3 py-3.5 border rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${btnOutline}`}
                  >
                    {oauthLoading === "google" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    Google
                  </button>
                  <button
                    type="button"
                    disabled={!!oauthLoading}
                    onClick={() => handleOAuth("apple")}
                    className={`w-full flex items-center justify-center gap-3 py-3.5 border rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${btnOutline}`}
                  >
                    {oauthLoading === "apple" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <AppleIcon />
                    )}
                    Apple
                  </button>
                </div>
              </>
            )}

            {/* Register: email */}
            {mode === "register" && registerStep === "email" && (
              <form onSubmit={handleRegisterEmailSubmit} className="mb-4">
                <div
                  className={`relative flex items-center border rounded-xl overflow-hidden mb-4 ${border}`}
                >
                  <Mail className={`w-4 h-4 ml-4 flex-shrink-0 ${muted}`} />
                  <input
                    type="email"
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="tu@email.com"
                    className={`flex-1 py-3.5 pl-3 pr-4 text-sm outline-none bg-transparent ${inputBg}`}
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-xs pl-1 mb-3">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={!email.trim() || loading}
                  className="w-full bg-brand text-black text-sm font-bold py-3.5 rounded-xl hover:bg-[#00c64b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Continuar"
                  )}
                </button>
              </form>
            )}

            {/* Register: OTP */}
            {mode === "register" && registerStep === "otp" && (
              <div className="space-y-6">
                <p className={`text-sm text-center leading-relaxed ${muted}`}>
                  Revisa{" "}
                  <span className={`font-semibold ${text}`}>{email}</span> para
                  un email de TCGRD e ingresa tu código abajo.
                </p>

                <OtpInput
                  value={otp}
                  onChange={(v) => {
                    setOtp(v);
                    if (error) setError("");
                  }}
                  length={OTP_LENGTH}
                  disabled={loading}
                  isDark={isDark}
                  onComplete={verifyOtpCode}
                />

                {loading && (
                  <div className="flex justify-center">
                    <Loader2 className={`w-5 h-5 animate-spin ${muted}`} />
                  </div>
                )}

                {error && (
                  <p className="text-red-500 text-xs text-center">{error}</p>
                )}

                <p className={`text-sm text-center ${muted}`}>
                  ¿No recibiste el email?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className={`font-semibold underline underline-offset-2 transition-colors ${
                      resendCooldown > 0 || loading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:text-brand"
                    } ${text}`}
                  >
                    {resendCooldown > 0
                      ? `Reenviar en ${resendCooldown}s`
                      : "Reenviar código"}
                  </button>
                </p>
              </div>
            )}

            {/* Register: terms */}
            {mode === "register" && registerStep === "terms" && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <a
                    href="#"
                    className={`w-full flex items-center justify-between px-4 py-3.5 border rounded-xl text-sm font-semibold transition-colors ${btnOutline}`}
                  >
                    Ver Términos
                    <ExternalLink className="w-4 h-4 opacity-50" />
                  </a>
                  <a
                    href="#"
                    className={`w-full flex items-center justify-between px-4 py-3.5 border rounded-xl text-sm font-semibold transition-colors ${btnOutline}`}
                  >
                    Ver Política de Privacidad
                    <ExternalLink className="w-4 h-4 opacity-50" />
                  </a>
                </div>

                <label
                  className={`flex items-start gap-3 cursor-pointer text-sm ${text}`}
                >
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-400 text-brand focus:ring-brand"
                  />
                  <span>
                    He leído y acepto los Términos y la Política de Privacidad.
                  </span>
                </label>

                <label
                  className={`flex items-start gap-3 cursor-pointer text-sm ${text}`}
                >
                  <input
                    type="checkbox"
                    checked={singleAccount}
                    onChange={(e) => setSingleAccount(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-400 text-brand focus:ring-brand"
                  />
                  <span>
                    Acepto tener solo una cuenta en la plataforma.
                  </span>
                </label>

                {error && (
                  <p className="text-red-500 text-xs">{error}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`flex-1 py-3.5 border rounded-xl text-sm font-semibold transition-colors ${btnOutline}`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!acceptedTerms || !singleAccount}
                    onClick={() => {
                      setError("");
                      setRegisterStep("password");
                    }}
                    className="flex-1 py-3.5 bg-brand text-black rounded-xl text-sm font-bold hover:bg-[#00c64b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* Register: password */}
            {mode === "register" && registerStep === "password" && (
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
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
                    placeholder="Contraseña (mín. 8 caracteres)"
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
                  <p className="text-red-500 text-xs pl-1">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={!password || !confirmPassword || loading}
                  className="w-full bg-brand text-black text-sm font-bold py-3.5 rounded-xl hover:bg-[#00c64b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Crear cuenta"
                  )}
                </button>
              </form>
            )}

            {/* Register: success */}
            {mode === "register" && registerStep === "success" && (
              <div className="text-center space-y-6">
                <p className={`text-sm ${muted}`}>
                  Has creado tu cuenta correctamente. Ya iniciaste sesión.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-brand text-black text-sm font-bold py-3.5 rounded-xl hover:bg-[#00c64b] transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}

            {(mode === "login" ||
              (mode === "register" && registerStep === "email")) && (
              <p className={`text-center text-[11px] mt-8 leading-relaxed ${muted}`}>
                Al {mode === "login" ? "iniciar sesión" : "registrarte"} acepto
                los{" "}
                <a
                  href="#"
                  className={`font-semibold hover:text-brand ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Términos
                </a>{" "}
                y la{" "}
                <a
                  href="#"
                  className={`font-semibold hover:text-brand ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Política de Privacidad
                </a>
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

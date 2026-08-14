"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, Info, Loader2, Palette, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { DashboardPageContainer, DashboardPageHeader } from "@/components/dashboard/DashboardPageShell";
import DeleteAccountModal from "./DeleteAccountModal";

type Notifications = {
  marketplace: boolean;
  productUpdates: boolean;
};

type Invite = {
  id: string;
  code: string;
  used_by: string | null;
  used_at: string | null;
};

function XIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-brand" : "bg-gray-700"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#111] border border-gray-800 rounded-2xl p-5 sm:p-6">
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-extrabold tracking-tight text-white mb-4">
      {children}
    </h2>
  );
}

const THEME_COLORS = [
  "#00e559",
  "#00d1ff",
  "#a855f7",
  "#f59e0b",
  "#f43f5e",
];

export default function ProfileSettings({
  userId,
  email,
  initialDisplayName,
  initialPhone,
  initialAvatarUrl,
  initialThemeColor,
  initialNotifications,
  initialInvites,
}: {
  userId: string;
  email: string;
  initialDisplayName: string;
  initialPhone: string | null;
  initialAvatarUrl: string | null;
  initialThemeColor: string;
  initialNotifications: Notifications;
  initialInvites: Invite[];
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [savedToast, setSavedToast] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [mediaError, setMediaError] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [themeColor, setThemeColor] = useState(initialThemeColor);

  const [notifications, setNotifications] =
    useState<Notifications>(initialNotifications);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [notifsSaved, setNotifsSaved] = useState(false);
  const [notifsError, setNotifsError] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const initials = (displayName || email).substring(0, 2).toUpperCase();

  function showSavedToast() {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  }

  async function uploadAvatar(file: File) {
    setMediaError("");
    setUploadingAvatar(true);

    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("profiles").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;

      // Only staged locally — persisted to the database when "Guardar cambios" is clicked.
      setAvatarUrl(url);
    } catch (err) {
      setMediaError(
        err instanceof Error ? err.message : "No se pudo subir la imagen"
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMediaError("El archivo debe ser una imagen");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMediaError("La imagen no puede pesar más de 5MB");
      return;
    }
    uploadAvatar(file);
  }

  function handleSelectColor(hex: string) {
    // Only staged locally — persisted to the database when "Guardar cambios" is clicked.
    setThemeColor(hex);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");

    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      setProfileError("El nombre debe tener al menos 2 caracteres");
      return;
    }

    setSavingProfile(true);
    const body: Record<string, string | null> = {
      display_name: trimmed,
      phone: phone.trim() || null,
      theme_color: themeColor,
    };
    if (avatarUrl) body.avatar_url = avatarUrl;

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSavingProfile(false);

    if (!res.ok) {
      setProfileError(json.error ?? `Error ${res.status}`);
      return;
    }

    showSavedToast();
    router.refresh();
  }

  async function saveNotifications(next: Notifications) {
    setNotifsError("");
    setNotifsSaved(false);
    setSavingNotifs(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        notif_marketplace: next.marketplace,
        notif_product_updates: next.productUpdates,
      },
    });

    setSavingNotifs(false);

    if (error) {
      setNotifsError(error.message);
      return;
    }

    setNotifsSaved(true);
    setTimeout(() => setNotifsSaved(false), 2500);
  }

  function handleUnsubscribeAll() {
    const next = { marketplace: false, productUpdates: false };
    setNotifications(next);
    saveNotifications(next);
  }

  function handleAccountDeleted() {
    const supabase = createClient();
    // Full reload so every bit of cached auth/user state (DashboardShell,
    // notifications polling, etc.) resets — the account no longer exists.
    supabase.auth.signOut().finally(() => {
      window.location.href = "/";
    });
  }

  return (
    <>
    <DashboardShell active="perfil" avatarUrl={avatarUrl} initials={initials} email={email} accentColor={themeColor}>
      <DashboardPageContainer>
        <DashboardPageHeader
          avatarUrl={avatarUrl}
          initials={initials}
          title="Perfil"
          subtitle={email}
        />
        <div className="max-w-2xl space-y-10">
        {/* Perfil */}
        <section>
          <SectionTitle>Perfil</SectionTitle>
          <SectionCard>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />

            <form onSubmit={handleSaveProfile}>
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-8">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="relative w-20 h-20 rounded-full border-4 border-[#111] overflow-hidden group/avatar flex-shrink-0"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 bg-gradient-to-br from-brand/60 via-emerald-500/50 to-cyan-500/50" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-gray-200 group-hover/avatar:bg-black/80 transition-colors">
                      {uploadingAvatar ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </span>
                  </span>
                </button>
                <p className="text-xs text-gray-600">Haz clic para cambiar tu foto de perfil.</p>
              </div>

              {mediaError && (
                <p className="text-red-500 text-xs mb-4">{mediaError}</p>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    disabled
                    className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg py-3 px-4 text-sm text-gray-500 outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-bold text-white mb-2"
                  >
                    Nombre de usuario
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      if (profileError) setProfileError("");
                    }}
                    placeholder="Tu nombre"
                    className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg py-3 px-4 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-700 transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-bold text-white mb-2"
                  >
                    WhatsApp <span className="text-gray-500 font-normal">(para coordinar entregas)</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="8091234567"
                    maxLength={15}
                    className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg py-3 px-4 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-700 transition-all"
                  />
                  <p className="text-xs text-gray-600 mt-1.5">Solo visible para tu contraparte al cerrar un trato.</p>
                </div>
              </div>

              {/* Mi colección — accent color */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <p className="text-sm font-bold text-white mb-2">Mi colección</p>
                <p className="text-sm text-gray-500 mb-4">
                  Elige el color de acento que se usa en el fondo de tu sección Mi colección.
                </p>

                <div
                  className="w-full h-20 rounded-xl mb-5 border border-gray-800"
                  style={{
                    background: `radial-gradient(circle at 25% 35%, ${themeColor}66, transparent 60%), radial-gradient(circle at 75% 65%, ${themeColor}40, transparent 65%), #0a0a0a`,
                  }}
                />

                <div className="flex flex-wrap items-center gap-3">
                  {THEME_COLORS.map((c) => {
                    const isSelected = themeColor.toLowerCase() === c.toLowerCase();
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleSelectColor(c)}
                        aria-label={c}
                        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${
                          isSelected ? "border-white scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {isSelected && <Check className="w-4 h-4 text-black" strokeWidth={3} />}
                      </button>
                    );
                  })}

                  <label className="relative w-9 h-9 rounded-full border-2 border-gray-700 overflow-hidden cursor-pointer flex items-center justify-center bg-[#1a1a1a] hover:border-gray-500 transition-colors">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => handleSelectColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Palette className="w-4 h-4 text-gray-400" />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-800">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-brand text-black text-sm font-bold px-6 py-3 rounded-lg hover:bg-[#00c64b] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {savingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Guardar cambios"
                  )}
                </button>
                {profileError && (
                  <p className="text-red-500 text-xs">{profileError}</p>
                )}
              </div>
            </form>
          </SectionCard>
        </section>

        {/* Cuentas sociales */}
        <section>
          <SectionTitle>Cuentas sociales</SectionTitle>
          <SectionCard>
            <div className="divide-y divide-gray-800">
              <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <DiscordIcon />
                  <span className="text-sm font-bold">Discord</span>
                </div>
                <button
                  type="button"
                  disabled
                  title="Próximamente"
                  className="text-xs font-bold px-4 py-2 rounded-lg border border-gray-700 text-gray-500 cursor-not-allowed"
                >
                  Próximamente
                </button>
              </div>
              <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <XIcon />
                  <span className="text-sm font-bold">X</span>
                </div>
                <button
                  type="button"
                  disabled
                  title="Próximamente"
                  className="text-xs font-bold px-4 py-2 rounded-lg border border-gray-700 text-gray-500 cursor-not-allowed"
                >
                  Próximamente
                </button>
              </div>
            </div>
          </SectionCard>
        </section>

        {/* Balance */}
        <section>
          <SectionTitle>Balance</SectionTitle>
          <SectionCard>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Balance TCGRD</p>
                <p className="text-lg font-mono font-bold text-white">
                  RD$0.00
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled
              title="Próximamente"
              className="w-full py-3 rounded-xl border border-gray-700 text-sm font-bold text-gray-500 cursor-not-allowed"
            >
              Vincular método de pago — Próximamente
            </button>
          </SectionCard>
        </section>

        {/* Referidos */}
        <section>
          <SectionTitle>Referidos</SectionTitle>
          <SectionCard>
            <p className="text-sm text-gray-500 opacity-50">
              Comparte estos códigos con amigos para invitarlos a TCGRD.
            </p>
            <button
              type="button"
              disabled
              title="Próximamente"
              className="w-full mt-4 py-3 rounded-xl border border-gray-700 text-sm font-bold text-gray-500 cursor-not-allowed"
            >
              Referidos — Próximamente
            </button>
          </SectionCard>
        </section>

        {/* Notificaciones */}
        <section>
          <SectionTitle>Notificaciones por email</SectionTitle>
          <SectionCard>
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    Notificaciones del mercado
                  </span>
                  <span title="Te avisamos cuando alguien está interesado en comprar tus cartas">
                    <Info className="w-3.5 h-3.5 text-gray-500" />
                  </span>
                </div>
                <Toggle
                  checked={notifications.marketplace}
                  onChange={(v) =>
                    setNotifications((n) => ({ ...n, marketplace: v }))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    Actualizaciones del producto
                  </span>
                  <span title="Nuevas funciones y mejoras de TCGRD">
                    <Info className="w-3.5 h-3.5 text-gray-500" />
                  </span>
                </div>
                <Toggle
                  checked={notifications.productUpdates}
                  onChange={(v) =>
                    setNotifications((n) => ({ ...n, productUpdates: v }))
                  }
                />
              </div>

              {notifsError && (
                <p className="text-red-500 text-xs">{notifsError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleUnsubscribeAll}
                  disabled={savingNotifs}
                  className="text-xs font-bold px-4 py-2.5 rounded-lg border border-red-900/60 text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-50"
                >
                  Cancelar todas
                </button>
                <button
                  type="button"
                  onClick={() => saveNotifications(notifications)}
                  disabled={savingNotifs}
                  className="bg-brand text-black text-xs font-bold px-5 py-2.5 rounded-lg hover:bg-[#00c64b] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {savingNotifs ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : notifsSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Guardado
                    </>
                  ) : (
                    "Guardar"
                  )}
                </button>
              </div>
            </div>
          </SectionCard>
        </section>

        {/* Zona de peligro */}
        <section>
          <SectionTitle>Zona de peligro</SectionTitle>
          <SectionCard>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-bold text-white">Eliminar cuenta</p>
                <p className="text-xs text-gray-500 mt-1 max-w-md">
                  Borra tu perfil, cartas, ofertas, mensajes y wishlist de
                  forma permanente. Te pedimos un código por email para
                  confirmar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="text-xs font-bold px-4 py-2.5 rounded-lg border border-red-900/60 text-red-400 hover:bg-red-950/40 transition-colors flex-shrink-0"
              >
                Eliminar cuenta
              </button>
            </div>
          </SectionCard>
        </section>
        </div>
      </DashboardPageContainer>
    </DashboardShell>

    <AnimatePresence>
      {savedToast && (
        <motion.div
          key="saved-toast"
          initial={{ y: -64 }}
          animate={{ y: 0 }}
          exit={{ y: -64 }}
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
          className="fixed top-0 inset-x-0 z-[200] bg-brand text-black flex items-center justify-center gap-2.5 py-4 text-sm font-bold shadow-[0_4px_24px_rgba(0,229,89,0.35)]"
        >
          <Check className="w-4 h-4" />
          Perfil actualizado correctamente
        </motion.div>
      )}
    </AnimatePresence>

    <DeleteAccountModal
      open={deleteModalOpen}
      email={email}
      onCancel={() => setDeleteModalOpen(false)}
      onDeleted={handleAccountDeleted}
    />
    </>
  );
}

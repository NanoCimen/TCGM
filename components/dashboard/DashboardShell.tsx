"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Heart, Layers, LogOut, User as UserIcon } from "lucide-react";
import Navbar from "@/components/marketplace/Navbar";
import AmbientGlow from "@/components/marketplace/AmbientGlow";
import SignOutConfirmModal from "@/components/auth/SignOutConfirmModal";
import { createClient } from "@/lib/supabase/client";

export type DashboardNavKey = "mis-cartas" | "actividad" | "wishlist" | "perfil";

const NAV_ITEMS: {
  key: DashboardNavKey;
  label: string;
  href: string;
  icon: typeof Layers;
}[] = [
  { key: "mis-cartas", label: "Mis cartas", href: "/dashboard", icon: Layers },
  { key: "actividad", label: "Actividad", href: "/actividad", icon: Activity },
  { key: "wishlist", label: "Wishlist", href: "/wishlist", icon: Heart },
  { key: "perfil", label: "Perfil", href: "/perfil", icon: UserIcon },
];


export function Avatar({
  avatarUrl,
  initials,
  sizeClass = "w-9 h-9",
  textClass = "text-xs",
}: {
  avatarUrl: string | null;
  initials: string;
  sizeClass?: string;
  textClass?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt="Avatar"
        className={`${sizeClass} rounded-full object-cover border border-white/10`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-brand/60 via-emerald-500/50 to-cyan-500/50 border border-white/10 flex items-center justify-center font-extrabold text-white ${textClass}`}
    >
      {initials}
    </div>
  );
}

export default function DashboardShell({
  active,
  avatarUrl,
  initials,
  email = null,
  accentColor = null,
  loggedIn = true,
  children,
}: {
  active: DashboardNavKey | null;
  avatarUrl: string | null;
  initials: string;
  email?: string | null;
  accentColor?: string | null;
  // Every route rendering this shell requires auth except /dashboard,
  // which stays viewable (empty) for guests — see app/dashboard/page.tsx.
  loggedIn?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("tcgrd-theme");
    if (saved === "light") setIsDark(false);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("tcgrd-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("tcgrd-theme", "light");
    }
  }, [isDark]);

  async function confirmSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen text-white selection:bg-brand/20">
      <AmbientGlow color={accentColor ?? "#00e559"} />
      <Navbar
        isDark={isDark}
        toggleDark={() => setIsDark(!isDark)}
        search={search}
        onSearchChange={setSearch}
        loggedIn={loggedIn}
        email={email}
        avatarUrl={avatarUrl}
        onAuthSelect={(mode) => router.push(`/?auth=${mode}`)}
        showThemeToggle={false}
        showSearch={false}
        showSell={false}
        tightNav
        sticky
      />

      <div className="flex">
        <aside className="hidden md:flex flex-col w-56 lg:w-60 flex-shrink-0 border-r border-white/5 bg-[#0a0a0a] fixed top-20 bottom-0 left-0 z-40 py-6 px-3">
          <nav className="space-y-1 flex-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === active;
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-colors ${
                    isActive
                      ? "bg-white/5 text-white"
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold tracking-tight text-gray-600 hover:text-red-400 hover:bg-red-950/20 transition-colors w-full mt-auto flex-shrink-0"
          >
            <LogOut className="w-[18px] h-[18px]" strokeWidth={1.8} />
            Cerrar sesión
          </button>
        </aside>

        <main className="flex-1 px-4 sm:px-8 lg:px-12 py-10 min-w-0 md:ml-56 lg:ml-60">
          {/* The sidebar (Mis cartas/Actividad/Wishlist/Perfil) is
              hidden md:flex — without this, mobile visitors had no way to
              get from one of these pages to another at all. */}
          <nav className="md:hidden mb-6 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === active;
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`inline-flex flex-shrink-0 items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-tight border transition-colors ${
                    isActive
                      ? "bg-brand text-black border-brand"
                      : "border-white/10 bg-white/[0.03] text-gray-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      <SignOutConfirmModal
        open={confirmOpen}
        loading={signingOut}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmSignOut}
      />
    </div>
  );
}

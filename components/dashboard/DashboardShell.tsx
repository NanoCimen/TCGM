"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Heart,
  Home,
  Layers,
  User as UserIcon,
} from "lucide-react";
import NotificationsBell from "@/components/notifications/NotificationsBell";

export type DashboardNavKey =
  | "inicio"
  | "mis-cartas"
  | "actividad"
  | "wishlist"
  | "perfil";

const NAV_ITEMS: {
  key: DashboardNavKey;
  label: string;
  href: string;
  icon: typeof Home;
}[] = [
  { key: "inicio", label: "Inicio", href: "/", icon: Home },
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
  children,
}: {
  active: DashboardNavKey | null;
  avatarUrl: string | null;
  initials: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-brand/20">
      <header className="sticky top-0 z-50 bg-black border-b border-white/5 h-16">
        <div className="px-4 sm:px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/solo-logo.png"
              alt="TCGRD"
              width={32}
              height={32}
              className="h-8 w-8"
            />
          </Link>

          <div className="flex items-center gap-2">
            <NotificationsBell />
            <Link href="/perfil" aria-label="Perfil">
              <Avatar avatarUrl={avatarUrl} initials={initials} />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden md:flex flex-col w-56 lg:w-60 flex-shrink-0 border-r border-white/5 bg-[#0a0a0a] min-h-[calc(100vh-4rem)] sticky top-16 self-start py-6 px-3">
          <nav className="space-y-1">
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
        </aside>

        <main className="flex-1 px-4 sm:px-8 lg:px-12 py-10 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

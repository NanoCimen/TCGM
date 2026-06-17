"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Command, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { User } from "@supabase/supabase-js";
import AuthModal, { type AuthMode } from "@/components/auth/AuthModal";
import AuthMenu from "@/components/auth/AuthMenu";
import NotificationsBell from "@/components/notifications/NotificationsBell";
import { createClient } from "@/lib/supabase/client";
import CardThumbnail from "./CardThumbnail";
import type {
  MarketplaceCard,
  MarketplaceStats,
} from "@/lib/marketplace/types";
import {
  formatPrice,
  formatVolume,
  statusLabel,
} from "@/lib/marketplace/utils";
import {
  LANGUAGE_FLAG,
  VARIANT_BADGE_STYLES,
} from "@/lib/cards/constants";

const COLLECTION_IMAGES = {
  pokemon: "/images/pokemon-tcg.png",
  magic: "/images/magic-the-gathering-tcg.png",
  onepiece: "/images/one-piece-tcg.png",
  yugioh: "/images/yu-gi-oh-tcg.png",
} as const;

function Navbar({
  isDark,
  toggleDark,
  search,
  onSearchChange,
  user,
  onAuthSelect,
}: {
  isDark: boolean;
  toggleDark: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  user: User | null;
  onAuthSelect: (mode: AuthMode) => void;
}) {
  return (
    <nav className="sticky top-0 z-50 bg-white/40 dark:bg-[#0a0a0a]/40 backdrop-blur-2xl backdrop-saturate-[1.8] border-b border-gray-200/30 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] h-20 transition-colors">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-full flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center group">
            <Image
              src="/solo-logo.png"
              alt="TCGRD"
              width={36}
              height={36}
              className="h-9 w-9 group-hover:scale-105 transition-transform"
            />
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-900 dark:text-white font-bold text-sm tracking-tight border-b-2 border-brand py-[30px]"
            >
              Mercado
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold text-sm tracking-tight py-[30px] border-b-2 border-transparent transition-colors"
            >
              Mis cartas
            </Link>
            <Link
              href="/actividad"
              className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold text-sm tracking-tight py-[30px] border-b-2 border-transparent transition-colors"
            >
              Actividad
            </Link>
            <Link
              href="/wishlist"
              className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold text-sm tracking-tight py-[30px] border-b-2 border-transparent transition-colors"
            >
              Wishlist
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleDark}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="relative hidden lg:flex items-center w-72">
            <Search className="absolute left-3 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar cartas y vendedores"
              className="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg py-2 pl-10 pr-12 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-brand focus:bg-white dark:focus:bg-[#111] transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-white"
            />
            <div className="absolute right-2 flex items-center bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 shadow-sm">
              <Command className="w-3 h-3 text-gray-400 dark:text-gray-500" />
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono font-bold ml-0.5 mt-[1px]">
                K
              </span>
            </div>
          </div>
          {user && <NotificationsBell />}
          {user && (
            <Link
              href="/sell"
              className="bg-brand text-black text-sm font-bold tracking-tight px-5 sm:px-6 py-2.5 rounded-lg hover:bg-[#00c64b] transition-all shadow-[0_4px_14px_0_rgba(0,229,89,0.25)] hover:shadow-[0_6px_20px_rgba(0,229,89,0.4)] hover:-translate-y-0.5 whitespace-nowrap"
            >
              + Vender
            </Link>
          )}
          <AuthMenu
            isDark={isDark}
            user={user}
            onSelectLogin={() => onAuthSelect("login")}
            onSelectRegister={() => onAuthSelect("register")}
          />
        </div>
      </div>
    </nav>
  );
}

function CollectionsSection({ stats }: { stats: MarketplaceStats }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const collections = [
    {
      id: "pokemon",
      name: "Pokémon",
      publisher: "BY THE POKÉMON COMPANY",
      status: "En vivo",
      floorPrice: formatPrice(stats.floorPrice),
      volume: stats.soldVolume > 0 ? formatPrice(stats.soldVolume) : formatVolume(stats.listingCount) + " listados",
      bg: "from-blue-900 via-gray-900 to-black",
      img: COLLECTION_IMAGES.pokemon,
      cardImg: COLLECTION_IMAGES.pokemon,
      accent: "text-blue-400",
    },
    {
      id: "magic",
      name: "Magic: Earth",
      publisher: "BY WIZARDS OF THE COAST",
      status: "Próximamente",
      floorPrice: "—",
      volume: "—",
      bg: "from-amber-900 via-gray-900 to-black",
      img: COLLECTION_IMAGES.magic,
      cardImg: COLLECTION_IMAGES.magic,
      accent: "text-amber-500",
    },
    {
      id: "onepiece",
      name: "One Piece",
      publisher: "BY BANDAI NAMCO",
      status: "Próximamente",
      floorPrice: "—",
      volume: "—",
      bg: "from-cyan-900 via-gray-900 to-black",
      img: COLLECTION_IMAGES.onepiece,
      cardImg: COLLECTION_IMAGES.onepiece,
      accent: "text-cyan-400",
    },
    {
      id: "yugioh",
      name: "Yu-Gi-Oh!",
      publisher: "BY KONAMI",
      status: "Próximamente",
      floorPrice: "—",
      volume: "—",
      bg: "from-purple-900 via-gray-900 to-black",
      img: COLLECTION_IMAGES.yugioh,
      cardImg: COLLECTION_IMAGES.yugioh,
      accent: "text-purple-400",
    },
  ];

  const activeCol = collections[activeIndex];

  return (
    <section className="mb-24">
      <div className="relative w-full h-[400px] sm:h-[450px] lg:h-[500px] rounded-[20px] overflow-hidden mb-6 bg-[#0a0a0a] shadow-xl border border-gray-200 dark:border-gray-800">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCol.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-[#0a0a0a]" />
            <div
              className="absolute inset-y-0 right-0 w-full md:w-2/3 bg-contain bg-right bg-no-repeat opacity-90"
              style={{ backgroundImage: `url(${activeCol.img})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/20" />

            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
              <div className="max-w-3xl relative z-10">
                <h1 className="text-5xl md:text-6xl lg:text-[5rem] font-black text-white tracking-tighter mb-2 leading-none drop-shadow-lg">
                  {activeCol.name}
                </h1>
                <p
                  className={`text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-10 ${activeCol.accent} drop-shadow-md`}
                >
                  {activeCol.publisher}
                </p>

                <div className="flex flex-wrap border-t border-white/10 pt-6 items-center gap-8 md:gap-14 mb-8">
                  <div>
                    <p className="text-[10px] md:text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Volumen de mercado
                    </p>
                    <p className="text-xl md:text-[28px] font-mono font-bold text-white leading-none">
                      {activeCol.floorPrice}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Listados
                    </p>
                    <p className="text-xl md:text-[28px] font-mono font-bold text-white leading-none">
                      {activeCol.volume}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[10px] md:text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Status
                    </p>
                    <span className="inline-flex items-center justify-center text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-[4px] border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-sm mt-0.5">
                      {activeCol.status}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white text-sm font-bold tracking-tight px-6 py-3.5 rounded-lg transition-all flex items-center gap-2 group active:scale-[0.98]"
                >
                  VER COLECCIÓN
                  <svg
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {collections.map((c, i) => {
          const isActive = activeIndex === i;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative h-28 lg:h-36 rounded-xl border overflow-hidden cursor-pointer transition-all duration-300 text-left
                ${
                  isActive
                    ? "border-brand ring-2 ring-brand ring-offset-2 ring-offset-white dark:ring-offset-[#0a0a0a] scale-[1.02] shadow-[0_0_20px_rgba(0,229,89,0.15)] z-10"
                    : "border-gray-200 dark:border-gray-800 opacity-60 hover:opacity-100 hover:scale-[1.01] hover:border-gray-300 dark:hover:border-gray-600 z-0"
                }`}
            >
              <div className="absolute inset-0 bg-[#0a0a0a]">
                <div
                  className="absolute inset-2 bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${c.cardImg})` }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

              <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white flex items-center justify-center p-0.5 shadow-md">
                <div
                  className={`w-full h-full rounded-full bg-gradient-to-br ${c.bg} border border-black/10`}
                />
              </div>

              <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                <h3 className="font-bold text-white text-base tracking-tight">
                  {c.name}
                </h3>
                {c.status !== "En vivo" && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 bg-white/10 border border-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
                    Pronto
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    {
      Disponible:
        "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
      Reservada:
        "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
      Vendida:
        "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    }[status] ||
    "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";

  return (
    <span
      className={`inline-flex items-center justify-center text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-[4px] border ${styles}`}
    >
      {status}
    </span>
  );
}

function TrendingSection({
  cards,
  onCardClick,
  user,
}: {
  cards: MarketplaceCard[];
  onCardClick: () => void;
  user: User | null;
}) {
  const [tab, setTab] = useState<"top" | "recent">("recent");

  const sorted = useMemo(() => {
    const list = [...cards];
    if (tab === "top") {
      return list.sort(
        (a, b) => (b.price_usd ?? 0) - (a.price_usd ?? 0)
      );
    }
    return list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [cards, tab]);

  if (!cards.length) {
    return (
      <section className="mb-24">
        <h2 className="text-2xl font-extrabold tracking-tighter text-gray-900 dark:text-white mb-8">
          Tendencia
        </h2>
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Aun no hay cartas publicadas en el mercado.
          </p>
          {user ? (
            <Link
              href="/sell"
              className="inline-block bg-brand text-black text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-[#00c64b] transition-colors"
            >
              Sé el primero en vender
            </Link>
          ) : (
            <button
              type="button"
              onClick={onCardClick}
              className="inline-block bg-brand text-black text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-[#00c64b] transition-colors"
            >
              Sé el primero en vender
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-24">
      <div className="flex items-center gap-6 mb-8">
        <h2 className="text-2xl font-extrabold tracking-tighter text-gray-900 dark:text-white">
          Tendencia
        </h2>
        <div className="flex items-center gap-5 text-sm font-bold tracking-tight">
          <button
            type="button"
            onClick={() => setTab("top")}
            className={`pb-1.5 px-1 border-b-2 transition-colors ${
              tab === "top"
                ? "text-gray-900 dark:text-white border-brand"
                : "text-gray-400 dark:text-gray-500 border-transparent hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Top
          </button>
          <button
            type="button"
            onClick={() => setTab("recent")}
            className={`pb-1.5 px-1 border-b-2 transition-colors ${
              tab === "recent"
                ? "text-gray-900 dark:text-white border-brand"
                : "text-gray-400 dark:text-gray-500 border-transparent hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Recientes
          </button>
        </div>
      </div>

      <div className="hidden md:block w-full">
        <div className="grid grid-cols-[3rem_minmax(280px,1fr)_120px_120px_120px_180px] gap-4 px-4 pb-4 border-b border-gray-200 dark:border-gray-800/60 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          <div className="text-center">#</div>
          <div>Carta</div>
          <div className="text-right">Precio</div>
          <div className="text-right">Colección</div>
          <div className="text-center">Estado</div>
          <div className="text-right pr-4">Vendedor</div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
          {sorted.map((item, index) => {
            const label = statusLabel(item.status);
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={onCardClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCardClick();
                  }
                }}
                className="grid grid-cols-[3rem_minmax(280px,1fr)_120px_120px_120px_180px] gap-4 px-4 py-3 items-center hover:bg-gray-50/80 dark:hover:bg-[#111]/80 hover:shadow-[0_1px_3px_rgb(0,0,0,0.02)] group transition-all cursor-pointer rounded-lg dark:hover:shadow-[0_1px_3px_rgb(0,0,0,0.2)]"
              >
                <div className="text-center font-mono text-xs text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {index + 1}
                </div>
                <div className="flex items-center gap-4">
                  <CardThumbnail
                    src={item.image_url}
                    alt={item.card_name}
                    className="w-10 h-14 rounded-[4px] border border-gray-200 dark:border-gray-800 shadow-sm flex-shrink-0"
                  />
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-brand transition-colors tracking-tight">
                      {item.card_name}
                    </p>
                    <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.set_name ?? "—"}
                      {item.card_number ? ` · ${item.card_number}` : ""}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {item.variant && item.variant !== "Regular" && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            VARIANT_BADGE_STYLES[item.variant] ??
                            "bg-gray-800 text-gray-400 border-gray-700"
                          }`}
                        >
                          {item.variant}
                        </span>
                      )}
                      <span className="text-[9px] font-bold text-gray-500 dark:text-gray-500">
                        {LANGUAGE_FLAG[item.language] ?? "🌐"} {item.language}
                      </span>
                      {item.is_graded && item.grade_company && item.grade && (
                        <span className="text-[9px] font-bold bg-yellow-400 text-black px-1.5 py-0.5 rounded">
                          {item.grade_company} {item.grade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center justify-end">
                  <span
                    className={`font-mono text-sm font-medium ${label === "Vendida" ? "line-through text-gray-400 dark:text-gray-600" : "text-gray-900 dark:text-white"}`}
                  >
                    {formatPrice(item.price_usd)}
                  </span>
                </div>
                <div className="text-right flex items-center justify-end">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Pokémon
                  </span>
                </div>
                <div className="flex justify-center items-center">
                  <StatusBadge status={label} />
                </div>
                <div className="flex items-center justify-end pr-2">
                  <span className="font-mono text-[11px] font-medium text-gray-700 dark:text-gray-300">
                    {item.seller_name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {sorted.map((item, index) => {
          const label = statusLabel(item.status);
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={onCardClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onCardClick();
                }
              }}
              className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99] cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900" />

              <div className="relative flex-shrink-0">
                <CardThumbnail
                  src={item.image_url}
                  alt={item.card_name}
                  className="w-16 h-24 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                />
                <span className="absolute -top-2 -left-2 w-6 h-6 bg-gray-900 dark:bg-gray-800 text-white rounded-md flex items-center justify-center text-xs font-mono font-bold shadow-md border border-gray-800 dark:border-gray-700">
                  {index + 1}
                </span>
              </div>

              <div className="flex flex-col justify-between flex-1 py-1">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-[15px] tracking-tight text-gray-900 dark:text-white leading-tight pr-4">
                      {item.card_name}
                    </h3>
                    <p
                      className={`font-mono text-sm font-medium ${label === "Vendida" ? "line-through text-gray-400 dark:text-gray-600" : "text-gray-900 dark:text-white"}`}
                    >
                      {formatPrice(item.price_usd)}
                    </p>
                  </div>
                  <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                    {item.set_name ?? "—"}
                    {item.card_number ? ` · ${item.card_number}` : ""}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {item.variant && item.variant !== "Regular" && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          VARIANT_BADGE_STYLES[item.variant] ??
                          "bg-gray-800 text-gray-400 border-gray-700"
                        }`}
                      >
                        {item.variant}
                      </span>
                    )}
                    <span className="text-[9px] font-bold text-gray-500 dark:text-gray-500">
                      {LANGUAGE_FLAG[item.language] ?? "🌐"} {item.language}
                    </span>
                    {item.is_graded && item.grade_company && item.grade && (
                      <span className="text-[9px] font-bold bg-yellow-400 text-black px-1.5 py-0.5 rounded">
                        {item.grade_company} {item.grade}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <StatusBadge status={label} />
                  <span className="text-[11px] font-mono text-gray-600 dark:text-gray-400">
                    {item.seller_name}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Footer() {
  const links = [
    { label: "Explorar", href: "/" },
    { label: "Soporte", href: "/soporte" },
    { label: "Términos de Servicio", href: "/terminos" },
    { label: "Privacidad", href: "/privacidad" },
  ];

  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0a0a0a] mt-auto py-6 transition-colors">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/solo-logo.png"
              alt="TCGRD"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span className="text-gray-400 dark:text-gray-500 text-xs ml-1 hidden sm:inline">
              © 2026
            </span>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {links.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.label}
                  href={link.href}
                  className="hover:text-brand transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="hover:text-brand transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default function MarketplacePage({
  cards,
  stats,
}: {
  cards: MarketplaceCard[];
  stats: MarketplaceStats;
}) {
  const [isDark, setIsDark] = useState(true);
  const [search, setSearch] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    const supabase = createClient();

    // Validate the session server-side; clear stale local sessions
    // (e.g. when the user was deleted from Supabase).
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        supabase.auth.signOut();
        setUser(null);
      } else {
        setUser(data.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      setUser(session?.user ?? null);
      if (session?.user) setAuthModalOpen(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const openAuth = useCallback((mode: AuthMode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  }, []);

  const handleCardClick = useCallback(() => {
    if (user) return;
    openAuth("login");
  }, [user, openAuth]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (c) =>
        c.card_name.toLowerCase().includes(q) ||
        c.set_name?.toLowerCase().includes(q) ||
        c.seller_name.toLowerCase().includes(q)
    );
  }, [cards, search]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-brand/20">
      <Navbar
        isDark={isDark}
        toggleDark={() => setIsDark(!isDark)}
        search={search}
        onSearchChange={setSearch}
        user={user}
        onAuthSelect={openAuth}
      />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 lg:px-10 mt-12">
        <CollectionsSection stats={stats} />
        <TrendingSection
          cards={filteredCards}
          onCardClick={handleCardClick}
          user={user}
        />
      </main>
      <Footer />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        isDark={isDark}
      />
    </div>
  );
}

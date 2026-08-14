"use client";

import { useMemo, useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, X, Tag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { User } from "@supabase/supabase-js";
import AuthModal, { type AuthMode } from "@/components/auth/AuthModal";
import { createClient } from "@/lib/supabase/client";
import CardThumbnail from "./CardThumbnail";
import Navbar from "./Navbar";
import AmbientGlow from "./AmbientGlow";
import type {
  MarketplaceStats,
  TrendingCard,
} from "@/lib/marketplace/types";
import {
  formatPrice,
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

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function CollectionsSection({ stats }: { stats: MarketplaceStats }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  const collections = [
    {
      id: "pokemon",
      name: "Pokémon",
      publisher: "BY THE POKÉMON COMPANY",
      status: "En vivo",
      volume: stats.soldVolume > 0 ? formatPrice(stats.soldVolume) : "—",
      listedValue: stats.listingValue > 0 ? formatPrice(stats.listingValue) : "—",
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
      volume: "—",
      listedValue: "—",
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
      volume: "—",
      listedValue: "—",
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
      volume: "—",
      listedValue: "—",
      bg: "from-purple-900 via-gray-900 to-black",
      img: COLLECTION_IMAGES.yugioh,
      cardImg: COLLECTION_IMAGES.yugioh,
      accent: "text-purple-400",
    },
  ];

  const activeCol = collections[activeIndex];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeInUp}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mb-28"
    >
      <div className="relative">
        <div className="absolute -inset-6 rounded-[36px] bg-brand/10 blur-3xl opacity-60 -z-10" />
        <div className="relative w-full h-[420px] sm:h-[470px] lg:h-[520px] rounded-[28px] overflow-hidden bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/10" />

              <div className="absolute inset-0 p-4 sm:p-8 md:p-10 flex flex-col justify-end">
                <div className="max-w-2xl relative z-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 md:p-9 shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-2 leading-[0.95] drop-shadow-lg">
                    {activeCol.name}
                  </h1>
                  <p
                    className={`text-xs md:text-sm font-semibold tracking-[0.2em] uppercase mb-8 ${activeCol.accent} drop-shadow-md`}
                  >
                    {activeCol.publisher}
                  </p>

                  <div className="h-px w-full bg-gradient-to-r from-white/0 via-white/15 to-white/0 mb-6" />

                  <div className="flex flex-wrap items-center gap-8 md:gap-12 mb-8">
                    <div>
                      <p className="text-[10px] md:text-xs font-mono font-semibold text-gray-400 uppercase tracking-widest mb-1">
                        Volumen de mercado
                      </p>
                      <p className="text-xl md:text-[26px] font-mono font-bold text-white leading-none">
                        {activeCol.volume}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] md:text-xs font-mono font-semibold text-gray-400 uppercase tracking-widest mb-1">
                        Valor listado
                      </p>
                      <p className="text-xl md:text-[26px] font-mono font-bold text-white leading-none">
                        {activeCol.listedValue}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-[10px] md:text-xs font-mono font-semibold text-gray-400 uppercase tracking-widest mb-1">
                        Status
                      </p>
                      <span className="inline-flex items-center justify-center text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm mt-0.5">
                        {activeCol.status}
                      </span>
                    </div>
                  </div>

                  {activeCol.status === "En vivo" ? (
                    <Link
                      href={`/collection/${activeCol.id}`}
                      className="inline-flex w-fit bg-brand/90 hover:bg-brand border border-brand/40 text-black text-sm font-bold tracking-tight px-5 py-3 rounded-xl transition-all items-center gap-2 group active:scale-[0.98] shadow-[0_4px_20px_rgba(0,229,89,0.25)] hover:shadow-[0_6px_28px_rgba(0,229,89,0.4)]"
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
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setComingSoonOpen(true)}
                      className="inline-flex w-fit bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white text-sm font-bold tracking-tight px-5 py-3 rounded-xl transition-all items-center gap-2 group active:scale-[0.98]"
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
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <motion.div variants={staggerContainer} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {collections.map((c, i) => {
          const isActive = activeIndex === i;
          return (
            <motion.button
              key={c.id}
              variants={fadeInUp}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative h-28 lg:h-36 rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 text-left backdrop-blur-sm
                ${
                  isActive
                    ? "border-brand/60 ring-1 ring-brand/50 scale-[1.02] shadow-[0_0_28px_rgba(0,229,89,0.2)] z-10"
                    : "border-white/10 opacity-60 hover:opacity-100 hover:scale-[1.01] hover:border-white/25 z-0"
                }`}
            >
              <div className="absolute inset-0 bg-[#0a0a0a]">
                <div
                  className="absolute inset-2 bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${c.cardImg})` }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

              <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center p-0.5 shadow-md">
                <div
                  className={`w-full h-full rounded-full bg-gradient-to-br ${c.bg} border border-black/10`}
                />
              </div>

              <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                <h3 className="font-semibold text-white text-base tracking-tight">
                  {c.name}
                </h3>
                {c.status !== "En vivo" && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 bg-white/10 border border-white/20 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                    Pronto
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {comingSoonOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Cerrar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setComingSoonOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="coming-soon-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl p-6 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setComingSoonOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Clock className="h-5 w-5" strokeWidth={2} />
              </div>

              <h2
                id="coming-soon-title"
                className="text-lg font-black tracking-tight text-white"
              >
                Próximamente
              </h2>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                Esta colección todavía no está disponible. Estamos trabajando
                para traerla pronto al mercado.
              </p>

              <button
                type="button"
                onClick={() => setComingSoonOpen(false)}
                className="mt-6 w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-[#00c64b]"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// No real aggregate counts wired up yet — these templates only fix the
// shape/width of each stat (digit count, "RD$"/"K" formatting). The digits
// themselves are never shown: GlitchStat keeps them permanently scrambled
// so nothing here reads as a real number.
const MISSION_STATS = [
  { label: "Cartas Listadas", template: "1,240" },
  { label: "Volumen Total", template: "RD$482K" },
  { label: "Vendedores Activos", template: "312" },
  { label: "Usuarios Totales", template: "5,890" },
];

function scrambleDigits(digits: string): string {
  return digits.replace(/[0-9]/g, () => String(Math.floor(Math.random() * 10)));
}

function GlitchDigits({ digits }: { digits: string }) {
  const [text, setText] = useState(() => scrambleDigits(digits));

  useEffect(() => {
    const id = window.setInterval(() => setText(scrambleDigits(digits)), 90);
    return () => window.clearInterval(id);
  }, [digits]);

  return (
    <span className="stat-glitch tabular-nums" data-text={text} aria-hidden="true">
      {text}
    </span>
  );
}

// Splits "RD$482K" into ["RD$", "482", "K"] — only the digit runs get the
// glitch treatment; the surrounding letters/symbols stay plain (inheriting
// the stat's normal text color) instead of being tinted by the RGB split.
function GlitchStat({ template }: { template: string }) {
  const parts = template.split(/(\d+)/).filter(Boolean);

  return (
    <span className="relative inline-flex">
      {parts.map((part, i) =>
        /^\d+$/.test(part) ? (
          <GlitchDigits key={i} digits={part} />
        ) : (
          <span key={i} aria-hidden="true">
            {part}
          </span>
        )
      )}
      <span className="sr-only">Datos disponibles próximamente</span>
    </span>
  );
}

function MissionSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeInUp}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative mb-28"
    >
      <div className="hidden lg:block absolute -left-[350px] top-1/4 -translate-y-1/2 w-[300px] pointer-events-none z-0">
        <Image
          src="/images/cards.png"
          alt=""
          width={260}
          height={260}
          className="w-full h-auto object-contain opacity-90"
        />  </div>
        <div className="hidden lg:block absolute -right-[350px] top-1/4 -translate-y-1/2 w-[300px] pointer-events-none z-0">
        <Image
          src="/images/planet.png"
            alt=""
            width={260}
            height={260}
            className="w-full h-auto object-contain opacity-90 scale-x-[-1]"
          />
      </div>

      <div className="text-center relative z-10">
        <h2 className="mx-auto max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[1.05] text-gray-900 dark:text-white [text-shadow:0_0_30px_rgba(0,229,89,0.2)] dark:[text-shadow:0_0_60px_rgba(0,229,89,0.45)]">
          La forma más sencilla de comprar y vender cartas
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-sm sm:text-base text-gray-500 dark:text-gray-400">
          Sube tus cartas, compra, vende y conecta con otros coleccionistas de
          toda República Dominicana — rápido y seguro.
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10"
      >
        {MISSION_STATS.map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeInUp}
            className="rounded-2xl border border-white/15 dark:border-white/10 bg-white/30 dark:bg-white/[0.03] backdrop-blur-xl px-6 py-8"
          >
            <p className="font-mono text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              <GlitchStat template={stat.template} />
            </p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
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

function OffersCount({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-brand">
      <Tag className="w-3.5 h-3.5" />
      {count}
    </span>
  );
}

function TrendingSection({
  cards,
  onCardClick,
  user,
}: {
  cards: TrendingCard[];
  onCardClick: (id: string) => void;
  user: User | null;
}) {
  if (!cards.length) {
    return (
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mb-28"
      >
        <h2 className="neon-heading text-2xl mb-8">
          Tendencia
        </h2>
        <div className="rounded-3xl border border-white/15 dark:border-white/10 bg-white/30 dark:bg-white/[0.03] backdrop-blur-xl p-12 text-center">
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
              onClick={() => onCardClick("")}
              className="inline-block bg-brand text-black text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-[#00c64b] transition-colors"
            >
              Sé el primero en vender
            </button>
          )}
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      id="tendencia"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={fadeInUp}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mb-28"
    >
      <div className="mb-10">
        <h2 className="neon-heading text-4xl sm:text-5xl">
          Tendencia
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 sm:whitespace-nowrap">
          Las cartas con más actividad de la comunidad ahora mismo
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        className="hidden md:block w-full overflow-hidden rounded-[1.75rem] border border-black/10 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.015] backdrop-blur-2xl"
      >
        <div className="grid grid-cols-[3rem_minmax(280px,1fr)_120px_130px_120px_160px] gap-4 px-6 pt-6 pb-4 border-b border-black/5 dark:border-white/[0.05] text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 font-mono">
          <div className="text-center">#</div>
          <div>Carta</div>
          <div className="text-right">Precio</div>
          <div className="text-right">Ofertas</div>
          <div className="text-center">Estado</div>
          <div className="text-right pr-2">Vendedor</div>
        </div>

        <div className="divide-y divide-black/[0.04] dark:divide-white/[0.03]">
          {cards.map((item, index) => {
            const label = statusLabel(item.status);
            return (
              <motion.div
                key={item.id}
                variants={fadeInUp}
                role="button"
                tabIndex={0}
                onClick={() => onCardClick(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCardClick(item.id);
                  }
                }}
                className="grid grid-cols-[3rem_minmax(280px,1fr)_120px_130px_120px_160px] gap-4 px-6 py-4 items-center hover:bg-black/[0.02] dark:hover:bg-white/[0.03] group transition-colors cursor-pointer"
              >
                <div className="text-center font-mono text-xs text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {index + 1}
                </div>
                <div className="flex items-center gap-4">
                  <CardThumbnail
                    src={item.image_url}
                    alt={item.card_name}
                    className="w-10 h-14 rounded-[4px] border border-white/20 dark:border-white/10 shadow-sm flex-shrink-0"
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
                <div className="flex items-center justify-end">
                  <OffersCount count={item.offersCount} />
                </div>
                <div className="flex justify-center items-center">
                  <StatusBadge status={label} />
                </div>
                <div className="flex items-center justify-end pr-2">
                  <span className="font-mono text-[11px] font-medium text-gray-700 dark:text-gray-300">
                    {item.seller_name}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={staggerContainer} className="md:hidden space-y-4">
        {cards.map((item, index) => {
          const label = statusLabel(item.status);
          return (
            <motion.div
              key={item.id}
              variants={fadeInUp}
              role="button"
              tabIndex={0}
              onClick={() => onCardClick(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onCardClick(item.id);
                }
              }}
              className="bg-white/40 dark:bg-white/[0.03] border border-white/20 dark:border-white/10 backdrop-blur-xl rounded-2xl p-4 flex gap-4 hover:bg-white/60 dark:hover:bg-white/[0.06] hover:shadow-[0_0_24px_rgba(0,229,89,0.1)] transition-all active:scale-[0.99] cursor-pointer relative overflow-hidden"
            >
              <div className="relative flex-shrink-0">
                <CardThumbnail
                  src={item.image_url}
                  alt={item.card_name}
                  className="w-16 h-24 rounded-lg shadow-sm border border-white/20 dark:border-white/10"
                />
                <span className="absolute -top-2 -left-2 w-6 h-6 bg-gray-900/90 dark:bg-white/10 backdrop-blur-sm text-white rounded-md flex items-center justify-center text-xs font-mono font-bold border border-white/10">
                  {index + 1}
                </span>
              </div>

              <div className="flex flex-col justify-between flex-1 py-1">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-[15px] tracking-tight text-gray-900 dark:text-white leading-tight pr-4">
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
                  <div className="flex items-center gap-3">
                    <OffersCount count={item.offersCount} />
                    <span className="text-[11px] font-mono text-gray-600 dark:text-gray-400">
                      {item.seller_name}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
}

function UploadSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeInUp}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mb-28 grid lg:grid-cols-2 gap-12 items-center"
    >
      <div>
        <h2 className="neon-heading uppercase text-xl sm:text-2xl lg:text-3xl">
          Sube tus cartas para vender
        </h2>
        <p className="mt-6 max-w-md text-sm sm:text-base text-gray-500 dark:text-gray-400">
          Sube fotos de tus cartas, ponle el precio que quieras y publícalas
          en el mercado en cuestión de minutos. Sin comisiones escondidas ni
          procesos complicados.
        </p>
        <Link
          href="/sell"
          className="inline-block mt-8 bg-brand text-black font-bold px-6 py-3 rounded-xl hover:bg-[#00c64b] transition-all shadow-[0_4px_14px_0_rgba(0,229,89,0.25)] hover:shadow-[0_6px_20px_rgba(0,229,89,0.4)] hover:-translate-y-0.5"
        >
          Subir carta
        </Link>
      </div>

      <div className="rounded-2xl border border-white/15 dark:border-white/10 w-full aspect-video overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover scale-130"
        >
          <source src="/videos/0812.mp4" type="video/mp4" />
        </video>
      </div>
    </motion.section>
  );
}

function BuySection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeInUp}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mb-28 grid lg:grid-cols-2 gap-12 items-center"
    >
      <div className="lg:order-1 rounded-3xl border border-black/10 dark:border-white/[0.06] w-full aspect-video overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/videos/mercado.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="lg:order-2">
        <h2 className="neon-heading uppercase text-xl sm:text-2xl lg:text-3xl">
          Compra las cartas que te interesan
        </h2>
        <p className="mt-6 max-w-md text-sm sm:text-base text-gray-500 dark:text-gray-400">
          Encuentra la carta específica que buscas, haz una oferta o
          cómprala al instante antes que nadie más.
        </p>
        <Link
          href="/#tendencia"
          className="inline-block mt-8 border border-white/20 dark:border-white/15 text-gray-900 dark:text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
        >
          Ver mercado
        </Link>
      </div>
    </motion.section>
  );
}

function WishlistSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeInUp}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mb-28 grid lg:grid-cols-2 gap-12 items-center"
    >
      <div>
        <h2 className="neon-heading uppercase text-xl sm:text-2xl lg:text-3xl">
          Sé el primero en enterarte
        </h2>
        <p className="mt-6 max-w-md text-sm sm:text-base text-gray-500 dark:text-gray-400">
          Guarda las cartas que te interesan en tu wishlist y recibe una
          notificación al instante cuando alguien las publique en el mercado.
        </p>
        <Link
          href="/wishlist"
          className="inline-block mt-8 border border-white/20 dark:border-white/15 text-gray-900 dark:text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
        >
          Ver mi wishlist
        </Link>
      </div>

      <div className="rounded-2xl border border-white/15 dark:border-white/10 w-full aspect-video overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover scale-130"
        >
          <source src="/videos/wishlist.mp4" type="video/mp4" />
        </video>
      </div>
    </motion.section>
  );
}

function ManageSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeInUp}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mb-28 grid lg:grid-cols-2 gap-12 items-center"
    >
      <div className="lg:order-2">
        <h2 className="neon-heading uppercase text-xl sm:text-2xl lg:text-3xl">
          Gestiona tu colección y recibe ofertas
        </h2>
        <p className="mt-6 max-w-md text-sm sm:text-base text-gray-500 dark:text-gray-400">
          Mira todas tus cartas publicadas, su valor estimado, y recibe o
          acepta ofertas directamente desde tu dashboard.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-8 bg-brand text-black font-bold px-6 py-3 rounded-xl hover:bg-[#00c64b] transition-all shadow-[0_4px_14px_0_rgba(0,229,89,0.25)] hover:shadow-[0_6px_20px_rgba(0,229,89,0.4)] hover:-translate-y-0.5"
        >
          Ir a mis cartas
        </Link>
      </div>

      <div className="lg:order-1 rounded-2xl border border-black/10 dark:border-white/[0.06] w-full aspect-video overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/videos/gestionarcartas.mp4" type="video/mp4" />
        </video>
      </div>
    </motion.section>
  );
}

function Footer() {
  const items = [
    { label: "© 2026", href: null },
    { label: "Instagram", href: "https://www.instagram.com/tcg.rd/" },
    { label: "Soporte", href: "/soporte" },
    { label: "Términos", href: "/terminos" },
  ];

  return (
    <footer className="relative mt-auto py-14 transition-colors">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
      <div className="absolute inset-0 bg-white/20 dark:bg-white/[0.015] backdrop-blur-xl -z-10" />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex flex-col items-center text-center gap-6">
        <h2
          data-text="TCG RD"
          className="footer-wordmark text-5xl md:text-6xl"
        >
          TCG RD
        </h2>

        <nav className="flex flex-wrap items-center justify-center gap-x-2 text-xs font-mono text-gray-400 dark:text-gray-500">
          {items.map((item, index) => (
            <span key={item.label} className="flex items-center gap-x-2">
              {index > 0 && (
                <span aria-hidden className="text-gray-300 dark:text-gray-700">
                  {"//"}
                </span>
              )}
              {item.href === null ? (
                <span>{item.label}</span>
              ) : item.href.startsWith("/") ? (
                <Link href={item.href} className="hover:text-brand transition-colors">
                  {item.label}
                </Link>
              ) : (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand transition-colors"
                >
                  {item.label}
                </a>
              )}
            </span>
          ))}
        </nav>
      </div>
    </footer>
  );
}

// useSearchParams needs a Suspense boundary — isolated here so it only
// gates this invisible watcher, not the whole homepage render.
function AuthQueryWatcher({ onAuth }: { onAuth: (mode: AuthMode) => void }) {
  const searchParams = useSearchParams();
  const authParam = searchParams.get("auth");

  useEffect(() => {
    if (authParam === "register" || authParam === "login") onAuth(authParam);
  }, [authParam, onAuth]);

  return null;
}

export default function MarketplacePage({
  stats,
  trendingCards,
}: {
  stats: MarketplaceStats;
  trendingCards: TrendingCard[];
}) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [search, setSearch] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authInitialForgotPassword, setAuthInitialForgotPassword] = useState(false);
  const [authInitialError, setAuthInitialError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
      // AuthModal closes itself once it's actually done (see AuthModal.tsx)
      // — closing it here on sign-in would cut registration off right after
      // the OTP step, before terms/password/profile.
    });

    return () => subscription.unsubscribe();
  }, []);

  // The auth user object doesn't carry the profile photo — that lives on
  // public.users, kept in sync with what's set in Profile Settings.
  useEffect(() => {
    if (!user) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("users")
      .select("avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!cancelled) setAvatarUrl(data?.avatar_url ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Supabase forwards expired/used recovery links here as either a
  // `#error=...` hash (Site URL fallback) or, via our /auth/callback route,
  // a `?authError=reset_expired` query param — surface both.
  useEffect(() => {
    const hash = window.location.hash;
    const authError = new URLSearchParams(window.location.search).get("authError");
    const isResetExpired =
      authError === "reset_expired" ||
      hash.includes("error=access_denied") ||
      hash.includes("error_code=otp_expired");

    if (!isResetExpired) return;

    setAuthMode("login");
    setAuthInitialForgotPassword(true);
    setAuthInitialError(
      "El link para restablecer tu contraseña expiró o ya fue usado. Solicita uno nuevo."
    );
    setAuthModalOpen(true);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  // Guests get bounced here by middleware after trying an auth-gated route
  // (e.g. /sell, /perfil), or land here from the guest /dashboard shell's
  // login/register buttons — open the matching auth mode instead of leaving
  // them stranded on a bare homepage. Read via useSearchParams (not
  // window.location on mount) because these are same-route client-side nav
  // (e.g. clicking "Subir carta") — the component never remounts, so a
  // mount-only effect would miss the query param entirely.
  const handleAuthParam = useCallback(
    (mode: AuthMode) => {
      setAuthMode(mode);
      setAuthInitialForgotPassword(false);
      setAuthInitialError("");
      setAuthModalOpen(true);
      router.replace("/", { scroll: false });
    },
    [router]
  );

  const openAuth = useCallback((mode: AuthMode) => {
    setAuthMode(mode);
    setAuthInitialForgotPassword(false);
    setAuthInitialError("");
    setAuthModalOpen(true);
  }, []);

  const handleCardClick = useCallback((id: string) => {
    if (user) {
      if (id) router.push(`/cards/${id}`);
      return;
    }
    openAuth("login");
  }, [user, openAuth, router]);

  const filteredTrending = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trendingCards;
    return trendingCards.filter(
      (c) =>
        c.card_name.toLowerCase().includes(q) ||
        c.set_name?.toLowerCase().includes(q) ||
        c.seller_name.toLowerCase().includes(q)
    );
  }, [trendingCards, search]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-brand/20 pt-20">
      <AmbientGlow />
      <Navbar
        isDark={isDark}
        toggleDark={() => setIsDark(!isDark)}
        search={search}
        onSearchChange={setSearch}
        loggedIn={!!user}
        email={user?.email ?? null}
        avatarUrl={avatarUrl}
        onAuthSelect={openAuth}
        revealOnScrollStop
        showSearch={false}
      />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 lg:px-10 mt-12">
        <CollectionsSection stats={stats} />
        <TrendingSection
          cards={filteredTrending}
          onCardClick={handleCardClick}
          user={user}
        />
        <MissionSection />
        <UploadSection />
        <BuySection />
        <WishlistSection />
        <ManageSection />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <AuthQueryWatcher onAuth={handleAuthParam} />
      </Suspense>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        isDark={isDark}
        initialForgotPassword={authInitialForgotPassword}
        initialError={authInitialError}
      />
    </div>
  );
}

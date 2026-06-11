"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronDown, MessageCircle, Tag } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
  useMotionTemplate,
} from "framer-motion";
import { formatPrice } from "@/lib/marketplace/utils";
import { LANGUAGE_FLAG, VARIANT_BADGE_STYLES } from "@/lib/cards/constants";
import type { TCGPriceResult } from "@/lib/api/tcggo";
import type { CardStatus } from "@/lib/supabase/types";

export type CardDetailData = {
  id: string;
  card_name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string | null;
  official_image_url: string | null;
  price_usd: number | null;
  tcg_market_price: number | null;
  status: CardStatus;
  notes: string | null;
  created_at: string;
  variant: string | null;
  language: string | null;
  is_graded: boolean | null;
  grade: string | null;
  grade_company: string | null;
};

type AccordionKey = "detalles" | "precios" | "notas";

const STATUS_LABEL: Record<string, string> = {
  available: "Disponible",
  hold: "Reservada",
  sold: "Vendida",
};
const STATUS_DOT: Record<string, string> = {
  available: "bg-green-400",
  hold: "bg-amber-400",
  sold: "bg-red-400",
};

// Variants that deserve a holographic border
const HOLO_VARIANTS = new Set([
  "Illustration Rare",
  "Special Illustration Rare",
  "Hyper Rare",
  "Full Art",
  "Rainbow Rare",
  "Shiny",
  "Shiny Rare",
  "Gold",
]);

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease, delay: i * 0.065 },
  }),
};

// ─── 3-D tilt wrapper ─────────────────────────────────────────────────────────

function TiltCard({
  children,
  isHolo,
}: {
  children: React.ReactNode;
  isHolo: boolean;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rawRX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const rawRY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);
  const rotateX = useSpring(rawRX, { stiffness: 140, damping: 18, mass: 0.4 });
  const rotateY = useSpring(rawRY, { stiffness: 140, damping: 18, mass: 0.4 });

  // Glare spot that follows the cursor
  const glareXPct = useTransform(mouseX, [-0.5, 0.5], ["20%", "80%"]);
  const glareYPct = useTransform(mouseY, [-0.5, 0.5], ["20%", "80%"]);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareXPct} ${glareYPct}, rgba(255,255,255,0.13) 0%, transparent 60%)`;

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - r.left) / r.width - 0.5);
    mouseY.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative cursor-pointer"
    >
      {/* Holo border glow */}
      {isHolo && (
        <motion.div
          aria-hidden
          animate={{
            background: [
              "linear-gradient(0deg, #ff0080, #7928ca, #0070f3, #00e559, #ff0080)",
              "linear-gradient(360deg, #ff0080, #7928ca, #0070f3, #00e559, #ff0080)",
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-[2px] rounded-3xl opacity-60 blur-[1px] z-0"
        />
      )}

      <div
        className={`relative rounded-3xl overflow-hidden z-10 ${
          isHolo ? "" : "border border-white/[0.08]"
        } shadow-[0_48px_100px_-20px_rgba(0,0,0,0.95)]`}
      >
        {children}

        {/* Cursor-tracking glare */}
        <motion.div
          aria-hidden
          style={{ background: glare }}
          className="absolute inset-0 z-20 pointer-events-none rounded-3xl"
        />
      </div>
    </motion.div>
  );
}

// ─── Stat chip (small) ────────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  sub,
  index,
}: {
  label: string;
  value: string;
  sub?: string;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3.5 cursor-default"
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-600 mb-1.5">
        {label}
      </p>
      <p className="text-sm font-black text-white leading-none truncate">{value}</p>
      {sub && (
        <p className="text-[10px] text-gray-700 mt-1 truncate">{sub}</p>
      )}
    </motion.div>
  );
}

// ─── Accordion ────────────────────────────────────────────────────────────────

function AccordionItem({
  title,
  isOpen,
  onToggle,
  children,
  index,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="border border-white/[0.07] rounded-2xl overflow-hidden bg-white/[0.015]"
    >
      <motion.button
        type="button"
        onClick={onToggle}
        whileTap={{ scale: 0.99 }}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/[0.03] transition-colors"
      >
        {title}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.28, ease }}
        >
          <ChevronDown className="w-4 h-4 text-gray-700" />
        </motion.div>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.05]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CardDetailClient({
  card,
  sellerName,
  lastSaleUsd,
  livePrice,
}: {
  card: CardDetailData;
  sellerName: string;
  lastSaleUsd: number | null;
  livePrice: TCGPriceResult | null;
}) {
  const [photoTab, setPhotoTab] = useState<"oficial" | "real">(
    card.official_image_url ? "oficial" : "real"
  );
  const [openSection, setOpenSection] = useState<AccordionKey | null>(null);

  const toggle = (key: AccordionKey) =>
    setOpenSection((v) => (v === key ? null : key));

  const variant = card.variant ?? "Regular";
  const language = card.language ?? "EN";
  const gradeLabel =
    card.is_graded && card.grade_company && card.grade
      ? `${card.grade_company} ${card.grade}`
      : null;
  const statusLabel = STATUS_LABEL[card.status] ?? card.status;
  const isHolo = HOLO_VARIANTS.has(variant);

  const hasBothPhotos = !!card.official_image_url && !!card.image_url;
  const activeImageSrc =
    photoTab === "oficial" ? card.official_image_url : card.image_url;

  const gradedRows = livePrice
    ? [
        { label: "PSA 10", price: livePrice.psa10, samples: livePrice.psa10s },
        { label: "PSA 9", price: livePrice.psa9, samples: livePrice.psa9s },
        { label: "PSA 8", price: livePrice.psa8, samples: livePrice.psa8s },
        { label: "PSA 7", price: livePrice.psa7, samples: livePrice.psa7s },
        { label: "CGC 10", price: livePrice.cgc10, samples: livePrice.cgc10s },
        { label: "CGC 9", price: livePrice.cgc9, samples: livePrice.cgc9s },
        { label: "BGS 10", price: livePrice.bgs10, samples: livePrice.bgs10s },
      ].filter((r) => r.price != null)
    : [];

  const hasPriceData =
    livePrice &&
    (livePrice.tcgPlayerPrice != null ||
      livePrice.cardmarketLowest != null ||
      gradedRows.length > 0);

  return (
    <div className="bg-[#070707] text-white min-h-screen selection:bg-brand/20">

      {/* Fixed translucent header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#070707]/70 backdrop-blur-2xl border-b border-white/[0.05]"
      >
        <div className="max-w-screen-xl mx-auto px-6 h-full flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Mercado
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/solo-logo.png" alt="TCGRD" width={26} height={26} className="h-[26px] w-[26px]" />
            <span className="text-brand font-extrabold text-base tracking-tighter">TCGRD</span>
          </Link>
        </div>
      </motion.header>

      {/* Two-column layout */}
      <div className="flex flex-col md:grid md:grid-cols-2 min-h-screen">

        {/* ── LEFT: sticky image panel ── */}
        <div className="md:sticky md:top-0 md:h-screen flex flex-col items-center justify-center bg-[#0a0a0a] pt-24 pb-12 px-10 md:px-14 relative overflow-hidden">

          {/* Ambient background radials */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: isHolo
                ? "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(120,40,200,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 20%, rgba(0,229,89,0.06) 0%, transparent 60%)"
                : "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,229,89,0.05) 0%, transparent 70%)",
            }}
          />

          {/* Tab pills */}
          {hasBothPhotos && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="flex gap-1 mb-7 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1"
            >
              {(["oficial", "real"] as const).map((tab) => (
                <motion.button
                  key={tab}
                  type="button"
                  onClick={() => setPhotoTab(tab)}
                  whileTap={{ scale: 0.97 }}
                  className="relative text-[11px] font-semibold px-5 py-2 rounded-xl transition-colors"
                >
                  {photoTab === tab && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 bg-white/[0.1] rounded-xl"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span
                    className={`relative z-10 transition-colors duration-200 ${
                      photoTab === tab ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {tab === "oficial" ? "Arte oficial" : "Foto real"}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Card with 3-D tilt */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease }}
            style={{ perspective: "1200px" }}
            className="w-full max-w-[320px] md:max-w-[360px]"
          >
            <TiltCard isHolo={isHolo}>
              <AnimatePresence mode="wait">
                {activeImageSrc ? (
                  <motion.img
                    key={photoTab}
                    src={activeImageSrc}
                    alt={card.card_name}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.38, ease }}
                    className="w-full block"
                    draggable={false}
                  />
                ) : (
                  <motion.div
                    key="ph"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full aspect-[3/4] bg-gradient-to-br from-gray-900 to-gray-800"
                  />
                )}
              </AnimatePresence>
            </TiltCard>
          </motion.div>

          {/* Caption */}
          <AnimatePresence mode="wait">
            <motion.p
              key={photoTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-5 text-[10px] text-gray-700 font-medium text-center"
            >
              {photoTab === "oficial"
                ? "Arte oficial · mueve el cursor sobre la carta"
                : "Fotografía del vendedor · condición actual"}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* ── RIGHT: scrollable info ── */}
        <div className="pt-28 pb-20 px-8 md:px-12 bg-[#070707] overflow-y-auto">

          {/* Collection crumb */}
          <motion.p
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-600 mb-2"
          >
            Pokémon TCG
            {card.set_name ? ` · ${card.set_name}` : ""}
            {card.card_number ? ` · #${card.card_number}` : ""}
          </motion.p>

          {/* Card name */}
          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-[clamp(2.4rem,4vw,3.5rem)] font-black tracking-tight text-white leading-[1.05] mb-5"
          >
            {card.card_name}
          </motion.h1>

          {/* Badges */}
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap gap-2 mb-9"
          >
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-gray-500">
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[card.status] ?? "bg-gray-500"}`} />
              {statusLabel}
            </span>
            {variant !== "Regular" && (
              <span
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border ${
                  VARIANT_BADGE_STYLES[variant] ?? "bg-white/[0.03] text-gray-400 border-white/[0.08]"
                }`}
              >
                {variant}
              </span>
            )}
            <span className="text-[11px] font-medium text-gray-600 bg-white/[0.03] border border-white/[0.07] px-3 py-1.5 rounded-full">
              {LANGUAGE_FLAG[language] ?? "🌐"} {language}
            </span>
            {gradeLabel && (
              <motion.span
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(250,204,21,0)",
                    "0 0 18px 3px rgba(250,204,21,0.18)",
                    "0 0 0 0 rgba(250,204,21,0)",
                  ],
                }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-[11px] font-bold bg-yellow-400/90 text-black px-3 py-1.5 rounded-full"
              >
                {gradeLabel}
              </motion.span>
            )}
          </motion.div>

          {/* ── Featured price ── */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mb-3"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-600 mb-2">
              Precio de venta
            </p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span
                className={`text-4xl font-black leading-none ${
                  card.status === "available" ? "text-brand" : "text-white"
                }`}
              >
                {formatPrice(card.price_usd)}
              </span>
              {card.price_usd != null && (
                <span className="text-sm text-gray-600 font-medium">
                  ${Number(card.price_usd).toFixed(2)} USD
                </span>
              )}
            </div>
          </motion.div>

          {/* 3-stat row */}
          <div className="grid grid-cols-3 gap-2.5 mb-9">
            <StatChip label="Rareza" value={variant} sub={gradeLabel ?? undefined} index={4} />
            <StatChip
              label="Últ. venta"
              value={lastSaleUsd != null ? formatPrice(lastSaleUsd) : "—"}
              sub={lastSaleUsd != null ? `$${lastSaleUsd.toFixed(2)} USD` : "Sin datos"}
              index={5}
            />
            <StatChip
              label="Ref. mercado"
              value={card.tcg_market_price != null ? formatPrice(card.tcg_market_price) : "—"}
              sub={card.tcg_market_price != null ? `$${Number(card.tcg_market_price).toFixed(2)} USD` : undefined}
              index={6}
            />
          </div>

          {/* ── CTA ── */}
          {card.status === "available" && (
            <motion.div
              custom={7}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-2.5 mb-9"
            >
              <motion.a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hola, me interesa esta carta: ${card.card_name}${
                    card.set_name ? ` (${card.set_name})` : ""
                  } — ${formatPrice(card.price_usd)}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 0 70px -12px rgba(0,229,89,0.55)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className="relative w-full overflow-hidden bg-brand text-black text-sm font-bold py-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-[0_0_40px_-18px_rgba(0,229,89,0.4)]"
              >
                {/* Shimmer sweep */}
                <motion.span
                  aria-hidden
                  initial={{ x: "-120%" }}
                  animate={{ x: "220%" }}
                  transition={{
                    duration: 1.6,
                    delay: 1.2,
                    repeat: Infinity,
                    repeatDelay: 4,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 pointer-events-none"
                />
                <MessageCircle className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Contactar vendedor</span>
              </motion.a>

              <motion.button
                type="button"
                whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="w-full border border-white/[0.09] text-gray-500 hover:text-white text-sm font-medium py-4 rounded-2xl transition-colors"
              >
                Hacer oferta →
              </motion.button>
            </motion.div>
          )}

          {/* ── Seller ── */}
          <motion.div
            custom={8}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-3 px-4 py-3.5 bg-white/[0.02] border border-white/[0.06] rounded-2xl mb-9"
          >
            <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[11px] font-bold text-gray-400 flex-shrink-0">
              {sellerName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-gray-600">
                Vendedor
              </p>
              <p className="text-sm font-semibold text-white truncate">{sellerName}</p>
            </div>
          </motion.div>

          {/* ── Accordion ── */}
          <div className="space-y-2">
            <AccordionItem
              title="Detalles de la carta"
              isOpen={openSection === "detalles"}
              onToggle={() => toggle("detalles")}
              index={9}
            >
              <div className="divide-y divide-white/[0.04] text-sm">
                {[
                  { label: "Set", value: card.set_name ?? "—" },
                  { label: "Número", value: card.card_number ?? "—" },
                  {
                    label: "Idioma",
                    value: `${LANGUAGE_FLAG[language] ?? "🌐"} ${language}`,
                  },
                  { label: "Variante", value: variant },
                  { label: "Estado", value: statusLabel },
                  ...(gradeLabel ? [{ label: "Graduada", value: gradeLabel }] : []),
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <span className="text-gray-600">{row.label}</span>
                    <span className="font-medium text-white">{row.value}</span>
                  </div>
                ))}
              </div>
            </AccordionItem>

            {hasPriceData && (
              <AccordionItem
                title="Precios de referencia"
                isOpen={openSection === "precios"}
                onToggle={() => toggle("precios")}
                index={10}
              >
                <div className="divide-y divide-white/[0.04] text-xs">
                  {livePrice!.tcgPlayerPrice != null && (
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-gray-600 flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-brand/50" />
                        TCGPlayer market
                      </span>
                      <span className="font-mono font-semibold text-white">
                        ${livePrice!.tcgPlayerPrice.toFixed(2)} USD
                      </span>
                    </div>
                  )}
                  {livePrice!.cardmarketLowest != null && (
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-gray-600">Cardmarket lowest NM</span>
                      <span className="font-mono font-semibold text-white">
                        €{livePrice!.cardmarketLowest.toFixed(2)} EUR
                      </span>
                    </div>
                  )}
                  {livePrice!.cardmarket7d != null && (
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-gray-600">Cardmarket 7d avg</span>
                      <span className="font-mono font-semibold text-white">
                        €{livePrice!.cardmarket7d.toFixed(2)} EUR
                      </span>
                    </div>
                  )}
                  {gradedRows.map((r) => (
                    <div key={r.label} className="flex items-center justify-between px-5 py-3">
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-yellow-400/80">{r.label}</span>
                        {r.samples != null && (
                          <span className="text-gray-700">{r.samples} ventas eBay</span>
                        )}
                      </span>
                      <span className="font-mono font-semibold text-white">
                        ${r.price!.toFixed(2)} USD
                      </span>
                    </div>
                  ))}
                  <p className="px-5 py-3 text-gray-700">
                    Datos referenciales de mercados internacionales.
                  </p>
                </div>
              </AccordionItem>
            )}

            {card.notes && (
              <AccordionItem
                title="Notas del vendedor"
                isOpen={openSection === "notas"}
                onToggle={() => toggle("notas")}
                index={hasPriceData ? 11 : 10}
              >
                <p className="px-5 py-4 text-sm text-gray-400 leading-relaxed">
                  {card.notes}
                </p>
              </AccordionItem>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

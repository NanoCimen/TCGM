"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Heart, ShoppingBag, ChevronDown, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/marketplace/utils";

export type TcgCard = {
  id: string;
  name: string;
  number: string;
  set: { id: string; name: string; total?: number; printedTotal?: number };
  images: { small: string; large?: string };
  rarity?: string;
  types?: string[];
};

export type MarketListing = {
  id: string;
  card_name: string;
  price_usd: number | null;
  status: string;
  variant: string | null;
  language: string | null;
  seller_name: string;
  image_url: string | null;
};

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease, delay: i * 0.07 },
  }),
};

export default function WishlistCardDetail({
  card,
  listings,
  isInWishlist,
  wishlistItemId,
}: {
  card: TcgCard;
  listings: MarketListing[];
  isInWishlist: boolean;
  wishlistItemId: string | null;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [removed, setRemoved] = useState(false);

  const displayImage = card.images.large ?? card.images.small;
  const printedTotal = card.set.printedTotal ?? card.set.total;
  const fullNumber = printedTotal ? `${card.number}/${printedTotal}` : card.number;
  const cheapest = listings.length > 0
    ? listings.reduce((a, b) => (a.price_usd ?? 0) < (b.price_usd ?? 0) ? a : b)
    : null;

  async function handleRemoveFromWishlist() {
    if (!wishlistItemId) return;
    await fetch(`/api/wishlist/${wishlistItemId}`, { method: "DELETE" });
    setRemoved(true);
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white selection:bg-brand/20">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 30% 0%, rgba(0,229,89,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="sticky top-0 z-50 h-16 bg-[#070707]/75 backdrop-blur-2xl border-b border-white/[0.05]"
      >
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <Link
            href="/wishlist"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Wishlist
          </Link>
          <Link href="/" className="flex items-center">
            <Image src="/solo-logo.png" alt="TCGRD" width={26} height={26} className="h-[26px] w-[26px]" />
          </Link>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <div className="flex flex-col md:grid md:grid-cols-2 gap-14 items-start">

          {/* ── LEFT: card art ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease }}
            className="md:sticky md:top-24"
          >
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-6 rounded-3xl opacity-20 blur-3xl"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(0,229,89,0.2) 0%, transparent 70%)",
                }}
              />
              <motion.div
                whileHover={{ scale: 1.015 }}
                transition={{ type: "spring", stiffness: 180, damping: 28 }}
                className="relative rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_48px_96px_-24px_rgba(0,0,0,0.95)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={displayImage} alt={card.name} className="w-full block" />
              </motion.div>
            </div>
            <p className="text-[10px] text-gray-700 text-center mt-3 font-medium">
              Arte oficial Pokémon TCG · imagen de referencia
            </p>
          </motion.div>

          {/* ── RIGHT: info ── */}
          <div className="min-w-0">
            {/* Crumb */}
            <motion.p
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-600 mb-2"
            >
              Pokémon TCG · {card.set.name} · #{fullNumber}
            </motion.p>

            {/* Name */}
            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-[clamp(2.4rem,4vw,3.5rem)] font-black tracking-tight text-white leading-none mb-5"
            >
              {card.name}
            </motion.h1>

            {/* Badges */}
            <motion.div
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap gap-2 mb-8"
            >
              {card.rarity && (
                <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] text-gray-400">
                  {card.rarity}
                </span>
              )}
              {card.types?.map((t) => (
                <span
                  key={t}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] text-gray-500"
                >
                  {t}
                </span>
              ))}
              {isInWishlist && !removed && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-brand/10 border border-brand/30 text-brand">
                  <Heart className="w-3 h-3" fill="currentColor" />
                  En tu wishlist
                </span>
              )}
            </motion.div>

            {/* Divider */}
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="h-px bg-gradient-to-r from-white/[0.08] via-white/[0.03] to-transparent mb-8"
            />

            {/* ── Listings section ── */}
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
              {listings.length === 0 ? (
                /* No listings */
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-6 text-center">
                  <ShoppingBag className="w-7 h-7 text-gray-700 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-sm font-semibold text-gray-400 mb-1">
                    Sin listados en TCGRD
                  </p>
                  <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                    Esta carta no está disponible en el mercado ahora mismo.
                    Te avisaremos cuando alguien la publique.
                  </p>
                  <Link
                    href={`/?q=${encodeURIComponent(card.name)}`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-brand hover:underline"
                  >
                    Buscar en el mercado
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                /* Has listings */
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-600 mb-3">
                    Disponible en TCGRD · {listings.length} listado{listings.length !== 1 ? "s" : ""}
                  </p>
                  {cheapest && (
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mb-3"
                    >
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-600 mb-1">
                        Mejor precio
                      </p>
                      <p className="text-3xl font-black text-brand leading-none mb-3">
                        {formatPrice(cheapest.price_usd)}
                      </p>
                      <Link
                        href={`/cards/${cheapest.id}`}
                        className="w-full bg-brand text-black text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#00c64b] transition-colors"
                      >
                        Ver listado
                      </Link>
                    </motion.div>
                  )}
                  <div className="space-y-2">
                    {listings.map((l) => (
                      <Link
                        key={l.id}
                        href={`/cards/${l.id}`}
                        className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:border-white/[0.1] transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{l.seller_name}</p>
                          <p className="text-[10px] text-gray-600">{l.variant ?? "Regular"} · {l.language ?? "EN"}</p>
                        </div>
                        <span className="text-sm font-bold text-white">{formatPrice(l.price_usd)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Wishlist action */}
            {isInWishlist && !removed && wishlistItemId && (
              <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
                <button
                  type="button"
                  onClick={handleRemoveFromWishlist}
                  className="w-full border border-white/[0.08] text-gray-600 hover:text-red-400 hover:border-red-500/30 text-sm font-medium py-3.5 rounded-2xl transition-colors mb-6"
                >
                  Quitar de wishlist
                </button>
              </motion.div>
            )}

            {removed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-600 text-center mb-6"
              >
                Eliminado de tu wishlist.{" "}
                <Link href="/wishlist" className="text-brand hover:underline">
                  Ver wishlist
                </Link>
              </motion.p>
            )}

            {/* Divider */}
            <motion.div
              custom={6}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="h-px bg-gradient-to-r from-white/[0.08] via-white/[0.03] to-transparent mb-6"
            />

            {/* Details accordion */}
            <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
              <div className="border border-white/[0.07] rounded-2xl overflow-hidden bg-white/[0.02]">
                <motion.button
                  type="button"
                  onClick={() => setDetailsOpen((v) => !v)}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/[0.03] transition-colors"
                >
                  Detalles de la carta
                  <motion.div
                    animate={{ rotate: detailsOpen ? 180 : 0 }}
                    transition={{ duration: 0.28, ease }}
                  >
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  </motion.div>
                </motion.button>
                <AnimatePresence initial={false}>
                  {detailsOpen && (
                    <motion.div
                      key="details"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/[0.05] divide-y divide-white/[0.04] text-sm">
                        {[
                          { label: "Nombre", value: card.name },
                          { label: "Set", value: card.set.name },
                          { label: "Número", value: fullNumber },
                          { label: "Rareza", value: card.rarity ?? "—" },
                          ...(card.types?.length ? [{ label: "Tipo", value: card.types.join(", ") }] : []),
                        ].map((row) => (
                          <div key={row.label} className="flex items-center justify-between px-5 py-3">
                            <span className="text-gray-600">{row.label}</span>
                            <span className="font-medium text-white">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

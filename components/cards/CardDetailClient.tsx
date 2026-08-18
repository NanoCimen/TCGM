"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCheck, ChevronDown, ExternalLink, Heart, Loader2, MessageCircle, Star, X } from "lucide-react";
import { openBuyNowWhatsApp } from "@/lib/marketplace/whatsapp";
import Footer from "@/components/marketplace/Footer";
import { createClient } from "@/lib/supabase/client";
import AuthModal, { type AuthMode } from "@/components/auth/AuthModal";
import AuthMenu from "@/components/auth/AuthMenu";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
  useMotionTemplate,
} from "framer-motion";
import { formatPrice, USD_TO_DOP } from "@/lib/marketplace/utils";
import { LANGUAGE_FLAG, VARIANT_BADGE_STYLES } from "@/lib/cards/constants";
import type { CardStatus } from "@/lib/supabase/types";
import {
  OFFER_STATUS_BADGE,
  OFFER_STATUS_LABEL,
  type OfferWithDetails,
} from "@/components/dashboard/MyCardsDashboard";

export type CardDetailData = {
  id: string;
  owner_id: string | null;
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

type AccordionKey = "detalles" | "notas" | "actividad";

// One accepted offer for this card — its full resale history, since each
// resale reuses the same card row but leaves the original accepted offer
// behind in the offers table. status is "hold" until the seller confirms
// delivery — only then does it actually count as a completed sale.
export type CardActivityEntry = {
  id: string;
  priceUsd: number;
  isBuyNow: boolean;
  date: string;
  buyerName: string;
  sellerName: string;
  status: "hold" | "sold";
};

const STATUS_LABEL: Record<string, string> = {
  draft: "En portafolio",
  available: "Disponible",
  hold: "Reservada",
  sold: "Vendida",
};
const STATUS_DOT: Record<string, string> = {
  draft: "bg-gray-500",
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
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
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
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  index: number;
  href?: string;
}) {
  const Wrapper = href ? motion.a : motion.div;
  return (
    <Wrapper
      {...(href
        ? { href, target: "_blank", rel: "noopener noreferrer" }
        : {})}
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={`bg-white/[0.03] border border-white/[0.07] rounded-xl p-3.5 block ${
        href ? "hover:border-brand/40 hover:bg-brand/[0.04]" : "cursor-default"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
        {label}
      </p>
      <p
        className={`text-sm font-black leading-none flex items-center gap-1 min-w-0 ${
          href ? "text-brand" : "text-white"
        }`}
      >
        <span className="truncate">{value}</span>
        {href && <ExternalLink className="w-3 h-3 flex-shrink-0" />}
      </p>
      {sub && (
        <p className="text-[10px] text-gray-700 mt-1 truncate">{sub}</p>
      )}
    </Wrapper>
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
  sellerId,
  sellerName,
  sellerPhone,
  currentUserId: initialUserId,
  existingOffer,
  lastSaleUsd,
  cardOffers = [],
  cardActivity = [],
}: {
  card: CardDetailData;
  sellerId: string;
  sellerName: string;
  sellerPhone: string | null;
  currentUserId: string | null;
  existingOffer: { id: string; offer_price: number } | null;
  lastSaleUsd: number | null;
  cardOffers?: OfferWithDetails[];
  cardActivity?: CardActivityEntry[];
}) {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState(initialUserId);
  const [email, setEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [photoTab, setPhotoTab] = useState<"oficial" | "real">(
    card.official_image_url ? "oficial" : "real"
  );
  const [openSection, setOpenSection] = useState<AccordionKey | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      setCurrentUserId(session?.user?.id ?? null);
      setEmail(session?.user?.email ?? null);
      // AuthModal closes itself once it's actually done (see AuthModal.tsx)
      // — closing it here on sign-in would cut registration off right after
      // the OTP step, before terms/password/profile.
    });
    return () => subscription.unsubscribe();
  }, []);

  // The auth user object doesn't carry the profile photo — that lives on
  // public.users, kept in sync with what's set in Profile Settings.
  useEffect(() => {
    if (!currentUserId) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("users")
      .select("avatar_url")
      .eq("id", currentUserId)
      .single()
      .then(({ data }) => {
        if (!cancelled) setAvatarUrl(data?.avatar_url ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  // Seller management state
  const [delistConfirm, setDelistConfirm] = useState(false);
  const [delistError, setDelistError] = useState("");
  const [delisting, setDelisting] = useState(false);
  const [markingSold, setMarkingSold] = useState(false);
  const [sellerActionError, setSellerActionError] = useState("");
  // Publish-from-draft state
  const [publishExpanded, setPublishExpanded] = useState(false);
  const [publishPrice, setPublishPrice] = useState(
    card.price_usd != null ? String(card.price_usd) : ""
  );
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError, setPublishError] = useState("");

  // Offer / buy flow state
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [buyConfirm, setBuyConfirm] = useState(false);
  const [offerPrice, setOfferPrice] = useState(
    card.price_usd ? String(Math.round(card.price_usd * 0.9 * USD_TO_DOP)) : ""
  );
  const [offerMessage, setOfferMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ctaError, setCtaError] = useState("");
  const [dealDone, setDealDone] = useState<{
    offerId: string;
    priceUsd: number;
    isBuyNow: boolean;
  } | null>(null);

  // Seller rating state
  const [sellerRating, setSellerRating] = useState<{ avg: number | null; count: number } | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    fetch(`/api/reviews?seller_id=${sellerId}`)
      .then((r) => r.json())
      .then((data: { avg: number | null; count: number }) => setSellerRating(data))
      .catch(() => {});
  }, [sellerId]);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller_id: sellerId, card_id: card.id, rating: reviewRating, comment: reviewComment }),
      });
      if (res.ok) {
        setReviewDone(true);
        setShowReviewForm(false);
        setSellerRating((prev) => prev ? { avg: prev.avg, count: prev.count + 1 } : { avg: reviewRating, count: 1 });
      }
    } finally {
      setSubmittingReview(false);
    }
  }

  // Save/heart state
  const [isSaved, setIsSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;
    fetch("/api/saved")
      .then((r) => r.json())
      .then((data: { saved: string[] }) => setIsSaved(data.saved.includes(card.id)))
      .catch(() => {});
  }, [currentUserId, card.id]);

  async function toggleSave() {
    if (!currentUserId || savingToggle) return;
    setSavingToggle(true);
    try {
      const method = isSaved ? "DELETE" : "POST";
      const res = await fetch("/api/saved", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_id: card.id }),
      });
      if (res.ok) setIsSaved(!isSaved);
    } finally {
      setSavingToggle(false);
    }
  }

  const isSeller = !!currentUserId && currentUserId === sellerId;
  // Who actually possesses the card right now — the buyer, once the seller
  // confirms delivery (owner_id set), otherwise still the seller. Distinct
  // from isSeller: after a sale and before the buyer re-lists it, these are
  // two different people, and the buyer shouldn't see "make an offer" /
  // "start a conversation with the seller" CTAs on a card they already own.
  const currentOwnerId = card.owner_id ?? sellerId;
  const isOwner = !!currentUserId && currentUserId === currentOwnerId;

  const pendingCardOffers = cardOffers.filter((o) => o.status === "pending");

  async function handlePublishListing() {
    const priceUsd = parseFloat(publishPrice);
    if (!priceUsd || priceUsd <= 0) { setPublishError("Ingresa un precio válido"); return; }
    setPublishError("");
    setPublishLoading(true);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "available", price_usd: priceUsd }),
      });
      const json = await res.json();
      if (!res.ok) { setPublishError(json.error); return; }
      router.refresh();
      setPublishExpanded(false);
    } finally {
      setPublishLoading(false);
    }
  }

  async function handleUnlist() {
    setDelistError("");
    setDelisting(true);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      const json = await res.json();
      if (!res.ok) { setDelistError(json.error); return; }
      router.refresh(); // stays on same page — card now shows as draft
      setDelistConfirm(false);
    } finally {
      setDelisting(false);
    }
  }

  async function handleMarkSold() {
    setSellerActionError("");
    setMarkingSold(true);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sold" }),
      });
      const json = await res.json();
      if (!res.ok) { setSellerActionError(json.error); return; }
      router.refresh();
    } finally {
      setMarkingSold(false);
    }
  }

  async function handleBuyNow() {
    setCtaError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: card.id,
          offer_price: card.price_usd,
          is_buy_now: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setCtaError(json.error); return; }
      setDealDone({ offerId: json.offer_id, priceUsd: card.price_usd!, isBuyNow: true });
      setBuyConfirm(false);
      openBuyNowWhatsApp({
        cardName: card.card_name,
        setName: card.set_name,
        sellerName,
        sellerPhone,
        priceUsd: card.price_usd!,
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMakeOffer(e: React.FormEvent) {
    e.preventDefault();
    setCtaError("");
    const priceUsd = parseFloat(offerPrice) / USD_TO_DOP;
    if (!priceUsd || priceUsd <= 0) { setCtaError("Ingresa un precio válido"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: card.id,
          offer_price: priceUsd,
          message: offerMessage,
          is_buy_now: false,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setCtaError(json.error); return; }
      setDealDone({ offerId: json.offer_id, priceUsd, isBuyNow: false });
      setShowOfferModal(false);
    } finally {
      setSubmitting(false);
    }
  }

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
  const tcgPlayerUrl = `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(
    [card.card_name, card.set_name].filter(Boolean).join(" ")
  )}`;

  const hasBothPhotos = !!card.official_image_url && !!card.image_url;
  const activeImageSrc =
    photoTab === "oficial" ? card.official_image_url : card.image_url;

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
            href={isOwner ? "/dashboard" : "/collection/pokemon"}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            {isOwner ? "Mi colección" : "Mercado"}
          </Link>
          <div className="flex items-center gap-3">
            {currentUserId && !isOwner && (
              <button
                type="button"
                onClick={toggleSave}
                disabled={savingToggle}
                title={isSaved ? "Quitar de guardados" : "Guardar"}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.06] transition-colors"
              >
                <Heart
                  className={`w-4.5 h-4.5 transition-colors ${isSaved ? "text-red-500 fill-red-500" : "text-gray-500"}`}
                />
              </button>
            )}
            <AuthMenu
              isDark
              loggedIn={!!currentUserId}
              email={email}
              avatarUrl={avatarUrl}
              onSelectLogin={() => {
                setAuthMode("login");
                setAuthModalOpen(true);
              }}
              onSelectRegister={() => {
                setAuthMode("register");
                setAuthModalOpen(true);
              }}
            />
          </div>
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
            className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2"
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
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
              value="Ver en TCGPlayer"
              sub={
                card.tcg_market_price != null
                  ? `$${Number(card.tcg_market_price).toFixed(2)} USD`
                  : undefined
              }
              href={tcgPlayerUrl}
              index={6}
            />
          </div>

          {/* ── CTA ── */}
          <motion.div
            custom={7}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-2.5 mb-9"
          >
            {/* Purchased and owned, not (yet) my own listing — no seller
                management here since I'm not seller_id; resell from Mi
                colección instead, which hands it into that same flow. */}
            {isOwner && !isSeller && (
              <div className="space-y-2.5">
                <div className="w-full text-sm font-medium py-3.5 rounded-2xl text-center border border-cyan-900/50 bg-cyan-950/20 text-cyan-400">
                  Esta carta es tuya
                </div>
                <Link
                  href="/dashboard"
                  className="w-full block text-center border border-white/[0.09] text-gray-400 hover:text-white text-sm font-medium py-4 rounded-lg transition-colors"
                >
                  Revender desde Mi colección
                </Link>
              </div>
            )}

            {/* Own listing — seller management */}
            {isSeller && (
              <div className="space-y-2.5">
                {/* Status badge */}
                <div className={`w-full text-sm font-medium py-3.5 rounded-2xl text-center border ${
                  card.status === "draft"
                    ? "border-white/[0.07] bg-white/[0.02] text-gray-400"
                    : card.status === "available"
                    ? "border-green-900/50 bg-green-950/30 text-green-400"
                    : card.status === "hold"
                    ? "border-amber-900/50 bg-amber-950/30 text-amber-400"
                    : "border-white/[0.07] bg-white/[0.02] text-gray-500"
                }`}>
                  {card.status === "draft" && "Carta en tu portafolio — no publicada"}
                  {card.status === "available" && "Tu carta está publicada y disponible"}
                  {card.status === "hold" && "Carta reservada — pendiente de entrega"}
                  {card.status === "sold" && "Carta vendida"}
                </div>

                {sellerActionError && (
                  <p className="text-red-400 text-xs text-center">{sellerActionError}</p>
                )}

                {/* DRAFT: inline publish form */}
                {card.status === "draft" && (
                  publishExpanded ? (
                    <div className="space-y-3 bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4">
                      <p className="text-xs font-bold text-gray-400">
                        Precio de venta
                        {card.tcg_market_price != null && (
                          <span className="text-gray-600 font-normal ml-1">
                            · referencia mercado: ${Number(card.tcg_market_price).toFixed(2)} USD
                          </span>
                        )}
                      </p>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">$</span>
                        <input
                          type="number"
                          value={publishPrice}
                          onChange={(e) => { setPublishPrice(e.target.value); setPublishError(""); }}
                          placeholder="0.00"
                          min="0.01"
                          step="0.01"
                          autoFocus
                          className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-brand rounded-lg py-3 pl-8 pr-4 text-white text-sm font-mono outline-none focus:ring-1 focus:ring-brand/20 transition-all"
                        />
                      </div>
                      {publishPrice && parseFloat(publishPrice) > 0 && (
                        <p className="text-[11px] text-gray-500 font-mono">
                          {"~"} {formatPrice(parseFloat(publishPrice))}
                        </p>
                      )}
                      {publishError && <p className="text-red-400 text-xs">{publishError}</p>}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setPublishExpanded(false); setPublishError(""); }}
                          className="flex-1 border border-white/[0.09] text-gray-500 hover:text-white text-sm font-medium py-3 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={publishLoading || !publishPrice || parseFloat(publishPrice) <= 0}
                          onClick={handlePublishListing}
                          className="flex-1 bg-brand text-black text-sm font-bold py-3 rounded-lg hover:bg-[#00c64b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {publishLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publicar al mercado"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPublishExpanded(true)}
                      className="w-full bg-brand text-black text-sm font-bold py-4 rounded-lg hover:bg-[#00c64b] transition-colors"
                    >
                      Publicar al mercado
                    </button>
                  )
                )}

                {/* HOLD: confirm delivery */}
                {card.status === "hold" && (
                  <button
                    type="button"
                    disabled={markingSold}
                    onClick={handleMarkSold}
                    className="w-full flex items-center justify-center gap-2 border border-white/[0.09] text-gray-300 hover:text-white text-sm font-medium py-3.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {markingSold ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                    Confirmar entrega
                  </button>
                )}

                {/* AVAILABLE: unlist back to portfolio */}
                {card.status === "available" && (
                  delistConfirm ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400 text-center">
                        ¿Retirar <span className="text-white font-semibold">{card.card_name}</span> del mercado?
                        <br /><span className="text-xs text-gray-600">Volverá a tu portafolio. Las ofertas pendientes se cancelarán.</span>
                      </p>
                      {delistError && <p className="text-red-400 text-xs text-center">{delistError}</p>}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setDelistConfirm(false); setDelistError(""); }}
                          className="flex-1 border border-white/[0.09] text-gray-500 hover:text-white text-sm font-medium py-3.5 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={delisting}
                          onClick={handleUnlist}
                          className="flex-1 border border-gray-700 text-gray-300 hover:text-white text-sm font-bold py-3.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {delisting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sí, retirar"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDelistConfirm(true)}
                      className="w-full flex items-center justify-center gap-2 border border-white/[0.06] text-gray-600 hover:text-gray-300 hover:border-gray-700 text-sm font-medium py-3.5 rounded-lg transition-colors"
                    >
                      Retirar del mercado
                    </button>
                  )
                )}
              </div>
            )}

            {/* Not logged in */}
            {!currentUserId && card.status === "available" && (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="w-full bg-brand text-black text-sm font-bold py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#00c64b] transition-colors"
              >
                Inicia sesión para comprar
              </button>
            )}

            {/* Deal already done this session */}
            {dealDone && (
              <div className="space-y-2.5">
                <div className="w-full border border-brand/30 bg-brand/5 text-brand text-sm font-bold py-4 rounded-2xl text-center">
                  {dealDone.isBuyNow ? "¡Compra confirmada! 🎉" : "¡Oferta enviada! El vendedor te notificará."}
                </div>
                {dealDone.isBuyNow && (
                  <button
                    type="button"
                    onClick={() =>
                      openBuyNowWhatsApp({
                        cardName: card.card_name,
                        setName: card.set_name,
                        sellerName,
                        priceUsd: dealDone.priceUsd,
                      })
                    }
                    className="w-full border border-[#25D366]/30 bg-[#25D366]/5 text-[#25D366] text-sm font-bold py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#25D366]/10 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Abrir WhatsApp con el vendedor
                  </button>
                )}
              </div>
            )}

            {/* Buyer CTAs */}
            {currentUserId && !isSeller && !dealDone && card.status === "available" && (
              <>
                {existingOffer ? (
                  <div className="w-full border border-amber-500/30 bg-amber-500/5 text-amber-400 text-sm font-medium py-4 rounded-2xl text-center">
                    Ya tienes una oferta pendiente — {formatPrice(existingOffer.offer_price)}
                  </div>
                ) : buyConfirm ? (
                  <div className="space-y-2.5">
                    <p className="text-sm text-gray-400 text-center">
                      ¿Confirmas la compra de{" "}
                      <span className="text-white font-semibold">{card.card_name}</span>{" "}
                      por{" "}
                      <span className="text-brand font-bold">{formatPrice(card.price_usd)}</span>?
                    </p>
                    {ctaError && <p className="text-red-400 text-xs text-center">{ctaError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setBuyConfirm(false); setCtaError(""); }}
                        className="flex-1 border border-white/[0.09] text-gray-500 hover:text-white text-sm font-medium py-3.5 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={submitting}
                        className="flex-1 bg-brand text-black text-sm font-bold py-3.5 rounded-lg hover:bg-[#00c64b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sí, comprar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <motion.button
                      type="button"
                      onClick={() => setBuyConfirm(true)}
                      whileHover={{ scale: 1.02, boxShadow: "0 0 70px -12px rgba(0,229,89,0.55)" }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="relative w-full overflow-hidden bg-brand text-black text-sm font-bold py-4 rounded-lg flex items-center justify-center gap-2.5 shadow-[0_0_40px_-18px_rgba(0,229,89,0.4)]"
                    >
                      <motion.span
                        aria-hidden
                        initial={{ x: "-120%" }}
                        animate={{ x: "220%" }}
                        transition={{ duration: 1.6, delay: 1.2, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
                        className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 pointer-events-none"
                      />
                      <span className="relative z-10">Comprar ahora — {formatPrice(card.price_usd)}</span>
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setShowOfferModal(true)}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.04)" }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full border border-white/[0.09] text-gray-400 hover:text-white text-sm font-medium py-4 rounded-lg transition-colors"
                    >
                      Hacer oferta →
                    </motion.button>
                  </>
                )}
              </>
            )}

            {/* Card not available */}
            {!isOwner && !dealDone && card.status !== "available" && (
              <div className="w-full border border-white/[0.07] text-gray-600 text-sm font-medium py-4 rounded-2xl text-center">
                {card.status === "hold" ? "Carta reservada" : "Carta vendida"}
              </div>
            )}
          </motion.div>

          {/* Start a conversation — messaging itself lives in Mi colección → Mensajes */}
          {currentUserId && !isOwner && (
            <motion.div custom={7.5} variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
              <Link
                href="/dashboard?tab=mensajes"
                className="w-full flex items-center justify-center gap-2 border border-white/[0.09] text-gray-400 hover:text-white text-sm font-medium py-4 rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Empezar conversación con vendedor
              </Link>
            </motion.div>
          )}

          {/* Ofertas recibidas — public: anyone can see pending offers on
              this card (amount + buyer name), so buyers know what it takes
              to compete instead of bidding blind. Completed sales
              (accepted/buy-now) aren't "offers" anymore — they show in
              "Actividad de la carta" below instead. Hidden entirely (for
              everyone, including the seller) when there's nothing pending,
              same as the activity section below. */}
          {pendingCardOffers.length > 0 && (
            <motion.div custom={7.5} variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
                Ofertas recibidas
              </p>
              <div className="space-y-2">
                {pendingCardOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {offer.buyer?.username ?? "Comprador"}
                      </p>
                      <p className="text-[11px] text-gray-600">
                        {new Date(offer.created_at).toLocaleDateString("es-DO", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono text-sm font-bold text-white">
                        {formatPrice(offer.offer_price)}
                      </p>
                      <span
                        className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${OFFER_STATUS_BADGE[offer.status]}`}
                      >
                        {OFFER_STATUS_LABEL[offer.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Offer modal */}
          <AnimatePresence>
            {showOfferModal && (
              <motion.div
                key="offer-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget) setShowOfferModal(false); }}
              >
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 40, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="w-full max-w-md bg-[#111] border border-white/[0.09] rounded-3xl p-6 space-y-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-white">Hacer una oferta</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{card.card_name}{card.set_name ? ` · ${card.set_name}` : ""}</p>
                    </div>
                    <button type="button" onClick={() => setShowOfferModal(false)} className="text-gray-600 hover:text-white transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleMakeOffer} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">
                        Tu oferta (RD$)
                        {card.price_usd && (
                          <span className="text-gray-600 font-normal ml-1">
                            — precio de lista: {formatPrice(card.price_usd)}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">RD$</span>
                        <input
                          type="number"
                          value={offerPrice}
                          onChange={(e) => setOfferPrice(e.target.value)}
                          placeholder="0"
                          min="1"
                          step="1"
                          autoFocus
                          required
                          className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-brand rounded-lg py-3.5 pl-12 pr-4 text-white text-sm font-mono outline-none focus:ring-1 focus:ring-brand/20 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">
                        Mensaje (opcional)
                      </label>
                      <textarea
                        value={offerMessage}
                        onChange={(e) => setOfferMessage(e.target.value)}
                        placeholder="¿Algo que el vendedor deba saber?"
                        rows={3}
                        maxLength={280}
                        className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-brand rounded-lg py-3 px-4 text-white text-sm outline-none focus:ring-1 focus:ring-brand/20 transition-all resize-none placeholder:text-gray-600"
                      />
                    </div>

                    {ctaError && <p className="text-red-400 text-xs">{ctaError}</p>}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => { setShowOfferModal(false); setCtaError(""); }}
                        className="flex-1 border border-white/[0.09] text-gray-500 hover:text-white text-sm font-medium py-3.5 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || !offerPrice}
                        className="flex-1 bg-brand text-black text-sm font-bold py-3.5 rounded-lg hover:bg-[#00c64b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar oferta"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Seller ── */}
          <motion.div
            custom={8}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl mb-9 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[11px] font-bold text-gray-400 flex-shrink-0">
                {sellerName.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                  Vendedor
                </p>
                <p className="text-sm font-semibold text-white truncate">
                  {isSeller ? "Tú" : sellerName}
                </p>
              </div>
              {sellerRating && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-bold text-white">
                    {sellerRating.avg != null ? sellerRating.avg.toFixed(1) : "—"}
                  </span>
                  <span className="text-[10px] text-gray-600">({sellerRating.count})</span>
                </div>
              )}
            </div>

            {/* Review form for buyers with completed deals */}
            {currentUserId && !isSeller && (
              <div className="border-t border-white/[0.05] px-4 py-3">
                {reviewDone ? (
                  <p className="text-[11px] text-brand font-medium">Reseña enviada. ¡Gracias!</p>
                ) : showReviewForm ? (
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-5 h-5 transition-colors ${
                              star <= reviewRating ? "text-yellow-400 fill-yellow-400" : "text-gray-700"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Comentario opcional..."
                      rows={2}
                      maxLength={200}
                      className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg py-2 px-3 text-xs text-white placeholder:text-gray-600 outline-none focus:border-gray-600 resize-none"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowReviewForm(false)} className="text-xs text-gray-500 hover:text-white transition-colors">Cancelar</button>
                      <button type="submit" disabled={submittingReview} className="text-xs font-bold text-brand hover:underline disabled:opacity-50">
                        {submittingReview ? "Enviando..." : "Enviar reseña"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(true)}
                    className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    + Dejar reseña al vendedor
                  </button>
                )}
              </div>
            )}
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

            {cardActivity.length > 0 && (
              <AccordionItem
                title="Actividad de la carta"
                isOpen={openSection === "actividad"}
                onToggle={() => toggle("actividad")}
                index={10}
              >
                <div className="divide-y divide-white/[0.04]">
                  {cardActivity.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-3 px-5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {entry.sellerName} → {entry.buyerName}
                        </p>
                        <p className="text-[11px] text-gray-600">
                          {new Date(entry.date).toLocaleDateString("es-DO", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {entry.isBuyNow ? " · Compra directa" : " · Oferta aceptada"}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono text-sm font-bold text-white">
                          {formatPrice(entry.priceUsd)}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 mt-0.5 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                            entry.status === "hold"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-gray-800 text-gray-400"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[entry.status]}`}
                          />
                          {STATUS_LABEL[entry.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionItem>
            )}

            {card.notes && (
              <AccordionItem
                title="Notas del vendedor"
                isOpen={openSection === "notas"}
                onToggle={() => toggle("notas")}
                index={11}
              >
                <p className="px-5 py-4 text-sm text-gray-400 leading-relaxed">
                  {card.notes}
                </p>
              </AccordionItem>
            )}
          </div>
        </div>
      </div>

      <Footer compact />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        isDark
      />
    </div>
  );
}

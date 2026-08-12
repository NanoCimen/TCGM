"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Package, TrendingUp, Wallet } from "lucide-react";
import { OfferCard, formatDOP, type OfferWithDetails } from "./MyCardsDashboard";
import { DashboardPageContainer, DashboardPageHeader } from "./DashboardPageShell";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("es-DO", { day: "numeric", month: "short" }).format(
    new Date(iso)
  );
}

export default function ActividadPage({
  avatarUrl,
  initials,
  userId,
  asSellerOffers,
  asBuyerOffers,
}: {
  avatarUrl: string | null;
  initials: string;
  userId: string;
  asSellerOffers: OfferWithDetails[];
  asBuyerOffers: OfferWithDetails[];
}) {
  const router = useRouter();

  // Merge: seller perspective takes priority over buyer for same offer id
  const sellerIds = new Set(asSellerOffers.map((o) => o.id));
  const allOffers = [
    ...asSellerOffers.map((o) => ({ offer: o, role: "seller" as const })),
    ...asBuyerOffers
      .filter((o) => !sellerIds.has(o.id))
      .map((o) => ({ offer: o, role: "buyer" as const })),
  ].sort(
    (a, b) =>
      new Date(b.offer.responded_at ?? b.offer.created_at).getTime() -
      new Date(a.offer.responded_at ?? a.offer.created_at).getTime()
  );

  const soldUsd = asSellerOffers
    .filter((o) => o.cards?.price_usd)
    .reduce((sum, o) => sum + (o.offer_price ?? 0), 0);

  async function handleOfferAction(
    offerId: string,
    status: "accepted" | "declined" | "cancelled"
  ) {
    await fetch(`/api/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function handleMarkSold(cardId: string) {
    const res = await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sold" }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      console.error("handleMarkSold:", json?.error ?? res.statusText);
      return;
    }
    router.refresh();
  }

  const stats = [
    {
      label: "Total transacciones",
      value: String(allOffers.length),
      icon: Package,
    },
    {
      label: "Vendidas",
      value: String(asSellerOffers.length),
      icon: TrendingUp,
    },
    {
      label: "Recaudado",
      value: soldUsd > 0 ? formatDOP(soldUsd) : "—",
      icon: Wallet,
    },
  ];

  return (
    <DashboardPageContainer>
      <DashboardPageHeader
        avatarUrl={avatarUrl}
        initials={initials}
        title="Actividad"
        subtitle="Tus transacciones completadas"
      />

      {/* Summary stats */}
      {allOffers.length > 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={fadeInUp}
              transition={{ duration: 0.4, ease }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
                <s.icon className="w-[18px] h-[18px]" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xl font-bold text-white leading-tight truncate">
                  {s.value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-0.5">
                  {s.label}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {allOffers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mb-5">
            <Package className="w-7 h-7 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="text-base font-bold text-gray-400 mb-2">Sin actividad aún</p>
          <p className="text-sm text-gray-600 max-w-xs leading-relaxed">
            Las transacciones completadas aparecerán aquí.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-5"
        >
          {allOffers.map(({ offer, role }) => (
            <motion.div key={offer.id} variants={fadeInUp} transition={{ duration: 0.4, ease }}>
              <div className="flex items-center justify-between mb-1.5 px-1">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  {role === "seller" ? (
                    <ArrowUpRight className="w-3 h-3 text-brand" strokeWidth={2.5} />
                  ) : (
                    <ArrowDownLeft className="w-3 h-3 text-cyan-400" strokeWidth={2.5} />
                  )}
                  {role === "seller" ? "Vendiste" : "Compraste"}
                </p>
                <p className="text-[10px] font-medium text-gray-600">
                  {formatShortDate(offer.responded_at ?? offer.created_at)}
                </p>
              </div>
              <OfferCard
                offer={offer}
                role={role}
                onAction={handleOfferAction}
                onMarkSold={handleMarkSold}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </DashboardPageContainer>
  );
}

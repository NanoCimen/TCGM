"use client";

import { useRouter } from "next/navigation";
import { OfferCard, formatDOP, type OfferWithDetails } from "./MyCardsDashboard";

export default function ActividadPage({
  userId,
  asSellerOffers,
  asBuyerOffers,
}: {
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
    await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sold" }),
    });
    router.refresh();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-white mb-1">Actividad</h1>
        <p className="text-sm text-gray-500">Tus transacciones completadas</p>
      </div>

      {/* Summary stats */}
      {allOffers.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Total transacciones", value: String(allOffers.length) },
            { label: "Vendidas", value: String(asSellerOffers.length) },
            {
              label: "Recaudado",
              value: soldUsd > 0 ? formatDOP(soldUsd) : "—",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#0d0d0d] border border-gray-800 rounded-2xl p-4"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                {s.label}
              </p>
              <p className="text-base font-black text-white leading-tight">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {allOffers.length === 0 ? (
        <div className="text-center py-20">
          <h3 className="text-xl font-extrabold text-white mb-2">Sin actividad aún</h3>
          <p className="text-sm text-gray-500">
            Las transacciones completadas aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allOffers.map(({ offer, role }) => (
            <div key={offer.id}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5 px-1">
                {role === "seller" ? "Vendiste" : "Compraste"}
              </p>
              <OfferCard
                offer={offer}
                role={role}
                onAction={handleOfferAction}
                onMarkSold={handleMarkSold}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

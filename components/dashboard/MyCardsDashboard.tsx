"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckCheck, Loader2, MessageCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import DashboardShell, { Avatar } from "./DashboardShell";
import CardThumbnail from "@/components/marketplace/CardThumbnail";
import { formatPrice, USD_TO_DOP } from "@/lib/marketplace/utils";
import { openOfferAcceptedWhatsApp } from "@/lib/marketplace/whatsapp";

export type DashboardCard = {
  id: string;
  card_name: string;
  set_name: string | null;
  image_url: string | null;
  official_image_url: string | null;
  price_usd: number | null;
  status: string;
  created_at: string;
};

export type OfferWithDetails = {
  id: string;
  card_id: string;
  offer_price: number;
  message: string | null;
  status: "pending" | "accepted" | "declined" | "cancelled";
  is_buy_now: boolean;
  created_at: string;
  responded_at: string | null;
  cards: {
    id: string;
    card_name: string;
    set_name: string | null;
    image_url: string | null;
    official_image_url: string | null;
    price_usd: number | null;
  } | null;
  buyer: { id: string; display_name: string | null } | null;
  seller: { id: string; display_name: string | null } | null;
};

type TabKey = "coleccion" | "ofertas-recibidas" | "ofertas-hechas" | "actividad";

type PublishModalData = { cardId: string; cardName: string; priceUsd: number | null };
type DeleteModalData = { cardId: string; cardName: string };

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center py-16">
      <h3 className="text-xl font-extrabold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Portafolio",
  available: "Disponible",
  sold: "Vendida",
  hold: "Reservada",
};

const STATUS_DOT: Record<string, string> = {
  draft: "bg-gray-500",
  available: "bg-green-400",
  sold: "bg-red-400",
  hold: "bg-amber-400",
};

const OFFER_STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  accepted: "bg-brand/10 text-brand border border-brand/20",
  declined: "bg-red-500/10 text-red-400 border border-red-500/20",
  cancelled: "bg-gray-800 text-gray-500",
};

const OFFER_STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  declined: "Rechazada",
  cancelled: "Cancelada",
};

function formatDOP(usd: number): string {
  const dop = usd * USD_TO_DOP;
  return `RD$${dop.toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function OfferCard({
  offer,
  role,
  onAction,
  onMarkSold,
}: {
  offer: OfferWithDetails;
  role: "seller" | "buyer";
  onAction: (offerId: string, status: "accepted" | "declined" | "cancelled") => Promise<void>;
  onMarkSold: (cardId: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState<"accepted" | "declined" | "cancelled" | null>(null);
  const [markingSold, setMarkingSold] = useState(false);
  const card = offer.cards;
  const counterpart =
    role === "seller" ? offer.buyer : offer.seller;

  async function handle(status: "accepted" | "declined" | "cancelled") {
    setLoading(status);
    await onAction(offer.id, status);
    setLoading(null);
  }

  return (
    <div className="bg-[#111] border border-gray-800 rounded-2xl p-4 flex gap-4">
      {/* Card thumbnail */}
      {card && (
        <Link href={`/cards/${card.id}`} className="flex-shrink-0">
          <div className="w-14 h-20 rounded-lg overflow-hidden bg-gray-900">
            <CardThumbnail
              src={card.official_image_url ?? card.image_url}
              alt={card.card_name}
              className="w-full h-full"
            />
          </div>
        </Link>
      )}

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {card?.card_name ?? "Carta eliminada"}
            </p>
            {card?.set_name && (
              <p className="text-[11px] text-gray-500 truncate">{card.set_name}</p>
            )}
          </div>
          <span
            className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${OFFER_STATUS_BADGE[offer.status]}`}
          >
            {offer.is_buy_now && offer.status === "accepted"
              ? "Compra directa"
              : OFFER_STATUS_LABEL[offer.status]}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="font-mono font-bold text-white">
            {formatDOP(offer.offer_price)}
          </span>
          {card?.price_usd && offer.offer_price !== card.price_usd && (
            <span className="text-[11px] text-gray-600">
              lista: {formatPrice(card.price_usd)}
            </span>
          )}
        </div>

        {counterpart && (
          <p className="text-[11px] text-gray-500">
            {role === "seller" ? "Comprador" : "Vendedor"}:{" "}
            <span className="text-gray-300 font-medium">
              {counterpart.display_name ?? "Usuario"}
            </span>
          </p>
        )}

        {offer.message && (
          <p className="text-[11px] text-gray-500 italic line-clamp-2">
            "{offer.message}"
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1 flex-wrap">
          {offer.status === "pending" && role === "seller" && (
            <>
              <button
                type="button"
                onClick={() => handle("accepted")}
                disabled={!!loading}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-brand text-black hover:bg-[#00c64b] transition-colors disabled:opacity-50"
              >
                {loading === "accepted" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Aceptar
              </button>
              <button
                type="button"
                onClick={() => handle("declined")}
                disabled={!!loading}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-900/60 text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-50"
              >
                {loading === "declined" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                Rechazar
              </button>
            </>
          )}

          {offer.status === "pending" && role === "buyer" && (
            <button
              type="button"
              onClick={() => handle("cancelled")}
              disabled={!!loading}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
            >
              {loading === "cancelled" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <X className="w-3 h-3" />
              )}
              Cancelar oferta
            </button>
          )}

          {offer.status === "accepted" && role === "seller" && card && (
            <>
              <button
                type="button"
                onClick={() =>
                  openOfferAcceptedWhatsApp({
                    cardName: card.card_name,
                    setName: card.set_name,
                    buyerName: offer.buyer?.display_name ?? "el comprador",
                    priceUsd: offer.offer_price,
                  })
                }
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp comprador
              </button>
              {card.price_usd !== null /* card still exists */ && (
                <button
                  type="button"
                  disabled={markingSold}
                  onClick={async () => {
                    setMarkingSold(true);
                    await onMarkSold(card.id);
                    setMarkingSold(false);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
                >
                  {markingSold ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3 h-3" />
                  )}
                  Confirmar entrega
                </button>
              )}
            </>
          )}

          {offer.status === "accepted" && role === "buyer" && card && (
            <Link
              href={`/cards/${card.id}`}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors"
            >
              Ver carta
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyCardsDashboard({
  displayName,
  email,
  avatarUrl,
  cards,
  receivedOffers,
  madeOffers,
  offerCountByCard = {},
}: {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  cards: DashboardCard[];
  receivedOffers: OfferWithDetails[];
  madeOffers: OfferWithDetails[];
  offerCountByCard?: Record<string, number>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("coleccion");

  const [publishModal, setPublishModal] = useState<PublishModalData | null>(null);
  const [publishPriceInput, setPublishPriceInput] = useState("");
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishModalError, setPublishModalError] = useState("");

  const [deleteModal, setDeleteModal] = useState<DeleteModalData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const name = displayName || email;
  const initials = name.substring(0, 2).toUpperCase();

  const drafts = cards.filter((c) => c.status === "draft");
  const available = cards.filter((c) => c.status === "available");
  const sold = cards.filter((c) => c.status === "sold");
  const held = cards.filter((c) => c.status === "hold");

  const portfolioUsd = [...drafts, ...available].reduce((sum, c) => sum + (c.price_usd ?? 0), 0);
  const soldUsd = sold.reduce((sum, c) => sum + (c.price_usd ?? 0), 0);

  const pendingReceived = receivedOffers.filter((o) => o.status === "pending").length;
  const pendingMade = madeOffers.filter((o) => o.status === "pending").length;

  const activityOffers = [
    ...receivedOffers.filter((o) => o.status === "accepted"),
    ...madeOffers.filter((o) => o.status === "accepted"),
  ].sort(
    (a, b) =>
      new Date(b.responded_at ?? b.created_at).getTime() -
      new Date(a.responded_at ?? a.created_at).getTime()
  );
  // Deduplicate by offer id (same offer appears in both received and made for the same user if they're both buyer and seller — shouldn't happen but guard anyway)
  const seen = new Set<string>();
  const activityUnique = activityOffers.filter((o) => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });

  const TABS: { key: TabKey; label: string; count?: number }[] = [
    { key: "coleccion", label: "Colección" },
    { key: "ofertas-recibidas", label: "Ofertas recibidas", count: pendingReceived || undefined },
    { key: "ofertas-hechas", label: "Ofertas hechas", count: pendingMade || undefined },
    { key: "actividad", label: "Actividad" },
  ];

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

  function openPublishModal(card: DashboardCard) {
    setPublishPriceInput(card.price_usd != null ? String(card.price_usd) : "");
    setPublishModalError("");
    setPublishModal({ cardId: card.id, cardName: card.card_name, priceUsd: card.price_usd });
  }

  async function handlePublishConfirm() {
    if (!publishModal) return;
    const priceUsd = parseFloat(publishPriceInput);
    if (!priceUsd || priceUsd <= 0) { setPublishModalError("Ingresa un precio válido"); return; }
    setPublishLoading(true);
    setPublishModalError("");
    try {
      const res = await fetch(`/api/cards/${publishModal.cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "available", price_usd: priceUsd }),
      });
      const json = await res.json();
      if (!res.ok) { setPublishModalError(json.error); return; }
      setPublishModal(null);
      router.refresh();
    } finally {
      setPublishLoading(false);
    }
  }

  async function handleDeleteCard() {
    if (!deleteModal) return;
    setDeleteLoading(true);
    try {
      await fetch(`/api/cards/${deleteModal.cardId}`, { method: "DELETE" });
      setDeleteModal(null);
      router.refresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <DashboardShell active="mis-cartas" avatarUrl={avatarUrl} initials={initials}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar
              avatarUrl={avatarUrl}
              initials={initials}
              sizeClass="w-14 h-14"
              textClass="text-lg"
            />
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight text-white truncate">
                {name}
              </h1>
              <p className="text-sm text-gray-500 truncate">{email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/perfil"
              className="flex items-center gap-2 bg-white text-black text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar perfil
            </Link>
            <Link
              href="/sell"
              className="flex items-center gap-2 bg-brand text-black text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-[#00c64b] transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Subir cartas
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-800 mb-8 overflow-x-auto">
          {TABS.map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 pb-3 text-sm font-bold tracking-tight whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  isActive
                    ? "text-white border-brand"
                    : "text-gray-500 border-transparent hover:text-white"
                }`}
              >
                {t.label}
                {t.count !== undefined && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand text-black min-w-[18px] text-center">
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Colección */}
        {tab === "coleccion" && (
          <>
            <div className="mb-10">
              {cards.length === 0 ? (
                <div className="h-36 rounded-2xl border border-gray-800 bg-[#0d0d0d] flex items-center justify-center">
                  <p className="text-sm text-gray-600">
                    Publica tu primera carta para ver estadísticas aquí.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    {
                      label: "Valor portafolio",
                      value: formatDOP(portfolioUsd),
                      sub: `$${portfolioUsd.toFixed(2)} USD`,
                    },
                    {
                      label: "En mercado",
                      value: String(available.length),
                      sub: available.length === 1 ? "carta" : "cartas",
                    },
                    {
                      label: "Vendidas",
                      value: String(sold.length),
                      sub: soldUsd > 0 ? formatDOP(soldUsd) : "—",
                    },
                    {
                      label: "Sin publicar",
                      value: String(drafts.length),
                      sub: drafts.length === 1 ? "en portafolio" : "en portafolio",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-[#0d0d0d] border border-gray-800 rounded-2xl p-4"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                        {stat.label}
                      </p>
                      <p className="text-lg font-black text-white leading-tight">
                        {stat.value}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{stat.sub}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cards.length === 0 ? (
              <EmptyState
                title="Tu portafolio está vacío"
                subtitle='Agrega cartas con el botón "Subir cartas" — tú decides cuáles publicar.'
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {cards.map((card) => {
                  const pendingOffers = offerCountByCard[card.id] ?? 0;
                  return (
                    <div
                      key={card.id}
                      className="bg-[#111] border border-gray-800 rounded-2xl p-3 hover:border-gray-700 transition-colors flex flex-col"
                    >
                      {/* Image — clicking goes to card detail */}
                      <Link href={`/cards/${card.id}`} className="block relative w-full aspect-[3/4] mb-3">
                        <CardThumbnail
                          src={card.image_url}
                          alt={card.card_name}
                          className="w-full h-full rounded-lg"
                        />
                        {card.official_image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={card.official_image_url}
                            alt={`${card.card_name} oficial`}
                            className="absolute bottom-1 right-1 w-10 h-14 object-cover rounded shadow-lg border border-gray-700 bg-gray-900"
                          />
                        )}
                        {/* Pending offers badge */}
                        {pendingOffers > 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-brand text-black text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                            {pendingOffers} oferta{pendingOffers > 1 ? "s" : ""}
                          </span>
                        )}
                      </Link>

                      <p className="font-bold text-sm text-white truncate">
                        {card.card_name}
                      </p>
                      <p className="text-[11px] font-mono text-gray-500 truncate mb-2">
                        {card.set_name ?? "—"}
                      </p>

                      <div className="flex items-center justify-between gap-1 mb-2">
                        <p className="font-mono text-sm font-bold text-white truncate">
                          {card.price_usd != null ? formatDOP(card.price_usd) : "—"}
                        </p>
                        <span className="flex-shrink-0 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[card.status] ?? "bg-gray-600"}`} />
                          {STATUS_LABEL[card.status] ?? card.status}
                        </span>
                      </div>

                      {/* Seller quick actions */}
                      <div className="flex gap-1.5 mt-auto pt-1 flex-wrap">
                        {/* Draft: publish + delete */}
                        {card.status === "draft" && (
                          <>
                            <button
                              type="button"
                              onClick={() => openPublishModal(card)}
                              className="flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 transition-colors truncate"
                            >
                              Publicar
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteModal({ cardId: card.id, cardName: card.card_name })}
                              className="text-[10px] py-1.5 px-2 rounded-lg border border-gray-800 text-gray-600 hover:text-red-400 hover:border-red-900/40 transition-colors flex-shrink-0"
                              title="Eliminar del portafolio"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        {/* Available: show pending offers or view link */}
                        {card.status === "available" && pendingOffers > 0 && (
                          <button
                            type="button"
                            onClick={() => setTab("ofertas-recibidas")}
                            className="flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 transition-colors truncate"
                          >
                            Ver ofertas
                          </button>
                        )}
                        {card.status === "available" && pendingOffers === 0 && (
                          <Link
                            href={`/cards/${card.id}`}
                            className="flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg border border-gray-800 text-gray-500 hover:text-white hover:border-gray-600 transition-colors text-center truncate"
                          >
                            Ver publicación
                          </Link>
                        )}
                        {/* Hold: confirm delivery */}
                        {card.status === "hold" && (
                          <button
                            type="button"
                            onClick={() => handleMarkSold(card.id)}
                            className="flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-colors truncate"
                          >
                            Confirmar entrega
                          </button>
                        )}
                        {/* Sold: option to remove from portfolio */}
                        {card.status === "sold" && (
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ cardId: card.id, cardName: card.card_name })}
                            className="flex-1 text-[10px] py-1.5 px-2 rounded-lg border border-gray-800 text-gray-600 hover:text-red-400 hover:border-red-900/40 transition-colors truncate flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Eliminar del portafolio
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Ofertas recibidas */}
        {tab === "ofertas-recibidas" && (
          <>
            {receivedOffers.length === 0 ? (
              <EmptyState
                title="No tienes ofertas recibidas"
                subtitle="Cuando alguien haga una oferta por tus cartas, la verás aquí."
              />
            ) : (
              <div className="space-y-3">
                {receivedOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    role="seller"
                    onAction={handleOfferAction}
                    onMarkSold={handleMarkSold}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Ofertas hechas */}
        {tab === "ofertas-hechas" && (
          <>
            {madeOffers.length === 0 ? (
              <EmptyState
                title="No has hecho ofertas"
                subtitle="Las ofertas que hagas por cartas de otros coleccionistas aparecerán aquí."
              />
            ) : (
              <div className="space-y-3">
                {madeOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    role="buyer"
                    onAction={handleOfferAction}
                    onMarkSold={handleMarkSold}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Actividad */}
        {tab === "actividad" && (
          <>
            {activityUnique.length === 0 ? (
              <EmptyState
                title="Sin actividad reciente"
                subtitle="Tus transacciones completadas aparecerán aquí."
              />
            ) : (
              <div className="space-y-3">
                {activityUnique.map((offer) => {
                  const isYourSale =
                    offer.seller?.id !== offer.buyer?.id &&
                    receivedOffers.some((r) => r.id === offer.id);
                  return (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      role={isYourSale ? "seller" : "buyer"}
                      onAction={handleOfferAction}
                      onMarkSold={handleMarkSold}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Publish modal */}
      {publishModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setPublishModal(null); } }}
        >
          <div
            className="w-full max-w-sm bg-[#111] border border-white/[0.09] rounded-3xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-white">Publicar al mercado</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{publishModal.cardName}</p>
              </div>
              <button type="button" onClick={() => setPublishModal(null)} className="text-gray-600 hover:text-white transition-colors flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">
                Tu precio de venta (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">$</span>
                <input
                  type="number"
                  value={publishPriceInput}
                  onChange={(e) => { setPublishPriceInput(e.target.value); setPublishModalError(""); }}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  autoFocus
                  className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-brand rounded-xl py-3.5 pl-8 pr-4 text-white text-sm font-mono outline-none focus:ring-1 focus:ring-brand/20 transition-all"
                />
              </div>
              {publishPriceInput && parseFloat(publishPriceInput) > 0 && (
                <p className="text-[11px] text-gray-500 font-mono mt-1.5">
                  {"~"} RD${(parseFloat(publishPriceInput) * 59).toLocaleString("es-DO", { maximumFractionDigits: 0 })}
                </p>
              )}
              {publishModalError && <p className="text-red-400 text-xs mt-1.5">{publishModalError}</p>}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPublishModal(null)}
                className="flex-1 border border-white/[0.09] text-gray-500 hover:text-white text-sm font-medium py-3.5 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={publishLoading || !publishPriceInput || parseFloat(publishPriceInput) <= 0}
                onClick={handlePublishConfirm}
                className="flex-1 bg-brand text-black text-sm font-bold py-3.5 rounded-xl hover:bg-[#00c64b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {publishLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publicar →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteModal(null); }}
        >
          <div
            className="w-full max-w-sm bg-[#111] border border-white/[0.09] rounded-3xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-900/40 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-base font-extrabold text-white">Eliminar del portafolio</h3>
              <p className="text-sm text-gray-500">
                ¿Eliminar <span className="text-white font-semibold">{deleteModal.cardName}</span> permanentemente?
              </p>
              <p className="text-xs text-gray-600">Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="flex-1 border border-white/[0.09] text-gray-500 hover:text-white text-sm font-medium py-3.5 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteCard}
                className="flex-1 border border-red-900/60 text-red-400 hover:bg-red-950/40 text-sm font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import DashboardShell, { Avatar } from "./DashboardShell";
import CardThumbnail from "@/components/marketplace/CardThumbnail";
import { USD_TO_DOP } from "@/lib/marketplace/utils";

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

type TabKey = "coleccion" | "ofertas-recibidas" | "ofertas-hechas" | "actividad";

const TABS: { key: TabKey; label: string; count?: number }[] = [
  { key: "coleccion", label: "Colección" },
  { key: "ofertas-recibidas", label: "Ofertas recibidas", count: 0 },
  { key: "ofertas-hechas", label: "Ofertas hechas", count: 0 },
  { key: "actividad", label: "Actividad" },
];

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center py-16">
      <h3 className="text-xl font-extrabold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  available: "Disponible",
  sold: "Vendida",
  hold: "Reservada",
};

const STATUS_DOT: Record<string, string> = {
  available: "bg-green-400",
  sold: "bg-red-400",
  hold: "bg-amber-400",
};

function formatDOP(usd: number): string {
  const dop = usd * USD_TO_DOP;
  return `RD$${dop.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function MyCardsDashboard({
  displayName,
  email,
  avatarUrl,
  cards,
}: {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  cards: DashboardCard[];
}) {
  const [tab, setTab] = useState<TabKey>("coleccion");

  const name = displayName || email;
  const initials = name.substring(0, 2).toUpperCase();

  const available = cards.filter((c) => c.status === "available");
  const sold = cards.filter((c) => c.status === "sold");
  const held = cards.filter((c) => c.status === "hold");

  const portfolioUsd = available.reduce((sum, c) => sum + (c.price_usd ?? 0), 0);
  const soldUsd = sold.reduce((sum, c) => sum + (c.price_usd ?? 0), 0);

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
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {tab === "coleccion" && (
          <>
            {/* Portfolio summary */}
            <div className="mb-10">
              {cards.length === 0 ? (
                <div className="h-36 rounded-2xl border border-gray-800 bg-[#0d0d0d] flex items-center justify-center">
                  <p className="text-sm text-gray-600">
                    Publica tu primera carta para ver estadísticas aquí.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-[#0d0d0d] border border-gray-800 rounded-2xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                      Valor portafolio
                    </p>
                    <p className="text-lg font-black text-white leading-tight">
                      {formatDOP(portfolioUsd)}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      ${portfolioUsd.toFixed(2)} USD
                    </p>
                  </div>
                  <div className="bg-[#0d0d0d] border border-gray-800 rounded-2xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                      Disponibles
                    </p>
                    <p className="text-lg font-black text-white leading-tight">
                      {available.length}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {available.length === 1 ? "carta" : "cartas"}
                    </p>
                  </div>
                  <div className="bg-[#0d0d0d] border border-gray-800 rounded-2xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                      Vendidas
                    </p>
                    <p className="text-lg font-black text-white leading-tight">
                      {sold.length}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {soldUsd > 0 ? formatDOP(soldUsd) : "—"}
                    </p>
                  </div>
                  <div className="bg-[#0d0d0d] border border-gray-800 rounded-2xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                      Reservadas
                    </p>
                    <p className="text-lg font-black text-white leading-tight">
                      {held.length}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {held.length === 1 ? "carta" : "cartas"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Collection grid */}
            {cards.length === 0 ? (
              <EmptyState
                title="Tu colección está vacía"
                subtitle="Cuando publiques cartas en el mercado, aparecerán aquí."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {cards.map((card) => (
                  <Link
                    key={card.id}
                    href={`/cards/${card.id}`}
                    className="bg-[#111] border border-gray-800 rounded-2xl p-3 hover:border-gray-600 transition-colors block"
                  >
                    {/* Photo stack — user photo + official art overlay */}
                    <div className="relative w-full aspect-[3/4] mb-3">
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
                    </div>

                    <p className="font-bold text-sm text-white truncate">
                      {card.card_name}
                    </p>
                    <p className="text-[11px] font-mono text-gray-500 truncate mb-2">
                      {card.set_name ?? "—"}
                    </p>
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-mono text-sm font-bold text-white truncate">
                        {card.price_usd != null ? formatDOP(card.price_usd) : "—"}
                      </p>
                      <span
                        className={`flex-shrink-0 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[card.status] ?? "bg-gray-600"}`}
                        />
                        {STATUS_LABEL[card.status] ?? card.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "ofertas-recibidas" && (
          <EmptyState
            title="No tienes ofertas recibidas"
            subtitle="Cuando alguien haga una oferta por tus cartas, la verás aquí."
          />
        )}

        {tab === "ofertas-hechas" && (
          <EmptyState
            title="No has hecho ofertas"
            subtitle="Las ofertas que hagas por cartas de otros coleccionistas aparecerán aquí."
          />
        )}

        {tab === "actividad" && (
          <EmptyState
            title="Sin actividad reciente"
            subtitle="Tus compras, ventas y ofertas aparecerán aquí."
          />
        )}
      </div>
    </DashboardShell>
  );
}

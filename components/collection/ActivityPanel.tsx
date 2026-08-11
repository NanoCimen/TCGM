"use client";

import CardThumbnail from "@/components/marketplace/CardThumbnail";
import { USD_TO_DOP } from "@/lib/marketplace/utils";
import type { SaleActivity } from "./PokemonCollectionPage";

function formatDOP(usd: number): string {
  return `RD$${(usd * USD_TO_DOP).toLocaleString("es-DO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function ActivityPanel({ sales }: { sales: SaleActivity[] }) {
  return (
    // Outer column stretches full height so the divider border reaches the
    // bottom; inner content sticks and scrolls independently.
    <aside className="hidden xl:block w-[380px] flex-shrink-0 border-l border-gray-800">
      <div className="sticky top-20 max-h-[calc(100vh-5rem)] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Actividad
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded">
            Ventas
          </span>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {sales.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-gray-600">
              Aún no hay actividad de ventas.
            </div>
          ) : (
            <div className="divide-y divide-gray-900">
              {sales.map((s) => (
                <div key={s.id} className="flex items-center gap-2.5 px-4 py-2.5">
                  <div className="w-7 h-10 flex-shrink-0 rounded overflow-hidden bg-gray-900">
                    <CardThumbnail src={s.cardImage} alt={s.cardName} className="w-full h-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{s.cardName}</p>
                    <p className="text-[10px] text-gray-500 truncate font-mono">
                      {s.sellerName} → {s.buyerName}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-mono font-bold text-white">{formatDOP(s.priceUsd)}</p>
                    <p className="text-[9px] text-gray-600 font-mono">{timeAgo(s.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

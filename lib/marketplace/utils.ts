import type { CardStatus } from "@/lib/supabase/types";

/** 1 USD ≈ X DOP — update here when the rate drifts */
export const USD_TO_DOP = 59;

/**
 * Convert a USD value to DOP and format as "RD$X,XXX.XX".
 * All prices in the DB are stored in USD (price_usd column).
 */
export function formatPrice(usd: number | null): string {
  if (usd == null) return "—";
  const dop = usd * USD_TO_DOP;
  return `RD$${dop.toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatVolume(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

export function statusLabel(status: CardStatus): string {
  switch (status) {
    case "draft":
      return "Portafolio";
    case "available":
      return "Disponible";
    case "hold":
      return "Reservada";
    case "sold":
      return "Vendida";
  }
}

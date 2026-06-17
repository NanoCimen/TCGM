import { USD_TO_DOP } from "./utils";

function toDOP(usd: number): string {
  const dop = usd * USD_TO_DOP;
  return `RD$${Math.round(dop).toLocaleString("es-DO")}`;
}

/** Called by the BUYER after a "buy now" — message goes to the seller */
export function openBuyNowWhatsApp(opts: {
  cardName: string;
  setName: string | null;
  sellerName: string;
  priceUsd: number;
}) {
  const price = toDOP(opts.priceUsd);
  const card = opts.setName
    ? `*${opts.cardName}* (${opts.setName})`
    : `*${opts.cardName}*`;
  const text =
    `¡Hola ${opts.sellerName}! 👋 Acabo de comprar tu carta ${card} en TCGRD al precio de lista (${price}).\n\n` +
    `¿Cuándo y dónde coordinamos la entrega?`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

/** Called by the SELLER after accepting an offer — message goes to the buyer */
export function openOfferAcceptedWhatsApp(opts: {
  cardName: string;
  setName: string | null;
  buyerName: string;
  priceUsd: number;
}) {
  const price = toDOP(opts.priceUsd);
  const card = opts.setName
    ? `*${opts.cardName}* (${opts.setName})`
    : `*${opts.cardName}*`;
  const text =
    `¡Hola ${opts.buyerName}! 👋 Acepté tu oferta de ${price} por mi carta ${card} en TCGRD 🎉\n\n` +
    `¿Cuándo y dónde coordinamos la entrega?`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

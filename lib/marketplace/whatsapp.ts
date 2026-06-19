import { USD_TO_DOP } from "./utils";

function toDOP(usd: number): string {
  const dop = usd * USD_TO_DOP;
  return `RD$${Math.round(dop).toLocaleString("es-DO")}`;
}

function waLink(phone: string | null | undefined, text: string): string {
  const digits = phone?.replace(/\D/g, "") ?? "";
  return digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Called by the BUYER after a "buy now" — message goes to the seller */
export function openBuyNowWhatsApp(opts: {
  cardName: string;
  setName: string | null;
  sellerName: string;
  sellerPhone?: string | null;
  priceUsd: number;
}) {
  const price = toDOP(opts.priceUsd);
  const card = opts.setName
    ? `*${opts.cardName}* (${opts.setName})`
    : `*${opts.cardName}*`;
  const text =
    `¡Hola ${opts.sellerName}! 👋 Acabo de comprar tu carta ${card} en TCGRD al precio de lista (${price}).\n\n` +
    `¿Cuándo y dónde coordinamos la entrega?`;
  window.open(waLink(opts.sellerPhone, text), "_blank");
}

/** Called by the SELLER after accepting an offer — message goes to the buyer */
export function openOfferAcceptedWhatsApp(opts: {
  cardName: string;
  setName: string | null;
  buyerName: string;
  buyerPhone?: string | null;
  priceUsd: number;
}) {
  const price = toDOP(opts.priceUsd);
  const card = opts.setName
    ? `*${opts.cardName}* (${opts.setName})`
    : `*${opts.cardName}*`;
  const text =
    `¡Hola ${opts.buyerName}! 👋 Acepté tu oferta de ${price} por mi carta ${card} en TCGRD 🎉\n\n` +
    `¿Cuándo y dónde coordinamos la entrega?`;
  window.open(waLink(opts.buyerPhone, text), "_blank");
}

/** Called by the BUYER after seller accepts — message goes to the seller */
export function openOfferAcceptedBuyerWhatsApp(opts: {
  cardName: string;
  setName: string | null;
  sellerName: string;
  sellerPhone?: string | null;
  priceUsd: number;
}) {
  const price = toDOP(opts.priceUsd);
  const card = opts.setName
    ? `*${opts.cardName}* (${opts.setName})`
    : `*${opts.cardName}*`;
  const text =
    `¡Hola ${opts.sellerName}! 👋 Vi que aceptaste mi oferta de ${price} por ${card} en TCGRD 🎉\n\n` +
    `¿Cuándo y dónde coordinamos la entrega?`;
  window.open(waLink(opts.sellerPhone, text), "_blank");
}

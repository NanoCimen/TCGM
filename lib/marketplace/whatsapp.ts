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

/**
 * Call this synchronously as the FIRST line of a click handler — before any
 * `await` — when that handler will eventually open a WhatsApp link once an
 * async call (e.g. POST /api/offers) finishes. Browsers only allow
 * window.open() to bypass the popup blocker when it happens inside the same
 * synchronous tick as the user gesture that triggered it; calling
 * window.open() *after* an awaited fetch (as openBuyNowWhatsApp used to do
 * on its own) breaks that chain and gets silently blocked — the offer still
 * gets created, but no WhatsApp tab ever appears and nothing errors.
 *
 * Pass the returned window into the `targetWindow` option of the open*
 * functions below once you have the real data; they'll navigate this
 * already-open tab instead of calling window.open() again. If the async
 * call fails, just call `.close()` on the returned window yourself.
 */
export function openWhatsAppPlaceholderTab(): Window | null {
  return window.open("", "_blank");
}

function go(url: string, targetWindow?: Window | null) {
  if (targetWindow) {
    targetWindow.location.href = url;
  } else {
    window.open(url, "_blank");
  }
}

/** Called by the BUYER after a "buy now" — message goes to the seller */
export function openBuyNowWhatsApp(opts: {
  cardName: string;
  setName: string | null;
  sellerName: string;
  sellerPhone?: string | null;
  priceUsd: number;
  targetWindow?: Window | null;
}) {
  const price = toDOP(opts.priceUsd);
  const card = opts.setName
    ? `*${opts.cardName}* (${opts.setName})`
    : `*${opts.cardName}*`;
  const text =
    `¡Hola ${opts.sellerName}! Acabo de comprar tu carta ${card} en TCGRD al precio de lista (${price}).\n\n` +
    `¿Cuándo y dónde coordinamos la entrega y el pago?`;
  go(waLink(opts.sellerPhone, text), opts.targetWindow);
}

/** Called by the SELLER after accepting an offer — message goes to the buyer */
export function openOfferAcceptedWhatsApp(opts: {
  cardName: string;
  setName: string | null;
  buyerName: string;
  buyerPhone?: string | null;
  priceUsd: number;
  targetWindow?: Window | null;
}) {
  const price = toDOP(opts.priceUsd);
  const card = opts.setName
    ? `*${opts.cardName}* (${opts.setName})`
    : `*${opts.cardName}*`;
  const text =
    `¡Hola ${opts.buyerName}! Acepté tu oferta de ${price} por mi carta ${card} en TCGRD.\n\n` +
    `¿Cuándo y dónde coordinamos la entrega y el pago?`;
  go(waLink(opts.buyerPhone, text), opts.targetWindow);
}

/** Called by the BUYER after seller accepts — message goes to the seller */
export function openOfferAcceptedBuyerWhatsApp(opts: {
  cardName: string;
  setName: string | null;
  sellerName: string;
  sellerPhone?: string | null;
  priceUsd: number;
  targetWindow?: Window | null;
}) {
  const price = toDOP(opts.priceUsd);
  const card = opts.setName
    ? `*${opts.cardName}* (${opts.setName})`
    : `*${opts.cardName}*`;
  const text =
    `¡Hola ${opts.sellerName}! Vi que aceptaste mi oferta de ${price} por ${card} en TCGRD.\n\n` +
    `¿Cuándo y dónde coordinamos la entrega y el pago?`;
  go(waLink(opts.sellerPhone, text), opts.targetWindow);
}

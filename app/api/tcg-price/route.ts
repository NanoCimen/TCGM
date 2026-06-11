import { searchCard, searchCards } from "@/lib/api/pokemon-tcg";
import {
  isTcggoConfigured,
  searchCardPrice,
  searchCardPrices,
  type TCGPriceResult,
} from "@/lib/api/tcggo";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const NULL_PRICE: TCGPriceResult = {
  tcgPlayerPrice: null,
  cardmarketLowest: null,
  cardmarket7d: null,
  displayPrice: null,
  displayCurrency: "USD",
  priceSource: "",
  psa10: null, psa9: null, psa8: null, psa7: null,
  psa10s: null, psa9s: null, psa8s: null, psa7s: null,
  cgc10: null, cgc9: null, cgc10s: null, cgc9s: null,
  bgs10: null, bgs10s: null,
  officialImage: null,
  tcggoUrl: null,
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const useTcggo = isTcggoConfigured();

  // Multi-result manual search: ?q=...
  const q = searchParams.get("q");
  if (q) {
    if (useTcggo) {
      const results = await searchCardPrices(q);
      return NextResponse.json({ results });
    }
    const results = await searchCards(q);
    return NextResponse.json({ results });
  }

  const cardName = searchParams.get("name") ?? searchParams.get("cardName");
  const cardNumber =
    searchParams.get("number") ?? searchParams.get("cardNumber") ?? undefined;
  const variant = searchParams.get("variant") ?? undefined;

  if (!cardName) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  if (useTcggo) {
    const result = await searchCardPrice(cardName, cardNumber, variant);
    return NextResponse.json(result ?? NULL_PRICE);
  }

  const card = await searchCard(cardName);

  if (!card) {
    return NextResponse.json(NULL_PRICE);
  }

  const fallback: TCGPriceResult = {
    ...NULL_PRICE,
    tcgPlayerPrice: card.marketPrice,
    displayPrice: card.marketPrice,
    displayCurrency: "USD",
    priceSource: card.marketPrice != null ? "TCGPlayer market price" : "",
    officialImage: card.imageUrl,
  };

  return NextResponse.json(fallback);
}

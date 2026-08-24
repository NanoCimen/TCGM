import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { card_id, offer_price, message, is_buy_now } = await req.json();

  if (!card_id || !offer_price || Number(offer_price) <= 0) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { data: card } = await supabase
    .from("cards")
    .select("id, status, seller_id, card_name, set_name, price_usd")
    .eq("id", card_id)
    .single();

  if (!card)
    return NextResponse.json({ error: "Carta no encontrada" }, { status: 404 });
  if (card.status !== "available")
    return NextResponse.json(
      { error: "Esta carta ya no está disponible" },
      { status: 409 }
    );
  if (card.seller_id === user.id)
    return NextResponse.json(
      { error: "No puedes comprar tu propia carta" },
      { status: 400 }
    );

  // Block duplicate pending offer from same buyer
  if (!is_buy_now) {
    const { data: existing } = await supabase
      .from("offers")
      .select("id")
      .eq("card_id", card_id)
      .eq("buyer_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing)
      return NextResponse.json(
        { error: "Ya tienes una oferta pendiente para esta carta" },
        { status: 409 }
      );
  }

  const isBuyNow = Boolean(is_buy_now);

  // Buy Now always charges the card's actual listed price — never the
  // client-supplied offer_price. Trusting the client here would let anyone
  // POST an arbitrary offer_price with is_buy_now:true and buy any card for
  // a penny, since this branch auto-accepts and puts the card on hold.
  if (isBuyNow && (card.price_usd == null || card.price_usd <= 0)) {
    return NextResponse.json(
      { error: "Esta carta no tiene un precio de venta válido" },
      { status: 400 }
    );
  }
  const finalPrice = isBuyNow ? card.price_usd! : Number(offer_price);

  const now = new Date().toISOString();

  if (isBuyNow) {
    // The status check above (card.status !== "available") is only a fast
    // path — it reads then acts, so N concurrent Buy Now requests for the
    // same card (rapid double/triple-click, a slow first request retried)
    // can all read "available" before any of them writes. That let every
    // one of them insert its own "accepted" offer, producing N duplicate
    // sales for one card in Actividad. Claiming the card with a conditional
    // UPDATE ... WHERE status = 'available' makes this atomic: Postgres
    // serializes concurrent updates to the same row, so only the first
    // request's WHERE clause still matches — every other one affects 0 rows
    // and is rejected here, before it ever creates an offer. Needs the
    // admin client since the buyer doesn't own the card row per RLS.
    const admin = createAdminClient();
    const { data: claimed, error: claimError } = await admin
      .from("cards")
      .update({ status: "hold" })
      .eq("id", card_id)
      .eq("status", "available")
      .select("id");

    if (claimError)
      return NextResponse.json({ error: claimError.message }, { status: 500 });
    if (!claimed || claimed.length === 0)
      return NextResponse.json(
        { error: "Esta carta ya no está disponible" },
        { status: 409 }
      );

    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .insert({
        card_id,
        buyer_id: user.id,
        seller_id: card.seller_id,
        offer_price: finalPrice,
        message: message?.trim() || null,
        is_buy_now: true,
        status: "accepted",
        responded_at: now,
      })
      .select("id")
      .single();

    if (offerError) {
      // We already claimed the card above — undo that so it doesn't get
      // stuck on "hold" with no accepted offer behind it.
      await admin.from("cards").update({ status: "available" }).eq("id", card_id);
      return NextResponse.json({ error: offerError.message }, { status: 500 });
    }

    const [{ error: declineError }] = await Promise.all([
      admin
        .from("offers")
        .update({ status: "declined", responded_at: now })
        .eq("card_id", card_id)
        .eq("status", "pending")
        .neq("id", offer.id),
      supabase.from("notifications").insert({
        user_id: card.seller_id,
        type: "buy_now",
        card_id,
        message: `¡Compra directa! Alguien compró tu carta "${card.card_name}" al precio de lista.`,
      }),
    ]);

    if (declineError) {
      return NextResponse.json({ error: declineError.message }, { status: 500 });
    }

    return NextResponse.json({ offer_id: offer.id, is_buy_now: true });
  }

  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .insert({
      card_id,
      buyer_id: user.id,
      seller_id: card.seller_id,
      offer_price: finalPrice,
      message: message?.trim() || null,
      is_buy_now: false,
      status: "pending",
      responded_at: null,
    })
    .select("id")
    .single();

  if (offerError)
    return NextResponse.json({ error: offerError.message }, { status: 500 });

  await supabase.from("notifications").insert({
    user_id: card.seller_id,
    type: "offer_received",
    card_id,
    message: `Nueva oferta por tu carta "${card.card_name}".`,
  });

  return NextResponse.json({ offer_id: offer.id, is_buy_now: false });
}

import { createClient } from "@/lib/supabase/server";
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
  const now = new Date().toISOString();

  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .insert({
      card_id,
      buyer_id: user.id,
      seller_id: card.seller_id,
      offer_price: Number(offer_price),
      message: message?.trim() || null,
      is_buy_now: isBuyNow,
      status: isBuyNow ? "accepted" : "pending",
      responded_at: isBuyNow ? now : null,
    })
    .select("id")
    .single();

  if (offerError)
    return NextResponse.json({ error: offerError.message }, { status: 500 });

  if (isBuyNow) {
    // Put card on hold and close all other pending offers
    await Promise.all([
      supabase.from("cards").update({ status: "hold" }).eq("id", card_id),
      supabase
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
  } else {
    await supabase.from("notifications").insert({
      user_id: card.seller_id,
      type: "offer_received",
      card_id,
      message: `Nueva oferta por tu carta "${card.card_name}".`,
    });
  }

  return NextResponse.json({ offer_id: offer.id, is_buy_now: isBuyNow });
}

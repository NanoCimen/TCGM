import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type OfferStatus = "accepted" | "declined" | "cancelled";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { status }: { status: OfferStatus } = await req.json();
  if (!["accepted", "declined", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const { data: offer } = await supabase
    .from("offers")
    .select(
      "id, card_id, buyer_id, seller_id, offer_price, status, cards:card_id(card_name, set_name)"
    )
    .eq("id", params.id)
    .single<{
      id: string;
      card_id: string;
      buyer_id: string;
      seller_id: string;
      offer_price: number;
      status: string;
      cards: { card_name: string; set_name: string | null } | null;
    }>();

  if (!offer)
    return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 });
  if (offer.status !== "pending")
    return NextResponse.json(
      { error: "Esta oferta ya fue procesada" },
      { status: 409 }
    );

  // Permission checks
  if (status === "cancelled" && offer.buyer_id !== user.id)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (
    (status === "accepted" || status === "declined") &&
    offer.seller_id !== user.id
  )
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const now = new Date().toISOString();
  const cardName = offer.cards?.card_name ?? "la carta";

  if (status === "accepted") {
    // Same race as Buy Now (see app/api/offers/route.ts): if the seller has
    // two pending offers on one card and double-clicks Aceptar on both (or
    // clicks Aceptar twice on the same offer before the button disables),
    // both requests could otherwise pass "offer.status === pending" before
    // either writes, accepting two offers on a card that can only sell
    // once. Claim the card with a conditional UPDATE first — Postgres
    // serializes concurrent writes to the same row, so only one request's
    // WHERE status = 'available' still matches.
    const { data: claimed, error: claimError } = await supabase
      .from("cards")
      .update({ status: "hold" })
      .eq("id", offer.card_id)
      .eq("status", "available")
      .select("id");

    if (claimError)
      return NextResponse.json({ error: claimError.message }, { status: 500 });
    if (!claimed || claimed.length === 0)
      return NextResponse.json(
        { error: "Esta carta ya no está disponible" },
        { status: 409 }
      );

    const { error: updateError } = await supabase
      .from("offers")
      .update({ status, responded_at: now })
      .eq("id", params.id)
      .eq("status", "pending");

    if (updateError) {
      await supabase.from("cards").update({ status: "available" }).eq("id", offer.card_id);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await Promise.all([
      supabase
        .from("offers")
        .update({ status: "declined", responded_at: now })
        .eq("card_id", offer.card_id)
        .eq("status", "pending")
        .neq("id", params.id),
      supabase.from("notifications").insert({
        user_id: offer.buyer_id,
        type: "offer_accepted",
        card_id: offer.card_id,
        message: `¡Tu oferta por "${cardName}" fue aceptada! Coordina la entrega con el vendedor.`,
      }),
    ]);
  } else {
    const { error: updateError } = await supabase
      .from("offers")
      .update({ status, responded_at: now })
      .eq("id", params.id)
      .eq("status", "pending");

    if (updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 });

    if (status === "declined") {
      await supabase.from("notifications").insert({
        user_id: offer.buyer_id,
        type: "offer_declined",
        card_id: offer.card_id,
        message: `Tu oferta por "${cardName}" fue rechazada.`,
      });
    }
  }

  return NextResponse.json({ success: true, status });
}

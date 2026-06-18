import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sellerId = searchParams.get("seller_id");
  if (!sellerId) return NextResponse.json({ error: "seller_id required" }, { status: 400 });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, reviewer_id, card_id, reviewer:users!reviewer_id(display_name)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const reviews = data ?? [];
  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  return NextResponse.json({ reviews, avg, count: reviews.length });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { seller_id, card_id, rating, comment } = await req.json();

  if (!seller_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  if (seller_id === user.id) {
    return NextResponse.json({ error: "No puedes reseñarte a ti mismo" }, { status: 400 });
  }

  // Only allow reviews on completed (accepted) offers
  if (card_id) {
    const { data: offer } = await supabase
      .from("offers")
      .select("id")
      .eq("card_id", card_id)
      .eq("buyer_id", user.id)
      .eq("seller_id", seller_id)
      .in("status", ["accepted"])
      .maybeSingle();

    if (!offer) {
      return NextResponse.json(
        { error: "Solo puedes reseñar transacciones completadas" },
        { status: 403 }
      );
    }
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({ reviewer_id: user.id, seller_id, card_id: card_id ?? null, rating, comment: comment?.trim() || null })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ya enviaste una reseña para esta transacción" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review_id: data.id });
}

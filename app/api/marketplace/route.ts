import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const PAGE_SIZE = 24;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor"); // ISO timestamp of last card's created_at

  const supabase = await createClient();

  let query = supabase
    .from("cards")
    .select(
      `id, card_name, set_name, card_number, image_url, price_usd, tcg_market_price,
       status, created_at, variant, language, is_graded, grade, grade_company,
       users!seller_id ( display_name )`
    )
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    cards: data ?? [],
    hasMore: (data ?? []).length === PAGE_SIZE,
  });
}

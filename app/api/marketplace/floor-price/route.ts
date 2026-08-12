import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Lowest currently-listed price for a given card name (+ optional number),
// among available, ungraded listings — used to show sellers the real
// competitive floor instead of a generic "above market" flag.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim();
  const number = searchParams.get("number")?.trim();

  if (!name) {
    return NextResponse.json({ error: "Falta el nombre de la carta" }, { status: 400 });
  }

  const supabase = await createClient();

  let query = supabase
    .from("cards")
    .select("price_usd")
    .eq("status", "available")
    .eq("is_graded", false)
    .ilike("card_name", name)
    .not("price_usd", "is", null)
    .order("price_usd", { ascending: true })
    .limit(1);

  if (number) {
    query = query.eq("card_number", number);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ floorUsd: data?.[0]?.price_usd ?? null });
}

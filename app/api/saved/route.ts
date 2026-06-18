import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ saved: [] });

  const { data } = await supabase
    .from("saved_listings")
    .select("card_id")
    .eq("user_id", user.id);

  return NextResponse.json({ saved: (data ?? []).map((r) => r.card_id) });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { card_id } = await req.json();
  if (!card_id) return NextResponse.json({ error: "card_id required" }, { status: 400 });

  const { error } = await supabase
    .from("saved_listings")
    .insert({ user_id: user.id, card_id });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { card_id } = await req.json();
  if (!card_id) return NextResponse.json({ error: "card_id required" }, { status: 400 });

  await supabase
    .from("saved_listings")
    .delete()
    .eq("user_id", user.id)
    .eq("card_id", card_id);

  return NextResponse.json({ saved: false });
}

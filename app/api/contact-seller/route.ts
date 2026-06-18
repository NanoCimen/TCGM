import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { card_id, seller_id, message } = await req.json();

  if (!card_id || !seller_id || !message?.trim()) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  if (seller_id === user.id) {
    return NextResponse.json({ error: "No puedes contactarte a ti mismo" }, { status: 400 });
  }

  const msg = (message as string).trim().slice(0, 500);

  // Get buyer display name
  const { data: buyer } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .single<{ display_name: string | null }>();

  const buyerName = buyer?.display_name ?? "Un comprador";

  // Get card name
  const { data: card } = await supabase
    .from("cards")
    .select("card_name")
    .eq("id", card_id)
    .single<{ card_name: string }>();

  const { error } = await supabase.from("notifications").insert({
    user_id: seller_id,
    type: "buyer_message",
    card_id,
    message: `Mensaje de ${buyerName} sobre "${card?.card_name ?? "tu carta"}": ${msg}`,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sent: true });
}

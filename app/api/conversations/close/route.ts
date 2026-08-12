import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Hides a message thread from the caller's own "Mensajes" list. Per-user —
// doesn't touch the other participant's view, and a new message after this
// reopens the thread automatically (see closed_conversations table).
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { card_id, other_user_id } = await req.json();
  if (!card_id || !other_user_id) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { error } = await supabase.from("closed_conversations").upsert(
    {
      user_id: user.id,
      card_id,
      other_user_id,
      closed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,card_id,other_user_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

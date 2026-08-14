import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Hands a purchased card back into the normal sell flow: the buyer becomes
// the new seller_id and the card drops to "draft", exactly like a freshly
// uploaded card — so the existing "Publicar" modal (price + publish) takes
// over from here with no separate resell UI needed.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: card } = await supabase
    .from("cards")
    .select("id, seller_id, owner_id, status")
    .eq("id", params.id)
    .single();

  if (!card) {
    return NextResponse.json({ error: "Carta no encontrada" }, { status: 404 });
  }
  if (card.owner_id !== user.id || card.seller_id === user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (card.status !== "sold") {
    return NextResponse.json(
      { error: "Esta carta no está disponible para revender" },
      { status: 409 }
    );
  }

  // Reassigning seller_id to the buyer is a privileged cross-user write —
  // under the "sellers can update own cards" RLS policy, the buyer's own
  // session can't do this since they're not (yet) seller_id on this row.
  const admin = createAdminClient();
  const { error } = await admin
    .from("cards")
    .update({ seller_id: user.id, owner_id: null, status: "draft" })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

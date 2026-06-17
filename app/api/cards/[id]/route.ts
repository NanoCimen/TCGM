import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getOwnedCard(supabase: Awaited<ReturnType<typeof createClient>>, cardId: string, userId: string) {
  const { data: card } = await supabase
    .from("cards")
    .select("id, seller_id, status, image_url")
    .eq("id", cardId)
    .single();
  if (!card) return { card: null, error: NextResponse.json({ error: "Carta no encontrada" }, { status: 404 }) };
  if (card.seller_id !== userId) return { card: null, error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  return { card, error: null };
}

function extractStoragePath(imageUrl: string): string | null {
  const marker = "/storage/v1/object/public/card-images/";
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  return imageUrl.slice(idx + marker.length);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { status, price_usd } = body as { status: string; price_usd?: number };

  if (!["draft", "available", "hold", "sold"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  if (status === "available" && price_usd !== undefined) {
    if (typeof price_usd !== "number" || price_usd <= 0) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
    }
  }

  const { card, error: ownerErr } = await getOwnedCard(supabase, params.id, user.id);
  if (ownerErr) return ownerErr;

  const updateData: Record<string, unknown> = { status };
  if (status === "available" && price_usd !== undefined) {
    updateData.price_usd = price_usd;
  }

  const { error } = await supabase.from("cards").update(updateData).eq("id", card!.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // When pulling a card back to draft, cancel all its pending offers
  if (status === "draft") {
    await supabase
      .from("offers")
      .update({ status: "cancelled", responded_at: new Date().toISOString() })
      .eq("card_id", params.id)
      .eq("status", "pending");
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { card, error: ownerErr } = await getOwnedCard(supabase, params.id, user.id);
  if (ownerErr) return ownerErr;

  if (card!.status === "hold") {
    return NextResponse.json(
      { error: "No puedes retirar una carta con una transacción pendiente. Confirma la entrega primero." },
      { status: 409 }
    );
  }

  const imageUrl = card!.image_url as string | null;

  const { error } = await supabase.from("cards").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Clean up storage image (best-effort — don't fail the request if this errors)
  if (imageUrl) {
    const storagePath = extractStoragePath(imageUrl);
    if (storagePath) {
      await supabase.storage.from("card-images").remove([storagePath]);
    }
  }

  return NextResponse.json({ success: true });
}

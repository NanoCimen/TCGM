import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("card_id");
  const withUser = searchParams.get("with_user");

  if (!cardId || !withUser) {
    return NextResponse.json({ error: "Missing card_id or with_user" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, read, created_at")
    .eq("card_id", cardId)
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${withUser}),and(sender_id.eq.${withUser},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark received messages as read
  const unreadIds = (data ?? [])
    .filter((m) => m.receiver_id === user.id && !m.read)
    .map((m) => m.id);
  if (unreadIds.length > 0) {
    await supabase.from("messages").update({ read: true }).in("id", unreadIds);
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { card_id, receiver_id, content } = body;

  if (!card_id || !receiver_id || !content?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (content.trim().length > 1000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }
  if (receiver_id === user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      card_id,
      sender_id: user.id,
      receiver_id,
      content: content.trim(),
    })
    .select("id, sender_id, receiver_id, content, read, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

import { createClient } from "@/lib/supabase/server";
import { friendlyUniqueViolation } from "@/lib/supabase/profileErrors";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, string> = {};

  if (typeof body.display_name === "string") updates.display_name = body.display_name;
  if (typeof body.avatar_url === "string") updates.avatar_url = body.avatar_url;
  if (typeof body.banner_url === "string") updates.banner_url = body.banner_url;
  if (body.phone === null || typeof body.phone === "string") updates.phone = body.phone;
  if (typeof body.theme_color === "string") {
    if (!/^#[0-9a-fA-F]{6}$/.test(body.theme_color)) {
      return NextResponse.json({ error: "Color inválido" }, { status: 400 });
    }
    updates.theme_color = body.theme_color;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    const friendly = friendlyUniqueViolation(error);
    return NextResponse.json(
      { error: friendly ?? error.message },
      { status: friendly ? 409 : 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "No se pudo actualizar el perfil (0 filas afectadas)" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

import { createClient } from "@/lib/supabase/server";
import { friendlyUniqueViolation } from "@/lib/supabase/profileErrors";
import { NextResponse } from "next/server";

const USERNAME_CHANGE_LIMIT = 2;
const USERNAME_CHANGE_WINDOW_MONTHS = 6;

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, string | boolean | null> = {};

  // The new users row gets a placeholder username (email prefix) from the
  // signup trigger — the first time someone deliberately sets their real
  // username (onboarding/registration), it's free. Only a change after
  // that counts against the rate limit, tracked via username_claimed.
  let isRateLimitedChange = false;
  let previousUsername: string | null = null;

  if (typeof body.username === "string") {
    const trimmed = body.username.trim();
    if (trimmed.length < 2) {
      return NextResponse.json(
        { error: "El nombre de usuario debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }

    const { data: current, error: currentError } = await supabase
      .from("users")
      .select("username, username_claimed")
      .eq("id", user.id)
      .single();

    if (currentError || !current) {
      return NextResponse.json(
        { error: currentError?.message ?? "No se pudo leer el perfil actual" },
        { status: 500 }
      );
    }

    if (current.username !== trimmed) {
      previousUsername = current.username;

      if (current.username_claimed) {
        const windowStart = new Date();
        windowStart.setMonth(windowStart.getMonth() - USERNAME_CHANGE_WINDOW_MONTHS);

        const { data: recentChanges } = await supabase
          .from("username_changes")
          .select("changed_at")
          .eq("user_id", user.id)
          .gte("changed_at", windowStart.toISOString())
          .order("changed_at", { ascending: true });

        if (recentChanges && recentChanges.length >= USERNAME_CHANGE_LIMIT) {
          const retryAfter = new Date(recentChanges[0].changed_at);
          retryAfter.setMonth(retryAfter.getMonth() + USERNAME_CHANGE_WINDOW_MONTHS);
          const retryAfterLabel = retryAfter.toLocaleDateString("es-DO", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
          return NextResponse.json(
            {
              error: `Ya usaste tus ${USERNAME_CHANGE_LIMIT} cambios de nombre de usuario permitidos cada ${USERNAME_CHANGE_WINDOW_MONTHS} meses. Podrás cambiarlo de nuevo el ${retryAfterLabel}.`,
            },
            { status: 429 }
          );
        }

        isRateLimitedChange = true;
      }

      updates.username = trimmed;
      updates.username_claimed = true;
    }
  }

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

  // Best-effort — a failed history insert shouldn't fail the profile save.
  if (isRateLimitedChange && typeof updates.username === "string") {
    await supabase.from("username_changes").insert({
      user_id: user.id,
      old_username: previousUsername,
      new_username: updates.username,
    });
  }

  return NextResponse.json({ success: true });
}

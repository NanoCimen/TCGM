import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const oauthError = searchParams.get("error");

  // Supabase forwards expired/already-used recovery or confirmation links
  // here as `?error=...` instead of `?code=...` — no session to exchange.
  if (oauthError) {
    const reason = next === "/reset-password" ? "reset_expired" : "generic";
    return NextResponse.redirect(`${origin}/?authError=${reason}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const reason = next === "/reset-password" ? "reset_expired" : "generic";
    return NextResponse.redirect(`${origin}/?authError=${reason}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/`);
  }

  if (next) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Route new users (no username yet) through onboarding
  const { data: profile } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();

  if (!profile?.username) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  return NextResponse.redirect(`${origin}/`);
}

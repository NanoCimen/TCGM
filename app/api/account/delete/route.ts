import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Require the token to have been issued in the last few minutes — i.e. by
// the OTP verification the client just completed — so this route can't be
// triggered off an old, already-open session without re-proving access to
// the account's inbox.
const FRESH_SESSION_WINDOW_SECONDS = 5 * 60;

function tokenIssuedAt(accessToken: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64").toString("utf8")
    );
    return typeof payload.iat === "number" ? payload.iat : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // Read the access token straight from the client's verifyOtp() result
  // (sent as a Bearer header) rather than from cookies — verifyOtp syncing
  // its fresh session into cookies isn't guaranteed to finish before the
  // very next request, so a cookie-based read here could still see the
  // pre-verification session and reject a legitimate, just-verified code.
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!accessToken) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const issuedAt = tokenIssuedAt(accessToken);
  if (!issuedAt || Date.now() / 1000 - issuedAt > FRESH_SESSION_WINDOW_SECONDS) {
    return NextResponse.json(
      { error: "Verifica tu email de nuevo para continuar." },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Best-effort — the DB rows cascade from auth.users on delete, but
  // storage objects don't, so clean those up first.
  for (const bucket of ["card-images", "profiles"] as const) {
    const { data: files } = await admin.storage.from(bucket).list(user.id);
    if (files?.length) {
      await admin.storage
        .from(bucket)
        .remove(files.map((f) => `${user.id}/${f.name}`));
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

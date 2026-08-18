import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// For public, unauthenticated reads (marketplace listings, trending cards,
// sales activity) that don't need a user session. The cookie-based server
// client (lib/supabase/server.ts) calls cookies() from next/headers, and
// merely touching that API opts the whole route into fully dynamic
// rendering — silently defeating `export const revalidate` even on pages
// that never actually read a cookie value. RLS already grants these reads
// to the `anon` role (see supabase/migrations/20250608_public_marketplace_read.sql
// and the pending/accepted-offers migrations), so this client can serve
// them without ever touching cookies, keeping the route cacheable.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

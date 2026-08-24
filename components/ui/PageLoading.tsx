// Route-level loading fallback. Rendered by Next.js the instant a
// navigation to a data-fetching page starts (via the sibling loading.tsx
// files, or a page's own <Suspense fallback>), before that page's Server
// Component has resolved its data. Without this, the App Router shows
// nothing at all during that gap — and on a near-black theme (see
// app/globals.css) "nothing" reads as a fully black screen, which is what
// was happening when navigating into /dashboard, /wishlist, /actividad,
// /perfil, and /sell.
//
// This intentionally does NOT render DashboardShell (Navbar/sidebar) —
// the shell needs data (avatarUrl, email, theme) that only exists once the
// real page has loaded, so there's nothing to hydrate it with yet. A plain
// centered spinner on the app's background is the honest option here.
export default function PageLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div
        className="w-8 h-8 rounded-full border-2 border-white/10 border-t-brand animate-spin"
        role="status"
        aria-label="Cargando"
      />
    </div>
  );
}

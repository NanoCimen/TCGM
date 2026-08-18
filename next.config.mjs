/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // Seller-uploaded card photos.
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Official card art (lib/api/enrich-card.ts, Pokemon TCG API).
        protocol: "https",
        hostname: "images.pokemontcg.io",
      },
      {
        // Official card art (lib/api/tcggo.ts, TCGGO via RapidAPI).
        protocol: "https",
        hostname: "images.tcggo.com",
      },
    ],
  },
  experimental: {
    // Dashboard-family pages (perfil/dashboard/wishlist/actividad) read live,
    // frequently-edited user data — don't let the client router cache reuse
    // a stale snapshot when navigating back to a route visited earlier.
    staleTimes: { dynamic: 0 },
  },
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
  ],
};

export default nextConfig;

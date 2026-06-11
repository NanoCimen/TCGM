# TCGM — Pokemon Card Marketplace (RD)

Marketplace de cartas Pokemon para coleccionistas en Republica Dominicana.

## Stack

- **Next.js 14** (App Router) + PWA
- **Tailwind CSS**
- **Supabase** (Postgres, Auth, Storage)
- **Vercel** (hosting)

## Getting started

1. Copy env vars:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase project URL and anon key in `.env.local`.

3. Run the database schema in the Supabase SQL Editor:

   ```
   supabase/schema.sql
   ```

4. Enable **Phone** auth in Supabase Dashboard → Authentication → Providers.

5. Install and run:

   ```bash
   npm install
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/                  # Next.js App Router pages
  (auth)/             # Login, verify, onboarding
components/           # UI and auth components
lib/
  supabase/           # Supabase client (browser, server, middleware)
  api/                # External API helpers (Pokemon TCG API)
public/
  manifest.json       # PWA manifest
  sw.js               # Service worker
supabase/
  schema.sql          # Database schema + RLS policies
```

## PWA

The app registers a service worker and ships with `manifest.json`. Replace placeholder icons in `public/icons/` with your brand assets before production.

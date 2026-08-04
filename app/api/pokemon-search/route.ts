import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] });
  }

  // Escape apostrophes for the upstream Lucene-style parser (unescaped
  // apostrophes inside a quoted phrase intermittently 500 on their end,
  // e.g. searching "Ethan's Magcargo").
  const escaped = q.replace(/'/g, "\\'");
  const nameQuery = q.includes(" ")
    ? `name:"${escaped}"`
    : `name:${escaped}*`;

  const url = new URL("https://api.pokemontcg.io/v2/cards");
  url.searchParams.set("q", nameQuery);
  url.searchParams.set("pageSize", "24");
  url.searchParams.set("select", "id,name,number,set,images,rarity");
  url.searchParams.set("orderBy", "-set.releaseDate");

  const headers: Record<string, string> = process.env.POKEMON_TCG_API_KEY
    ? { "X-Api-Key": process.env.POKEMON_TCG_API_KEY }
    : {};

  // The upstream API intermittently 500s on otherwise-valid queries — retry
  // a couple of times before giving up.
  const MAX_ATTEMPTS = 4;
  let lastStatus = 0;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const res = await fetch(url.toString(), {
      headers,
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = await res.json();
      return NextResponse.json({ data: json.data ?? [] });
    }

    lastStatus = res.status;
    if (attempt < MAX_ATTEMPTS - 1) await new Promise((r) => setTimeout(r, 300));
  }

  return NextResponse.json(
    { data: [], error: "API unavailable" },
    { status: lastStatus >= 500 ? 502 : lastStatus }
  );
}

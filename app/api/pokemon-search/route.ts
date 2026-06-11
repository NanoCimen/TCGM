import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] });
  }

  // Use quoted phrase for multi-word, wildcard for single word
  const nameQuery = q.includes(" ")
    ? `name:"${q}"`
    : `name:${q}*`;

  const url = new URL("https://api.pokemontcg.io/v2/cards");
  url.searchParams.set("q", nameQuery);
  url.searchParams.set("pageSize", "24");
  url.searchParams.set("select", "id,name,number,set,images,rarity");
  url.searchParams.set("orderBy", "-set.releaseDate");

  const res = await fetch(url.toString(), {
    headers: process.env.POKEMON_TCG_API_KEY
      ? { "X-Api-Key": process.env.POKEMON_TCG_API_KEY }
      : {},
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return NextResponse.json({ data: [], error: "API unavailable" }, { status: 502 });
  }

  const json = await res.json();
  return NextResponse.json({ data: json.data ?? [] });
}

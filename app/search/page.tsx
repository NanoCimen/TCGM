import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import CardThumbnail from "@/components/marketplace/CardThumbnail";
import { formatPrice } from "@/lib/marketplace/utils";
import { LANGUAGE_FLAG, VARIANT_BADGE_STYLES } from "@/lib/cards/constants";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  card_name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string | null;
  official_image_url: string | null;
  price_usd: number | null;
  variant: string | null;
  language: string | null;
  is_graded: boolean | null;
  grade: string | null;
  grade_company: string | null;
  users: { username: string | null } | { username: string | null }[] | null;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; number?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const number = (searchParams.number ?? "").trim();

  let cards: Row[] = [];

  if (q) {
    const supabase = await createClient();
    let query = supabase
      .from("cards")
      .select(
        `id, card_name, set_name, card_number, image_url, official_image_url,
         price_usd, variant, language, is_graded, grade, grade_company,
         users!seller_id ( username )`
      )
      .eq("status", "available")
      .ilike("card_name", `%${q}%`)
      .order("price_usd", { ascending: true });

    if (number) query = query.eq("card_number", number);

    const { data } = await query;
    cards = (data as Row[]) ?? [];
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al mercado
        </Link>

        <h1 className="text-xl font-black tracking-tight text-white">
          {q ? `Publicaciones de "${q}"` : "Buscar en el mercado"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {q
            ? `${cards.length} ${cards.length === 1 ? "publicación disponible" : "publicaciones disponibles"} en TCGRD${number ? ` · #${number}` : ""}`
            : "Agrega ?q=nombre a la URL para buscar una carta."}
        </p>

        {q && cards.length === 0 && (
          <div className="mt-8 bg-[#111] border border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-sm text-gray-400">
              Nadie más tiene esta carta publicada todavía.
            </p>
            <Link
              href="/sell"
              className="inline-block mt-4 bg-brand text-black text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-[#00c64b] transition-colors"
            >
              Sé el primero en publicarla
            </Link>
          </div>
        )}

        {cards.length > 0 && (
          <div className="mt-6 bg-[#111] border border-gray-800 rounded-2xl divide-y divide-gray-800 overflow-hidden">
            {cards.map((card) => {
              const seller = Array.isArray(card.users) ? card.users[0] : card.users;
              return (
                <Link
                  key={card.id}
                  href={`/cards/${card.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-white/[0.03] transition-colors"
                >
                  <CardThumbnail
                    src={card.official_image_url ?? card.image_url}
                    alt={card.card_name}
                    className="w-12 h-16 rounded-lg border border-gray-800 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white truncate">
                      {card.card_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {card.set_name ?? "—"}
                      {card.card_number ? ` · ${card.card_number}` : ""}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {card.variant && card.variant !== "Regular" && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            VARIANT_BADGE_STYLES[card.variant] ??
                            "bg-gray-800 text-gray-400 border-gray-700"
                          }`}
                        >
                          {card.variant}
                        </span>
                      )}
                      <span className="text-[9px] font-bold text-gray-500">
                        {LANGUAGE_FLAG[card.language ?? "EN"] ?? "🌐"} {card.language ?? "EN"}
                      </span>
                      {card.is_graded && card.grade_company && card.grade && (
                        <span className="text-[9px] font-bold bg-yellow-400 text-black px-1.5 py-0.5 rounded">
                          {card.grade_company} {card.grade}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono font-bold text-sm text-white flex items-center gap-1 justify-end">
                      <Tag className="w-3 h-3 text-brand" />
                      {formatPrice(card.price_usd)}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                      {seller?.username ?? "Vendedor"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

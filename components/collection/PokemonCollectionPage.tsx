"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import CardThumbnail from "@/components/marketplace/CardThumbnail";
import { formatPrice, USD_TO_DOP } from "@/lib/marketplace/utils";
import {
  LANGUAGE_FLAG,
  LANGUAGES,
  VARIANTS,
  VARIANT_BADGE_STYLES,
  POKEMON_SETS,
} from "@/lib/cards/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CollectionCard = {
  id: string;
  card_name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string | null;
  official_image_url: string | null;
  price_usd: number | null;
  tcg_market_price: number | null;
  status: string;
  created_at: string;
  seller_id: string;
  seller_name: string;
  variant: string;
  language: string;
  is_graded: boolean;
  grade: string | null;
  grade_company: string | null;
};

export type CollectionStats = {
  floorPrice: number | null;
  listedCount: number;
  soldVolume: number;
  uniqueSellers: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// Groups cards that are "the same" listing (name + set + number + variant + language)
function cardKey(c: Pick<CollectionCard, "card_name" | "set_name" | "card_number" | "variant" | "language">): string {
  return [
    c.card_name.toLowerCase().trim(),
    (c.set_name ?? "").toLowerCase().trim(),
    (c.card_number ?? "").toLowerCase().trim(),
    c.variant.toLowerCase().trim(),
    c.language.toLowerCase().trim(),
  ].join("|");
}

function formatDOP(usd: number): string {
  return `RD$${(usd * USD_TO_DOP).toLocaleString("es-DO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

const STATUS_DOT: Record<string, string> = {
  available: "bg-green-400",
  hold: "bg-amber-400",
  sold: "bg-red-400",
};
const STATUS_LABEL: Record<string, string> = {
  available: "Disponible",
  hold: "Reservada",
  sold: "Vendida",
};

// ─── FilterSection ─────────────────────────────────────────────────────────────

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-800 py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
      >
        {title}
        {open ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>
      {open && <div className="mt-3 space-y-1.5">{children}</div>}
    </div>
  );
}

function CheckItem({
  label,
  checked,
  onChange,
  dot,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  dot?: string;
  count?: number;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
          checked
            ? "bg-brand border-brand"
            : "border-gray-700 group-hover:border-gray-500"
        }`}
      >
        {checked && (
          <svg
            className="w-2 h-2 text-black"
            viewBox="0 0 8 8"
            fill="currentColor"
          >
            <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        )}
      </span>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      )}
      <span className="text-xs text-gray-400 group-hover:text-white transition-colors flex-1 truncate">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[10px] text-gray-600 font-mono">{count}</span>
      )}
    </label>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
        {label}
      </span>
      <span className="text-sm font-mono font-bold text-white">{value}</span>
    </div>
  );
}

// ─── Card Table Row ────────────────────────────────────────────────────────────

function CardRow({
  card,
  index,
  currentUserId,
  onBuyClick,
  cardFloor,
}: {
  card: CollectionCard;
  index: number;
  currentUserId: string | null;
  onBuyClick: (id: string) => void;
  cardFloor: number | null;
}) {
  const isSold = card.status === "sold";
  const isOwn = currentUserId === card.seller_id;
  const canBuy = card.status === "available" && !isOwn;
  const isFloor = card.status === "available" && card.price_usd != null && cardFloor != null && card.price_usd <= cardFloor;
  const aboveFloor = card.status === "available" && card.price_usd != null && cardFloor != null && card.price_usd > cardFloor;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onBuyClick(card.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onBuyClick(card.id);
        }
      }}
      className="grid grid-cols-[2.5rem_1fr_110px_110px_100px_110px_70px_120px_56px] gap-3 px-4 py-2.5 items-center hover:bg-white/[0.03] transition-colors cursor-pointer group border-b border-gray-900 last:border-0"
    >
      {/* # */}
      <div className="text-center font-mono text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
        {index + 1}
      </div>

      {/* Card */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-11 flex-shrink-0 rounded overflow-hidden bg-gray-900">
          <CardThumbnail
            src={card.official_image_url ?? card.image_url}
            alt={card.card_name}
            className="w-full h-full"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate group-hover:text-brand transition-colors">
            {card.card_name}
          </p>
          <p className="text-[10px] text-gray-500 truncate font-mono">
            {card.set_name ?? "—"}
            {card.card_number ? ` · #${card.card_number}` : ""}
          </p>
        </div>
      </div>

      {/* Price */}
      <div className="text-right">
        <span
          className={`font-mono text-sm font-bold ${
            isSold ? "line-through text-gray-600" : "text-white"
          }`}
        >
          {card.price_usd != null ? formatDOP(card.price_usd) : "—"}
        </span>
        {card.price_usd != null && !isSold && (
          <p className="text-[10px] text-gray-600 font-mono">
            ${card.price_usd.toFixed(2)}
          </p>
        )}
        {isFloor && (
          <span className="inline-block text-[9px] font-bold text-brand bg-brand/10 border border-brand/20 px-1.5 py-px rounded mt-0.5">
            Floor
          </span>
        )}
        {aboveFloor && cardFloor != null && (
          <p className="text-[9px] text-gray-600 font-mono mt-0.5">
            floor {formatDOP(cardFloor)}
          </p>
        )}
      </div>

      {/* Buy / status */}
      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        {canBuy ? (
          <Link
            href={`/cards/${card.id}`}
            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-brand text-black hover:bg-[#00c64b] transition-colors whitespace-nowrap"
          >
            <Zap className="w-2.5 h-2.5" />
            Comprar
          </Link>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600">
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[card.status] ?? "bg-gray-600"}`} />
            {STATUS_LABEL[card.status] ?? card.status}
          </span>
        )}
      </div>

      {/* Market price */}
      <div className="text-right">
        <span className="font-mono text-xs text-gray-500">
          {card.tcg_market_price != null
            ? `$${card.tcg_market_price.toFixed(2)}`
            : "—"}
        </span>
      </div>

      {/* Variant */}
      <div>
        {card.variant !== "Regular" ? (
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
              VARIANT_BADGE_STYLES[card.variant] ??
              "bg-gray-800 text-gray-400 border-gray-700"
            }`}
          >
            {card.variant}
          </span>
        ) : (
          <span className="text-[10px] text-gray-600">Regular</span>
        )}
      </div>

      {/* Language */}
      <div className="text-center">
        <span className="text-sm" title={card.language}>
          {LANGUAGE_FLAG[card.language] ?? "🌐"}
        </span>
      </div>

      {/* Seller */}
      <div className="truncate">
        <span className="text-[11px] font-mono text-gray-400 truncate">
          {card.seller_name}
        </span>
      </div>

      {/* Listed */}
      <div className="text-right">
        <span className="text-[10px] font-mono text-gray-600">
          {timeAgo(card.created_at)}
        </span>
      </div>
    </div>
  );
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function MobileCardRow({
  card,
  index,
  currentUserId,
  onBuyClick,
  cardFloor,
}: {
  card: CollectionCard;
  index: number;
  currentUserId: string | null;
  onBuyClick: (id: string) => void;
  cardFloor: number | null;
}) {
  const isSold = card.status === "sold";
  const isOwn = currentUserId === card.seller_id;
  const canBuy = card.status === "available" && !isOwn;
  const isFloor = card.status === "available" && card.price_usd != null && cardFloor != null && card.price_usd <= cardFloor;
  const aboveFloor = card.status === "available" && card.price_usd != null && cardFloor != null && card.price_usd > cardFloor;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onBuyClick(card.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onBuyClick(card.id);
        }
      }}
      className="flex gap-3 p-3 border-b border-gray-900 hover:bg-white/[0.03] transition-colors cursor-pointer items-center group"
    >
      <span className="text-[10px] font-mono text-gray-600 w-5 text-center flex-shrink-0">
        {index + 1}
      </span>
      <div className="w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-900">
        <CardThumbnail
          src={card.official_image_url ?? card.image_url}
          alt={card.card_name}
          className="w-full h-full"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate group-hover:text-brand transition-colors">
          {card.card_name}
        </p>
        <p className="text-[10px] text-gray-500 font-mono truncate">
          {card.set_name ?? "—"}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {card.variant !== "Regular" && (
            <span
              className={`text-[9px] font-bold px-1 py-0.5 rounded border ${
                VARIANT_BADGE_STYLES[card.variant] ??
                "bg-gray-800 text-gray-400 border-gray-700"
              }`}
            >
              {card.variant}
            </span>
          )}
          <span className="text-[10px] text-gray-600 font-mono">
            {LANGUAGE_FLAG[card.language] ?? "🌐"} {card.language}
          </span>
          {card.is_graded && card.grade && (
            <span className="text-[9px] font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-1 py-0.5 rounded">
              {card.grade_company} {card.grade}
            </span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 text-right space-y-1">
        <p
          className={`font-mono text-sm font-bold ${
            isSold ? "line-through text-gray-600" : "text-white"
          }`}
        >
          {card.price_usd != null ? formatDOP(card.price_usd) : "—"}
        </p>
        {isFloor && (
          <span className="inline-block text-[9px] font-bold text-brand bg-brand/10 border border-brand/20 px-1.5 py-px rounded">
            Floor
          </span>
        )}
        {aboveFloor && cardFloor != null && (
          <p className="text-[9px] text-gray-600 font-mono">
            floor {formatDOP(cardFloor)}
          </p>
        )}
        {canBuy ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-brand text-black">
            <Zap className="w-2.5 h-2.5" />
            Comprar
          </span>
        ) : (
          <span className="flex items-center justify-end gap-1 text-[10px] text-gray-600">
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[card.status] ?? "bg-gray-600"}`} />
            {STATUS_LABEL[card.status] ?? card.status}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type SortKey = "recent" | "price_asc" | "price_desc" | "name";

export default function PokemonCollectionPage({
  cards,
  stats,
}: {
  cards: CollectionCard[];
  stats: CollectionStats;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(
    new Set(["available"])
  );
  const [variantFilter, setVariantFilter] = useState<Set<string>>(new Set());
  const [langFilter, setLangFilter] = useState<Set<string>>(new Set());
  const [setFilter, setSetFilter] = useState<Set<string>>(new Set());
  const [setNameSearch, setSetNameSearch] = useState("");
  const [gradedFilter, setGradedFilter] = useState<"all" | "graded" | "raw">("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) =>
      setUser(s?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleCardClick = useCallback(
    (id: string) => {
      router.push(`/cards/${id}`);
    },
    [router]
  );

  // Build counts per status for sidebar
  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of cards) {
      counts[c.status] = (counts[c.status] ?? 0) + 1;
    }
    return counts;
  }, [cards]);

  // Floor price per card group (only from available listings)
  const floorByCard = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of cards) {
      if (c.status !== "available" || c.price_usd == null) continue;
      const key = cardKey(c);
      if (map[key] == null || c.price_usd < map[key]) {
        map[key] = c.price_usd;
      }
    }
    return map;
  }, [cards]);

  // Variants and languages use full constants so all options always appear
  const presentVariants = [...VARIANTS];
  const presentLangs = LANGUAGES.map((l) => l.code);

  // Sets: predefined list first, then any unlisted sets from actual data appended
  const presentSets = useMemo(() => {
    const fromData = new Set(cards.map((c) => c.set_name).filter((s): s is string => !!s));
    const known = [...POKEMON_SETS];
    const extra = Array.from(fromData).filter((s) => !known.includes(s as never)).sort();
    return [...known, ...extra];
  }, [cards]);

  const filteredCards = useMemo(() => {
    let list = [...cards];

    // Status
    if (statusFilter.size > 0) {
      list = list.filter((c) => statusFilter.has(c.status));
    }

    // Variant
    if (variantFilter.size > 0) {
      list = list.filter((c) => variantFilter.has(c.variant));
    }

    // Language
    if (langFilter.size > 0) {
      list = list.filter((c) => langFilter.has(c.language));
    }

    // Set
    if (setFilter.size > 0) {
      list = list.filter((c) => c.set_name != null && setFilter.has(c.set_name));
    }

    // Graded
    if (gradedFilter === "graded") list = list.filter((c) => c.is_graded);
    if (gradedFilter === "raw") list = list.filter((c) => !c.is_graded);

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.card_name.toLowerCase().includes(q) ||
          c.set_name?.toLowerCase().includes(q) ||
          c.seller_name.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sort === "price_asc") list.sort((a, b) => (a.price_usd ?? 0) - (b.price_usd ?? 0));
    else if (sort === "price_desc") list.sort((a, b) => (b.price_usd ?? 0) - (a.price_usd ?? 0));
    else if (sort === "name") list.sort((a, b) => a.card_name.localeCompare(b.card_name));
    else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return list;
  }, [cards, statusFilter, variantFilter, langFilter, setFilter, gradedFilter, search, sort]);

  function toggleSet<T>(set: Set<T>, val: T): Set<T> {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    return next;
  }

  const SidebarContent = (
    <div className="space-y-0 text-sm">
      <FilterSection title="Estado">
        {(["available", "hold", "sold"] as const).map((s) => (
          <CheckItem
            key={s}
            label={STATUS_LABEL[s]}
            checked={statusFilter.has(s)}
            onChange={() => setStatusFilter((prev) => toggleSet(prev, s))}
            dot={STATUS_DOT[s]}
            count={countByStatus[s] ?? 0}
          />
        ))}
      </FilterSection>

      <FilterSection title="Variante" defaultOpen={false}>
        {presentVariants.map((v) => (
          <CheckItem
            key={v}
            label={v}
            checked={variantFilter.has(v)}
            onChange={() => setVariantFilter((prev) => toggleSet(prev, v))}
          />
        ))}
      </FilterSection>

      <FilterSection title="Idioma" defaultOpen={false}>
        {LANGUAGES.map((l) => (
          <CheckItem
            key={l.code}
            label={`${l.flag} ${l.label}`}
            checked={langFilter.has(l.code)}
            onChange={() => setLangFilter((prev) => toggleSet(prev, l.code))}
          />
        ))}
      </FilterSection>

      <FilterSection title="Set" defaultOpen={false}>
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
          <input
            type="text"
            value={setNameSearch}
            onChange={(e) => setSetNameSearch(e.target.value)}
            placeholder="Buscar set..."
            className="w-full bg-gray-900 border border-gray-800 rounded-md py-1 pl-6 pr-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-gray-600 transition-colors"
          />
          {setNameSearch && (
            <button
              type="button"
              onClick={() => setSetNameSearch("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
        {presentSets
          .filter((s) => s.toLowerCase().includes(setNameSearch.toLowerCase()))
          .map((s) => (
            <CheckItem
              key={s}
              label={s}
              checked={setFilter.has(s)}
              onChange={() => setSetFilter((prev) => toggleSet(prev, s))}
            />
          ))}
      </FilterSection>

      <FilterSection title="Condición" defaultOpen={false}>
        {(["all", "graded", "raw"] as const).map((g) => (
          <label key={g} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="graded"
              checked={gradedFilter === g}
              onChange={() => setGradedFilter(g)}
              className="sr-only"
            />
            <span
              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                gradedFilter === g
                  ? "border-brand"
                  : "border-gray-700 group-hover:border-gray-500"
              }`}
            >
              {gradedFilter === g && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand block" />
              )}
            </span>
            <span className="text-xs text-gray-400 group-hover:text-white transition-colors capitalize">
              {g === "all" ? "Todo" : g === "graded" ? "Clasificada" : "Sin clasificar"}
            </span>
          </label>
        ))}
      </FilterSection>

      {(statusFilter.size > 0 || variantFilter.size > 0 || langFilter.size > 0 || setFilter.size > 0 || gradedFilter !== "all") && (
        <button
          type="button"
          onClick={() => {
            setStatusFilter(new Set(["available"]));
            setVariantFilter(new Set());
            setLangFilter(new Set());
            setSetFilter(new Set());
            setGradedFilter("all");
          }}
          className="text-[10px] font-bold text-gray-600 hover:text-brand transition-colors pt-2 flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top nav */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">Mercado</span>
          </Link>

          <div className="w-px h-5 bg-gray-800 flex-shrink-0" />

          <div className="flex items-center gap-3 min-w-0">
            <Image
              src="/images/pokemon-tcg.png"
              alt="Pokémon TCG"
              width={28}
              height={28}
              className="rounded-full object-cover flex-shrink-0"
            />
            <h1 className="text-sm font-extrabold text-white tracking-tight truncate">
              Pokémon TCG
            </h1>
            <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-brand/30 text-brand bg-brand/5">
              En vivo
            </span>
          </div>

          <div className="flex-1" />

          {/* Stats (desktop) */}
          <div className="hidden lg:flex items-center gap-8 divide-x divide-gray-800">
            <StatItem
              label="Floor"
              value={stats.floorPrice != null ? formatDOP(stats.floorPrice) : "—"}
            />
            <div className="pl-8">
              <StatItem label="Listadas" value={String(stats.listedCount)} />
            </div>
            <div className="pl-8">
              <StatItem
                label="Volumen"
                value={stats.soldVolume > 0 ? formatDOP(stats.soldVolume) : "—"}
              />
            </div>
            <div className="pl-8">
              <StatItem label="Vendedores" value={String(stats.uniqueSellers)} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile stats */}
      <div className="lg:hidden grid grid-cols-2 gap-px bg-gray-800 border-b border-gray-800">
        {[
          ["Floor", stats.floorPrice != null ? formatDOP(stats.floorPrice) : "—"],
          ["Listadas", String(stats.listedCount)],
          ["Volumen", stats.soldVolume > 0 ? formatDOP(stats.soldVolume) : "—"],
          ["Vendedores", String(stats.uniqueSellers)],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#0a0a0a] px-4 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
              {label}
            </p>
            <p className="text-sm font-mono font-bold text-white mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="max-w-[1600px] mx-auto flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block w-52 flex-shrink-0 border-r border-gray-800 min-h-screen pt-4 pb-8 px-4 sticky top-14 self-start max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          {SidebarContent}
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Controls bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 sticky top-14 bg-[#0a0a0a] z-30">
            {/* Mobile filter button */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtros
              {(statusFilter.size !== 1 || !statusFilter.has("available") || variantFilter.size > 0 || langFilter.size > 0 || gradedFilter !== "all") && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              )}
            </button>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cartas..."
                className="w-full bg-gray-900 border border-gray-800 hover:border-gray-700 focus:border-brand rounded-lg py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-1 focus:ring-brand/20 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex-1" />

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-gray-900 border border-gray-800 text-xs text-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-brand cursor-pointer"
            >
              <option value="recent">Más recientes</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
              <option value="name">Nombre A–Z</option>
            </select>

            <span className="text-[10px] font-mono text-gray-600 whitespace-nowrap hidden sm:inline">
              {filteredCards.length} carta{filteredCards.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Table header (desktop) */}
          <div className="hidden lg:grid grid-cols-[2.5rem_1fr_110px_110px_100px_110px_70px_120px_56px] gap-3 px-4 py-2 border-b border-gray-800 text-[9px] font-bold uppercase tracking-widest text-gray-600">
            <div className="text-center">#</div>
            <div>Carta</div>
            <div className="text-right">Precio</div>
            <div className="text-right">Comprar</div>
            <div className="text-right">Mktpl</div>
            <div>Variante</div>
            <div className="text-center">Idioma</div>
            <div>Vendedor</div>
            <div className="text-right">Publicado</div>
          </div>

          {/* Empty state */}
          {filteredCards.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-gray-500 text-sm">
                {search ? `Sin resultados para "${search}"` : "No hay cartas con estos filtros."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter(new Set(["available"]));
                  setVariantFilter(new Set());
                  setLangFilter(new Set());
                  setGradedFilter("all");
                }}
                className="mt-4 text-xs text-brand hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Desktop rows */}
          <div className="hidden lg:block">
            {filteredCards.map((card, i) => (
              <CardRow
                key={card.id}
                card={card}
                index={i}
                currentUserId={user?.id ?? null}
                onBuyClick={handleCardClick}
                cardFloor={floorByCard[cardKey(card)] ?? null}
              />
            ))}
          </div>

          {/* Mobile rows */}
          <div className="lg:hidden">
            {filteredCards.map((card, i) => (
              <MobileCardRow
                key={card.id}
                card={card}
                index={i}
                currentUserId={user?.id ?? null}
                onBuyClick={handleCardClick}
                cardFloor={floorByCard[cardKey(card)] ?? null}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-[#111] border-r border-gray-800 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
              <span className="text-sm font-bold text-white">Filtros</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-2">{SidebarContent}</div>
          </div>
        </div>
      )}
    </div>
  );
}

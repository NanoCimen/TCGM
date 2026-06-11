"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plus, Search, X, Check, ShoppingBag, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WishlistItem = {
  id: string;
  pokemon_tcg_id: string | null;
  card_name: string;
  card_number: string | null;
  set_name: string | null;
  image_url: string | null;
  variant: string | null;
  created_at: string;
  inMarket: boolean;
};

type SearchResult = {
  id: string;
  name: string;
  number: string;
  set: { id: string; name: string };
  images: { small: string; large?: string };
  rarity?: string;
};

// ─── Animations ───────────────────────────────────────────────────────────────

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease, delay: i * 0.06 },
  }),
};

// ─── Search modal ─────────────────────────────────────────────────────────────

function SearchModal({
  existingIds,
  onAdd,
  onClose,
}: {
  existingIds: Set<string>;
  onAdd: (result: SearchResult) => Promise<void>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pokemon-search?q=${encodeURIComponent(query.trim())}`);
        const { data } = await res.json();
        setResults(data ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 380);
  }, [query]);

  async function handleAdd(r: SearchResult) {
    if (addingId || existingIds.has(r.id)) return;
    setAddingId(r.id);
    setAddError(null);
    try {
      await onAdd(r);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "No se pudo añadir. Inténtalo de nuevo.");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.25, ease }}
        className="relative w-full max-w-2xl bg-[#0f0f0f] border border-white/[0.08] rounded-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden z-10"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <Search className="w-5 h-5 text-gray-600 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca por nombre de carta, ej: Charizard ex…"
            className="flex-1 bg-transparent text-white placeholder:text-gray-600 text-base font-medium outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-gray-600 animate-spin flex-shrink-0" />}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-600 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inline error */}
        <AnimatePresence>
          {addError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border-b border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400 font-medium">{addError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < 2 ? (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-gray-800 mx-auto mb-3" />
              <p className="text-sm text-gray-600 font-medium">
                Escribe al menos 2 caracteres para buscar
              </p>
            </div>
          ) : loading && results.length === 0 ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 text-gray-700 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-600">Buscando…</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-600 font-medium">
                No se encontraron cartas para "{query}"
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {results.map((r) => {
                const added = existingIds.has(r.id);
                const adding = addingId === r.id;
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Card art */}
                    <div className="w-10 h-14 rounded-lg overflow-hidden bg-white/[0.04] flex-shrink-0 border border-white/[0.06]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.images.small}
                        alt={r.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white truncate">{r.name}</p>
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        {r.set.name} · #{r.number}
                      </p>
                      {r.rarity && (
                        <p className="text-[10px] text-gray-700 mt-0.5 truncate">{r.rarity}</p>
                      )}
                    </div>

                    {/* Add button */}
                    <button
                      type="button"
                      onClick={() => handleAdd(r)}
                      disabled={added || adding}
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        added
                          ? "bg-brand/20 text-brand cursor-default"
                          : adding
                          ? "bg-white/[0.06] text-gray-600 cursor-wait"
                          : "bg-white/[0.06] text-gray-400 hover:bg-brand hover:text-black"
                      }`}
                    >
                      {added ? (
                        <Check className="w-4 h-4" />
                      ) : adding ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="px-5 py-2.5 border-t border-white/[0.04]">
            <p className="text-[10px] text-gray-700">
              {results.length} resultado{results.length !== 1 ? "s" : ""} · Haz clic en{" "}
              <Plus className="w-3 h-3 inline-block" /> para añadir a tu wishlist
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Shared card visual content ───────────────────────────────────────────────

function CardContent({ item }: { item: WishlistItem }) {
  return (
    <>
      <div className="relative w-full aspect-[3/4] bg-[#0a0a0a]">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.card_name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-gray-800" />
          </div>
        )}
        {item.inMarket && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-brand text-black text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg">
            <ShoppingBag className="w-2.5 h-2.5" />
            En mercado
          </div>
        )}
        <div className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
          <ExternalLink className="w-3 h-3 text-white/70" />
        </div>
      </div>
      <div className="p-3.5">
        <p className="font-bold text-sm text-white truncate leading-tight mb-0.5">
          {item.card_name}
        </p>
        <p className="text-[11px] text-gray-600 truncate">
          {item.set_name ?? "—"}
          {item.card_number ? ` · #${item.card_number}` : ""}
        </p>
      </div>
    </>
  );
}

// ─── Wishlist card tile ────────────────────────────────────────────────────────

function WishlistTile({
  item,
  index,
  onRemove,
}: {
  item: WishlistItem;
  index: number;
  onRemove: (id: string) => void;
}) {
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    await fetch(`/api/wishlist/${item.id}`, { method: "DELETE" });
    onRemove(item.id);
  }

  const detailHref = item.pokemon_tcg_id
    ? `/wishlist/card/${item.pokemon_tcg_id}`
    : null;

  return (
    <motion.div
      layout
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.22 } }}
      className="group relative bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-colors"
    >
      {/* Clickable area: image + info */}
      {detailHref ? (
        <Link href={detailHref} className="block">
          <CardContent item={item} />
        </Link>
      ) : (
        <CardContent item={item} />
      )}

      {/* Remove button — outside the link so click doesn't navigate */}
      <button
        type="button"
        onClick={handleRemove}
        disabled={removing}
        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100 z-10"
      >
        {removing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <X className="w-3.5 h-3.5" />
        )}
      </button>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WishlistClient({
  initialItems,
  displayName,
  email,
  avatarUrl,
}: {
  initialItems: WishlistItem[];
  displayName: string;
  email: string;
  avatarUrl: string | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [showModal, setShowModal] = useState(false);

  const name = displayName || email;
  const initials = name.substring(0, 2).toUpperCase();

  const existingIds = new Set(items.map((i) => i.pokemon_tcg_id).filter(Boolean) as string[]);

  const handleAdd = useCallback(async (r: SearchResult) => {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pokemon_tcg_id: r.id,
        card_name: r.name,
        card_number: r.number,
        set_name: r.set.name,
        set_id: r.set.id,
        image_url: r.images.large ?? r.images.small,
        variant: r.rarity ?? null,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error("[wishlist add]", res.status, json.error);
      throw new Error(json.error ?? `Error ${res.status}`);
    }
    setItems((prev) => [{ ...json.data, inMarket: false }, ...prev]);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return (
    <>
      <DashboardShell active="wishlist" avatarUrl={avatarUrl} initials={initials}>
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            className="flex items-center justify-between gap-4 mb-10"
          >
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                <Heart className="w-6 h-6 text-brand" fill="currentColor" />
                Mi Wishlist
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {items.length === 0
                  ? "Añade cartas para recibir alertas cuando estén disponibles"
                  : `${items.length} carta${items.length !== 1 ? "s" : ""} · te avisamos cuando aparezcan en el mercado`}
              </p>
            </div>
            <motion.button
              type="button"
              onClick={() => setShowModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 bg-brand text-black text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#00c64b] transition-colors shadow-[0_4px_14px_0_rgba(0,229,89,0.2)]"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Agregar carta
            </motion.button>
          </motion.div>

          {/* Empty state */}
          {items.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mb-5">
                <Heart className="w-7 h-7 text-gray-700" strokeWidth={1.5} />
              </div>
              <p className="text-base font-bold text-gray-400 mb-2">Tu wishlist está vacía</p>
              <p className="text-sm text-gray-600 max-w-xs leading-relaxed mb-6">
                Añade cartas que quieras conseguir y te notificaremos cuando alguien las publique en TCGRD.
              </p>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white/[0.1] transition-colors"
              >
                <Search className="w-4 h-4" />
                Buscar carta
              </button>
            </motion.div>
          )}

          {/* Grid */}
          {items.length > 0 && (
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              <AnimatePresence>
                {items.map((item, i) => (
                  <WishlistTile
                    key={item.id}
                    item={item}
                    index={i}
                    onRemove={handleRemove}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </DashboardShell>

      {/* Search modal */}
      <AnimatePresence>
        {showModal && (
          <SearchModal
            existingIds={existingIds}
            onAdd={handleAdd}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

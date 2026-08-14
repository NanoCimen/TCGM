"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { VARIANTS, LANGUAGES, RARITY_TO_VARIANT } from "@/lib/cards/constants";

export type Confidence = "high" | "medium" | "low";

export type IdentifyResult = {
  card_name: string | null;
  set_name: string | null;
  card_number: string | null;
  confidence: Confidence;
  variant?: string;
  official_image_url?: string | null;
  enriched?: boolean;
};

type SearchResult = {
  id: string;
  name: string;
  number: string;
  set: { name: string; printedTotal: number };
  images: { small: string; large: string };
  rarity?: string;
};

const FIELD_CLASS =
  "w-full bg-[#1a1a1a] border border-gray-800 rounded-lg py-3 px-4 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-700 transition-all";

// "004" and "4" should match each other, but "TG01" should only match itself.
function normalizeCardNumber(n: string): string {
  return n.trim().toLowerCase().replace(/^0+(?=\d)/, "");
}

export default function AIIdentification({
  previewUrl,
  cardName,
  setName,
  cardNumber,
  variant,
  language,
  onFieldsChange,
  onOfficialImageUrl,
  onVariantChange,
  onLanguageChange,
  onConfirm,
  onBack,
}: {
  previewUrl: string;
  cardName: string;
  setName: string;
  cardNumber: string;
  variant: string;
  language: string;
  onFieldsChange: (fields: {
    cardName?: string;
    setName?: string;
    cardNumber?: string;
  }) => void;
  onOfficialImageUrl: (url: string | null) => void;
  onVariantChange: (variant: string) => void;
  onLanguageChange: (language: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // Which set (if any) the name-search results are narrowed to.
  const [selectedSet, setSelectedSet] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped on every keystroke so a slow, now-stale request can never
  // overwrite the results of a request fired after it.
  const requestIdRef = useRef(0);
  // handleSelect sets cardName via onFieldsChange, which changes the
  // cardName prop and would otherwise re-trigger this effect — re-running
  // the search and popping the dropdown back open with the same card the
  // user just picked, forcing them to select it a second time. Holds the
  // exact name just committed by a selection so the effect can recognize
  // and skip that one resulting run (consumed on the next effect run no
  // matter what, so it can never wrongly skip a later real search).
  const skipSearchForNameRef = useRef<string | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const requestId = ++requestIdRef.current;

    const skipName = skipSearchForNameRef.current;
    skipSearchForNameRef.current = null;
    if (skipName === cardName) {
      return;
    }

    if (cardName.length < 2) {
      setResults([]);
      setNoResults(false);
      setDropdownOpen(false);
      setSearching(false);
      setSelectedSet("");
      return;
    }

    // Show spinner immediately so noResults hides while the user is still typing
    setSearching(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/pokemon-search?q=${encodeURIComponent(cardName)}`
        );
        const json = (await res.json()) as { data: SearchResult[] };
        if (requestId !== requestIdRef.current) return; // a newer search superseded this one
        const data = json.data ?? [];
        setResults(data);
        setNoResults(data.length === 0);
        setDropdownOpen(data.length > 0);
        // Keep the current set filter if it still applies; otherwise fall
        // back to whatever set is already on the form (e.g. from AI
        // identification), and only then give up and show all sets.
        setSelectedSet((prev) => {
          if (prev && data.some((r) => r.set?.name === prev)) return prev;
          if (setName && data.some((r) => r.set?.name === setName)) return setName;
          return "";
        });
      } catch {
        if (requestId !== requestIdRef.current) return;
        setResults([]);
        setNoResults(false);
        setDropdownOpen(false);
      } finally {
        if (requestId === requestIdRef.current) setSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cardName]);

  // Sets present in the current name-search results, in the order they
  // first appear (already sorted newest-set-first by the API).
  const availableSets = useMemo(() => {
    const seen = new Set<string>();
    const sets: string[] = [];
    for (const r of results) {
      if (r.set?.name && !seen.has(r.set.name)) {
        seen.add(r.set.name);
        sets.push(r.set.name);
      }
    }
    return sets;
  }, [results]);

  const cardNumberFilter = normalizeCardNumber(cardNumber.split("/")[0] ?? "");

  const visibleResults = useMemo(() => {
    let list = results;
    if (selectedSet) list = list.filter((r) => r.set?.name === selectedSet);
    if (cardNumberFilter) {
      list = list.filter((r) =>
        normalizeCardNumber(r.number ?? "").startsWith(cardNumberFilter)
      );
    }
    return list;
  }, [results, selectedSet, cardNumberFilter]);

  const hasActiveFilter = Boolean(selectedSet || cardNumberFilter);

  // Shared by the name, set, and card number fields so the dropdown closes
  // whichever of the three the user was last filtering from — but not so
  // fast that a click on a dropdown option gets cut off first.
  function closeDropdownSoon() {
    setTimeout(() => setDropdownOpen(false), 150);
  }

  function handleSelect(result: SearchResult) {
    const fullNumber =
      result.number && result.set?.printedTotal
        ? `${result.number}/${result.set.printedTotal}`
        : result.number;
    skipSearchForNameRef.current = result.name;
    onFieldsChange({
      cardName: result.name,
      setName: result.set?.name ?? "",
      cardNumber: fullNumber,
    });
    onOfficialImageUrl(result.images?.large ?? null);
    const mappedVariant = result.rarity ? RARITY_TO_VARIANT[result.rarity] : undefined;
    if (mappedVariant) onVariantChange(mappedVariant);
    setDropdownOpen(false);
    setResults([]);
    setNoResults(false);
    setSelectedSet("");
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Photo */}
      <div className="flex-shrink-0 flex md:block justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Tu carta"
          className="w-40 md:w-48 rounded-xl border border-gray-800 shadow-xl"
        />
      </div>

      {/* Form */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <h2 className="text-xl font-black tracking-tight text-white">
            Datos de la carta
          </h2>
        </div>

        <div className="space-y-4">
          {/* Card name with live search */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Nombre de la carta
            </label>
            <div className="relative">
              <input
                type="text"
                value={cardName}
                onChange={(e) => onFieldsChange({ cardName: e.target.value })}
                onBlur={closeDropdownSoon}
                placeholder="Ej: Charizard ex"
                className={FIELD_CLASS}
                autoComplete="off"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin pointer-events-none" />
              )}
              {dropdownOpen && results.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-[#111] border border-gray-800 rounded-xl shadow-xl overflow-y-auto max-h-72">
                  {visibleResults.length === 0 && hasActiveFilter && (
                    <li className="px-3 py-2.5 text-xs text-gray-500">
                      Ningún resultado con esos filtros.{" "}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSelectedSet("");
                          onFieldsChange({ cardNumber: "" });
                        }}
                        className="text-brand font-bold hover:underline"
                      >
                        Quitar filtros
                      </button>
                    </li>
                  )}
                  {visibleResults.map((result) => {
                    const displayNumber =
                      result.number && result.set?.printedTotal
                        ? `${result.number}/${result.set.printedTotal}`
                        : result.number;
                    return (
                      <li key={result.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelect(result)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-800/70 transition-colors"
                        >
                          {result.images?.small ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={result.images.small}
                              alt=""
                              className="w-8 h-11 object-contain rounded flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-11 bg-gray-800 rounded flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {result.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {result.set?.name}
                              {displayNumber ? ` · ${displayNumber}` : ""}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {noResults && !dropdownOpen && cardName.length >= 2 && !searching && (
              <p className="mt-1.5 text-xs text-gray-500">
                No encontramos esa carta, puedes escribirla manualmente.
              </p>
            )}
          </div>

          {/* Set — becomes a real dropdown once a name search finds
              multiple sets, so picking one narrows the name results above
              instead of forcing a manually-typed match. */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Set
            </label>
            {availableSets.length > 0 ? (
              <select
                value={selectedSet}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedSet(value);
                  onFieldsChange({ setName: value });
                  setDropdownOpen(true);
                }}
                onBlur={closeDropdownSoon}
                className={FIELD_CLASS}
              >
                <option value="">Todos los sets ({results.length})</option>
                {availableSets.map((set) => (
                  <option key={set} value={set}>
                    {set}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={setName}
                onChange={(e) => onFieldsChange({ setName: e.target.value })}
                placeholder="Ej: Scarlet & Violet"
                className={FIELD_CLASS}
              />
            )}
          </div>

          {/* Card number — also narrows the name results above as it's typed. */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Número de carta
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => {
                onFieldsChange({ cardNumber: e.target.value });
                if (results.length > 0) setDropdownOpen(true);
              }}
              onBlur={closeDropdownSoon}
              placeholder="Ej: 125/198"
              className={FIELD_CLASS}
            />
          </div>
        </div>

        {/* Variant selector */}
        <div className="mt-5">
          <label className="block text-sm font-bold text-white mb-2">
            Tipo de carta
          </label>
          <div className="flex flex-wrap gap-2">
            {VARIANTS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onVariantChange(v)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                  variant === v
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-600 hover:text-gray-200"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Language selector */}
        <div className="mt-4">
          <label className="block text-sm font-bold text-white mb-2">
            Idioma de la carta
          </label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(({ code, label, flag }) => (
              <button
                key={code}
                type="button"
                onClick={() => onLanguageChange(code)}
                className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                  language === code
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-600 hover:text-gray-200"
                }`}
              >
                <span>{flag}</span>
                <span>
                  {label} ({code})
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3.5 rounded-xl border border-gray-700 text-sm font-bold text-gray-300 hover:bg-gray-900 transition-colors"
          >
            ← Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!cardName.trim()}
            className="flex-1 bg-brand text-black text-sm font-bold py-3.5 rounded-xl hover:bg-[#00c64b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

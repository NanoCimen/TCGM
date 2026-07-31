"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { VARIANTS, LANGUAGES } from "@/lib/cards/constants";

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
};

const FIELD_CLASS =
  "w-full bg-[#1a1a1a] border border-gray-800 rounded-lg py-3 px-4 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-700 transition-all";

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (cardName.length < 2) {
      setResults([]);
      setNoResults(false);
      setDropdownOpen(false);
      setSearching(false);
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
        const data = (json.data ?? []).slice(0, 8);
        setResults(data);
        setNoResults(data.length === 0);
        setDropdownOpen(data.length > 0);
      } catch {
        setResults([]);
        setNoResults(false);
        setDropdownOpen(false);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cardName]);

  function handleSelect(result: SearchResult) {
    const fullNumber =
      result.number && result.set?.printedTotal
        ? `${result.number}/${result.set.printedTotal}`
        : result.number;
    onFieldsChange({
      cardName: result.name,
      setName: result.set?.name ?? "",
      cardNumber: fullNumber,
    });
    onOfficialImageUrl(result.images?.large ?? null);
    setDropdownOpen(false);
    setResults([]);
    setNoResults(false);
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
                onBlur={() =>
                  setTimeout(() => setDropdownOpen(false), 150)
                }
                placeholder="Ej: Charizard ex"
                className={FIELD_CLASS}
                autoComplete="off"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin pointer-events-none" />
              )}
              {dropdownOpen && results.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-[#111] border border-gray-800 rounded-xl shadow-xl overflow-y-auto max-h-72">
                  {results.map((result) => {
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

          {/* Set */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Set
            </label>
            <input
              type="text"
              value={setName}
              onChange={(e) => onFieldsChange({ setName: e.target.value })}
              placeholder="Ej: Scarlet & Violet"
              className={FIELD_CLASS}
            />
          </div>

          {/* Card number */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Número de carta
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => onFieldsChange({ cardNumber: e.target.value })}
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

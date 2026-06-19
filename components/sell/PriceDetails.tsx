"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Search,
  Tag,
} from "lucide-react";
import type { TCGPriceResult } from "@/lib/api/tcggo";

export type TcgPriceResult = TCGPriceResult;

const NOTES_MAX = 200;

type TcgSearchResult = {
  name: string;
  setName: string;
  number: string;
  marketPrice: number | null;
  imageUrl: string | null;
};

const GRADE_COMPANIES = ["PSA", "CGC", "BGS"] as const;
type GradeCompany = (typeof GRADE_COMPANIES)[number];

const GRADES_BY_COMPANY: Record<GradeCompany, string[]> = {
  PSA: ["10", "9", "8", "7"],
  CGC: ["10", "9"],
  BGS: ["10"],
};

function getGradeData(
  data: TCGPriceResult | null,
  company: GradeCompany,
  grade: string
): { price: number | null; samples: number | null } {
  if (!data) return { price: null, samples: null };
  const c = company.toLowerCase();
  const price = (data as Record<string, unknown>)[`${c}${grade}`] as number | null;
  const samples = (data as Record<string, unknown>)[`${c}${grade}s`] as number | null;
  return { price, samples };
}

const NULL_PRICE_RESULT: TCGPriceResult = {
  tcgPlayerPrice: null,
  cardmarketLowest: null,
  cardmarket7d: null,
  displayPrice: null,
  displayCurrency: "USD",
  priceSource: "",
  psa10: null, psa9: null, psa8: null, psa7: null,
  psa10s: null, psa9s: null, psa8s: null, psa7s: null,
  cgc10: null, cgc9: null, cgc10s: null, cgc9s: null,
  bgs10: null, bgs10s: null,
  officialImage: null,
  tcggoUrl: null,
};

export default function PriceDetails({
  previewUrl,
  cardName,
  setName,
  cardNumber,
  variant,
  language,
  price,
  notes,
  tcgPrice,
  tcgFetched,
  tcgPriceData,
  isGraded,
  grade,
  gradeCompany,
  publishing,
  publishError,
  onPriceChange,
  onNotesChange,
  onTcgResult,
  onIsGradedChange,
  onGradeChange,
  onGradeCompanyChange,
  onPublish,
  onBack,
}: {
  previewUrl: string;
  cardName: string;
  setName: string;
  cardNumber: string;
  variant: string;
  language: string;
  price: string;
  notes: string;
  tcgPrice: number | null;
  tcgFetched: boolean;
  tcgPriceData: TcgPriceResult | null;
  isGraded: boolean;
  grade: string | null;
  gradeCompany: string | null;
  publishing: boolean;
  publishError: string;
  onPriceChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onTcgResult: (result: TcgPriceResult) => void;
  onIsGradedChange: (v: boolean) => void;
  onGradeChange: (v: string | null) => void;
  onGradeCompanyChange: (v: string | null) => void;
  onPublish: () => void;
  onBack: () => void;
}) {
  const skipApi = language === "JP" || language === "KR";
  const [loadingPrice, setLoadingPrice] = useState(!tcgFetched && !skipApi);
  const [priceData, setPriceData] = useState<TCGPriceResult | null>(tcgPriceData);
  const prefilled = useRef(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(cardName);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TcgSearchResult[]>([]);
  const [searchDone, setSearchDone] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const [refTableOpen, setRefTableOpen] = useState(false);

  const activeCompany = (gradeCompany ?? "PSA") as GradeCompany;
  const activeGrade = grade ?? "10";

  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q || searching) return;
    setSearching(true);
    setSearchDone(false);
    try {
      const res = await fetch(`/api/tcg-price?q=${encodeURIComponent(q)}`);
      const data = res.ok
        ? ((await res.json()) as { results: TcgSearchResult[] })
        : { results: [] };
      setSearchResults(data.results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
      setSearchDone(true);
    }
  }

  function handleSelectResult(result: TcgSearchResult) {
    setSelectedKey(`${result.name}-${result.setName}-${result.number}`);
    const partial: TCGPriceResult = {
      ...NULL_PRICE_RESULT,
      tcgPlayerPrice: result.marketPrice,
      displayPrice: result.marketPrice,
      displayCurrency: "USD",
      priceSource: result.marketPrice != null ? "TCGPlayer market price" : "",
      officialImage: result.imageUrl,
    };
    setPriceData(partial);
    onTcgResult(partial);
    if (result.marketPrice != null && !price) {
      onPriceChange(String(result.marketPrice));
    }
    setSearchOpen(false);
  }

  function handleGradedToggle(v: boolean) {
    onIsGradedChange(v);
    if (v) {
      onGradeCompanyChange("PSA");
      onGradeChange("10");
      const { price: gp } = getGradeData(priceData, "PSA", "10");
      if (gp != null) onPriceChange(String(gp));
    } else {
      onGradeCompanyChange(null);
      onGradeChange(null);
      if (priceData?.displayPrice != null) onPriceChange(String(priceData.displayPrice));
    }
  }

  function handleCompanyChange(company: GradeCompany) {
    onGradeCompanyChange(company);
    onGradeChange("10");
    const { price: gp } = getGradeData(priceData, company, "10");
    if (gp != null) onPriceChange(String(gp));
  }

  function handleGradeChange(g: string) {
    onGradeChange(g);
    const { price: gp } = getGradeData(priceData, activeCompany, g);
    if (gp != null) onPriceChange(String(gp));
  }

  useEffect(() => {
    if (tcgFetched || skipApi) return;
    let cancelled = false;

    async function fetchPrice() {
      setLoadingPrice(true);
      try {
        const params = new URLSearchParams({ name: cardName });
        if (cardNumber.trim()) params.set("number", cardNumber);
        if (variant && variant !== "Regular") params.set("variant", variant);
        params.set("language", language);
        const res = await fetch(`/api/tcg-price?${params.toString()}`);
        const data = res.ok ? ((await res.json()) as TCGPriceResult) : null;
        if (cancelled) return;
        const result = data ?? NULL_PRICE_RESULT;
        setPriceData(result);
        onTcgResult(result);
        if (result.displayPrice != null && !prefilled.current && !price) {
          prefilled.current = true;
          onPriceChange(String(result.displayPrice));
        }
      } catch {
        if (!cancelled) onTcgResult(NULL_PRICE_RESULT);
      } finally {
        if (!cancelled) setLoadingPrice(false);
      }
    }

    fetchPrice();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const numericPrice = parseFloat(price);
  const hasValidPrice = !Number.isNaN(numericPrice) && numericPrice > 0;

  let comparison: { text: string; classes: string } | null = null;
  if (hasValidPrice && tcgPrice != null && !skipApi && !isGraded) {
    if (numericPrice < tcgPrice) {
      comparison = { text: "🟢 Buen precio para el comprador", classes: "text-green-400" };
    } else if (numericPrice > tcgPrice) {
      comparison = { text: "🟡 Por encima del mercado", classes: "text-amber-400" };
    }
  }

  const tcgPlayerUrl = `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(cardName)}`;
  const priceChartingUrl = `https://www.pricecharting.com/search-products?q=${encodeURIComponent(cardName)}`;
  const naverUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(cardName)}+포켓몬카드`;

  const selectedGradeData = isGraded
    ? getGradeData(priceData, activeCompany, activeGrade)
    : null;

  const ungradedRows: { label: string; value: string }[] = priceData
    ? [
        priceData.tcgPlayerPrice != null
          ? { label: "TCGPlayer market price", value: `$${priceData.tcgPlayerPrice.toFixed(2)} USD` }
          : null,
        priceData.cardmarketLowest != null
          ? { label: "Cardmarket lowest NM", value: `€${priceData.cardmarketLowest.toFixed(2)} EUR` }
          : null,
        priceData.cardmarket7d != null
          ? { label: "Cardmarket 7d average", value: `€${priceData.cardmarket7d.toFixed(2)} EUR` }
          : null,
      ].filter((r): r is { label: string; value: string } => r != null)
    : [];

  const gradedRowDefs = priceData
    ? (
        [
          { label: "PSA 10", ...getGradeData(priceData, "PSA", "10") },
          { label: "PSA 9", ...getGradeData(priceData, "PSA", "9") },
          { label: "PSA 8", ...getGradeData(priceData, "PSA", "8") },
          { label: "PSA 7", ...getGradeData(priceData, "PSA", "7") },
          { label: "CGC 10", ...getGradeData(priceData, "CGC", "10") },
          { label: "CGC 9", ...getGradeData(priceData, "CGC", "9") },
          { label: "BGS 10", ...getGradeData(priceData, "BGS", "10") },
        ] as { label: string; price: number | null; samples: number | null }[]
      ).filter((r) => r.price != null)
    : [];

  return (
    <div>
      {/* Card summary */}
      <div className="flex items-center gap-4 bg-[#111] border border-gray-800 rounded-2xl p-4 mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={cardName}
          className="w-14 h-20 object-cover rounded-lg border border-gray-700"
        />
        <div className="min-w-0">
          <p className="font-bold text-white truncate">{cardName}</p>
          <p className="text-xs text-gray-500 truncate">{setName || "—"}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {variant !== "Regular" && (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded">
                {variant}
              </span>
            )}
            <span className="text-[10px] font-bold text-gray-500">
              {language === "EN"
                ? "🇺🇸"
                : language === "JP"
                ? "🇯🇵"
                : language === "ES"
                ? "🇪🇸"
                : "🇰🇷"}{" "}
              {language}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION A — Price reference */}
      {skipApi ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-5">
          <p className="text-sm font-bold text-amber-400 mb-1">
            ⚠️ No logramos identificar precios de cartas{" "}
            {language === "JP" ? "Japonesas" : "Coreanas"} automáticamente.
          </p>
          <p className="text-xs text-amber-300/80 mb-3">
            Favor colocar tu precio manualmente.
          </p>
          <div className="flex flex-wrap gap-4">
            {language === "JP" && (
              <a
                href="https://yuyu-tei.jp/sell/poke"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-amber-400 underline underline-offset-2 hover:text-amber-300"
              >
                Ver precios en YYT →
              </a>
            )}
            {language === "KR" && (
              <a
                href={naverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-amber-400 underline underline-offset-2 hover:text-amber-300"
              >
                Ver precios en Naver →
              </a>
            )}
          </div>
        </div>
      ) : loadingPrice ? (
        <div className="flex items-center gap-3 flex-wrap mb-5">
          <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border border-gray-700 bg-[#111] text-gray-300">
            <Tag className="w-3.5 h-3.5 text-brand" />
            <Loader2 className="w-3 h-3 animate-spin" />
            Buscando precio de mercado...
          </span>
        </div>
      ) : priceData?.displayPrice != null || tcgPrice != null ? (
        <div className="mb-5">
          <div className="flex items-center gap-3 flex-wrap mb-1.5">
            <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border border-gray-700 bg-[#111] text-gray-300">
              <Tag className="w-3.5 h-3.5 text-brand" />
              {priceData?.cardmarketLowest != null && priceData.tcgPlayerPrice == null ? (
                <>
                  Precio de mercado:{" "}
                  <span className="text-white">
                    ~${(priceData.displayPrice ?? 0).toFixed(2)} USD
                  </span>
                  <span className="text-gray-500">
                    {" "}(€{priceData.cardmarketLowest.toFixed(2)} · Cardmarket)
                  </span>
                </>
              ) : (
                <>
                  Precio de mercado TCGPlayer:{" "}
                  <span className="text-white">
                    ${(priceData?.displayPrice ?? tcgPrice ?? 0).toFixed(2)} USD
                  </span>
                </>
              )}
            </span>
            {priceData?.tcggoUrl && (
              <a
                href={priceData.tcggoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline underline-offset-2"
              >
                Ver historial de precios
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline underline-offset-2"
            >
              <Search className="w-3.5 h-3.5" />
              ¿No es tu carta? Buscar
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-5">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-3">
            <p className="text-sm font-bold text-amber-400 mb-1">
              No encontramos precio automático para esta carta.
            </p>
            <p className="text-xs text-amber-300/80 mb-3">
              Favor colocar tu precio manualmente.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={tcgPlayerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-amber-400 underline underline-offset-2 hover:text-amber-300"
              >
                Ver en TCGPlayer →
              </a>
              <a
                href={priceChartingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-amber-400 underline underline-offset-2 hover:text-amber-300"
              >
                Ver en PriceCharting →
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline underline-offset-2"
          >
            <Search className="w-3.5 h-3.5" />
            Buscar en TCG
          </button>
        </div>
      )}

      {/* Manual TCG search */}
      {searchOpen && !skipApi && !loadingPrice && (
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-4 mb-6">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Ej: Magcargo"
              className="flex-1 bg-[#1a1a1a] border border-gray-800 rounded-lg py-2.5 px-4 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gray-600 transition-all"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="bg-brand text-black text-sm font-bold px-4 rounded-lg hover:bg-[#00c64b] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>

          {searchDone && searchResults.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-3">
              No se encontraron resultados. Las cartas muy recientes pueden no
              estar en la base de datos del TCG todavía.
            </p>
          )}

          {searchResults.length > 0 && (
            <div className="divide-y divide-gray-800 max-h-72 overflow-y-auto">
              {searchResults.map((r) => {
                const key = `${r.name}-${r.setName}-${r.number}`;
                const isSelected = selectedKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectResult(r)}
                    className="w-full flex items-center gap-3 py-2.5 px-1 text-left hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {r.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.imageUrl}
                        alt={r.name}
                        className="w-9 h-12 object-cover rounded border border-gray-700 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-12 rounded bg-gray-800 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{r.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {r.setName} · {r.number}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-300 flex-shrink-0">
                      {r.marketPrice != null ? `$${r.marketPrice.toFixed(2)}` : "—"}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-brand flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION B — Graded toggle */}
      <div className="bg-[#111] border border-gray-800 rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">¿Esta carta está graduada?</p>
            <p className="text-xs text-gray-500 mt-0.5">PSA / CGC / BGS</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isGraded}
            onClick={() => handleGradedToggle(!isGraded)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              isGraded ? "bg-brand" : "bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isGraded ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {isGraded && (
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs font-bold text-gray-400 mb-2">Empresa de graduación</p>
              <div className="flex gap-2">
                {GRADE_COMPANIES.map((company) => (
                  <button
                    key={company}
                    type="button"
                    onClick={() => handleCompanyChange(company)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                      activeCompany === company
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-600 hover:text-gray-200"
                    }`}
                  >
                    {company}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 mb-2">Grado</p>
              <div className="flex gap-2">
                {GRADES_BY_COMPANY[activeCompany].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGradeChange(g)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                      activeGrade === g
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-600 hover:text-gray-200"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {selectedGradeData?.price != null ? (
              <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-3 py-2 text-xs font-bold text-yellow-400">
                <span>
                  {activeCompany} {activeGrade} — ${selectedGradeData.price.toFixed(2)} USD
                </span>
                {selectedGradeData.samples != null && (
                  <span className="text-yellow-400/60 font-normal">
                    (mediana eBay, {selectedGradeData.samples} ventas)
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">
                Sin datos para {activeCompany} {activeGrade} — ingresa tu precio manualmente
              </p>
            )}
          </div>
        )}
      </div>

      {/* Price input */}
      <div className="space-y-5">
        <div>
          <label
            htmlFor="sellPrice"
            className="block text-sm font-bold text-white mb-2"
          >
            Tu precio de venta
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">
              $
            </span>
            <input
              id="sellPrice"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg py-3 pl-8 pr-4 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-700 transition-all"
            />
          </div>
          {comparison && (
            <p className={`text-xs font-bold mt-2 ${comparison.classes}`}>
              {comparison.text}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-bold text-white mb-2">
            Notas <span className="text-gray-500 font-medium">(opcional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            maxLength={NOTES_MAX}
            rows={3}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Ej: Carta en excelente estado, sin rayones..."
            className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg py-3 px-4 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-700 transition-all resize-none"
          />
          <p className="text-[11px] text-gray-600 text-right mt-1">
            {notes.length}/{NOTES_MAX}
          </p>
        </div>
      </div>

      {/* SECTION C — Collapsible reference table */}
      {priceData && (ungradedRows.length > 0 || gradedRowDefs.length > 0) && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setRefTableOpen((v) => !v)}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            {refTableOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            Ver todos los precios de referencia
          </button>

          {refTableOpen && (
            <div className="mt-3 bg-[#111] border border-gray-800 rounded-xl overflow-hidden text-xs">
              {ungradedRows.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-gray-900/60 border-b border-gray-800">
                    <p className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                      Sin graduar
                    </p>
                  </div>
                  {ungradedRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between px-4 py-2 border-b border-gray-800/60 last:border-0"
                    >
                      <span className="text-gray-400">{row.label}</span>
                      <span className="font-mono font-bold text-white">{row.value}</span>
                    </div>
                  ))}
                </>
              )}

              {gradedRowDefs.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-gray-900/60 border-b border-gray-800 border-t border-t-gray-700">
                    <p className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                      Graduadas (mediana eBay)
                    </p>
                  </div>
                  {gradedRowDefs.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between px-4 py-2 border-b border-gray-800/60 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-yellow-400">{row.label}</span>
                        {row.samples != null && (
                          <span className="text-gray-600">{row.samples} ventas</span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-white">
                        ${row.price!.toFixed(2)} USD
                      </span>
                    </div>
                  ))}
                </>
              )}

              <div className="px-4 py-3 bg-gray-900/40 border-t border-gray-800">
                <p className="text-gray-500 leading-relaxed">
                  💡 Los precios graduados son referenciales — están basados en ventas recientes de eBay y pueden variar.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {publishError && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-red-400">Error al publicar</p>
          <p className="text-xs text-red-400/80 mt-0.5">{publishError}</p>
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <button
          type="button"
          onClick={onBack}
          disabled={publishing}
          className="flex-1 py-3.5 rounded-xl border border-gray-700 text-sm font-bold text-gray-300 hover:bg-gray-900 transition-colors disabled:opacity-50"
        >
          ← Volver
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={!hasValidPrice || publishing}
          className="flex-1 bg-brand text-black text-sm font-bold py-3.5 rounded-xl hover:bg-[#00c64b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {publishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
            </>
          ) : (
            "Guardar en portafolio →"
          )}
        </button>
      </div>
    </div>
  );
}

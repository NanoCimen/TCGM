"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import {
  VARIANTS,
  LANGUAGES,
} from "@/lib/cards/constants";

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

const CONFIDENCE_BADGE: Record<Confidence, { label: string; classes: string }> =
  {
    high: {
      label: "Alta confianza",
      classes: "bg-green-900/40 text-green-400 border-green-800",
    },
    medium: {
      label: "Confianza media",
      classes: "bg-amber-900/40 text-amber-400 border-amber-800",
    },
    low: {
      label: "Verifica los datos",
      classes: "bg-red-900/40 text-red-400 border-red-800",
    },
  };

const FIELD_CLASS =
  "w-full bg-[#1a1a1a] border border-gray-800 rounded-lg py-3 px-4 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-700 transition-all";

export default function AIIdentification({
  previewUrl,
  cardName,
  setName,
  cardNumber,
  confidence,
  identified,
  isManual = false,
  enriched,
  variant,
  language,
  onFieldsChange,
  onIdentified,
  onVariantChange,
  onLanguageChange,
  onConfirm,
  onBack,
}: {
  previewUrl: string;
  cardName: string;
  setName: string;
  cardNumber: string;
  confidence: Confidence | null;
  identified: boolean;
  isManual?: boolean;
  enriched: boolean;
  variant: string;
  language: string;
  onFieldsChange: (fields: {
    cardName?: string;
    setName?: string;
    cardNumber?: string;
  }) => void;
  onIdentified: (result: IdentifyResult) => void;
  onVariantChange: (variant: string) => void;
  onLanguageChange: (language: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(!identified);
  const [aiFailed, setAiFailed] = useState(false);

  const identify = useCallback(async () => {
    setLoading(true);
    setAiFailed(false);
    try {
      const res = await fetch("/api/identify-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: previewUrl }),
      });
      if (!res.ok) throw new Error("identify failed");
      const result = (await res.json()) as IdentifyResult;
      onIdentified(result);
      if (!result.card_name) setAiFailed(true);
    } catch {
      setAiFailed(true);
      onIdentified({
        card_name: null,
        set_name: null,
        card_number: null,
        confidence: "low",
        variant: "Regular",
        official_image_url: null,
        enriched: false,
      });
    } finally {
      setLoading(false);
    }
  }, [previewUrl, onIdentified]);

  useEffect(() => {
    if (!identified) identify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center py-16">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-40 h-56 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 mb-8 flex items-center justify-center"
        >
          <Sparkles className="w-10 h-10 text-brand" />
        </motion.div>
        <p className="text-white font-bold mb-1">Analizando tu carta con IA...</p>
        <p className="text-xs text-gray-500">Esto toma unos segundos</p>
      </div>
    );
  }

  const showLowWarning = confidence === "low" || aiFailed;

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
            {isManual ? "Datos de la carta" : "Resultado de la IA"}
          </h2>
          {!isManual && confidence && (
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${CONFIDENCE_BADGE[confidence].classes}`}
            >
              {CONFIDENCE_BADGE[confidence].label}
            </span>
          )}
        </div>

        {!isManual && showLowWarning && (
          <div className="flex items-start gap-3 bg-amber-950/40 border border-amber-900 rounded-xl p-4 mb-5">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300 leading-relaxed">
              La IA no pudo identificar la carta con certeza. Por favor verifica
              los datos antes de continuar.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Nombre de la carta
            </label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => onFieldsChange({ cardName: e.target.value })}
              placeholder="Ej: Charizard ex"
              className={FIELD_CLASS}
            />
          </div>
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

        {/* Enrichment status badge */}
        {!isManual && (
          <div
            className={`flex items-center gap-2 mt-4 px-3 py-2 rounded-lg text-xs font-semibold border ${
              enriched
                ? "bg-green-900/25 border-green-800 text-green-400"
                : "bg-amber-900/25 border-amber-900 text-amber-400"
            }`}
          >
            {enriched ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                Carta verificada en base de datos
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                Datos aproximados — verifica el set
              </>
            )}
          </div>
        )}

        {/* Variant selector */}
        <div className="mt-5">
          <label className="block text-sm font-bold text-white mb-2">
            Tipo de carta
            {enriched && (
              <span className="ml-2 text-[10px] font-normal text-green-500">
                auto-detectado
              </span>
            )}
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

"use client";

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
  onVariantChange: (variant: string) => void;
  onLanguageChange: (language: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
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

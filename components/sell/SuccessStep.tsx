"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

export default function SuccessStep({
  previewUrl,
  cardName,
  setName,
  price,
  cardId,
  onReset,
  hasMore = false,
  currentCard = 1,
  totalCards = 1,
  onNextCard,
}: {
  previewUrl: string;
  cardName: string;
  setName: string;
  price: string;
  cardId: string | null;
  onReset: () => void;
  hasMore?: boolean;
  currentCard?: number;
  totalCards?: number;
  onNextCard?: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="w-16 h-16 rounded-full bg-brand flex items-center justify-center mb-6"
      >
        <Check className="w-8 h-8 text-black" strokeWidth={3} />
      </motion.div>

      <h2 className="text-2xl font-black tracking-tight text-white mb-1">
        ¡Carta publicada!
      </h2>
      <p className="text-sm text-gray-500 mb-2">Tu carta ya está en el mercado</p>

      {totalCards > 1 && (
        <p className="text-xs font-bold text-brand mb-6">
          {currentCard} de {totalCards} cartas
        </p>
      )}

      {totalCards === 1 && <div className="mb-6" />}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt={cardName}
        className="max-h-[300px] w-auto rounded-2xl border border-gray-800 shadow-2xl mb-6"
      />

      <div className="mb-8">
        <p className="font-bold text-white text-lg">{cardName}</p>
        <p className="text-sm text-gray-500">{setName || "—"}</p>
        <p className="font-mono font-bold text-brand text-xl mt-2">
          ${parseFloat(price || "0").toFixed(2)}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        {hasMore && onNextCard ? (
          <>
            <button
              type="button"
              onClick={onNextCard}
              className="flex-1 bg-brand text-black text-sm font-bold py-3.5 rounded-xl hover:bg-[#00c64b] transition-colors flex items-center justify-center gap-1.5"
            >
              Siguiente carta
              <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
            {cardId && (
              <Link
                href={`/cards/${cardId}`}
                className="flex-1 py-3.5 rounded-xl border border-gray-700 text-sm font-bold text-gray-300 hover:bg-gray-900 transition-colors text-center"
              >
                Ver esta carta
              </Link>
            )}
          </>
        ) : (
          <>
            {cardId && (
              <Link
                href={`/cards/${cardId}`}
                className="flex-1 bg-brand text-black text-sm font-bold py-3.5 rounded-xl hover:bg-[#00c64b] transition-colors text-center"
              >
                Ver mi carta
              </Link>
            )}
            <button
              type="button"
              onClick={onReset}
              className="flex-1 py-3.5 rounded-xl border border-gray-700 text-sm font-bold text-gray-300 hover:bg-gray-900 transition-colors"
            >
              Publicar otra carta
            </button>
          </>
        )}
      </div>
    </div>
  );
}

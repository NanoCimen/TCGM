"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center px-6 text-center">
      <Image src="/solo-logo.png" alt="TCGRD" width={40} height={40} className="h-10 w-10 mb-8" />
      <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand mb-4">
        Algo salió mal
      </span>
      <h1 className="text-4xl font-black tracking-tight mb-3">Se rompió algo</h1>
      <p className="text-gray-500 mb-10 max-w-sm">
        Ocurrió un error inesperado. Intenta de nuevo o vuelve al inicio.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-brand text-black text-sm font-bold py-3.5 px-8 rounded-xl hover:bg-[#00c64b] transition-colors"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/"
          className="border border-gray-700 text-gray-300 text-sm font-bold py-3.5 px-8 rounded-xl hover:bg-gray-900 transition-colors"
        >
          Ir al mercado
        </Link>
      </div>
    </div>
  );
}

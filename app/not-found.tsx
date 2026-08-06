import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center px-6 text-center">
      <Image src="/solo-logo.png" alt="TCGRD" width={40} height={40} className="h-10 w-10 mb-8" />
      <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand mb-4">
        Error 404
      </span>
      <h1 className="text-4xl font-black tracking-tight mb-3">Página no encontrada</h1>
      <p className="text-gray-500 mb-10 max-w-sm">
        Esta carta se escapó del mercado. Revisa el enlace o vuelve al inicio.
      </p>
      <Link
        href="/"
        className="bg-brand text-black text-sm font-bold py-3.5 px-8 rounded-xl hover:bg-[#00c64b] transition-colors"
      >
        Volver al mercado
      </Link>
    </div>
  );
}

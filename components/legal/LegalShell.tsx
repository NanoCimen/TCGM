import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

type Section = { id: string; label: string };

export default function LegalShell({
  title,
  subtitle,
  lastUpdated,
  sections,
  children,
}: {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: Section[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 bg-[#080808]/80 backdrop-blur-2xl border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Mercado
          </Link>
          <Link href="/">
            <Image src="/solo-logo.png" alt="TCGRD" width={28} height={28} className="h-7 w-7" />
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-14 max-w-2xl">
          <span className="inline-block text-[10px] font-bold tracking-[0.2em] uppercase text-brand mb-4">
            {lastUpdated}
          </span>
          <h1 className="text-5xl font-black tracking-tight text-white mb-4 leading-none">
            {title}
          </h1>
          <p className="text-base text-gray-500 leading-relaxed">{subtitle}</p>
        </div>

        <div className="flex gap-16 items-start">
          {/* Table of contents — sticky sidebar on desktop */}
          <aside className="hidden lg:block w-52 flex-shrink-0 sticky top-28 self-start">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-600 mb-4">
              Contenido
            </p>
            <nav className="space-y-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-sm text-gray-600 hover:text-white py-1.5 transition-colors leading-snug"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 max-w-3xl">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] mt-24 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-gray-700">
            © 2026 TCGRD · República Dominicana
          </p>
          <div className="flex gap-5 text-xs text-gray-700">
            <Link href="/terminos" className="hover:text-white transition-colors">Términos</Link>
            <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/soporte" className="hover:text-white transition-colors">Soporte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Reusable section wrapper ─────────────────────────────────────────────────

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-14 scroll-mt-28">
      <h2 className="text-xl font-black text-white mb-5 tracking-tight">{title}</h2>
      <div className="space-y-4 text-[15px] leading-7 text-gray-400">
        {children}
      </div>
    </section>
  );
}

export function LegalDivider() {
  return (
    <div className="h-px bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent mb-14" />
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-4">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="text-brand mt-1 flex-shrink-0">–</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

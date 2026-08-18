import Link from "next/link";

const FOOTER_ITEMS: { label: string; href: string | null }[] = [
  { label: "© 2026", href: null },
  { label: "Instagram", href: "https://www.instagram.com/tcg.rd/" },
  { label: "Soporte", href: "/soporte" },
  { label: "Términos", href: "/terminos" },
  { label: "Privacidad", href: "/privacidad" },
];

export default function Footer({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={`relative mt-auto transition-colors ${compact ? "pt-12 pb-8" : "py-14"}`}>
      <div className={`max-w-[1400px] mx-auto px-6 lg:px-10 flex flex-col items-center text-center ${compact ? "gap-0" : "gap-6"}`}>
        {!compact && (
          <h2
            data-text="TCG RD"
            className="footer-wordmark text-5xl md:text-6xl"
          >
            TCG RD
          </h2>
        )}

        <nav className="flex flex-wrap items-center justify-center gap-x-2 text-xs font-mono text-gray-400 dark:text-gray-500">
          {FOOTER_ITEMS.map((item, index) => (
            <span key={item.label} className="flex items-center gap-x-2">
              {index > 0 && (
                <span aria-hidden className="text-gray-300 dark:text-gray-700">
                  {"//"}
                </span>
              )}
              {item.href === null ? (
                <span>{item.label}</span>
              ) : item.href.startsWith("/") ? (
                <Link href={item.href} className="hover:text-brand transition-colors">
                  {item.label}
                </Link>
              ) : (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand transition-colors"
                >
                  {item.label}
                </a>
              )}
            </span>
          ))}
        </nav>
      </div>
    </footer>
  );
}

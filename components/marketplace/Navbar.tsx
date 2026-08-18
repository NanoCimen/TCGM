"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Command, Sun, Moon, Menu, X } from "lucide-react";
import type { AuthMode } from "@/components/auth/AuthModal";
import AuthMenu from "@/components/auth/AuthMenu";
import NotificationsBell from "@/components/notifications/NotificationsBell";

export default function Navbar({
  isDark,
  toggleDark,
  search,
  onSearchChange,
  loggedIn,
  email,
  avatarUrl,
  onAuthSelect,
  showThemeToggle = true,
  showSearch = true,
  showSell = true,
  tightNav = false,
  sticky = false,
  revealOnScrollStop = false,
}: {
  isDark: boolean;
  toggleDark: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  loggedIn: boolean;
  email: string | null;
  avatarUrl: string | null;
  onAuthSelect: (mode: AuthMode) => void;
  showThemeToggle?: boolean;
  showSearch?: boolean;
  showSell?: boolean;
  tightNav?: boolean;
  sticky?: boolean;
  revealOnScrollStop?: boolean;
}) {
  const pathname = usePathname();
  const inColeccion =
    pathname === "/dashboard" ||
    pathname.startsWith("/actividad") ||
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/perfil");

  const navLinkClass = (isActive: boolean) =>
    `font-semibold text-sm tracking-tight py-[30px] border-b-2 transition-colors ${
      isActive
        ? "text-gray-900 dark:text-white border-brand"
        : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white border-transparent"
    }`;

  // Hides while the page is actively scrolling and slides back in ~200ms
  // after scrolling stops, instead of staying pinned the whole time.
  const [hidden, setHidden] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();

  // The desktop nav links (Inicio/Mi colección/Mercado/Nosotros) are
  // `hidden md:flex` with no mobile equivalent — this menu is that
  // equivalent, so mobile visitors aren't stuck with zero navigation.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!revealOnScrollStop) return;

    function onScroll() {
      const y = window.scrollY;
      if (y < 80) {
        setHidden(false);
      } else {
        setHidden(true);
      }
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setHidden(false), 220);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(idleTimer.current);
    };
  }, [revealOnScrollStop]);

  return (
    <motion.nav
      animate={revealOnScrollStop ? { y: hidden ? "-100%" : "0%" } : undefined}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className={`${
        revealOnScrollStop ? "fixed top-0 inset-x-0" : sticky ? "sticky top-0" : "relative"
      } z-50 bg-white/30 dark:bg-[#0a0a0a]/30 backdrop-blur-2xl backdrop-saturate-[1.8] border-b border-white/20 dark:border-white/[0.06] shadow-[0_1px_0_rgba(0,229,89,0.08)] h-20 transition-colors`}
    >
      <div className="w-full px-6 lg:px-10 h-full flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center group">
            <Image
              src="/solo-logo.png"
              alt="TCGRD"
              width={36}
              height={36}
              className="h-9 w-9 group-hover:scale-105 transition-transform"
            />
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className={navLinkClass(pathname === "/")}>
              Inicio
            </Link>
            <Link href="/dashboard" className={navLinkClass(inColeccion)}>
              Mi colección
            </Link>
            <Link
              href="/collection/pokemon"
              className={navLinkClass(pathname.startsWith("/collection/pokemon"))}
            >
              Mercado
            </Link>
            <a
              href="https://www.instagram.com/tcg.rd/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white font-semibold text-sm tracking-tight py-[30px] border-b-2 border-transparent transition-colors"
            >
              Nosotros
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showThemeToggle && (
            <button
              type="button"
              onClick={toggleDark}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/40 dark:hover:bg-white/5 transition-colors text-gray-500 dark:text-gray-400"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}

          {showSearch && (
            <div className="relative hidden lg:flex items-center w-72">
              <Search className="absolute left-3 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar cartas y vendedores"
                className="w-full bg-white/40 dark:bg-white/[0.04] backdrop-blur-md border border-white/30 dark:border-white/10 rounded-lg py-2 pl-10 pr-12 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-brand/60 focus:bg-white/70 dark:focus:bg-white/[0.06] transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-white"
              />
              <div className="absolute right-2 flex items-center bg-white/60 dark:bg-white/[0.06] backdrop-blur-sm rounded border border-white/40 dark:border-white/10 px-1.5 py-0.5">
                <Command className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono font-bold ml-0.5 mt-[1px]">
                  K
                </span>
              </div>
            </div>
          )}
          {loggedIn && <NotificationsBell />}
          {loggedIn && showSell && (
            <Link
              href="/sell"
              className="bg-brand text-black text-sm font-bold tracking-tight px-5 sm:px-6 py-2.5 rounded-lg hover:bg-[#00c64b] transition-all shadow-[0_4px_14px_0_rgba(0,229,89,0.25)] hover:shadow-[0_6px_20px_rgba(0,229,89,0.4)] hover:-translate-y-0.5 whitespace-nowrap"
            >
              + Vender
            </Link>
          )}
          <AuthMenu
            isDark={isDark}
            loggedIn={loggedIn}
            email={email}
            avatarUrl={avatarUrl}
            onSelectLogin={() => onAuthSelect("login")}
            onSelectRegister={() => onAuthSelect("register")}
          />

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/40 dark:hover:bg-white/5 transition-colors text-gray-700 dark:text-gray-300 md:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-t border-white/20 dark:border-white/[0.06] bg-white dark:bg-[#0a0a0a]"
          >
            <div className="px-6 py-4 flex flex-col">
              <Link
                href="/"
                className={`py-3 font-semibold text-sm ${pathname === "/" ? "text-brand" : "text-gray-700 dark:text-gray-300"}`}
              >
                Inicio
              </Link>
              <Link
                href="/dashboard"
                className={`py-3 font-semibold text-sm ${inColeccion ? "text-brand" : "text-gray-700 dark:text-gray-300"}`}
              >
                Mi colección
              </Link>
              <Link
                href="/collection/pokemon"
                className={`py-3 font-semibold text-sm ${pathname.startsWith("/collection/pokemon") ? "text-brand" : "text-gray-700 dark:text-gray-300"}`}
              >
                Mercado
              </Link>
              <a
                href="https://www.instagram.com/tcg.rd/"
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 font-semibold text-sm text-gray-700 dark:text-gray-300"
              >
                Nosotros
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

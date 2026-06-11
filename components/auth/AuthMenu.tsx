"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleUser } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthMenuProps = {
  isDark: boolean;
  user: User | null;
  onSelectLogin: () => void;
  onSelectRegister: () => void;
};

export default function AuthMenu({
  isDark,
  user,
  onSelectLogin,
  onSelectRegister,
}: AuthMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function handleLogin() {
    setOpen(false);
    onSelectLogin();
  }

  function handleRegister() {
    setOpen(false);
    onSelectRegister();
  }

  async function handleSignOut() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  const itemClass = `w-full text-left px-4 py-3 rounded-xl text-sm font-bold tracking-tight transition-colors ${
    isDark ? "text-white hover:bg-gray-800" : "text-gray-900 hover:bg-gray-50"
  }`;

  return (
    <div ref={rootRef} className="relative flex items-center gap-4">
      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Cuenta"
        className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <CircleUser className="w-6 h-6" strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute right-0 top-full mt-3 w-56 rounded-2xl border shadow-xl overflow-hidden z-50 ${
              isDark
                ? "bg-[#111] border-gray-800"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="p-2">
              {user ? (
                <>
                  <p
                    className={`px-4 py-2 text-xs truncate ${
                      isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {user.email}
                  </p>
                  <Link
                    href="/perfil"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={`block ${itemClass}`}
                  >
                    Ver perfil
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className={itemClass}
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogin}
                    className={itemClass}
                  >
                    Iniciar sesión
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleRegister}
                    className={itemClass}
                  >
                    Registrar
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

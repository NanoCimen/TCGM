"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Notification = {
  id: string;
  type: string;
  card_id: string | null;
  message: string | null;
  read: boolean;
  created_at: string;
};

export default function NotificationsBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const { data } = await res.json();
    setItems(data ?? []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markAllRead() {
    const hasUnread = items.some((n) => !n.read);
    if (!hasUnread) return;
    await fetch("/api/notifications", { method: "PATCH" });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function handleToggle() {
    if (!open) {
      setOpen(true);
      markAllRead();
    } else {
      setOpen(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notificaciones"
        className="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
      >
        <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full"
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/[0.08] bg-[#111] shadow-[0_24px_60px_-10px_rgba(0,0,0,0.85)] z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <p className="text-sm font-bold text-white">Notificaciones</p>
              {unread > 0 && (
                <span className="text-[10px] bg-brand text-black font-bold px-2 py-0.5 rounded-full">
                  {unread} nuevas
                </span>
              )}
            </div>

            {/* Body */}
            {!loaded ? (
              <div className="px-4 py-6 text-center text-xs text-gray-600">
                Cargando…
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-6 h-6 text-gray-700 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-sm text-gray-500 mb-1 font-medium">Sin notificaciones</p>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Te avisaremos cuando una carta de tu wishlist esté disponible.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04] max-h-72 overflow-y-auto">
                {items.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 transition-colors ${
                      !n.read ? "bg-brand/[0.05]" : ""
                    }`}
                  >
                    {!n.read && (
                      <span className="inline-block w-1.5 h-1.5 bg-brand rounded-full mr-2 mb-0.5 align-middle" />
                    )}
                    <p className="text-xs text-gray-300 leading-relaxed inline">
                      {n.message ?? "Nueva notificación"}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      {n.card_id ? (
                        <Link
                          href={`/cards/${n.card_id}`}
                          onClick={() => setOpen(false)}
                          className="text-[10px] font-bold text-brand hover:underline"
                        >
                          Ver carta →
                        </Link>
                      ) : (
                        <span />
                      )}
                      <span className="text-[10px] text-gray-700">
                        {new Date(n.created_at).toLocaleDateString("es-DO", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

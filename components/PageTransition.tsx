"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    // Opacity only — no x/y/scale. Those animate via CSS transform, and a
    // transformed ancestor becomes the containing block for any
    // position:fixed descendant (headers, modals, overlays — used all over
    // this app), which would silently break their fixed positioning for as
    // long as the page stays mounted.
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        // mode="wait" makes this fully sequential — exit, then enter — so
        // its duration is a mandatory tax on every navigation (was 0.28s
        // each way, ~560ms total). Kept the exact same fade, just quicker,
        // rather than switching to a concurrent mode, since that would let
        // the outgoing and incoming pages' Navbar/AmbientGlow/etc. be
        // mounted simultaneously for a moment — a visual behavior change
        // not worth risking for this.
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

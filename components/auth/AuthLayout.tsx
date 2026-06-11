"use client";

import type { ReactNode } from "react";

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-yap-bg text-white selection:bg-yap-primary selection:text-black">

      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-yap-primary/5 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-zinc-900/40 backdrop-blur-2xl rounded-[32px] border border-white/5 shadow-2xl overflow-hidden">

        <div className="p-8 sm:p-10">
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <h1 className="text-3xl font-bold text-white tracking-tight">TCGRD</h1>
            <p className="text-zinc-500 text-xs mt-1">Pokemon cards — Republica Dominicana</p>

            <div className="mt-6 text-center">
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              {subtitle && (
                <div className="mt-2 text-sm text-zinc-400">{subtitle}</div>
              )}
            </div>
          </div>

          {children}
        </div>

        {footer && (
          <div className="bg-zinc-900/30 px-5 py-4 border-t border-white/5 text-center backdrop-blur-md">
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}

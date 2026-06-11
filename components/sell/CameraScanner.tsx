"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { compressImage } from "./compressImage";

export default function CameraScanner({
  onCaptures,
  onCancel,
}: {
  onCaptures: (previewUrls: string[]) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [permission, setPermission] = useState<"pending" | "granted" | "denied">("pending");
  const [captures, setCaptures] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let active = true;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setPermission("granted");
      } catch {
        if (!active) return;
        setPermission("denied");
      }
    }
    start();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processing || permission !== "granted") return;
    setProcessing(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);

    try {
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92)
      );
      const file = new File([blob], "scan.jpg", { type: "image/jpeg" });
      const dataUrl = await compressImage(file);
      setCaptures((prev) => [...prev, dataUrl]);
    } finally {
      setProcessing(false);
    }
  }, [processing, permission]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        capture();
      }
      if (e.code === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [capture, onCancel]);

  if (permission === "denied") {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center">
          <Camera className="w-8 h-8 text-gray-500" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-white font-black text-xl mb-2">Cámara no disponible</h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
            Permite el acceso a la cámara en la configuración de tu navegador y recarga la página.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="bg-white text-black font-bold px-8 py-3.5 rounded-2xl text-sm"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden select-none">
      {/* Live video */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Flash */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key="flash"
            initial={{ opacity: 0.75 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-white z-20 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Dark panels around card frame */}
      {/* Frame: left 6% – right 6%, top 14% – bottom 28% */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* top strip */}
        <div className="absolute top-0 left-0 right-0 bg-black/65" style={{ height: "14%" }} />
        {/* bottom strip */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/65" style={{ top: "72%" }} />
        {/* left strip */}
        <div
          className="absolute bg-black/65"
          style={{ top: "14%", bottom: "28%", left: 0, width: "6%" }}
        />
        {/* right strip */}
        <div
          className="absolute bg-black/65"
          style={{ top: "14%", bottom: "28%", right: 0, width: "6%" }}
        />
      </div>

      {/* Scanning frame corners + animated scan line */}
      <div
        className="absolute z-20 pointer-events-none overflow-hidden"
        style={{ left: "6%", right: "6%", top: "14%", bottom: "28%" }}
      >
        <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-brand rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-brand rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-brand rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-brand rounded-br-2xl" />

        <motion.div
          animate={{ y: ["4%", "96%", "4%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent opacity-70"
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-14 pb-3">
        <button
          onClick={onCancel}
          className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <span className="text-white font-bold text-sm">
            {captures.length === 0
              ? "Posiciona la carta"
              : `${captures.length} carta${captures.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {captures.length > 0 ? (
            <motion.button
              key="listo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              onClick={() => onCaptures(captures)}
              className="bg-brand text-black font-bold text-sm px-5 py-2.5 rounded-full"
            >
              Listo
            </motion.button>
          ) : (
            <div key="spacer" className="w-[74px]" />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex items-end justify-between px-8 pb-12 pt-4">
        {/* Captured thumbnails (last 3, stacked effect) */}
        <div className="flex items-end gap-2 h-[74px]">
          <AnimatePresence>
            {captures
              .slice(-3)
              .reverse()
              .map((url, i) => (
                <motion.div
                  key={url.slice(-16)}
                  initial={{ opacity: 0, scale: 0.7, y: 12 }}
                  animate={{
                    opacity: 1 - i * 0.22,
                    scale: 1 - i * 0.07,
                    y: 0,
                  }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="relative flex-shrink-0"
                  style={{ zIndex: 3 - i }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="rounded-xl object-cover border-2 border-white/40 shadow-xl"
                    style={{
                      width: i === 0 ? 52 : 40,
                      height: i === 0 ? 68 : 52,
                    }}
                  />
                  {i === 0 && captures.length > 1 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand text-black text-[9px] font-black flex items-center justify-center">
                      {captures.length}
                    </span>
                  )}
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {/* Shutter button */}
        <motion.button
          type="button"
          onClick={capture}
          disabled={processing || permission !== "granted"}
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="relative w-[82px] h-[82px] rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40"
        >
          <div className="absolute inset-0 rounded-full border-[3.5px] border-white" />
          <div
            className={`w-[66px] h-[66px] rounded-full transition-all duration-150 ${
              processing ? "scale-75 bg-white/60" : "bg-white"
            }`}
          />
        </motion.button>

        {/* Right spacer (mirrors thumbnail area) */}
        <div className="w-[82px]" />
      </div>

      {/* Camera initializing */}
      {permission === "pending" && (
        <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center gap-5">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-full border-2 border-brand border-t-transparent"
          />
          <p className="text-gray-400 text-sm font-medium">Solicitando acceso a cámara...</p>
        </div>
      )}
    </div>
  );
}

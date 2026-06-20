"use client";

import { useRef, useState } from "react";
import { Camera, ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { compressImage } from "./compressImage";

const ACCEPTED = "image/jpeg,image/png,image/webp";


function CardGuideFrame() {
  return (
    <div className="relative mx-auto" style={{ width: 160, height: 214 }}>
      <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-gray-600" />
      <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-brand rounded-tl-2xl" />
      <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-brand rounded-tr-2xl" />
      <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-brand rounded-bl-2xl" />
      <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-brand rounded-br-2xl" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <Camera className="w-8 h-8 text-gray-600" strokeWidth={1.5} />
        <p className="text-[11px] text-gray-500 text-center leading-tight">
          Posiciona la carta
          <br />
          aquí
        </p>
      </div>
    </div>
  );
}

export default function ImageUpload({
  previewUrl,
  onImageReady,
  onContinue,
  onOpenScanner,
  onManual,
}: {
  previewUrl: string | null;
  onImageReady: (dataUrl: string) => void;
  onContinue: () => void;
  onOpenScanner: () => void;
  onManual: () => void;
}) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [numberConfirmed, setNumberConfirmed] = useState(false);
  const [showNumberWarning, setShowNumberWarning] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED.split(",").includes(file.type)) {
      setError("Formato no soportado. Usa JPG, PNG o WebP.");
      return;
    }

    setError("");
    setNumberConfirmed(false);
    setShowNumberWarning(false);
    setProcessing(true);
    try {
      const dataUrl = await compressImage(file);
      onImageReady(dataUrl);
    } catch {
      setError("No se pudo procesar la imagen. Intenta con otra foto.");
    } finally {
      setProcessing(false);
    }
  }

  function handleContinue() {
    if (!numberConfirmed) {
      setShowNumberWarning(true);
      return;
    }
    onContinue();
  }

  function handleManual() {
    if (!numberConfirmed) {
      setShowNumberWarning(true);
      return;
    }
    onManual();
  }

  return (
    <div>
      <h2 className="text-2xl font-black tracking-tight text-white text-center mb-2">
        Sube tu carta
      </h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        Escanea o sube una foto clara de tu carta para identificarla con IA
      </p>

      <input
        ref={galleryInputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleFile}
      />

      {previewUrl ? (
        <div className="flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Tu carta"
            className="max-h-[360px] w-auto rounded-2xl border border-gray-800 shadow-2xl mb-5"
          />

          <label
            className={`flex items-start gap-3 w-full max-w-sm p-4 rounded-xl border cursor-pointer transition-colors mb-1 ${
              numberConfirmed
                ? "border-brand/40 bg-brand/5"
                : showNumberWarning
                  ? "border-amber-500/50 bg-amber-900/10"
                  : "border-gray-700 bg-gray-900/50"
            }`}
          >
            <input
              type="checkbox"
              checked={numberConfirmed}
              onChange={(e) => {
                setNumberConfirmed(e.target.checked);
                if (e.target.checked) setShowNumberWarning(false);
              }}
              className="mt-0.5 w-4 h-4 rounded accent-brand flex-shrink-0"
            />
            <div>
              <p className="text-sm font-semibold text-white leading-tight">
                ¿Se lee el número de la carta?
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Confirma que el número en la esquina inferior es visible
              </p>
            </div>
          </label>

          {showNumberWarning && (
            <p className="text-amber-400 text-xs text-center mb-3 px-4">
              ⚠️ El número es clave para identificar tu carta correctamente
            </p>
          )}

          <div
            className={`flex flex-col gap-3 w-full max-w-sm ${
              showNumberWarning ? "mt-0" : "mt-3"
            }`}
          >
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-gray-700 text-sm font-bold text-gray-300 hover:bg-gray-900 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                Cambiar foto
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={processing}
                className="flex-1 bg-brand text-black text-sm font-bold py-3.5 rounded-xl hover:bg-[#00c64b] transition-colors disabled:opacity-50"
              >
                Analizar con IA →
              </button>
            </div>
            <button
              type="button"
              onClick={handleManual}
              disabled={processing}
              className="w-full py-2.5 rounded-xl border border-gray-800 text-xs font-bold text-gray-500 hover:text-gray-300 hover:border-gray-700 transition-colors disabled:opacity-50"
            >
              Ingresar datos manualmente
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          {processing ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <Loader2 className="w-10 h-10 text-brand animate-spin" />
              <p className="text-sm text-gray-400">Procesando imagen...</p>
            </div>
          ) : (
            <>
              <CardGuideFrame />

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="flex items-center justify-center gap-2 bg-brand text-black text-sm font-bold py-4 rounded-xl hover:bg-[#00c64b] transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Escanear con cámara
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 border border-gray-700 text-gray-200 text-sm font-bold py-4 rounded-xl hover:bg-gray-900 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  Elegir de galería
                </button>
              </div>

              <p className="text-[11px] text-gray-600">
                JPG, PNG o WebP — máx. 1MB después de compresión
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs text-center mt-4">{error}</p>
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { Camera, ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { compressImage } from "./compressImage";

const ACCEPTED = "image/jpeg,image/png,image/webp";

const TIPS = [
  { icon: "📋", text: "Coloca la carta sobre fondo oscuro" },
  { icon: "💡", text: "Asegúrate de tener buena iluminación" },
  { icon: "🔢", text: "El número de la carta debe ser legible" },
];

function CardGuideFrame() {
  return (
    <div className="relative mx-auto" style={{ width: 160, height: 214 }}>
      {/* Dashed card border */}
      <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-gray-600" />

      {/* Corner bracket — top-left */}
      <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-brand rounded-tl-2xl" />
      {/* top-right */}
      <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-brand rounded-tr-2xl" />
      {/* bottom-left */}
      <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-brand rounded-bl-2xl" />
      {/* bottom-right */}
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

function ExamplePhotos() {
  return (
    <div className="flex gap-4 w-full">
      {/* Bad example */}
      <div className="flex-1 flex flex-col items-center gap-1.5">
        <div
          className="relative w-full rounded-xl overflow-hidden border border-gray-800 bg-gray-950"
          style={{ aspectRatio: "3 / 4" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-950" />
          <div className="absolute inset-4 rounded-lg border border-gray-700 opacity-40 rotate-[15deg]" />
          <div className="absolute inset-0 bg-red-900/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-red-950 border-2 border-red-500 flex items-center justify-center">
              <span className="text-red-400 text-sm font-black leading-none">✕</span>
            </div>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-red-400">Así no</span>
      </div>

      {/* Good example */}
      <div className="flex-1 flex flex-col items-center gap-1.5">
        <div
          className="relative w-full rounded-xl overflow-hidden border border-gray-700 bg-gray-900"
          style={{ aspectRatio: "3 / 4" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-900" />
          <div className="absolute inset-3 rounded-lg border border-gray-500 opacity-50" />
          <div className="absolute inset-0 bg-brand/5" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-brand/20 border-2 border-brand flex items-center justify-center">
              <span className="text-brand text-sm font-black leading-none">✓</span>
            </div>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-brand">Así sí</span>
      </div>
    </div>
  );
}

export default function ImageUpload({
  previewUrl,
  onImageReady,
  onContinue,
}: {
  previewUrl: string | null;
  onImageReady: (dataUrl: string) => void;
  onContinue: () => void;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
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

  return (
    <div>
      <h2 className="text-2xl font-black tracking-tight text-white text-center mb-2">
        Sube tu carta
      </h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        Toma una foto clara de tu carta para identificarla con IA
      </p>

      <input
        ref={cameraInputRef}
        type="file"
        accept={ACCEPTED}
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
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

          {/* Number legibility confirmation */}
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

          <div className={`flex flex-col sm:flex-row gap-3 w-full max-w-sm ${showNumberWarning ? "mt-0" : "mt-3"}`}>
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
              Continuar →
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

              {/* Tips */}
              <div className="w-full max-w-xs space-y-2">
                {TIPS.map(({ icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-900/60 border border-gray-800"
                  >
                    <span className="text-base leading-none flex-shrink-0">{icon}</span>
                    <span className="text-xs text-gray-300">{text}</span>
                  </div>
                ))}
              </div>

              {/* Example photos */}
              <div className="w-full max-w-xs">
                <p className="text-[11px] text-gray-500 text-center mb-3 uppercase tracking-wider font-semibold">
                  Ejemplo de foto
                </p>
                <ExamplePhotos />
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 bg-brand text-black text-sm font-bold py-4 rounded-xl hover:bg-[#00c64b] transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Tomar foto
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

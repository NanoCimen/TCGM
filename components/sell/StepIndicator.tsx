"use client";

import { Check } from "lucide-react";

const STEPS = ["Foto", "Identificar", "Precio", "Listo"];

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((label, i) => {
        const stepNumber = i + 1;
        const isDone = stepNumber < current;
        const isActive = stepNumber === current;

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isDone
                    ? "bg-brand text-black"
                    : isActive
                      ? "bg-brand/15 text-brand border-2 border-brand"
                      : "bg-gray-900 text-gray-600 border border-gray-800"
                }`}
              >
                {isDone ? <Check className="w-4 h-4" strokeWidth={3} /> : stepNumber}
              </div>
              <span
                className={`mt-2 text-[10px] font-bold uppercase tracking-widest ${
                  isActive || isDone ? "text-white" : "text-gray-600"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-10 sm:w-16 h-0.5 mx-2 mb-6 rounded transition-colors ${
                  stepNumber < current ? "bg-brand" : "bg-gray-800"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

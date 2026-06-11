"use client";

import { useRef, KeyboardEvent, ClipboardEvent } from "react";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  isDark: boolean;
  onComplete?: (code: string) => void;
};

export default function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  isDark,
  onComplete,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? "");

  function focusAt(index: number) {
    inputsRef.current[index]?.focus();
  }

  function emitChange(next: string) {
    onChange(next);
    if (next.length === length && onComplete) {
      onComplete(next);
    }
  }

  function handleChange(index: number, char: string) {
    const digit = char.replace(/\D/g, "").slice(-1);
    const nextChars = [...chars];
    nextChars[index] = digit;
    const next = nextChars.join("").replace(/\s/g, "");
    emitChange(next.slice(0, length));
    if (digit && index < length - 1) focusAt(index + 1);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (chars[index]) {
        const nextChars = [...chars];
        nextChars[index] = "";
        emitChange(nextChars.join("").trimEnd());
      } else if (index > 0) {
        focusAt(index - 1);
        const nextChars = [...chars];
        nextChars[index - 1] = "";
        emitChange(nextChars.join("").trimEnd());
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusAt(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      focusAt(index + 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    emitChange(pasted);
    focusAt(Math.min(pasted.length, length - 1));
  }

  const boxClass = (filled: boolean, focused: boolean) => {
    const base =
      "w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all";
    if (isDark) {
      if (focused) return `${base} border-white bg-gray-900 text-white`;
      if (filled) return `${base} border-gray-600 bg-gray-900 text-white`;
      return `${base} border-gray-700 bg-gray-900/50 text-white`;
    }
    if (focused) return `${base} border-gray-900 bg-white text-gray-900`;
    if (filled) return `${base} border-gray-300 bg-white text-gray-900`;
    return `${base} border-gray-200 bg-white text-gray-900`;
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {chars.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={boxClass(!!digit, false)}
          aria-label={`Dígito ${index + 1}`}
        />
      ))}
    </div>
  );
}

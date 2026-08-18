"use client";

import { useState } from "react";
import Image from "next/image";

export default function CardThumbnail({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={`bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 ${className}`}
      />
    );
  }

  // Every caller sizes this via a fixed-size wrapper div and passes
  // "w-full h-full" here — seller photos in particular can be multiple MB
  // straight off a phone camera despite rendering at ~50-300px, so this
  // was silently shipping full-resolution originals everywhere a card
  // shows up (trending table, grids, dashboard, search...). `fill` lets
  // next/image request an appropriately-sized, compressed version instead.
  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 15vw, 200px"
        className="object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}

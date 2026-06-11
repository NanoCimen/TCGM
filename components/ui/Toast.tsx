"use client";

import { useEffect, useState } from "react";

export default function Toast({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-[toastSlideIn_0.3s_ease] rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
      {message}
    </div>
  );
}

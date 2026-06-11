export const VARIANTS = [
  "Regular",
  "Reverse Holo",
  "Holo",
  "Full Art",
  "Illustration Rare",
  "Special Illustration Rare",
  "Hyper Rare / Rainbow",
  "Gold Rare",
] as const;

export type CardVariant = (typeof VARIANTS)[number];

export const LANGUAGES = [
  { code: "EN", label: "Inglés", flag: "🇺🇸" },
  { code: "JP", label: "Japonés", flag: "🇯🇵" },
  { code: "ES", label: "Español", flag: "🇪🇸" },
  { code: "KR", label: "Coreano", flag: "🇰🇷" },
] as const;

export type CardLanguage = "EN" | "JP" | "ES" | "KR";

export const LANGUAGE_FLAG: Record<string, string> = {
  EN: "🇺🇸",
  JP: "🇯🇵",
  ES: "🇪🇸",
  KR: "🇰🇷",
};

export const VARIANT_BADGE_STYLES: Record<string, string> = {
  "Reverse Holo": "bg-purple-900/40 text-purple-400 border-purple-800",
  Holo: "bg-cyan-900/40 text-cyan-400 border-cyan-800",
  "Full Art": "bg-blue-900/40 text-blue-400 border-blue-800",
  "Illustration Rare": "bg-amber-900/40 text-amber-400 border-amber-800",
  "Special Illustration Rare": "bg-amber-900/40 text-amber-500 border-amber-700",
  "Hyper Rare / Rainbow": "bg-pink-900/40 text-pink-400 border-pink-800",
  "Gold Rare": "bg-yellow-900/40 text-yellow-400 border-yellow-800",
};

export const VARIANT_SEARCH_SUFFIX: Record<string, string> = {
  "Reverse Holo": "reverse holo",
  Holo: "holo",
  "Full Art": "full art",
  "Illustration Rare": "illustration rare",
  "Special Illustration Rare": "special illustration rare",
  "Hyper Rare / Rainbow": "rainbow rare",
  "Gold Rare": "gold rare",
};

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

// All known Pokémon TCG sets — newest first
export const POKEMON_SETS = [
  // Scarlet & Violet era (2023–2025)
  "Prismatic Evolutions",
  "Surging Sparks",
  "Stellar Crown",
  "Shrouded Fable",
  "Twilight Masquerade",
  "Temporal Forces",
  "Paldean Fates",
  "Paradox Rift",
  "Obsidian Flames",
  "Paldea Evolved",
  "Scarlet & Violet",
  // Sword & Shield era (2020–2023)
  "Crown Zenith",
  "Silver Tempest",
  "Lost Origin",
  "Pokémon GO",
  "Astral Radiance",
  "Brilliant Stars",
  "Fusion Strike",
  "Celebrations",
  "Evolving Skies",
  "Chilling Reign",
  "Battle Styles",
  "Shining Fates",
  "Vivid Voltage",
  "Champion's Path",
  "Darkness Ablaze",
  "Rebel Clash",
  "Sword & Shield",
  // Sun & Moon era (2017–2019)
  "Cosmic Eclipse",
  "Hidden Fates",
  "Unified Minds",
  "Unbroken Bonds",
  "Detective Pikachu",
  "Team Up",
  "Lost Thunder",
  "Dragon Majesty",
  "Celestial Storm",
  "Forbidden Light",
  "Ultra Prism",
  "Crimson Invasion",
  "Shining Legends",
  "Burning Shadows",
  "Guardians Rising",
  "Sun & Moon",
  // XY era (2014–2017)
  "Evolutions",
  "Steam Siege",
  "Fates Collide",
  "BREAKpoint",
  "BREAKthrough",
  "Ancient Origins",
  "Roaring Skies",
  "Double Crisis",
  "Primal Clash",
  "Phantom Forces",
  "Furious Fists",
  "Flashfire",
  "XY",
  // Black & White era (2011–2013)
  "Legendary Treasures",
  "Plasma Blast",
  "Plasma Freeze",
  "Plasma Storm",
  "Boundaries Crossed",
  "Dragons Exalted",
  "Dark Explorers",
  "Next Destinies",
  "Noble Victories",
  "Emerging Powers",
  "Black & White",
  // HeartGold & SoulSilver era (2010–2011)
  "Call of Legends",
  "Triumphant",
  "Undaunted",
  "Unleashed",
  "HeartGold & SoulSilver",
  // Promos & special sets
  "McDonald's Collection",
  "Trainer Gallery",
  "Black Star Promos",
] as const;

export type PokemonSet = (typeof POKEMON_SETS)[number];

export const VARIANT_SEARCH_SUFFIX: Record<string, string> = {
  "Reverse Holo": "reverse holo",
  Holo: "holo",
  "Full Art": "full art",
  "Illustration Rare": "illustration rare",
  "Special Illustration Rare": "special illustration rare",
  "Hyper Rare / Rainbow": "rainbow rare",
  "Gold Rare": "gold rare",
};

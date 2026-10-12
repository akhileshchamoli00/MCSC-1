"use client";

import React from "react";

export type WallpaperCategory = "nature" | "art" | "ambient";

export interface WallpaperThemePalette {
  // Client channel bubble (when self sends in Client channel)
  clientBubbleBg: string;
  clientBubbleBorder: string;
  clientText: string;
  clientMeta: string;

  // Internal channel bubble (when self sends in Internal channel)
  internalBubbleBg: string;
  internalBubbleBorder: string;
  internalText: string;
  internalMeta: string;

  // Other participant bubble (when other party sends in either channel)
  otherBubbleBg: string;
  otherBubbleBorder: string;
  otherText: string;
  otherMeta: string;
}

export interface WallpaperPreset {
  id: string;
  name: string;
  description: string;
  category: WallpaperCategory;
  badge?: string;
  thumbnailStyle: React.CSSProperties;
  style: React.CSSProperties;
  palette: WallpaperThemePalette;
}

export interface WallpaperSettings {
  id: string;
  opacity: number; // 0.05 to 0.70
  customUrl?: string;
}

const STORAGE_KEY = "mcsc_order_chat_wallpaper_v2";
const LEGACY_STORAGE_KEY = "mcsc_order_chat_wallpaper_v1";

// Clean inline SVG for elegant contour topography
const TOPOGRAPHY_SVG = `data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 80 Q100 40 200 90 T400 60 M0 140 Q100 110 200 150 T400 120 M0 200 Q100 170 200 220 T400 180 M0 260 Q100 230 200 280 T400 240 M0 320 Q100 290 200 340 T400 300 M0 380 Q100 350 200 400 T400 360' fill='none' stroke='%23ffffff' stroke-width='1.2' stroke-opacity='0.12'/%3E%3Cpath d='M50 0 Q90 100 60 200 T80 400 M130 0 Q170 100 140 200 T160 400 M230 0 Q270 100 240 200 T260 400 M330 0 Q370 100 340 200 T360 400' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.08'/%3E%3C/svg%3E`;

// Clean inline SVG for modern geometric isometric mesh
const ISOMETRIC_SVG = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 17.32 L60 51.96 L30 60 L0 51.96 L0 17.32 Z' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.1'/%3E%3Cpath d='M30 0 L30 60 M0 17.32 L60 51.96 M0 51.96 L60 17.32' fill='none' stroke='%23ffffff' stroke-width='0.5' stroke-opacity='0.06'/%3E%3C/svg%3E`;

export const DEFAULT_THEME_PALETTE: WallpaperThemePalette = {
  clientBubbleBg: "rgba(16, 22, 52, 0.52)",
  clientBubbleBorder: "rgba(129, 140, 248, 0.38)",
  clientText: "#C7D2FE",
  clientMeta: "#A5B4FC",
  internalBubbleBg: "rgba(10, 28, 48, 0.52)",
  internalBubbleBorder: "rgba(56, 189, 248, 0.38)",
  internalText: "#BAE6FD",
  internalMeta: "#7DD3FC",
  otherBubbleBg: "rgba(10, 16, 28, 0.58)",
  otherBubbleBorder: "rgba(255, 255, 255, 0.20)",
  otherText: "#FFFFFF",
  otherMeta: "#94A3B8"
};

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  // ---------------------------------------------------------------------------
  // Scenic & Nature Themes
  // ---------------------------------------------------------------------------
  {
    id: "midnight_alps",
    name: "Midnight Starry Alps",
    description: "Deep sapphire night sky and milky way over alpine ridges and mountain lake",
    category: "nature",
    badge: "Default",
    thumbnailStyle: {
      backgroundImage: 'url("/wallpapers/midnight_alps.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    },
    style: {
      backgroundImage: 'url("/wallpapers/midnight_alps.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: "#060A14"
    },
    palette: {
      clientBubbleBg: "rgba(16, 22, 52, 0.52)",
      clientBubbleBorder: "rgba(129, 140, 248, 0.38)",
      clientText: "#C7D2FE",
      clientMeta: "#A5B4FC",
      internalBubbleBg: "rgba(10, 28, 48, 0.52)",
      internalBubbleBorder: "rgba(56, 189, 248, 0.38)",
      internalText: "#BAE6FD",
      internalMeta: "#7DD3FC",
      otherBubbleBg: "rgba(10, 16, 28, 0.58)",
      otherBubbleBorder: "rgba(255, 255, 255, 0.20)",
      otherText: "#FFFFFF",
      otherMeta: "#94A3B8"
    }
  },
  {
    id: "milky_way_peaks",
    name: "Milky Way Glaciers",
    description: "Milky Way galaxy shining bright over snowy peaks and still glacial lake",
    category: "nature",
    badge: "Popular",
    thumbnailStyle: {
      backgroundImage: 'url("/wallpapers/milky_way_peaks.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    },
    style: {
      backgroundImage: 'url("/wallpapers/milky_way_peaks.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: "#070B12"
    },
    palette: {
      clientBubbleBg: "rgba(12, 28, 48, 0.52)",
      clientBubbleBorder: "rgba(56, 189, 248, 0.38)",
      clientText: "#BAE6FD",
      clientMeta: "#7DD3FC",
      internalBubbleBg: "rgba(8, 36, 36, 0.52)",
      internalBubbleBorder: "rgba(45, 212, 191, 0.38)",
      internalText: "#99F6E4",
      internalMeta: "#5EEAD4",
      otherBubbleBg: "rgba(12, 18, 28, 0.58)",
      otherBubbleBorder: "rgba(255, 255, 255, 0.20)",
      otherText: "#FFFFFF",
      otherMeta: "#94A3B8"
    }
  },
  {
    id: "golden_sunset_peaks",
    name: "Golden Hour Peaks",
    description: "Warm sunset glow reflecting off snowy mountain range and crystal river",
    category: "nature",
    badge: "Warm",
    thumbnailStyle: {
      backgroundImage: 'url("/wallpapers/golden_sunset_peaks.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    },
    style: {
      backgroundImage: 'url("/wallpapers/golden_sunset_peaks.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: "#160C07"
    },
    palette: {
      clientBubbleBg: "rgba(38, 16, 24, 0.52)",
      clientBubbleBorder: "rgba(251, 113, 133, 0.38)",
      clientText: "#FECDD3",
      clientMeta: "#FDA4AF",
      internalBubbleBg: "rgba(38, 22, 8, 0.52)",
      internalBubbleBorder: "rgba(245, 158, 11, 0.38)",
      internalText: "#FDE68A",
      internalMeta: "#FCD34D",
      otherBubbleBg: "rgba(22, 16, 12, 0.58)",
      otherBubbleBorder: "rgba(255, 255, 255, 0.20)",
      otherText: "#FFFBEB",
      otherMeta: "#D1D5DB"
    }
  },
  {
    id: "alpine_mountains",
    name: "Alpine Pine Mist",
    description: "Serene misty pine forest with layered mountain ridges and morning fog",
    category: "nature",
    badge: "Scenic",
    thumbnailStyle: {
      backgroundImage: 'url("/wallpapers/alpine_mountains.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    },
    style: {
      backgroundImage: 'url("/wallpapers/alpine_mountains.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: "#0B0D13"
    },
    palette: {
      clientBubbleBg: "rgba(10, 28, 22, 0.52)",
      clientBubbleBorder: "rgba(52, 211, 153, 0.38)",
      clientText: "#A7F3D0",
      clientMeta: "#6EE7B7",
      internalBubbleBg: "rgba(12, 26, 42, 0.52)",
      internalBubbleBorder: "rgba(56, 189, 248, 0.38)",
      internalText: "#BAE6FD",
      internalMeta: "#7DD3FC",
      otherBubbleBg: "rgba(14, 20, 24, 0.58)",
      otherBubbleBorder: "rgba(255, 255, 255, 0.20)",
      otherText: "#FFFFFF",
      otherMeta: "#94A3B8"
    }
  },
  {
    id: "aurora_fjord",
    name: "Aurora Fjord",
    description: "Vibrant emerald northern lights dancing over snowy arctic peaks and fjord",
    category: "nature",
    badge: "Popular",
    thumbnailStyle: {
      backgroundImage: 'url("/wallpapers/aurora_fjord.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    },
    style: {
      backgroundImage: 'url("/wallpapers/aurora_fjord.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: "#090F14"
    },
    palette: {
      clientBubbleBg: "rgba(6, 32, 20, 0.52)",
      clientBubbleBorder: "rgba(74, 222, 128, 0.40)",
      clientText: "#86EFAC",
      clientMeta: "#4ADE80",
      internalBubbleBg: "rgba(8, 30, 42, 0.52)",
      internalBubbleBorder: "rgba(34, 211, 238, 0.40)",
      internalText: "#A5F3FC",
      internalMeta: "#67E8F9",
      otherBubbleBg: "rgba(8, 20, 24, 0.58)",
      otherBubbleBorder: "rgba(255, 255, 255, 0.20)",
      otherText: "#FFFFFF",
      otherMeta: "#94A3B8"
    }
  },
  {
    id: "pacific_sunset",
    name: "Pacific Sunset",
    description: "Calm coastal ocean waves and rocky shoreline during purple-gold dusk",
    category: "nature",
    badge: "Calm",
    thumbnailStyle: {
      backgroundImage: 'url("/wallpapers/pacific_sunset.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    },
    style: {
      backgroundImage: 'url("/wallpapers/pacific_sunset.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: "#130B14"
    },
    palette: {
      clientBubbleBg: "rgba(30, 16, 46, 0.52)",
      clientBubbleBorder: "rgba(192, 132, 252, 0.38)",
      clientText: "#E9D5FF",
      clientMeta: "#D8B4FE",
      internalBubbleBg: "rgba(38, 20, 14, 0.52)",
      internalBubbleBorder: "rgba(251, 146, 60, 0.38)",
      internalText: "#FED7AA",
      internalMeta: "#FDBA74",
      otherBubbleBg: "rgba(22, 14, 24, 0.58)",
      otherBubbleBorder: "rgba(255, 255, 255, 0.20)",
      otherText: "#FFFFFF",
      otherMeta: "#D1D5DB"
    }
  },
  {
    id: "bamboo_sanctuary",
    name: "Bamboo Sanctuary",
    description: "Tranquil Kyoto bamboo grove with filtered morning sunlight and mossy path",
    category: "nature",
    badge: "Zen",
    thumbnailStyle: {
      backgroundImage: 'url("/wallpapers/bamboo_sanctuary.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    },
    style: {
      backgroundImage: 'url("/wallpapers/bamboo_sanctuary.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: "#0A130D"
    },
    palette: {
      clientBubbleBg: "rgba(10, 32, 18, 0.52)",
      clientBubbleBorder: "rgba(74, 222, 128, 0.38)",
      clientText: "#BBF7D0",
      clientMeta: "#86EFAC",
      internalBubbleBg: "rgba(32, 30, 10, 0.52)",
      internalBubbleBorder: "rgba(250, 204, 21, 0.38)",
      internalText: "#FEF08A",
      internalMeta: "#FDE047",
      otherBubbleBg: "rgba(12, 24, 16, 0.58)",
      otherBubbleBorder: "rgba(255, 255, 255, 0.20)",
      otherText: "#FFFFFF",
      otherMeta: "#94A3B8"
    }
  },
  {
    id: "golden_dunes",
    name: "Starlight Dunes",
    description: "Smooth desert sand dunes under a dusky violet and milky way night sky",
    category: "nature",
    badge: "Scenic",
    thumbnailStyle: {
      backgroundImage: 'url("/wallpapers/golden_dunes.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    },
    style: {
      backgroundImage: 'url("/wallpapers/golden_dunes.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: "#130E14"
    },
    palette: {
      clientBubbleBg: "rgba(28, 16, 44, 0.52)",
      clientBubbleBorder: "rgba(167, 139, 250, 0.38)",
      clientText: "#DDD6FE",
      clientMeta: "#C4B5FD",
      internalBubbleBg: "rgba(36, 24, 10, 0.52)",
      internalBubbleBorder: "rgba(245, 158, 11, 0.38)",
      internalText: "#FDE68A",
      internalMeta: "#FCD34D",
      otherBubbleBg: "rgba(22, 16, 26, 0.58)",
      otherBubbleBorder: "rgba(255, 255, 255, 0.20)",
      otherText: "#FFFFFF",
      otherMeta: "#D1D5DB"
    }
  },

  // ---------------------------------------------------------------------------
  // Art & Sci-Fi Landscapes
  // ---------------------------------------------------------------------------
  {
    id: "cosmic_tree",
    name: "Cosmic Horizon & Tree",
    description: "Celestial planetary sky, purple tree of life, and shooting star",
    category: "art",
    badge: "Art",
    thumbnailStyle: {
      backgroundImage: 'url("/wallpapers/cosmic_tree.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    },
    style: {
      backgroundImage: 'url("/wallpapers/cosmic_tree.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: "#0D0A1C"
    },
    palette: {
      clientBubbleBg: "rgba(30, 14, 52, 0.52)",
      clientBubbleBorder: "rgba(192, 132, 252, 0.40)",
      clientText: "#E9D5FF",
      clientMeta: "#D8B4FE",
      internalBubbleBg: "rgba(40, 12, 36, 0.52)",
      internalBubbleBorder: "rgba(244, 114, 182, 0.40)",
      internalText: "#FBCFE8",
      internalMeta: "#F472B6",
      otherBubbleBg: "rgba(18, 12, 30, 0.58)",
      otherBubbleBorder: "rgba(255, 255, 255, 0.20)",
      otherText: "#FFFFFF",
      otherMeta: "#C4B5FD"
    }
  },
  {
    id: "golden_thunder",
    name: "Golden Thunder Arc",
    description: "High-contrast golden lightning and electric blade silhouette",
    category: "art",
    badge: "Anime",
    thumbnailStyle: {
      backgroundImage: 'url("/wallpapers/golden_thunder.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    },
    style: {
      backgroundImage: 'url("/wallpapers/golden_thunder.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: "#0A0802"
    },
    palette: {
      clientBubbleBg: "rgba(36, 26, 4, 0.55)",
      clientBubbleBorder: "rgba(250, 204, 21, 0.45)",
      clientText: "#FEF08A",
      clientMeta: "#FACC15",
      internalBubbleBg: "rgba(38, 18, 6, 0.55)",
      internalBubbleBorder: "rgba(251, 146, 60, 0.42)",
      internalText: "#FED7AA",
      internalMeta: "#FB923C",
      otherBubbleBg: "rgba(20, 16, 6, 0.62)",
      otherBubbleBorder: "rgba(255, 255, 255, 0.22)",
      otherText: "#FFFFFF",
      otherMeta: "#FDE047"
    }
  },
  {
    id: "ultra_instinct",
    name: "Ultra Instinct Aura",
    description: "Deep dark void with radiant silver-white aura and floating shattered fragments",
    category: "art",
    badge: "Anime",
    thumbnailStyle: {
      backgroundImage: 'url("/wallpapers/ultra_instinct.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    },
    style: {
      backgroundImage: 'url("/wallpapers/ultra_instinct.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: "#050608"
    },
    palette: {
      clientBubbleBg: "rgba(18, 24, 38, 0.55)",
      clientBubbleBorder: "rgba(186, 230, 253, 0.40)",
      clientText: "#E0F2FE",
      clientMeta: "#93C5FD",
      internalBubbleBg: "rgba(22, 20, 32, 0.55)",
      internalBubbleBorder: "rgba(216, 180, 254, 0.40)",
      internalText: "#F3E8FF",
      internalMeta: "#C4B5FD",
      otherBubbleBg: "rgba(14, 16, 22, 0.62)",
      otherBubbleBorder: "rgba(255, 255, 255, 0.22)",
      otherText: "#FFFFFF",
      otherMeta: "#94A3B8"
    }
  },

  // ---------------------------------------------------------------------------
  // Ambient & Minimalist Textures
  // ---------------------------------------------------------------------------
  {
    id: "obsidian_aurora",
    name: "Obsidian Aurora",
    description: "Deep charcoal with ambient lavender and warm amber glow",
    category: "ambient",
    badge: "Ambient",
    thumbnailStyle: {
      background: "radial-gradient(circle at 20% 20%, rgba(168, 85, 247, 0.4), transparent 50%), radial-gradient(circle at 80% 80%, rgba(245, 158, 11, 0.35), transparent 50%), #0F1117"
    },
    style: {
      backgroundImage: "radial-gradient(ellipse 65% 50% at 15% 15%, rgba(147, 51, 234, 0.18), transparent 70%), radial-gradient(ellipse 55% 55% at 85% 85%, rgba(245, 158, 11, 0.14), transparent 70%), radial-gradient(ellipse 40% 40% at 50% 50%, rgba(59, 130, 246, 0.08), transparent 75%)",
      backgroundColor: "#0B0D13"
    },
    palette: {
      clientBubbleBg: "rgba(28, 14, 46, 0.52)",
      clientBubbleBorder: "rgba(192, 132, 252, 0.38)",
      clientText: "#E9D5FF",
      clientMeta: "#D8B4FE",
      internalBubbleBg: "rgba(36, 20, 8, 0.52)",
      internalBubbleBorder: "rgba(245, 158, 11, 0.38)",
      internalText: "#FED7AA",
      internalMeta: "#FDBA74",
      otherBubbleBg: "rgba(18, 20, 26, 0.58)",
      otherBubbleBorder: "rgba(255, 255, 255, 0.20)",
      otherText: "#F4F4F8",
      otherMeta: "#94A3B8"
    }
  },
  {
    id: "tech_grid",
    name: "Modern Tech Grid",
    description: "Subtle architectural dot-matrix coordinate matrix",
    category: "ambient",
    badge: "Minimal",
    thumbnailStyle: {
      backgroundColor: "#0F1117",
      backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px)",
      backgroundSize: "12px 12px"
    },
    style: {
      backgroundColor: "#0B0D12",
      backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.22) 1px, transparent 1px), radial-gradient(rgba(147, 51, 234, 0.15) 1px, transparent 1px)",
      backgroundSize: "24px 24px, 48px 48px",
      backgroundPosition: "0 0, 12px 12px"
    },
    palette: {
      clientBubbleBg: "rgba(10, 24, 44, 0.52)",
      clientBubbleBorder: "rgba(56, 189, 248, 0.38)",
      clientText: "#BAE6FD",
      clientMeta: "#7DD3FC",
      internalBubbleBg: "rgba(26, 16, 44, 0.52)",
      internalBubbleBorder: "rgba(168, 85, 247, 0.38)",
      internalText: "#DDD6FE",
      internalMeta: "#C4B5FD",
      otherBubbleBg: "rgba(16, 20, 28, 0.58)",
      otherBubbleBorder: "rgba(255, 255, 255, 0.20)",
      otherText: "#FFFFFF",
      otherMeta: "#94A3B8"
    }
  },
  {
    id: "topography",
    name: "Luxury Topography",
    description: "Flowing organic contour lines with telegram-style elegance",
    category: "ambient",
    badge: "Elegant",
    thumbnailStyle: {
      backgroundColor: "#0F1117",
      backgroundImage: `url("${TOPOGRAPHY_SVG}")`,
      backgroundSize: "100px 100px"
    },
    style: {
      backgroundColor: "#0A0C10",
      backgroundImage: `url("${TOPOGRAPHY_SVG}")`,
      backgroundSize: "360px 360px",
      backgroundRepeat: "repeat"
    },
    palette: {
      clientBubbleBg: "rgba(26, 20, 8, 0.52)",
      clientBubbleBorder: "rgba(234, 179, 8, 0.38)",
      clientText: "#FEF08A",
      clientMeta: "#FDE047",
      internalBubbleBg: "rgba(10, 28, 20, 0.52)",
      internalBubbleBorder: "rgba(52, 211, 153, 0.38)",
      internalText: "#A7F3D0",
      internalMeta: "#6EE7B7",
      otherBubbleBg: "rgba(16, 18, 24, 0.58)",
      otherBubbleBorder: "rgba(255, 255, 255, 0.20)",
      otherText: "#FFFFFF",
      otherMeta: "#94A3B8"
    }
  },
  {
    id: "geometric_mesh",
    name: "Geometric Hex Mesh",
    description: "Sleek isometric honeycomb micro-geometry",
    category: "ambient",
    thumbnailStyle: {
      backgroundColor: "#0F1117",
      backgroundImage: `url("${ISOMETRIC_SVG}")`,
      backgroundSize: "30px 30px"
    },
    style: {
      backgroundColor: "#0B0D13",
      backgroundImage: `url("${ISOMETRIC_SVG}")`,
      backgroundSize: "60px 60px",
      backgroundRepeat: "repeat"
    },
    palette: {
      clientBubbleBg: "rgba(12, 26, 44, 0.52)",
      clientBubbleBorder: "rgba(56, 189, 248, 0.38)",
      clientText: "#BAE6FD",
      clientMeta: "#7DD3FC",
      internalBubbleBg: "rgba(26, 18, 44, 0.52)",
      internalBubbleBorder: "rgba(168, 85, 247, 0.38)",
      internalText: "#DDD6FE",
      internalMeta: "#C4B5FD",
      otherBubbleBg: "rgba(16, 18, 26, 0.58)",
      otherBubbleBorder: "rgba(255, 255, 255, 0.20)",
      otherText: "#FFFFFF",
      otherMeta: "#94A3B8"
    }
  },
  {
    id: "matte_studio",
    name: "Matte Studio",
    description: "Solid, distraction-free matte surface matching table theme",
    category: "ambient",
    thumbnailStyle: {
      backgroundColor: "#11141A"
    },
    style: {
      backgroundColor: "#0F1117"
    },
    palette: {
      clientBubbleBg: "rgba(30, 20, 51, 0.88)",
      clientBubbleBorder: "rgba(168, 85, 247, 0.35)",
      clientText: "#F3E8FF",
      clientMeta: "#C4B5FD",
      internalBubbleBg: "rgba(38, 20, 9, 0.88)",
      internalBubbleBorder: "rgba(245, 158, 11, 0.35)",
      internalText: "#FFEDD5",
      internalMeta: "#FDBA74",
      otherBubbleBg: "rgba(26, 29, 36, 0.88)",
      otherBubbleBorder: "rgba(255, 255, 255, 0.15)",
      otherText: "#F4F4F8",
      otherMeta: "#8E8EA0"
    }
  }
];

export const DEFAULT_WALLPAPER_SETTINGS: WallpaperSettings = {
  id: "midnight_alps",
  opacity: 0.35
};

export function getSavedWallpaperSettings(): WallpaperSettings {
  if (typeof window === "undefined") return DEFAULT_WALLPAPER_SETTINGS;
  try {
    // 1. Check v2 storage
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        id: parsed.id || DEFAULT_WALLPAPER_SETTINGS.id,
        opacity: typeof parsed.opacity === "number" ? parsed.opacity : DEFAULT_WALLPAPER_SETTINGS.opacity,
        customUrl: parsed.customUrl || ""
      };
    }

    // 2. Check legacy v1 storage if user previously explicitly picked another theme
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      if (parsedLegacy.id && parsedLegacy.id !== "milky_way_peaks") {
        const migrated: WallpaperSettings = {
          id: parsedLegacy.id,
          opacity: typeof parsedLegacy.opacity === "number" ? parsedLegacy.opacity : DEFAULT_WALLPAPER_SETTINGS.opacity,
          customUrl: parsedLegacy.customUrl || ""
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }

    // 3. First-time default: "Midnight Starry Alps"
    return DEFAULT_WALLPAPER_SETTINGS;
  } catch {
    return DEFAULT_WALLPAPER_SETTINGS;
  }
}

export function saveWallpaperSettings(settings: WallpaperSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("mcsc-chat-wallpaper-change", { detail: settings }));
  } catch (err) {
    console.error("Failed to save chat wallpaper settings", err);
  }
}

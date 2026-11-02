import { useState, useEffect, useCallback } from 'react';

export type ThemeId = 'editorial' | 'technical' | 'warm' | 'elegant-dark' | 'vibrant';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  tagline: string;
  fontBadge: string;
  description: string;
  colors: {
    bg: string;
    surface: string;
    accent: string;
    text: string;
    border: string;
  };
  features: string[];
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'editorial',
    name: 'Editorial & Refined',
    tagline: 'Literary & Typography First',
    fontBadge: 'Serif (Georgia / Cambria)',
    description: 'Serif typography, generous white space, subtle warm paper tones, and copper/teal accents reminiscent of high-end technical journals.',
    colors: {
      bg: '#f7f5f0',
      surface: '#ffffff',
      accent: '#b45309',
      text: '#1c1917',
      border: '#e4ded3',
    },
    features: ['Generous line-height & padding', 'Warm ivory parchment tones', 'Crisp classic serif headings', 'Subtle natural borders'],
  },
  {
    id: 'technical',
    name: 'Technical & Systematic',
    tagline: 'Engineering & Monospace Dense',
    fontBadge: 'Monospace (JetBrains Mono / Consolas)',
    description: 'Ultra-dense grid system with visible structural borders, radar green accents, and monospace telemetry readouts.',
    colors: {
      bg: '#070b0e',
      surface: '#0c1218',
      accent: '#10b981',
      text: '#e2e8f0',
      border: '#1b2836',
    },
    features: ['Fixed-width monospace typography', 'Visible CAD/blueprint borders', 'High-density telemetry cards', 'Phosphor radar accents'],
  },
  {
    id: 'warm',
    name: 'Warm & Approachable',
    tagline: 'Soft Pastels & Friendly Curves',
    fontBadge: 'Modern Sans (Plus Jakarta / System)',
    description: 'Friendly rounded pill buttons, soft pastel cards, warm sunlit peach tones, and plush tactile drop-shadows.',
    colors: {
      bg: '#fdf8f4',
      surface: '#ffffff',
      accent: '#ea580c',
      text: '#292524',
      border: '#fed7aa',
    },
    features: ['Soft pill buttons & rounded corners', 'Warm peach & cream background', 'Comfortable touch targets', 'Gentle pastel card borders'],
  },
  {
    id: 'elegant-dark',
    name: 'Elegant Dark',
    tagline: 'High-Contrast Cyber Slate',
    fontBadge: 'Clean Sans (Inter / SF Pro)',
    description: 'Deep obsidian and midnight slate canvas with tailored high-contrast electric cyan and lime glow accents.',
    colors: {
      bg: '#020617',
      surface: '#0f172a',
      accent: '#06b6d4',
      text: '#f8fafc',
      border: '#1e293b',
    },
    features: ['Low eye-strain OLED midnight canvas', 'Tailored cyan/emerald glow states', 'Frosted glassmorphism panels', 'Standard forensic HUD layout'],
  },
  {
    id: 'vibrant',
    name: 'Vibrant Palette',
    tagline: 'High-Energy Neon & Cosmic Violet',
    fontBadge: 'Geometric Sans (Space Grotesk)',
    description: 'High-energy cosmic violet atmosphere with electric rose, ultraviolet gradients, and bold high-contrast status badges.',
    colors: {
      bg: '#0b0716',
      surface: '#150f29',
      accent: '#f43f5e',
      text: '#ffffff',
      border: '#3b2c6b',
    },
    features: ['Deep cosmic purple background', 'Electric neon rose & violet accents', 'Vivid gradient highlights', 'High dynamic visual impact'],
  },
];

const STORAGE_KEY = 'kaybit_theme_preference';

export function useTheme() {
  const [currentTheme, setCurrentThemeState] = useState<ThemeId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
      if (saved && THEMES.some((t) => t.id === saved)) {
        return saved;
      }
    }
    return 'elegant-dark';
  });

  const applyTheme = useCallback((themeId: ThemeId) => {
    setCurrentThemeState(themeId);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeId);
      const themeDef = THEMES.find((t) => t.id === themeId);
      if (themeDef) {
        const root = document.documentElement;
        root.style.setProperty('--app-bg', themeDef.colors.bg);
        root.style.setProperty('--app-surface', themeDef.colors.surface);
        root.style.setProperty('--app-accent', themeDef.colors.accent);
        root.style.setProperty('--app-text', themeDef.colors.text);
        root.style.setProperty('--app-border', themeDef.colors.border);
      }
    }
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
    } catch {
      // Ignore localStorage exceptions in restrictive iframes
    }
  }, []);

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme, applyTheme]);

  return {
    currentTheme,
    setTheme: applyTheme,
    themes: THEMES,
  };
}

import React from 'react';

export interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'squircle' | 'circle' | 'square' | 'raw';
  glow?: boolean;
  className?: string;
  showText?: boolean;
  subtitle?: string;
}

const SIZE_MAP = {
  xs: { container: 'w-5 h-5', img: 'w-3.5 h-3.5', text: 'text-xs', sub: 'text-[9px]' }, // Desktop title bar (16-20px)
  sm: { container: 'w-7 h-7', img: 'w-5 h-5', text: 'text-sm', sub: 'text-[10px]' },    // Mobile app bar (28-32px)
  md: { container: 'w-9 h-9', img: 'w-7 h-7', text: 'text-base', sub: 'text-xs' },      // Web header (36-40px)
  lg: { container: 'w-12 h-12', img: 'w-9 h-9', text: 'text-lg', sub: 'text-xs' },     // Showcase / cards
  xl: { container: 'w-20 h-20', img: 'w-16 h-16', text: 'text-2xl', sub: 'text-sm' },   // Hero icon
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'squircle',
  glow = true,
  className = '',
  showText = false,
  subtitle,
}) => {
  const s = SIZE_MAP[size];

  const maskClass =
    variant === 'squircle'
      ? 'mask-squircle bg-gradient-to-br from-zinc-900 to-black border border-yellow-400/20'
      : variant === 'circle'
      ? 'rounded-full bg-gradient-to-br from-zinc-900 to-black border border-yellow-400/20'
      : variant === 'square'
      ? 'rounded-lg bg-gradient-to-br from-zinc-900 to-black border border-yellow-400/20'
      : '';

  const glowEffect = glow
    ? 'drop-shadow-[0_0_8px_rgba(163,230,53,0.55)] drop-shadow-[0_0_14px_rgba(250,204,21,0.3)]'
    : '';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative ${s.container} ${maskClass} flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-md`}
      >
        <img
          src="/assets/kbt-logo-transparent.png"
          alt="KBT Spider Logo"
          className={`w-full h-full object-contain filter ${glowEffect} transition-transform duration-300 hover:scale-110`}
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1 font-bold tracking-tight">
            <span className="text-lime-400 font-mono">KayBiT</span>
            <span className="text-slate-200">_Util</span>
          </div>
          {subtitle && (
            <span className={`${s.sub} text-slate-400 font-mono tracking-wider`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Interactive Multiplatform Platform Title Bar & App Bar Showcase
 * Renders authentic mockups for Desktop (Windows & macOS Title Bars),
 * Mobile (iOS & Android App Bars), and Web (Chrome / Safari Web Header Bars).
 */
export const PlatformBarShowcase: React.FC = () => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />
          <h4 className="text-xs font-semibold tracking-wide uppercase text-slate-300 font-mono">
            Platform Brand Integration Specifications (kbt-integration-guide.txt)
          </h4>
        </div>
        <span className="text-[10px] font-mono text-lime-400 bg-lime-950/60 border border-lime-800/60 px-2 py-0.5 rounded">
          Tauri v2 · Vite · iOS · Android
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Desktop Title Bar (Windows 11 / macOS Universal) */}
        <div className="rounded-lg border border-slate-700/80 bg-slate-950/90 overflow-hidden shadow-md">
          {/* macOS traffic lights or Windows controls */}
          <div className="flex items-center justify-between bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                <BrandLogo size="xs" variant="squircle" />
                <span className="text-slate-300 font-semibold text-[10px]">KayBiT_Util · macOS Title Bar</span>
              </div>
            </div>
            <span className="text-[9px] text-slate-500">x86_64/arm64</span>
          </div>
          <div className="p-3 text-[11px] text-slate-400 font-mono space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Asset Dimensions:</span>
              <span className="text-yellow-400">16x16 / 32x32 .icns</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Config:</span>
              <span className="text-cyan-400">tauri.conf.json</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Window Chromeless:</span>
              <span className="text-emerald-400">TitleBarStyle::Overlay</span>
            </div>
          </div>
        </div>

        {/* 2. Mobile App Bar (iOS Dynamic Island & Android Material 3) */}
        <div className="rounded-lg border border-slate-700/80 bg-slate-950/90 overflow-hidden shadow-md">
          <div className="flex items-center justify-between bg-slate-900/90 px-3 py-2 border-b border-slate-800 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">←</span>
              <BrandLogo size="sm" variant="squircle" />
              <div className="leading-tight">
                <div className="text-xs font-semibold text-slate-200">KayBiT Mobile</div>
                <div className="text-[9px] text-lime-400 font-mono">RTK Fix · 60 FPS</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              <span>9:41</span>
              <span>⚡</span>
            </div>
          </div>
          <div className="p-3 text-[11px] text-slate-400 font-mono space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Adaptive Icon:</span>
              <span className="text-yellow-400">Adaptive Vectors (Foreground/Back)</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Capacitor/Cordova:</span>
              <span className="text-cyan-400">src-cordova/res/icon</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Squircle Curve:</span>
              <span className="text-emerald-400">Continuous Superellipse (n=4)</span>
            </div>
          </div>
        </div>

        {/* 3. Web Header Bar (Chrome / Safari / Firefox Web App) */}
        <div className="rounded-lg border border-slate-700/80 bg-slate-950/90 overflow-hidden shadow-md">
          <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 w-full">
              <div className="flex items-center gap-1 text-slate-500 text-xs">
                <span>🔒</span>
              </div>
              <div className="flex-1 bg-slate-950 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 truncate border border-slate-800">
                https://kaybit-util.app/studio
              </div>
            </div>
          </div>
          <div className="p-3 text-[11px] text-slate-400 font-mono space-y-1">
            <div className="flex items-center justify-between">
              <BrandLogo size="md" variant="squircle" showText subtitle="PWA Certified" />
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                Web 64px
              </span>
            </div>
            <div className="flex justify-between text-[10px] pt-1">
              <span className="text-slate-500">Manifest:</span>
              <span className="text-yellow-400">192x192 & 512x512 PNG</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">SVG Utility:</span>
              <span className="text-emerald-400">.mask-squircle</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

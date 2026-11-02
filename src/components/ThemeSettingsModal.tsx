import React, { useEffect } from 'react';
import { X, Check, Sparkles, BookOpen, Terminal, Heart, Moon, Zap } from 'lucide-react';
import { THEMES, ThemeId } from '../hooks/useTheme';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  currentTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  onClose: () => void;
}

const THEME_ICONS: Record<ThemeId, React.ComponentType<{ className?: string }>> = {
  editorial: BookOpen,
  technical: Terminal,
  warm: Heart,
  'elegant-dark': Moon,
  vibrant: Zap,
};

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  currentTheme,
  onSelectTheme,
  onClose,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="theme-modal-title" className="text-base font-semibold text-slate-100">
                Theme Customization & Architectural Styling
              </h3>
              <p className="text-xs text-slate-400">
                Instantly adjust CSS variables, typography hierarchies, card density, and color accents.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Themes Grid */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {THEMES.map((theme) => {
              const Icon = THEME_ICONS[theme.id];
              const isSelected = currentTheme === theme.id;

              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    onSelectTheme(theme.id);
                    onClose();
                  }}
                  className={`group relative text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-cyan-400 bg-slate-800/90 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  {/* Top Bar inside card */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${theme.colors.accent}20`,
                            color: theme.colors.accent,
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                            {theme.name}
                            {isSelected && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-cyan-400 text-slate-950 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block">
                            {theme.tagline}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-700 group-hover:border-slate-500 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                      {theme.description}
                    </p>
                  </div>

                  {/* Visual Color Palette Preview */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-mono">Palette:</span>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: theme.colors.bg }}
                          title={`Background: ${theme.colors.bg}`}
                        />
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: theme.colors.surface }}
                          title={`Surface: ${theme.colors.surface}`}
                        />
                        <div
                          className="w-3.5 h-3.5 rounded-full shadow-sm"
                          style={{ backgroundColor: theme.colors.accent }}
                          title={`Accent: ${theme.colors.accent}`}
                        />
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {theme.fontBadge}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>
                Selection updates root CSS custom variables immediately and persists in browser local storage.
              </span>
            </div>
            <span className="font-mono text-[11px] text-cyan-400">
              key: kaybit_theme_preference
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-3.5 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Clicking any theme applies it and dismisses this modal automatically.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

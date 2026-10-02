import React from 'react';
import { BookOpen, Camera, ShieldCheck, Cpu, Cloud, Database, Code2, Download } from 'lucide-react';
import { TOPBAR_NAV_ITEMS, TopBarNavItem } from '../data/phasesConfig';

interface TopBarProps {
  activeTab: 'camera' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'explorer';
  onSelectTab: (tab: 'camera' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'explorer') => void;
  onOpenUserGuide: () => void;
  onOpenInstallModal: () => void;
}

const NAV_ICON_MAP: Record<TopBarNavItem['iconName'], React.ComponentType<{ className?: string }>> = {
  Camera,
  ShieldCheck,
  Cpu,
  Cloud,
  Database,
  Code2,
};

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenUserGuide,
  onOpenInstallModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('camera')}
          className="text-left font-semibold tracking-tight text-slate-100 hover:text-cyan-400 transition-colors cursor-pointer"
        >
          <span className="text-cyan-400 font-bold">KayBiT</span>
          <span className="text-slate-200">_Util</span>
        </button>

        {/* Zone 2: 4-6 clean text navigation links from structured config */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
          {TOPBAR_NAV_ITEMS.map((item) => {
            const Icon = NAV_ICON_MAP[item.iconName];
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer py-1 ${
                  isActive
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenInstallModal}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap cursor-pointer shadow-sm"
            title="Download native app for Android, iOS, Windows, macOS"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Install App</span>
          </button>

          <button
            onClick={onOpenUserGuide}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400 transition-colors whitespace-nowrap cursor-pointer shadow-sm shadow-cyan-950"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>User Guide</span>
          </button>
        </div>
      </div>

      {/* Mobile sub-navigation bar from structured config */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-800/80 px-4 py-2 gap-3 text-xs text-slate-400 no-scrollbar">
        {TOPBAR_NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`whitespace-nowrap px-2.5 py-1 rounded transition-colors ${
                isActive ? 'bg-cyan-950 text-cyan-300' : 'hover:text-slate-200'
              }`}
            >
              {item.mobileLabel}
            </button>
          );
        })}
      </div>
    </header>
  );
};

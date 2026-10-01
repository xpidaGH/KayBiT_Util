import React from 'react';
import { BookOpen, Camera, ShieldCheck, Cpu, Cloud, Database, Code2 } from 'lucide-react';

interface TopBarProps {
  activeTab: 'camera' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'explorer';
  onSelectTab: (tab: 'camera' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'explorer') => void;
  onOpenUserGuide: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenUserGuide,
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

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            onClick={() => onSelectTab('camera')}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer py-1 ${
              activeTab === 'camera'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Camera HUD
          </button>
          <button
            onClick={() => onSelectTab('phase1')}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer py-1 ${
              activeTab === 'phase1'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Phase 1: Kernel Driver
          </button>
          <button
            onClick={() => onSelectTab('phase2')}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer py-1 ${
              activeTab === 'phase2'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Phase 2: Precision Overlay
          </button>
          <button
            onClick={() => onSelectTab('phase3')}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer py-1 ${
              activeTab === 'phase3'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            Phase 3: AI Verification
          </button>
          <button
            onClick={() => onSelectTab('phase4')}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer py-1 ${
              activeTab === 'phase4'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Phase 4: Spatial OLAP
          </button>
          <button
            onClick={() => onSelectTab('explorer')}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer py-1 ${
              activeTab === 'explorer'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            21 Languages
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenUserGuide}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400 transition-colors whitespace-nowrap cursor-pointer shadow-sm shadow-cyan-950"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>User Guide</span>
          </button>
        </div>
      </div>

      {/* Mobile sub-navigation bar */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-800/80 px-4 py-2 gap-3 text-xs text-slate-400 no-scrollbar">
        <button
          onClick={() => onSelectTab('camera')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${activeTab === 'camera' ? 'bg-cyan-950 text-cyan-300' : 'hover:text-slate-200'}`}
        >
          Camera HUD
        </button>
        <button
          onClick={() => onSelectTab('phase1')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${activeTab === 'phase1' ? 'bg-cyan-950 text-cyan-300' : 'hover:text-slate-200'}`}
        >
          P1: Kernel
        </button>
        <button
          onClick={() => onSelectTab('phase2')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${activeTab === 'phase2' ? 'bg-cyan-950 text-cyan-300' : 'hover:text-slate-200'}`}
        >
          P2: Overlay
        </button>
        <button
          onClick={() => onSelectTab('phase3')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${activeTab === 'phase3' ? 'bg-cyan-950 text-cyan-300' : 'hover:text-slate-200'}`}
        >
          P3: AI Ingest
        </button>
        <button
          onClick={() => onSelectTab('phase4')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${activeTab === 'phase4' ? 'bg-cyan-950 text-cyan-300' : 'hover:text-slate-200'}`}
        >
          P4: Spatial OLAP
        </button>
        <button
          onClick={() => onSelectTab('explorer')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${activeTab === 'explorer' ? 'bg-cyan-950 text-cyan-300' : 'hover:text-slate-200'}`}
        >
          21 Languages
        </button>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { TopBar } from './components/TopBar';
import { CameraHUDStudio } from './components/CameraHUDStudio';
import { Phase1KernelDriver } from './components/Phase1KernelDriver';
import { Phase2PrecisionOverlay } from './components/Phase2PrecisionOverlay';
import { Phase3SpatialAIPipeline } from './components/Phase3SpatialAIPipeline';
import { Phase4FleetSpatialOLAP } from './components/Phase4FleetSpatialOLAP';
import { CodeExplorerView } from './components/CodeExplorerView';
import { UserGuideModal } from './components/UserGuideModal';
import {
  BookOpen,
  Camera,
  ShieldCheck,
  Cpu,
  Cloud,
  Database,
  Code2,
  Terminal,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'camera' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'explorer'>('camera');
  const [isUserGuideOpen, setIsUserGuideOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 3-Zone Top Bar */}
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenUserGuide={() => setIsUserGuideOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Splash / Hero Information Bar */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>KayBiT_Util · Multi-Language Systems Engineering Core</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
                Camera & GPS Timestamp Utility & Customization Tools
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                A production-grade educational and forensic demonstration platform spanning <strong className="text-slate-200">21 programming languages</strong> across <strong className="text-slate-200">4 architectural tiers</strong>. From Ring 0 kernel device drivers and mobile Vulkan shaders to distributed cloud gateways and PostGIS spatial analytics.
              </p>
            </div>

            {/* Quick Action Pill Buttons */}
            <div className="flex flex-wrap md:flex-col lg:flex-row items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsUserGuideOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-cyan-950 cursor-pointer whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4 text-slate-950" />
                <span>User Guide (21 Languages)</span>
              </button>

              <button
                onClick={() => setActiveTab('explorer')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
              >
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>21 Languages Codebase</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-slate-400">
            <div>
              <span className="text-[10px] text-slate-500 block font-sans">ARCHITECTURE</span>
              <span className="text-slate-200 font-semibold">4 Distinct Phases</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-sans">SUPPORTED LANGUAGES</span>
              <span className="text-cyan-400 font-semibold">21 Languages Active</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-sans">OVERLAY ALLOCATION</span>
              <span className="text-emerald-400 font-semibold">&lt; 3.0 ms / Frame</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-sans">ROOT OF TRUST</span>
              <span className="text-purple-400 font-semibold">Hardware TPM 2.0 / HSM</span>
            </div>
          </div>
        </section>

        {/* Tab 1: Camera & HUD Customization Studio */}
        {activeTab === 'camera' && <CameraHUDStudio />}

        {/* Tab 2: Phase 1: Kernel Driver & Infrastructure */}
        {activeTab === 'phase1' && <Phase1KernelDriver />}

        {/* Tab 3: Phase 2: Precision Overlay & Mobile */}
        {activeTab === 'phase2' && <Phase2PrecisionOverlay />}

        {/* Tab 4: Phase 3: Spatial Video Ingestion & AI Verification */}
        {activeTab === 'phase3' && <Phase3SpatialAIPipeline />}

        {/* Tab 5: Phase 4: Fleet Telemetry Spatial OLAP */}
        {activeTab === 'phase4' && <Phase4FleetSpatialOLAP />}

        {/* Tab 6: 21-Language Production Code Explorer */}
        {activeTab === 'explorer' && <CodeExplorerView />}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">KayBiT_Util</span>
            <span>·</span>
            <span>Camera & GPS Timestamp Utility & Customization Platform</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsUserGuideOpen(true)}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Multi-Language User Guide
            </button>
            <span>·</span>
            <span>ISO C17 · C++20 · Rust 2024 · Go · Kotlin · Swift · Python · PostGIS · COBOL</span>
          </div>
        </div>
      </footer>

      {/* User Guide Modal */}
      <UserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
      />
    </div>
  );
}

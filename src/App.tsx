import React, { useState } from 'react';
import { TopBar } from './components/TopBar';
import { CameraHUDStudio } from './components/CameraHUDStudio';
import { Phase1KernelDriver } from './components/Phase1KernelDriver';
import { Phase2PrecisionOverlay } from './components/Phase2PrecisionOverlay';
import { Phase3SpatialAIPipeline } from './components/Phase3SpatialAIPipeline';
import { Phase4FleetSpatialOLAP } from './components/Phase4FleetSpatialOLAP';
import { CodeExplorerView } from './components/CodeExplorerView';
import { UserGuideModal } from './components/UserGuideModal';
import { InstallModal } from './components/InstallModal';
import { ThemeSettingsModal } from './components/ThemeSettingsModal';
import { ForensicDebugOverlay } from './components/ForensicDebugOverlay';
import { SystemHealthIndicator } from './components/SystemHealthIndicator';
import { BrandLogo } from './components/BrandLogo';
import { APP_METRICS_CONFIG } from './data/phasesConfig';
import { useTheme } from './hooks/useTheme';
import {
  BookOpen,
  Code2,
  Download,
  Palette,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'camera' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'explorer'>('camera');
  const [isUserGuideOpen, setIsUserGuideOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);

  const { currentTheme, setTheme } = useTheme();

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-200"
      style={{
        backgroundColor: 'var(--app-bg, #020617)',
        color: 'var(--app-text, #f8fafc)',
        fontFamily: 'var(--app-font-family, inherit)',
      }}
    >
      {/* 3-Zone Top Bar with Brand Logo and Theme Button */}
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenUserGuide={() => setIsUserGuideOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Splash / Hero Information Bar */}
        <section
          className="relative overflow-hidden rounded-2xl border p-5 sm:p-6 shadow-xl transition-all"
          style={{
            backgroundColor: 'var(--app-surface, #0f172a)',
            borderColor: 'var(--app-border, #1e293b)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4 max-w-3xl">
              {/* Authentic KBT Brand Spider Logo with Squircle Mask */}
              <div className="shrink-0 hidden sm:block">
                <BrandLogo size="lg" variant="squircle" glow={true} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>KayBiT_Util · Multi-Language Systems Engineering Core</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
                  <span className="sm:hidden shrink-0">
                    <BrandLogo size="xs" variant="squircle" />
                  </span>
                  Camera & GPS Timestamp Utility & Customization Tools
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  A production-grade educational and forensic demonstration platform spanning <strong className="text-slate-200">21 programming languages</strong> across <strong className="text-slate-200">4 architectural tiers</strong>. From Ring 0 kernel device drivers and mobile Vulkan shaders to distributed cloud gateways and PostGIS spatial analytics.
                </p>
              </div>
            </div>

            {/* Quick Action Pill Buttons */}
            <div className="flex flex-wrap md:flex-col lg:flex-row items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsThemeModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-500/30 transition-all cursor-pointer whitespace-nowrap"
                title="Change UI Theme"
              >
                <Palette className="w-4 h-4 text-amber-400" />
                <span>Theme: {currentTheme}</span>
              </button>

              <button
                onClick={() => setIsInstallModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-950/60 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>Install Native App</span>
              </button>

              <button
                onClick={() => setIsUserGuideOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-cyan-950 cursor-pointer whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4 text-slate-950" />
                <span>User Guide (22 Langs)</span>
              </button>

              <button
                onClick={() => setActiveTab('explorer')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
              >
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>21 Languages</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar from structured configuration */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-slate-400">
            {APP_METRICS_CONFIG.map((metric, idx) => (
              <div key={idx}>
                <span className="text-[10px] text-slate-500 block font-sans">{metric.label}</span>
                <span className={`${metric.color} font-semibold`}>{metric.value}</span>
              </div>
            ))}
          </div>

          {/* System Health Status Indicator with live heartbeat */}
          <SystemHealthIndicator
            activePhaseId={activeTab}
            onSelectPhase={(phaseId) => setActiveTab(phaseId)}
          />
        </section>

        {/* Collapsible Forensic Debugging Overlay for Main Content Area */}
        <ForensicDebugOverlay />

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
            <BrandLogo size="xs" variant="squircle" />
            <span className="font-semibold text-slate-400">KayBiT_Util</span>
            <span>·</span>
            <span>Camera & GPS Timestamp Utility & Customization Platform</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer"
            >
              Theme Settings
            </button>
            <span>·</span>
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
            >
              Direct Download / Native Install
            </button>
            <span>·</span>
            <button
              onClick={() => setIsUserGuideOpen(true)}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Multi-Language User Guide (TTS)
            </button>
            <span>·</span>
            <span>ISO C17 · C++20 · Rust 2024 · Go · Kotlin · Swift · Python · PostGIS · COBOL</span>
          </div>
        </div>
      </footer>

      {/* Theme Settings Modal */}
      <ThemeSettingsModal
        isOpen={isThemeModalOpen}
        currentTheme={currentTheme}
        onSelectTheme={setTheme}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* User Guide Modal with Native Speech Synthesis TTS */}
      <UserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
      />

      {/* Cross-Platform Native Install Modal */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}

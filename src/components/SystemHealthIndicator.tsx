import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Cloud, Database, Activity, RefreshCw, Radio } from 'lucide-react';
import {
  SYSTEM_HEALTH_CONFIG,
  PhaseHealthDefinition,
  HealthStatusType,
} from '../data/phasesConfig';
import { LiveHeartbeatWaveSvg } from '../data/svgAssets';

interface SystemHealthIndicatorProps {
  onSelectPhase?: (phaseId: 'phase1' | 'phase2' | 'phase3' | 'phase4') => void;
  activePhaseId?: string;
}

interface PhaseLiveStatus {
  status: HealthStatusType;
  latencyMs: number;
  lastBeatUtc: string;
  heartbeatCount: number;
}

const ICON_MAP = {
  ShieldCheck,
  Cpu,
  Cloud,
  Database,
};

export const SystemHealthIndicator: React.FC<SystemHealthIndicatorProps> = ({
  onSelectPhase,
  activePhaseId,
}) => {
  // Live health state per phase
  const [phaseStatuses, setPhaseStatuses] = useState<Record<string, PhaseLiveStatus>>({
    phase1: { status: 'operational', latencyMs: 3.2, lastBeatUtc: new Date().toLocaleTimeString(), heartbeatCount: 1 },
    phase2: { status: 'operational', latencyMs: 1.8, lastBeatUtc: new Date().toLocaleTimeString(), heartbeatCount: 1 },
    phase3: { status: 'operational', latencyMs: 24.5, lastBeatUtc: new Date().toLocaleTimeString(), heartbeatCount: 1 },
    phase4: { status: 'operational', latencyMs: 14.1, lastBeatUtc: new Date().toLocaleTimeString(), heartbeatCount: 1 },
  });

  const [isHeartbeatActive, setIsHeartbeatActive] = useState<boolean>(true);
  const [globalBeatPulse, setGlobalBeatPulse] = useState<boolean>(false);

  // Live Heartbeat Simulation Loop
  useEffect(() => {
    if (!isHeartbeatActive) return;

    const interval = setInterval(() => {
      // Trigger a visual pulse
      setGlobalBeatPulse(true);
      setTimeout(() => setGlobalBeatPulse(false), 600);

      setPhaseStatuses((prev) => {
        const next: Record<string, PhaseLiveStatus> = { ...prev };
        const nowStr = new Date().toLocaleTimeString();

        SYSTEM_HEALTH_CONFIG.phases.forEach((phase: PhaseHealthDefinition) => {
          const rand = Math.random();
          let newStatus: HealthStatusType = 'operational';
          let newLatency = phase.defaultLatencyMs;

          // 75% operational (green), 20% high-latency (yellow), 5% degraded/syncing
          if (rand > 0.95) {
            newStatus = 'degraded';
            newLatency = Math.round(phase.defaultLatencyMs * 8 + Math.random() * 80);
          } else if (rand > 0.75) {
            newStatus = 'high_latency';
            newLatency = Math.round(110 + Math.random() * 85);
          } else {
            newStatus = 'operational';
            newLatency = Number((phase.defaultLatencyMs + (Math.random() - 0.5) * 1.5).toFixed(1));
          }

          next[phase.phaseId] = {
            status: newStatus,
            latencyMs: Math.max(1, newLatency),
            lastBeatUtc: nowStr,
            heartbeatCount: (prev[phase.phaseId]?.heartbeatCount || 0) + 1,
          };
        });

        return next;
      });
    }, SYSTEM_HEALTH_CONFIG.updateIntervalMs);

    return () => clearInterval(interval);
  }, [isHeartbeatActive]);

  // Manually trigger a random jitter or anomaly spike
  const triggerManualJitter = () => {
    setGlobalBeatPulse(true);
    setTimeout(() => setGlobalBeatPulse(false), 700);

    setPhaseStatuses((prev) => {
      const next = { ...prev };
      const nowStr = new Date().toLocaleTimeString();
      const targetPhase = SYSTEM_HEALTH_CONFIG.phases[Math.floor(Math.random() * SYSTEM_HEALTH_CONFIG.phases.length)];

      next[targetPhase.phaseId] = {
        status: 'high_latency',
        latencyMs: Math.round(140 + Math.random() * 70),
        lastBeatUtc: nowStr,
        heartbeatCount: (prev[targetPhase.phaseId]?.heartbeatCount || 0) + 1,
      };
      return next;
    });
  };

  return (
    <div className="mt-4 pt-3.5 border-t border-slate-800/90 space-y-3">
      {/* Header bar of System Health */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                isHeartbeatActive
                  ? globalBeatPulse
                    ? 'bg-emerald-400 scale-125 shadow-[0_0_12px_rgba(52,211,153,0.9)]'
                    : 'bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                  : 'bg-slate-600'
              }`}
            />
            {isHeartbeatActive && (
              <span className="absolute w-4 h-4 rounded-full bg-emerald-400/30 animate-ping" />
            )}
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span className="font-semibold text-slate-200 tracking-wider">SYSTEM HEALTH</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              LIVE ARCHITECTURAL HEARTBEAT
            </span>
          </div>

          <LiveHeartbeatWaveSvg
            size={16}
            className={`transition-colors hidden md:block ${
              globalBeatPulse ? 'text-emerald-300' : 'text-emerald-500/70'
            }`}
          />
        </div>

        {/* Live controls */}
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <button
            onClick={() => setIsHeartbeatActive((prev) => !prev)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              isHeartbeatActive
                ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle live telemetry heartbeat monitor"
          >
            <Radio className={`w-3 h-3 ${isHeartbeatActive ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>{isHeartbeatActive ? 'BEAT: ACTIVE (2.4s)' : 'BEAT: PAUSED'}</span>
          </button>

          <button
            onClick={triggerManualJitter}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-700 transition-colors cursor-pointer"
            title="Simulate random network latency or jitter spike"
          >
            <RefreshCw className="w-3 h-3 text-cyan-400" />
            <span>Inject Jitter</span>
          </button>
        </div>
      </div>

      {/* 4 Phase Live Heartbeat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {SYSTEM_HEALTH_CONFIG.phases.map((phase) => {
          const live = phaseStatuses[phase.phaseId] || {
            status: 'operational',
            latencyMs: phase.defaultLatencyMs,
            lastBeatUtc: '--:--',
            heartbeatCount: 0,
          };
          const style = SYSTEM_HEALTH_CONFIG.statusStyles[live.status];
          const Icon = ICON_MAP[phase.iconName];
          const isSelected = activePhaseId === phase.phaseId;

          return (
            <div
              key={phase.phaseId}
              onClick={() => onSelectPhase && onSelectPhase(phase.phaseId)}
              className={`group relative p-2.5 rounded-xl border transition-all duration-300 select-none ${
                style.colorBg
              } ${style.colorBorder} ${
                isSelected
                  ? 'ring-1 ring-cyan-400/80 shadow-md'
                  : 'hover:border-slate-600 hover:bg-slate-900/80'
              } ${onSelectPhase ? 'cursor-pointer' : ''}`}
            >
              {/* Top row: Phase icon with live status color and latency */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {/* Dynamic Phase Icon that toggles color */}
                  <div
                    className={`p-1 rounded-md border transition-colors ${
                      live.status === 'operational'
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                        : live.status === 'high_latency'
                        ? 'bg-amber-950/80 text-amber-400 border-amber-800/80 animate-pulse'
                        : 'bg-rose-950/80 text-rose-400 border-rose-800/80 animate-bounce'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-100 truncate font-sans">
                    {phase.shortLabel}
                  </span>
                </div>

                {/* Status Badge & Latency */}
                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${style.colorDot} ${
                      live.status === 'operational' && globalBeatPulse
                        ? 'animate-ping'
                        : live.status === 'high_latency'
                        ? 'animate-pulse'
                        : ''
                    }`}
                  />
                  <span className={`font-semibold ${style.colorText}`}>
                    {live.latencyMs}ms
                  </span>
                </div>
              </div>

              {/* Subtitle / Tier Description */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="truncate">{phase.tier}</span>
                <span
                  className={`text-[9px] uppercase px-1 py-0.2 rounded font-semibold tracking-wider ${
                    live.status === 'operational'
                      ? 'text-emerald-400 bg-emerald-950/60'
                      : live.status === 'high_latency'
                      ? 'text-amber-400 bg-amber-950/60'
                      : 'text-rose-400 bg-rose-950/60'
                  }`}
                >
                  {style.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Activity, Sliders, Smartphone } from 'lucide-react';
import { TelemetryKalmanFilter } from '../utils/kalmanFilter';
import { PHASE2_CONFIG } from '../data/phasesConfig';
import { ArtificialHorizonSvg, ReticleCrosshairSvg } from '../data/svgAssets';

export const Phase2PrecisionOverlay: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kalman_playground' | 'vulkan_benchmark' | 'mobile_pipeline'>('kalman_playground');

  // Kalman interactive parameters from structured config
  const [processNoiseQ, setProcessNoiseQ] = useState<number>(PHASE2_CONFIG.defaultKalmanParams.processNoiseQ);
  const [measurementNoiseR, setMeasurementNoiseR] = useState<number>(PHASE2_CONFIG.defaultKalmanParams.measurementNoiseR);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Live filter state
  const [currentResidual, setCurrentResidual] = useState<number>(0);
  const [currentGainK, setCurrentGainK] = useState<number>(0);
  const [rawPings, setRawPings] = useState<number[]>([]);
  const [filteredPings, setFilteredPings] = useState<number[]>([]);

  const filterRef = useRef(
    new TelemetryKalmanFilter(
      PHASE2_CONFIG.defaultKalmanParams.initialPosition,
      PHASE2_CONFIG.defaultKalmanParams.processNoiseQ,
      PHASE2_CONFIG.defaultKalmanParams.measurementNoiseR
    )
  );
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Update filter parameters when user adjusts sliders
  useEffect(() => {
    filterRef.current.setParameters(processNoiseQ, measurementNoiseR);
  }, [processNoiseQ, measurementNoiseR]);

  // Telemetry stream generator
  useEffect(() => {
    let t = 0;
    const interval = setInterval(() => {
      if (!isSimulating) return;
      t += 0.1;
      // Underlying true physical position
      const truePosition = 50 + Math.sin(t * 0.5) * 20;
      // High-frequency sensor noise / GPS multipath jump
      const sensorNoise = (Math.random() - 0.5) * 12;
      const rawMeasurement = truePosition + sensorNoise;

      const result = filterRef.current.update(rawMeasurement);
      setCurrentGainK(result.gainK);
      setCurrentResidual(result.residual);

      setRawPings((prev) => [...prev.slice(-60), rawMeasurement]);
      setFilteredPings((prev) => [...prev.slice(-60), result.estimated]);
    }, 80);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Render Live Kalman Waveform Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#060b13';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#0f2438';
    ctx.lineWidth = 1;
    for (let y = 20; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (rawPings.length < 2) return;

    const step = w / 60;

    // 1. Draw Raw Noisy Sensor Measurement (Rose line)
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    rawPings.forEach((val, i) => {
      const y = h - ((val - 20) / 60) * h;
      if (i === 0) ctx.moveTo(i * step, y);
      else ctx.lineTo(i * step, y);
    });
    ctx.stroke();

    // 2. Draw Kalman Filtered Smoothed State (Cyan line)
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    filteredPings.forEach((val, i) => {
      const y = h - ((val - 20) / 60) * h;
      if (i === 0) ctx.moveTo(i * step, y);
      else ctx.lineTo(i * step, y);
    });
    ctx.stroke();
  }, [rawPings, filteredPings]);

  return (
    <div className="space-y-6">
      {/* Phase Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
          <Cpu className="w-4 h-4" />
          <span>PHASE 2 · NATIVE & CROSS-PLATFORM MOBILE ENGINEERING</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
          Sub-Millisecond Precision Overlay Engine & Telemetry Sync
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          Couples Android Jetpack CameraX (Kotlin) and high-rate sensor loops (Java) with C++ NDK 6-DOF Kalman filtering and Vulkan GPU shader overlays executing under a strict sub-3ms budget.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs font-medium pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'kalman_playground', label: '6-DOF Kalman Filter Visualizer', icon: Activity },
          { id: 'vulkan_benchmark', label: 'Vulkan / OpenGL Shader Burn (< 3ms)', icon: Cpu },
          { id: 'mobile_pipeline', label: 'Mobile Architecture (Kotlin / Flutter)', icon: Smartphone },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-VIEW 1: Kalman Filter Playground */}
      {activeTab === 'kalman_playground' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Waveform Canvas */}
            <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Live Sensor Drift & Multipath Error Suppression Waveform
                </span>
                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-2.5 h-0.5 bg-rose-500 rounded" /> Raw Sensor Noisy GPS
                  </span>
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <span className="w-2.5 h-0.5 bg-cyan-400 rounded" /> Kalman Smoothed State
                  </span>
                </div>
              </div>

              <div className="relative rounded-lg overflow-hidden border border-slate-800">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={260}
                  className="w-full h-56 object-cover"
                />
              </div>

              {/* Real-time Math Diagnostics */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-lg border border-slate-800/80 bg-slate-900/60 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">KALMAN GAIN (K)</span>
                  <span className="text-cyan-400 font-semibold">{currentGainK.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">INNOVATION RESIDUAL (y - H*x)</span>
                  <span className="text-slate-200 font-semibold">{currentResidual.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">FREQUENCY COUPLING</span>
                  <span className="text-emerald-400 font-semibold">100Hz IMU ↔ 1Hz GPS</span>
                </div>
              </div>
            </div>

            {/* Parameter Sliders */}
            <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Kalman Covariance Tuning
                </h3>
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  {isSimulating ? 'Pause Stream' : 'Resume Stream'}
                </button>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Process Noise Covariance (Q)</span>
                  <span className="font-mono text-cyan-300">{processNoiseQ.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.2"
                  step="0.005"
                  value={processNoiseQ}
                  onChange={(e) => setProcessNoiseQ(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Higher Q trusts raw measurements more; lower Q assumes strict physical inertia.
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Measurement Noise Covariance (R)</span>
                  <span className="font-mono text-cyan-300">{measurementNoiseR.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="2.0"
                  step="0.05"
                  value={measurementNoiseR}
                  onChange={(e) => setMeasurementNoiseR(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Higher R aggressively filters multipath spikes and GPS jumps.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 leading-normal">
                <span className="text-cyan-400 font-semibold block mb-1">Formula in C++ NDK:</span>
                <code>K = P_pred / (P_pred + R)</code><br />
                <code>x = x_pred + K * (z - x_pred)</code><br />
                <code>P = (1 - K) * P_pred</code>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-VIEW 2: Vulkan Shader Burn Benchmark */}
      {activeTab === 'vulkan_benchmark' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Native Vulkan 1.3 / OpenGL ES 3.2 Telemetry Burner Allocation
            </h3>
            <p className="text-xs text-slate-400 leading-normal">
              To guarantee that forensic HUD burning never drops frames on 60 FPS mobile displays, the telemetry text is rendered as pre-compiled GPU glyph textures within a strict allocation window under 3.0 milliseconds per swapchain frame.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs">
                <span className="text-slate-500 block text-[10px]">GPU FRAME TIME BUDGET</span>
                <span className="text-slate-200 text-lg font-bold">{PHASE2_CONFIG.vulkanBenchmarkStats.gpuFrameBudgetMs}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs">
                <span className="text-slate-500 block text-[10px]">MAX ALLOCATION LIMIT</span>
                <span className="text-amber-400 text-lg font-bold">{PHASE2_CONFIG.vulkanBenchmarkStats.maxAllocationLimitMs}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs">
                <span className="text-slate-500 block text-[10px]">OBSERVED VULKAN PASS</span>
                <span className="text-emerald-400 text-lg font-bold">{PHASE2_CONFIG.vulkanBenchmarkStats.observedVulkanPassMs}</span>
              </div>
            </div>

            {/* GLSL Shader Code Snippet Preview from structured config */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
              <span className="text-cyan-400 text-[11px] block">fragment_telemetry_burn.frag (Vulkan SPIR-V)</span>
              <pre className="text-slate-300 text-[11px] overflow-x-auto leading-relaxed">
{PHASE2_CONFIG.glslFragmentShader}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: Mobile Pipeline Architecture from structured config */}
      {activeTab === 'mobile_pipeline' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PHASE2_CONFIG.mobilePipelineModules.map((module, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 font-semibold block">{module.subsystem}</span>
                  <span className="text-[10px] font-mono text-slate-500">{module.tech}</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200">{module.title}</h4>
                <p className="text-xs text-slate-400 leading-normal">{module.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

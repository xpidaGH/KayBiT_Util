import React, { useState } from 'react';
import { Cloud, Sun, Eye, ShieldAlert, CheckCircle2, Server, ArrowRight } from 'lucide-react';
import { calculateSolarPosition, SolarPosition } from '../utils/solarCalculator';
import { PHASE3_CONFIG } from '../data/phasesConfig';
import { SpeedLimitSignSvg, CompassRoseSvg } from '../data/svgAssets';

export const Phase3SpatialAIPipeline: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'solar_investigator' | 'ocr_verification' | 'cloud_architecture'>('solar_investigator');

  const defaultScenario = PHASE3_CONFIG.solarScenarios[0];
  // Solar Shadow Test Parameters from structured scenarios
  const [testLat, setTestLat] = useState<number>(defaultScenario.lat);
  const [testLon, setTestLon] = useState<number>(defaultScenario.lon);
  const [testDateStr, setTestDateStr] = useState<string>(defaultScenario.dateStr);
  const [observedShadowAngle, setObservedShadowAngle] = useState<number>(185.0);

  // Calculate astronomical solar position
  const testDate = new Date(testDateStr);
  const solarData: SolarPosition = calculateSolarPosition(testLat, testLon, testDate);
  const expectedShadowAngle = solarData.shadowDirectionDeg;

  // Compute angular discrepancy
  let discrepancy = Math.abs(expectedShadowAngle - observedShadowAngle);
  if (discrepancy > 180) discrepancy = 360 - discrepancy;
  const isFraudulent = discrepancy > 15.0;

  // Preset scenarios from structured data
  const applyScenario = (scenarioId: string) => {
    const sc = PHASE3_CONFIG.solarScenarios.find((s) => s.id === scenarioId);
    if (!sc) return;
    setTestLat(sc.lat);
    setTestLon(sc.lon);
    setTestDateStr(sc.dateStr);
    if (sc.isSpoofed) {
      setObservedShadowAngle(65.0); // Way off from theoretical noon
    } else {
      const s = calculateSolarPosition(sc.lat, sc.lon, new Date(sc.dateStr));
      setObservedShadowAngle(s.shadowDirectionDeg);
    }
  };

  // OCR Speed Limit Sign Simulator State from structured scenarios
  const [selectedOcrSample, setSelectedOcrSample] = useState<'match' | 'speeding_breach'>('speeding_breach');
  const activeOcrConfig = PHASE3_CONFIG.ocrScenarios[selectedOcrSample];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
          <Cloud className="w-4 h-4" />
          <span>PHASE 3 · DISTRIBUTED CLOUD SYSTEMS & WEB FRAMEWORKS</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
          Real-Time Spatial Video Ingestion & AI Verification Pipeline
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          Integrates TypeScript/Node.js WebSocket gateways, Ruby Sidekiq & PHP 8.3 FFmpeg video workers, and a Python FastAPI/OpenCV forensic AI engine that detects temporal fraud via astronomical solar shadow angle verification and OCR.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs font-medium pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'solar_investigator', label: 'Astronomical Solar Shadow AI Assessor', icon: Sun },
          { id: 'ocr_verification', label: 'Computer Vision OCR & Speed Sign Check', icon: Eye },
          { id: 'cloud_architecture', label: 'Distributed Worker Pipeline (Node / Ruby / PHP / Py)', icon: Server },
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

      {/* SUB-VIEW 1: Astronomical Solar Shadow Investigator */}
      {activeTab === 'solar_investigator' && (
        <div className="space-y-6">
          {/* Quick Scenario Preset Buttons from structured data */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Forensic Scenarios:</span>
            {PHASE3_CONFIG.solarScenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => applyScenario(scenario.id)}
                className={`px-3 py-1 text-xs rounded border transition-colors cursor-pointer ${
                  scenario.isSpoofed
                    ? 'bg-rose-950/60 border-rose-800/60 text-rose-300 hover:bg-rose-900/60 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-cyan-500 hover:text-cyan-300'
                }`}
              >
                {scenario.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Input Parameters */}
            <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                Claimed Video Metadata & Visual Shadow Observation
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Claimed Latitude (°)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={testLat}
                    onChange={(e) => setTestLat(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Claimed Longitude (°)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={testLon}
                    onChange={(e) => setTestLon(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Claimed GPS Timestamp (UTC)</label>
                <input
                  type="datetime-local"
                  value={testDateStr}
                  onChange={(e) => setTestDateStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Observed Physical Shadow Angle in Video</span>
                  <span className="font-mono text-amber-300 font-semibold">{observedShadowAngle.toFixed(1)}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="0.5"
                  value={observedShadowAngle}
                  onChange={(e) => setObservedShadowAngle(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Shadow angle measured in video clockwise from true North (0° = North, 90° = East, 180° = South, 270° = West).
                </p>
              </div>

              {/* Real-time Astronomical Position Result */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs space-y-1.5">
                <span className="text-slate-500 text-[10px] block font-sans">
                  ASTRONOMICAL CALCULATOR (PSA / NOAA ALGORITHM)
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px]">
                  <div>
                    <span className="text-slate-500">Solar Elevation:</span>{' '}
                    <span className="text-amber-400 font-semibold">{solarData.elevationDeg}°</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Solar Azimuth:</span>{' '}
                    <span className="text-slate-200">{solarData.azimuthDeg}°</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Expected Shadow Dir:</span>{' '}
                    <span className="text-cyan-400 font-semibold">{expectedShadowAngle}°</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Shadow Multiplier:</span>{' '}
                    <span className="text-slate-200">{solarData.shadowLengthRatio}x</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Forensic Verdict Card */}
            <div className="lg:col-span-6 space-y-4">
              <div
                className={`p-5 rounded-xl border transition-all ${
                  isFraudulent
                    ? 'bg-rose-950/40 border-rose-700/80 shadow-lg shadow-rose-950/30'
                    : 'bg-emerald-950/40 border-emerald-700/80 shadow-lg shadow-emerald-950/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {isFraudulent ? (
                    <div className="p-2 rounded-full bg-rose-900/60 border border-rose-700 text-rose-300">
                      <ShieldAlert className="w-6 h-6 text-rose-400" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-full bg-emerald-900/60 border border-emerald-700 text-emerald-300">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                      AI FORENSIC VERDICT
                    </span>
                    <h4 className="text-base font-bold text-slate-100">
                      {isFraudulent
                        ? 'FLAGGED: TEMPORAL FORGERY DETECTED'
                        : 'AUTHENTIC: SOLAR ALIGNMENT VERIFIED'}
                    </h4>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400 font-sans">Astronomical Shadow Angle:</span>
                    <span className="text-cyan-400">{expectedShadowAngle}°</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400 font-sans">Observed Shadow In Video:</span>
                    <span className="text-amber-400">{observedShadowAngle.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400 font-sans">Angular Error Discrepancy:</span>
                    <span
                      className={`font-bold ${isFraudulent ? 'text-rose-400' : 'text-emerald-400'}`}
                    >
                      {discrepancy.toFixed(1)}° (Max Allowed: 15.0°)
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-3 leading-normal font-sans">
                  {isFraudulent
                    ? 'The physical shadow angle observed on objects in the video deviates by more than 15 degrees from the theoretical solar azimuth calculated for the claimed GPS coordinates and UTC timestamp. This mathematically proves the video was recorded at a different time of day or at a different geographic location.'
                    : 'The physical shadow angles in the footage align with astronomical solar declination and equation-of-time calculations for this specific latitude, longitude, and UTC timestamp.'}
                </p>
              </div>

              {/* Compass Direction Visualizer using structured SVG assets */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-around">
                <CompassRoseSvg
                  azimuthDeg={solarData.azimuthDeg}
                  label="SUN AZIMUTH"
                  size={64}
                  needleColor="#FBBF24"
                />

                <ArrowRight className="w-5 h-5 text-slate-600 shrink-0" />

                <CompassRoseSvg
                  azimuthDeg={expectedShadowAngle}
                  label="EXPECTED SHADOW"
                  size={64}
                  needleColor="#22D3EE"
                />

                <CompassRoseSvg
                  azimuthDeg={observedShadowAngle}
                  label="OBSERVED VIDEO"
                  size={64}
                  needleColor={isFraudulent ? '#F43F5E' : '#10B981'}
                />
              </div>

            </div>

          </div>
        </div>
      )}

      {/* SUB-VIEW 2: Computer Vision OCR Speed Sign Check */}
      {activeTab === 'ocr_verification' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Visual Frame Simulation */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Video Frame Visual OCR Extraction</span>
                <span className="text-cyan-400 font-mono text-[11px]">PyTorch / Tesseract CV</span>
              </div>

              {/* Simulated Frame with structured SVG Speed Sign */}
              <div className="relative rounded-lg overflow-hidden border border-slate-800 aspect-video bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <SpeedLimitSignSvg limit={activeOcrConfig.postedLimitKmh} size={88} className="shadow-2xl" />
                <div className="w-1.5 h-10 bg-slate-700 -mt-1" />

                {/* Bounding Box Overlay */}
                <div className="absolute border-2 border-emerald-400 rounded px-2 py-0.5 text-[10px] font-mono text-emerald-300 bg-emerald-950/80 top-10 left-12">
                  DETECTED: SPEED_SIGN ({activeOcrConfig.postedLimitKmh} km/h) [CONFIDENCE: {activeOcrConfig.confidencePercent}%]
                </div>
              </div>

              {/* Selector using structured scenarios */}
              <div className="flex gap-2">
                {Object.values(PHASE3_CONFIG.ocrScenarios).map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedOcrSample(sc.id)}
                    className={`flex-1 py-1.5 text-xs rounded border transition-colors cursor-pointer ${
                      selectedOcrSample === sc.id
                        ? sc.id === 'speeding_breach'
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : 'bg-cyan-950 text-cyan-300 border-cyan-700'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cross-Verification Outcome */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4 text-xs font-mono">
              <h3 className="text-xs font-semibold text-slate-200 font-sans">
                Multimodal Cross-Verification Engine
              </h3>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">OCR Readout from Physical Sign:</span>
                  <span className="text-slate-100 font-bold">{activeOcrConfig.postedLimitKmh.toFixed(1)} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Vehicle GPS Telemetry Velocity:</span>
                  <span className={selectedOcrSample === 'match' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {activeOcrConfig.telemetrySpeedKmh.toFixed(1)} km/h {selectedOcrSample === 'match' ? '(In-bounds)' : '(Excessive)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Speed Differential:</span>
                  <span className={selectedOcrSample === 'match' ? 'text-emerald-400' : 'text-rose-400'}>
                    {(activeOcrConfig.telemetrySpeedKmh - activeOcrConfig.postedLimitKmh > 0 ? '+' : '')}
                    {(activeOcrConfig.telemetrySpeedKmh - activeOcrConfig.postedLimitKmh).toFixed(1)} km/h {selectedOcrSample === 'speeding_breach' ? 'VIOLATION' : ''}
                  </span>
                </div>
              </div>

              <div
                className={`p-3 rounded-lg border font-sans text-xs ${
                  selectedOcrSample === 'match'
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                {activeOcrConfig.verdictDescription}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-VIEW 3: Distributed Cloud Architecture from structured config */}
      {activeTab === 'cloud_architecture' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {PHASE3_CONFIG.cloudWorkerFleet.map((w, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                <span className="text-[10px] font-mono text-cyan-400 font-semibold block">{w.badge}</span>
                <h4 className="text-sm font-semibold text-slate-200">{w.name}</h4>
                <p className="text-xs text-slate-400 leading-normal">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

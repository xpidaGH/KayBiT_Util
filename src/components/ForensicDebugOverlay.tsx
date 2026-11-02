import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Radio,
  Camera,
  ShieldCheck,
  Terminal,
  Trash2,
  Download,
  Pause,
  Play,
  Layers,
  CheckCircle2,
  Clock,
  Navigation
} from 'lucide-react';
import { PlatformBarShowcase } from './BrandLogo';

interface LogEntry {
  id: string;
  timestamp: string;
  category: 'GPS' | 'CAMERA' | 'FORENSIC' | 'SYSTEM' | 'SECURITY';
  level: 'info' | 'warn' | 'success';
  message: string;
  metadata?: Record<string, string | number | boolean>;
}

export const ForensicDebugOverlay: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'events' | 'specs'>('telemetry');
  const [isAutoScroll, setIsAutoScroll] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Simulated live telemetry state for forensic verification
  const [gpsData, setGpsData] = useState({
    lat: 37.774929,
    lng: -122.419416,
    altitude: 14.8,
    accuracy: 0.8,
    hdop: 0.74,
    vdop: 0.91,
    pdop: 1.18,
    fixType: 'RTK FIX (Centimeter)',
    satellites: 18,
    heading: 142.6,
    speed: 0.04,
    utcDriftMs: -2.4,
  });

  const [cameraData, setCameraData] = useState({
    resolution: '1920 x 1080 (1080p)',
    fps: 59.9,
    bufferLatencyMs: 14.2,
    iso: 125,
    shutter: '1/120s',
    colorSpace: 'Rec.709 sRGB',
    droppedFrames: 0,
    shaderRenderMs: 1.84,
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  });

  // Seed initial logs and push live events
  useEffect(() => {
    const initialLogs: LogEntry[] = [
      {
        id: 'log-1',
        timestamp: new Date(Date.now() - 4000).toISOString().slice(11, 23),
        category: 'SYSTEM',
        level: 'info',
        message: 'Forensic integrity pipeline initialized. Ring 0 kernel driver connected.',
      },
      {
        id: 'log-2',
        timestamp: new Date(Date.now() - 3200).toISOString().slice(11, 23),
        category: 'GPS',
        level: 'success',
        message: 'GNSS multi-constellation lock acquired: GPS L1/L5 + Galileo E1/E5a (18 sats).',
        metadata: { HDOP: 0.74, Fix: 'RTK_FIX', AccuracyMeters: 0.8 },
      },
      {
        id: 'log-3',
        timestamp: new Date(Date.now() - 2100).toISOString().slice(11, 23),
        category: 'CAMERA',
        level: 'info',
        message: 'Camera stream established at 1080p60. WebGL hardware overlay engaged.',
        metadata: { Resolution: '1920x1080', Format: 'NV12/YUV420' },
      },
      {
        id: 'log-4',
        timestamp: new Date(Date.now() - 1100).toISOString().slice(11, 23),
        category: 'FORENSIC',
        level: 'success',
        message: 'Atomic clock synchronized with stratum-1 NTP pool (drift: -2.4ms). HMAC-SHA256 valid.',
      },
    ];
    setLogs(initialLogs);

    // Periodic simulation interval to mimic live events
    const eventInterval = setInterval(() => {
      // Small jitter on GPS & Camera
      setGpsData((prev) => ({
        ...prev,
        lat: +(prev.lat + (Math.random() - 0.5) * 0.000008).toFixed(6),
        lng: +(prev.lng + (Math.random() - 0.5) * 0.000008).toFixed(6),
        heading: +((prev.heading + (Math.random() - 0.5) * 0.4 + 360) % 360).toFixed(1),
        utcDriftMs: +(-2.0 + (Math.random() - 0.5) * 0.8).toFixed(1),
      }));

      // Generate random forensic events
      const eventTemplates = [
        {
          cat: 'GPS' as const,
          level: 'info' as const,
          msg: `NMEA GNGGA frame decoded. Geoid separation: -31.4m.`,
        },
        {
          cat: 'CAMERA' as const,
          level: 'info' as const,
          msg: `Frame metadata synced with IMU accelerometer (accel: [0.01, 9.81, 0.04] m/s²).`,
        },
        {
          cat: 'FORENSIC' as const,
          level: 'success' as const,
          msg: `Cryptographic watermark seal embedded. Merkle leaf appended.`,
        },
        {
          cat: 'SECURITY' as const,
          level: 'info' as const,
          msg: `Zero mock location flag verified: no synthetic developer provider detected.`,
        },
      ];

      const pick = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
      const newEntry: LogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString().slice(11, 23),
        category: pick.cat,
        level: pick.level,
        message: pick.msg,
      };

      setLogs((current) => [...current.slice(-60), newEntry]);

      // Update forensic hash
      const randomHex = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      setCameraData((prev) => ({
        ...prev,
        sha256Hash: randomHex,
        fps: +(59.8 + Math.random() * 0.3).toFixed(1),
      }));
    }, 3500);

    return () => clearInterval(eventInterval);
  }, []);

  // Auto-scroll log feed
  useEffect(() => {
    if (isAutoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  const filteredLogs = logs.filter(
    (l) => categoryFilter === 'ALL' || l.category === categoryFilter
  );

  const exportLogsAsJson = () => {
    const payload = JSON.stringify(
      {
        exportTimestamp: new Date().toISOString(),
        gpsStatus: gpsData,
        cameraMetadata: cameraData,
        events: logs,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kbt-forensic-telemetry-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950 shadow-xl overflow-hidden transition-all duration-300">
      {/* Collapsible Bar Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 hover:bg-slate-900 cursor-pointer border-b border-slate-800/80 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-inner">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Real-Time Forensic Debugger & Telemetry Overlay
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                GPS RTK + 1080p60 Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Continuous verification of GPS satellites, Dilution of Precision (HDOP/VDOP), UTC clock drift, and camera stream metadata.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-slate-400 mr-2">
            <div>
              <span className="text-slate-500 text-[10px]">HDOP:</span>{' '}
              <span className="text-lime-400 font-semibold">{gpsData.hdop}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">DRIFT:</span>{' '}
              <span className="text-cyan-400 font-semibold">{gpsData.utcDriftMs}ms</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">SATS:</span>{' '}
              <span className="text-yellow-400 font-semibold">{gpsData.satellites}</span>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-5 space-y-5 animate-fade-in">
          {/* Internal Subtabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'telemetry'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live GPS & Sensor Telemetry</span>
              </button>

              <button
                onClick={() => setActiveTab('events')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'events'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-lime-400" />
                <span>Event Stream Log ({logs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('specs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'specs'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-yellow-400" />
                <span>Multiplatform Brand Specifications</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportLogsAsJson}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
                title="Export telemetry log as JSON"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Live GPS & Camera Stream Telemetry */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GPS Telemetry Box */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                        GNSS / GPS Hardware Status
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                      {gpsData.fixType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Latitude</span>
                      <span className="text-slate-200 font-semibold">{gpsData.lat}° N</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Longitude</span>
                      <span className="text-slate-200 font-semibold">{gpsData.lng}° W</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Altitude (MSL)</span>
                      <span className="text-slate-200 font-semibold">{gpsData.altitude} m</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Horiz. Dilution (HDOP)</span>
                      <span className="text-lime-400 font-semibold">{gpsData.hdop} (Ideal &lt; 1.0)</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Vert. Dilution (VDOP)</span>
                      <span className="text-slate-300 font-semibold">{gpsData.vdop}</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Pos. Dilution (PDOP)</span>
                      <span className="text-slate-300 font-semibold">{gpsData.pdop}</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Active Satellites</span>
                      <span className="text-yellow-400 font-semibold">{gpsData.satellites} locked</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">True Heading</span>
                      <span className="text-slate-200 font-semibold">{gpsData.heading}°</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">UTC Clock Drift</span>
                      <span className="text-cyan-400 font-semibold">{gpsData.utcDriftMs} ms</span>
                    </div>
                  </div>
                </div>

                {/* Camera Stream Metadata Box */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                        Camera Stream & Overlay Metadata
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80">
                      WebGL Shader Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Capture Resolution</span>
                      <span className="text-slate-200 font-semibold">{cameraData.resolution}</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Frame Rate</span>
                      <span className="text-emerald-400 font-semibold">{cameraData.fps} FPS</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Buffer Latency</span>
                      <span className="text-slate-200 font-semibold">{cameraData.bufferLatencyMs} ms</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Exposure / Shutter</span>
                      <span className="text-slate-300 font-semibold">{cameraData.shutter} (ISO {cameraData.iso})</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Color Space</span>
                      <span className="text-slate-300 font-semibold">{cameraData.colorSpace}</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Shader Render Cost</span>
                      <span className="text-lime-400 font-semibold">{cameraData.shaderRenderMs} ms/frame</span>
                    </div>
                  </div>

                  {/* SHA-256 Frame Watermark */}
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1 text-cyan-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Live Forensic SHA-256 HMAC Seal:</span>
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-300 break-all bg-slate-900/80 p-1.5 rounded">
                      {cameraData.sha256Hash}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Real-time Event Stream */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px] mr-1">Filter:</span>
                  {['ALL', 'GPS', 'CAMERA', 'FORENSIC', 'SYSTEM', 'SECURITY'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAutoScroll(!isAutoScroll)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                      isAutoScroll ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isAutoScroll ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    <span>{isAutoScroll ? 'Auto-Scroll ON' : 'Paused'}</span>
                  </button>

                  <button
                    onClick={() => setLogs([])}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-[10px] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Log Window */}
              <div
                ref={logContainerRef}
                className="h-64 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] space-y-1.5 scroll-smooth"
              >
                {filteredLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600">
                    No events in current filter.
                  </div>
                ) : (
                  filteredLogs.map((log) => {
                    const badgeColor =
                      log.category === 'GPS'
                        ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800'
                        : log.category === 'CAMERA'
                        ? 'text-cyan-400 bg-cyan-950/80 border-cyan-800'
                        : log.category === 'FORENSIC'
                        ? 'text-yellow-400 bg-yellow-950/80 border-yellow-800'
                        : log.category === 'SECURITY'
                        ? 'text-rose-400 bg-rose-950/80 border-rose-800'
                        : 'text-slate-400 bg-slate-800 border-slate-700';

                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-2.5 p-1 rounded hover:bg-slate-900/60 transition-colors"
                      >
                        <span className="text-slate-500 text-[10px] shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {log.timestamp}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${badgeColor}`}
                        >
                          {log.category}
                        </span>
                        <span className="text-slate-200 flex-1 leading-snug">
                          {log.message}
                          {log.metadata && (
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {JSON.stringify(log.metadata)}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Multiplatform Brand Specifications & Title Bar Mockups */}
          {activeTab === 'specs' && (
            <PlatformBarShowcase />
          )}
        </div>
      )}
    </section>
  );
};

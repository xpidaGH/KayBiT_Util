import { PostgisQueryResult } from '../types';

export interface CobolRecordConfig {
  assetId: string;
  lat: number;
  lon: number;
  expectedMinLat: number;
  expectedMaxLat: number;
  expectedMinLon: number;
  expectedMaxLon: number;
  status: 'PENDING' | 'VERIFIED' | 'BREACH';
  timestamp: string;
}

export interface SolarForensicScenario {
  id: string;
  label: string;
  lat: number;
  lon: number;
  dateStr: string;
  description: string;
  isSpoofed: boolean;
}

export interface OcrScenarioConfig {
  id: 'match' | 'speeding_breach';
  label: string;
  postedLimitKmh: number;
  telemetrySpeedKmh: number;
  confidencePercent: number;
  verdictDescription: string;
}

/**
 * Phase 1: Kernel Driver & Infrastructure Raw Data & Configs
 */
export const PHASE1_CONFIG = {
  initialCobolLogs: [
    'JOB KAYBAUD1 INITIALIZED ON IBM SYSTEM/390 ENTERPRISE SERVER',
    'ATTACHING DD:ASSTMST (MASTER FILE) BLOCKSIZE=27920 RECORD=120',
    'ATTACHING DD:AUDITTRN (SPATIAL INVENTORY QUEUE) RECORD=160',
    'STATUS: READY FOR SEQUENTIAL BATCH EXECUTION.',
  ],
  initialCobolRecords: [
    {
      assetId: 'AST-CH-8901',
      lat: 47.3769,
      lon: 8.5417,
      expectedMinLat: 47.35,
      expectedMaxLat: 47.40,
      expectedMinLon: 8.50,
      expectedMaxLon: 8.58,
      status: 'PENDING' as const,
      timestamp: '2026-09-30T10:14:02Z',
    },
    {
      assetId: 'AST-CH-8902',
      lat: 47.3812,
      lon: 8.5390,
      expectedMinLat: 47.35,
      expectedMaxLat: 47.40,
      expectedMinLon: 8.50,
      expectedMaxLon: 8.58,
      status: 'PENDING' as const,
      timestamp: '2026-09-30T10:14:04Z',
    },
    {
      assetId: 'AST-CH-8903',
      lat: 48.9102,
      lon: 9.1204,
      expectedMinLat: 47.35,
      expectedMaxLat: 47.40,
      expectedMinLon: 8.50,
      expectedMaxLon: 8.58,
      status: 'PENDING' as const,
      timestamp: '2026-09-30T10:14:06Z',
    },
    {
      assetId: 'AST-CH-8904',
      lat: 47.3695,
      lon: 8.5441,
      expectedMinLat: 47.35,
      expectedMaxLat: 47.40,
      expectedMinLon: 8.50,
      expectedMaxLon: 8.58,
      status: 'PENDING' as const,
      timestamp: '2026-09-30T10:14:08Z',
    },
    {
      assetId: 'AST-CH-8905',
      lat: 47.3720,
      lon: 8.5501,
      expectedMinLat: 47.35,
      expectedMaxLat: 47.40,
      expectedMinLon: 8.50,
      expectedMaxLon: 8.58,
      status: 'PENDING' as const,
      timestamp: '2026-09-30T10:14:10Z',
    },
    {
      assetId: 'AST-CH-8906',
      lat: 43.1200,
      lon: 12.4400,
      expectedMinLat: 47.35,
      expectedMaxLat: 47.40,
      expectedMinLon: 8.50,
      expectedMaxLon: 8.58,
      status: 'PENDING' as const,
      timestamp: '2026-09-30T10:14:12Z',
    },
  ] as CobolRecordConfig[],
  initialTpmState: {
    frameCount: 4209,
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    signature: '3045022100811c9dc5fa7b99c10220e3b0c44298fc1c149afbf4c8',
  },
  ring0Descriptor: {
    devicePath: '/dev/kaybit_sec0',
    lockPages: 'ACTIVE',
    monotonicTimestampNs: '189340291948842 ns',
    pixelDimensions: '1920 x 1080 (YUV420 / NV21)',
    avx2Bandwidth: '18.4 GB/s (0.41ms copy latency)',
    tscRegister: '0x00007FFAC891004B',
  },
  shellHardening: {
    linuxBash: [
      'Disables Android mock locations (/sys/class/android)',
      'Enforces CONFIG_MODULE_SIG kernel verification',
      'Sets UART /dev/ttyS0 to 115200 raw exclusive',
      'Ingests signed kernel module with DMA locking',
    ],
    windowsPowerShell: [
      'Hypervisor-Enforced Code Integrity (HVCI) checked',
      'Hardware TPM 2.0 provisioning verified',
      'Isolates Media Foundation virtual filter driver',
      'Enforces non-paged pool memory allocations',
    ],
  },
};

/**
 * Phase 2: Precision Overlay Engine & Mobile Raw Data & Configs
 */
export const PHASE2_CONFIG = {
  defaultKalmanParams: {
    processNoiseQ: 0.05,
    measurementNoiseR: 0.65,
    initialPosition: 50,
    updateIntervalMs: 80,
  },
  vulkanBenchmarkStats: {
    gpuFrameBudgetMs: '16.67 ms (60 FPS)',
    maxAllocationLimitMs: '< 3.00 ms',
    observedVulkanPassMs: '1.42 ms (Sub-3ms PASS)',
  },
  glslFragmentShader: `#version 450 core
layout(location = 0) in vec2 v_TexCoord;
layout(location = 0) out vec4 out_Color;
layout(binding = 0) uniform sampler2D u_CameraFrame;
layout(binding = 1) uniform sampler2D u_GlyphAtlas;

void main() {
    vec4 cameraPixel = texture(u_CameraFrame, v_TexCoord);
    vec4 hudGlyph = texture(u_GlyphAtlas, v_TexCoord);
    // Alpha composite telemetry directly in swapchain fragment shader
    out_Color = mix(cameraPixel, hudGlyph, hudGlyph.a);
}`,
  mobilePipelineModules: [
    {
      subsystem: 'ANDROID SUBSYSTEM',
      title: 'Jetpack CameraX (Kotlin)',
      tech: 'Kotlin 2.0 · Coroutines',
      desc: 'Attaches an ImageAnalysis analyzer to the hardware camera session. Uses Kotlin Coroutine flows with non-blocking backpressure strategies (DROP_OLDEST) to prevent memory allocation spikes.',
    },
    {
      subsystem: 'SENSOR ENGINE',
      title: 'Direct Off-Heap Buffers (Java)',
      tech: 'Java 21 · JNI Direct',
      desc: 'Collects 100 Hz accelerometer and gyroscope vectors into off-heap direct ByteBuffers (ByteBuffer.allocateDirect) eliminating JNI marshal costs.',
    },
    {
      subsystem: 'CROSS-PLATFORM SHELL',
      title: 'Flutter UI & Offline Cache (Dart)',
      tech: 'Flutter 3.24 · Isar DB',
      desc: 'Subscribes to telemetry streams via Flutter EventChannels. Coordinates and signatures are persisted locally into a zero-allocation reactive database (Isar) to survive loss of connectivity.',
    },
  ],
};

/**
 * Phase 3: Spatial Video Ingestion & AI Verification Raw Data & Configs
 */
export const PHASE3_CONFIG = {
  solarScenarios: [
    {
      id: 'authentic_noon',
      label: 'Authentic Solar Noon (Zurich)',
      lat: 47.3769,
      lon: 8.5417,
      dateStr: '2026-06-21T11:45:00',
      description: 'Solar noon in mid-summer; shadows point almost due north.',
      isSpoofed: false,
    },
    {
      id: 'authentic_morning',
      label: 'Authentic Morning (London)',
      lat: 51.5074,
      lon: -0.1278,
      dateStr: '2026-05-15T07:30:00',
      description: 'Morning azimuth generates long shadows pointing westward.',
      isSpoofed: false,
    },
    {
      id: 'spoofed_timestamp',
      label: '🚨 Temporal Fraud (Spoofed Timestamp)',
      lat: 47.3769,
      lon: 8.5417,
      dateStr: '2026-06-21T12:00:00',
      description: 'Video recorded at sunset (shadow at 65°), but claimed GPS timestamp is noon.',
      isSpoofed: true,
    },
    {
      id: 'equator_solstice',
      label: 'Equator Equinox (Kampala)',
      lat: 0.0,
      lon: 32.58,
      dateStr: '2026-03-20T12:00:00',
      description: 'Near-zero solar zenith at the equator equinox.',
      isSpoofed: false,
    },
  ] as SolarForensicScenario[],

  ocrScenarios: {
    match: {
      id: 'match',
      label: 'Scenario A: Legal Speed (45 km/h)',
      postedLimitKmh: 50.0,
      telemetrySpeedKmh: 45.2,
      confidencePercent: 98.4,
      verdictDescription: 'Verified: Driver was traveling in accordance with physical posted road signs captured in the video stream.',
    } as OcrScenarioConfig,
    speeding_breach: {
      id: 'speeding_breach',
      label: 'Scenario B: Speed Violation (112 km/h)',
      postedLimitKmh: 50.0,
      telemetrySpeedKmh: 112.4,
      confidencePercent: 98.4,
      verdictDescription: 'Speed Violation / Telemetry Inconsistency: Vehicle GPS speed (112 km/h) exceeds the visual speed limit sign (50 km/h) by +62.4 km/h.',
    } as OcrScenarioConfig,
  },

  cloudWorkerFleet: [
    {
      badge: 'GATEWAY & INGRESS',
      name: 'TypeScript / Node.js',
      desc: 'Handles 50,000+ persistent WebSockets, parses 512-byte metadata contracts, and pushes chunks into Redis pub/sub streams.',
    },
    {
      badge: 'MEDIA QUEUES',
      name: 'Ruby (Sidekiq)',
      desc: 'Dequeues chunks, calculates binary SHA-256 match, and extracts embedded QuickTime / MP4 EXIF GPS tracks via ExifTool.',
    },
    {
      badge: 'TRANSCODING FLEET',
      name: 'PHP 8.3 CLI Workers',
      desc: 'Orchestrates asynchronous FFmpeg child processes to generate H.264 watermarked stream variants and keyframe extractions.',
    },
    {
      badge: 'AI FORENSIC BRAIN',
      name: 'Python FastAPI & PyTorch',
      desc: 'Runs astronomical PSA solar math, checks physical shadow angles, and executes OCR models on road signs.',
    },
  ],
};

/**
 * Phase 4: Fleet Telemetry Spatial OLAP & Forensic Raw Data & Configs
 */
export const PHASE4_CONFIG = {
  postgisQueries: {
    supersonic: {
      query: `WITH sequential_pings AS (
    SELECT vehicle_vin, recorded_at, geom,
           LAG(geom) OVER (PARTITION BY vehicle_vin ORDER BY recorded_at) as prev_geom,
           EXTRACT(EPOCH FROM (recorded_at - LAG(recorded_at) OVER (PARTITION BY vehicle_vin ORDER BY recorded_at))) as dt_seconds
    FROM fleet_telemetry_logs
)
SELECT vehicle_vin, recorded_at,
       ROUND((ST_Distance(geom::geography, prev_geom::geography) / dt_seconds * 3.6)::numeric, 2) AS speed_kmh,
       'SUPERSONIC_JUMP_VIOLATION' AS anomaly_flag
FROM sequential_pings
WHERE dt_seconds > 0 AND (ST_Distance(geom::geography, prev_geom::geography) / dt_seconds * 3.6) > 250.0;`,
      executionTimeMs: 12.4,
      columns: ['vehicle_vin', 'recorded_at', 'speed_kmh', 'anomaly_flag'],
      rows: [
        { vehicle_vin: '1HGCR2F83HA00918', recorded_at: '2026-09-30 08:14:05 UTC', speed_kmh: 384000.22, anomaly_flag: 'SUPERSONIC_JUMP_VIOLATION' },
        { vehicle_vin: '3VW2K7AJ4HM29910', recorded_at: '2026-09-30 09:22:18 UTC', speed_kmh: 8900.50, anomaly_flag: 'SUPERSONIC_JUMP_VIOLATION' },
        { vehicle_vin: 'WAUZZZF27NA01882', recorded_at: '2026-09-30 11:05:42 UTC', speed_kmh: 1420.15, anomaly_flag: 'SUPERSONIC_JUMP_VIOLATION' },
      ],
      anomaliesDetectedCount: 3,
    } as PostgisQueryResult,

    open_water: {
      query: `SELECT t.vehicle_vin, t.recorded_at,
       ST_AsText(t.geom) AS coordinate_wkt,
       m.zone_name,
       'ILLEGAL_OPEN_WATER_INTERSECTION' AS anomaly_flag
FROM fleet_telemetry_logs t
JOIN restricted_maritime_zones m 
  ON ST_Contains(m.geom_boundary, t.geom)
WHERE t.recorded_at >= NOW() - INTERVAL '24 hours';`,
      executionTimeMs: 18.2,
      columns: ['vehicle_vin', 'recorded_at', 'coordinate_wkt', 'zone_name', 'anomaly_flag'],
      rows: [
        { vehicle_vin: '2C3CDXBG8PH50192', recorded_at: '2026-09-30 07:11:00 UTC', coordinate_wkt: 'POINT(8.548 47.331)', zone_name: 'Lake Zurich Maritime Corridor', anomaly_flag: 'ILLEGAL_OPEN_WATER_INTERSECTION' },
        { vehicle_vin: '5NMS23AC9LH04491', recorded_at: '2026-09-30 10:48:30 UTC', coordinate_wkt: 'POINT(1.312 51.109)', zone_name: 'English Channel Shipping Lane', anomaly_flag: 'ILLEGAL_OPEN_WATER_INTERSECTION' },
      ],
      anomaliesDetectedCount: 2,
    } as PostgisQueryResult,

    partition_aggr: {
      query: `SELECT 
    date_trunc('hour', recorded_at) AS time_bucket,
    COUNT(*) AS total_points,
    ROUND(AVG(speed_kmh), 2) AS fleet_avg_speed,
    SUM(CASE WHEN tpm_hash_verified = false THEN 1 ELSE 0 END) AS unverified_tpm_count
FROM fleet_telemetry_logs
GROUP BY 1 ORDER BY 1 DESC LIMIT 4;`,
      executionTimeMs: 8.6,
      columns: ['time_bucket', 'total_points', 'fleet_avg_speed', 'unverified_tpm_count'],
      rows: [
        { time_bucket: '2026-09-30 11:00:00 UTC', total_points: 248900, fleet_avg_speed: 54.2, unverified_tpm_count: 0 },
        { time_bucket: '2026-09-30 10:00:00 UTC', total_points: 412500, fleet_avg_speed: 61.8, unverified_tpm_count: 3 },
        { time_bucket: '2026-09-30 09:00:00 UTC', total_points: 398200, fleet_avg_speed: 58.4, unverified_tpm_count: 1 },
        { time_bucket: '2026-09-30 08:00:00 UTC', total_points: 310100, fleet_avg_speed: 48.9, unverified_tpm_count: 0 },
      ],
      anomaliesDetectedCount: 4,
    } as PostgisQueryResult,
  },

  sparkStreamingMetrics: {
    ingestionRate: '142,000 pings/sec',
    activePartitions: '512 Workers',
    watermarkDrift: '10 Minutes',
    tamperRate: '0.003% (Low)',
  },

  rFraudModelMetrics: {
    chiSquareThreshold: '16.27 (p < 0.001)',
    maxObservedMahalanobisDist: '84.19 (Route AST-8903)',
    verdictMessage: 'Verdict: Route AST-8903 exhibited zero engine accelerometer vibrations despite claiming 85 km/h displacement over 40 kilometers. Statistically flagged as software-injected mileage theft.',
  },

  matlabGnssDiagnostics: {
    software_emulator: {
      headline: '[CRITICAL ALERT] ARTIFICIAL SOFTWARE GPS EMULATOR DETECTED!',
      items: [
        'C/N0 Signal-to-Noise Variance: 0.000 dB-Hz (Unrealistically flat across all 12 channels)',
        'Receiver Crystal Oscillator Drift: 0.000000 ns/s (Synthetic perfect clock detected)',
        'Doppler Shift Deviation: Zero atmospheric scintillation observed',
      ],
      diagnosis: 'Diagnosis: The telemetry feed originates from an Android Mock Location provider or desktop software emulator injecting static NMEA sentences without physical radio wave propagation physics.',
    },
    real_receiver: {
      headline: '[PASSED] AUTHENTIC HARDWARE RADIO RECEPTION CONFIRMED',
      items: [
        'C/N0 Signal-to-Noise Variance: 4.82 dB-Hz (Natural atmospheric fluctuation)',
        'Receiver Crystal Oscillator Drift: 3.12 ns/s (Normal quartz thermal drift)',
        'Doppler Shift Deviation: Matches theoretical GPS constellation orbital velocities',
      ],
      diagnosis: 'Diagnosis: Hardware antenna verified against physical ionospheric and tropospheric delay patterns.',
    },
  },
};

/**
 * App Hero Bar Metrics
 */
export const APP_METRICS_CONFIG = [
  { label: 'ARCHITECTURE', value: '4 Distinct Phases', color: 'text-slate-200' },
  { label: 'SUPPORTED LANGUAGES', value: '21 Languages Active', color: 'text-cyan-400' },
  { label: 'OVERLAY ALLOCATION', value: '< 3.0 ms / Frame', color: 'text-emerald-400' },
  { label: 'ROOT OF TRUST', value: 'Hardware TPM 2.0 / HSM', color: 'text-purple-400' },
];

/**
 * TopBar Navigation Items Configuration
 */
export interface TopBarNavItem {
  id: 'camera' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'explorer';
  label: string;
  mobileLabel: string;
  iconName: 'Camera' | 'ShieldCheck' | 'Cpu' | 'Cloud' | 'Database' | 'Code2';
}

export const TOPBAR_NAV_ITEMS: TopBarNavItem[] = [
  { id: 'camera', label: 'Camera HUD', mobileLabel: 'Camera HUD', iconName: 'Camera' },
  { id: 'phase1', label: 'Phase 1: Kernel Driver', mobileLabel: 'P1: Kernel', iconName: 'ShieldCheck' },
  { id: 'phase2', label: 'Phase 2: Precision Overlay', mobileLabel: 'P2: Overlay', iconName: 'Cpu' },
  { id: 'phase3', label: 'Phase 3: AI Verification', mobileLabel: 'P3: AI Ingest', iconName: 'Cloud' },
  { id: 'phase4', label: 'Phase 4: Spatial OLAP', mobileLabel: 'P4: Spatial OLAP', iconName: 'Database' },
  { id: 'explorer', label: '21 Languages', mobileLabel: '21 Languages', iconName: 'Code2' },
];

/**
 * General App Metadata and Information
 */
export const APP_INFO_CONFIG = {
  appName: 'KayBiT_Util',
  tagline: 'Camera & GPS Timestamp Utility & Customization Platform',
  title: 'Camera & GPS Timestamp Utility & Customization Tools',
  description:
    'A production-grade educational and forensic demonstration platform spanning 21 programming languages across 4 architectural tiers. From Ring 0 kernel device drivers and mobile Vulkan shaders to distributed cloud gateways and PostGIS spatial analytics.',
  languagesSupportedCount: 21,
  architecturePhasesCount: 4,
  footerTechList: 'ISO C17 · C++20 · Rust 2024 · Go · Kotlin · Swift · Python · PostGIS · COBOL',
};

/**
 * Live System Health & Heartbeat Configuration for Architectural Phases
 */
export type HealthStatusType = 'operational' | 'high_latency' | 'degraded';

export interface PhaseHealthDefinition {
  phaseId: 'phase1' | 'phase2' | 'phase3' | 'phase4';
  name: string;
  shortLabel: string;
  tier: string;
  defaultLatencyMs: number;
  iconName: 'ShieldCheck' | 'Cpu' | 'Cloud' | 'Database';
  description: string;
}

export const SYSTEM_HEALTH_CONFIG = {
  updateIntervalMs: 2400,
  phases: [
    {
      phaseId: 'phase1',
      name: 'Phase 1: Kernel Driver & HSM',
      shortLabel: 'P1: Kernel Driver',
      tier: 'Ring 0 & TPM 2.0 Vault',
      defaultLatencyMs: 3.2,
      iconName: 'ShieldCheck',
      description: 'Raw video DMA & serial NMEA interceptors',
    },
    {
      phaseId: 'phase2',
      name: 'Phase 2: Precision Overlay Engine',
      shortLabel: 'P2: Overlay Engine',
      tier: 'NDK Kalman & Vulkan 60FPS',
      defaultLatencyMs: 1.8,
      iconName: 'Cpu',
      description: 'Hardware clock decoupling & shader burner',
    },
    {
      phaseId: 'phase3',
      name: 'Phase 3: Spatial Video AI Ingest',
      shortLabel: 'P3: Cloud Ingest & AI',
      tier: 'Distributed Queue & OpenCV AI',
      defaultLatencyMs: 24.5,
      iconName: 'Cloud',
      description: 'Astronomical solar shadows & OCR sign check',
    },
    {
      phaseId: 'phase4',
      name: 'Phase 4: Fleet Spatial OLAP',
      shortLabel: 'P4: Spatial OLAP',
      tier: 'PostGIS & Spark & R & MATLAB',
      defaultLatencyMs: 14.1,
      iconName: 'Database',
      description: 'Trajectory anomalies & GNSS radio drift model',
    },
  ] as PhaseHealthDefinition[],
  statusStyles: {
    operational: {
      label: 'Operational',
      badge: 'HEALTHY',
      colorText: 'text-emerald-400',
      colorBg: 'bg-emerald-500/10',
      colorBorder: 'border-emerald-500/30',
      colorDot: 'bg-emerald-400',
      shadowGlow: 'shadow-[0_0_10px_rgba(52,211,153,0.35)]',
    },
    high_latency: {
      label: 'High-Latency',
      badge: 'SLOW (120ms+)',
      colorText: 'text-amber-400',
      colorBg: 'bg-amber-500/10',
      colorBorder: 'border-amber-500/30',
      colorDot: 'bg-amber-400',
      shadowGlow: 'shadow-[0_0_10px_rgba(251,191,36,0.35)]',
    },
    degraded: {
      label: 'Degraded / Syncing',
      badge: 'SYNCING',
      colorText: 'text-rose-400',
      colorBg: 'bg-rose-500/10',
      colorBorder: 'border-rose-500/30',
      colorDot: 'bg-rose-400',
      shadowGlow: 'shadow-[0_0_10px_rgba(251,113,133,0.35)]',
    },
  },
};



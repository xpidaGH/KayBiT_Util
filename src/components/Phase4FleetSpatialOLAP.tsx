import React, { useState } from 'react';
import { Database, Play, CheckCircle2, AlertTriangle, FileText, Cpu, Radio, Sparkles, Sliders } from 'lucide-react';
import { PostgisQueryResult } from '../types';

export const Phase4FleetSpatialOLAP: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'postgis_sql' | 'spark_scala' | 'r_fraud' | 'matlab_gnss'>('postgis_sql');

  // PostGIS SQL State
  const [selectedQueryType, setSelectedQueryType] = useState<'supersonic' | 'open_water' | 'partition_aggr'>('supersonic');
  const [isExecutingSql, setIsExecutingSql] = useState<boolean>(false);
  const [sqlResult, setSqlResult] = useState<PostgisQueryResult>({
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
    executionTimeMs: 14.8,
    columns: ['vehicle_vin', 'recorded_at', 'speed_kmh', 'anomaly_flag'],
    rows: [
      { vehicle_vin: '1HGCR2F83HA00918', recorded_at: '2026-09-30 08:14:05 UTC', speed_kmh: 384000.22, anomaly_flag: 'SUPERSONIC_JUMP_VIOLATION' },
      { vehicle_vin: '3VW2K7AJ4HM29910', recorded_at: '2026-09-30 09:22:18 UTC', speed_kmh: 8900.50, anomaly_flag: 'SUPERSONIC_JUMP_VIOLATION' },
    ],
    anomaliesDetectedCount: 2,
  });

  const handleRunSql = () => {
    setIsExecutingSql(true);
    setTimeout(() => {
      if (selectedQueryType === 'supersonic') {
        setSqlResult({
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
        });
      } else if (selectedQueryType === 'open_water') {
        setSqlResult({
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
        });
      } else {
        setSqlResult({
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
        });
      }
      setIsExecutingSql(false);
    }, 350);
  };

  // MATLAB GNSS Anomaly State
  const [matlabScenario, setMatlabScenario] = useState<'real_receiver' | 'software_emulator'>('software_emulator');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
          <Database className="w-4 h-4" />
          <span>PHASE 4 · BIG DATA, SPATIAL OLAP & FINANCIAL LEDGERS</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
          Fleet Telemetry Spatial OLAP & Forensic Auditing Suite
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          Integrates PostgreSQL/PostGIS geometric indexing, Apache Spark streaming analytics in Scala, R multivariate Mahalanobis route fraud models, and MATLAB GNSS signal anomaly analysis to detect artificial GPS emulators.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs font-medium pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'postgis_sql', label: 'PostGIS Spatial Query Console', icon: Database },
          { id: 'spark_scala', label: 'Apache Spark Distributed Stream (Scala)', icon: Cpu },
          { id: 'r_fraud', label: 'R Statistical Mahalanobis Fraud Engine', icon: Sliders },
          { id: 'matlab_gnss', label: 'MATLAB GNSS Signal & Emulator Detector', icon: Radio },
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

      {/* SUB-VIEW 1: PostGIS Spatial Query Console */}
      {activeTab === 'postgis_sql' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/70">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Select Spatial Query:</span>
              <button
                onClick={() => setSelectedQueryType('supersonic')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  selectedQueryType === 'supersonic'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                Supersonic Teleportation (ST_Distance)
              </button>
              <button
                onClick={() => setSelectedQueryType('open_water')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  selectedQueryType === 'open_water'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                Open Water Intersection (ST_Contains)
              </button>
              <button
                onClick={() => setSelectedQueryType('partition_aggr')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  selectedQueryType === 'partition_aggr'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                Hourly Partition Rollup
              </button>
            </div>

            <button
              onClick={handleRunSql}
              disabled={isExecutingSql}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              {isExecutingSql ? 'Executing PostGIS...' : 'Execute SQL Query'}
            </button>
          </div>

          {/* SQL Editor / Query Text */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px] pb-2 border-b border-slate-800 mb-2">
              <span>POSTGRESQL 16 + POSTGIS 3.4 SPATIAL REPOSITORY</span>
              <span>QUERY PLANNER: COST=18.4..24.9</span>
            </div>
            <pre className="text-cyan-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {sqlResult.query}
            </pre>
          </div>

          {/* Execution Results Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                Spatial Query Result ({sqlResult.rows.length} rows returned in {sqlResult.executionTimeMs} ms)
              </span>
              <span className="text-[11px] font-mono text-rose-400">
                Anomalies Flagged: {sqlResult.anomaliesDetectedCount}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    {sqlResult.columns.map((col) => (
                      <th key={col} className="py-2 px-3 font-semibold uppercase text-[10px] tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {sqlResult.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/40">
                      {sqlResult.columns.map((col) => {
                        const val = row[col];
                        const isViolation = typeof val === 'string' && val.includes('VIOLATION');
                        return (
                          <td
                            key={col}
                            className={`py-2 px-3 ${
                              isViolation ? 'text-rose-400 font-bold' : ''
                            }`}
                          >
                            {String(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: Apache Spark Scala Aggregator */}
      {activeTab === 'spark_scala' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Apache Spark 3.5 Structured Streaming Pipeline (Scala 3)
            </h3>
            <p className="text-xs text-slate-400 leading-normal">
              Consumes billions of partitioned S3 parquet events. Groups telemetry streams by 15-minute tumbling windows and geohash-6 prefixes to calculate fleet density distributions and flag broken hardware sensor telemetry.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">INGESTION RATE</span>
                <span className="text-slate-100 text-base font-bold">142,000 pings/sec</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">ACTIVE PARTITIONS</span>
                <span className="text-cyan-400 text-base font-bold">512 Workers</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">WATERMARK DRIFT</span>
                <span className="text-slate-100 text-base font-bold">10 Minutes</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">CLUSTER TAMPER RATE</span>
                <span className="text-emerald-400 text-base font-bold">0.003% (Low)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: R Statistical Fraud Engine */}
      {activeTab === 'r_fraud' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              R Statistical Modeling: Robust Mahalanobis Distance (covMcd)
            </h3>
            <p className="text-xs text-slate-400 leading-normal">
              Detects multi-point driver mileage theft and route fabrication by calculating robust covariance matrices across reported vehicle velocity, engine accelerometer jitter, and physical displacement.
            </p>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex justify-between text-slate-400 pb-1 border-b border-slate-800">
                <span>R 4.4 ROBUSTBASE FORENSIC EVALUATION</span>
                <span>CONFIDENCE: 99.9% (Chi-Square df=3)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-300">
                <div>
                  <span className="text-slate-500 block">CHI-SQUARE CUTOFF THRESHOLD:</span>
                  <span className="text-cyan-400 font-semibold">16.27 (p &lt; 0.001)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">MAX OBSERVED MAHALANOBIS DISTANCE:</span>
                  <span className="text-rose-400 font-semibold">84.19 (Route AST-8903)</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 font-sans">
                Verdict: Route AST-8903 exhibited zero engine accelerometer vibrations despite claiming 85 km/h displacement over 40 kilometers. Statistically flagged as software-injected mileage theft.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: MATLAB GNSS Signal Anomaly & Emulator Detector */}
      {activeTab === 'matlab_gnss' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400" />
                  MATLAB Signal Anomaly Analyzer: Hardware GNSS vs Software Emulator
                </h3>
                <p className="text-[11px] text-slate-400">
                  Inspects Carrier-to-Noise Ratio (C/N0), Doppler shifts, and crystal oscillator clock drift.
                </p>
              </div>

              {/* Selector */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setMatlabScenario('software_emulator')}
                  className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                    matlabScenario === 'software_emulator'
                      ? 'bg-rose-950 text-rose-300 border border-rose-700'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Software GPS Emulator
                </button>
                <button
                  onClick={() => setMatlabScenario('real_receiver')}
                  className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                    matlabScenario === 'real_receiver'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Authentic Hardware GNSS
                </button>
              </div>
            </div>

            {/* MATLAB Output Console */}
            <div
              className={`p-4 rounded-lg border font-mono text-xs space-y-2 ${
                matlabScenario === 'software_emulator'
                  ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                  : 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
              }`}
            >
              <div className="flex justify-between border-b border-current/20 pb-1 text-[11px]">
                <span>MATLAB R2024b NAVIGATION TOOLBOX (gnss_emulator_detector.m)</span>
                <span>CONFIDENCE: 99.4%</span>
              </div>

              {matlabScenario === 'software_emulator' ? (
                <>
                  <p className="font-bold text-rose-300">
                    [CRITICAL ALERT] ARTIFICIAL SOFTWARE GPS EMULATOR DETECTED!
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                    <li>C/N0 Signal-to-Noise Variance: 0.000 dB-Hz (Unrealistically flat across all 12 channels)</li>
                    <li>Receiver Crystal Oscillator Drift: 0.000000 ns/s (Synthetic perfect clock detected)</li>
                    <li>Doppler Shift Deviation: Zero atmospheric scintillation observed</li>
                  </ul>
                  <p className="text-rose-300 text-[11px] pt-1 font-sans">
                    Diagnosis: The telemetry feed originates from an Android Mock Location provider or desktop software emulator injecting static NMEA sentences without physical radio wave propagation physics.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-emerald-300">
                    [PASSED] AUTHENTIC HARDWARE RADIO RECEPTION CONFIRMED
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                    <li>C/N0 Signal-to-Noise Variance: 4.82 dB-Hz (Natural atmospheric fluctuation)</li>
                    <li>Receiver Crystal Oscillator Drift: 3.12 ns/s (Normal quartz thermal drift)</li>
                    <li>Doppler Shift Deviation: Matches theoretical GPS constellation orbital velocities</li>
                  </ul>
                  <p className="text-emerald-300 text-[11px] pt-1 font-sans">
                    Diagnosis: Hardware antenna verified against physical ionospheric and tropospheric delay patterns.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { Database, Play, Cpu, Radio, Sliders } from 'lucide-react';
import { PostgisQueryResult } from '../types';
import { PHASE4_CONFIG } from '../data/phasesConfig';

export const Phase4FleetSpatialOLAP: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'postgis_sql' | 'spark_scala' | 'r_fraud' | 'matlab_gnss'>('postgis_sql');

  // PostGIS SQL State from structured configuration
  const [selectedQueryType, setSelectedQueryType] = useState<'supersonic' | 'open_water' | 'partition_aggr'>('supersonic');
  const [isExecutingSql, setIsExecutingSql] = useState<boolean>(false);
  const [sqlResult, setSqlResult] = useState<PostgisQueryResult>(PHASE4_CONFIG.postgisQueries.supersonic);

  const handleRunSql = () => {
    setIsExecutingSql(true);
    setTimeout(() => {
      setSqlResult(PHASE4_CONFIG.postgisQueries[selectedQueryType]);
      setIsExecutingSql(false);
    }, 300);
  };

  // MATLAB GNSS Anomaly State
  const [matlabScenario, setMatlabScenario] = useState<'real_receiver' | 'software_emulator'>('software_emulator');
  const activeMatlabDiagnostic = PHASE4_CONFIG.matlabGnssDiagnostics[matlabScenario];

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
                <span className="text-slate-100 text-base font-bold">{PHASE4_CONFIG.sparkStreamingMetrics.ingestionRate}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">ACTIVE PARTITIONS</span>
                <span className="text-cyan-400 text-base font-bold">{PHASE4_CONFIG.sparkStreamingMetrics.activePartitions}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">WATERMARK DRIFT</span>
                <span className="text-slate-100 text-base font-bold">{PHASE4_CONFIG.sparkStreamingMetrics.watermarkDrift}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">CLUSTER TAMPER RATE</span>
                <span className="text-emerald-400 text-base font-bold">{PHASE4_CONFIG.sparkStreamingMetrics.tamperRate}</span>
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
                  <span className="text-cyan-400 font-semibold">{PHASE4_CONFIG.rFraudModelMetrics.chiSquareThreshold}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">MAX OBSERVED MAHALANOBIS DISTANCE:</span>
                  <span className="text-rose-400 font-semibold">{PHASE4_CONFIG.rFraudModelMetrics.maxObservedMahalanobisDist}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 font-sans">
                {PHASE4_CONFIG.rFraudModelMetrics.verdictMessage}
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

              <p className={`font-bold ${matlabScenario === 'software_emulator' ? 'text-rose-300' : 'text-emerald-300'}`}>
                {activeMatlabDiagnostic.headline}
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {activeMatlabDiagnostic.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className={`text-[11px] pt-1 font-sans ${matlabScenario === 'software_emulator' ? 'text-rose-300' : 'text-emerald-300'}`}>
                {activeMatlabDiagnostic.diagnosis}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { ShieldCheck, Terminal, Cpu, HardDrive, Key, Play, RefreshCw, FileCode } from 'lucide-react';
import { PHASE1_CONFIG, CobolRecordConfig } from '../data/phasesConfig';
import { TpmChipSealSvg } from '../data/svgAssets';

export const Phase1KernelDriver: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'architecture' | 'cobol' | 'kernel_mmap' | 'rust_tpm' | 'shell_hardening'>('architecture');

  // COBOL Mainframe Batch Simulator State from structured configuration
  const [cobolRunning, setCobolRunning] = useState<boolean>(false);
  const [cobolLogs, setCobolLogs] = useState<string[]>(PHASE1_CONFIG.initialCobolLogs);
  const [cobolStats, setCobolStats] = useState({ processed: 0, verified: 0, breaches: 0 });

  const [records, setRecords] = useState<CobolRecordConfig[]>(PHASE1_CONFIG.initialCobolRecords);

  // Execute COBOL Batch Processing
  const runCobolBatch = () => {
    setCobolRunning(true);
    setCobolLogs((prev) => [
      ...prev,
      '>>> STARTING PROCEDURE DIVISION EXECUTION (PERFORM 2000-PROCESS-AUDIT)...'
    ]);

    let idx = 0;
    let verifiedCount = 0;
    let breachCount = 0;

    const interval = setInterval(() => {
      if (idx < records.length) {
        const rec = records[idx];
        const isVerified =
          rec.lat >= rec.expectedMinLat &&
          rec.lat <= rec.expectedMaxLat &&
          rec.lon >= rec.expectedMinLon &&
          rec.lon <= rec.expectedMaxLon;

        if (isVerified) {
          verifiedCount++;
          setCobolLogs((prev) => [
            ...prev,
            `RECORD ${rec.assetId}: LAT=${rec.lat.toFixed(4)} LON=${rec.lon.toFixed(4)} -> IN-BOUNDS (VERIFIED)`
          ]);
        } else {
          breachCount++;
          setCobolLogs((prev) => [
            ...prev,
            `*** GEOFENCE VIOLATION DETECTED *** ASSET ${rec.assetId} COORDINATES OUT OF RANGE!`
          ]);
        }

        setRecords((prev) =>
          prev.map((r, i) => (i === idx ? { ...r, status: isVerified ? 'VERIFIED' : 'BREACH' } : r))
        );

        setCobolStats({
          processed: idx + 1,
          verified: verifiedCount,
          breaches: breachCount,
        });

        idx++;
      } else {
        clearInterval(interval);
        setCobolRunning(false);
        setCobolLogs((prev) => [
          ...prev,
          '>>> CLOSE ASSET-MASTER-FILE, AUDIT-TRANS-FILE, REPORT-FILE.',
          `BATCH COMPLETE. PROCESSED: ${records.length}, VERIFIED: ${verifiedCount}, BREACHES: ${breachCount}`,
          'RETURN CODE: 0004 (WARNING FLAGS LOGGED TO SYSOUT)'
        ]);
      }
    }, 400);
  };

  // Rust TPM Vault State from structured configuration
  const [tpmSealed, setTpmSealed] = useState<boolean>(true);
  const [tpmFrameCount, setTpmFrameCount] = useState<number>(PHASE1_CONFIG.initialTpmState.frameCount);
  const [tpmHash, setTpmHash] = useState<string>(PHASE1_CONFIG.initialTpmState.hash);
  const [tpmSig, setTpmSig] = useState<string>(PHASE1_CONFIG.initialTpmState.signature);

  const triggerTpmSeal = () => {
    const newSeq = tpmFrameCount + 1;
    setTpmFrameCount(newSeq);
    const newHash = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
    setTpmHash(newHash);
    setTpmSig(`3045022100${newHash.substring(0, 16)}fa7b0220${newHash.substring(16, 32)}`);
    setTpmSealed(true);
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Subtitle */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>PHASE 1 · SYSTEMS, EMBEDDED & INFRASTRUCTURE</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
          Kernel-Level Tamper-Proof GPS & Camera Driver
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          Integrates C, inline AVX2 Assembly, Rust, Go, Bash, PowerShell, and COBOL to create an immutable sensory pipeline from Ring 0 hardware interrupts to enterprise mainframe geofence ledgers.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs font-medium pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'architecture', label: 'Systems Blueprint', icon: Cpu },
          { id: 'kernel_mmap', label: 'Ring 0 & AVX2 Memory (C / Asm)', icon: HardDrive },
          { id: 'rust_tpm', label: 'Cryptographic Vault (Rust & TPM)', icon: Key },
          { id: 'cobol', label: 'Legacy Mainframe Ledger (COBOL)', icon: Terminal },
          { id: 'shell_hardening', label: 'Platform Hardening (Bash / PS)', icon: FileCode },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveModule(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeModule === tab.id
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

      {/* SUB-VIEW 1: Architecture Blueprint */}
      {activeModule === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Step 1: Hardware & Kernel Interceptor */}
            <div className="p-4 rounded-xl border border-cyan-800/40 bg-slate-900/60 space-y-2">
              <span className="text-[10px] font-mono text-cyan-400 font-semibold block">01 · RING 0 DRIVER</span>
              <h4 className="text-sm font-semibold text-slate-200">The Kernel Interceptor</h4>
              <p className="text-xs text-slate-400 leading-normal">
                Virtual device driver in C & inline AVX2 Assembly hooking V4L2 video streams and UART GPS serial ports. Captures raw YUV420 and $GPRMC strings directly into non-paged DMA memory before user-space rootkits can intervene.
              </p>
              <div className="pt-2 text-[11px] font-mono text-slate-300">
                Tech: <span className="text-cyan-300">C17 · x86_64 NASM</span>
              </div>
            </div>

            {/* Step 2: Rust TPM Signed Vault */}
            <div className="p-4 rounded-xl border border-purple-800/40 bg-slate-900/60 space-y-2">
              <span className="text-[10px] font-mono text-purple-400 font-semibold block">02 · FORENSIC DAEMON</span>
              <h4 className="text-sm font-semibold text-slate-200">The Cryptographic Vault</h4>
              <p className="text-xs text-slate-400 leading-normal">
                User-space Rust daemon mapping direct kernel buffers via zero-copy mmap. Computes SHA-256 frame digests and requests asymmetric Ed25519 signing from hardware TPM 2.0 / HSM chips.
              </p>
              <div className="pt-2 text-[11px] font-mono text-slate-300">
                Tech: <span className="text-purple-300">Rust 2024 · TPM 2.0</span>
              </div>
            </div>

            {/* Step 3: Go Orchestration */}
            <div className="p-4 rounded-xl border border-blue-800/40 bg-slate-900/60 space-y-2">
              <span className="text-[10px] font-mono text-blue-400 font-semibold block">03 · IPC ORCHESTRATION</span>
              <h4 className="text-sm font-semibold text-slate-200">gRPC System Service</h4>
              <p className="text-xs text-slate-400 leading-normal">
                High-throughput Go service coordinating driver lifecycle over local Unix domain sockets, enforcing memory locking (mlock) and orchestrating host hardening via Bash & PowerShell.
              </p>
              <div className="pt-2 text-[11px] font-mono text-slate-300">
                Tech: <span className="text-blue-300">Go 1.23 · Bash · PowerShell</span>
              </div>
            </div>

            {/* Step 4: COBOL Mainframe Ledger */}
            <div className="p-4 rounded-xl border border-emerald-800/40 bg-slate-900/60 space-y-2">
              <span className="text-[10px] font-mono text-emerald-400 font-semibold block">04 · ENTERPRISE LEDGER</span>
              <h4 className="text-sm font-semibold text-slate-200">Legacy Audit Core</h4>
              <p className="text-xs text-slate-400 leading-normal">
                Simulated IBM System/390 enterprise banking asset ledger. Processes sequential batch transactions to cross-examine incoming signed telemetry against master inventory geofence files.
              </p>
              <div className="pt-2 text-[11px] font-mono text-slate-300">
                Tech: <span className="text-emerald-300">IBM COBOL v6.4</span>
              </div>
            </div>

          </div>

          {/* Interactive Quick Links */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-200">Interactive Mainframe Demonstration</h4>
              <p className="text-[11px] text-slate-400">Run the live COBOL sequential batch executor to detect spatial geofence breaches.</p>
            </div>
            <button
              onClick={() => setActiveModule('cobol')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              Launch COBOL Terminal
            </button>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: COBOL Mainframe Batch Runner */}
      {activeModule === 'cobol' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/70">
            <div>
              <h3 className="text-xs font-semibold text-slate-200">IBM System/390 Enterprise Asset Ledger Terminal</h3>
              <p className="text-[11px] text-slate-400">COBOL Program ID: KBTAUD01 · Batch Sequential Spatial Geofence Verification</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={runCobolBatch}
                disabled={cobolRunning}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                {cobolRunning ? 'Executing Batch...' : 'Submit Batch JCL'}
              </button>
            </div>
          </div>

          {/* Mainframe Phosphor Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Terminal Log Console */}
            <div className="lg:col-span-7 rounded-xl border border-emerald-950 bg-black p-4 font-mono text-xs text-emerald-400 shadow-inner h-80 overflow-y-auto space-y-1">
              <div className="text-[10px] text-emerald-600 pb-2 border-b border-emerald-950 flex justify-between">
                <span>IBM Z-OS v2.5 SYSOUT QUEUE</span>
                <span>CC=0000 · ASID=004A</span>
              </div>
              {cobolLogs.map((line, idx) => (
                <div key={idx} className="leading-tight">
                  <span className="text-emerald-700 select-none mr-2">
                    {String(idx + 1).padStart(3, '0')}:
                  </span>
                  <span className={line.includes('VIOLATION') ? 'text-rose-400 font-bold' : ''}>
                    {line}
                  </span>
                </div>
              ))}
            </div>

            {/* Batch Inventory Records */}
            <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-semibold text-slate-200">Asset Transaction Records</span>
                <span className="text-[11px] font-mono text-slate-400">
                  Verified: {cobolStats.verified} | Breaches: {cobolStats.breaches}
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {records.map((r) => (
                  <div
                    key={r.assetId}
                    className={`p-2 rounded border text-xs font-mono flex items-center justify-between ${
                      r.status === 'VERIFIED'
                        ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                        : r.status === 'BREACH'
                        ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <span className="font-semibold block">{r.assetId}</span>
                      <span className="text-[10px] opacity-80">
                        {r.lat.toFixed(4)}, {r.lon.toFixed(4)}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        r.status === 'VERIFIED'
                          ? 'bg-emerald-900/80 text-emerald-300'
                          : r.status === 'BREACH'
                          ? 'bg-rose-900/80 text-rose-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: Ring 0 Driver Memory & AVX2 Assembly */}
      {activeModule === 'kernel_mmap' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Kernel Space (Ring 0) Direct Memory Map (mmap) & AVX2 Non-Temporal Stores
            </h3>
            <p className="text-xs text-slate-400 leading-normal">
              In high-throughput 60 FPS video capture (3.11 MB per 1080p YUV420 frame), standard CPU memory copy routines cause severe L3 cache evictions. The KayBiT Assembly routine uses <code className="text-cyan-300">vmovntdq</code> instructions to stream pixels straight to physical DRAM, completely bypassing cache hierarchies.
            </p>

            {/* Memory Struct Inspector from structured data */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
              <div className="text-slate-500 text-[11px] pb-1 border-b border-slate-800">
                ACTIVE RING BUFFER MMAP DESCRIPTOR: {PHASE1_CONFIG.ring0Descriptor.devicePath} [LOCK_PAGES: {PHASE1_CONFIG.ring0Descriptor.lockPages}]
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                <div>
                  <span className="text-slate-500 block">KERNEL MONOTONIC NS (ktime):</span>
                  <span className="text-cyan-400">{PHASE1_CONFIG.ring0Descriptor.monotonicTimestampNs}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">PIXEL DIMENSIONS:</span>
                  <span className="text-slate-200">{PHASE1_CONFIG.ring0Descriptor.pixelDimensions}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">AVX2 STREAM BANDWIDTH:</span>
                  <span className="text-emerald-400">{PHASE1_CONFIG.ring0Descriptor.avx2Bandwidth}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">HARDWARE TSC SERIALIZED (rdtscp):</span>
                  <span className="text-purple-400">{PHASE1_CONFIG.ring0Descriptor.tscRegister}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: Rust TPM Cryptographic Vault */}
      {activeModule === 'rust_tpm' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <TpmChipSealSvg size={20} className="text-purple-400 shrink-0" />
                  Rust Forensic Background Daemon & Hardware TPM 2.0 Sealer
                </h3>
                <p className="text-[11px] text-slate-400">
                  Emulates zero-copy SHA-256 frame hashing with Ed25519 asymmetric root-of-trust sealing.
                </p>
              </div>
              <button
                onClick={triggerTpmSeal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Seal Frame
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px]">CURRENT SHA-256 FRAME DIGEST:</span>
                <p className="text-emerald-400 break-all">{tpmHash}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px]">TPM 2.0 ASYMMETRIC SEAL (Ed25519 ASN.1 DER):</span>
                <p className="text-purple-400 break-all">{tpmSig}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: Platform Hardening Scripts */}
      {activeModule === 'shell_hardening' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200">
              Host Environment Memory Guard & Anti-Spoofing Hardening
            </h3>
            <p className="text-xs text-slate-400 leading-normal">
              Automated scripts in Bash (Linux) and PowerShell (Windows) inspect kernel memory signatures, verify TPM PCR registers, and lock down physical serial ports against mock location injection.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 font-mono text-xs">
                <span className="text-cyan-400 font-semibold block text-[11px]">Linux (Bash POSIX)</span>
                <ul className="text-slate-400 space-y-1 text-[11px]">
                  {PHASE1_CONFIG.shellHardening.linuxBash.map((item, idx) => (
                    <li key={idx}>✓ {item}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 font-mono text-xs">
                <span className="text-blue-400 font-semibold block text-[11px]">Windows (PowerShell 7.4)</span>
                <ul className="text-slate-400 space-y-1 text-[11px]">
                  {PHASE1_CONFIG.shellHardening.windowsPowerShell.map((item, idx) => (
                    <li key={idx}>✓ {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

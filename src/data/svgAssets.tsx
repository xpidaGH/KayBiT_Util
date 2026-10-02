import React from 'react';

/**
 * Technical HUD and Forensic Graphic SVG Assets
 */

interface SvgProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * High-Precision Reticle Crosshair SVG
 */
export const ReticleCrosshairSvg: React.FC<SvgProps> = ({ size = 24, className = 'text-cyan-400', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="24" cy="24" r="16" strokeDasharray="3 3" />
    <circle cx="24" cy="24" r="6" />
    <path d="M24 2v10M24 36v10M2 24h10M36 24h10" />
    <path d="M12 12l4 4M32 32l4 4M36 12l-4 4M16 32l-4 4" strokeWidth="1.5" />
  </svg>
);

/**
 * Artificial Horizon & Tactical Pitch Ladder SVG
 */
export const ArtificialHorizonSvg: React.FC<SvgProps> = ({ size = 64, className = 'text-cyan-400', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    className={className}
    {...props}
  >
    {/* Horizon line */}
    <line x1="10" y1="50" x2="35" y2="50" />
    <line x1="65" y1="50" x2="90" y2="50" />
    {/* Pitch rungs */}
    <line x1="30" y1="35" x2="45" y2="35" strokeDasharray="2 2" />
    <line x1="55" y1="35" x2="70" y2="35" strokeDasharray="2 2" />
    <line x1="30" y1="65" x2="45" y2="65" strokeDasharray="2 2" />
    <line x1="55" y1="65" x2="70" y2="65" strokeDasharray="2 2" />
    {/* Center aircraft symbol */}
    <circle cx="50" cy="50" r="3" fill="currentColor" />
    <path d="M42 50h-8M58 50h8M50 42v-8" />
  </svg>
);

/**
 * Physical Posted Speed Limit Sign SVG
 */
export const SpeedLimitSignSvg: React.FC<{ limit: number; size?: number; className?: string }> = ({
  limit,
  size = 80,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={className}
    role="img"
    aria-label={`Speed limit ${limit} km/h sign`}
  >
    <circle cx="50" cy="50" r="45" fill="#FFFFFF" stroke="#DC2626" strokeWidth="8" />
    <text
      x="50"
      y="38"
      textAnchor="middle"
      fill="#475569"
      fontSize="12"
      fontFamily="sans-serif"
      fontWeight="700"
      letterSpacing="0.05em"
    >
      LIMIT
    </text>
    <text
      x="50"
      y="74"
      textAnchor="middle"
      fill="#0F172A"
      fontSize="36"
      fontFamily="monospace"
      fontWeight="900"
    >
      {limit}
    </text>
  </svg>
);

/**
 * Compass Rose & Solar Vector SVG
 */
export const CompassRoseSvg: React.FC<{
  azimuthDeg: number;
  label?: string;
  size?: number;
  needleColor?: string;
  className?: string;
}> = ({
  azimuthDeg,
  label = 'AZIMUTH',
  size = 72,
  needleColor = '#22D3EE',
  className = '',
}) => (
  <div className={`flex flex-col items-center ${className}`}>
    <span className="text-[10px] font-mono text-slate-400 mb-1">{label}</span>
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Outer Dial */}
      <circle cx="50" cy="50" r="46" stroke="#334155" strokeWidth="2" fill="#0B132B" />
      <circle cx="50" cy="50" r="40" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
      
      {/* Cardinal ticks */}
      <text x="50" y="16" textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="sans-serif" fontWeight="700">N</text>
      <text x="88" y="54" textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="sans-serif" fontWeight="700">E</text>
      <text x="50" y="92" textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="sans-serif" fontWeight="700">S</text>
      <text x="12" y="54" textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="sans-serif" fontWeight="700">W</text>

      {/* Rotating Vector Needle */}
      <g transform={`rotate(${azimuthDeg}, 50, 50)`}>
        <polygon points="50,18 45,50 55,50" fill={needleColor} />
        <polygon points="50,82 46,50 54,50" fill="#64748B" opacity="0.6" />
        <circle cx="50" cy="50" r="4" fill="#0F172A" stroke={needleColor} strokeWidth="2" />
      </g>
    </svg>
    <span className="text-[11px] font-mono mt-1" style={{ color: needleColor }}>
      {azimuthDeg.toFixed(1)}°
    </span>
  </div>
);

/**
 * GNSS Satellite Constellation Constellation SVG
 */
export const SatelliteConstellationSvg: React.FC<SvgProps> = ({ size = 24, className = 'text-cyan-400', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 2v20M2 12h20" strokeDasharray="2 2" strokeOpacity="0.4" />
    <circle cx="12" cy="12" r="8" strokeOpacity="0.6" />
    <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
    <path d="M7 5l1 1M17 5l-1 1M7 19l1-1M17 19l-1-1" strokeWidth="2" />
  </svg>
);

/**
 * Hardware Security Module / TPM 2.0 Chip Seal SVG
 */
export const TpmChipSealSvg: React.FC<SvgProps> = ({ size = 28, className = 'text-purple-400', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="6" y="6" width="20" height="20" rx="3" fill="currentColor" fillOpacity="0.1" />
    {/* Chip pins */}
    <path d="M10 2v4M16 2v4M22 2v4M10 26v4M16 26v4M22 26v4M2 10h4M2 16h4M2 22h4M26 10h4M26 16h4M26 22h4" />
    {/* Keyhole / Seal in center */}
    <circle cx="16" cy="14" r="2.5" />
    <path d="M15 16.5h2l.5 3.5h-3z" />
  </svg>
);

/**
 * Live Heartbeat ECG Waveform SVG
 */
export const LiveHeartbeatWaveSvg: React.FC<SvgProps> = ({ size = 20, className = 'text-emerald-400', ...props }) => (
  <svg
    width={size * 2}
    height={size}
    viewBox="0 0 48 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M2 12h8l3-6 4 14 5-11 3 6 4-3h17" />
  </svg>
);


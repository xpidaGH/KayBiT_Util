import { TelemetryData, OverlayCustomization, OverlayTemplateId } from '../types';

export interface OverlayPresetDefinition {
  id: OverlayTemplateId;
  name: string;
  badge: string;
  desc: string;
  config: Partial<OverlayCustomization>;
}

export interface HudFieldOption {
  key: keyof OverlayCustomization;
  label: string;
}

export interface HudPositionOption {
  value: OverlayCustomization['position'];
  label: string;
}

/**
 * Initial Telemetry State
 */
export const DEFAULT_TELEMETRY_DATA: TelemetryData = {
  latitude: 47.376882,
  longitude: 8.541694,
  altitude: 408.2,
  speedKmh: 42.4,
  headingDeg: 84.0,
  accuracyMeters: 1.8,
  satellitesInView: 14,
  hdop: 0.8,
  vdop: 1.1,
  timestampUtc: new Date().toISOString(),
  unixEpochMs: Date.now(),
  nmeaSentenceRmc: '',
  nmeaSentenceGga: '',
  sha256FrameHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  tpmSignatureHex: '3045022100811c9dc5fa7b99c10220e3b0c44298fc1c14',
  geofenceStatus: 'AUTHORIZED',
  solarElevationDeg: 42.1,
  solarAzimuthDeg: 168.4,
  expectedShadowRatio: 1.106,
};

/**
 * Default Overlay Customization Configuration
 */
export const DEFAULT_OVERLAY_CUSTOMIZATION: OverlayCustomization = {
  templateId: 'forensic_police',
  fontSize: 13,
  fontColor: '#22d3ee', // Laser Cyan
  bgOpacity: 0.75,
  position: 'bottom-left',
  showCoordinates: true,
  showAltitude: true,
  showSpeed: true,
  showHeading: true,
  showSha256: true,
  showTpmSig: true,
  showNmea: true,
  showSatellites: true,
  showSolarData: true,
  showQrCode: true,
  customWatermarkTitle: 'KAYBIT FORENSIC CHAIN-OF-CUSTODY',
  operatorId: 'KBT-UNIT-409',
};

/**
 * Preset Templates Definitions with Full Configurations
 */
export const OVERLAY_PRESET_TEMPLATES: OverlayPresetDefinition[] = [
  {
    id: 'forensic_police',
    name: 'Forensic & Police Evidence',
    badge: 'TPM Sealed',
    desc: 'SHA-256 frame hash, officer badge ID, tamper seal & chain of custody.',
    config: {
      templateId: 'forensic_police',
      fontSize: 13,
      fontColor: '#22d3ee',
      bgOpacity: 0.85,
      position: 'bottom-left',
      showCoordinates: true,
      showAltitude: true,
      showSpeed: true,
      showHeading: true,
      showSha256: true,
      showTpmSig: true,
      showNmea: true,
      showSatellites: true,
      showSolarData: false,
      showQrCode: true,
      customWatermarkTitle: 'POLICE FORENSIC CHAIN-OF-CUSTODY',
    },
  },
  {
    id: 'surveyor_cadastral',
    name: 'Cadastral & Land Survey',
    badge: 'WGS84 High-Precision',
    desc: 'Elevation MSL, PDOP/HDOP constellation, and solar angle data.',
    config: {
      templateId: 'surveyor_cadastral',
      fontSize: 12,
      fontColor: '#34d399', // Emerald
      bgOpacity: 0.8,
      position: 'top-left',
      showCoordinates: true,
      showAltitude: true,
      showSpeed: false,
      showHeading: true,
      showSha256: true,
      showTpmSig: false,
      showNmea: true,
      showSatellites: true,
      showSolarData: true,
      showQrCode: false,
      customWatermarkTitle: 'CADASTRAL SURVEY GRADE GNSS WGS84',
    },
  },
  {
    id: 'logistics_fleet',
    name: 'Logistics Fleet Telematics',
    badge: 'Fleet Audit',
    desc: 'Speed in km/h, vehicle VIN, geofence status, and heading compass.',
    config: {
      templateId: 'logistics_fleet',
      fontSize: 13,
      fontColor: '#f59e0b', // Amber
      bgOpacity: 0.75,
      position: 'bottom-right',
      showCoordinates: true,
      showAltitude: false,
      showSpeed: true,
      showHeading: true,
      showSha256: false,
      showTpmSig: true,
      showNmea: false,
      showSatellites: true,
      showSolarData: false,
      showQrCode: false,
      customWatermarkTitle: 'ENTERPRISE FLEET TELEMATICS',
    },
  },
  {
    id: 'environmental_solar',
    name: 'Environmental & Solar Audit',
    badge: 'Astronomical PSA',
    desc: 'Calculates real-time solar elevation, azimuth & expected shadow ratios.',
    config: {
      templateId: 'environmental_solar',
      fontSize: 13,
      fontColor: '#fbbf24', // Sun Amber
      bgOpacity: 0.85,
      position: 'bottom-left',
      showCoordinates: true,
      showAltitude: true,
      showSpeed: false,
      showHeading: true,
      showSha256: true,
      showTpmSig: false,
      showNmea: false,
      showSatellites: true,
      showSolarData: true,
      showQrCode: true,
      customWatermarkTitle: 'ENVIRONMENTAL SOLAR SHADOW AUDIT',
    },
  },
  {
    id: 'avionics_military',
    name: 'Avionics Tactical HUD',
    badge: '6-DOF Kalman',
    desc: 'Artificial horizon, pitch ladders, and velocity vector overlays.',
    config: {
      templateId: 'avionics_military',
      fontSize: 13,
      fontColor: '#38bdf8', // Sky Blue
      bgOpacity: 0.9,
      position: 'split-hud',
      showCoordinates: true,
      showAltitude: true,
      showSpeed: true,
      showHeading: true,
      showSha256: true,
      showTpmSig: true,
      showNmea: true,
      showSatellites: true,
      showSolarData: false,
      showQrCode: true,
      customWatermarkTitle: 'AVIONICS 6-DOF TACTICAL HUD',
    },
  },
  {
    id: 'minimal_tabular',
    name: 'Minimal Tabular Monospace',
    badge: 'Clean Data',
    desc: 'Compact, non-intrusive coordinates and time readout.',
    config: {
      templateId: 'minimal_tabular',
      fontSize: 12,
      fontColor: '#f1f5f9', // Slate white
      bgOpacity: 0.6,
      position: 'bottom-left',
      showCoordinates: true,
      showAltitude: true,
      showSpeed: true,
      showHeading: false,
      showSha256: false,
      showTpmSig: false,
      showNmea: false,
      showSatellites: false,
      showSolarData: false,
      showQrCode: false,
      customWatermarkTitle: '',
    },
  },
];

/**
 * Display Field Toggles
 */
export const HUD_DISPLAY_FIELDS: HudFieldOption[] = [
  { key: 'showCoordinates', label: 'Lat / Lon' },
  { key: 'showAltitude', label: 'Altitude MSL' },
  { key: 'showSpeed', label: 'Speed (km/h)' },
  { key: 'showHeading', label: 'Heading Compass' },
  { key: 'showSha256', label: 'SHA-256 Hash' },
  { key: 'showTpmSig', label: 'TPM 2.0 Seal' },
  { key: 'showNmea', label: 'NMEA Sentence' },
  { key: 'showSatellites', label: 'Satellites / HDOP' },
  { key: 'showSolarData', label: 'Solar Shadow' },
  { key: 'showQrCode', label: 'Verifiable QR Seal' },
];

/**
 * HUD Positioning Options
 */
export const HUD_POSITION_OPTIONS: HudPositionOption[] = [
  { value: 'bottom-left', label: 'Bottom-Left Corner' },
  { value: 'bottom-right', label: 'Bottom-Right Corner' },
  { value: 'top-left', label: 'Top-Left Corner' },
  { value: 'top-right', label: 'Top-Right Corner' },
  { value: 'split-hud', label: 'Split Tactical Horizon' },
];

/**
 * Synthetic Drone Trajectory Generator Constants
 */
export const DRONE_SIMULATION_CONFIG = {
  centerLat: 47.3769,
  centerLon: 8.5417,
  latRadius: 0.003,
  lonRadius: 0.004,
  baseAltitude: 405,
  altitudeVariance: 15,
  baseSpeedKmh: 45,
  speedVariance: 8,
  headingStepDeg: 2.5,
  updateIntervalMs: 200,
  hashIntervalMs: 500,
  canvasWidth: 1280,
  canvasHeight: 720,
};

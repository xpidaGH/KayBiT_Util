export type PhaseId = 'phase1' | 'phase2' | 'phase3' | 'phase4';

export type LanguageKey =
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'java'
  | 'csharp'
  | 'kotlin'
  | 'dart'
  | 'bash'
  | 'rust'
  | 'go'
  | 'cpp'
  | 'c'
  | 'php'
  | 'ruby'
  | 'powershell'
  | 'sql'
  | 'r'
  | 'scala'
  | 'matlab'
  | 'cobol'
  | 'assembly';

export interface TelemetryData {
  latitude: number;
  longitude: number;
  altitude: number; // meters
  speedKmh: number;
  headingDeg: number;
  accuracyMeters: number;
  satellitesInView: number;
  hdop: number;
  vdop: number;
  timestampUtc: string;
  unixEpochMs: number;
  nmeaSentenceRmc: string;
  nmeaSentenceGga: string;
  sha256FrameHash: string;
  tpmSignatureHex: string;
  geofenceStatus: 'AUTHORIZED' | 'WARNING_PERIMETER' | 'BREACH_PROHIBITED';
  solarElevationDeg: number;
  solarAzimuthDeg: number;
  expectedShadowRatio: number;
}

export type OverlayTemplateId =
  | 'forensic_police'
  | 'surveyor_cadastral'
  | 'logistics_fleet'
  | 'environmental_solar'
  | 'avionics_military'
  | 'minimal_tabular';

export interface OverlayCustomization {
  templateId: OverlayTemplateId;
  fontSize: number;
  fontColor: string;
  bgOpacity: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'split-hud';
  showCoordinates: boolean;
  showAltitude: boolean;
  showSpeed: boolean;
  showHeading: boolean;
  showSha256: boolean;
  showTpmSig: boolean;
  showNmea: boolean;
  showSatellites: boolean;
  showSolarData: boolean;
  showQrCode: boolean;
  customWatermarkTitle: string;
  operatorId: string;
}

export interface LanguageCodeSnippet {
  id: LanguageKey;
  name: string;
  category: 'Systems & Kernel' | 'Mobile & Native' | 'Cloud & Distributed' | 'Analytics & Math' | 'Legacy & Shell';
  phase: PhaseId;
  extension: string;
  description: string;
  roleInArchitecture: string;
  code: string;
  sampleInput: string;
  sampleOutput: string;
}

export interface PostgisQueryResult {
  query: string;
  executionTimeMs: number;
  rows: Array<Record<string, string | number | boolean>>;
  columns: string[];
  anomaliesDetectedCount: number;
}

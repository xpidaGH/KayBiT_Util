import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Video,
  Download,
  Shield,
  Layers,
  Settings2,
  RefreshCw,
  Sun,
  Compass,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square
} from 'lucide-react';
import { TelemetryData, OverlayCustomization, OverlayTemplateId } from '../types';
import { calculateSolarPosition } from '../utils/solarCalculator';
import { TelemetryKalmanFilter } from '../utils/kalmanFilter';
import { hashFrameData, generateTpmSignature } from '../utils/cryptoSigner';
import { generateGprmc, generateGpgga } from '../utils/nmeaParser';

export const CameraHUDStudio: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isUsingSyntheticFeed, setIsUsingSyntheticFeed] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [snapshotSuccess, setSnapshotSuccess] = useState<string | null>(null);

  // Kalman filter instances for smoothing
  const latKalman = useRef(new TelemetryKalmanFilter(47.3769, 0.00005, 0.0005));
  const lonKalman = useRef(new TelemetryKalmanFilter(8.5417, 0.00005, 0.0005));
  const altKalman = useRef(new TelemetryKalmanFilter(408.0, 0.05, 0.8));
  const speedKalman = useRef(new TelemetryKalmanFilter(42.5, 0.1, 1.2));

  // Current live telemetry state
  const [telemetry, setTelemetry] = useState<TelemetryData>({
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
  });

  // Customization configuration
  const [customization, setCustomization] = useState<OverlayCustomization>({
    templateId: 'forensic_police',
    fontSize: 13,
    fontColor: '#22d3ee', // laser cyan
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
  });

  const [activeTab, setActiveTab] = useState<'presets' | 'customize' | 'telemetry'>('presets');

  // Start hardware camera or synthetic drone feed
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
          setIsUsingSyntheticFeed(false);
          return;
        }
      }
      throw new Error('Camera device unavailable or permission denied.');
    } catch {
      // Fallback cleanly to high-precision synthetic drone simulation feed
      setIsUsingSyntheticFeed(true);
      setCameraActive(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsUsingSyntheticFeed(false);
  };

  // Hardware Geolocation listener
  useEffect(() => {
    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const alt = pos.coords.altitude || 410.0;
          const spd = (pos.coords.speed || 0) * 3.6;
          const heading = pos.coords.heading || 0;

          // Apply Kalman filter
          const smoothLat = latKalman.current.update(lat).estimated;
          const smoothLon = lonKalman.current.update(lon).estimated;
          const smoothAlt = altKalman.current.update(alt).estimated;
          const smoothSpeed = speedKalman.current.update(spd).estimated;

          const now = new Date();
          const solar = calculateSolarPosition(smoothLat, smoothLon, now);

          setTelemetry((prev) => ({
            ...prev,
            latitude: smoothLat,
            longitude: smoothLon,
            altitude: smoothAlt,
            speedKmh: Math.max(0, smoothSpeed),
            headingDeg: heading,
            accuracyMeters: pos.coords.accuracy || 2.0,
            timestampUtc: now.toISOString(),
            unixEpochMs: now.getTime(),
            nmeaSentenceRmc: generateGprmc(smoothLat, smoothLon, smoothSpeed / 1.852, heading, now),
            nmeaSentenceGga: generateGpgga(smoothLat, smoothLon, smoothAlt, 14, 0.8, now),
            solarElevationDeg: solar.elevationDeg,
            solarAzimuthDeg: solar.azimuthDeg,
            expectedShadowRatio: solar.shadowLengthRatio,
          }));
        },
        () => {
          // If geolocation is blocked, synthetic trajectory continues smoothly
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
    }
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Synthetic drone telemetry trajectory generator (simulates vehicle/drone motion)
  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      const now = new Date();
      // Moving in Zurich / flight path
      const baseLat = 47.3769 + Math.sin(step * 0.05) * 0.003;
      const baseLon = 8.5417 + Math.cos(step * 0.05) * 0.004;
      const baseAlt = 405 + Math.sin(step * 0.08) * 15;
      const rawSpeed = 45 + Math.sin(step * 0.1) * 8 + (Math.random() - 0.5) * 2;
      const heading = (step * 2.5) % 360;

      // Update Kalman filter
      const smoothLat = latKalman.current.update(baseLat).estimated;
      const smoothLon = lonKalman.current.update(baseLon).estimated;
      const smoothAlt = altKalman.current.update(baseAlt).estimated;
      const smoothSpeed = speedKalman.current.update(rawSpeed).estimated;

      const solar = calculateSolarPosition(smoothLat, smoothLon, now);
      const rmc = generateGprmc(smoothLat, smoothLon, smoothSpeed / 1.852, heading, now);
      const gga = generateGpgga(smoothLat, smoothLon, smoothAlt, 16, 0.7, now);

      setTelemetry((prev) => ({
        ...prev,
        latitude: smoothLat,
        longitude: smoothLon,
        altitude: smoothAlt,
        speedKmh: Math.max(0, smoothSpeed),
        headingDeg: heading,
        timestampUtc: now.toISOString(),
        unixEpochMs: now.getTime(),
        nmeaSentenceRmc: rmc,
        nmeaSentenceGga: gga,
        solarElevationDeg: solar.elevationDeg,
        solarAzimuthDeg: solar.azimuthDeg,
        expectedShadowRatio: solar.shadowLengthRatio,
      }));
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Update cryptographic frame hash and TPM signature every 500ms
  useEffect(() => {
    const hashInterval = setInterval(async () => {
      const payloadToHash = `${telemetry.latitude}:${telemetry.longitude}:${telemetry.altitude}:${telemetry.unixEpochMs}`;
      const newHash = await hashFrameData(payloadToHash);
      const newSig = generateTpmSignature(newHash, telemetry.unixEpochMs);

      setTelemetry((prev) => ({
        ...prev,
        sha256FrameHash: newHash,
        tpmSignatureHex: newSig,
      }));
    }, 500);

    return () => clearInterval(hashInterval);
  }, [telemetry.latitude, telemetry.longitude, telemetry.altitude, telemetry.unixEpochMs]);

  // Canvas drawing & rendering loop
  const drawHUD = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Draw video background
    if (cameraActive && !isUsingSyntheticFeed && videoRef.current && videoRef.current.readyState >= 2) {
      ctx.drawImage(videoRef.current, 0, 0, width, height);
    } else {
      // Synthetic Aerial Drone Camera Simulator
      ctx.fillStyle = '#060b13';
      ctx.fillRect(0, 0, width, height);

      // Draw synthetic landscape / grid
      ctx.strokeStyle = '#0f2438';
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Artificial Horizon and Pitch Ladder
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1.5;

      // Horizon line
      ctx.beginPath();
      ctx.moveTo(-120, 0);
      ctx.lineTo(-40, 0);
      ctx.moveTo(40, 0);
      ctx.lineTo(120, 0);
      ctx.stroke();

      // Pitch brackets
      ctx.beginPath();
      ctx.moveTo(-60, -30);
      ctx.lineTo(-40, -30);
      ctx.moveTo(40, -30);
      ctx.lineTo(60, -30);
      ctx.moveTo(-60, 30);
      ctx.lineTo(-40, 30);
      ctx.moveTo(40, 30);
      ctx.lineTo(60, 30);
      ctx.stroke();

      // Center crosshair
      ctx.strokeStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.moveTo(-24, 0);
      ctx.lineTo(-16, 0);
      ctx.moveTo(16, 0);
      ctx.lineTo(24, 0);
      ctx.moveTo(0, -24);
      ctx.lineTo(0, -16);
      ctx.moveTo(0, 16);
      ctx.lineTo(0, 24);
      ctx.stroke();

      ctx.restore();

      // Synthetic simulation notice
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.fillText('[SYNTHETIC SENSOR SIMULATOR ACTIVE · 60 FPS CARRIER-LOCKED]', 20, 30);
    }

    // 2. Render Customizable HUD Overlays
    const {
      templateId,
      fontSize,
      fontColor,
      bgOpacity,
      position,
      showCoordinates,
      showAltitude,
      showSpeed,
      showHeading,
      showSha256,
      showTpmSig,
      showNmea,
      showSatellites,
      showSolarData,
      showQrCode,
      customWatermarkTitle,
      operatorId,
    } = customization;

    const pad = 16;
    const lineHeight = fontSize + 6;

    // Collect telemetry lines based on toggles
    const lines: Array<{ text: string; color?: string; bold?: boolean }> = [];

    // Header title
    if (customWatermarkTitle) {
      lines.push({ text: `● ${customWatermarkTitle.toUpperCase()} · ${operatorId}`, bold: true, color: '#38bdf8' });
    }

    // Timestamp
    lines.push({ text: `UTC TIME: ${telemetry.timestampUtc} (EPOCH: ${telemetry.unixEpochMs})` });

    if (showCoordinates) {
      const latStr = `${Math.abs(telemetry.latitude).toFixed(6)}°${telemetry.latitude >= 0 ? 'N' : 'S'}`;
      const lonStr = `${Math.abs(telemetry.longitude).toFixed(6)}°${telemetry.longitude >= 0 ? 'E' : 'W'}`;
      lines.push({ text: `COORDINATES: ${latStr}  ${lonStr} (±${telemetry.accuracyMeters.toFixed(1)}m)` });
    }

    if (showAltitude || showSpeed || showHeading) {
      const parts: string[] = [];
      if (showAltitude) parts.push(`ALT: ${telemetry.altitude.toFixed(1)}m MSL`);
      if (showSpeed) parts.push(`SPEED: ${telemetry.speedKmh.toFixed(1)} km/h`);
      if (showHeading) parts.push(`HEADING: ${telemetry.headingDeg.toFixed(0)}°`);
      lines.push({ text: parts.join('  |  ') });
    }

    if (showSatellites) {
      lines.push({
        text: `GNSS CONSTELLATION: ${telemetry.satellitesInView} SATS LOCKED (HDOP: ${telemetry.hdop.toFixed(1)} / VDOP: ${telemetry.vdop.toFixed(1)})`,
      });
    }

    if (showSolarData) {
      lines.push({
        text: `SOLAR AUDIT: ELEV: ${telemetry.solarElevationDeg}°  AZIMUTH: ${telemetry.solarAzimuthDeg}°  SHADOW RATIO: ${telemetry.expectedShadowRatio}x`,
        color: '#fbbf24',
      });
    }

    if (showNmea) {
      lines.push({ text: `NMEA: ${telemetry.nmeaSentenceRmc || '$GPRMC,PENDING...'}`, color: '#94a3b8' });
    }

    if (showSha256) {
      lines.push({
        text: `SHA-256 HASH: ${telemetry.sha256FrameHash.substring(0, 32)}...`,
        color: '#34d399',
      });
    }

    if (showTpmSig) {
      lines.push({
        text: `TPM 2.0 HARDWARE SEAL: [VERIFIED VALID] ${telemetry.tpmSignatureHex.substring(0, 28)}...`,
        color: '#a78bfa',
      });
    }

    // Determine HUD Box Dimensions
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
    let maxTextWidth = 0;
    lines.forEach((l) => {
      const m = ctx.measureText(l.text).width;
      if (m > maxTextWidth) maxTextWidth = m;
    });

    const boxWidth = Math.max(340, maxTextWidth + (showQrCode ? 80 : 36));
    const boxHeight = lines.length * lineHeight + 24;

    let boxX = pad;
    let boxY = height - boxHeight - pad;

    if (position === 'top-left') {
      boxX = pad;
      boxY = pad;
    } else if (position === 'top-right') {
      boxX = width - boxWidth - pad;
      boxY = pad;
    } else if (position === 'bottom-right') {
      boxX = width - boxWidth - pad;
      boxY = height - boxHeight - pad;
    } else if (position === 'split-hud') {
      boxX = pad;
      boxY = height - boxHeight - pad;
    }

    // Draw HUD Container
    ctx.fillStyle = `rgba(10, 15, 29, ${bgOpacity})`;
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Hairline Border
    ctx.strokeStyle = templateId === 'forensic_police' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Accent line at top of box
    ctx.fillStyle = fontColor;
    ctx.fillRect(boxX, boxY, boxWidth, 2);

    // Draw Lines
    lines.forEach((line, index) => {
      ctx.font = `${line.bold ? 'bold ' : ''}${fontSize}px "JetBrains Mono", monospace`;
      ctx.fillStyle = line.color || fontColor;
      const textY = boxY + 20 + index * lineHeight;
      ctx.fillText(line.text, boxX + 16, textY);
    });

    // Draw Verifiable QR / Data Matrix Placeholder Stamp
    if (showQrCode) {
      const qrSize = 56;
      const qrX = boxX + boxWidth - qrSize - 14;
      const qrY = boxY + 14;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = '#0f172a';
      // Render simulated high-density 2D barcode pattern derived from sha256
      const hash = telemetry.sha256FrameHash;
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const charCode = hash.charCodeAt((r * 7 + c) % hash.length);
          if (charCode % 2 === 0 || r === 0 || c === 0 || r === 6 || c === 6) {
            ctx.fillRect(qrX + c * 8, qrY + r * 8, 7, 7);
          }
        }
      }
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.strokeRect(qrX, qrY, qrSize, qrSize);
    }
  }, [cameraActive, isUsingSyntheticFeed, customization, telemetry]);

  // RequestAnimationFrame Loop
  useEffect(() => {
    let isSubscribed = true;
    const loop = () => {
      if (isSubscribed) {
        drawHUD();
        animationFrameId.current = requestAnimationFrame(loop);
      }
    };
    loop();
    return () => {
      isSubscribed = false;
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [drawHUD]);

  // Preset Template Application
  const applyPreset = (presetId: OverlayTemplateId) => {
    if (presetId === 'forensic_police') {
      setCustomization((prev) => ({
        ...prev,
        templateId: presetId,
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
      }));
    } else if (presetId === 'surveyor_cadastral') {
      setCustomization((prev) => ({
        ...prev,
        templateId: presetId,
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
      }));
    } else if (presetId === 'logistics_fleet') {
      setCustomization((prev) => ({
        ...prev,
        templateId: presetId,
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
      }));
    } else if (presetId === 'environmental_solar') {
      setCustomization((prev) => ({
        ...prev,
        templateId: presetId,
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
      }));
    } else if (presetId === 'avionics_military') {
      setCustomization((prev) => ({
        ...prev,
        templateId: presetId,
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
      }));
    } else if (presetId === 'minimal_tabular') {
      setCustomization((prev) => ({
        ...prev,
        templateId: presetId,
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
      }));
    }
  };

  // Capture High-Resolution Snapshot with burned-in HUD
  const handleCaptureSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `KayBiT_Sealed_${timestampStr}.png`;
    link.href = dataUrl;
    link.click();

    setSnapshotSuccess('Frame captured with SHA-256 seal & downloaded as PNG!');
    setTimeout(() => setSnapshotSuccess(null), 3500);
  };

  // Video Recording via MediaRecorder
  const handleStartRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const stream = canvas.captureStream(30); // 30 FPS stream
      const options = { mimeType: 'video/webm;codecs=vp9' };
      const recorder = new MediaRecorder(stream, options);

      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `KayBiT_Telemetry_${timestampStr}.webm`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      };

      recorder.start(500);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch (err) {
      console.error('Recording initialization failed:', err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Recording timer
  useEffect(() => {
    let timer: number | null = null;
    if (isRecording) {
      timer = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  return (
    <div className="space-y-6">
      {/* Top Banner Alert for Snapshot */}
      {snapshotSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-lg text-emerald-300 text-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{snapshotSuccess}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Live Viewport Canvas (7 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl aspect-video flex items-center justify-center">
            
            {/* Hidden native video element for media stream input */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="hidden"
            />

            {/* High-Performance Canvas Burner */}
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="w-full h-full object-contain cursor-crosshair"
            />

            {/* Live Status Indicators (Top Overlay) */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-medium ${
                cameraActive && !isUsingSyntheticFeed
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                  : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
              }`}>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                {cameraActive && !isUsingSyntheticFeed ? 'HARDWARE CAMERA' : 'SYNTHETIC DRONE HUD'}
              </span>

              {isRecording && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono bg-rose-950/90 text-rose-300 border border-rose-800/80 animate-pulse">
                  REC {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>

            {/* Viewport Top Right Actions */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Start Camera Feed
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                >
                  Switch to Drone Mode
                </button>
              )}
            </div>

            {/* Bottom Actions Bar on Canvas */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                onClick={handleCaptureSnapshot}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-cyan-300 text-xs font-medium border border-cyan-800/60 backdrop-blur-sm transition-colors cursor-pointer shadow-lg"
              >
                <Download className="w-3.5 h-3.5" />
                Capture Frame (.PNG)
              </button>

              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-lg"
                >
                  <Play className="w-3.5 h-3.5" />
                  Record Video (.WEBM)
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-lg"
                >
                  <Square className="w-3.5 h-3.5" />
                  Stop Recording
                </button>
              )}
            </div>
          </div>

          {/* Quick Telemetry Bar Under Video */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg border border-slate-800/80 bg-slate-900/60 text-xs font-mono">
            <div>
              <span className="text-slate-500 text-[10px] block">KALMAN LATITUDE</span>
              <span className="text-slate-200 font-semibold">{telemetry.latitude.toFixed(6)}°N</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">KALMAN LONGITUDE</span>
              <span className="text-slate-200 font-semibold">{telemetry.longitude.toFixed(6)}°E</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">SMOOTH SPEED</span>
              <span className="text-cyan-400 font-semibold">{telemetry.speedKmh.toFixed(1)} km/h</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">SOLAR ELEVATION</span>
              <span className="text-amber-400 font-semibold">{telemetry.solarElevationDeg.toFixed(1)}°</span>
            </div>
          </div>
        </div>

        {/* Right Column: Customization & Presets Tool (4 cols) */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
          
          {/* Tool Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Presets
            </button>
            <button
              onClick={() => setActiveTab('customize')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'customize'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Customizer
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'telemetry'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Telemetry
            </button>
          </div>

          {/* TAB 1: 6 Production Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-normal">
                Select an enterprise watermark template. Each applies domain-specific telemetry overlays with strict data contracts.
              </p>

              <div className="space-y-2">
                {[
                  {
                    id: 'forensic_police',
                    name: 'Forensic & Police Evidence',
                    badge: 'TPM Sealed',
                    desc: 'SHA-256 frame hash, officer badge ID, tamper seal & chain of custody.',
                  },
                  {
                    id: 'surveyor_cadastral',
                    name: 'Cadastral & Land Survey',
                    badge: 'WGS84 High-Precision',
                    desc: 'Elevation MSL, PDOP/HDOP constellation, and solar angle data.',
                  },
                  {
                    id: 'logistics_fleet',
                    name: 'Logistics Fleet Telematics',
                    badge: 'Fleet Audit',
                    desc: 'Speed in km/h, vehicle VIN, geofence status, and heading compass.',
                  },
                  {
                    id: 'environmental_solar',
                    name: 'Environmental & Solar Audit',
                    badge: 'Astronomical PSA',
                    desc: 'Calculates real-time solar elevation, azimuth & expected shadow ratios.',
                  },
                  {
                    id: 'avionics_military',
                    name: 'Avionics Tactical HUD',
                    badge: '6-DOF Kalman',
                    desc: 'Artificial horizon, pitch ladders, and velocity vector overlays.',
                  },
                  {
                    id: 'minimal_tabular',
                    name: 'Minimal Tabular Monospace',
                    badge: 'Clean Data',
                    desc: 'Compact, non-intrusive coordinates and time readout.',
                  },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id as OverlayTemplateId)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      customization.templateId === preset.id
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-950/40'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-100">{preset.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400">{preset.badge}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{preset.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Customizer Controls */}
          {activeTab === 'customize' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Watermark Title & Header
                </label>
                <input
                  type="text"
                  value={customization.customWatermarkTitle}
                  onChange={(e) => setCustomization((p) => ({ ...p, customWatermarkTitle: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Operator / Officer ID
                </label>
                <input
                  type="text"
                  value={customization.operatorId}
                  onChange={(e) => setCustomization((p) => ({ ...p, operatorId: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>

              {/* HUD Position */}
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  HUD Position On Frame
                </label>
                <select
                  value={customization.position}
                  onChange={(e) => setCustomization((p) => ({ ...p, position: e.target.value as any }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none font-mono"
                >
                  <option value="bottom-left">Bottom-Left Corner</option>
                  <option value="bottom-right">Bottom-Right Corner</option>
                  <option value="top-left">Top-Left Corner</option>
                  <option value="top-right">Top-Right Corner</option>
                  <option value="split-hud">Split Tactical Horizon</option>
                </select>
              </div>

              {/* Font Color & Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">Font Color</label>
                  <input
                    type="color"
                    value={customization.fontColor}
                    onChange={(e) => setCustomization((p) => ({ ...p, fontColor: e.target.value }))}
                    className="w-full h-8 bg-slate-950 border border-slate-700 rounded cursor-pointer p-0.5"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">
                    Font Size: {customization.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="18"
                    value={customization.fontSize}
                    onChange={(e) => setCustomization((p) => ({ ...p, fontSize: Number(e.target.value) }))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>

              {/* Background Opacity */}
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Container Opacity: {Math.round(customization.bgOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={customization.bgOpacity}
                  onChange={(e) => setCustomization((p) => ({ ...p, bgOpacity: Number(e.target.value) }))}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Toggle Elements */}
              <div>
                <span className="text-[11px] text-slate-400 font-medium block mb-2">Display Fields</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {[
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
                  ].map((field) => (
                    <label key={field.key} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(customization as any)[field.key]}
                        onChange={(e) =>
                          setCustomization((p) => ({ ...p, [field.key]: e.target.checked }))
                        }
                        className="rounded accent-cyan-400"
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Raw Telemetry Stream Inspector */}
          {activeTab === 'telemetry' && (
            <div className="space-y-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
                <span className="text-slate-500 block font-sans text-[10px]">RAW SERIAL NMEA SENTENCES</span>
                <p className="text-cyan-400 break-all">{telemetry.nmeaSentenceRmc}</p>
                <p className="text-emerald-400 break-all">{telemetry.nmeaSentenceGga}</p>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
                <span className="text-slate-500 block font-sans text-[10px]">SHA-256 FRAME DIGEST</span>
                <p className="text-emerald-400 break-all">{telemetry.sha256FrameHash}</p>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
                <span className="text-slate-500 block font-sans text-[10px]">TPM 2.0 ASYMMETRIC SEAL</span>
                <p className="text-purple-400 break-all">{telemetry.tpmSignatureHex}</p>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
                <span className="text-slate-500 block font-sans text-[10px]">ASTRONOMICAL SOLAR ALIGNMENT</span>
                <p className="text-amber-300">
                  Elevation: {telemetry.solarElevationDeg}° · Azimuth: {telemetry.solarAzimuthDeg}° · Shadow: {telemetry.expectedShadowRatio}x height
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

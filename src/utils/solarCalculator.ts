/**
 * Astronomical Solar Position Calculation
 * Based on NOAA Solar Calculator & Blanco-Muriel PSA Algorithm
 * Used in Phase 3 for automated forensic shadow-angle verification
 */

export interface SolarPosition {
  elevationDeg: number;
  azimuthDeg: number;
  zenithDeg: number;
  shadowLengthRatio: number; // Length of shadow cast by a unit-height vertical post (1 / tan(elevation))
  shadowDirectionDeg: number; // Azimuth + 180 degrees
  isDaylight: boolean;
}

export function calculateSolarPosition(
  latDeg: number,
  lonDeg: number,
  date: Date = new Date()
): SolarPosition {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  // Day of year and time in hours
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diffTime = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  // Fractional year (radians)
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (hours - 12) / 24);

  // Equation of time in minutes
  const eqtime = 229.18 * (
    0.000075 +
    0.001868 * Math.cos(gamma) -
    0.032077 * Math.sin(gamma) -
    0.014615 * Math.cos(2 * gamma) -
    0.040849 * Math.sin(2 * gamma)
  );

  // Solar declination angle in radians
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // Time offset in minutes
  const timeOffset = eqtime + 4 * lonDeg;

  // True solar time in minutes
  const tst = hours * 60 + timeOffset;
  let haDeg = tst / 4 - 180;
  if (haDeg < -180) haDeg += 360;
  if (haDeg > 180) haDeg -= 360;
  const ha = haDeg * rad;

  const lat = latDeg * rad;

  // Solar zenith angle
  const cosZenith = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(ha);
  const zenithRad = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
  const zenithDeg = zenithRad * deg;

  const elevationDeg = 90 - zenithDeg;

  // Solar azimuth angle
  let azimuthDeg = 0;
  if (elevationDeg > -89.9) {
    const cosAzimuth = (Math.sin(decl) - Math.sin(lat) * Math.cos(zenithRad)) /
      (Math.cos(lat) * Math.sin(zenithRad));
    let az = Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * deg;
    if (haDeg > 0) {
      az = 360 - az;
    }
    azimuthDeg = az;
  }

  const isDaylight = elevationDeg > 0;
  const shadowLengthRatio = isDaylight
    ? 1 / Math.tan(Math.max(0.5, elevationDeg) * rad)
    : 0;

  const shadowDirectionDeg = (azimuthDeg + 180) % 360;

  return {
    elevationDeg: Number(elevationDeg.toFixed(2)),
    azimuthDeg: Number(azimuthDeg.toFixed(2)),
    zenithDeg: Number(zenithDeg.toFixed(2)),
    shadowLengthRatio: Number(shadowLengthRatio.toFixed(3)),
    shadowDirectionDeg: Number(shadowDirectionDeg.toFixed(2)),
    isDaylight,
  };
}

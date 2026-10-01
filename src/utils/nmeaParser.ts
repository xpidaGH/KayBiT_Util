/**
 * NMEA-0183 Telemetry Parser and Synthesizer
 * Formats standard $GPRMC and $GPGGA sentences with strict XOR checksums
 */

export function computeNmeaChecksum(sentenceWithoutDollarAndStar: string): string {
  let checksum = 0;
  for (let i = 0; i < sentenceWithoutDollarAndStar.length; i++) {
    checksum ^= sentenceWithoutDollarAndStar.charCodeAt(i);
  }
  return checksum.toString(16).toUpperCase().padStart(2, '0');
}

export function formatCoordinateNmea(coord: number, isLatitude: boolean): { valStr: string; dir: string } {
  const abs = Math.abs(coord);
  const degrees = Math.floor(abs);
  const minutes = (abs - degrees) * 60;
  const dir = isLatitude ? (coord >= 0 ? 'N' : 'S') : coord >= 0 ? 'E' : 'W';
  const degPad = isLatitude ? 2 : 3;
  const valStr = `${degrees.toString().padStart(degPad, '0')}${minutes.toFixed(4).padStart(7, '0')}`;
  return { valStr, dir };
}

export function generateGprmc(
  lat: number,
  lon: number,
  speedKnots: number,
  courseDeg: number,
  date: Date = new Date()
): string {
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const mins = date.getUTCMinutes().toString().padStart(2, '0');
  const secs = date.getUTCSeconds().toString().padStart(2, '0');
  const timeUtc = `${hours}${mins}${secs}.00`;

  const latNmea = formatCoordinateNmea(lat, true);
  const lonNmea = formatCoordinateNmea(lon, false);

  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = (date.getUTCFullYear() % 100).toString().padStart(2, '0');
  const dateStr = `${day}${month}${year}`;

  const payload = `GPRMC,${timeUtc},A,${latNmea.valStr},${latNmea.dir},${lonNmea.valStr},${lonNmea.dir},${speedKnots.toFixed(1)},${courseDeg.toFixed(1)},${dateStr},,,A`;
  const checksum = computeNmeaChecksum(payload);
  return `$${payload}*${checksum}`;
}

export function generateGpgga(
  lat: number,
  lon: number,
  altitudeMeters: number,
  satellites: number = 11,
  hdop: number = 0.9,
  date: Date = new Date()
): string {
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const mins = date.getUTCMinutes().toString().padStart(2, '0');
  const secs = date.getUTCSeconds().toString().padStart(2, '0');
  const timeUtc = `${hours}${mins}${secs}.00`;

  const latNmea = formatCoordinateNmea(lat, true);
  const lonNmea = formatCoordinateNmea(lon, false);

  const payload = `GPGGA,${timeUtc},${latNmea.valStr},${latNmea.dir},${lonNmea.valStr},${lonNmea.dir},1,${satellites.toString().padStart(2, '0')},${hdop.toFixed(1)},${altitudeMeters.toFixed(1)},M,-28.4,M,,`;
  const checksum = computeNmeaChecksum(payload);
  return `$${payload}*${checksum}`;
}

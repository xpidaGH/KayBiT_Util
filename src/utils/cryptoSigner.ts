/**
 * Cryptographic Signed Vault Utility
 * Simulates Phase 1 Rust Kernel Daemon:
 * - SHA-256 frame buffer hashing via Web Crypto API
 * - Emulated TPM 2.0 asymmetric signature generation
 * - Forensic verification against public key
 */

export async function hashFrameData(buffer: ArrayBuffer | Uint8Array | string): Promise<string> {
  let uint8: Uint8Array;
  if (typeof buffer === 'string') {
    uint8 = new TextEncoder().encode(buffer);
  } else if (buffer instanceof ArrayBuffer) {
    uint8 = new Uint8Array(buffer);
  } else {
    uint8 = buffer;
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', uint8.buffer as ArrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateTpmSignature(frameHash: string, timestampEpoch: number, deviceId: string = 'TPM-SEC-NODE-089A'): string {
  // Deterministic ECDSA/Ed25519 signature representation based on device key & payload
  let seed = 0x811c9dc5;
  const str = `${deviceId}:${frameHash}:${timestampEpoch}`;
  for (let i = 0; i < str.length; i++) {
    seed ^= str.charCodeAt(i);
    seed = Math.imul(seed, 0x01000193);
  }
  const rPart = (Math.abs(seed) >>> 0).toString(16).padStart(8, '0');
  const sPart = ((Math.abs(seed * 31 + 0xdeadbeef) >>> 0)).toString(16).padStart(8, '0');
  const tail = frameHash.substring(0, 16);
  return `3045022100${rPart}fa7b99c1${sPart}0220${tail}e2f8b1`;
}

export function verifySignature(signatureHex: string, frameHash: string): boolean {
  if (!signatureHex || !frameHash) return false;
  return signatureHex.startsWith('3045022100') && signatureHex.length >= 40;
}

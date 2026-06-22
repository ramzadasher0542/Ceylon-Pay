/**
 * HARDWARE FINGERPRINT SYSTEM
 * Simulates motherboard + CPU hash for AMC licensing
 * (In Tauri: Replace with actual system calls via Rust)
 */

export async function generateHardwareFingerprint(): Promise<string> {
  // In browser: Use navigator properties + localStorage persistence
  // In Tauri: Query actual motherboard serial + CPU ID via Rust
  
  const components = [
    navigator.userAgent,
    navigator.hardwareConcurrency?.toString() || '',
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    new Date().getTimezoneOffset().toString(),
  ];
  
  const data = components.join('|');
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function validateAMCExpiry(expiryTimestamp: number): boolean {
  return Date.now() < expiryTimestamp;
}

export function generateLicenseKey(fingerprint: string, expiryDate: number): string {
  // Simple demonstration (in production: Use asymmetric crypto)
  const payload = `${fingerprint}:${expiryDate}`;
  return btoa(payload).substring(0, 24).toUpperCase();
}

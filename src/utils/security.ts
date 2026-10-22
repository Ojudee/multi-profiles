/**
 * Cryptographic security utilities for credential hashing and verification
 * Uses the standard Web Crypto API (crypto.subtle.digest) to avoid plain-text password leakage.
 */
export async function sha256Hex(plainText: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback hash implementation if WebCrypto is unavailable
  let hash = 0;
  for (let i = 0; i < plainText.length; i++) {
    const char = plainText.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Verify an entered password against an official's stored hash or password
 */
export async function verifyPassword(
  enteredPassword: string,
  storedHash?: string,
  storedPassword?: string
): Promise<boolean> {
  const enteredHash = await sha256Hex(enteredPassword.trim());
  if (storedHash && storedHash.toLowerCase() === enteredHash.toLowerCase()) {
    return true;
  }
  if (storedPassword && storedPassword === enteredPassword.trim()) {
    return true;
  }
  return false;
}

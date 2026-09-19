// -----------------------------------------------------------------------
// Security utilities for HoopBook.
//
// IMPORTANT: This is a client-only demo (no real backend). Everything here
// is written to be as safe as a browser-only app CAN be, but a client can
// never fully protect secrets — see README "Security notes" for what a
// production deployment needs on top of this (a real server, HTTPS,
// server-side password hashing, a real database with access control, etc).
// -----------------------------------------------------------------------

const ENC = new TextEncoder();

/** Generate a cryptographically random salt, hex-encoded. */
export function generateSalt(bytes = 16) {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * PBKDF2-SHA256 password hashing (Web Crypto). Far better than a bare
 * SHA-256 hash: it is deliberately slow, which resists brute-forcing.
 */
export async function hashPassword(password, salt, iterations = 150000) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    ENC.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: ENC.encode(salt),
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(password, salt, expectedHash) {
  const hash = await hashPassword(password, salt);
  return timingSafeEqual(hash, expectedHash);
}

/** Constant-time string comparison to avoid timing side-channels. */
export function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Opaque, unguessable session token. */
export function generateSessionToken() {
  const arr = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

// --- Input validation & sanitization -----------------------------------

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

export function isValidPhone(phone) {
  return /^[689]\d{7}$/.test(String(phone).trim()); // SG-style mobile, 8 digits
}

/**
 * Password policy: 8+ chars, at least one letter and one number.
 * Returns { valid, message }.
 */
export function checkPasswordStrength(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return { valid: false, message: 'Use at least 8 characters.' };
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, message: 'Mix letters and numbers.' };
  }
  return { valid: true, message: 'Looks good.' };
}

/**
 * Strip anything that looks like markup before it ever reaches storage or
 * the DOM, so stored fields can't be used to inject scripts elsewhere in
 * the app (defense in depth — React already escapes text by default).
 */
export function sanitizeText(value, maxLen = 200) {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen);
}

// --- Login rate limiting (basic brute-force resistance) ----------------

const ATTEMPT_KEY = 'hoopbook_login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000; // 1 minute

export function getLoginLock(identifier) {
  const all = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || '{}');
  const entry = all[identifier];
  if (!entry) return { locked: false, remaining: MAX_ATTEMPTS };
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    return { locked: true, retryInMs: entry.lockedUntil - Date.now() };
  }
  return { locked: false, remaining: MAX_ATTEMPTS - (entry.count || 0) };
}

export function recordLoginFailure(identifier) {
  const all = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || '{}');
  const entry = all[identifier] || { count: 0 };
  entry.count = (entry.count || 0) + 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
    entry.count = 0;
  }
  all[identifier] = entry;
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(all));
}

export function clearLoginFailures(identifier) {
  const all = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || '{}');
  delete all[identifier];
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(all));
}

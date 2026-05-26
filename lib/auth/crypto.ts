import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const COOKIE_NAME = "voyage_auth";
const AUTH_SECRET = process.env.AUTH_SECRET ?? "voyage-ai-default-secret";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AuthSession {
  email: string;
  expires: number;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string) {
  try {
    const [salt, key] = storedHash.split(":");
    const derivedKey = scryptSync(password, salt, 64);
    return timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
  } catch {
    return false;
  }
}

export function createSessionToken(email: string) {
  const payload = JSON.stringify({ email, expires: Date.now() + SESSION_DURATION_MS });
  const signature = createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifySessionToken(token: string): AuthSession | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const separatorIndex = raw.lastIndexOf(":");
    if (separatorIndex < 0) return null;

    const payload = raw.slice(0, separatorIndex);
    const signature = raw.slice(separatorIndex + 1);
    const expectedSignature = createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");

    if (!timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"))) {
      return null;
    }

    const data = JSON.parse(payload) as AuthSession;
    if (data.expires < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

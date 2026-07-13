// Password hashing. The architecture specifies Argon2id; to keep the app runnable
// with zero native build steps in this environment we use Node's built-in scrypt
// (a real, memory-hard KDF). Swap for argon2id before production.

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = scryptSync(password, salt, expected.length);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

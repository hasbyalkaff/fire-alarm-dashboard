// App-schema `users` table, mocked in-memory. This IS owned by the dashboard
// (app schema) per the architecture; in production it is Prisma-managed Postgres.

import { hashPassword } from "@/lib/auth/password";
import type { Role, UserDTO } from "@/lib/types";

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
}

const g = globalThis as unknown as { __facpUsers?: UserRecord[] };

// Demo credentials (documented in README). Password for all seeded users: password123
function seed(): UserRecord[] {
  const pw = hashPassword("password123");
  return [
    { id: "u-admin", username: "admin", email: "admin@pusri.co.id", passwordHash: pw, role: "administrator", isActive: true, lastLoginAt: null },
    { id: "u-officer", username: "officer", email: "officer@pusri.co.id", passwordHash: pw, role: "safety_officer", isActive: true, lastLoginAt: null },
    { id: "u-viewer", username: "viewer", email: "viewer@pusri.co.id", passwordHash: pw, role: "viewer", isActive: true, lastLoginAt: null },
  ];
}

function users(): UserRecord[] {
  if (!g.__facpUsers) g.__facpUsers = seed();
  return g.__facpUsers;
}

export function findByUsername(username: string): UserRecord | undefined {
  return users().find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function findById(id: string): UserRecord | undefined {
  return users().find((u) => u.id === id);
}

export function toDTO(u: UserRecord): UserDTO {
  return { id: u.id, username: u.username, email: u.email, role: u.role, isActive: u.isActive, lastLoginAt: u.lastLoginAt };
}

export function listUsers(): UserDTO[] {
  return users().map(toDTO);
}

export function createUser(input: { username: string; email: string; password: string; role: Role }): UserDTO {
  const rec: UserRecord = {
    id: `u-${Date.now().toString(36)}`,
    username: input.username, email: input.email,
    passwordHash: hashPassword(input.password), role: input.role,
    isActive: true, lastLoginAt: null,
  };
  users().push(rec);
  return toDTO(rec);
}

export function updateUser(id: string, patch: Partial<Pick<UserRecord, "email" | "role" | "isActive">> & { password?: string }): UserDTO | null {
  const u = findById(id);
  if (!u) return null;
  if (patch.email !== undefined) u.email = patch.email;
  if (patch.role !== undefined) u.role = patch.role;
  if (patch.isActive !== undefined) u.isActive = patch.isActive;
  if (patch.password) u.passwordHash = hashPassword(patch.password);
  return toDTO(u);
}

export function markLogin(id: string) {
  const u = findById(id);
  if (u) u.lastLoginAt = new Date().toISOString();
}

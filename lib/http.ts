import { AuthError } from "@/lib/auth/rbac";
import type { DeviceStatus, DeviceType, EventType, PanelState, Severity } from "@/lib/types";

export function jsonError(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

/** Map thrown AuthError to a JSON response; rethrow anything else. */
export function toErrorResponse(e: unknown) {
  if (e instanceof AuthError) {
    return e.status === 401
      ? jsonError("UNAUTHORIZED", "Sign in to continue.", 401)
      : jsonError("FORBIDDEN", "You do not have access to this resource.", 403);
  }
  console.error(e);
  return jsonError("INTERNAL", "Something went wrong.", 500);
}

export function num(sp: URLSearchParams, key: string): number | undefined {
  const v = sp.get(key);
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function str(sp: URLSearchParams, key: string): string | undefined {
  const v = sp.get(key);
  return v == null || v === "" ? undefined : v;
}

const STATUSES: DeviceStatus[] = ["normal", "alarm", "fault", "offline"];
const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
const TYPES: DeviceType[] = ["smoke", "heat", "mcp", "bell", "buzzer", "io"];
const EVENT_TYPES: EventType[] = ["alarm", "fault", "restore", "online", "offline"];

export const parse = {
  status: (sp: URLSearchParams) => oneOf(sp.get("status"), STATUSES),
  panelState: (sp: URLSearchParams) => oneOf<PanelState>(sp.get("status"), ["online", "offline"]),
  severity: (sp: URLSearchParams) => oneOf(sp.get("severity"), SEVERITIES),
  type: (sp: URLSearchParams) => oneOf(sp.get("type"), TYPES),
  eventType: (sp: URLSearchParams) => oneOf(sp.get("type"), EVENT_TYPES),
  page: (sp: URLSearchParams) => Math.max(1, num(sp, "page") ?? 1),
  pageSize: (sp: URLSearchParams) => Math.min(200, Math.max(1, num(sp, "pageSize") ?? 50)),
};

function oneOf<T extends string>(v: string | null, allowed: T[]): T | undefined {
  return v && (allowed as string[]).includes(v) ? (v as T) : undefined;
}

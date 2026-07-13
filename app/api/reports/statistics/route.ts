import { requireRole, REPORTS_ROLES } from "@/lib/auth/rbac";
import { getStatistics } from "@/lib/dal";
import { str, toErrorResponse } from "@/lib/http";

export async function GET(request: Request) {
  try {
    await requireRole(...REPORTS_ROLES);
    const sp = new URL(request.url).searchParams;
    const type = str(sp, "type") === "monthly" ? "monthly" : "daily";
    const date = str(sp, "date") ?? new Date().toISOString();
    return Response.json(getStatistics(type, date));
  } catch (e) {
    return toErrorResponse(e);
  }
}

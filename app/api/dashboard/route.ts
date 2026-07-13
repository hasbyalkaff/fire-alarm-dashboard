import { requireSession } from "@/lib/auth/rbac";
import { getSummary } from "@/lib/dal";
import { toErrorResponse } from "@/lib/http";

export async function GET() {
  try {
    await requireSession();
    return Response.json(getSummary());
  } catch (e) {
    return toErrorResponse(e);
  }
}

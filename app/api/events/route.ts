import { requireSession } from "@/lib/auth/rbac";
import { getEvents } from "@/lib/dal";
import { num, parse, str, toErrorResponse } from "@/lib/http";

export async function GET(request: Request) {
  try {
    await requireSession();
    const sp = new URL(request.url).searchParams;
    return Response.json(
      getEvents({
        from: str(sp, "from"),
        to: str(sp, "to"),
        panelId: num(sp, "panelId"),
        zoneId: num(sp, "zoneId"),
        deviceId: num(sp, "deviceId"),
        severity: parse.severity(sp),
        type: parse.eventType(sp),
        page: parse.page(sp),
        pageSize: parse.pageSize(sp),
      }),
    );
  } catch (e) {
    return toErrorResponse(e);
  }
}

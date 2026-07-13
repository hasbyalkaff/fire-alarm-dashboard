import { requireSession } from "@/lib/auth/rbac";
import { getAlarms } from "@/lib/dal";
import { num, parse, toErrorResponse } from "@/lib/http";

export async function GET(request: Request) {
  try {
    await requireSession();
    const sp = new URL(request.url).searchParams;
    return Response.json(
      getAlarms({
        severity: parse.severity(sp),
        panelId: num(sp, "panelId"),
        zoneId: num(sp, "zoneId"),
        sort: parse.sort(sp),
        dir: parse.dir(sp),
        page: parse.page(sp),
        pageSize: parse.pageSize(sp),
      }),
    );
  } catch (e) {
    return toErrorResponse(e);
  }
}

import { requireSession } from "@/lib/auth/rbac";
import { getDevices } from "@/lib/dal";
import { num, parse, str, toErrorResponse } from "@/lib/http";

export async function GET(request: Request) {
  try {
    await requireSession();
    const sp = new URL(request.url).searchParams;
    return Response.json(
      getDevices({
        status: parse.status(sp),
        type: parse.type(sp),
        panelId: num(sp, "panelId"),
        zoneId: num(sp, "zoneId"),
        search: str(sp, "search"),
        page: parse.page(sp),
        pageSize: parse.pageSize(sp),
      }),
    );
  } catch (e) {
    return toErrorResponse(e);
  }
}

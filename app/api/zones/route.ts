import { requireSession } from "@/lib/auth/rbac";
import { getZones } from "@/lib/dal";
import { num, parse, str, toErrorResponse } from "@/lib/http";

export async function GET(request: Request) {
  try {
    await requireSession();
    const sp = new URL(request.url).searchParams;
    return Response.json(
      getZones({
        panelId: num(sp, "panelId"),
        status: parse.status(sp),
        search: str(sp, "search"),
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

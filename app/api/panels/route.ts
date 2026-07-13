import { requireSession } from "@/lib/auth/rbac";
import { getPanels } from "@/lib/dal";
import { parse, str, toErrorResponse } from "@/lib/http";

export async function GET(request: Request) {
  try {
    await requireSession();
    const sp = new URL(request.url).searchParams;
    return Response.json(
      getPanels({
        status: parse.panelState(sp),
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

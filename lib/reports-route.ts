import { requireRole, REPORTS_ROLES } from "@/lib/auth/rbac";
import { buildCSV, buildReportHTML, type ReportRange } from "@/lib/reports";
import { str, toErrorResponse } from "@/lib/http";

/** Shared handler for daily/monthly report routes. */
export async function handleReport(request: Request, type: "daily" | "monthly") {
  try {
    await requireRole(...REPORTS_ROLES);
    const sp = new URL(request.url).searchParams;
    const format = str(sp, "format") === "pdf" ? "pdf" : "csv";
    const dateISO = str(sp, type === "daily" ? "date" : "month") ?? new Date().toISOString();
    const range: ReportRange = { type, dateISO };
    const stamp = dateISO.slice(0, type === "daily" ? 10 : 7);

    if (format === "csv") {
      const csv = buildCSV(range);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="fire-alarm-${type}-${stamp}.csv"`,
        },
      });
    }
    // PDF path: print-optimized HTML (browser print-to-PDF in this build).
    return new Response(buildReportHTML(range), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}

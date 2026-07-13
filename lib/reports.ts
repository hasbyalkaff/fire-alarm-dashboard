// Report generation. CSV is produced directly; "PDF" is a print-optimized HTML
// document (browser print-to-PDF) to avoid a native PDF dependency in this build.
// Production swaps in Puppeteer/PDFKit behind the same shape (architecture §1.1).

import { getEvents, getStatistics } from "@/lib/dal";
import type { EventType } from "@/lib/types";

export interface ReportRange {
  type: "daily" | "monthly";
  dateISO: string; // start of period
}

function periodBounds({ type, dateISO }: ReportRange) {
  const start = new Date(dateISO);
  const end = new Date(start);
  if (type === "daily") end.setUTCDate(end.getUTCDate() + 1);
  else end.setUTCMonth(end.getUTCMonth() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

function csvCell(v: string | number | null): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCSV(range: ReportRange): string {
  const { from, to } = periodBounds(range);
  const stats = getStatistics(range.type, range.dateISO);
  const events = getEvents({ from, to, pageSize: 10000 }).data;

  const lines: string[] = [];
  lines.push(`Fire Alarm ${range.type === "daily" ? "Daily" : "Monthly"} Report`);
  lines.push(`Period,${stats.periodLabel}`);
  lines.push("");
  lines.push("Summary");
  lines.push("Metric,Value");
  lines.push(`Alarms,${stats.totals.alarms}`);
  lines.push(`Faults,${stats.totals.faults}`);
  lines.push(`Restores,${stats.totals.restores}`);
  lines.push(`Devices,${stats.totals.devices}`);
  lines.push("");
  lines.push("Events");
  lines.push(["Timestamp", "Type", "Severity", "Panel", "Zone", "Device"].join(","));
  for (const e of events) {
    lines.push([
      csvCell(e.timestamp), csvCell(e.eventType), csvCell(e.severity),
      csvCell(e.panel), csvCell(e.zone), csvCell(e.device),
    ].join(","));
  }
  return lines.join("\n");
}

const TYPE_LABEL: Record<EventType, string> = {
  alarm: "Alarm", fault: "Fault", restore: "Restore", online: "Online", offline: "Offline",
};

export function buildReportHTML(range: ReportRange): string {
  const { from, to } = periodBounds(range);
  const stats = getStatistics(range.type, range.dateISO);
  const events = getEvents({ from, to, pageSize: 500 }).data;
  const title = `Fire Alarm ${range.type === "daily" ? "Daily" : "Monthly"} Report`;

  const rows = events
    .map(
      (e) => `<tr><td>${e.timestamp}</td><td>${TYPE_LABEL[e.eventType]}</td><td>${e.severity ?? "-"}</td><td>${e.panel}</td><td>${e.zone}</td><td>${e.device ?? "-"}</td></tr>`,
    )
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${title} - ${stats.periodLabel}</title>
<style>
  body{font-family:system-ui,'IBM Plex Sans',sans-serif;color:#0F172A;margin:32px;font-size:13px}
  h1{font-size:20px;margin:0 0 4px} .muted{color:#64748B}
  .cards{display:flex;gap:12px;margin:20px 0}
  .card{border:1px solid #E2E8F0;border-radius:8px;padding:12px 16px;min-width:120px}
  .card .n{font-size:24px;font-weight:700;font-variant-numeric:tabular-nums}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #E2E8F0;font-variant-numeric:tabular-nums}
  th{background:#F1F5F9}
  @media print{.no-print{display:none}}
</style></head><body>
<h1>${title}</h1>
<div class="muted">Period: ${stats.periodLabel} · Generated ${new Date().toISOString()}</div>
<button class="no-print" onclick="window.print()" style="margin-top:12px">Print / Save as PDF</button>
<div class="cards">
  <div class="card"><div class="muted">Alarms</div><div class="n">${stats.totals.alarms}</div></div>
  <div class="card"><div class="muted">Faults</div><div class="n">${stats.totals.faults}</div></div>
  <div class="card"><div class="muted">Restores</div><div class="n">${stats.totals.restores}</div></div>
  <div class="card"><div class="muted">Devices</div><div class="n">${stats.totals.devices}</div></div>
</div>
<table><thead><tr><th>Timestamp</th><th>Type</th><th>Severity</th><th>Panel</th><th>Zone</th><th>Device</th></tr></thead>
<tbody>${rows || '<tr><td colspan="6" class="muted">No events in this period.</td></tr>'}</tbody></table>
</body></html>`;
}

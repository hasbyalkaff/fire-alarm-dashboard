"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, FileText, Loader2 } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import type { ReportStatistics } from "@/lib/types";

type ReportType = "daily" | "monthly";

export function ReportsView({ canGenerate }: { canGenerate: boolean }) {
  const [type, setType] = useState<ReportType>("daily");
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const [date, setDate] = useState(today);
  const [monthVal, setMonthVal] = useState(month);
  const [stats, setStats] = useState<ReportStatistics | null>(null);

  const periodISO = type === "daily" ? `${date}T00:00:00.000Z` : `${monthVal}-01T00:00:00.000Z`;

  const generate = useMutation({
    mutationFn: async (): Promise<ReportStatistics> => {
      const res = await fetch(`/api/reports/statistics?type=${type}&date=${encodeURIComponent(periodISO)}`);
      if (!res.ok) throw new Error("Failed to generate report");
      return res.json();
    },
    onSuccess: setStats,
  });

  const exportUrl = (format: "pdf" | "csv") => {
    const key = type === "daily" ? `date=${date}T00:00:00.000Z` : `month=${monthVal}-01T00:00:00.000Z`;
    return `/api/reports/${type}?${key}&format=${format}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Build report</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-fg-muted">Type</span>
            <div className="inline-flex rounded-[var(--radius-md)] border border-border-strong p-0.5">
              {(["daily", "monthly"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  aria-pressed={type === t}
                  className={`rounded-[calc(var(--radius-md)-2px)] px-3 py-1.5 text-sm font-medium capitalize ${type === t ? "bg-brand text-brand-fg" : "text-fg-muted hover:text-fg"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="period" className="text-xs font-medium text-fg-muted">Period</label>
            {type === "daily" ? (
              <input id="period" type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="h-10 rounded-[var(--radius-md)] border border-border-strong bg-surface px-3 text-sm text-fg" />
            ) : (
              <input id="period" type="month" value={monthVal} onChange={(e) => setMonthVal(e.target.value)}
                className="h-10 rounded-[var(--radius-md)] border border-border-strong bg-surface px-3 text-sm text-fg" />
            )}
          </div>
          <Button onClick={() => generate.mutate()} disabled={!canGenerate || generate.isPending}>
            {generate.isPending && <Loader2 size={16} className="animate-spin" aria-hidden />}
            Generate Report
          </Button>
          {!canGenerate && <p className="text-sm text-fg-subtle">Your role can view statistics but not generate exports.</p>}
        </CardBody>
      </Card>

      {generate.isError && <p className="text-sm" style={{ color: "var(--status-fault-fg)" }}>Couldn&apos;t generate the report. Try again.</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Alarms" value={stats.totals.alarms} />
            <Stat label="Faults" value={stats.totals.faults} />
            <Stat label="Restores" value={stats.totals.restores} />
            <Stat label="Devices" value={stats.totals.devices} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Events by day" data={stats.alarmsByDay} xKey="label" />
            <ChartCard title="Alarms by zone" data={stats.topZones.map((z) => ({ label: z.zone, count: z.count }))} xKey="label" />
          </div>

          <div className="flex items-center justify-end gap-2">
            <a href={exportUrl("pdf")} target="_blank" rel="noreferrer">
              <Button variant="secondary">
                <FileText size={16} aria-hidden /> Export PDF
              </Button>
            </a>
            <a href={exportUrl("csv")}>
              <Button variant="secondary">
                <Download size={16} aria-hidden /> Export CSV
              </Button>
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-fg-muted">{label}</p>
        <p className="tnum mt-1 text-3xl font-bold text-fg">{formatNumber(value)}</p>
      </CardBody>
    </Card>
  );
}

function ChartCard({ title, data, xKey }: { title: string; data: { label: string; count: number }[]; xKey: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody>
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-fg-subtle">No data for this period.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "var(--color-fg-subtle)" }} tickLine={false} axisLine={{ stroke: "var(--color-border)" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-fg-subtle)" }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--color-surface-muted)" }}
                  contentStyle={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12, color: "var(--color-fg)" }}
                />
                <Bar dataKey="count" fill="var(--color-brand)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

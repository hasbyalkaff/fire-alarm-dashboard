import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getPanel } from "@/lib/dal";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PanelStateBadge, StatusBadge } from "@/components/status/status-badge";
import { KeyValue } from "@/components/data/key-value";
import { formatDateTime, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PanelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const panel = getPanel(Number(id));
  if (!panel) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Panels", href: "/panels" }, { label: panel.name }]} />

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-fg">{panel.name}</h1>
            <p className="mt-1 text-sm text-fg-muted">{panel.location}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <PanelStateBadge state={panel.status} />
            <span className="text-sm text-fg-subtle">
              Last communication <span className="tnum text-fg-muted">{relativeTime(panel.lastCommunication)}</span>
            </span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zones in this panel</CardTitle>
        </CardHeader>
        <ul className="divide-y divide-border">
          {panel.zones.map((z) => (
            <li key={z.id}>
              <Link href={`/zones/${z.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-muted">
                <StatusBadge status={z.status} size="sm" />
                <span className="flex-1 font-medium text-fg">{z.name}</span>
                <span className="tnum text-sm text-fg-subtle">{z.deviceCount} devices</span>
                <ChevronRight size={16} className="text-fg-subtle" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent connection log</CardTitle>
        </CardHeader>
        <CardBody>
          {panel.connectionLog.length === 0 ? (
            <p className="text-sm text-fg-subtle">No recent connection events.</p>
          ) : (
            <KeyValue
              items={panel.connectionLog.map((c) => ({
                label: c.event === "connect" ? "Connected" : "Disconnected",
                value: <span className="tnum">{formatDateTime(c.occurredAt)}</span>,
              }))}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}

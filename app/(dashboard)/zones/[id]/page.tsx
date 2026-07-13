import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getZone } from "@/lib/dal";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, SeverityBadge } from "@/components/status/status-badge";
import { DeviceTypeIcon } from "@/components/status/status-icon";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ZoneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const zone = getZone(Number(id));
  if (!zone) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Zones", href: "/zones" }, { label: zone.name }]} />

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-fg">{zone.name}</h1>
            <p className="mt-1 text-sm text-fg-muted">
              {zone.building} · {zone.panelName}
            </p>
          </div>
          <StatusBadge status={zone.status} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Devices in this zone</CardTitle>
          <span className="tnum text-sm text-fg-subtle">{zone.deviceCount} devices</span>
        </CardHeader>
        <ul className="divide-y divide-border">
          {zone.devices.map((d) => (
            <li key={d.id}>
              <Link href={`/devices/${d.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-muted">
                <StatusBadge status={d.status} size="sm" />
                <DeviceTypeIcon type={d.type} />
                <span className="flex-1 truncate font-medium text-fg">{d.label}</span>
                {d.severity && <SeverityBadge severity={d.severity} />}
                <span className="tnum hidden text-sm text-fg-subtle sm:inline">{relativeTime(d.lastUpdate)}</span>
                <ChevronRight size={16} className="text-fg-subtle" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

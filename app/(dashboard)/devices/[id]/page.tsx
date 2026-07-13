import { notFound } from "next/navigation";
import { getDevice, getDeviceHistory } from "@/lib/dal";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, SeverityBadge } from "@/components/status/status-badge";
import { DeviceTypeIcon } from "@/components/status/status-icon";
import { KeyValue } from "@/components/data/key-value";
import { Timeline } from "@/components/data/timeline";
import { EmptyState } from "@/components/data/states";
import { formatDateTime, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const device = getDevice(Number(id));
  if (!device) notFound();
  const history = getDeviceHistory(device.id);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Devices", href: "/devices" }, { label: device.label }]} />

      {/* Header */}
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-surface-muted">
              <DeviceTypeIcon type={device.type} size={22} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-fg">{device.label}</h1>
              <p className="mt-0.5 text-sm text-fg-muted">
                {device.zoneName} · {device.building} · {device.panelName} · {device.location}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={device.status} />
            {device.severity && <SeverityBadge severity={device.severity} size="md" />}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardBody>
            <KeyValue
              items={[
                { label: "Status", value: <StatusBadge status={device.status} size="sm" /> },
                { label: "Severity", value: device.severity ? <SeverityBadge severity={device.severity} /> : "None" },
                { label: "Last communication", value: <span className="tnum">{formatDateTime(device.lastUpdate)} ({relativeTime(device.lastUpdate)})</span> },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
          </CardHeader>
          <CardBody>
            <KeyValue
              items={[
                { label: "Type", value: device.typeLabel },
                { label: "Address", value: <span className="tnum">{device.address}</span> },
                { label: "Zone", value: device.zoneName },
                { label: "Panel", value: device.panelName },
                { label: "Location", value: device.location },
              ]}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Register Mapping</CardTitle>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-fg-subtle">Reference only</span>
        </CardHeader>
        <CardBody>
          <KeyValue
            mono
            items={device.registerMap.map((r) => ({
              label: String(r.register),
              value: (
                <span>
                  {r.name} = {r.value}
                </span>
              ),
            }))}
          />
        </CardBody>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-fg">Alarm History</h2>
        {history.length === 0 ? (
          <Card>
            <EmptyState title="No history" hint="This device has no recorded events yet." />
          </Card>
        ) : (
          <Timeline events={history} linkDevices={false} />
        )}
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "@/components/status/status-badge";
import { StatusIcon } from "@/components/status/status-icon";
import { AllClearState } from "@/components/data/states";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime } from "@/lib/utils";
import type { AlarmDTO, Paginated } from "@/lib/types";

export function ActiveAlarmsPreview() {
  const { data, isPending } = useQuery({
    queryKey: ["alarms", "pageSize=5"],
    queryFn: async (): Promise<Paginated<AlarmDTO>> => {
      const res = await fetch("/api/alarms?pageSize=5");
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Alarms</CardTitle>
        <Link href="/alarms" className="text-sm font-medium text-brand hover:underline">
          View all
        </Link>
      </CardHeader>
      {isPending ? (
        <CardBody className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </CardBody>
      ) : !data || data.data.length === 0 ? (
        <AllClearState />
      ) : (
        <ul className="divide-y divide-border">
          {data.data.map((a) => (
            <li key={a.id}>
              <Link href={`/devices/${a.deviceId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-muted">
                <StatusIcon status="alarm" />
                <time className="tnum shrink-0 font-mono text-[13px] text-fg-muted">{formatTime(a.timestamp)}</time>
                <span className="min-w-0 flex-1 truncate text-sm text-fg">
                  {a.device} <span className="text-fg-subtle">· {a.panel} · {a.zone}</span>
                </span>
                <SeverityBadge severity={a.severity} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

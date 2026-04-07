/**
 * IMS Gen 2 — Epic 14: Isolated Devices Tab (Story 14.2 AC7)
 */
import { useMemo } from "react";
import { Shield, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import type { Incident, AffectedDevice } from "@/lib/incident-types";

export function IsolatedDevicesTab({
  incidents,
  onRelease,
}: {
  incidents: Incident[];
  onRelease: (device: AffectedDevice) => void;
}) {
  const isolatedDevices = useMemo(() => {
    const devices: (AffectedDevice & { incidentId: string; incidentTitle: string })[] = [];
    incidents.forEach((inc) => {
      inc.affectedDevices.forEach((dev) => {
        if (dev.status === "Isolated") {
          devices.push({ ...dev, incidentId: inc.id, incidentTitle: inc.title });
        }
      });
    });
    return devices;
  }, [incidents]);

  return (
    <div className="card-elevated overflow-hidden">
      <table className="w-full">
        <caption className="sr-only">Isolated devices</caption>
        <thead>
          <tr className="border-b-2 border-border bg-table-header">
            <th
              scope="col"
              className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Device
            </th>
            <th
              scope="col"
              className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Incident
            </th>
            <th
              scope="col"
              className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Isolation Date
            </th>
            <th
              scope="col"
              className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Policy
            </th>
            <th
              scope="col"
              className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Location
            </th>
            <th
              scope="col"
              className="px-4 py-2.5 text-right text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {isolatedDevices.map((dev, i) => (
            <tr key={dev.id} className={cn("h-[48px]", i % 2 === 1 && "bg-muted/50")}>
              <td className="px-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-danger" />
                  <span className="text-[14px] font-medium text-foreground">{dev.name}</span>
                </div>
              </td>
              <td className="px-4">
                <span className="text-[14px] text-info-text font-medium">{dev.incidentId}</span>
                <p className="text-[13px] text-muted-foreground truncate max-w-[200px]">
                  {dev.incidentTitle}
                </p>
              </td>
              <td className="px-4 text-[14px] text-muted-foreground">
                {dev.isolatedAt ? formatDateTime(dev.isolatedAt) : "N/A"}
              </td>
              <td className="px-4">
                <span className="inline-flex rounded-full bg-warning-bg px-2 py-0.5 text-[12px] font-medium text-warning-text">
                  {dev.isolationPolicy ?? "N/A"}
                </span>
              </td>
              <td className="px-4 text-[14px] text-muted-foreground">{dev.location}</td>
              <td className="px-4 text-right">
                <button
                  onClick={() => onRelease(dev)}
                  className="rounded-lg bg-success-bg px-3 py-1.5 text-[13px] font-medium text-success-text hover:bg-success-bg cursor-pointer"
                >
                  <Unlock className="mr-1 inline h-3 w-3" /> Release
                </button>
              </td>
            </tr>
          ))}
          {isolatedDevices.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center">
                <Shield className="mx-auto h-8 w-8 text-success-text mb-2" />
                <p className="text-[15px] font-medium text-success-text">No isolated devices</p>
                <p className="text-[14px] text-muted-foreground">
                  All devices are operating normally
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

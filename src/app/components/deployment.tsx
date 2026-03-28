import { useState } from "react";
import { Upload, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

type Tab = "firmware" | "audit";

const PLACEHOLDER_FIRMWARE = [
  {
    version: "v4.1.0-rc1",
    name: "Security Patch Bundle",
    stage: "Testing" as const,
    uploadedBy: "j.chen@hlm.com",
    date: "Mar 25, 2026",
    devices: 0,
    models: ["INV-3200", "INV-3100"],
  },
  {
    version: "v4.0.0",
    name: "Major Release — Q1 2026",
    stage: "Approved" as const,
    uploadedBy: "a.patel@hlm.com",
    date: "Mar 10, 2026",
    devices: 1842,
    models: ["INV-3200"],
  },
  {
    version: "v3.2.1",
    name: "Legacy Maintenance",
    stage: "Uploaded" as const,
    uploadedBy: "m.rodriguez@hlm.com",
    date: "Mar 27, 2026",
    devices: 0,
    models: ["INV-3100"],
  },
];

const PLACEHOLDER_AUDIT = [
  { time: "Mar 28, 14:32", user: "j.chen@hlm.com", action: "Uploaded firmware v3.2.1", entity: "Firmware" },
  { time: "Mar 27, 09:15", user: "a.patel@hlm.com", action: "Approved firmware v4.0.0 for deployment", entity: "Firmware" },
  { time: "Mar 26, 16:48", user: "system", action: "Deployment to 1,842 devices completed", entity: "Deployment" },
  { time: "Mar 25, 11:20", user: "j.chen@hlm.com", action: "Submitted v4.1.0-rc1 for testing", entity: "Firmware" },
  { time: "Mar 24, 08:00", user: "system", action: "Automated vulnerability scan completed", entity: "Compliance" },
];

const STAGES = ["Uploaded", "Testing", "Approved"] as const;

function ApprovalPipeline({ current }: { current: string }) {
  const currentIdx = STAGES.indexOf(current as (typeof STAGES)[number]);
  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage, i) => (
        <div key={stage} className="flex items-center gap-1">
          <span
            className={cn(
              "rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
              i <= currentIdx
                ? i === currentIdx
                  ? "bg-accent/10 text-accent"
                  : "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            )}
          >
            {stage}
          </span>
          {i < STAGES.length - 1 && (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}

export function Deployment() {
  const [activeTab, setActiveTab] = useState<Tab>("firmware");

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex border-b border-border">
          {(
            [
              { id: "firmware" as const, label: "Firmware" },
              { id: "audit" as const, label: "Audit Log" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 py-2 text-xs font-medium",
                activeTab === tab.id
                  ? "border-b-2 border-accent text-accent"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === "firmware" && (
          <button className="flex items-center gap-1 rounded-sm bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90">
            <Upload className="h-3 w-3" />
            Upload Firmware
          </button>
        )}
      </div>

      {/* Firmware cards */}
      {activeTab === "firmware" && (
        <div className="grid grid-cols-3 gap-3">
          {PLACEHOLDER_FIRMWARE.map((fw, i) => (
            <div
              key={i}
              className="rounded-sm border border-border bg-card p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{fw.version}</span>
              </div>
              <p className="text-xs text-muted-foreground">{fw.name}</p>
              <ApprovalPipeline current={fw.stage} />
              <div className="space-y-1 text-[10px] text-muted-foreground">
                <p>
                  Uploaded by: <span className="text-foreground">{fw.uploadedBy}</span>
                </p>
                <p>
                  Date: <span className="text-foreground">{fw.date}</span>
                </p>
                <p>
                  Models: <span className="text-foreground">{fw.models.join(", ")}</span>
                </p>
                <p>
                  Deployed to: <span className="font-medium text-foreground">{fw.devices.toLocaleString()} devices</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit log table */}
      {activeTab === "audit" && (
        <div className="overflow-auto rounded-sm border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Time</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">User</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Entity</th>
              </tr>
            </thead>
            <tbody>
              {PLACEHOLDER_AUDIT.map((log, i) => (
                <tr
                  key={i}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">{log.time}</td>
                  <td className="px-3 py-2 text-muted-foreground">{log.user}</td>
                  <td className="px-3 py-2 text-foreground">{log.action}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {log.entity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { Upload, Package, Shield, ShieldCheck, AlertTriangle, RotateCcw, Ban } from "lucide-react";
import { cn } from "../../../lib/utils";
import { ApprovalStageIndicator } from "./approval-stage-indicator";
import type { FirmwareEntry } from "./deployment-types";

interface FirmwareListProps {
  firmware: FirmwareEntry[];
  filteredFirmware: FirmwareEntry[];
  currentUser: string;
  canManage: boolean;
  isAdmin: boolean;
  onUploadClick: () => void;
  advanceStage: (id: string) => void;
  deprecateFirmware: (id: string) => void;
  activateFirmware: (id: string) => void;
}

export function FirmwareList({
  firmware,
  filteredFirmware,
  currentUser,
  canManage,
  isAdmin,
  onUploadClick,
  advanceStage,
  deprecateFirmware,
  activateFirmware,
}: FirmwareListProps) {
  if (filteredFirmware.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted py-16">
        <Package className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">
          {firmware.length === 0
            ? "No firmware packages found"
            : "No firmware found matching the selected filters"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {firmware.length === 0
            ? "Upload your first firmware package to get started."
            : "Try adjusting your filters."}
        </p>
        {firmware.length === 0 && canManage && (
          <button
            onClick={onUploadClick}
            className="mt-4 flex items-center gap-1 rounded-sm bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
          >
            <Upload className="h-3 w-3" />
            Upload Firmware
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {filteredFirmware.map((fw) => (
        <FirmwareCard
          key={fw.id}
          fw={fw}
          currentUser={currentUser}
          canManage={canManage}
          isAdmin={isAdmin}
          advanceStage={advanceStage}
          deprecateFirmware={deprecateFirmware}
          activateFirmware={activateFirmware}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single firmware card — extracted for readability
// ---------------------------------------------------------------------------

interface FirmwareCardProps {
  fw: FirmwareEntry;
  currentUser: string;
  canManage: boolean;
  isAdmin: boolean;
  advanceStage: (id: string) => void;
  deprecateFirmware: (id: string) => void;
  activateFirmware: (id: string) => void;
}

function FirmwareCard({
  fw,
  currentUser,
  canManage,
  isAdmin,
  advanceStage,
  deprecateFirmware,
  activateFirmware,
}: FirmwareCardProps) {
  const isDeprecated = fw.stage === "Deprecated";
  const isUploadedByCurrentUser = fw.uploadedBy === currentUser;
  const isTestedByCurrentUser = fw.testedBy === currentUser;

  // SoD-aware button visibility -- Story 11.2
  const canAdvanceToTesting = canManage && fw.stage === "Uploaded" && !isUploadedByCurrentUser;
  const canApprove = canManage && fw.stage === "Testing" && !isTestedByCurrentUser;
  const showSoDWarningUploaded = canManage && fw.stage === "Uploaded" && isUploadedByCurrentUser;
  const showSoDWarningTesting = canManage && fw.stage === "Testing" && isTestedByCurrentUser;
  const canDeprecate = canManage && fw.status === "Active";
  const canActivate = isAdmin && isDeprecated;

  // Status badge -- Story 11.7
  const statusBadge = (() => {
    switch (fw.status) {
      case "Active":
        return "bg-emerald-500/10 text-emerald-600";
      case "Deprecated":
        return "bg-muted text-muted-foreground";
      case "Pending":
        return "bg-amber-500/10 text-amber-600";
    }
  })();

  return (
    <div
      className={cn(
        "rounded-sm border bg-card p-3 space-y-2.5 transition-all duration-150 hover:shadow-md",
        isDeprecated ? "border-border/50 opacity-60" : "border-border",
      )}
    >
      {/* Header: version + status badge */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-sm font-bold",
            isDeprecated ? "text-muted-foreground line-through" : "text-foreground",
          )}
        >
          {fw.version}
        </span>
        <span className={cn("rounded-sm px-1.5 py-0.5 text-[12px] font-medium", statusBadge)}>
          {fw.status}
        </span>
      </div>

      {/* Name */}
      <p className="text-sm text-muted-foreground">{fw.name}</p>

      {/* Approval Stage Indicator -- Story 11.3 */}
      <ApprovalStageIndicator
        currentStage={fw.stage}
        uploadedBy={fw.uploadedBy}
        uploadedDate={fw.uploadedDate}
        testedBy={fw.testedBy}
        testedDate={fw.testedDate}
        approvedBy={fw.approvedBy}
        approvedDate={fw.approvedDate}
      />

      {/* Metadata -- Story 11.7 */}
      <div className="space-y-1 text-[12px] text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>
            Model: <span className="text-foreground">{fw.models.join(", ")}</span>
          </span>
          <span>
            Size: <span className="text-foreground">{fw.fileSize}</span>
          </span>
        </div>
        <p>
          Uploaded by: <span className="text-foreground">{fw.uploadedBy}</span>
        </p>
        <p>
          Date: <span className="text-foreground">{fw.date}</span>
        </p>
        <p>
          Deployed to:{" "}
          <span className="font-medium text-foreground">{fw.devices.toLocaleString()} devices</span>
        </p>
      </div>

      {/* Action buttons -- Stories 11.2, 11.7 */}
      {(canAdvanceToTesting ||
        canApprove ||
        showSoDWarningUploaded ||
        showSoDWarningTesting ||
        canDeprecate ||
        canActivate) && (
        <div className="flex items-center gap-1.5 border-t border-border pt-2 flex-wrap">
          {canAdvanceToTesting && (
            <button
              onClick={() => advanceStage(fw.id)}
              className="flex items-center gap-1 rounded-sm bg-blue-600 px-2 py-1 text-[12px] font-medium text-white hover:bg-blue-700 transition-colors duration-150"
            >
              <Shield className="h-2.5 w-2.5" />
              Advance to Testing
            </button>
          )}
          {canApprove && (
            <button
              onClick={() => advanceStage(fw.id)}
              className="flex items-center gap-1 rounded-sm bg-emerald-600 px-2 py-1 text-[12px] font-medium text-white hover:bg-emerald-700 transition-colors duration-150"
            >
              <ShieldCheck className="h-2.5 w-2.5" />
              Approve
            </button>
          )}
          {showSoDWarningUploaded && (
            <span className="flex items-center gap-1 rounded-sm bg-amber-500/10 px-2 py-1 text-[12px] font-medium text-amber-600">
              <AlertTriangle className="h-2.5 w-2.5" />
              Requires different tester
            </span>
          )}
          {showSoDWarningTesting && (
            <span className="flex items-center gap-1 rounded-sm bg-amber-500/10 px-2 py-1 text-[12px] font-medium text-amber-600">
              <AlertTriangle className="h-2.5 w-2.5" />
              Requires different approver
            </span>
          )}
          {canDeprecate && (
            <button
              onClick={() => deprecateFirmware(fw.id)}
              className="flex items-center gap-1 rounded-sm border border-red-200 px-2 py-1 text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
            >
              <Ban className="h-2.5 w-2.5" />
              Deprecate
            </button>
          )}
          {canActivate && (
            <button
              onClick={() => activateFirmware(fw.id)}
              className="flex items-center gap-1 rounded-sm border border-emerald-200 px-2 py-1 text-[12px] font-medium text-emerald-600 hover:bg-emerald-50 transition-colors duration-150"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              Activate
            </button>
          )}
        </div>
      )}
    </div>
  );
}

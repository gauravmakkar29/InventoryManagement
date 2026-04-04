import { useCallback, useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { generateCSV } from "../../../lib/report-generator";
import { formatTimestamp, downloadFile } from "./deployment-utils";
import type { FirmwareEntry, VulnerabilityEntry, ReportType } from "./deployment-types";

interface ReportsTabProps {
  firmware: FirmwareEntry[];
  vulnerabilities: VulnerabilityEntry[];
}

export function ReportsTab({ firmware, vulnerabilities }: ReportsTabProps) {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>("compliance");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState<Record<string, unknown>[]>([]);

  const generateReport = useCallback(() => {
    let data: Record<string, unknown>[] = [];

    if (selectedReportType === "compliance") {
      data = firmware.map((fw) => ({
        "Firmware ID": fw.id,
        Version: fw.version,
        Name: fw.name,
        Status: fw.status,
        "Approval Stage": fw.stage,
        "Device Model": fw.models.join(", "),
        "Uploaded By": fw.uploadedBy,
        "Upload Date": fw.uploadedDate,
        Checksum: fw.checksum,
      }));
    } else if (selectedReportType === "vulnerability") {
      data = vulnerabilities.map((v) => ({
        "CVE ID": v.cveId,
        Severity: v.severity,
        "Affected Component": v.affectedComponent,
        "Remediation Status": v.remediationStatus,
        "Firmware Version": v.firmwareVersion,
        "Resolved Date": v.resolvedDate ?? "N/A",
      }));
    } else if (selectedReportType === "approval-chain") {
      data = firmware.map((fw) => ({
        "Firmware ID": fw.id,
        Version: fw.version,
        Name: fw.name,
        "Uploaded By": fw.uploadedBy,
        "Upload Date": fw.uploadedDate ? formatTimestamp(fw.uploadedDate) : "N/A",
        "Tested By": fw.testedBy ?? "N/A",
        "Tested Date": fw.testedDate ? formatTimestamp(fw.testedDate) : "N/A",
        "Approved By": fw.approvedBy ?? "N/A",
        "Approved Date": fw.approvedDate ? formatTimestamp(fw.approvedDate) : "N/A",
      }));
    }

    setReportData(data);
    setReportGenerated(true);
  }, [selectedReportType, firmware, vulnerabilities]);

  const exportReport = useCallback(
    (format: "csv" | "json") => {
      if (reportData.length === 0) return;
      const date = new Date().toISOString().split("T")[0];
      const filename = `${selectedReportType}-report-${date}`;

      if (format === "csv") {
        const csv = generateCSV(reportData);
        downloadFile(csv, `${filename}.csv`, "text/csv;charset=utf-8;");
      } else {
        const json = JSON.stringify(reportData, null, 2);
        downloadFile(json, `${filename}.json`, "application/json");
      }
      toast.success(`${selectedReportType} report exported as ${format.toUpperCase()}`);
    },
    [reportData, selectedReportType],
  );

  return (
    <div className="space-y-4">
      {/* Report Type Selector */}
      <div className="flex items-center gap-4">
        <label
          id="deploy-report-type-label"
          className="text-[13px] font-medium text-muted-foreground"
        >
          Report Type:
        </label>
        <div
          role="radiogroup"
          aria-labelledby="deploy-report-type-label"
          className="flex items-center gap-3"
        >
          {[
            { id: "compliance" as const, label: "Compliance Summary" },
            { id: "vulnerability" as const, label: "Vulnerability Report" },
            { id: "approval-chain" as const, label: "Approval Chain Audit" },
          ].map((rt) => (
            <label key={rt.id} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="reportType"
                value={rt.id}
                checked={selectedReportType === rt.id}
                onChange={() => {
                  setSelectedReportType(rt.id);
                  setReportGenerated(false);
                  setReportData([]);
                }}
                className="accent-[#FF7900] h-3 w-3"
              />
              <span className="text-sm text-foreground">{rt.label}</span>
            </label>
          ))}
        </div>
        <button
          onClick={generateReport}
          className="flex items-center gap-1.5 rounded-sm bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors duration-150"
        >
          <FileText className="h-3 w-3" />
          Generate
        </button>
      </div>

      {/* Export buttons */}
      {reportGenerated && reportData.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportReport("csv")}
            className="flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors duration-150"
          >
            <Download className="h-3 w-3" />
            Export CSV
          </button>
          <button
            onClick={() => exportReport("json")}
            className="flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors duration-150"
          >
            <Download className="h-3 w-3" />
            Export JSON
          </button>
          <span className="text-[12px] text-muted-foreground ml-2">
            {reportData.length} records generated
          </span>
        </div>
      )}

      {/* Report Preview Table */}
      {reportGenerated && (
        <div
          className="overflow-auto rounded-sm border border-border"
          style={{ maxHeight: "calc(100vh - 340px)" }}
        >
          {reportData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                No data available for this report type
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <caption className="sr-only">Deployment report data</caption>
              <thead className="sticky top-0">
                <tr className="border-b-2 border-border bg-muted/50">
                  {Object.keys(reportData[0] ?? {}).map((key) => (
                    <th
                      key={key}
                      scope="col"
                      className="px-3 py-2.5 text-left text-[13px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr
                    key={`report-row-${idx}-${String(Object.values(row)[0] ?? idx)}`}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors duration-150"
                  >
                    {Object.values(row).map((val, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-3 py-2 text-muted-foreground whitespace-nowrap max-w-[200px] truncate"
                      >
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!reportGenerated && (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/20 py-16">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            Select a report type and click Generate
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Reports can be exported as CSV or JSON
          </p>
        </div>
      )}
    </div>
  );
}

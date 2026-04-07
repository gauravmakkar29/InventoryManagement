// =============================================================================
// Customer & Site Types — Story #389
// Customer → Site → SiteDeployment entity model
// =============================================================================

/**
 * Site — a physical location belonging to a customer.
 *
 * DynamoDB schema:
 *   PK: CUSTOMER#<customerId>
 *   SK: SITE#<siteId>
 */
export interface Site {
  id: string;
  customerId: string;
  name: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  deviceCount: number;
  currentFirmwareVersionId?: string;
  currentFirmwareVersion?: string; // display label e.g. "v4.1.2"
  currentFirmwareFamilyName?: string;
  lastDeploymentAt?: string; // ISO 8601
  status: "active" | "maintenance" | "decommissioned";
}

/**
 * SiteDeployment — firmware deployment record for a site.
 *
 * DynamoDB schema:
 *   PK: SITE#<siteId>
 *   SK: DEPLOY#<fwVersionId>
 */
export interface SiteDeployment {
  id: string;
  siteId: string;
  firmwareVersionId: string;
  firmwareVersion: string; // semver display
  firmwareFamilyName: string;
  deployedBy: string;
  deployedAt: string; // ISO 8601
  previousFirmwareVersionId?: string;
  previousFirmwareVersion?: string;
  method: "OTA" | "MANUAL" | "DOWNLOAD_TOKEN";
  status: "SUCCESS" | "FAILED" | "ROLLING_BACK" | "ROLLED_BACK";
  notes?: string;
}

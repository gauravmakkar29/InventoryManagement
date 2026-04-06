/**
 * IMS Gen 2 — DTO ↔ ViewModel Mappers
 *
 * Bidirectional transformation between canonical API types and
 * UI view model types. Called by providers on API responses
 * to isolate the UI from backend schema changes.
 *
 * @see Story #295 — Add DTO ↔ UI model transformation layer
 */

export { toDeviceViewModel, toDeviceCreateDTO } from "./device.mapper";
export { toFirmwareViewModel } from "./firmware.mapper";
export { toServiceOrderViewModel, toServiceOrderCreateDTO } from "./service-order.mapper";
export { toComplianceViewModel } from "./compliance.mapper";
export { toVulnerabilityViewModel } from "./vulnerability.mapper";
export { toAuditEntryViewModel } from "./audit-log.mapper";

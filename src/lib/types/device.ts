import { DeviceStatus } from "../types";

// =============================================================================
// Device Domain Types (moved from app/components/dialogs/create-device-modal.tsx)
// =============================================================================

export interface CreateDevicePayload {
  name: string;
  serial: string;
  model: string;
  firmware: string;
  status: DeviceStatus;
  location: string;
  lat?: number;
  lng?: number;
}

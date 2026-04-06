/**
 * Device DTO ↔ ViewModel mapper.
 *
 * Bridges canonical API type (Device) and UI type (MockDevice).
 * Called by real providers on API responses. Mock provider bypasses
 * this since mock data is already in MockDevice shape.
 */

import type { Device } from "../types";
import { DeviceStatus } from "../types";
import type { MockDevice } from "../mock-data/inventory-data";
import type { CreateDevicePayload } from "../types/device";

/** API response → UI view model */
export function toDeviceViewModel(api: Device): MockDevice {
  return {
    id: api.id,
    name: api.name,
    serial: api.serialNumber,
    model: api.model,
    status: api.status,
    location: api.location,
    health: api.healthScore,
    firmware: api.firmwareVersion,
    lastSeen: api.lastSeen,
    lat: api.coordinates?.lat,
    lng: api.coordinates?.lng,
  };
}

/** UI form → API create payload */
export function toDeviceCreateDTO(form: CreateDevicePayload): Partial<Device> {
  return {
    name: form.name.trim(),
    serialNumber: form.serial,
    model: form.model,
    status: form.status,
    firmwareVersion: form.firmware,
    location: form.location,
    healthScore: form.status === DeviceStatus.Online ? 100 : 0,
    coordinates:
      form.lat != null && form.lng != null ? { lat: form.lat, lng: form.lng } : undefined,
    tags: [],
    metadata: {},
    manufacturer: "",
    customerId: "",
    installedDate: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
  };
}

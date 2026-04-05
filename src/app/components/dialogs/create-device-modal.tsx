import FocusTrap from "focus-trap-react";
import { useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DeviceStatus } from "@/lib/types";
import { FormField } from "@/components/form/form-field";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface CreateDeviceModalProps {
  open: boolean;
  onClose: () => void;
  onCreateDevice: (payload: CreateDevicePayload) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEVICE_MODELS = ["INV-3200", "INV-3100"];

const DEVICE_STATUSES: { value: DeviceStatus; label: string }[] = [
  { value: DeviceStatus.Online, label: "Online" },
  { value: DeviceStatus.Offline, label: "Offline" },
  { value: DeviceStatus.Maintenance, label: "Maintenance" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateDeviceModal({ open, onClose, onCreateDevice }: CreateDeviceModalProps) {
  const [name, setName] = useState("");
  const [serial, setSerial] = useState("");
  const [model, setModel] = useState("");
  const [firmware, setFirmware] = useState("");
  const [status, setStatus] = useState<DeviceStatus>(DeviceStatus.Online);
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = useCallback(() => {
    setName("");
    setSerial("");
    setModel("");
    setFirmware("");
    setStatus(DeviceStatus.Online);
    setLocation("");
    setLat("");
    setLng("");
    setErrors({});
  }, []);

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};

    if (!name.trim()) next.name = "Device name is required";
    if (!serial.trim()) next.serial = "Serial number is required";
    if (!model) next.model = "Device model is required";
    if (!firmware.trim()) next.firmware = "Firmware version is required";
    if (!status) next.status = "Status is required";
    if (!location.trim()) next.location = "Location is required";

    if (lat.trim() && isNaN(Number(lat))) next.lat = "Latitude must be a valid number";
    if (lng.trim() && isNaN(Number(lng))) next.lng = "Longitude must be a valid number";

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [name, serial, model, firmware, status, location, lat, lng]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const payload: CreateDevicePayload = {
        name: name.trim(),
        serial: serial.trim(),
        model,
        firmware: firmware.trim(),
        status,
        location: location.trim(),
      };

      if (lat.trim()) payload.lat = Number(lat);
      if (lng.trim()) payload.lng = Number(lng);

      onCreateDevice(payload);

      toast.success("Device created", {
        description: `${name.trim()} (${serial.trim()}) has been added to inventory.`,
      });

      resetForm();
      onClose();
    },
    [
      name,
      serial,
      model,
      firmware,
      status,
      location,
      lat,
      lng,
      validate,
      onCreateDevice,
      onClose,
      resetForm,
    ],
  );

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <FocusTrap>
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={handleClose} aria-hidden="true" />
        <div
          className="relative z-10 w-full max-w-[520px] rounded-2xl bg-card shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Create device"
        >
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <h3 className="text-[16px] font-semibold text-foreground">Create Device</h3>
            <button
              onClick={handleClose}
              className={cn(
                "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground",
                "hover:bg-muted hover:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Story 23.4: Shared FormField/FormInput/FormSelect */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <FormField label="Device Name" htmlFor="device-name" required error={errors.name}>
              <FormInput
                id="device-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. INV-3200A"
                error={!!errors.name}
                aria-describedby={errors.name ? "device-name-error" : undefined}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Serial Number"
                htmlFor="device-serial"
                required
                error={errors.serial}
              >
                <FormInput
                  id="device-serial"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  placeholder="e.g. SN-4821"
                  error={!!errors.serial}
                />
              </FormField>
              <FormField label="Device Model" htmlFor="device-model" required error={errors.model}>
                <FormSelect
                  id="device-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  error={!!errors.model}
                >
                  <option value="">Select model</option>
                  {DEVICE_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </FormSelect>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Firmware Version"
                htmlFor="device-firmware"
                required
                error={errors.firmware}
              >
                <FormInput
                  id="device-firmware"
                  value={firmware}
                  onChange={(e) => setFirmware(e.target.value)}
                  placeholder="e.g. v4.0.0"
                  error={!!errors.firmware}
                />
              </FormField>
              <FormField label="Status" htmlFor="device-status" required error={errors.status}>
                <FormSelect
                  id="device-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DeviceStatus)}
                  error={!!errors.status}
                >
                  {DEVICE_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </FormSelect>
              </FormField>
            </div>

            <FormField label="Location" htmlFor="device-location" required error={errors.location}>
              <FormInput
                id="device-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Denver, CO"
                error={!!errors.location}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Latitude" htmlFor="device-lat" error={errors.lat}>
                <FormInput
                  id="device-lat"
                  inputMode="decimal"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="e.g. 39.74"
                  error={!!errors.lat}
                />
              </FormField>
              <FormField label="Longitude" htmlFor="device-lng" error={errors.lng}>
                <FormInput
                  id="device-lng"
                  inputMode="decimal"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="e.g. -104.99"
                  error={!!errors.lng}
                />
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className={cn(
                  "h-10 cursor-pointer rounded-lg border border-border bg-card px-5 text-[15px] font-medium text-foreground/80",
                  "hover:bg-muted",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={cn(
                  "h-10 cursor-pointer rounded-lg bg-accent px-5 text-[15px] font-medium text-white",
                  "hover:bg-accent-hover",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                )}
              >
                Create Device
              </button>
            </div>
          </form>
        </div>
      </div>
    </FocusTrap>
  );
}

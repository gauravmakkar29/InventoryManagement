import FocusTrap from "focus-trap-react";
import { useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import { DeviceStatus } from "../../../lib/types";

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

  const inputClass =
    "h-10 w-full border border-gray-200 bg-white px-3 text-[15px] text-gray-900 placeholder:text-gray-600 rounded-lg focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]";

  const labelClass = "block text-[14px] font-medium text-gray-700 mb-1";

  return (
    <FocusTrap>
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/30" onClick={handleClose} aria-hidden="true" />

        {/* Modal */}
        <div
          className="relative z-10 w-full max-w-[520px] rounded-2xl bg-white shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Create device"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="text-[16px] font-semibold text-gray-900">Create Device</h3>
            <button
              onClick={handleClose}
              className={cn(
                "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-600",
                "hover:bg-gray-100 hover:text-gray-600",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900]",
              )}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Device Name */}
            <div>
              <label htmlFor="device-name" className={labelClass}>
                Device Name <span className="text-red-500">*</span>
              </label>
              <input
                id="device-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. INV-3200A"
                className={cn(inputClass, errors.name && "border-red-400")}
              />
              {errors.name && (
                <p className="mt-1 text-[14px] text-red-500" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Serial Number + Device Model row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="device-serial" className={labelClass}>
                  Serial Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="device-serial"
                  type="text"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  placeholder="e.g. SN-4821"
                  className={cn(inputClass, errors.serial && "border-red-400")}
                />
                {errors.serial && (
                  <p className="mt-1 text-[14px] text-red-500" role="alert">
                    {errors.serial}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="device-model" className={labelClass}>
                  Device Model <span className="text-red-500">*</span>
                </label>
                <select
                  id="device-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className={cn(inputClass, errors.model && "border-red-400")}
                >
                  <option value="">Select model</option>
                  {DEVICE_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                {errors.model && (
                  <p className="mt-1 text-[14px] text-red-500" role="alert">
                    {errors.model}
                  </p>
                )}
              </div>
            </div>

            {/* Firmware Version + Status row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="device-firmware" className={labelClass}>
                  Firmware Version <span className="text-red-500">*</span>
                </label>
                <input
                  id="device-firmware"
                  type="text"
                  value={firmware}
                  onChange={(e) => setFirmware(e.target.value)}
                  placeholder="e.g. v4.0.0"
                  className={cn(inputClass, errors.firmware && "border-red-400")}
                />
                {errors.firmware && (
                  <p className="mt-1 text-[14px] text-red-500" role="alert">
                    {errors.firmware}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="device-status" className={labelClass}>
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="device-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DeviceStatus)}
                  className={cn(inputClass, errors.status && "border-red-400")}
                >
                  {DEVICE_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="mt-1 text-[14px] text-red-500" role="alert">
                    {errors.status}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="device-location" className={labelClass}>
                Location <span className="text-red-500">*</span>
              </label>
              <input
                id="device-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Denver, CO"
                className={cn(inputClass, errors.location && "border-red-400")}
              />
              {errors.location && (
                <p className="mt-1 text-[14px] text-red-500" role="alert">
                  {errors.location}
                </p>
              )}
            </div>

            {/* Latitude + Longitude row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="device-lat" className={labelClass}>
                  Latitude
                </label>
                <input
                  id="device-lat"
                  type="text"
                  inputMode="decimal"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="e.g. 39.74"
                  className={cn(inputClass, errors.lat && "border-red-400")}
                />
                {errors.lat && (
                  <p className="mt-1 text-[14px] text-red-500" role="alert">
                    {errors.lat}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="device-lng" className={labelClass}>
                  Longitude
                </label>
                <input
                  id="device-lng"
                  type="text"
                  inputMode="decimal"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="e.g. -104.99"
                  className={cn(inputClass, errors.lng && "border-red-400")}
                />
                {errors.lng && (
                  <p className="mt-1 text-[14px] text-red-500" role="alert">
                    {errors.lng}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className={cn(
                  "h-10 cursor-pointer rounded-lg border border-gray-200 bg-white px-5 text-[15px] font-medium text-gray-700",
                  "hover:bg-gray-50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900]",
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={cn(
                  "h-10 cursor-pointer rounded-lg bg-[#FF7900] px-5 text-[15px] font-medium text-white",
                  "hover:bg-[#e86e00]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900] focus-visible:ring-offset-2",
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

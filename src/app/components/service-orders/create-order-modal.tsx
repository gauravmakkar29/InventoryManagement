import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import type {
  ServiceOrder,
  Priority,
  ServiceType,
} from "../../../lib/mock-data/service-order-data";
import { TECHNICIANS } from "../../../lib/mock-data/service-order-data";

/* ─── Create Order Modal ──────────────────────────────────────────── */

export function CreateOrderModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (order: ServiceOrder) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [technician, setTechnician] = useState(TECHNICIANS[0]);
  const [serviceType, setServiceType] = useState<ServiceType>("Internal");
  const [location, setLocation] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [customer, setCustomer] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !technician || !location.trim() || !scheduledDate || !customer.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const order: ServiceOrder = {
      id: "", // will be set by parent
      title: title.trim(),
      description: description.trim(),
      technician,
      scheduledDate,
      priority,
      serviceType,
      status: "Scheduled",
      location: location.trim(),
      customer: customer.trim(),
    };

    onCreate(order);
  };

  const inputClasses =
    "w-full rounded border border-border bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-accent-text";
  const labelClasses = "block text-[13px] font-semibold text-foreground mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-bold text-foreground">Create Service Order</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 p-5">
          {/* Title */}
          <div>
            <label htmlFor="so-title" className={labelClasses}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="so-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Quarterly inverter inspection"
              className={inputClasses}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="so-description" className={labelClasses}>
              Description
            </label>
            <textarea
              id="so-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={2}
              className={cn(inputClasses, "resize-none")}
            />
          </div>

          {/* Two-column row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Technician */}
            <div>
              <label htmlFor="so-technician" className={labelClasses}>
                Technician <span className="text-red-500">*</span>
              </label>
              <select
                id="so-technician"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                className={inputClasses}
                required
              >
                {TECHNICIANS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="so-priority" className={labelClasses}>
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                id="so-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className={inputClasses}
                required
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Service Type (radio) */}
          <div>
            <label id="so-service-type-label" className={labelClasses}>
              Service Type <span className="text-red-500">*</span>
            </label>
            <div
              role="radiogroup"
              aria-labelledby="so-service-type-label"
              className="flex gap-4 mt-1"
            >
              {(["Internal", "3rd Party"] as const).map((t) => (
                <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="serviceType"
                    value={t}
                    checked={serviceType === t}
                    onChange={() => setServiceType(t)}
                    className="accent-[#FF7900]"
                  />
                  <span className="text-sm text-foreground">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Two-column row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Location */}
            <div>
              <label htmlFor="so-location" className={labelClasses}>
                Location <span className="text-red-500">*</span>
              </label>
              <input
                id="so-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Denver"
                className={inputClasses}
                required
              />
            </div>

            {/* Scheduled Date */}
            <div>
              <label htmlFor="so-scheduled-date" className={labelClasses}>
                Scheduled Date <span className="text-red-500">*</span>
              </label>
              <input
                id="so-scheduled-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className={inputClasses}
                required
              />
            </div>
          </div>

          {/* Customer */}
          <div>
            <label htmlFor="so-customer" className={labelClasses}>
              Customer <span className="text-red-500">*</span>
            </label>
            <input
              id="so-customer"
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g., SolarEdge Corp"
              className={inputClasses}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
            >
              Create Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

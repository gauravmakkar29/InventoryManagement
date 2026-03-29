import { useState, useCallback } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import type { Role } from "../../../lib/rbac";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InviteUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  department: string;
  customer: string;
}

interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (payload: InviteUserPayload) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLES: Role[] = ["Admin", "Manager", "Technician", "Viewer", "CustomerAdmin"];

const DEPARTMENTS = [
  "Engineering",
  "Operations",
  "Quality Assurance",
  "Field Services",
  "IT Security",
  "Supply Chain",
  "Customer Success",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InviteUserModal({ open, onClose, onInvite }: InviteUserModalProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<Role>("Viewer");
  const [department, setDepartment] = useState("");
  const [customer, setCustomer] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = useCallback(() => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setRole("Viewer");
    setDepartment("");
    setCustomer("");
    setErrors({});
  }, []);

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};

    if (!firstName.trim()) next.firstName = "First name is required";
    if (!lastName.trim()) next.lastName = "Last name is required";
    if (!email.trim()) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Invalid email format";
    }
    if (!department) next.department = "Department is required";
    if (role === "CustomerAdmin" && !customer.trim()) {
      next.customer = "Customer is required for CustomerAdmin role";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [email, firstName, lastName, role, department, customer]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      onInvite({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        department,
        customer: customer.trim(),
      });

      toast.success("Invitation sent", {
        description: `${firstName.trim()} ${lastName.trim()} has been invited as ${role}.`,
      });

      resetForm();
      onClose();
    },
    [
      email,
      firstName,
      lastName,
      role,
      department,
      customer,
      validate,
      onInvite,
      onClose,
      resetForm,
    ],
  );

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  if (!open) return null;

  const inputClass =
    "h-10 w-full border border-gray-200 bg-white px-3 text-[14px] text-gray-900 placeholder:text-gray-400 rounded-lg focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]";

  const labelClass = "block text-[13px] font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} aria-hidden="true" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-[480px] rounded-2xl bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Invite user"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-[16px] font-semibold text-gray-900">Invite User</h3>
          <button
            onClick={handleClose}
            className={cn(
              "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-400",
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
          {/* Email */}
          <div>
            <label htmlFor="invite-email" className={labelClass}>
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@company.com"
              className={cn(inputClass, errors.email && "border-red-400")}
            />
            {errors.email && <p className="mt-1 text-[12px] text-red-500">{errors.email}</p>}
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="invite-first-name" className={labelClass}>
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="invite-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className={cn(inputClass, errors.firstName && "border-red-400")}
              />
              {errors.firstName && (
                <p className="mt-1 text-[12px] text-red-500">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label htmlFor="invite-last-name" className={labelClass}>
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="invite-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Martinez"
                className={cn(inputClass, errors.lastName && "border-red-400")}
              />
              {errors.lastName && (
                <p className="mt-1 text-[12px] text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Role */}
          <div>
            <label htmlFor="invite-role" className={labelClass}>
              Role <span className="text-red-500">*</span>
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className={inputClass}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label htmlFor="invite-department" className={labelClass}>
              Department <span className="text-red-500">*</span>
            </label>
            <select
              id="invite-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={cn(inputClass, errors.department && "border-red-400")}
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.department && (
              <p className="mt-1 text-[12px] text-red-500">{errors.department}</p>
            )}
          </div>

          {/* Customer — visible only for CustomerAdmin */}
          {role === "CustomerAdmin" && (
            <div>
              <label htmlFor="invite-customer" className={labelClass}>
                Customer <span className="text-red-500">*</span>
              </label>
              <input
                id="invite-customer"
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="e.g. Sungrow Power"
                className={cn(inputClass, errors.customer && "border-red-400")}
              />
              {errors.customer && (
                <p className="mt-1 text-[12px] text-red-500">{errors.customer}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className={cn(
                "h-10 cursor-pointer rounded-lg border border-gray-200 bg-white px-5 text-[14px] font-medium text-gray-700",
                "hover:bg-gray-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900]",
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                "h-10 cursor-pointer rounded-lg bg-[#FF7900] px-5 text-[14px] font-medium text-white",
                "hover:bg-[#e86e00]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900] focus-visible:ring-offset-2",
              )}
            >
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

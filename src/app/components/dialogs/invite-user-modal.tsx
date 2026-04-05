import FocusTrap from "focus-trap-react";
import { useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/rbac";
import { FormField } from "@/components/form/form-field";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";

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
          className="relative z-10 w-full max-w-[480px] rounded-2xl bg-card shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Invite user"
        >
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <h3 className="text-[16px] font-semibold text-foreground">Invite User</h3>
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
            <FormField label="Email" htmlFor="invite-email" required error={errors.email}>
              <FormInput
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@company.com"
                error={!!errors.email}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="First Name"
                htmlFor="invite-first-name"
                required
                error={errors.firstName}
              >
                <FormInput
                  id="invite-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  error={!!errors.firstName}
                />
              </FormField>
              <FormField
                label="Last Name"
                htmlFor="invite-last-name"
                required
                error={errors.lastName}
              >
                <FormInput
                  id="invite-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Martinez"
                  error={!!errors.lastName}
                />
              </FormField>
            </div>

            <FormField label="Role" htmlFor="invite-role" required>
              <FormSelect
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </FormSelect>
            </FormField>

            <FormField
              label="Department"
              htmlFor="invite-department"
              required
              error={errors.department}
            >
              <FormSelect
                id="invite-department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                error={!!errors.department}
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </FormSelect>
            </FormField>

            {role === "CustomerAdmin" && (
              <FormField
                label="Customer"
                htmlFor="invite-customer"
                required
                error={errors.customer}
              >
                <FormInput
                  id="invite-customer"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="e.g. Sungrow Power"
                  error={!!errors.customer}
                />
              </FormField>
            )}

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
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      </div>
    </FocusTrap>
  );
}

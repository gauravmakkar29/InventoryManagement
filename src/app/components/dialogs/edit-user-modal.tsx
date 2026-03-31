import { useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import type { Role } from "../../../lib/rbac";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EditUserData {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
}

export interface EditUserPayload {
  id: string;
  role: Role;
  department: string;
}

interface EditUserModalProps {
  open: boolean;
  user: EditUserData | null;
  onClose: () => void;
  onSave: (payload: EditUserPayload) => void;
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

export function EditUserModal({ open, user, onClose, onSave }: EditUserModalProps) {
  const [role, setRole] = useState<Role>("Viewer");
  const [department, setDepartment] = useState("");

  // Sync local state when user prop changes
  useEffect(() => {
    if (user) {
      setRole(user.role);
      setDepartment(user.department);
    }
  }, [user]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;

      onSave({ id: user.id, role, department });

      toast.success("User updated", {
        description: `${user.name}'s role is now ${role}.`,
      });

      onClose();
    },
    [user, role, department, onSave, onClose],
  );

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !user) return null;

  const inputClass =
    "h-10 w-full border border-gray-200 bg-white px-3 text-[14px] text-gray-900 rounded-lg focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]";

  const labelClass = "block text-[13px] font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-[440px] rounded-2xl bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Edit user"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-[16px] font-semibold text-gray-900">Edit User</h3>
          <button
            onClick={onClose}
            className={cn(
              "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500",
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
          {/* User info (read-only) */}
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-[14px] font-medium text-gray-900">{user.name}</p>
            <p className="mt-0.5 text-[13px] text-gray-500">{user.email}</p>
          </div>

          {/* Role */}
          <div>
            <label htmlFor="edit-role" className={labelClass}>
              Role
            </label>
            <select
              id="edit-role"
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
            <label htmlFor="edit-department" className={labelClass}>
              Department
            </label>
            <select
              id="edit-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={inputClass}
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
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
                "h-10 cursor-pointer rounded-lg bg-[#2563eb] px-5 text-[14px] font-medium text-white",
                "hover:bg-[#1d4ed8]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2",
              )}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

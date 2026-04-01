import { useState, useMemo, useCallback } from "react";
import { Search, UserPlus, Pencil, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/use-auth";
import { getPrimaryRole } from "../../lib/rbac";
import type { Role } from "../../lib/rbac";
import { InviteUserModal } from "./dialogs/invite-user-modal";
import type { InviteUserPayload } from "./dialogs/invite-user-modal";
import { EditUserModal } from "./dialogs/edit-user-modal";
import type { EditUserData, EditUserPayload } from "./dialogs/edit-user-modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UserStatus = "Active" | "Invited" | "Disabled";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  status: UserStatus;
  lastLogin: string | null;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const INITIAL_USERS: ManagedUser[] = [
  {
    id: "usr-001",
    name: "Gaurav Makkar",
    email: "gaurav.makkar@imsgen2.com",
    role: "Admin",
    department: "Engineering",
    status: "Active",
    lastLogin: "2026-03-29T08:12:00Z",
  },
  {
    id: "usr-002",
    name: "Jenna Martinez",
    email: "j.martinez@imsgen2.com",
    role: "Manager",
    department: "Operations",
    status: "Active",
    lastLogin: "2026-03-28T14:45:00Z",
  },
  {
    id: "usr-003",
    name: "Arun Chen",
    email: "a.chen@imsgen2.com",
    role: "Technician",
    department: "Field Services",
    status: "Active",
    lastLogin: "2026-03-29T06:30:00Z",
  },
  {
    id: "usr-004",
    name: "Sarah Kim",
    email: "s.kim@imsgen2.com",
    role: "Viewer",
    department: "Quality Assurance",
    status: "Active",
    lastLogin: "2026-03-27T10:20:00Z",
  },
  {
    id: "usr-005",
    name: "Marcus Johnson",
    email: "m.johnson@imsgen2.com",
    role: "CustomerAdmin",
    department: "Customer Success",
    status: "Active",
    lastLogin: "2026-03-28T16:55:00Z",
  },
  {
    id: "usr-006",
    name: "Lisa Park",
    email: "l.park@imsgen2.com",
    role: "Manager",
    department: "IT Security",
    status: "Invited",
    lastLogin: null,
  },
  {
    id: "usr-007",
    name: "Robert Davis",
    email: "r.davis@imsgen2.com",
    role: "Technician",
    department: "Supply Chain",
    status: "Disabled",
    lastLogin: "2026-02-14T09:00:00Z",
  },
  {
    id: "usr-008",
    name: "Priya Sharma",
    email: "p.sharma@imsgen2.com",
    role: "Admin",
    department: "Engineering",
    status: "Active",
    lastLogin: "2026-03-29T07:48:00Z",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<UserStatus, { dot: string; bg: string; text: string }> = {
  Active: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  Invited: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  Disabled: { dot: "bg-gray-400", bg: "bg-gray-100", text: "text-gray-500" },
};

function formatLastLogin(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// ---------------------------------------------------------------------------
// Roles for filter
// ---------------------------------------------------------------------------

const ROLE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "All Roles", value: "" },
  { label: "Admin", value: "Admin" },
  { label: "Manager", value: "Manager" },
  { label: "Technician", value: "Technician" },
  { label: "Viewer", value: "Viewer" },
  { label: "CustomerAdmin", value: "CustomerAdmin" },
];

// ---------------------------------------------------------------------------
// UserManagement Component
// ---------------------------------------------------------------------------

export function UserManagement() {
  const { groups } = useAuth();
  const currentRole = getPrimaryRole(groups);
  const isAdmin = currentRole === "Admin";

  const [users, setUsers] = useState<ManagedUser[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EditUserData | null>(null);

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      const matchesSearch =
        !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesRole = !roleFilter || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleInvite = useCallback((payload: InviteUserPayload) => {
    const newUser: ManagedUser = {
      id: `usr-${Date.now()}`,
      name: `${payload.firstName} ${payload.lastName}`,
      email: payload.email,
      role: payload.role,
      department: payload.department,
      status: "Invited",
      lastLogin: null,
    };
    setUsers((prev) => [newUser, ...prev]);
  }, []);

  const handleEdit = useCallback((user: ManagedUser) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    });
    setEditOpen(true);
  }, []);

  const handleSaveEdit = useCallback((payload: EditUserPayload) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === payload.id ? { ...u, role: payload.role, department: payload.department } : u,
      ),
    );
  }, []);

  const handleToggleStatus = useCallback((user: ManagedUser) => {
    const nextStatus: UserStatus = user.status === "Disabled" ? "Active" : "Disabled";
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
    toast.success(nextStatus === "Disabled" ? "User disabled" : "User enabled", {
      description: `${user.name} is now ${nextStatus.toLowerCase()}.`,
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-medium text-gray-900">User Management</h2>
          <p className="mt-0.5 text-[14px] text-gray-500">
            Manage platform users, roles, and access permissions
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setInviteOpen(true)}
            className={cn(
              "flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#FF7900] px-4 text-[15px] font-medium text-white",
              "hover:bg-[#e86e00]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900] focus-visible:ring-offset-2",
            )}
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Invite User
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-[360px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            aria-label="Search users"
            className={cn(
              "h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-[15px] text-gray-900 placeholder:text-gray-500",
              "focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]",
            )}
          />
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={cn(
            "h-10 rounded-lg border border-gray-200 bg-white px-3 pr-8 text-[15px] text-gray-700",
            "focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]",
          )}
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Count */}
        <span className="text-[14px] text-gray-500">
          {filteredUsers.length} of {users.length} users
        </span>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">User accounts</caption>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th
                  scope="col"
                  className="px-5 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-gray-500"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-gray-500"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-gray-500"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-gray-500"
                >
                  Department
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-gray-500"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-gray-500"
                >
                  Last Login
                </th>
                {isAdmin && (
                  <th
                    scope="col"
                    className="px-5 py-3 text-right text-[13px] font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    className="px-5 py-12 text-center text-[15px] text-gray-500"
                  >
                    No users match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, i) => {
                  const statusCfg = STATUS_CONFIG[user.status];
                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        "h-[52px] border-b border-gray-50",
                        i % 2 === 1 && "bg-gray-50/30",
                        "hover:bg-blue-50/30",
                      )}
                    >
                      {/* Name */}
                      <td className="px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white",
                              user.status === "Disabled" ? "bg-gray-400" : "bg-[#0f172a]",
                            )}
                          >
                            {getUserInitials(user.name)}
                          </div>
                          <span
                            className={cn(
                              "text-[15px] font-medium",
                              user.status === "Disabled" ? "text-gray-500" : "text-gray-900",
                            )}
                          >
                            {user.name}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 text-[14px] text-gray-600">{user.email}</td>

                      {/* Role */}
                      <td className="px-4">
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2 py-0.5 text-[14px] font-medium",
                            user.role === "Admin" && "bg-blue-50 text-[#2563eb]",
                            user.role === "Manager" && "bg-purple-50 text-purple-700",
                            user.role === "Technician" && "bg-orange-50 text-[#FF7900]",
                            user.role === "Viewer" && "bg-gray-100 text-gray-600",
                            user.role === "CustomerAdmin" && "bg-emerald-50 text-emerald-700",
                          )}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-4 text-[14px] text-gray-600">{user.department}</td>

                      {/* Status */}
                      <td className="px-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[14px] font-medium",
                            statusCfg.bg,
                            statusCfg.text,
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
                          {user.status}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="px-4 text-[14px] text-gray-500 tabular-nums">
                        {formatLastLogin(user.lastLogin)}
                      </td>

                      {/* Actions */}
                      {isAdmin && (
                        <td className="px-5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(user)}
                              className={cn(
                                "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500",
                                "hover:bg-gray-100 hover:text-gray-600",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]",
                              )}
                              aria-label={`Edit ${user.name}`}
                              title="Edit user"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={cn(
                                "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg",
                                user.status === "Disabled"
                                  ? "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
                                  : "text-gray-500 hover:bg-red-50 hover:text-red-500",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]",
                              )}
                              aria-label={
                                user.status === "Disabled"
                                  ? `Enable ${user.name}`
                                  : `Disable ${user.name}`
                              }
                              title={user.status === "Disabled" ? "Enable user" : "Disable user"}
                            >
                              {user.status === "Disabled" ? (
                                <CheckCircle className="h-3.5 w-3.5" />
                              ) : (
                                <Ban className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <InviteUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />
      <EditUserModal
        open={editOpen}
        user={editingUser}
        onClose={() => {
          setEditOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveEdit}
      />
    </div>
  );
}

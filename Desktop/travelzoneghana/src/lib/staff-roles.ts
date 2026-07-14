import type { StaffRole } from "@/lib/supabase/auth";

export const STAFF_ROLES: Record<
  StaffRole,
  {
    label: string;
    description: string;
    capabilities: string[];
  }
> = {
  admin: {
    label: "Administrator",
    description: "Full access to the dashboard, settings, and user management.",
    capabilities: [
      "Manage tours, posts, bookings, and newsletter",
      "Change site settings and payment integrations",
      "Add, edit, and remove staff users",
      "Delete tours and blog posts",
    ],
  },
  editor: {
    label: "Editor",
    description: "Can manage content and bookings, but not settings or users.",
    capabilities: [
      "Manage tours, posts, bookings, and newsletter",
      "Cannot access settings or users",
      "Cannot delete tours or blog posts",
    ],
  },
};

export const STAFF_ROLE_OPTIONS: StaffRole[] = ["admin", "editor"];

export function isStaffRole(value: string): value is StaffRole {
  return value === "admin" || value === "editor";
}

export function getStaffRoleLabel(role: StaffRole) {
  return STAFF_ROLES[role].label;
}

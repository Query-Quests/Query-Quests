"use client";

import { cn } from "@/lib/utils";

/**
 * UserRoleBadge - Small uppercase role pill matching the Pencil design.
 *
 * @param {Object} props
 * @param {Object} props.user - User object with isAdmin and isTeacher properties
 * @param {string} props.className - Additional CSS classes
 */
export function UserRoleBadge({ user, className }) {
  const role = user?.isAdmin
    ? { label: "Admin", text: "#92400e", bg: "#fef3c7" }
    : user?.isTeacher
    ? { label: "Teacher", text: "#1d4ed8", bg: "#eff6ff" }
    : { label: "Student", text: "#15934d", bg: "#ecfdf5" };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-[2px] text-[9px] font-bold uppercase",
        className
      )}
      style={{
        color: role.text,
        backgroundColor: role.bg,
        letterSpacing: "1px",
      }}
    >
      {role.label}
    </span>
  );
}

export default UserRoleBadge;

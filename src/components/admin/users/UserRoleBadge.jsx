"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * UserRoleBadge - Displays a user's role with appropriate styling
 *
 * @param {Object} props
 * @param {Object} props.user - User object with isAdmin and isTeacher properties
 * @param {string} props.className - Additional CSS classes
 */
export function UserRoleBadge({ user, className }) {
  if (user?.isAdmin) {
    return (
      <Badge
        className={cn(
          "bg-red-100 text-red-700 hover:bg-red-100 border-red-200",
          className
        )}
      >
        Admin
      </Badge>
    );
  }

  if (user?.isTeacher) {
    return (
      <Badge
        className={cn(
          "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
          className
        )}
      >
        Teacher
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200",
        className
      )}
    >
      Student
    </Badge>
  );
}

export default UserRoleBadge;

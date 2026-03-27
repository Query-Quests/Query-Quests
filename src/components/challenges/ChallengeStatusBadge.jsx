"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Challenge status badge component
 * - Active: Green badge
 * - Inactive: Gray badge
 */

const statusConfig = {
  active: {
    label: "Active",
    className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  },
  inactive: {
    label: "Inactive",
    className: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100",
  },
};

export function ChallengeStatusBadge({ isActive = true, className }) {
  const status = isActive ? "active" : "inactive";
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium whitespace-nowrap",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}

export function getStatusConfig(isActive) {
  return isActive ? statusConfig.active : statusConfig.inactive;
}

export default ChallengeStatusBadge;

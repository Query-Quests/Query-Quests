"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import {
  LogIn,
  LogOut,
  Trophy,
  Play,
  UserPlus,
  UserMinus,
  Settings,
  Key,
  Shield,
  Edit,
  Activity,
} from "lucide-react";

// Activity type configuration with icons and colors
const activityConfig = {
  login: {
    label: "Login",
    icon: LogIn,
    variant: "default",
  },
  logout: {
    label: "Logout",
    icon: LogOut,
    variant: "secondary",
  },
  challenge_start: {
    label: "Challenge Started",
    icon: Play,
    variant: "outline",
  },
  challenge_complete: {
    label: "Challenge Completed",
    icon: Trophy,
    variant: "default",
  },
  user_created: {
    label: "User Created",
    icon: UserPlus,
    variant: "default",
  },
  user_updated: {
    label: "User Updated",
    icon: Edit,
    variant: "secondary",
  },
  user_deleted: {
    label: "User Deleted",
    icon: UserMinus,
    variant: "destructive",
  },
  settings_changed: {
    label: "Settings Changed",
    icon: Settings,
    variant: "secondary",
  },
  password_changed: {
    label: "Password Changed",
    icon: Key,
    variant: "outline",
  },
  role_changed: {
    label: "Role Changed",
    icon: Shield,
    variant: "default",
  },
};

function getActivityConfig(type) {
  return activityConfig[type] || {
    label: type || "Unknown",
    icon: Activity,
    variant: "secondary",
  };
}

function formatDateTime(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatRelativeTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDateTime(dateString);
}

export function ActivityDataTable({ data, isLoading = false, pageSize = 10 }) {
  const columns = useMemo(
    () => [
      {
        accessorKey: "type",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Activity" />
        ),
        cell: ({ row }) => {
          const type = row.getValue("type");
          const config = getActivityConfig(type);
          const Icon = config.icon;

          return (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <Badge variant={config.variant} className="text-xs">
                {config.label}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "user",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="User" />
        ),
        cell: ({ row }) => {
          const user = row.original.user;
          if (!user) return <span className="text-muted-foreground">-</span>;

          return (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-primary-foreground">
                  {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground truncate hidden sm:block">
                  {user.email}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
        cell: ({ row }) => {
          const description = row.getValue("description");
          return (
            <p className="text-sm text-muted-foreground max-w-[300px] truncate">
              {description || "-"}
            </p>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "ipAddress",
        header: "IP Address",
        cell: ({ row }) => {
          const ip = row.getValue("ipAddress");
          return (
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded hidden lg:inline-block">
              {ip || "-"}
            </code>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Time" />
        ),
        cell: ({ row }) => {
          const date = row.getValue("createdAt");
          return (
            <div className="text-right">
              <p className="text-sm">{formatRelativeTime(date)}</p>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {formatDateTime(date)}
              </p>
            </div>
          );
        },
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading activity...</p>
        </div>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      enablePagination={true}
      enableSorting={true}
      pageSize={pageSize}
      emptyState={
        <div className="flex flex-col items-center justify-center py-8">
          <Activity className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No activity found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Activity will appear here as users interact with the platform
          </p>
        </div>
      }
    />
  );
}

export { activityConfig, getActivityConfig };

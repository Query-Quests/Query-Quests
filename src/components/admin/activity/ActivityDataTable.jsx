"use client";

import { useMemo, useState } from "react";
import { Activity, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// Activity type configuration: label + colored pill (bg + text).
// Colors come straight from the Pencil design (event chips).
const activityConfig = {
  login: {
    label: "LOGIN",
    pillBg: "#dbeafe",
    pillText: "#1d4ed8",
  },
  logout: {
    label: "LOGOUT",
    pillBg: "#f3f4f6",
    pillText: "#374151",
  },
  challenge_start: {
    label: "CHALLENGE_STARTED",
    pillBg: "#e0f2fe",
    pillText: "#075985",
  },
  challenge_complete: {
    label: "CHALLENGE_SOLVED",
    pillBg: "#ecfdf5",
    pillText: "#15934d",
  },
  user_created: {
    label: "USER_CREATED",
    pillBg: "#dbeafe",
    pillText: "#1d4ed8",
  },
  user_updated: {
    label: "USER_UPDATED",
    pillBg: "#fef3c7",
    pillText: "#854d0e",
  },
  user_deleted: {
    label: "USER_DELETED",
    pillBg: "#fee2e2",
    pillText: "#991b1b",
  },
  settings_changed: {
    label: "SETTINGS_CHANGED",
    pillBg: "#fef3c7",
    pillText: "#854d0e",
  },
  password_changed: {
    label: "PASSWORD_CHANGED",
    pillBg: "#fee2e2",
    pillText: "#991b1b",
  },
  role_changed: {
    label: "ROLE_CHANGED",
    pillBg: "#fef3c7",
    pillText: "#854d0e",
  },
};

function getActivityConfig(type) {
  return (
    activityConfig[type] || {
      label: (type || "EVENT").toUpperCase(),
      pillBg: "#f3f4f6",
      pillText: "#374151",
    }
  );
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

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function ActivityDataTable({ data, isLoading = false, pageSize = 25 }) {
  const [pageIndex, setPageIndex] = useState(0);

  const total = data.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  const pageRows = useMemo(() => {
    const start = safePageIndex * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePageIndex, pageSize]);

  const showingFrom = total === 0 ? 0 : safePageIndex * pageSize + 1;
  const showingTo = Math.min(total, (safePageIndex + 1) * pageSize);

  return (
    <div className="flex flex-col gap-[14px] w-full">
      {/* Table card */}
      <div className="bg-white border border-gray-200 rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[220px_160px_minmax(0,1fr)_180px] gap-4 px-5 py-[13px] bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] font-bold text-gray-500 tracking-[1px]">
            EVENT
          </span>
          <span className="text-[11px] font-bold text-gray-500 tracking-[1px]">
            ACTOR
          </span>
          <span className="text-[11px] font-bold text-gray-500 tracking-[1px]">
            DETAILS
          </span>
          <span className="text-[11px] font-bold text-gray-500 tracking-[1px]">
            TIMESTAMP
          </span>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-[#19aa59]" />
          </div>
        ) : pageRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-[#030914] mb-1">
              No activity found
            </p>
            <p className="text-xs text-gray-500">
              Activity will appear here as users interact with the platform
            </p>
          </div>
        ) : (
          pageRows.map((row, idx) => {
            const cfg = getActivityConfig(row.type);
            const user = row.user || {};
            return (
              <div
                key={row.id ?? idx}
                className={
                  "grid grid-cols-[220px_160px_minmax(0,1fr)_180px] gap-4 items-center px-5 py-4" +
                  (idx < pageRows.length - 1 ? " border-b border-gray-200" : "")
                }
              >
                {/* EVENT pill */}
                <div className="flex items-center">
                  <span
                    className="inline-flex items-center px-[10px] py-[4px] rounded-full text-[10px] font-bold tracking-[1px]"
                    style={{
                      backgroundColor: cfg.pillBg,
                      color: cfg.pillText,
                    }}
                  >
                    {cfg.label}
                  </span>
                </div>

                {/* ACTOR */}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#030914] truncate">
                    {user.name || user.email || "Unknown"}
                  </p>
                </div>

                {/* DETAILS */}
                <div className="min-w-0">
                  <p className="text-[13px] text-gray-500 truncate">
                    {row.description || "-"}
                  </p>
                </div>

                {/* TIMESTAMP */}
                <div>
                  <p
                    className="text-[12px] text-gray-500"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {formatRelativeTime(row.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination card */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-5 py-[14px]">
        <span className="text-[12px] text-gray-500">
          {total === 0
            ? "No events"
            : `Showing ${showingFrom} to ${showingTo} of ${total.toLocaleString()} events`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
            disabled={safePageIndex === 0}
            className="inline-flex items-center gap-1.5 h-[28px] px-[10px] rounded-[8px] text-[12px] font-medium text-[#030914] bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <span className="text-[12px] text-gray-500 px-2">
            Page {safePageIndex + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
            disabled={safePageIndex >= pageCount - 1}
            className="inline-flex items-center gap-1.5 h-[28px] px-[10px] rounded-[8px] text-[12px] font-medium text-[#030914] bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export { activityConfig, getActivityConfig };

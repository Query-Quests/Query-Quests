"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRoleBadge } from "./UserRoleBadge";

const MONO_STYLE = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace",
};

const ROLE_CHIPS = [
  { value: "all", label: "All" },
  { value: "student", label: "Students" },
  { value: "teacher", label: "Teachers" },
  { value: "admin", label: "Admins" },
];

function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatRelative(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  const diffMs = Date.now() - d.getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

/**
 * UsersDataTable — Pencil-styled card with header, filter chips, table, pagination.
 * Preserves all original props and functional features.
 */
export function UsersDataTable({
  data = [],
  isLoading = false,
  isSearching = false,
  searchValue = "",
  onSearchChange,
  roleFilter = "all",
  onRoleFilterChange,
  institutionFilter = "all",
  onInstitutionFilterChange,
  institutions = [],
  onEdit,
  onDelete,
  onBulkDelete,
  pageSize = 25,
  onPageSizeChange,
  pagination,
  currentPage = 1,
  onPageChange,
  currentUser,
}) {
  const [selected, setSelected] = React.useState(() => new Set());

  // Reset selection when data changes
  React.useEffect(() => {
    setSelected(new Set());
  }, [data]);

  const isTeacherOnly =
    currentUser?.isTeacher && !currentUser?.isAdmin && currentUser?.institution_id;

  const allOnPageSelected =
    data.length > 0 && data.every((u) => selected.has(u.id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allOnPageSelected) {
        const next = new Set(prev);
        data.forEach((u) => next.delete(u.id));
        return next;
      }
      const next = new Set(prev);
      data.forEach((u) => next.add(u.id));
      return next;
    });
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selected.size;

  const handleBulkDelete = () => {
    if (selectedCount > 0 && onBulkDelete) {
      onBulkDelete(Array.from(selected));
    }
  };

  const teacherInstitutionName =
    institutions.find(
      (i) =>
        i.id === currentUser?.institution_id ||
        i.id === parseInt(currentUser?.institution_id)
    )?.name ||
    currentUser?.institution?.name ||
    "Your Institution";

  const totalUsers = pagination?.totalUsers ?? data.length;
  const totalPages = pagination?.totalPages ?? 1;
  const fromIndex = totalUsers === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toIndex = Math.min(currentPage * pageSize, totalUsers);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Toolbar: search + role chips + institution view */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, email, or institution..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-10 pr-3 h-10 text-[13px] bg-white border border-gray-200 rounded-[10px] placeholder:text-gray-400 focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/15"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {ROLE_CHIPS.map((chip) => {
            const active = roleFilter === chip.value;
            return (
              <button
                key={chip.value}
                onClick={() => onRoleFilterChange?.(chip.value)}
                className={cn(
                  "h-8 px-3.5 rounded-lg text-[12px] font-medium transition-colors",
                  active
                    ? "bg-[#19aa59] text-white shadow-[0_1px_2px_rgba(16,185,129,0.2)]"
                    : "bg-white text-[#030914] border border-gray-200 hover:bg-gray-50"
                )}
                style={{ letterSpacing: "0.1px" }}
              >
                {chip.label}
              </button>
            );
          })}

          {/* Institution filter — kept as Select shaped like the View button */}
          {isTeacherOnly ? (
            <span
              className="h-8 px-3.5 rounded-lg text-[12px] font-medium text-gray-500 bg-gray-100 border border-gray-200 flex items-center gap-1.5"
              title="Restricted to your institution"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {teacherInstitutionName}
            </span>
          ) : (
            <Select value={institutionFilter} onValueChange={onInstitutionFilterChange}>
              <SelectTrigger
                className="h-8 px-3.5 rounded-lg text-[12px] font-medium text-[#030914] bg-white border border-gray-200 gap-1.5 focus:ring-0 focus:ring-offset-0"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <SelectValue placeholder="Institution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All institutions</SelectItem>
                {institutions.map((institution) => (
                  <SelectItem key={institution.id} value={institution.id.toString()}>
                    {institution.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Selection bar */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-[10px] bg-[#f9fafb] border border-gray-200 text-[12px]">
          <span className="text-gray-500">
            <span className="font-semibold text-[#030914]">{selectedCount}</span>{" "}
            selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-red-600 hover:bg-red-50 font-medium"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete selected
          </button>
        </div>
      )}

      {/* Table card */}
      <div
        className="rounded-xl bg-white border border-gray-200 overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        {/* Header row */}
        <div
          className="grid items-center gap-4 px-5 py-3 bg-[#f9fafb] border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase"
          style={{
            letterSpacing: "1px",
            gridTemplateColumns:
              "16px minmax(0,1fr) 160px 110px 80px 80px 100px 24px",
          }}
        >
          <input
            type="checkbox"
            checked={allOnPageSelected}
            onChange={toggleAll}
            aria-label="Select all"
            className="h-4 w-4 rounded border-gray-300 accent-[#19aa59]"
          />
          <span>Name</span>
          <span>Institution</span>
          <span>Role</span>
          <span>Solved</span>
          <span>Status</span>
          <span>Last active</span>
          <span aria-hidden="true" />
        </div>

        {/* Body */}
        {isSearching || isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#19aa59] mx-auto mb-3" />
              <p className="text-[13px] text-gray-500">
                {isSearching ? "Searching..." : "Loading users..."}
              </p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-[13px] font-semibold text-[#030914]">No users found</p>
            <p className="text-[12px] text-gray-500">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          data.map((user, idx) => {
            const isSelected = selected.has(user.id);
            const isLast = idx === data.length - 1;
            return (
              <div
                key={user.id}
                className={cn(
                  "grid items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors",
                  !isLast && "border-b border-gray-200",
                  isSelected && "bg-[#f0fdf4]"
                )}
                style={{
                  gridTemplateColumns:
                    "16px minmax(0,1fr) 160px 110px 80px 80px 100px 24px",
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOne(user.id)}
                  aria-label={`Select ${user.name}`}
                  className="h-4 w-4 rounded border-gray-300 accent-[#19aa59]"
                />

                {/* Name + email */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#19aa59] text-white text-[11px] font-bold flex-shrink-0">
                    {getInitials(user.name)}
                  </span>
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <p className="text-[13px] font-semibold text-[#030914] truncate">
                      {user.name}
                    </p>
                    <p
                      className="text-[11px] text-gray-500 truncate"
                      style={MONO_STYLE}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Institution */}
                <span className="text-[13px] text-[#030914] truncate">
                  {user.institution?.name || "—"}
                </span>

                {/* Role */}
                <UserRoleBadge user={user} />

                {/* Solved */}
                <span
                  className="text-[13px] font-semibold text-[#030914]"
                  style={MONO_STYLE}
                >
                  {user.solvedChallenges ?? 0}
                </span>

                {/* Status */}
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      user.is_active === false ? "bg-gray-400" : "bg-emerald-500"
                    )}
                  />
                  <span className="text-[12px] text-gray-700">
                    {user.is_active === false ? "Archived" : "Active"}
                  </span>
                </span>

                {/* Last active */}
                <span className="text-[12px] text-gray-500">
                  {formatRelative(user.last_login)}
                </span>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label="Open user actions"
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md text-gray-500 hover:text-[#030914] hover:bg-gray-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(user)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete?.(user)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination footer */}
      {pagination && totalUsers > 0 && (
        <div
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white border border-gray-200 px-5 py-3.5"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-gray-500">
              Showing {fromIndex} to {toIndex} of {totalUsers} users
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-gray-500">Rows</span>
              <Select
                value={pageSize.toString()}
                onValueChange={onPageSizeChange}
              >
                <SelectTrigger className="h-7 w-[64px] text-[12px] border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-gray-200 text-[12px] font-medium text-[#030914] bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <span className="text-[12px] text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-gray-200 text-[12px] font-medium text-[#030914] bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersDataTable;

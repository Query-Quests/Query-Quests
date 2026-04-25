"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Loader2,
  Database,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react";

const STATUS_PILL = {
  ready: { label: "ACTIVE", bg: "bg-emerald-50", fg: "text-[#15934d]" },
  processing: { label: "PROCESSING", bg: "bg-amber-50", fg: "text-amber-700" },
  error: { label: "ERROR", bg: "bg-red-50", fg: "text-red-700" },
};

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const MONO = "var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace";

export default function DatabasesDataTable({
  data,
  isLoading,
  isSearching,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  institutionFilter,
  onInstitutionFilterChange,
  institutions,
  onViewSchema,
  onDelete,
  pageSize,
  onPageSizeChange,
  pagination,
  currentPage,
  onPageChange,
  currentUser,
  onUploadClick,
}) {
  const isTeacher = currentUser?.isTeacher && !currentUser?.isAdmin;

  return (
    <div className="flex flex-col gap-5">
      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search databases…"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-9 h-10 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/20"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>

          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[140px] h-10 rounded-lg border-gray-200 bg-white text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          {!isTeacher && (
            <Select
              value={institutionFilter}
              onValueChange={onInstitutionFilterChange}
            >
              <SelectTrigger className="w-[180px] h-10 rounded-lg border-gray-200 bg-white text-sm">
                <SelectValue placeholder="Institution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All institutions</SelectItem>
                <SelectItem value="null">No institution</SelectItem>
                {institutions.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Per page</span>
          <Select value={pageSize.toString()} onValueChange={onPageSizeChange}>
            <SelectTrigger className="w-[80px] h-10 rounded-lg border-gray-200 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#19aa59]" />
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 py-16 px-6 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Database className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-[#030914] mb-1">
            {searchValue ? "No matches" : "No databases yet"}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            {searchValue
              ? "Try a different search term."
              : "Upload a .sql dump to make a sandbox database available."}
          </p>
          {!searchValue && onUploadClick && (
            <button
              type="button"
              onClick={onUploadClick}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-[#19aa59] hover:bg-[#15934d] text-white text-[13px] font-bold transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload SQL dump
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((database) => (
            <DatabaseCard
              key={database.id}
              database={database}
              onViewSchema={onViewSchema}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && data.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500">
            Showing {data.length} of {pagination.totalDatabases} databases
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-gray-200 bg-white text-xs font-semibold text-[#030914] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <div
              className="text-xs text-gray-500"
              style={{ fontFamily: MONO }}
            >
              Page {currentPage} of {pagination.totalPages || 1}
            </div>
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-gray-200 bg-white text-xs font-semibold text-[#030914] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
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

function DatabaseCard({ database, onViewSchema, onDelete }) {
  const status = STATUS_PILL[database.status] ?? {
    label: (database.status || "—").toUpperCase(),
    bg: "bg-gray-100",
    fg: "text-gray-600",
  };
  const isProcessing = database.status === "processing";

  return (
    <div
      className="relative rounded-xl bg-white border border-gray-200 p-6 flex flex-col gap-3.5"
      style={{ boxShadow: "0 2px 10px rgba(10, 18, 32, 0.06)" }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="h-11 w-11 rounded-xl bg-[#030914] flex items-center justify-center shrink-0">
          <Database className="h-[22px] w-[22px] text-[#19aa59]" />
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[10px] font-bold ${status.bg} ${status.fg}`}
            style={{ letterSpacing: "0.8px" }}
          >
            {isProcessing && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
            {status.label}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                aria-label="Database actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onViewSchema(database)}
                disabled={database.status !== "ready"}
              >
                <Eye className="mr-2 h-4 w-4" />
                View schema
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(database)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title */}
      <h3
        className="text-[18px] font-bold text-[#030914] tracking-[-0.2px] leading-tight"
        style={{ fontFamily: MONO }}
      >
        {database.name}
      </h3>

      {/* Description */}
      {database.description ? (
        <p className="text-[13px] text-gray-500 leading-[1.5] line-clamp-2">
          {database.description}
        </p>
      ) : (
        <p className="text-[13px] text-gray-400 italic leading-[1.5]">
          No description provided.
        </p>
      )}

      {/* Stats row */}
      <div className="flex items-end gap-6 pt-1.5">
        <Stat value={database.tableCount ?? 0} label="tables" />
        <Stat value={database._count?.challenges ?? 0} label="challenges" />
        <Stat
          value={(database.rowCount ?? 0).toLocaleString()}
          label="rows"
        />
      </div>

      {/* Footer row: filename + size + date */}
      <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-gray-100">
        <span
          className="text-[11px] text-gray-500 truncate"
          style={{ fontFamily: MONO }}
          title={database.filename}
        >
          {database.filename || "—"}
        </span>
        <div
          className="flex items-center gap-2 text-[11px] text-gray-500 shrink-0"
          style={{ fontFamily: MONO }}
        >
          <span>{formatFileSize(database.filesize)}</span>
          <span className="text-gray-300">·</span>
          <span>{formatDate(database.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-[20px] font-bold text-[#030914] leading-none"
        style={{ fontFamily: MONO, letterSpacing: "-0.3px" }}
      >
        {value}
      </span>
      <span
        className="text-[11px] font-semibold text-gray-500 uppercase"
        style={{ letterSpacing: "0.3px" }}
      >
        {label}
      </span>
    </div>
  );
}

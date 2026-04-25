"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Trash2,
  Edit,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChallengeDifficultyBadge } from "./ChallengeDifficultyBadge";
import { ChallengeStatusBadge } from "./ChallengeStatusBadge";

// Column header with sorting — Pencil style: uppercase, 11px, tracked, muted
function ColumnHeader({ column, title, className }) {
  const labelClass = cn(
    "text-[11px] font-bold uppercase text-gray-500",
    className
  );

  if (!column.getCanSort()) {
    return (
      <span
        className={labelClass}
        style={{ letterSpacing: "1px" }}
      >
        {title}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className={cn(
        labelClass,
        "inline-flex items-center gap-1 hover:text-[#030914]"
      )}
      style={{ letterSpacing: "1px" }}
    >
      <span>{title}</span>
      {column.getIsSorted() === "desc" ? (
        <ArrowDown className="h-3 w-3" />
      ) : column.getIsSorted() === "asc" ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-60" />
      )}
    </button>
  );
}

// Generate columns for challenges table
export function getChallengesColumns({ onEdit, onDelete, onView }) {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <ColumnHeader column={column} title="Challenge" />,
      cell: ({ row }) => {
        const name = row.getValue("name") || "Unnamed Challenge";
        const statement = row.original.statement || "";
        return (
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-[13px] font-semibold text-[#030914] truncate">
              {name}
            </p>
            {statement && (
              <p
                className="text-[11px] text-gray-500 truncate"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {statement}
              </p>
            )}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "level",
      header: ({ column }) => <ColumnHeader column={column} title="Difficulty" />,
      cell: ({ row }) => (
        <ChallengeDifficultyBadge level={row.getValue("level")} compact />
      ),
      enableSorting: true,
      filterFn: (row, id, value) => {
        return value === "all" || row.getValue(id)?.toString() === value;
      },
    },
    {
      accessorKey: "current_score",
      header: ({ column }) => <ColumnHeader column={column} title="Points" />,
      cell: ({ row }) => {
        const score = row.getValue("current_score") || row.original.initial_score || 0;
        return (
          <span
            className="text-[13px] font-semibold text-[#030914]"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {score}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "institution",
      header: () => <ColumnHeader column={{ getCanSort: () => false }} title="Institution" />,
      cell: ({ row }) => (
        <span className="text-[12px] text-gray-500 truncate">
          {row.original.institution?.name || "Platform-wide"}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "solves",
      header: ({ column }) => <ColumnHeader column={column} title="Solves" />,
      cell: ({ row }) => (
        <span
          className="text-[13px] font-semibold text-[#030914]"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          {row.getValue("solves") || 0}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => <ColumnHeader column={column} title="Created" />,
      cell: ({ row }) => {
        const date = row.getValue("created_at");
        return (
          <span
            className="text-[12px] text-gray-500"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {date ? new Date(date).toLocaleDateString() : "N/A"}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const challenge = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(challenge)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(challenge)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(challenge)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 50,
    },
  ];
}

// Difficulty filter chips matching Pencil
const LEVEL_CHIPS = [
  { value: "all", label: "All" },
  { value: "1", label: "Beginner" },
  { value: "2", label: "Easy" },
  { value: "3", label: "Medium" },
  { value: "4", label: "Hard" },
  { value: "5", label: "Expert" },
];

// Toolbar component
function ChallengesToolbar({
  globalFilter,
  onGlobalFilterChange,
  levelFilter,
  onLevelFilterChange,
  institutionFilter,
  onInstitutionFilterChange,
  institutions = [],
  selectedCount,
  onBulkDelete,
  isTeacher,
  userInstitutionId,
  userInstitutionName,
  isSearching,
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search challenges..."
            value={globalFilter ?? ""}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            className="w-full pl-10 h-10 text-[13px] border border-gray-200 rounded-[10px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/20"
          />
          {isSearching && (
            <Loader2Spinner className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-gray-400" />
          )}
        </div>

        {/* Difficulty chips */}
        <div className="flex flex-wrap gap-1.5">
          {LEVEL_CHIPS.map((chip) => {
            const active = levelFilter === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => onLevelFilterChange(chip.value)}
                className={cn(
                  "h-8 px-3.5 rounded-lg text-[12px] font-semibold transition-colors",
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
        </div>

        {/* Institution Filter */}
        <div className="flex-shrink-0">
          {isTeacher && userInstitutionId ? (
            <div className="h-10 px-3.5 border border-gray-200 bg-gray-100 rounded-[10px] flex items-center text-[12px] text-gray-600">
              {userInstitutionName || "Your Institution"}
            </div>
          ) : (
            <Select
              value={institutionFilter}
              onValueChange={onInstitutionFilterChange}
            >
              <SelectTrigger className="w-[170px] h-10 text-[12px] rounded-[10px] border-gray-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <SelectValue placeholder="Institution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Institutions</SelectItem>
                <SelectItem value="null">Platform-wide</SelectItem>
                {institutions.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id.toString()}>
                    {inst.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 px-3.5 py-2.5 bg-white border border-gray-200 rounded-[10px]">
          <span className="text-[13px] font-semibold text-[#030914]">
            {selectedCount} selected
          </span>
          {onBulkDelete && (
            <button
              type="button"
              onClick={onBulkDelete}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-gray-200 text-[13px] font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Bulk delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Tiny loader to avoid importing Loader2 just for the spinner
function Loader2Spinner({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Pagination component — Pencil style: white card with shadow
function ChallengesPagination({ table, totalCount }) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = table.getPageCount() || 1;
  const visibleCount = table.getRowModel().rows.length;
  const start = visibleCount === 0 ? 0 : pageIndex * pageSize + 1;
  const end = pageIndex * pageSize + visibleCount;
  const total = totalCount || visibleCount;

  return (
    <div className="flex flex-col gap-3 px-5 py-3.5 bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between">
      <div className="text-[12px] text-gray-500">
        {total > 0
          ? `Showing ${start} to ${end} of ${total} challenges`
          : "No challenges to show"}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-white border border-gray-200 text-[12px] font-medium text-[#030914] hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </button>
        <span className="text-[12px] text-gray-500 px-2">
          Page {pageIndex + 1} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-white border border-gray-200 text-[12px] font-medium text-[#030914] hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// Main DataTable component
export function ChallengesDataTable({
  data,
  institutions = [],
  isLoading = false,
  isSearching = false,
  totalCount = 0,
  // Filters
  globalFilter,
  onGlobalFilterChange,
  levelFilter = "all",
  onLevelFilterChange,
  institutionFilter = "all",
  onInstitutionFilterChange,
  // Actions
  onEdit,
  onDelete,
  onView,
  onBulkDelete,
  // User context
  isTeacher = false,
  userInstitutionId,
  userInstitutionName,
  // Table options
  pageSize = 25,
}) {
  const [sorting, setSorting] = React.useState([]);
  const [rowSelection, setRowSelection] = React.useState({});

  const columns = React.useMemo(
    () => getChallengesColumns({ onEdit, onDelete, onView }),
    [onEdit, onDelete, onView]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: { pageSize },
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedRows.length > 0) {
      const selectedIds = selectedRows.map((row) => row.original.id);
      onBulkDelete(selectedIds);
      setRowSelection({});
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      <ChallengesToolbar
        globalFilter={globalFilter}
        onGlobalFilterChange={onGlobalFilterChange}
        levelFilter={levelFilter}
        onLevelFilterChange={onLevelFilterChange}
        institutionFilter={institutionFilter}
        onInstitutionFilterChange={onInstitutionFilterChange}
        institutions={institutions}
        selectedCount={selectedRows.length}
        onBulkDelete={onBulkDelete ? handleBulkDelete : undefined}
        isTeacher={isTeacher}
        userInstitutionId={userInstitutionId}
        userInstitutionName={userInstitutionName}
        isSearching={isSearching}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-[#f9f9f9] hover:bg-[#f9f9f9] border-b border-gray-200"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-auto px-5 py-3.5 align-middle"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#19aa59]" />
                    <span className="text-[13px] text-gray-500">
                      Loading challenges...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/60 data-[state=selected]:bg-[#19aa59]/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-5 py-4 align-middle"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <span className="text-[13px] text-gray-500">
                    No challenges found.
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ChallengesPagination table={table} totalCount={totalCount} />
    </div>
  );
}

export default ChallengesDataTable;

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
  Filter,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { ChallengeDifficultyBadge } from "./ChallengeDifficultyBadge";
import { ChallengeStatusBadge } from "./ChallengeStatusBadge";

// Column header with sorting
function ColumnHeader({ column, title, className }) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8 data-[state=open]:bg-accent", className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      <span>{title}</span>
      {column.getIsSorted() === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
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
      header: ({ column }) => <ColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="min-w-[150px]">
          <p className="font-medium text-sm truncate max-w-[200px]">
            {row.getValue("name") || "Unnamed Challenge"}
          </p>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "statement",
      header: "Statement",
      cell: ({ row }) => (
        <div className="min-w-[200px] max-w-[300px] hidden md:block">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {row.getValue("statement")}
          </p>
        </div>
      ),
      enableSorting: false,
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
          <Badge variant="outline" className="font-mono text-xs">
            {score} pts
          </Badge>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "institution",
      header: "Institution",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {row.original.institution?.name || "Platform-wide"}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "solves",
      header: ({ column }) => <ColumnHeader column={column} title="Solves" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground hidden md:inline">
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
          <span className="text-xs text-muted-foreground hidden lg:inline">
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

// Toolbar component
function ChallengesToolbar({
  table,
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
}) {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search challenges..."
            value={globalFilter ?? ""}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Level Filter */}
          <Select value={levelFilter} onValueChange={onLevelFilterChange}>
            <SelectTrigger className="w-[140px] h-9">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="1">Level 1</SelectItem>
              <SelectItem value="2">Level 2</SelectItem>
              <SelectItem value="3">Level 3</SelectItem>
              <SelectItem value="4">Level 4</SelectItem>
              <SelectItem value="5">Level 5</SelectItem>
            </SelectContent>
          </Select>

          {/* Institution Filter */}
          {isTeacher && userInstitutionId ? (
            <div className="h-9 px-3 py-2 border border-input bg-muted rounded-md flex items-center text-sm">
              {userInstitutionName || "Your Institution"}
            </div>
          ) : (
            <Select
              value={institutionFilter}
              onValueChange={onInstitutionFilterChange}
            >
              <SelectTrigger className="w-[160px] h-9">
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
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>
          {onBulkDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              className="h-7"
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Delete Selected
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pagination component
function ChallengesPagination({ table, totalCount }) {
  return (
    <div className="flex flex-col gap-4 px-2 py-4 sm:flex-row sm:items-center sm:justify-between border-t">
      <div className="text-sm text-muted-foreground">
        {totalCount > 0 && (
          <span>
            Showing {table.getRowModel().rows.length} of {totalCount} challenges
          </span>
        )}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
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
    <div className="space-y-4">
      <ChallengesToolbar
        table={table}
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
      />

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    <span className="text-sm text-muted-foreground">
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
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  <span className="text-sm text-muted-foreground">
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

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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
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
import { UserRoleBadge } from "./UserRoleBadge";

/**
 * Column header with sorting
 */
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

/**
 * Create columns configuration for users table
 */
function createColumns({ onEdit, onDelete }) {
  return [
    // Selection column
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
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    // User column (name + email)
    {
      accessorKey: "name",
      header: ({ column }) => <ColumnHeader column={column} title="User" />,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        );
      },
      enableSorting: true,
    },
    // Role column
    {
      id: "role",
      header: ({ column }) => <ColumnHeader column={column} title="Role" />,
      accessorFn: (row) => (row.isAdmin ? "admin" : row.isTeacher ? "teacher" : "student"),
      cell: ({ row }) => <UserRoleBadge user={row.original} />,
      enableSorting: true,
      filterFn: (row, id, value) => {
        if (value === "all") return true;
        const user = row.original;
        if (value === "admin") return user.isAdmin;
        if (value === "teacher") return user.isTeacher && !user.isAdmin;
        if (value === "student") return !user.isAdmin && !user.isTeacher;
        return true;
      },
    },
    // Institution column
    {
      accessorKey: "institution",
      header: ({ column }) => <ColumnHeader column={column} title="Institution" />,
      accessorFn: (row) => row.institution?.name || "None",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.institution?.name || "None"}
        </span>
      ),
      enableSorting: true,
    },
    // Stats column
    {
      id: "stats",
      header: "Stats",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="text-xs text-muted-foreground">
            <p>{user.solvedChallenges || 0} solved</p>
            <p>{user.points || 0} pts</p>
          </div>
        );
      },
      enableSorting: false,
    },
    // Last login column
    {
      accessorKey: "last_login",
      header: ({ column }) => <ColumnHeader column={column} title="Last Login" />,
      cell: ({ row }) => {
        const dateString = row.original.last_login;
        if (!dateString) {
          return <span className="text-xs text-muted-foreground">Never</span>;
        }
        return (
          <span className="text-xs text-muted-foreground">
            {new Date(dateString).toLocaleDateString()}
          </span>
        );
      },
      enableSorting: true,
    },
    // Actions column
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(user)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      size: 50,
    },
  ];
}

/**
 * UsersDataTable - Main component for displaying users in a data table
 *
 * @param {Object} props
 * @param {Array} props.data - Array of user objects
 * @param {boolean} props.isLoading - Whether data is loading
 * @param {boolean} props.isSearching - Whether search is in progress
 * @param {string} props.searchValue - Current search value
 * @param {Function} props.onSearchChange - Handler for search changes
 * @param {string} props.roleFilter - Current role filter
 * @param {Function} props.onRoleFilterChange - Handler for role filter changes
 * @param {string} props.institutionFilter - Current institution filter
 * @param {Function} props.onInstitutionFilterChange - Handler for institution filter changes
 * @param {Array} props.institutions - List of institutions for filter
 * @param {Function} props.onEdit - Handler for editing a user
 * @param {Function} props.onDelete - Handler for deleting a user
 * @param {Function} props.onBulkDelete - Handler for bulk delete
 * @param {number} props.pageSize - Items per page
 * @param {Function} props.onPageSizeChange - Handler for page size changes
 * @param {Object} props.pagination - Server-side pagination info
 * @param {number} props.currentPage - Current page number
 * @param {Function} props.onPageChange - Handler for page changes
 * @param {Object} props.currentUser - Current logged in user (for teacher restrictions)
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
  const [sorting, setSorting] = React.useState([]);
  const [rowSelection, setRowSelection] = React.useState({});

  // Check if current user is a teacher (not admin)
  const isTeacherOnly =
    currentUser?.isTeacher && !currentUser?.isAdmin && currentUser?.institution_id;

  const columns = React.useMemo(
    () => createColumns({ onEdit, onDelete }),
    [onEdit, onDelete]
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
    // We're using server-side pagination, so no need for client-side
    manualPagination: true,
    pageCount: pagination?.totalPages || 1,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  // Clear selection when data changes
  React.useEffect(() => {
    setRowSelection({});
  }, [data]);

  const handleBulkDelete = () => {
    if (selectedCount > 0 && onBulkDelete) {
      const selectedUserIds = selectedRows.map((row) => row.original.id);
      onBulkDelete(selectedUserIds);
    }
  };

  const getTeacherInstitutionName = () => {
    if (!currentUser?.institution_id) return "Your Institution";
    const institution = institutions.find(
      (i) => i.id === currentUser.institution_id || i.id === parseInt(currentUser.institution_id)
    );
    return institution?.name || currentUser?.institution?.name || "Your Institution";
  };

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <Input
            placeholder="Search users..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full sm:max-w-[250px]"
          />

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={onRoleFilterChange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectContent>
          </Select>

          {/* Institution Filter */}
          {isTeacherOnly ? (
            <div className="h-9 px-3 py-2 border border-input bg-muted rounded-md flex items-center text-sm w-full sm:w-auto">
              {getTeacherInstitutionName()}
              <span className="ml-2 text-xs text-muted-foreground">(Your Institution)</span>
            </div>
          ) : (
            <Select value={institutionFilter} onValueChange={onInstitutionFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All institutions" />
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

        {/* Bulk Actions & Selection Info */}
        <div className="flex items-center gap-4">
          {selectedCount > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedCount} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </>
          )}
          {pagination && (
            <span className="text-sm text-muted-foreground">
              {pagination.totalUsers} total users
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        {isSearching ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Searching...</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading users...</p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        header.id === "select" && "w-[40px]",
                        header.id === "actions" && "w-[50px]",
                        // Hide some columns on mobile
                        header.id === "institution" && "hidden md:table-cell",
                        header.id === "stats" && "hidden lg:table-cell",
                        header.id === "last_login" && "hidden xl:table-cell"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          // Hide some columns on mobile
                          cell.column.id === "institution" && "hidden md:table-cell",
                          cell.column.id === "stats" && "hidden lg:table-cell",
                          cell.column.id === "last_login" && "hidden xl:table-cell"
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No users found matching your criteria
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select value={pageSize.toString()} onValueChange={onPageSizeChange}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange?.(1)}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange?.(pagination.totalPages)}
                disabled={!pagination.hasNextPage}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersDataTable;

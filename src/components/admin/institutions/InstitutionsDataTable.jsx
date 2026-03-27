"use client";

import { useState, useMemo } from "react";
import {
  DataTable,
  DataTableColumnHeader,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building,
  Edit,
  MoreHorizontal,
  Trash2,
  Users,
  MapPin,
  Mail,
  FileText,
} from "lucide-react";

/**
 * InstitutionsDataTable - DataTable component for institutions with sorting and filtering
 *
 * @param {Object} props
 * @param {Array} props.data - Array of institution objects
 * @param {function} props.onEdit - Callback when edit is clicked
 * @param {function} props.onDelete - Callback when delete is clicked
 * @param {boolean} props.isLoading - Loading state
 */
export default function InstitutionsDataTable({
  data,
  onEdit,
  onDelete,
  isLoading,
}) {
  // Define columns for the DataTable
  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Institution" />
        ),
        cell: ({ row }) => {
          const institution = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Building className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{institution.name}</p>
                {institution.address && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{institution.address}</span>
                  </div>
                )}
              </div>
            </div>
          );
        },
        enableSorting: true,
        filterFn: (row, id, filterValue) => {
          const name = row.getValue(id)?.toLowerCase() || "";
          const address = row.original.address?.toLowerCase() || "";
          const search = filterValue.toLowerCase();
          return name.includes(search) || address.includes(search);
        },
      },
      {
        accessorKey: "userCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Users" />
        ),
        cell: ({ row }) => {
          const count = row.getValue("userCount") || 0;
          return (
            <Badge variant="secondary" className="font-normal">
              <Users className="mr-1 h-3 w-3" />
              {count}
            </Badge>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "challengeCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Challenges" />
        ),
        cell: ({ row }) => {
          const count = row.getValue("challengeCount") || 0;
          return (
            <Badge variant="outline" className="font-normal">
              <FileText className="mr-1 h-3 w-3" />
              {count}
            </Badge>
          );
        },
        enableSorting: true,
      },
      {
        id: "emailSuffixes",
        header: "Email Domains",
        cell: ({ row }) => {
          const institution = row.original;
          return (
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  Students: {institution.studentEmailSuffix}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  Teachers: {institution.teacherEmailSuffix}
                </span>
              </div>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const institution = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(institution)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(institution)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onEdit, onDelete]
  );

  // Custom empty state for institutions
  const emptyState = (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Building className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No institutions found</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Get started by adding your first institution
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading institutions...</p>
        </div>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      filterColumn="name"
      filterPlaceholder="Search institutions..."
      enablePagination={true}
      enableSorting={true}
      pageSize={10}
      emptyState={emptyState}
    />
  );
}

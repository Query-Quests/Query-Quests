"use client";

import { useState, useEffect } from "react";
import { Upload, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import {
  DatabasesDataTable,
  UploadDatabaseDialog,
  SchemaPreviewDialog,
} from "@/components/admin/databases";
import { ConfirmModal } from "@/components/modals";

export default function DatabasesManagement() {
  const { user } = useUserRole();

  // Data state
  const [databases, setDatabases] = useState([]);
  const [institutions, setInstitutions] = useState([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [institutionFilter, setInstitutionFilter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState({
    totalDatabases: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Modal states
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isSchemaDialogOpen, setIsSchemaDialogOpen] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState(null);

  // Delete states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [databaseToDelete, setDatabaseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return;
    fetchDatabases(true);
  }, [debouncedSearchTerm]);

  // Set institution filter for teachers
  useEffect(() => {
    if (user && user.isTeacher && !user.isAdmin && user.institution_id) {
      setInstitutionFilter(user.institution_id.toString());
    }
  }, [user]);

  // Fetch when filters change
  useEffect(() => {
    if (user) {
      fetchDatabases(false);
    }
  }, [currentPage, pageSize, statusFilter, institutionFilter, user]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchInstitutions();
      fetchDatabases(false);
    }
  }, [user]);

  // Poll for status updates (for processing databases)
  useEffect(() => {
    const hasProcessing = databases.some(db => db.status === 'processing');
    if (hasProcessing) {
      const interval = setInterval(() => {
        fetchDatabases(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [databases]);

  const fetchDatabases = async (isSearch = false) => {
    try {
      if (isSearch) {
        setIsSearching(true);
      } else {
        setIsLoading(true);
      }

      let effectiveInstitutionFilter = institutionFilter;
      if (user && user.isTeacher && !user.isAdmin && user.institution_id) {
        effectiveInstitutionFilter = user.institution_id.toString();
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: debouncedSearchTerm,
        status: statusFilter === "all" ? "" : statusFilter,
        institution: effectiveInstitutionFilter === "all" ? "" : effectiveInstitutionFilter,
      });

      const response = await fetch(`/api/databases?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDatabases(data.databases);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching databases:", error);
      toast.error("Failed to fetch databases");
    } finally {
      if (isSearch) {
        setIsSearching(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  const fetchInstitutions = async () => {
    try {
      const response = await fetch("/api/institutions");
      if (response.ok) {
        const data = await response.json();
        setInstitutions(data);
      }
    } catch (error) {
      console.error("Error fetching institutions:", error);
    }
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  };

  // Filter handlers
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleInstitutionFilterChange = (value) => {
    setInstitutionFilter(value);
    setCurrentPage(1);
  };

  // View schema handler
  const handleViewSchema = (database) => {
    setSelectedDatabase(database);
    setIsSchemaDialogOpen(true);
  };

  // Delete handler
  const handleDeleteDatabase = (database) => {
    setDatabaseToDelete(database);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteDatabase = async () => {
    if (!databaseToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/databases/${databaseToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Database deleted successfully");
        await fetchDatabases(false);
        setIsDeleteModalOpen(false);
        setDatabaseToDelete(null);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete database");
      }
    } catch (error) {
      console.error("Error deleting database:", error);
      toast.error("Error deleting database");
    } finally {
      setIsDeleting(false);
    }
  };

  // Upload success handler
  const handleUploadSuccess = () => {
    toast.success("Database uploaded. Processing in background...");
    setIsUploadDialogOpen(false);
    fetchDatabases(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold text-[#030914] tracking-[-1px] leading-tight">
            Databases
          </h1>
          <p className="text-sm text-gray-500">
            Sandbox databases available to students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchDatabases(false)}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-[#030914] hover:bg-gray-50 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsUploadDialogOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-[#19aa59] hover:bg-[#15934d] text-white text-[13px] font-bold transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload SQL dump
          </button>
        </div>
      </div>

      {/* Databases grid + filters */}
      <DatabasesDataTable
        data={databases}
        isLoading={isLoading}
        isSearching={isSearching}
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        institutionFilter={institutionFilter}
        onInstitutionFilterChange={handleInstitutionFilterChange}
        institutions={institutions}
        onViewSchema={handleViewSchema}
        onDelete={handleDeleteDatabase}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        currentUser={user}
        onUploadClick={() => setIsUploadDialogOpen(true)}
      />

      {/* Upload Database Dialog */}
      <UploadDatabaseDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        institutions={institutions}
        currentUser={user}
        onSuccess={handleUploadSuccess}
      />

      {/* Schema Preview Dialog */}
      <SchemaPreviewDialog
        open={isSchemaDialogOpen}
        onOpenChange={setIsSchemaDialogOpen}
        database={selectedDatabase}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Database"
        message={
          databaseToDelete?._count?.challenges > 0
            ? `Cannot delete "${databaseToDelete?.name}" because it is being used by ${databaseToDelete._count.challenges} challenge(s). Please remove or reassign those challenges first.`
            : `Are you sure you want to delete "${databaseToDelete?.name}"? This will also delete the MySQL database. This action cannot be undone.`
        }
        confirmText="Delete Database"
        onConfirm={
          databaseToDelete?._count?.challenges > 0 ? null : confirmDeleteDatabase
        }
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDatabaseToDelete(null);
        }}
        isLoading={isDeleting}
        disableConfirm={databaseToDelete?._count?.challenges > 0}
      />
    </div>
  );
}

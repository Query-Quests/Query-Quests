"use client";

import { useState, useEffect, useMemo } from "react";
import { UserPlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import {
  UsersDataTable,
  AddUserDialog,
  EditUserDialog,
} from "@/components/admin/users";
import {
  ImportUsersModal,
  InstitutionModal,
  ConfirmModal,
} from "@/components/modals";

export default function UsersManagement() {
  const { user } = useUserRole();

  // Data state
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [institutionFilter, setInstitutionFilter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState({
    totalUsers: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isInstitutionModalOpen, setIsInstitutionModalOpen] = useState(false);

  // Delete states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [usersToDelete, setUsersToDelete] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users when search term changes (debounced)
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return;
    fetchUsers(true);
  }, [debouncedSearchTerm]);

  // Set institution filter for teachers when user data becomes available
  useEffect(() => {
    if (user && user.isTeacher && !user.isAdmin && user.institution_id) {
      setInstitutionFilter(user.institution_id.toString());
    }
  }, [user]);

  // Fetch users when other filters change
  useEffect(() => {
    if (user) {
      fetchUsers(false);
    }
  }, [currentPage, pageSize, roleFilter, institutionFilter, user]);

  // Initial load - wait for user data
  useEffect(() => {
    if (user) {
      fetchInstitutions();
      fetchUsers(false);
    }
  }, [user]);

  const fetchUsers = async (isSearch = false) => {
    try {
      if (isSearch) {
        setIsSearching(true);
      } else {
        setIsLoading(true);
      }

      // Apply role-based filtering for teachers
      let effectiveInstitutionFilter = institutionFilter;

      // Teachers (non-admin) should only see users from their institution
      if (user && user.isTeacher && !user.isAdmin && user.institution_id) {
        effectiveInstitutionFilter = user.institution_id.toString();
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: debouncedSearchTerm,
        role: roleFilter === "all" ? "" : roleFilter,
        institution: effectiveInstitutionFilter === "all" ? "" : effectiveInstitutionFilter,
      });

      const response = await fetch(`/api/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
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
        const institutionsData = await response.json();
        setInstitutions(institutionsData);
      }
    } catch (error) {
      console.error("Error fetching institutions:", error);
    }
  };

  // Handlers for pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  };

  // Handlers for filters
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const handleInstitutionFilterChange = (value) => {
    setInstitutionFilter(value);
    setCurrentPage(1);
  };

  // Edit user handler
  const handleEditUser = (userToEdit) => {
    setSelectedUser(userToEdit);
    setIsEditDialogOpen(true);
  };

  // Save edited user handler
  const handleSaveUser = async (updatedUser) => {
    try {
      // For teachers, ensure they can only edit users from their institution
      let userData = { ...updatedUser };
      if (user && user.isTeacher && !user.isAdmin && user.institution_id) {
        if (selectedUser && selectedUser.institution_id && selectedUser.institution_id !== user.institution_id) {
          toast.error("You can only edit users from your institution");
          return;
        }
        userData.institution_id = user.institution_id;
      }

      const response = await fetch(`/api/users/${updatedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        toast.success("User updated successfully");
        await fetchUsers(false);
        setIsEditDialogOpen(false);
        setSelectedUser(null);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Error updating user");
    }
  };

  // Add user handler
  const handleAddUser = async (newUser) => {
    try {
      // For teachers, force their institution_id
      let userData = { ...newUser };
      if (user && user.isTeacher && !user.isAdmin && user.institution_id) {
        userData.institution_id = user.institution_id;
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        toast.success(`User "${newUser.name}" created successfully`);
        await fetchUsers(false);
        setIsAddDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Error creating user");
    }
  };

  // Delete user handler
  const handleDeleteUser = (userToRemove) => {
    setUserToDelete(userToRemove);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("User deleted successfully");
        await fetchUsers(false);
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error deleting user");
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk delete handler
  const handleBulkDelete = (userIds) => {
    setUsersToDelete(userIds);
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (usersToDelete.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const response = await fetch("/api/users/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: usersToDelete }),
      });

      if (response.ok) {
        toast.success(`${usersToDelete.length} users deleted successfully`);
        await fetchUsers(false);
        setIsBulkDeleteModalOpen(false);
        setUsersToDelete([]);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete users");
      }
    } catch (error) {
      console.error("Error bulk deleting users:", error);
      toast.error("Error deleting users");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Import users handler
  const handleBulkImport = async (usersData) => {
    try {
      const response = await fetch("/api/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: usersData }),
      });

      if (response.ok) {
        toast.success("Users imported successfully");
        await fetchUsers(false);
        setIsImportModalOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Import failed");
      }
    } catch (error) {
      console.error("Error importing users:", error);
      toast.error("Error importing users");
    }
  };

  // Add institution handler
  const handleAddInstitution = async (institutionData) => {
    try {
      const response = await fetch("/api/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(institutionData),
      });

      if (response.ok) {
        const newInstitution = await response.json();
        setInstitutions((prev) => [...prev, newInstitution]);
        setIsInstitutionModalOpen(false);
        toast.success("Institution created successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create institution");
      }
    } catch (error) {
      console.error("Error creating institution:", error);
      toast.error("Error creating institution");
    }
  };

  const totalUsers = pagination?.totalUsers ?? 0;
  const roleCounts = useMemo(() => {
    const counts = { student: 0, teacher: 0, admin: 0 };
    users.forEach((u) => {
      if (u.isAdmin) counts.admin += 1;
      else if (u.isTeacher) counts.teacher += 1;
      else counts.student += 1;
    });
    return counts;
  }, [users]);

  const subtitle =
    totalUsers > 0
      ? `${totalUsers.toLocaleString()} total · ${roleCounts.student} students · ${roleCounts.teacher} teachers · ${roleCounts.admin} admins (this page)`
      : "Manage all users, their roles, and permissions";

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold text-[#030914] tracking-[-1px] leading-tight">
            Users
          </h1>
          <p className="text-[14px] text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-[10px] bg-white border border-gray-200 text-[13px] font-semibold text-[#030914] hover:bg-gray-50"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
          >
            <Upload className="h-3.5 w-3.5" />
            Import CSV
          </button>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[10px] bg-[#19aa59] hover:bg-[#15934d] text-white text-[13px] font-bold"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite user
          </button>
        </div>
      </div>

      {/* Users Data Table */}
      <UsersDataTable
        data={users}
        isLoading={isLoading}
        isSearching={isSearching}
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        roleFilter={roleFilter}
        onRoleFilterChange={handleRoleFilterChange}
        institutionFilter={institutionFilter}
        onInstitutionFilterChange={handleInstitutionFilterChange}
        institutions={institutions}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onBulkDelete={handleBulkDelete}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        currentUser={user}
      />

      {/* Add User Dialog */}
      <AddUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        institutions={institutions}
        currentUser={user}
        onSave={handleAddUser}
        onAddInstitution={() => setIsInstitutionModalOpen(true)}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={selectedUser}
        institutions={institutions}
        currentUser={user}
        onSave={handleSaveUser}
      />

      {/* Import Users Modal */}
      {isImportModalOpen && (
        <ImportUsersModal
          institutions={institutions}
          currentUser={user}
          onImport={handleBulkImport}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      {/* Add Institution Modal */}
      {isInstitutionModalOpen && (
        <InstitutionModal
          onSave={handleAddInstitution}
          onClose={() => setIsInstitutionModalOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete User"
        message={`Are you sure you want to delete "${userToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete User"
        onConfirm={confirmDeleteUser}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        isLoading={isDeleting}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        title="Delete Selected Users"
        message={`Are you sure you want to delete ${usersToDelete.length} selected user(s)? This action cannot be undone.`}
        confirmText="Delete Users"
        onConfirm={confirmBulkDelete}
        onCancel={() => {
          setIsBulkDeleteModalOpen(false);
          setUsersToDelete([]);
        }}
        isLoading={isBulkDeleting}
      />
    </div>
  );
}

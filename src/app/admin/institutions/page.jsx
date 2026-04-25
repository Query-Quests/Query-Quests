"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AddInstitutionDialog,
  EditInstitutionDialog,
  InstitutionsDataTable,
} from "@/components/admin/institutions";

export default function InstitutionsManagement() {
  const [institutions, setInstitutions] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [institutionToDelete, setInstitutionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInstitutions = useCallback(async () => {
    try {
      const response = await fetch("/api/institutions");
      if (response.ok) {
        const institutionsData = await response.json();
        setInstitutions(institutionsData);
      }
    } catch (error) {
      console.error("Error fetching institutions:", error);
      toast.error("Failed to fetch institutions");
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users?limit=1000");
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData.users || usersData);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchInstitutions(), fetchUsers()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchInstitutions, fetchUsers]);

  const getUsersCount = useCallback(
    (institutionId) => {
      return users.filter((user) => user.institution_id === institutionId).length;
    },
    [users]
  );

  const tableData = institutions.map((institution) => ({
    ...institution,
    userCount: getUsersCount(institution.id),
  }));

  const totalUsers = users.length;
  const activeCount = institutions.filter((inst) => getUsersCount(inst.id) > 0).length;

  const handleCreateInstitution = async (institutionData) => {
    try {
      const response = await fetch("/api/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(institutionData),
      });

      if (response.ok) {
        await fetchInstitutions();
        setIsAddDialogOpen(false);
        toast.success(`Institution "${institutionData.name}" created successfully`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create institution");
      }
    } catch (error) {
      console.error("Error creating institution:", error);
      toast.error("Error creating institution. Please try again.");
    }
  };

  const handleEditClick = (institution) => {
    setSelectedInstitution(institution);
    setIsEditDialogOpen(true);
  };

  const handleUpdateInstitution = async (institutionData) => {
    try {
      const response = await fetch(`/api/institutions/${institutionData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(institutionData),
      });

      if (response.ok) {
        await fetchInstitutions();
        setIsEditDialogOpen(false);
        setSelectedInstitution(null);
        toast.success(`Institution "${institutionData.name}" updated successfully`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update institution");
      }
    } catch (error) {
      console.error("Error updating institution:", error);
      toast.error("Error updating institution. Please try again.");
    }
  };

  const handleDeleteClick = (institution) => {
    setInstitutionToDelete(institution);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!institutionToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/institutions/${institutionToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        await Promise.all([fetchInstitutions(), fetchUsers()]);
        setIsDeleteDialogOpen(false);
        setInstitutionToDelete(null);
        toast.success(result.message || "Institution deleted successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete institution");
      }
    } catch (error) {
      console.error("Error deleting institution:", error);
      toast.error("Error deleting institution. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold text-[#030914] tracking-[-1px] leading-tight">
            Institutions
          </h1>
          <p className="text-[14px] text-gray-500">
            {activeCount} active institutions · {totalUsers.toLocaleString()} total users
          </p>
        </div>
        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="inline-flex items-center gap-1.5 bg-[#19aa59] hover:bg-[#15934d] text-white text-[13px] font-bold px-4 py-2.5 rounded-[10px] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Add institution
        </button>
      </div>

      {/* Data Table */}
      <InstitutionsDataTable
        data={tableData}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        isLoading={isLoading}
      />

      {/* Add Institution Dialog */}
      <AddInstitutionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleCreateInstitution}
      />

      {/* Edit Institution Dialog */}
      <EditInstitutionDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setSelectedInstitution(null);
        }}
        institution={selectedInstitution}
        onSave={handleUpdateInstitution}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <DialogTitle className="text-[16px] font-semibold text-[#030914]">
                  Delete institution
                </DialogTitle>
                <DialogDescription className="text-[12px] text-gray-500">
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-2">
            <p className="text-[13px] text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#030914]">
                "{institutionToDelete?.name}"
              </span>
              ?
            </p>
            {institutionToDelete && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-[#f9f9f9] p-3 text-[12px]">
                <p className="font-semibold text-[#030914]">
                  This will permanently delete:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-gray-500">
                  <li>{getUsersCount(institutionToDelete.id)} user(s)</li>
                  <li>{institutionToDelete.challengeCount || 0} challenge(s)</li>
                  <li>All related logs and user progress</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setInstitutionToDelete(null);
              }}
              disabled={isDeleting}
              className="h-9 text-[13px] font-medium border-gray-200"
            >
              Cancel
            </Button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete institution"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

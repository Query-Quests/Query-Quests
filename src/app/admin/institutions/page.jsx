"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building, Users, Shield, Plus, AlertTriangle, Loader2 } from "lucide-react";
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

  // Fetch institutions
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

  // Fetch users for counting
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

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchInstitutions(), fetchUsers()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchInstitutions, fetchUsers]);

  // Get users count for an institution
  const getUsersCount = useCallback(
    (institutionId) => {
      return users.filter((user) => user.institution_id === institutionId).length;
    },
    [users]
  );

  // Prepare table data with user counts
  const tableData = institutions.map((institution) => ({
    ...institution,
    userCount: getUsersCount(institution.id),
  }));

  // Stats calculations
  const stats = {
    totalInstitutions: institutions.length,
    totalUsers: users.length,
    activeInstitutions: institutions.filter(
      (inst) => getUsersCount(inst.id) > 0
    ).length,
  };

  // Handle create institution
  const handleCreateInstitution = async (institutionData) => {
    try {
      const response = await fetch("/api/institutions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

  // Handle edit institution
  const handleEditClick = (institution) => {
    setSelectedInstitution(institution);
    setIsEditDialogOpen(true);
  };

  const handleUpdateInstitution = async (institutionData) => {
    try {
      const response = await fetch(`/api/institutions/${institutionData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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

  // Handle delete institution
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
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Institutions"
        description="Manage educational institutions and their associated users"
      >
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Institution
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Institutions
                </p>
                <p className="text-2xl font-bold">{stats.totalInstitutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Users
                </p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Institutions
                </p>
                <p className="text-2xl font-bold">{stats.activeInstitutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Institutions</CardTitle>
          <CardDescription>
            View and manage all registered educational institutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InstitutionsDataTable
            data={tableData}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Delete Institution</DialogTitle>
                <DialogDescription>
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                "{institutionToDelete?.name}"
              </span>
              ?
            </p>
            {institutionToDelete && (
              <div className="mt-4 rounded-lg border bg-muted/50 p-3 text-sm">
                <p className="font-medium text-foreground">
                  This will permanently delete:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                  <li>
                    {getUsersCount(institutionToDelete.id)} user(s)
                  </li>
                  <li>
                    {institutionToDelete.challengeCount || 0} challenge(s)
                  </li>
                  <li>All related logs and user progress</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setInstitutionToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Institution"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

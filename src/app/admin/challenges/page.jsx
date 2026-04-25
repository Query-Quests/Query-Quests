"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { ConfirmModal } from "@/components/modals";
import {
  ChallengesDataTable,
  EditChallengeDialog,
} from "@/components/challenges";

export default function ChallengesManagement() {
  const router = useRouter();
  const { user } = useUserRole();

  // Data state
  const [challenges, setChallenges] = useState([]);
  const [institutions, setInstitutions] = useState([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [institutionFilter, setInstitutionFilter] = useState("all");

  // Pagination state
  const [pagination, setPagination] = useState({
    totalChallenges: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Stats state (kept for header subtitle)
  const [stats, setStats] = useState({
    totalChallenges: 0,
    totalSolves: 0,
    avgDifficulty: 0,
    totalPoints: 0,
  });

  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedChallengeIds, setSelectedChallengeIds] = useState([]);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [challengeToEdit, setChallengeToEdit] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchChallenges = useCallback(async (isSearch = false) => {
    try {
      if (isSearch) {
        setIsSearching(true);
      } else {
        setIsLoading(true);
      }

      // Apply role-based filtering for teachers
      let effectiveInstitutionFilter = institutionFilter;
      if (user && user.isTeacher && !user.isAdmin && user.institution_id) {
        effectiveInstitutionFilter = user.institution_id;
      }

      const params = new URLSearchParams({
        search: debouncedSearchTerm,
        level: levelFilter === "all" ? "" : levelFilter,
        institution: effectiveInstitutionFilter === "all" ? "" : effectiveInstitutionFilter,
      });

      const response = await fetch(`/api/challenges?${params}`);
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges || data);
        setPagination(data.pagination || {
          totalChallenges: data.length || 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
      toast.error("Failed to load challenges");
    } finally {
      if (isSearch) {
        setIsSearching(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [debouncedSearchTerm, levelFilter, institutionFilter, user]);

  const fetchStats = useCallback(async () => {
    try {
      let statsUrl = "/api/challenges/stats";
      if (user && user.isTeacher && !user.isAdmin && user.institution_id) {
        statsUrl = `/api/challenges/stats?institutionId=${user.institution_id}`;
      }

      const response = await fetch(statsUrl);
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [user]);

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

  // Set institution filter for teachers when user data becomes available
  useEffect(() => {
    if (user && user.isTeacher && !user.isAdmin && user.institution_id) {
      setInstitutionFilter(user.institution_id);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchInstitutions();
      fetchStats();
    }
  }, [user, fetchStats]);

  // Fetch challenges when filters change
  useEffect(() => {
    if (user) {
      fetchChallenges(debouncedSearchTerm !== "");
    }
  }, [user, debouncedSearchTerm, levelFilter, institutionFilter, fetchChallenges]);

  // Handlers
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleLevelFilterChange = (value) => {
    setLevelFilter(value);
  };

  const handleInstitutionFilterChange = (value) => {
    setInstitutionFilter(value);
  };

  const handleEditChallenge = (challenge) => {
    setChallengeToEdit(challenge);
    setEditDialogOpen(true);
  };

  const handleEditChallengePage = (challenge) => {
    router.push(`/admin/challenges/edit/${challenge.id}`);
  };

  const handleDeleteChallenge = (challenge) => {
    setChallengeToDelete(challenge);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteChallenge = async () => {
    if (!challengeToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/challenges/${challengeToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(`Challenge "${challengeToDelete.name || 'Unnamed Challenge'}" deleted successfully`);
        await fetchChallenges(false);
        await fetchStats();
        setIsDeleteModalOpen(false);
        setChallengeToDelete(null);
      } else {
        let message = "Failed to delete challenge";
        try {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const error = await response.json();
            message = error.error || message;
          }
        } catch (_) {}
        toast.error(message);
      }
    } catch (error) {
      console.error("Error deleting challenge:", error);
      toast.error("Error deleting challenge. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = (challengeIds) => {
    setSelectedChallengeIds(challengeIds);
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedChallengeIds.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const response = await fetch('/api/challenges/bulk-delete', {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ challengeIds: selectedChallengeIds }),
      });

      if (response.ok) {
        toast.success(`${selectedChallengeIds.length} challenges deleted successfully`);
        setSelectedChallengeIds([]);
        await fetchChallenges(false);
        await fetchStats();
        setIsBulkDeleteModalOpen(false);
      } else {
        let message = "Failed to delete challenges";
        try {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const error = await response.json();
            message = error.error || message;
          }
        } catch (_) {}
        toast.error(message);
      }
    } catch (error) {
      console.error("Error bulk deleting challenges:", error);
      toast.error("Error deleting challenges. Please try again.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleSaveChallenge = async (updatedChallenge) => {
    setIsUpdating(true);
    try {
      const userData = localStorage.getItem("user");
      let currentUser = null;
      try {
        currentUser = JSON.parse(userData);
      } catch (_) {}

      const response = await fetch(`/api/challenges/${updatedChallenge.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...updatedChallenge,
          updater_id: currentUser?.id,
        }),
      });

      if (response.ok) {
        toast.success("Challenge updated successfully!");
        setEditDialogOpen(false);
        setChallengeToEdit(null);
        await fetchChallenges(false);
        await fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update challenge");
      }
    } catch (error) {
      console.error("Error updating challenge:", error);
      toast.error("Error updating challenge. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading && challenges.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-[#19aa59]" />
      </div>
    );
  }

  const totalCount =
    pagination.totalChallenges || stats.totalChallenges || challenges.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold text-[#030914] tracking-[-1px] leading-tight">
            Challenges
          </h1>
          <p className="text-sm text-gray-500">
            {totalCount} {totalCount === 1 ? "challenge" : "challenges"}
            {stats.totalSolves > 0 && (
              <> &middot; {stats.totalSolves.toLocaleString()} solves</>
            )}
          </p>
        </div>
        <Button
          onClick={() => router.push("/admin/challenges/create")}
          className="bg-[#19aa59] hover:bg-[#15934d] text-white text-[13px] font-bold px-4 py-2.5 h-auto rounded-[10px] gap-2 w-full sm:w-auto"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          New challenge
        </Button>
      </div>

      {/* Data Table */}
      <ChallengesDataTable
        data={challenges}
        institutions={institutions}
        isLoading={isLoading}
        isSearching={isSearching}
        totalCount={pagination.totalChallenges}
        globalFilter={searchTerm}
        onGlobalFilterChange={handleSearchChange}
        levelFilter={levelFilter}
        onLevelFilterChange={handleLevelFilterChange}
        institutionFilter={institutionFilter}
        onInstitutionFilterChange={handleInstitutionFilterChange}
        onEdit={handleEditChallenge}
        onDelete={handleDeleteChallenge}
        onBulkDelete={handleBulkDelete}
        isTeacher={user?.isTeacher && !user?.isAdmin}
        userInstitutionId={user?.institution_id}
        userInstitutionName={user?.institution?.name}
      />

      {/* Edit Challenge Dialog */}
      <EditChallengeDialog
        challenge={challengeToEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        institutions={institutions}
        user={user}
        onSave={handleSaveChallenge}
        isLoading={isUpdating}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Challenge"
        message={`Are you sure you want to delete "${challengeToDelete?.name || 'Unnamed Challenge'}"? This action cannot be undone.`}
        confirmText="Delete Challenge"
        onConfirm={confirmDeleteChallenge}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setChallengeToDelete(null);
        }}
        isLoading={isDeleting}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        title="Delete Selected Challenges"
        message={`Are you sure you want to delete ${selectedChallengeIds.length} selected challenge(s)? This action cannot be undone.`}
        confirmText="Delete Challenges"
        onConfirm={confirmBulkDelete}
        onCancel={() => {
          setIsBulkDeleteModalOpen(false);
          setSelectedChallengeIds([]);
        }}
        isLoading={isBulkDeleting}
      />
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import LevelBadge from "@/components/LevelBadge";
import { 
  Database, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Filter,
  TrendingUp,
  Calendar,
  Target
} from "lucide-react";
import { ConfirmModal } from "@/components/modals";

export default function ChallengesManagement() {
  const router = useRouter();
  const [challenges, setChallenges] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [institutionFilter, setInstitutionFilter] = useState("all");
  const [selectedChallenges, setSelectedChallenges] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState({
    totalChallenges: 0,
    totalSolves: 0,
    avgDifficulty: 0,
    totalPoints: 0,
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState({
    totalChallenges: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150); // Reduced to 150ms for more responsive feel

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchChallenges = useCallback(async (isSearch = false) => {
    try {
      if (isSearch) {
        setIsSearching(true);
      } else {
        setIsLoading(true);
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: debouncedSearchTerm,
        level: levelFilter === "all" ? "" : levelFilter,
        institution: institutionFilter === "all" ? "" : institutionFilter,
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
    } finally {
      if (isSearch) {
        setIsSearching(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [currentPage, pageSize, debouncedSearchTerm, levelFilter, institutionFilter]);

  // Fetch challenges when search term changes (debounced)
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return;
    fetchChallenges(true);
  }, [debouncedSearchTerm]);

  // Fetch challenges when other filters change
  useEffect(() => {
    fetchChallenges(false);
  }, [currentPage, pageSize, levelFilter, institutionFilter]);

  // Initial load
  useEffect(() => {
    fetchInstitutions();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/challenges/stats");
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
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

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
    setSelectedChallenges([]); // Clear selection for better UX
  };

  const handleLevelFilterChange = (value) => {
    setLevelFilter(value);
    setCurrentPage(1);
  };

  const handleInstitutionFilterChange = (value) => {
    setInstitutionFilter(value);
    setCurrentPage(1);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedChallenges(challenges.map(challenge => challenge.id));
    } else {
      setSelectedChallenges([]);
    }
  };

  const handleSelectChallenge = (challengeId, checked) => {
    if (checked) {
      setSelectedChallenges(prev => [...prev, challengeId]);
    } else {
      setSelectedChallenges(prev => prev.filter(id => id !== challengeId));
    }
  };

  const handleEditChallenge = (challenge) => {
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
        setSelectedChallenges(prev => prev.filter(id => id !== challengeToDelete.id));
        await fetchChallenges(false);
        setIsDeleteModalOpen(false);
        setChallengeToDelete(null);
      } else {
        let message = "Failed to delete challenge";
        try {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const error = await response.json();
            message = error.error || message;
          } else {
            const text = await response.text();
            if (text) message = text;
          }
        } catch (_) {
          // ignore parse errors
        }
        alert(`Error: ${message}`);
      }
    } catch (error) {
      console.error("Error deleting challenge:", error);
      alert("Error deleting challenge. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedChallenges.length === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedChallenges.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const response = await fetch('/api/challenges/bulk-delete', {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ challengeIds: selectedChallenges }),
      });

      if (response.ok) {
        setSelectedChallenges([]);
        await fetchChallenges(false);
        setIsBulkDeleteModalOpen(false);
      } else {
        let message = "Failed to delete challenges";
        try {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const error = await response.json();
            message = error.error || message;
          } else {
            const text = await response.text();
            if (text) message = text;
          }
        } catch (_) {}
        alert(`Error: ${message}`);
      }
    } catch (error) {
      console.error("Error bulk deleting challenges:", error);
      alert("Error deleting challenges. Please try again.");
    } finally {
      setIsBulkDeleting(false);
    }
  };



  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Challenges Management</h1>
          <p className="text-muted-foreground">
            Manage all SQL challenges and their difficulty levels
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button 
            onClick={() => router.push("/admin/challenges/create")}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
          Create Challenge
        </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Challenges</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalChallenges}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Solves</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.totalSolves}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Avg Difficulty</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.avgDifficulty}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Points</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.totalPoints}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 pt-3 sm:p-6 sm:pt-4 lg:p-8 lg:pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search challenges..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select value={levelFilter} onValueChange={handleLevelFilterChange}>
                <SelectTrigger id="level" className="h-11 sm:h-9">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="1">Level 1 - Beginner</SelectItem>
                  <SelectItem value="2">Level 2 - Easy</SelectItem>
                  <SelectItem value="3">Level 3 - Medium</SelectItem>
                  <SelectItem value="4">Level 4 - Hard</SelectItem>
                  <SelectItem value="5">Level 5 - Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Select value={institutionFilter} onValueChange={handleInstitutionFilterChange}>
                <SelectTrigger id="institution" className="h-11 sm:h-9">
                  <SelectValue placeholder="All institutions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All institutions</SelectItem>
                  <SelectItem value="null">No institution</SelectItem>
                  {institutions.map((institution) => (
                    <SelectItem key={institution.id} value={institution.id.toString()}>
                      {institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="page-size">Items per page</Label>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger id="page-size" className="h-11 sm:h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenges Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center gap-2">
              <CardTitle>Challenges ({pagination.totalChallenges} total)</CardTitle>
              {isSearching && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  <span>Searching...</span>
                </div>
              )}
            </div>
            {selectedChallenges.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleBulkDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedChallenges.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {challenges.length === 0 && !isSearching ? (
            <div className="text-center py-8">
              <Database className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No challenges found matching your criteria</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <div className="flex justify-center">
                          <Checkbox 
                            checked={selectedChallenges.length === challenges.length && challenges.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[120px] sm:min-w-[200px]">Challenge</TableHead>
                      <TableHead className="w-12 sm:min-w-[100px]">Level</TableHead>
                      <TableHead className="w-12 sm:min-w-[100px]">Points</TableHead>
                      <TableHead className="min-w-[100px] hidden sm:table-cell">Institution</TableHead>
                      <TableHead className="min-w-[80px] hidden md:table-cell">Solves</TableHead>
                      <TableHead className="min-w-[100px] hidden lg:table-cell">Created</TableHead>
                      <TableHead className="w-12 sm:w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {challenges.map((challenge) => (
                      <TableRow key={challenge.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex justify-center">
                            <Checkbox 
                              checked={selectedChallenges.includes(challenge.id)}
                              onCheckedChange={(checked) => handleSelectChallenge(challenge.id, checked)}
                            />
                  </div>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">#{challenge.id}</p>
                            <p className="text-xs text-muted-foreground truncate hidden sm:block max-w-[200px]">
                    {challenge.statement}
                  </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center sm:justify-start">
                            <div className={`px-1 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${
                              challenge.level === 1 ? "bg-green-100 text-green-800" :
                              challenge.level === 2 ? "bg-yellow-100 text-yellow-800" :
                              challenge.level === 3 ? "bg-orange-100 text-orange-800" :
                              challenge.level === 4 ? "bg-red-100 text-red-800" :
                              challenge.level === 5 ? "bg-purple-100 text-purple-800" :
                              "bg-green-100 text-green-800"
                            }`}>
                              <span className="hidden sm:inline">Level </span>{challenge.level}
                  </div>
                </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center sm:justify-start">
                            <Badge variant="outline" className="text-xs">
                              {challenge.score}<span className="hidden sm:inline">{" "}pts</span>
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <p className="text-xs text-muted-foreground">
                            {challenge.institution?.name || 'None'}
                          </p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="text-xs text-muted-foreground">
                            {challenge.solves} solves
                          </p>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <p className="text-xs text-muted-foreground">
                            {formatDate(challenge.created_at)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                              size="sm"
                              className="h-4 w-4 sm:h-6 sm:w-6 p-0"
                              onClick={() => handleEditChallenge(challenge)}
                  >
                              <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                              size="sm"
                              className="h-4 w-4 sm:h-6 sm:w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteChallenge(challenge)}
                            >
                              <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-0">
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
            />
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Challenge"
        message={`Are you sure you want to delete challenge #${challengeToDelete?.id}? This action cannot be undone.`}
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
        message={`Are you sure you want to delete ${selectedChallenges.length} selected challenge(s)? This action cannot be undone.`}
        confirmText="Delete Challenges"
        onConfirm={confirmBulkDelete}
        onCancel={() => {
          setIsBulkDeleteModalOpen(false);
        }}
        isLoading={isBulkDeleting}
      />
    </div>
  );
} 
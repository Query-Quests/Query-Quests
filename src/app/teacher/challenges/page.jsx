"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LevelBadge from "@/components/LevelBadge";
import { 
  Book, 
  Search, 
  Plus, 
  Edit, 
  Eye,
  Filter,
  TrendingUp,
  Users,
  Award,
  Trash2
} from "lucide-react";
import Link from "next/link";

export default function TeacherChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState(null);

  const fetchChallenges = useCallback(async (userData) => {
    try {
      if (!userData || !userData.institution_id) {
        console.log("No user data or institution_id available");
        setChallenges([]);
        return;
      }
      
      // Fetch challenges for the teacher's institution
      const response = await fetch(`/api/challenges?institution=${userData.institution_id}`);
      if (response.ok) {
        const challengesData = await response.json();
        setChallenges(challengesData.challenges || []);
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
      setChallenges([]);
    }
  }, []);

  const fetchTeacherData = useCallback(async () => {
    try {
      // Fetch teacher data (using user ID 1 for demo)
      const userId = 1;
      const userResponse = await fetch(`/api/users/${userId}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
        
        // Fetch challenges for the teacher's institution
        await fetchChallenges(userData);
      }
    } catch (error) {
      console.error("Error fetching teacher data:", error);
      setChallenges([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchChallenges]);

  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);



  const filteredChallenges = (Array.isArray(challenges) ? challenges : []).filter(challenge => {
    const matchesSearch = challenge.statement.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.help?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === "all" || challenge.level.toString() === levelFilter;

    return matchesSearch && matchesLevel;
  });

  const handleEditChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    setIsEditModalOpen(true);
  };

  const handleSaveChallenge = async (updatedChallenge) => {
    try {
      const response = await fetch(`/api/challenges/${updatedChallenge.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...updatedChallenge,
          updater_id: user.id,
        }),
      });

      if (response.ok) {
        await fetchChallenges(user); // Refresh the list
        setIsEditModalOpen(false);
        setSelectedChallenge(null);
      } else {
        const errorData = await response.json();
        alert(`Error updating challenge: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error updating challenge:", error);
      alert("Error updating challenge");
    }
  };

  const handleCreateChallenge = async (newChallenge) => {
    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newChallenge,
          creator_id: user.id,
          institution_id: user.institution_id,
        }),
      });

      if (response.ok) {
        await fetchChallenges(user); // Refresh the list
        setIsCreateModalOpen(false);
      } else {
        const errorData = await response.json();
        alert(`Error creating challenge: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error creating challenge:", error);
      alert("Error creating challenge");
    }
  };

  const handleDeleteChallenge = (challenge) => {
    setChallengeToDelete(challenge);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteChallenge = async () => {
    if (!challengeToDelete) return;

    try {
      const response = await fetch(`/api/challenges/${challengeToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchChallenges(user); // Refresh the list
        setIsDeleteModalOpen(false);
        setChallengeToDelete(null);
      } else {
        const errorData = await response.json();
        alert(`Error deleting challenge: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting challenge:", error);
      alert("Error deleting challenge");
    }
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Challenges Management</h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Manage and view challenges for your students
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {user?.institution_id && (
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Challenge
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/challenges">
              <Eye className="h-4 w-4 mr-2" />
              Student View
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/challenges">
              <Book className="h-4 w-4 mr-2" />
              Admin View
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Book className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Institution Challenges</span>
            </div>
            <p className="text-2xl font-bold">{Array.isArray(challenges) ? challenges.length : 0}</p>
            {user?.institution ? (
              <p className="text-xs text-muted-foreground">{user.institution.name}</p>
            ) : (
              <p className="text-xs text-red-600">No institution assigned</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Average Level</span>
            </div>
            <p className="text-2xl font-bold">
              {Array.isArray(challenges) && challenges.length > 0 
                ? Math.round(challenges.reduce((sum, c) => sum + c.level, 0) / challenges.length)
                : 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Total Points</span>
            </div>
            <p className="text-2xl font-bold">
              {Array.isArray(challenges) ? challenges.reduce((sum, c) => sum + c.score, 0) : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Challenges</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by statement or help text..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="level-filter">Level</Label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by level" />
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenges List */}
      <Card>
        <CardHeader>
          <CardTitle>Challenges ({filteredChallenges.length})</CardTitle>
          <CardDescription>
            Challenges for {user.institution?.name || 'your institution'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredChallenges.map((challenge) => (
              <div key={challenge.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-gray-50 space-y-3 sm:space-y-0">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Book className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                      <h3 className="font-medium truncate">{challenge.statement}</h3>
                      <LevelBadge level={challenge.level} />
                    </div>
                    <div className="mt-2 space-y-2">
                      {challenge.help && (
                        <p className="text-sm text-muted-foreground italic">
                          {challenge.help}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-muted-foreground">{challenge.score} points</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span className="text-muted-foreground">{challenge.solves} solves</span>
                        </div>
                        {challenge.institution && (
                          <div className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            <span className="text-muted-foreground">{challenge.institution.name}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                          <span className="text-muted-foreground">
                            Created {new Date(challenge.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <Link href={`/challenges/${challenge.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditChallenge(challenge)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteChallenge(challenge)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredChallenges.length === 0 && (
              <div className="text-center py-8">
                <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                {!user?.institution_id ? (
                  <div>
                    <p className="text-muted-foreground mb-2">No institution assigned</p>
                    <p className="text-sm text-muted-foreground">Please contact an administrator to assign you to an institution</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No challenges found matching your criteria</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Challenge Modal */}
      {isEditModalOpen && selectedChallenge && (
        <EditChallengeModal
          challenge={selectedChallenge}
          onSave={handleSaveChallenge}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedChallenge(null);
          }}
        />
      )}

      {/* Create Challenge Modal */}
      {isCreateModalOpen && (
        <CreateChallengeModal
          onSave={handleCreateChallenge}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && challengeToDelete && (
        <DeleteConfirmationModal
          challenge={challengeToDelete}
          onConfirm={confirmDeleteChallenge}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setChallengeToDelete(null);
          }}
        />
      )}
    </div>
  );
}

function CreateChallengeModal({ onSave, onClose }) {
  const [formData, setFormData] = useState({
    statement: "",
    help: "",
    solution: "",
    level: "1",
    score: "100",
    score_base: "100",
    score_min: "10",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      level: parseInt(formData.level),
      score: parseInt(formData.score),
      score_base: parseInt(formData.score_base),
      score_min: parseInt(formData.score_min),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Create New Challenge</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="statement">Challenge Statement</Label>
            <Input
              id="statement"
              value={formData.statement}
              onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="help">Help Text (Optional)</Label>
            <Input
              id="help"
              value={formData.help}
              onChange={(e) => setFormData({ ...formData, help: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="solution">Solution</Label>
            <Input
              id="solution"
              value={formData.solution}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                  <SelectItem value="4">Level 4</SelectItem>
                  <SelectItem value="5">Level 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="score">Points</Label>
              <Input
                id="score"
                type="number"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                required
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="score_base">Base Score</Label>
              <Input
                id="score_base"
                type="number"
                value={formData.score_base}
                onChange={(e) => setFormData({ ...formData, score_base: e.target.value })}
                required
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="score_min">Minimum Score</Label>
            <Input
              id="score_min"
              type="number"
              value={formData.score_min}
              onChange={(e) => setFormData({ ...formData, score_min: e.target.value })}
              required
              min="1"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
            <Button type="submit" className="flex-1">Create Challenge</Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditChallengeModal({ challenge, onSave, onClose }) {
  const [formData, setFormData] = useState({
    statement: challenge.statement || "",
    help: challenge.help || "",
    solution: challenge.solution || "",
    level: challenge.level?.toString() || "1",
    score: challenge.score?.toString() || "100",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...challenge,
      ...formData,
      level: parseInt(formData.level),
      score: parseInt(formData.score),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Edit Challenge</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="statement">Challenge Statement</Label>
            <Input
              id="statement"
              value={formData.statement}
              onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="help">Help Text (Optional)</Label>
            <Input
              id="help"
              value={formData.help}
              onChange={(e) => setFormData({ ...formData, help: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="solution">Solution</Label>
            <Input
              id="solution"
              value={formData.solution}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                  <SelectItem value="4">Level 4</SelectItem>
                  <SelectItem value="5">Level 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="score">Points</Label>
              <Input
                id="score"
                type="number"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                required
                min="1"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
            <Button type="submit" className="flex-1">Save Changes</Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ challenge, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-red-600">Delete Challenge</h2>
        <p className="text-gray-700 mb-2">
          Are you sure you want to delete this challenge?
        </p>
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <p className="font-medium text-sm">{challenge.statement}</p>
          {challenge.help && (
            <p className="text-xs text-gray-600 mt-1 italic">{challenge.help}</p>
          )}
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <span>Level {challenge.level}</span>
            <span>{challenge.score} points</span>
            <span>{challenge.solves} solves</span>
          </div>
        </div>
        <p className="text-sm text-red-600 mb-4">
          ⚠️ This action cannot be undone. All student progress on this challenge will be lost.
        </p>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            onClick={onConfirm} 
            variant="destructive" 
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Challenge
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
} 
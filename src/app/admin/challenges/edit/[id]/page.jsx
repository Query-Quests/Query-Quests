"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Save,
  X,
  Database,
  Target,
  HelpCircle,
  Code,
  School,
  Star
} from "lucide-react";
import { toast } from "sonner";

export default function EditChallenge() {
  const router = useRouter();
  const params = useParams();
  const challengeId = params.id;

  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [formData, setFormData] = useState({
    statement: "",
    help: "",
    solution: "",
    level: "1",
    initial_score: "100",
    institution_id: "",
  });

  useEffect(() => {
    fetchInstitutions();
    fetchChallenge();
  }, [challengeId]);

  const fetchChallenge = async () => {
    try {
      setIsLoadingChallenge(true);
      const response = await fetch(`/api/challenges/${challengeId}`);

      if (response.ok) {
        const challengeData = await response.json();
        setFormData({
          statement: challengeData.statement || "",
          help: challengeData.help || "",
          solution: challengeData.solution || "",
          level: challengeData.level?.toString() || "1",
          initial_score: challengeData.initial_score?.toString() || "100",
          institution_id: challengeData.institution_id?.toString() || "",
        });
      } else {
        toast.error("Challenge not found");
        router.push("/admin/challenges");
      }
    } catch (error) {
      console.error("Error fetching challenge:", error);
      toast.error("Failed to load challenge");
      router.push("/admin/challenges");
    } finally {
      setIsLoadingChallenge(false);
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
      toast.error("Failed to load institutions");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.statement.trim() || !formData.solution.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const challengeData = {
        ...formData,
        level: parseInt(formData.level),
        initial_score: parseInt(formData.initial_score),
        // Map "none" or empty string to null for the DB
        institution_id: !formData.institution_id || formData.institution_id === "none"
          ? null
          : formData.institution_id,
        updater_id: "545c289e-c1f9-4798-9090-e74e65f116f4", // Admin user ID from create-admin script
      };

      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(challengeData),
      });

      if (response.ok) {
        toast.success("Challenge updated successfully!");
        router.push("/admin/challenges");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update challenge");
      }
    } catch (error) {
      console.error("Error updating challenge:", error);
      toast.error("Error updating challenge. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/challenges");
  };

  const getLevelDescription = (level) => {
    const descriptions = {
      1: "Beginner - Basic SQL concepts",
      2: "Easy - Simple queries and joins",
      3: "Medium - Complex queries and aggregations",
      4: "Hard - Advanced SQL features",
      5: "Expert - Complex database operations"
    };
    return descriptions[level] || descriptions[1];
  };

  const getLevelColor = (level) => {
    const colors = {
      1: "bg-green-100 text-green-800",
      2: "bg-yellow-100 text-yellow-800",
      3: "bg-orange-100 text-orange-800",
      4: "bg-red-100 text-red-800",
      5: "bg-purple-100 text-purple-800"
    };
    return colors[level] || colors[1];
  };

  if (isLoadingChallenge) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading challenge...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Edit Challenge</h1>
            <p className="text-sm text-muted-foreground">
              Modify challenge details and settings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200 text-sm"
          >
            <X className="mr-1 sm:mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="hover:bg-blue-600 hover:shadow-sm transition-all duration-200 text-sm"
          >
            <Save className="mr-1 sm:mr-2 h-4 w-4" />
            {isLoading ? "Updating..." : "Update Challenge"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Challenge Details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <Database className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Challenge Details</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Define the challenge statement and solution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="statement" className="text-sm font-medium">
                  Challenge Statement *
                </Label>
                <Textarea
                  id="statement"
                  placeholder="Describe the SQL challenge that users need to solve..."
                  value={formData.statement}
                  onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
                  className="min-h-[120px] hover:border-blue-300 focus:border-blue-400 transition-colors duration-200"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Clearly explain what the user needs to accomplish
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="help" className="text-sm font-medium">
                  Help Text
                </Label>
                <Textarea
                  id="help"
                  placeholder="Optional hints or guidance for users..."
                  value={formData.help}
                  onChange={(e) => setFormData({ ...formData, help: e.target.value })}
                  className="min-h-[80px] hover:border-blue-300 focus:border-blue-400 transition-colors duration-200"
                />
                <p className="text-xs text-muted-foreground">
                  Provide helpful hints without giving away the solution
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="solution" className="text-sm font-medium">
                  Solution *
                </Label>
                <Textarea
                  id="solution"
                  placeholder="The correct SQL query that solves the challenge..."
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  className="min-h-[120px] font-mono text-sm hover:border-blue-300 focus:border-blue-400 transition-colors duration-200"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The exact SQL query that should be the correct answer
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Scoring Configuration */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Scoring Configuration</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Configure how points are awarded for this challenge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="initial_score" className="text-sm font-medium">
                  Initial Score *
                </Label>
                <Input
                  id="initial_score"
                  type="number"
                  placeholder="100"
                  value={formData.initial_score}
                  onChange={(e) => setFormData({ ...formData, initial_score: e.target.value })}
                  min="1"
                  required
                  className="hover:border-blue-300 focus:border-blue-400 transition-colors duration-200"
                />
                <p className="text-xs text-muted-foreground">
                  Starting points for this challenge. Score decreases as more people solve it.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Challenge Settings */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Challenge Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="level" className="text-sm font-medium">
                  Difficulty Level *
                </Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value })}
                >
                  <SelectTrigger className="hover:border-blue-300 focus:border-blue-400 transition-colors duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 - Beginner</SelectItem>
                    <SelectItem value="2">Level 2 - Easy</SelectItem>
                    <SelectItem value="3">Level 3 - Medium</SelectItem>
                    <SelectItem value="4">Level 4 - Hard</SelectItem>
                    <SelectItem value="5">Level 5 - Expert</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  <Badge className={getLevelColor(formData.level)}>
                    {getLevelDescription(formData.level)}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="institution" className="text-sm font-medium">
                  Institution
                </Label>
                <Select
                  value={formData.institution_id}
                  onValueChange={(value) => setFormData({ ...formData, institution_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select institution (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Institution</SelectItem>
                    {institutions.map((institution) => (
                      <SelectItem key={institution.id} value={institution.id.toString()}>
                        {institution.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Leave empty for platform-wide challenges
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Challenge Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm font-medium">Level:</span>
                <Badge className={getLevelColor(formData.level)}>
                  Level {formData.level}
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm font-medium">Points:</span>
                <span className="text-sm">{formData.score} pts</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm font-medium">Institution:</span>
                <span className="text-sm text-muted-foreground break-words">
                  {(!formData.institution_id || formData.institution_id === "none")
                    ? 'Platform-wide'
                    : (institutions.find(i => i.id.toString() === formData.institution_id)?.name || 'Unknown')}
                </span>
              </div>
              {formData.statement && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium mb-2">Statement Preview:</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-3 break-words">
                    {formData.statement}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

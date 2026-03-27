"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  X,
  Database,
  Target,
  HelpCircle,
  Code,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { ChallengeDifficultyBadge } from "@/components/challenges";

const TABS = ["details", "solution", "settings"];

export default function EditChallenge() {
  const router = useRouter();
  const { user } = useUserRole();
  const params = useParams();
  const challengeId = params.id;

  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState({
    name: "",
    statement: "",
    help: "",
    solution: "",
    level: "1",
    initial_score: "100",
    institution_id: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchInstitutions();
    fetchChallenge();
  }, [challengeId]);

  // Ensure teachers can only edit challenges from their institution
  useEffect(() => {
    if (user && user.isTeacher && !user.isAdmin && user.institution_id && formData.institution_id) {
      if (formData.institution_id !== user.institution_id.toString() && formData.institution_id !== "none" && formData.institution_id !== "") {
        toast.error("You can only edit challenges from your institution");
        router.push("/admin/challenges");
      }
    }
  }, [user, formData.institution_id, router]);

  const fetchChallenge = async () => {
    try {
      setIsLoadingChallenge(true);
      const response = await fetch(`/api/challenges/${challengeId}`);

      if (response.ok) {
        const challengeData = await response.json();
        setFormData({
          name: challengeData.name || "",
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

  const validateTab = (tab) => {
    const newErrors = {};

    if (tab === "details") {
      if (!formData.name.trim()) {
        newErrors.name = "Challenge name is required";
      }
      if (!formData.statement.trim()) {
        newErrors.statement = "Challenge statement is required";
      }
    }

    if (tab === "solution") {
      if (!formData.solution.trim()) {
        newErrors.solution = "Solution is required";
      }
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateAll = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Challenge name is required";
    }
    if (!formData.statement.trim()) {
      newErrors.statement = "Challenge statement is required";
    }
    if (!formData.solution.trim()) {
      newErrors.solution = "Solution is required";
    }
    if (!formData.initial_score || parseInt(formData.initial_score) < 1) {
      newErrors.initial_score = "Initial score must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNextTab = () => {
    const currentIndex = TABS.indexOf(activeTab);
    if (validateTab(activeTab) && currentIndex < TABS.length - 1) {
      setActiveTab(TABS[currentIndex + 1]);
    }
  };

  const goToPrevTab = () => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(TABS[currentIndex - 1]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      if (errors.name || errors.statement) {
        setActiveTab("details");
      } else if (errors.solution) {
        setActiveTab("solution");
      }
      toast.error("Please fill in all required fields");
      return;
    }

    const userData = localStorage.getItem("user");
    if (!userData) {
      toast.error("User not authenticated");
      return;
    }

    let currentUser;
    try {
      currentUser = JSON.parse(userData);
    } catch (error) {
      toast.error("Invalid user session");
      return;
    }

    setIsLoading(true);
    try {
      const challengeData = {
        ...formData,
        level: parseInt(formData.level),
        initial_score: parseInt(formData.initial_score),
        institution_id: !formData.institution_id || formData.institution_id === "none"
          ? null
          : formData.institution_id,
        updater_id: currentUser.id,
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

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isTabComplete = (tab) => {
    if (tab === "details") {
      return formData.name.trim() && formData.statement.trim();
    }
    if (tab === "solution") {
      return formData.solution.trim();
    }
    return true;
  };

  const getInstitutionName = () => {
    if (!formData.institution_id || formData.institution_id === "none") {
      return "Platform-wide";
    }
    return institutions.find(i => i.id.toString() === formData.institution_id)?.name || "Unknown";
  };

  if (isLoadingChallenge) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading challenge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Challenge</h1>
          <p className="text-muted-foreground">
            Modify challenge details and settings
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="flex items-center gap-2">
              {isTabComplete("details") ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Details</span>
            </TabsTrigger>
            <TabsTrigger value="solution" className="flex items-center gap-2">
              {isTabComplete("solution") ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Code className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Solution</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Challenge Details
                </CardTitle>
                <CardDescription>
                  Define the challenge name, statement, and optional help text
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-1">
                    Challenge Name
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Select All Customers"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    A clear, concise name that describes the challenge
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statement" className="flex items-center gap-1">
                    Challenge Statement
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="statement"
                    placeholder="Write a SQL query that retrieves all customers from the database..."
                    value={formData.statement}
                    onChange={(e) => updateFormData("statement", e.target.value)}
                    className={`min-h-[150px] ${errors.statement ? "border-red-500" : ""}`}
                  />
                  {errors.statement && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.statement}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Clearly explain what the user needs to accomplish
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="help" className="flex items-center gap-1">
                    <HelpCircle className="h-4 w-4" />
                    Help Text (Optional)
                  </Label>
                  <Textarea
                    id="help"
                    placeholder="Hint: Consider using the SELECT statement with the FROM clause..."
                    value={formData.help}
                    onChange={(e) => updateFormData("help", e.target.value)}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide helpful hints without giving away the solution
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Solution Tab */}
          <TabsContent value="solution" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  SQL Solution
                </CardTitle>
                <CardDescription>
                  Provide the correct SQL query that solves the challenge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="solution" className="flex items-center gap-1">
                    Solution Query
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="solution"
                    placeholder="SELECT * FROM customers;"
                    value={formData.solution}
                    onChange={(e) => updateFormData("solution", e.target.value)}
                    className={`min-h-[200px] font-mono text-sm ${errors.solution ? "border-red-500" : ""}`}
                  />
                  {errors.solution && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.solution}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    The exact SQL query that should be the correct answer
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Difficulty & Scoring
                  </CardTitle>
                  <CardDescription>
                    Configure the challenge difficulty and point value
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="level">Difficulty Level</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => updateFormData("level", value)}
                    >
                      <SelectTrigger>
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
                      <ChallengeDifficultyBadge level={parseInt(formData.level)} />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="initial_score" className="flex items-center gap-1">
                      Initial Score
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="initial_score"
                      type="number"
                      min="1"
                      value={formData.initial_score}
                      onChange={(e) => updateFormData("initial_score", e.target.value)}
                      className={errors.initial_score ? "border-red-500" : ""}
                    />
                    {errors.initial_score && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.initial_score}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Starting points for this challenge. Score decreases as more people solve it.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Institution & Preview</CardTitle>
                  <CardDescription>
                    Assign to an institution or make platform-wide
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="institution">Institution</Label>
                    {user && user.isTeacher && !user.isAdmin && user.institution_id ? (
                      <div className="px-3 py-2 border border-input bg-muted rounded-md text-sm">
                        {user.institution?.name || institutions.find(i => i.id === user.institution_id)?.name || "Your Institution"}
                        <span className="ml-2 text-xs text-muted-foreground">(Your Institution)</span>
                      </div>
                    ) : (
                      <Select
                        value={formData.institution_id}
                        onValueChange={(value) => updateFormData("institution_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select institution (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Institution (Platform-wide)</SelectItem>
                          {institutions.map((institution) => (
                            <SelectItem key={institution.id} value={institution.id.toString()}>
                              {institution.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <Separator />

                  {/* Preview */}
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-sm">Challenge Preview</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Difficulty:</span>
                        <ChallengeDifficultyBadge level={parseInt(formData.level)} compact />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Points:</span>
                        <span className="font-medium">{formData.initial_score} pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Institution:</span>
                        <span className="font-medium truncate max-w-[150px]">
                          {getInstitutionName()}
                        </span>
                      </div>
                      {formData.name && (
                        <div className="pt-2 border-t">
                          <span className="text-muted-foreground">Name:</span>
                          <p className="font-medium truncate">{formData.name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t">
          <div className="flex gap-2">
            {activeTab !== "details" && (
              <Button type="button" variant="outline" onClick={goToPrevTab}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            {activeTab !== "settings" ? (
              <Button type="button" onClick={goToNextTab}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Updating..." : "Update Challenge"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

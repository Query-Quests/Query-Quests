"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Database,
  Target,
  HelpCircle,
  Code,
  AlertCircle,
} from "lucide-react";
import { ChallengeDifficultyBadge } from "./ChallengeDifficultyBadge";

export function EditChallengeDialog({
  challenge,
  open,
  onOpenChange,
  institutions = [],
  user,
  onSave,
  isLoading = false,
}) {
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

  // Initialize form data when challenge changes
  useEffect(() => {
    if (challenge) {
      setFormData({
        name: challenge.name || "",
        statement: challenge.statement || "",
        help: challenge.help || "",
        solution: challenge.solution || "",
        level: challenge.level?.toString() || "1",
        initial_score: challenge.initial_score?.toString() || "100",
        institution_id: challenge.institution_id?.toString() || "",
      });
      setErrors({});
      setActiveTab("details");
    }
  }, [challenge]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      if (errors.name || errors.statement) {
        setActiveTab("details");
      } else if (errors.solution) {
        setActiveTab("solution");
      }
      return;
    }

    const updatedChallenge = {
      ...challenge,
      ...formData,
      level: parseInt(formData.level),
      initial_score: parseInt(formData.initial_score),
      institution_id: !formData.institution_id || formData.institution_id === "none"
        ? null
        : formData.institution_id,
    };

    if (onSave) {
      await onSave(updatedChallenge);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isTeacherWithInstitution = user && user.isTeacher && !user.isAdmin && user.institution_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Challenge</DialogTitle>
          <DialogDescription>
            Modify the challenge details, solution, and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Details</span>
              </TabsTrigger>
              <TabsTrigger value="solution" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span className="hidden sm:inline">Solution</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="flex items-center gap-1">
                  Challenge Name
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-statement" className="flex items-center gap-1">
                  Challenge Statement
                  <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="edit-statement"
                  placeholder="Write a SQL query that..."
                  value={formData.statement}
                  onChange={(e) => updateFormData("statement", e.target.value)}
                  className={`min-h-[120px] ${errors.statement ? "border-red-500" : ""}`}
                />
                {errors.statement && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.statement}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-help" className="flex items-center gap-1">
                  <HelpCircle className="h-4 w-4" />
                  Help Text (Optional)
                </Label>
                <Textarea
                  id="edit-help"
                  placeholder="Hint: Consider using..."
                  value={formData.help}
                  onChange={(e) => updateFormData("help", e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </TabsContent>

            {/* Solution Tab */}
            <TabsContent value="solution" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-solution" className="flex items-center gap-1">
                  Solution Query
                  <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="edit-solution"
                  placeholder="SELECT * FROM customers;"
                  value={formData.solution}
                  onChange={(e) => updateFormData("solution", e.target.value)}
                  className={`min-h-[180px] font-mono text-sm ${errors.solution ? "border-red-500" : ""}`}
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
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-level">Difficulty Level</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => updateFormData("level", value)}
                  >
                    <SelectTrigger id="edit-level">
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
                  <div className="pt-1">
                    <ChallengeDifficultyBadge level={parseInt(formData.level)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-initial_score" className="flex items-center gap-1">
                    Initial Score
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-initial_score"
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
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="edit-institution">Institution</Label>
                {isTeacherWithInstitution ? (
                  <div className="px-3 py-2 border border-input bg-muted rounded-md text-sm">
                    {user.institution?.name || institutions.find(i => i.id === user.institution_id)?.name || "Your Institution"}
                    <span className="ml-2 text-xs text-muted-foreground">(Your Institution)</span>
                  </div>
                ) : (
                  <Select
                    value={formData.institution_id}
                    onValueChange={(value) => updateFormData("institution_id", value)}
                  >
                    <SelectTrigger id="edit-institution">
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
                <p className="text-xs text-muted-foreground">
                  {isTeacherWithInstitution
                    ? "Challenge belongs to your institution"
                    : "Leave empty for platform-wide challenges"
                  }
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditChallengeDialog;

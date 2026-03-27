"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Play,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ChallengeDifficultyBadge } from "./ChallengeDifficultyBadge";
import Link from "next/link";

const TABS = ["details", "solution", "database", "settings"];

export function CreateChallengeForm({
  institutions = [],
  user,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData = null,
}) {
  const [activeTab, setActiveTab] = useState("details");
  const [databases, setDatabases] = useState([]);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [isPreviewingQuery, setIsPreviewingQuery] = useState(false);
  const [queryPreviewResult, setQueryPreviewResult] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    statement: "",
    help: "",
    solution: "",
    level: "1",
    initial_score: "100",
    institution_id: "",
    database_id: "",
    expectedResult: "",
    requiredKeywords: "",
    ...initialData,
  });
  const [errors, setErrors] = useState({});

  // Fetch available databases
  useEffect(() => {
    fetchDatabases();
  }, []);

  // Set institution for teachers
  useEffect(() => {
    if (user && user.isTeacher && !user.isAdmin && user.institution_id) {
      setFormData(prev => ({
        ...prev,
        institution_id: user.institution_id.toString()
      }));
    }
  }, [user]);

  const fetchDatabases = async () => {
    setIsLoadingDatabases(true);
    try {
      const response = await fetch("/api/databases?status=ready&limit=100");
      if (response.ok) {
        const data = await response.json();
        setDatabases(data.databases || []);
      }
    } catch (error) {
      console.error("Error fetching databases:", error);
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  const previewExpectedQuery = async () => {
    if (!formData.solution.trim()) {
      toast.error("Please enter a solution query first");
      return;
    }

    if (!formData.database_id) {
      toast.error("Please select a database first");
      return;
    }

    setIsPreviewingQuery(true);
    setQueryPreviewResult(null);

    try {
      const userData = localStorage.getItem("user");
      const currentUser = userData ? JSON.parse(userData) : null;

      const response = await fetch("/api/challenges/new/preview-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: formData.solution,
          user_id: currentUser?.id,
          database_id: formData.database_id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setQueryPreviewResult(result);
        // Auto-set the expected result
        setFormData(prev => ({
          ...prev,
          expectedResult: result.resultJson,
        }));
        toast.success(`Query returned ${result.rowCount} rows`);
      } else {
        toast.error(result.error || "Failed to preview query");
        setQueryPreviewResult({ error: result.error });
      }
    } catch (error) {
      console.error("Error previewing query:", error);
      toast.error("Error executing query");
    } finally {
      setIsPreviewingQuery(false);
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

    const challengeData = {
      ...formData,
      level: parseInt(formData.level),
      initial_score: parseInt(formData.initial_score),
      institution_id: !formData.institution_id || formData.institution_id === "none"
        ? null
        : formData.institution_id,
      database_id: !formData.database_id || formData.database_id === "none"
        ? null
        : formData.database_id,
    };

    if (onSubmit) {
      await onSubmit(challengeData);
    }
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
    if (tab === "database") {
      return true; // Database is optional
    }
    return true;
  };

  const getInstitutionName = () => {
    if (!formData.institution_id || formData.institution_id === "none") {
      return "Platform-wide";
    }
    return institutions.find(i => i.id.toString() === formData.institution_id)?.name || "Unknown";
  };

  const selectedDatabase = databases.find(db => db.id === formData.database_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Database</span>
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
                  This query will be used to generate the expected result for validation
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database & Validation
              </CardTitle>
              <CardDescription>
                Configure the challenge database and validation rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Database Selection */}
              <div className="space-y-2">
                <Label htmlFor="database">Challenge Database</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.database_id}
                    onValueChange={(value) => updateFormData("database_id", value)}
                    disabled={isLoadingDatabases}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a database" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Database (Legacy Mode)</SelectItem>
                      {databases.map((db) => (
                        <SelectItem key={db.id} value={db.id}>
                          {db.name} ({db.tableCount} tables, {db.rowCount.toLocaleString()} rows)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/admin/databases">
                      <Plus className="h-4 w-4 mr-2" />
                      New
                    </Link>
                  </Button>
                </div>
                {selectedDatabase && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <div className="font-medium">{selectedDatabase.name}</div>
                    <div className="text-muted-foreground">
                      {selectedDatabase.tableCount} tables - {selectedDatabase.rowCount.toLocaleString()} rows
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Expected Result Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Expected Result</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={previewExpectedQuery}
                    disabled={isPreviewingQuery || !formData.database_id || !formData.solution}
                  >
                    {isPreviewingQuery ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Solution Query
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Run your solution query against the selected database to generate the expected result
                </p>

                {queryPreviewResult && !queryPreviewResult.error && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-3 py-2 text-sm font-medium flex items-center justify-between">
                      <span>Query Result ({queryPreviewResult.rowCount} rows)</span>
                      <span className="text-xs text-muted-foreground">
                        {queryPreviewResult.executionTimeMs}ms
                      </span>
                    </div>
                    <div className="max-h-[300px] overflow-auto">
                      {queryPreviewResult.rows && queryPreviewResult.rows.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {Object.keys(queryPreviewResult.rows[0]).map((col) => (
                                <TableHead key={col} className="whitespace-nowrap">
                                  {col}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {queryPreviewResult.rows.slice(0, 10).map((row, idx) => (
                              <TableRow key={idx}>
                                {Object.values(row).map((value, i) => (
                                  <TableCell key={i} className="font-mono text-xs whitespace-nowrap">
                                    {value === null ? (
                                      <span className="text-muted-foreground italic">NULL</span>
                                    ) : (
                                      String(value)
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          No results
                        </div>
                      )}
                    </div>
                    {queryPreviewResult.rows && queryPreviewResult.rows.length > 10 && (
                      <div className="bg-muted px-3 py-2 text-xs text-muted-foreground">
                        Showing first 10 of {queryPreviewResult.rowCount} rows
                      </div>
                    )}
                  </div>
                )}

                {queryPreviewResult?.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    {queryPreviewResult.error}
                  </div>
                )}

                {formData.expectedResult && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Expected result saved ({JSON.parse(formData.expectedResult).length} rows)
                  </div>
                )}
              </div>

              <Separator />

              {/* Required Keywords */}
              <div className="space-y-2">
                <Label htmlFor="requiredKeywords">Required SQL Keywords (Optional)</Label>
                <Input
                  id="requiredKeywords"
                  placeholder="e.g., JOIN, WHERE, GROUP BY"
                  value={formData.requiredKeywords}
                  onChange={(e) => updateFormData("requiredKeywords", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated keywords that must appear in the student's query (case-insensitive)
                </p>
                {formData.requiredKeywords && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.requiredKeywords.split(",").map((kw, i) => (
                      <Badge key={i} variant="secondary">
                        {kw.trim().toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                )}
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
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Database:</span>
                      <span className="font-medium truncate max-w-[150px]">
                        {selectedDatabase?.name || "None"}
                      </span>
                    </div>
                    {formData.expectedResult && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Validation:</span>
                        <Badge variant="outline" className="bg-green-50">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Configured
                        </Badge>
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
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
              {isLoading ? "Creating..." : "Create Challenge"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

export default CreateChallengeForm;

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header";
import XTerminal from "@/components/XTerminal";
import ChallengeSuccessModal from "@/components/ChallengeSuccessModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Database,
  Code,
  Trophy,
  Target,
  Eye,
  EyeOff,
  Clock,
  Users,
  Star,
  Lightbulb,
  Terminal,
  Award,
  TrendingUp,
  ChevronRight,
  Home,
  Zap,
  GraduationCap,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeft,
  X,
  CheckCheck
} from "lucide-react";
import Link from "next/link";

// Level Badge Component
function LevelBadge({ level }) {
  const levelConfig = {
    1: { label: "Beginner", color: "bg-emerald-500", textColor: "text-emerald-700", bgColor: "bg-emerald-50" },
    2: { label: "Easy", color: "bg-[#19aa59]", textColor: "text-[#19aa59]", bgColor: "bg-[#19aa59]/10" },
    3: { label: "Medium", color: "bg-amber-500", textColor: "text-amber-700", bgColor: "bg-amber-50" },
    4: { label: "Hard", color: "bg-orange-500", textColor: "text-orange-700", bgColor: "bg-orange-50" },
    5: { label: "Expert", color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50" },
  };

  const config = levelConfig[level] || levelConfig[1];

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${config.bgColor}`}>
      <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
      <span className={`text-sm font-semibold ${config.textColor}`}>{config.label}</span>
    </div>
  );
}

// Stat Item Component
function StatItem({ icon: Icon, label, value, color = "text-[#030914]" }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

export default function ChallengeDetail() {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false);
  const [isTerminalFullscreen, setIsTerminalFullscreen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [databaseName, setDatabaseName] = useState("practice");
  const [validating, setValidating] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  const params = useParams();
  const router = useRouter();

  const fetchChallenge = useCallback(async () => {
    try {
      setLoading(true);

      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User not authenticated');
      }

      const user = JSON.parse(userData);
      setUser(user);

      const response = await fetch(`/api/challenges/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Challenge not found');
        }
        throw new Error('Failed to fetch challenge');
      }

      const challengeData = await response.json();
      setChallenge(challengeData);

      // Set the database name from the challenge's associated database
      if (challengeData.database_id && challengeData.database?.mysqlDbName) {
        setDatabaseName(challengeData.database.mysqlDbName);
      } else if (challengeData.database?.mysqlDbName) {
        setDatabaseName(challengeData.database.mysqlDbName);
      }

      setSqlQuery("-- Write your SQL query here\nSELECT ");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
      setQueryError("Please enter a SQL query");
      return;
    }

    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const isCorrect = Math.random() > 0.5;

      setAttempts(prev => prev + 1);

      if (isCorrect) {
        setIsCompleted(true);
        setScore(Math.max(challenge.score_min, challenge.score_base - (attempts * 10)));
        setQueryResult({
          success: true,
          message: "Congratulations! Your query is correct!",
          data: [
            { id: 1, name: "Sample Result", value: "Success" },
            { id: 2, name: "Another Row", value: "Data" }
          ]
        });
      } else {
        setQueryResult({
          success: false,
          message: "Query executed but results don't match expected output.",
          data: [
            { id: 1, name: "Your Result", value: "Incorrect" }
          ]
        });
      }
    } catch (err) {
      setQueryError("Failed to execute query: " + err.message);
    } finally {
      setQueryLoading(false);
    }
  };

  const resetQuery = () => {
    setSqlQuery("-- Write your SQL query here\nSELECT ");
    setQueryResult(null);
    setQueryError(null);
  };

  const validateQuery = async (queryToValidate = null) => {
    const query = queryToValidate || lastQuery || sqlQuery;

    if (!query || !query.trim()) {
      setQueryError("Please enter a SQL query first");
      return;
    }

    if (!user?.id) {
      setQueryError("User not authenticated");
      return;
    }

    setValidating(true);
    setQueryError(null);

    try {
      // Call the validate endpoint
      const validateResponse = await fetch(`/api/challenges/${params.id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          user_id: user.id,
        }),
      });

      const validateData = await validateResponse.json();

      if (!validateResponse.ok) {
        setQueryError(validateData.error || "Validation failed");
        return;
      }

      setAttempts(prev => prev + 1);

      if (validateData.isCorrect) {
        // Query is correct! Now call the solve endpoint
        const solveResponse = await fetch(`/api/challenges/${params.id}/solve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            validated: true,
          }),
        });

        const solveData = await solveResponse.json();

        if (solveResponse.ok && solveData.success) {
          setIsCompleted(true);
          setScore(solveData.pointsAwarded || 0);

          // Update user's total score in localStorage
          const updatedUser = { ...user, totalScore: solveData.totalScore };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);

          // Set success data and show modal
          setSuccessData({
            pointsAwarded: solveData.pointsAwarded || 0,
            totalScore: solveData.totalScore,
            rank: solveData.rank,
            solvedChallenges: solveData.solvedChallenges,
            nextChallenge: solveData.nextChallenge,
            alreadySolved: solveData.alreadySolved,
          });
          setShowSuccessModal(true);

          setQueryResult({
            success: true,
            message: solveData.alreadySolved
              ? "Challenge already completed! No additional points awarded."
              : "Congratulations! Your query is correct!",
          });
        } else {
          // Solve failed but validation was correct
          setQueryResult({
            success: true,
            message: solveData.error || "Query is correct but failed to record solve.",
          });
        }
      } else {
        // Query is incorrect
        setQueryResult({
          success: false,
          message: validateData.feedback || "Query executed but results don't match expected output.",
          missingKeywords: validateData.missingKeywords,
        });
      }
    } catch (err) {
      console.error("Validation error:", err);
      setQueryError("Failed to validate query: " + err.message);
    } finally {
      setValidating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#19aa59] border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg text-gray-500">Loading challenge...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-md mx-auto px-4 py-12">
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Database className="h-8 w-8 text-gray-400" />
                </div>
                <h1 className="text-2xl font-bold text-[#030914] mb-2">Challenge Not Found</h1>
                <p className="text-gray-500 mb-6">{error || "The challenge you're looking for doesn't exist."}</p>
                <Button asChild className="bg-[#19aa59] hover:bg-[#15934d] text-white">
                  <Link href="/challenges">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Challenges
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/home" className="text-gray-500 hover:text-[#19aa59] transition-colors flex items-center gap-1">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <Link href="/challenges" className="text-gray-500 hover:text-[#19aa59] transition-colors">
              Challenges
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className="text-[#030914] font-medium">
              {challenge.name || `Challenge #${challenge.id}`}
            </span>
          </nav>

          {/* Quick Stats */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm">
              <Star className="h-4 w-4 text-[#19aa59]" />
              <span className="font-semibold text-[#030914]">{challenge.current_score || challenge.score}</span>
              <span className="text-gray-400">pts</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>{challenge.solves} solves</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Terminal Modal */}
      {isTerminalFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#030914]">
          {/* Fullscreen Header */}
          <div className="px-4 py-3 bg-[#0a1628] border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#19aa59]/20 rounded-lg flex items-center justify-center">
                  <Terminal className="h-4 w-4 text-[#19aa59]" />
                </div>
                <div>
                  <h2 className="font-semibold text-white text-sm">SQL Console - Fullscreen</h2>
                  <p className="text-xs text-gray-500">{challenge.name || `Challenge #${challenge.id}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTerminalFullscreen(false)}
                  className="border-gray-600 bg-gray-700/50 text-gray-200 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all"
                >
                  <X className="h-4 w-4 mr-2" />
                  Close Fullscreen
                </Button>
              </div>
            </div>
          </div>
          {/* Fullscreen Terminal */}
          <div className="h-[calc(100vh-56px)]">
            <XTerminal
              mode="shell"
              challengeId={params.id}
              databaseName={databaseName}
              onQueryResult={(result) => {
                setQueryResult(result);
                if (result.query) setLastQuery(result.query);
                if (result.success && result.type === 'challenge_completed') {
                  setIsCompleted(true);
                  setScore(result.score);
                }
              }}
              onQueryError={(error) => {
                setQueryError(error.error);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content - 2 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - SQL Console */}
        <div className={`relative bg-[#030914] flex flex-col transition-all duration-300 ${
          isTerminalExpanded ? 'w-full' : 'w-1/2'
        }`}>
          {/* Console Header */}
          <div className="px-4 py-3 bg-[#0a1628] border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#19aa59]/20 rounded-lg flex items-center justify-center">
                  <Terminal className="h-4 w-4 text-[#19aa59]" />
                </div>
                <div>
                  <h2 className="font-semibold text-white text-sm">SQL Console</h2>
                  <p className="text-xs text-gray-500">Write and execute your queries</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Expand/Collapse Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTerminalExpanded(!isTerminalExpanded)}
                  className="border-gray-600 bg-gray-700/50 text-gray-200 hover:bg-[#19aa59]/20 hover:text-[#19aa59] hover:border-[#19aa59]/50 transition-all"
                  title={isTerminalExpanded ? "Show challenge details" : "Expand terminal"}
                >
                  {isTerminalExpanded ? (
                    <PanelLeft className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                </Button>

                {/* Fullscreen Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTerminalFullscreen(true)}
                  className="border-gray-600 bg-gray-700/50 text-gray-200 hover:bg-[#19aa59]/20 hover:text-[#19aa59] hover:border-[#19aa59]/50 transition-all"
                  title="Open fullscreen terminal"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-gray-700 mx-1" />

                <Button
                  onClick={executeQuery}
                  disabled={queryLoading || !sqlQuery.trim()}
                  size="sm"
                  className="bg-[#19aa59] hover:bg-[#15934d] text-white"
                >
                  {queryLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {queryLoading ? "Running..." : "Run Query"}
                </Button>

                <Button
                  onClick={() => validateQuery()}
                  disabled={validating || isCompleted}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {validating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <CheckCheck className="h-4 w-4 mr-2" />
                  )}
                  {validating ? "Validating..." : "Validate Query"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetQuery}
                  disabled={queryLoading}
                  className="border-gray-600 bg-gray-700/50 text-gray-200 hover:bg-[#19aa59]/20 hover:text-[#19aa59] hover:border-[#19aa59]/50 transition-all"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Database Terminal */}
          <div className="flex-1">
            <XTerminal
              mode="shell"
              challengeId={params.id}
              databaseName={databaseName}
              onQueryResult={(result) => {
                setQueryResult(result);
                if (result.query) setLastQuery(result.query);
                if (result.success && result.type === 'challenge_completed') {
                  setIsCompleted(true);
                  setScore(result.score);
                }
              }}
              onQueryError={(error) => {
                setQueryError(error.error);
              }}
            />
          </div>

          {/* Floating Challenge Info (when expanded) */}
          {isTerminalExpanded && (
            <div className="absolute top-16 right-4 z-10 max-w-md">
              <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <LevelBadge level={challenge.level} />
                      {isCompleted && (
                        <Badge className="bg-[#19aa59]/10 text-[#19aa59] border-0 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Done
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsTerminalExpanded(false)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="font-semibold text-[#030914] text-sm mb-2">
                    {challenge.name || `Challenge #${challenge.id}`}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                    {challenge.statement}
                  </p>
                  {challenge.help && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHint(!showHint)}
                      className="mt-2 p-0 h-auto text-blue-600 hover:text-blue-700 text-xs"
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      {showHint ? "Hide Hint" : "Show Hint"}
                    </Button>
                  )}
                  {showHint && challenge.help && (
                    <p className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                      {challenge.help}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Query Results */}
          {(queryResult || queryError) && (
            <div className="bg-[#0a1628] border-t border-gray-800">
              <div className="px-4 py-2 border-b border-gray-800">
                <h3 className="font-medium text-[#19aa59] text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Query Results
                </h3>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                {queryError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <XCircle className="h-4 w-4" />
                      <span className="font-semibold text-sm">Query Error</span>
                    </div>
                    <p className="text-red-300 text-sm">{queryError}</p>
                  </div>
                )}

                {queryResult && (
                  <div className={`border rounded-xl p-4 ${queryResult.success
                      ? 'bg-[#19aa59]/10 border-[#19aa59]/30'
                      : 'bg-amber-500/10 border-amber-500/30'
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {queryResult.success ? (
                        <CheckCircle className="h-5 w-5 text-[#19aa59]" />
                      ) : (
                        <XCircle className="h-5 w-5 text-amber-400" />
                      )}
                      <span className={`font-semibold ${queryResult.success ? 'text-[#19aa59]' : 'text-amber-400'
                        }`}>
                        {queryResult.success ? 'Success!' : 'Try Again'}
                      </span>
                    </div>

                    <p className={`text-sm mb-3 ${queryResult.success ? 'text-emerald-300' : 'text-amber-300'
                      }`}>
                      {queryResult.message}
                    </p>

                    {queryResult.data && queryResult.data.length > 0 && (
                      <div className="bg-[#030914] border border-gray-700 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-800/50">
                              <tr>
                                {Object.keys(queryResult.data[0]).map((key) => (
                                  <th key={key} className="px-3 py-2 text-left font-medium text-gray-400 uppercase tracking-wider">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                              {queryResult.data.map((row, index) => (
                                <tr key={index} className="hover:bg-gray-800/30">
                                  {Object.values(row).map((value, cellIndex) => (
                                    <td key={cellIndex} className="px-3 py-2 text-gray-300">
                                      {value}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Challenge Details */}
        <div className={`bg-white flex flex-col overflow-y-auto border-l border-gray-200 transition-all duration-300 ${
          isTerminalExpanded ? 'w-0 overflow-hidden' : 'w-1/2'
        }`}>
          {/* Challenge Header */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <LevelBadge level={challenge.level} />
                {isCompleted && (
                  <Badge className="bg-[#19aa59]/10 text-[#19aa59] border-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#19aa59] to-emerald-600 rounded-xl flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-[#030914] mb-3">
              {challenge.name || `SQL Challenge #${challenge.id}`}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{challenge.solves} solves</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{formatDate(challenge.created_at)}</span>
              </div>
              {challenge.institution && (
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  <span>{challenge.institution.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Challenge Content */}
          <div className="flex-1 p-6 space-y-6">
            {/* Challenge Statement */}
            <div>
              <h3 className="font-semibold text-[#030914] mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-[#19aa59]/10 rounded-lg flex items-center justify-center">
                  <Code className="h-3.5 w-3.5 text-[#19aa59]" />
                </div>
                Challenge Statement
              </h3>
              <Card className="border-0 shadow-sm bg-gray-50">
                <CardContent className="p-4">
                  <p className="text-gray-700 leading-relaxed">{challenge.statement}</p>
                </CardContent>
              </Card>
            </div>

            {/* Hint Section */}
            {challenge.help && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHint(!showHint)}
                  className="mb-2 p-0 h-auto text-blue-600 hover:text-blue-700 hover:bg-transparent"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Lightbulb className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <span className="font-semibold">{showHint ? "Hide Hint" : "Need a Hint?"}</span>
                  </div>
                </Button>
                {showHint && (
                  <Card className="border-0 shadow-sm bg-blue-50">
                    <CardContent className="p-4">
                      <p className="text-sm text-blue-800">{challenge.help}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Challenge Stats */}
            <div>
              <h3 className="font-semibold text-[#030914] mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-3.5 w-3.5 text-violet-600" />
                </div>
                Challenge Stats
              </h3>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 divide-y divide-gray-100">
                  <StatItem icon={Star} label="Base Score" value={challenge.score_base} />
                  <StatItem icon={Target} label="Minimum Score" value={challenge.score_min} />
                  <StatItem icon={Zap} label="Your Attempts" value={attempts} />
                  {isCompleted && (
                    <div className="pt-3">
                      <div className="flex items-center justify-between bg-[#19aa59]/10 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 text-[#19aa59]">
                          <Award className="h-4 w-4" />
                          <span className="text-sm font-medium">Your Score</span>
                        </div>
                        <span className="font-bold text-[#19aa59] text-lg">{score}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Solution Section */}
            <div>
              <h3 className="font-semibold text-[#030914] mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-3.5 w-3.5 text-amber-600" />
                </div>
                Solution
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSolution(!showSolution)}
                className={`w-full mb-3 ${isCompleted
                    ? 'border-[#19aa59]/30 text-[#19aa59] hover:bg-[#19aa59]/10'
                    : 'border-gray-200 text-gray-400'
                  }`}
                disabled={!isCompleted}
              >
                {showSolution ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showSolution ? "Hide Solution" : "View Solution"}
              </Button>
              {!isCompleted && (
                <p className="text-xs text-gray-500 text-center">
                  Complete the challenge to unlock the solution
                </p>
              )}
              {showSolution && isCompleted && (
                <Card className="border-0 shadow-sm bg-[#030914]">
                  <CardContent className="p-4">
                    <code className="text-sm text-[#19aa59] whitespace-pre-wrap font-mono">
                      {challenge.solution}
                    </code>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <ChallengeSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        pointsAwarded={successData?.pointsAwarded || 0}
        totalScore={successData?.totalScore || 0}
        rank={successData?.rank || 0}
        solvedChallenges={successData?.solvedChallenges || 0}
        nextChallenge={successData?.nextChallenge}
        challengeName={challenge?.name || `Challenge #${challenge?.id}`}
        alreadySolved={successData?.alreadySolved || false}
      />
    </div>
  );
}

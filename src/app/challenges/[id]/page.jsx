"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header";
import XTerminal from "@/components/XTerminal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import LevelBadge from "@/components/LevelBadge";
import { 
  ArrowLeft, 
  Play, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Database,
  Code,
  Trophy,
  Target,
  HelpCircle,
  Eye,
  EyeOff,
  Clock,
  Users,
  Star,
  Lightbulb
} from "lucide-react";
import Link from "next/link";

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

  const params = useParams();
  const router = useRouter();

  const fetchChallenge = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get user data from localStorage
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
      
      // Initialize SQL query with a template
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
      // This would typically send the query to your backend for execution
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate checking if the query is correct
      const isCorrect = Math.random() > 0.5; // Random for demo
      
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-lg text-gray-600">Loading challenge...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !challenge) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Challenge Not Found</h1>
              <p className="text-gray-600 mb-6">{error || "The challenge you're looking for doesn't exist."}</p>
              <Button asChild>
                <Link href="/challenges">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Challenges
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Back Button */}
        <div className="px-4 py-2 border-b bg-white">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/challenges">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Challenges
            </Link>
          </Button>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - SQL Console */}
          <div className="w-1/2 bg-black flex flex-col">
            {/* Console Header */}
            <div className="px-4 py-3 bg-gray-900 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-green-400 flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  SQL Console
                </h2>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={executeQuery} 
                    disabled={queryLoading || !sqlQuery.trim()}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {queryLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {queryLoading ? "Executing..." : "Execute"}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetQuery}
                    disabled={queryLoading}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
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
                mode="database"
                challengeId={params.id}
                onQueryResult={(result) => {
                  setQueryResult(result);
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

            {/* Query Results */}
            {(queryResult || queryError) && (
              <div className="bg-gray-900 border-t border-gray-700">
                <div className="px-4 py-2 border-b border-gray-700">
                  <h3 className="font-medium text-green-400 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Results
                  </h3>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  {queryError && (
                    <div className="bg-red-900 border border-red-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-red-300 mb-2">
                        <XCircle className="h-4 w-4" />
                        <span className="font-medium text-sm">Query Error</span>
                      </div>
                      <p className="text-red-200 text-sm">{queryError}</p>
                    </div>
                  )}
                  
                  {queryResult && (
                    <div className={`border rounded-lg p-3 ${
                      queryResult.success 
                        ? 'bg-green-900 border-green-700' 
                        : 'bg-yellow-900 border-yellow-700'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {queryResult.success ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-yellow-400" />
                        )}
                        <span className={`font-medium text-sm ${
                          queryResult.success ? 'text-green-300' : 'text-yellow-300'
                        }`}>
                          {queryResult.success ? 'Success!' : 'Try Again'}
                        </span>
                      </div>
                      
                      <p className={`text-sm mb-3 ${
                        queryResult.success ? 'text-green-200' : 'text-yellow-200'
                      }`}>
                        {queryResult.message}
                      </p>
                      
                      {queryResult.data && queryResult.data.length > 0 && (
                        <div className="bg-gray-800 border border-gray-600 rounded overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-700">
                                <tr>
                                  {Object.keys(queryResult.data[0]).map((key) => (
                                    <th key={key} className="px-2 py-1 text-left font-medium text-gray-300">
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {queryResult.data.map((row, index) => (
                                  <tr key={index} className="border-t border-gray-600">
                                    {Object.values(row).map((value, cellIndex) => (
                                      <td key={cellIndex} className="px-2 py-1 text-gray-400">
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
          <div className="w-1/2 bg-white flex flex-col overflow-y-auto">
            {/* Challenge Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <LevelBadge level={challenge.level} />
                  {isCompleted && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Star className="h-4 w-4" />
                  <span className="font-medium">{challenge.score} pts</span>
                </div>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                SQL Challenge #{challenge.id}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{challenge.solves} solves</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(challenge.created_at)}</span>
                </div>
                {challenge.institution && (
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {challenge.institution.name}
                  </span>
                )}
              </div>
            </div>

            {/* Challenge Content */}
            <div className="flex-1 p-4 space-y-6">
              {/* Challenge Statement */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Challenge Statement</h3>
                <p className="text-gray-700 leading-relaxed">{challenge.statement}</p>
              </div>
              
              {/* Hint Section */}
              {challenge.help && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHint(!showHint)}
                    className="mb-2 p-0 h-auto text-blue-700 hover:text-blue-800"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    {showHint ? "Hide Hint" : "Show Hint"}
                  </Button>
                  {showHint && (
                    <div className="text-sm text-blue-800">
                      {challenge.help}
                    </div>
                  )}
                </div>
              )}

              {/* Challenge Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Challenge Stats
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Score</span>
                    <span className="font-medium">{challenge.score_base}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minimum Score</span>
                    <span className="font-medium">{challenge.score_min}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Attempts</span>
                    <span className="font-medium">{attempts}</span>
                  </div>
                  {isCompleted && (
                    <div className="flex justify-between col-span-2 pt-2 border-t">
                      <span className="text-green-600 font-medium">Your Score</span>
                      <span className="font-bold text-green-600">{score}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Solution Section */}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSolution(!showSolution)}
                  className="w-full mb-3"
                  disabled={!isCompleted}
                >
                  {showSolution ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showSolution ? "Hide Solution" : "View Solution"}
                </Button>
                {!isCompleted && (
                  <p className="text-xs text-gray-500 text-center">
                    Complete the challenge to view the solution
                  </p>
                )}
                {showSolution && isCompleted && (
                  <div className="bg-gray-50 border rounded p-3">
                    <code className="text-sm text-gray-800 whitespace-pre-wrap">
                      {challenge.solution}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

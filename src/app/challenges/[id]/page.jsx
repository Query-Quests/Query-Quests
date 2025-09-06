"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header";
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-6">
          {/* Back Button */}
          <div className="mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/challenges">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Challenges
              </Link>
            </Button>
          </div>

          {/* Challenge Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
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
                  <CardTitle className="text-xl font-bold text-gray-900">
                    SQL Challenge #{challenge.id}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Challenge Statement</h3>
                      <p className="text-gray-700 leading-relaxed">{challenge.statement}</p>
                    </div>
                    
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
                          <div className="text-sm text-blue-800 mt-2">
                            {challenge.help}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{challenge.solves} solves</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(challenge.created_at)}</span>
                        </div>
                      </div>
                      {challenge.institution && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {challenge.institution.name}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Challenge Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Base Score</span>
                    <span className="font-medium">{challenge.score_base}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Minimum Score</span>
                    <span className="font-medium">{challenge.score_min}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Your Attempts</span>
                    <span className="font-medium">{attempts}</span>
                  </div>
                  {isCompleted && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-green-600 font-medium">Your Score</span>
                      <span className="font-bold text-green-600">{score}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Solution Button */}
              <Card>
                <CardContent className="pt-6">
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
                    <div className="bg-gray-50 border rounded p-3 mt-3">
                      <code className="text-sm text-gray-800 whitespace-pre-wrap">
                        {challenge.solution}
                      </code>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* SQL Editor */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                SQL Query Editor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="Write your SQL query here..."
                  className="font-mono text-sm min-h-[200px] bg-gray-50"
                  disabled={queryLoading}
                />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={executeQuery} 
                    disabled={queryLoading || !sqlQuery.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {queryLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {queryLoading ? "Executing..." : "Execute Query"}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={resetQuery}
                    disabled={queryLoading}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Query Results */}
          {(queryResult || queryError) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Query Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {queryError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-800 mb-2">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">Query Error</span>
                    </div>
                    <p className="text-red-700 text-sm">{queryError}</p>
                  </div>
                )}
                
                {queryResult && (
                  <div className={`border rounded-lg p-4 ${
                    queryResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      {queryResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-yellow-600" />
                      )}
                      <span className={`font-medium ${
                        queryResult.success ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                        {queryResult.success ? 'Success!' : 'Try Again'}
                      </span>
                    </div>
                    
                    <p className={`text-sm mb-4 ${
                      queryResult.success ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {queryResult.message}
                    </p>
                    
                    {queryResult.data && queryResult.data.length > 0 && (
                      <div className="bg-white border rounded overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                {Object.keys(queryResult.data[0]).map((key) => (
                                  <th key={key} className="px-4 py-2 text-left font-medium text-gray-700">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {queryResult.data.map((row, index) => (
                                <tr key={index} className="border-t">
                                  {Object.values(row).map((value, cellIndex) => (
                                    <td key={cellIndex} className="px-4 py-2 text-gray-600">
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

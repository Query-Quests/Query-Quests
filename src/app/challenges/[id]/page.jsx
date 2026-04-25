"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/header";
import ChallengeSuccessModal from "@/components/ChallengeSuccessModal";
import { LoadingState, NotFoundState } from "./_components/StatusViews";
import { Breadcrumb } from "./_components/Breadcrumb";
import { FullscreenTerminal } from "./_components/FullscreenTerminal";
import { ConsolePanel } from "./_components/ConsolePanel";
import { DetailsPanel } from "./_components/DetailsPanel";

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

  const fetchChallenge = useCallback(async () => {
    try {
      setLoading(true);

      const userData = localStorage.getItem("user");
      if (!userData) throw new Error("User not authenticated");

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      const response = await fetch(`/api/challenges/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Challenge not found");
        throw new Error("Failed to fetch challenge");
      }

      const challengeData = await response.json();
      setChallenge(challengeData);

      // Pick the database the student's terminal points at:
      //   1. The first public ChallengeDataset (Phase B model), if any.
      //   2. The legacy single database on the challenge.
      //   3. Fall back to the seeded `practice` schema.
      // Hidden datasets are never exposed here — the API filters them
      // out before this point.
      const publicDataset = challengeData.datasets?.[0];
      if (publicDataset?.database?.mysqlDbName) {
        setDatabaseName(publicDataset.database.mysqlDbName);
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const isCorrect = Math.random() > 0.5;
      setAttempts((prev) => prev + 1);

      if (isCorrect) {
        setIsCompleted(true);
        setScore(Math.max(challenge.score_min, challenge.score_base - attempts * 10));
        setQueryResult({
          success: true,
          message: "Congratulations! Your query is correct!",
          data: [
            { id: 1, name: "Sample Result", value: "Success" },
            { id: 2, name: "Another Row", value: "Data" },
          ],
        });
      } else {
        setQueryResult({
          success: false,
          message: "Query executed but results don't match expected output.",
          data: [{ id: 1, name: "Your Result", value: "Incorrect" }],
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

  const validateQuery = async () => {
    const query = lastQuery || sqlQuery;

    if (!query?.trim()) {
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
      const validateResponse = await fetch(`/api/challenges/${params.id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, user_id: user.id }),
      });

      const validateData = await validateResponse.json();

      if (!validateResponse.ok) {
        setQueryError(validateData.error || "Validation failed");
        return;
      }

      setAttempts((prev) => prev + 1);

      if (!validateData.isCorrect) {
        setQueryResult({
          success: false,
          message:
            validateData.feedback ||
            "Query executed but results don't match expected output.",
          missingKeywords: validateData.missingKeywords,
        });
        return;
      }

      const solveResponse = await fetch(`/api/challenges/${params.id}/solve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, validated: true }),
      });

      const solveData = await solveResponse.json();

      if (solveResponse.ok && solveData.success) {
        setIsCompleted(true);
        setScore(solveData.pointsAwarded || 0);

        const updatedUser = { ...user, totalScore: solveData.totalScore };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

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
        setQueryResult({
          success: true,
          message: solveData.error || "Query is correct but failed to record solve.",
        });
      }
    } catch (err) {
      console.error("Validation error:", err);
      setQueryError("Failed to validate query: " + err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleTerminalResult = (result) => {
    setQueryResult(result);
    if (result.query) setLastQuery(result.query);
    if (result.success && result.type === "challenge_completed") {
      setIsCompleted(true);
      setScore(result.score);
    }
  };

  const handleTerminalError = (err) => setQueryError(err.error);

  if (loading) return <LoadingState />;
  if (error || !challenge) return <NotFoundState error={error} />;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      <Breadcrumb challenge={challenge} />

      {isTerminalFullscreen && (
        <FullscreenTerminal
          challenge={challenge}
          challengeId={params.id}
          databaseName={databaseName}
          onClose={() => setIsTerminalFullscreen(false)}
          onResult={handleTerminalResult}
          onError={handleTerminalError}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        <ConsolePanel
          challenge={challenge}
          challengeId={params.id}
          databaseName={databaseName}
          isExpanded={isTerminalExpanded}
          onToggleExpanded={setIsTerminalExpanded}
          onOpenFullscreen={() => setIsTerminalFullscreen(true)}
          isCompleted={isCompleted}
          showHint={showHint}
          onToggleHint={() => setShowHint((v) => !v)}
          sqlQuery={sqlQuery}
          queryLoading={queryLoading}
          validating={validating}
          queryResult={queryResult}
          queryError={queryError}
          onExecute={executeQuery}
          onValidate={validateQuery}
          onReset={resetQuery}
          onTerminalResult={handleTerminalResult}
          onTerminalError={handleTerminalError}
        />

        <DetailsPanel
          challenge={challenge}
          isExpanded={isTerminalExpanded}
          isCompleted={isCompleted}
          attempts={attempts}
          score={score}
          showHint={showHint}
          onToggleHint={() => setShowHint((v) => !v)}
          showSolution={showSolution}
          onToggleSolution={() => setShowSolution((v) => !v)}
        />
      </div>

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

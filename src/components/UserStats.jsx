"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function UserStats({ userId }) {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}/stats`);
        if (!response.ok) {
          throw new Error('Failed to fetch user stats');
        }
        
        const data = await response.json();
        setUserStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserStats();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="text-center">Loading user stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="text-center text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="text-center">No user data found</div>
      </div>
    );
  }

  const { user, solvedChallenges, stats } = userStats;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* User Overview */}
      <Card>
        <CardHeader>
          <CardTitle>User Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalScore}</div>
              <div className="text-sm text-gray-600">Total Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalChallenges}</div>
              <div className="text-sm text-gray-600">Challenges Solved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.averageScore}</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-lg font-semibold">{user.name}</div>
            <div className="text-sm text-gray-600">{user.email}</div>
            {user.institution && (
              <div className="text-sm text-gray-600">{user.institution.name}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Solved Challenges */}
      <Card>
        <CardHeader>
          <CardTitle>Solved Challenges</CardTitle>
        </CardHeader>
        <CardContent>
          {solvedChallenges.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No challenges solved yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Challenge</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Score Earned</TableHead>
                    <TableHead>Current Score</TableHead>
                    <TableHead>Total Solves</TableHead>
                    <TableHead>Solved Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solvedChallenges.map((solvedChallenge) => (
                    <TableRow key={solvedChallenge.id}>
                      <TableCell className="max-w-xs">
                        <div className="truncate">
                          {solvedChallenge.challenge.statement}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          Level {solvedChallenge.challenge.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-green-600">
                        +{solvedChallenge.score}
                      </TableCell>
                      <TableCell className="font-mono text-gray-600">
                        {solvedChallenge.challenge.current_score}
                      </TableCell>
                      <TableCell className="text-center">
                        {solvedChallenge.challenge.solves}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(solvedChallenge.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

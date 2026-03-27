"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award, GraduationCap } from "lucide-react";

export function LeaderboardTable({ institutionId = null }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("limit", "10");
      if (institutionId) params.append("institution", institutionId);

      const response = await fetch(`/api/leaderboard?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [institutionId]);

  const getRankDisplay = (rank) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-sm">
          <Trophy className="h-4 w-4 text-white" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-sm">
          <Medal className="h-4 w-4 text-white" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-700 rounded-full flex items-center justify-center shadow-sm">
          <Award className="h-4 w-4 text-white" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-600">{rank}</span>
      </div>
    );
  };

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (index) => {
    const colors = [
      "bg-[#19aa59]",
      "bg-blue-500",
      "bg-violet-500",
      "bg-rose-500",
      "bg-amber-500",
      "bg-cyan-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-emerald-500",
      "bg-orange-500",
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#19aa59] border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>Error loading leaderboard: {error}</p>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No data available yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-gray-100">
            <TableHead className="w-16 text-gray-500 font-medium">Rank</TableHead>
            <TableHead className="text-gray-500 font-medium">Student</TableHead>
            <TableHead className="text-gray-500 font-medium hidden md:table-cell">Institution</TableHead>
            <TableHead className="text-right text-gray-500 font-medium">Score</TableHead>
            <TableHead className="text-right text-gray-500 font-medium hidden sm:table-cell">Solved</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboard.map((user, index) => {
            const rank = index + 1;
            const isTopThree = rank <= 3;

            return (
              <TableRow
                key={user.id}
                className={`hover:bg-gray-50 transition-colors ${
                  isTopThree ? "bg-gradient-to-r from-amber-50/50 to-transparent" : ""
                }`}
              >
                <TableCell className="py-4">
                  {getRankDisplay(rank)}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className={`h-10 w-10 ${getAvatarColor(index)}`}>
                      <AvatarFallback className="text-white font-semibold text-sm">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-[#030914]">{user.name}</div>
                      <div className="text-sm text-gray-500 md:hidden">
                        {user.institution?.name || "No Institution"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4 hidden md:table-cell">
                  <div className="flex items-center gap-2 text-gray-600">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                    <span className="truncate max-w-[200px]">
                      {user.institution?.name || "No Institution"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-right">
                  <span className={`font-bold text-lg ${isTopThree ? "text-[#19aa59]" : "text-[#030914]"}`}>
                    {user.totalScore || 0}
                  </span>
                  <span className="text-gray-400 text-sm ml-1">pts</span>
                </TableCell>
                <TableCell className="py-4 text-right hidden sm:table-cell">
                  <span className="font-medium text-gray-600">
                    {user.solvedChallenges || 0}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

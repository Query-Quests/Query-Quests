"use client";

import React from "react";
import Link from "next/link";
import {
  Star,
  Trophy,
  Users,
  Clock,
  Target,
  Zap,
  BookOpen,
  TrendingUp,
  Award,
  Play,
  ArrowRight,
  GraduationCap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${config.bgColor}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.color}`}></div>
      <span className={`text-xs font-semibold ${config.textColor}`}>{config.label}</span>
    </div>
  );
}

export function ChallengeCard({ challenge, onSolve, isSolved = false, userId = null }) {

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Error handling for missing challenge
  if (!challenge) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#030914] mb-1">No Challenge Available</h3>
            <p className="text-sm text-gray-500">Check back later for new SQL challenges!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={`/challenges/${challenge.id}`}>
      <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1 h-full">
        <CardContent className="p-0 h-full flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between mb-3">
              <LevelBadge level={challenge.level} />
              <div className="flex items-center gap-1.5 text-[#19aa59]">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-bold">{challenge.current_score || 0}</span>
                <span className="text-gray-400 text-sm">pts</span>
              </div>
            </div>

            <h3 className="font-semibold text-[#030914] text-lg group-hover:text-[#19aa59] transition-colors line-clamp-1">
              {challenge.name || truncateText(challenge.statement, 50)}
            </h3>

            {challenge.name && challenge.statement && (
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                {truncateText(challenge.statement, 100)}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="p-5 flex-1 flex flex-col">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500">Solves</p>
                <p className="text-sm font-bold text-[#030914]">{challenge.solves || 0}</p>
              </div>

              <div className="text-center">
                <div className="w-9 h-9 bg-[#19aa59]/10 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                  <Target className="h-4 w-4 text-[#19aa59]" />
                </div>
                <p className="text-xs text-gray-500">Initial</p>
                <p className="text-sm font-bold text-[#030914]">{challenge.initial_score || 0}</p>
              </div>

              <div className="text-center">
                <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                </div>
                <p className="text-xs text-gray-500">Current</p>
                <p className="text-sm font-bold text-[#030914]">{challenge.current_score || 0}</p>
              </div>
            </div>

            {/* Institution info */}
            {challenge.institution && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                <span className="truncate">{challenge.institution.name}</span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDate(challenge.created_at)}</span>
              </div>

              <Button
                className="bg-[#19aa59] hover:bg-[#15934d] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all group-hover:shadow-md"
                size="sm"
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Start
                <ArrowRight className="h-3.5 w-3.5 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

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
  Play
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LevelBadge from "@/components/LevelBadge";

export function ChallengeCard({ challenges = [] }) {

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const truncateText = (text, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (challenges.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Challenges Available</h3>
        <p className="text-gray-500">Check back later for new SQL challenges!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {challenges.map((challenge) => (
        <div
          key={challenge.id}
          className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
        >
          {/* Compact Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <LevelBadge level={challenge.level} />
              <div className="flex items-center gap-1 text-gray-600">
                <Star className="h-4 w-4" />
                <span className="text-sm font-medium">{challenge.score}</span>
              </div>
            </div>

            {/* Challenge Statement */}            
            <p className="text-sm text-gray-600 line-clamp-2">
              {truncateText(challenge.statement, 100)}
            </p>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Compact Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Users className="h-3 w-3 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500">Solves</p>
                <p className="text-sm font-semibold text-gray-900">{challenge.solves}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Target className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-xs text-gray-500">Base</p>
                <p className="text-sm font-semibold text-gray-900">{challenge.score_base}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="h-3 w-3 text-purple-600" />
                </div>
                <p className="text-xs text-gray-500">Min</p>
                <p className="text-sm font-semibold text-gray-900">{challenge.score_min}</p>
              </div>
            </div>

            {/* Institution info if available */}
            {challenge.institution && (
              <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>{challenge.institution.name}</span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                <span>{formatDate(challenge.created_at)}</span>
              </div>
              
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                size="sm"
                asChild
              >
                <Link href={`/challenges/${challenge.id}`}>
                  <Play className="h-3 w-3 mr-1" />
                  Start
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


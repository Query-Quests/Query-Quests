"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Database,
  TrendingUp,
  Users,
  Target,
  Trophy,
  Search,
  Filter,
  Zap,
  Award,
  AlertCircle
} from "lucide-react";

// Stats Card Component
function StatsCard({ icon: Icon, label, value, color }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-[#030914]">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Level Header Component
function LevelHeader({ level, count }) {
  const levelConfig = {
    1: { label: "Beginner", color: "bg-emerald-500", textColor: "text-emerald-700", bgColor: "bg-emerald-50" },
    2: { label: "Easy", color: "bg-[#19aa59]", textColor: "text-[#19aa59]", bgColor: "bg-[#19aa59]/10" },
    3: { label: "Medium", color: "bg-amber-500", textColor: "text-amber-700", bgColor: "bg-amber-50" },
    4: { label: "Hard", color: "bg-orange-500", textColor: "text-orange-700", bgColor: "bg-orange-50" },
    5: { label: "Expert", color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50" },
  };

  const config = levelConfig[level] || levelConfig[1];

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${config.bgColor}`}>
        <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
        <span className={`font-semibold ${config.textColor}`}>
          Level {level} - {config.label}
        </span>
      </div>
      <div className="h-px bg-gray-200 flex-1"></div>
      <span className="text-sm text-gray-500 font-medium">
        {count} challenge{count !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    averageScore: 0,
    totalSolves: 0
  });

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);

        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('User not authenticated');
        }

        const parsedUser = JSON.parse(userData);

        const userResponse = await fetch(`/api/users/${parsedUser.id}`);
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }

        const user = await userResponse.json();
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));

        let url = '/api/challenges';

        if (user.isTeacher && !user.isAdmin && user.institution_id) {
          url = `/api/challenges?institution=${user.institution_id}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch challenges');
        }
        const data = await response.json();
        const challengesArray = Array.isArray(data) ? data : (data.challenges || []);
        setChallenges(challengesArray);

        const total = challengesArray.length;
        const totalSolves = challengesArray.reduce((sum, challenge) => sum + (challenge.solves || 0), 0);
        const averageScore = total > 0 ? Math.round(challengesArray.reduce((sum, challenge) => sum + (challenge.current_score || 0), 0) / total) : 0;

        setStats({
          total,
          completed: 0,
          averageScore,
          totalSolves
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  // Filter challenges based on search and level
  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = searchTerm === "" ||
      challenge.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challenge.statement?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === null || challenge.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#19aa59] border-t-transparent mx-auto mb-4"></div>
              <p className="text-lg text-gray-500">Loading challenges...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="border-0 shadow-sm max-w-md mx-auto">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-[#030914] mb-2">Error Loading Challenges</h3>
                <p className="text-gray-500">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#19aa59] to-emerald-600 rounded-xl flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-[#030914]">
                    SQL Challenges
                  </h1>
                </div>
              </div>
              <p className="text-lg text-gray-500 max-w-2xl">
                Master SQL through interactive challenges. Solve problems, earn points, and climb the leaderboard.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#19aa59]">{stats.total}</div>
                <div className="text-sm text-gray-500">Challenges</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#030914]">{stats.totalSolves}</div>
                <div className="text-sm text-gray-500">Total Solves</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={Database}
            label="Total Challenges"
            value={stats.total}
            color="bg-gradient-to-br from-[#19aa59] to-emerald-600"
          />
          <StatsCard
            icon={Users}
            label="Total Solves"
            value={stats.totalSolves}
            color="bg-gradient-to-br from-blue-500 to-indigo-600"
          />
          <StatsCard
            icon={TrendingUp}
            label="Avg. Score"
            value={stats.averageScore}
            color="bg-gradient-to-br from-violet-500 to-purple-600"
          />
          <StatsCard
            icon={Target}
            label="Your Progress"
            value={`${stats.completed}/${stats.total}`}
            color="bg-gradient-to-br from-amber-500 to-orange-600"
          />
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search challenges by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base border-gray-200 focus:border-[#19aa59] focus:ring-[#19aa59]/20 rounded-xl"
            />
          </div>

          {/* Level Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Button
              variant={selectedLevel === null ? "default" : "outline"}
              onClick={() => setSelectedLevel(null)}
              className={selectedLevel === null
                ? "bg-[#19aa59] hover:bg-[#15934d] text-white"
                : "border-gray-200 hover:bg-gray-50"
              }
            >
              All
            </Button>
            {[1, 2, 3, 4, 5].map(level => (
              <Button
                key={level}
                variant={selectedLevel === level ? "default" : "outline"}
                onClick={() => setSelectedLevel(level)}
                className={selectedLevel === level
                  ? "bg-[#19aa59] hover:bg-[#15934d] text-white"
                  : "border-gray-200 hover:bg-gray-50"
                }
              >
                L{level}
              </Button>
            ))}
          </div>
        </div>

        {/* No Institution Warning */}
        {user && !user.institution_id ? (
          <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
            <CardContent className="py-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#030914] mb-1">No Institution Assigned</h3>
                  <p className="text-gray-500">
                    You don&apos;t have an institution assigned. Please contact your administrator to get access to challenges.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {/* Group challenges by level */}
            {[1, 2, 3, 4, 5].map(level => {
              const levelChallenges = filteredChallenges.filter(challenge => challenge.level === level);
              if (levelChallenges.length === 0) return null;

              return (
                <div key={level}>
                  <LevelHeader level={level} count={levelChallenges.length} />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {levelChallenges.map((challenge) => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        userId={user?.id}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* No challenges found */}
            {filteredChallenges.length === 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Database className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#030914] mb-2">
                      {searchTerm || selectedLevel ? 'No challenges found' : 'No Challenges Available'}
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      {searchTerm || selectedLevel
                        ? 'Try adjusting your search or filter criteria.'
                        : 'There are no challenges available for your institution at the moment.'}
                    </p>
                    {(searchTerm || selectedLevel) && (
                      <Button
                        variant="outline"
                        className="mt-4 border-[#19aa59]/30 text-[#19aa59] hover:bg-[#19aa59]/10"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedLevel(null);
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Motivational Footer */}
        {filteredChallenges.length > 0 && (
          <div className="mt-12 text-center py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#19aa59]/10 text-[#19aa59] text-sm font-medium mb-4">
              <Zap className="h-4 w-4" />
              Challenge yourself!
            </div>
            <p className="text-gray-500 max-w-md mx-auto">
              Each challenge you solve improves your skills and moves you up the leaderboard. Keep going!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

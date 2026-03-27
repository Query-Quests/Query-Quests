"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import { LeaderboardTable } from "@/components/leaderboardTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  Target,
  Flame,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
} from "lucide-react";
import Link from "next/link";

// Stats Card Component
function StatsCard({ icon: Icon, label, value, trend, color }) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-[#030914]">{value}</p>
            {trend && (
              <p className="text-sm text-[#19aa59] font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Action Card
function QuickActionCard({ icon: Icon, title, description, href, color }) {
  return (
    <Link href={href}>
      <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1">
        <CardContent className="p-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-semibold text-[#030914] mb-1 group-hover:text-[#19aa59] transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-500">{description}</p>
          <div className="mt-4 flex items-center text-[#19aa59] text-sm font-medium">
            Get started
            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchUserStats(parsedUser.id);
      } catch (error) {
        console.error("Error parsing user data:", error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserStats = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#030914] mb-2">
                {getGreeting()}, {user?.name?.split(" ")[0] || "there"}!
              </h1>
              <p className="text-lg text-gray-500">
                Ready to continue your SQL journey? Pick up where you left off.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/challenges">
                <Button className="bg-[#19aa59] hover:bg-[#15934d] text-white px-6 py-3 h-auto font-semibold">
                  <Zap className="h-5 w-5 mr-2" />
                  Start Challenge
                </Button>
              </Link>
              <Link href="/lessons">
                <Button variant="outline" className="border-gray-300 px-6 py-3 h-auto font-semibold hover:bg-gray-50">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Browse Lessons
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={Trophy}
            label="Total Score"
            value={stats?.totalScore || user?.totalScore || 0}
            trend="+12% this week"
            color="bg-gradient-to-br from-amber-500 to-orange-600"
          />
          <StatsCard
            icon={Target}
            label="Challenges Completed"
            value={stats?.solvedChallenges || user?.solvedChallenges || 0}
            color="bg-gradient-to-br from-[#19aa59] to-emerald-600"
          />
          <StatsCard
            icon={Flame}
            label="Current Streak"
            value={`${stats?.streak || 0} days`}
            color="bg-gradient-to-br from-rose-500 to-pink-600"
          />
          <StatsCard
            icon={Award}
            label="Rank"
            value={`#${stats?.rank || "—"}`}
            color="bg-gradient-to-br from-violet-500 to-purple-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#030914] mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <QuickActionCard
              icon={Target}
              title="Continue Learning"
              description="Pick up where you left off with your current challenge"
              href="/challenges"
              color="bg-gradient-to-br from-[#19aa59] to-emerald-600"
            />
            <QuickActionCard
              icon={BookOpen}
              title="Explore Lessons"
              description="Learn new SQL concepts with structured tutorials"
              href="/lessons"
              color="bg-gradient-to-br from-blue-500 to-indigo-600"
            />
            <QuickActionCard
              icon={Trophy}
              title="View Leaderboard"
              description="See how you rank against other students"
              href="#leaderboard"
              color="bg-gradient-to-br from-amber-500 to-orange-600"
            />
          </div>
        </div>

        {/* Leaderboard Section */}
        <section id="leaderboard" className="scroll-mt-20">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-[#030914]">
                      Leaderboard
                    </CardTitle>
                    <p className="text-sm text-gray-500">Top performers this month</p>
                  </div>
                </div>
                <Link href="/challenges">
                  <Button variant="outline" size="sm" className="text-[#19aa59] border-[#19aa59]/30 hover:bg-[#19aa59]/10">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <LeaderboardTable />
            </CardContent>
          </Card>
        </section>

        {/* Motivational Footer */}
        <div className="mt-12 text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#19aa59]/10 text-[#19aa59] text-sm font-medium mb-4">
            <Flame className="h-4 w-4" />
            Keep the momentum going!
          </div>
          <p className="text-gray-500 max-w-md mx-auto">
            Consistency is key to mastering SQL. Complete at least one challenge daily to maintain your streak.
          </p>
        </div>
      </div>
    </div>
  );
}

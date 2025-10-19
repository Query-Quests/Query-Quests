"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LevelBadge from "@/components/LevelBadge";
import { 
  Users, 
  Database, 
  Trophy, 
  TrendingUp, 
  Activity,
  Plus,
  Eye,
  MessageSquare
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [challengeStats, setChallengeStats] = useState({ totalChallenges: 0 });
  const [institutions, setInstitutions] = useState([]);
  const [contactRequests, setContactRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const [usersRes, challengesRes, challengesStatsRes, institutionsRes, contactRequestsRes] = await Promise.all([
          fetch(`${baseUrl}/api/users?limit=1000`),
          fetch(`${baseUrl}/api/challenges?limit=5`),
          fetch(`${baseUrl}/api/challenges/stats`),
          fetch(`${baseUrl}/api/institutions`),
          fetch(`${baseUrl}/api/contact-requests`)
        ]);

        const usersData = await usersRes.json();
        const challengesData = await challengesRes.json();
        const challengesStatsData = await challengesStatsRes.json();
        const institutionsData = await institutionsRes.json();
        const contactRequestsData = await contactRequestsRes.json();

        // Handle new API response formats
        setUsers(usersData.users || usersData);
        setChallenges(challengesData.challenges || challengesData);
        setChallengeStats(challengesStatsData || { totalChallenges: (challengesData.challenges || challengesData)?.length || 0 });
        setInstitutions(institutionsData);
        setContactRequests(contactRequestsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalUsers = users.length;
  const totalChallenges = challengeStats.totalChallenges || challenges.length;
  const totalInstitutions = institutions.length;
  const totalContactRequests = contactRequests.length;
  const pendingContactRequests = contactRequests.filter(req => req.status === 'pending').length;
  
  // Calculate active users (logged in within last 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activeUsers = users.filter(user => 
    user.last_login && new Date(user.last_login) > twentyFourHoursAgo
  ).length;
  
  const totalPoints = users.reduce((sum, user) => sum + user.points, 0);
  const avgPoints = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;

  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      description: "Registered users",
      icon: <Users className="h-4 w-4" />,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Users",
      value: activeUsers,
      description: "Logged in last 24h",
      icon: <Activity className="h-4 w-4" />,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Challenges",
      value: totalChallenges,
      description: "Available challenges",
      icon: <Database className="h-4 w-4" />,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Institutions",
      value: totalInstitutions,
      description: "Registered institutions",
      icon: <Trophy className="h-4 w-4" />,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Contact Requests",
      value: totalContactRequests,
      description: `${pendingContactRequests} pending`,
      icon: <MessageSquare className="h-4 w-4" />,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  const recentUsers = users.slice(0, 5);
  const recentChallenges = challenges.slice(0, 5);

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-xs lg:text-sm">
            Overview of your platform&apos;s performance and user activity
          </p>
        </div>
        {pendingContactRequests > 0 && (
          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
            <Button asChild size="sm" variant="destructive" className="w-full sm:w-auto text-xs">
              <Link href="/admin/contact-requests">
                <MessageSquare className="h-3 w-3 mr-1" />
                Review Requests ({pendingContactRequests})
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
              <CardTitle className="text-xs font-medium">{stat.title}</CardTitle>
              <div className={`p-1.5 rounded-md ${stat.bgColor}`}>
                <div className={stat.color}>{stat.icon}</div>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-lg font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quick Actions</CardTitle>
          <CardDescription className="text-xs">Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild variant="outline" className="flex-1 justify-start text-xs h-8">
              <Link href="/admin/users">
                <Plus className="h-3 w-3 mr-2" />
                Add New User
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 justify-start text-xs h-8">
              <Link href="/admin/challenges/create">
                <Plus className="h-3 w-3 mr-2" />
                Create Challenge
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 justify-start text-xs h-8">
              <Link href="/admin/institutions">
                <Plus className="h-3 w-3 mr-2" />
                Add Institution
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="space-y-3">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Users</CardTitle>
            <CardDescription className="text-xs">Latest registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 border rounded-md space-y-1 sm:space-y-0">
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.institution?.name || 'No institution'}
                    </p>
                  </div>
                  <Badge variant={user.isAdmin ? "destructive" : user.isTeacher ? "default" : "secondary"} className="w-fit text-xs">
                    {user.isAdmin ? "Admin" : user.isTeacher ? "Teacher" : "Student"}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Button asChild variant="outline" className="w-full text-xs h-8">
                <Link href="/admin/users">
                  <Eye className="h-3 w-3 mr-2" />
                  View All Users
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Challenges</CardTitle>
            <CardDescription className="text-xs">Latest created challenges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentChallenges.map((challenge) => (
                <div key={challenge.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 border rounded-md space-y-1 sm:space-y-0">
                  <div>
                    <p className="font-medium text-sm mb-4">{challenge.statement}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <LevelBadge level={challenge.level} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {challenge.solves} solves • {challenge.institution?.name || 'No institution'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Button asChild variant="outline" className="w-full text-xs h-8">
                <Link href="/admin/challenges">
                  <Eye className="h-3 w-3 mr-2" />
                  View All Challenges
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
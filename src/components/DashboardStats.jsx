"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/admin/StatCard";
import { RecentActivityList } from "@/components/admin/RecentActivityList";
import { DashboardGrid, DashboardSection, DashboardContainer, QuickActions } from "@/components/admin/DashboardGrid";
import {
  Users,
  Database,
  Trophy,
  TrendingUp,
  Activity,
  Plus,
  MessageSquare,
  Building,
} from "lucide-react";
import Link from "next/link";

export default function DashboardStats({ userRole, user }) {
  const [users, setUsers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [challengeStats, setChallengeStats] = useState({ totalChallenges: 0 });
  const [institutions, setInstitutions] = useState([]);
  const [contactRequests, setContactRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = userRole === "admin";
  const isTeacher = userRole === "teacher";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        // Build API calls based on user role
        const apiCalls = [];

        // Users API - filter by institution for teachers
        if (isAdmin) {
          apiCalls.push(fetch(`${baseUrl}/api/users?limit=1000`));
        } else if (isTeacher && user?.institution_id) {
          apiCalls.push(fetch(`${baseUrl}/api/users?limit=1000&institution=${user.institution_id}`));
        } else {
          apiCalls.push(Promise.resolve({ json: () => ({ users: [] }) }));
        }

        // Challenges API - filter by institution for teachers
        if (isAdmin) {
          apiCalls.push(fetch(`${baseUrl}/api/challenges?limit=5`));
          apiCalls.push(fetch(`${baseUrl}/api/challenges/stats`));
        } else if (isTeacher && user?.institution_id) {
          apiCalls.push(fetch(`${baseUrl}/api/challenges?limit=5&institution=${user.institution_id}`));
          apiCalls.push(fetch(`${baseUrl}/api/challenges/stats?institutionId=${user.institution_id}`));
        } else {
          apiCalls.push(Promise.resolve({ json: () => ({ challenges: [] }) }));
          apiCalls.push(Promise.resolve({ json: () => ({ totalChallenges: 0 }) }));
        }

        // Institutions API - only for admins
        if (isAdmin) {
          apiCalls.push(fetch(`${baseUrl}/api/institutions`));
        } else {
          apiCalls.push(Promise.resolve({ json: () => [] }));
        }

        // Contact Requests API - only for admins
        if (isAdmin) {
          apiCalls.push(fetch(`${baseUrl}/api/contact-requests`));
        } else {
          apiCalls.push(Promise.resolve({ json: () => [] }));
        }

        const [usersRes, challengesRes, challengesStatsRes, institutionsRes, contactRequestsRes] =
          await Promise.all(apiCalls);

        const usersData = await usersRes.json();
        const challengesData = await challengesRes.json();
        const challengesStatsData = await challengesStatsRes.json();
        const institutionsData = await institutionsRes.json();
        const contactRequestsData = await contactRequestsRes.json();

        // Handle new API response formats
        setUsers(usersData.users || usersData);
        setChallenges(challengesData.challenges || challengesData);
        setChallengeStats(
          challengesStatsData || {
            totalChallenges: (challengesData.challenges || challengesData)?.length || 0,
          }
        );
        setInstitutions(institutionsData);
        setContactRequests(contactRequestsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [userRole, user, isAdmin, isTeacher]);

  // Calculate statistics
  const totalUsers = users.length;
  const totalChallenges = challengeStats.totalChallenges || challenges.length;
  const totalInstitutions = institutions.length;
  const totalContactRequests = contactRequests.length;
  const pendingContactRequests = contactRequests.filter((req) => req.status === "pending").length;

  // Calculate active users (logged in within last 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activeUsers = users.filter(
    (u) => u.last_login && new Date(u.last_login) > twentyFourHoursAgo
  ).length;

  const totalPoints = users.reduce((sum, u) => sum + (u.points || 0), 0);
  const avgPoints = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;

  // Build stats array based on user role
  const getStats = () => {
    const baseStats = [
      {
        label: isTeacher ? "Institution Users" : "Total Users",
        value: totalUsers,
        description: isTeacher ? "Users in your institution" : "Registered users",
        icon: <Users className="h-5 w-5" />,
        iconColor: "text-blue-600",
        iconBgColor: "bg-blue-100",
      },
      {
        label: "Active Users",
        value: activeUsers,
        description: "Logged in last 24h",
        icon: <Activity className="h-5 w-5" />,
        iconColor: "text-green-600",
        iconBgColor: "bg-green-100",
      },
      {
        label: isTeacher ? "Institution Challenges" : "Total Challenges",
        value: totalChallenges,
        description: isTeacher ? "Challenges in your institution" : "Available challenges",
        icon: <Database className="h-5 w-5" />,
        iconColor: "text-purple-600",
        iconBgColor: "bg-purple-100",
      },
      {
        label: "Average Points",
        value: avgPoints,
        description: "Per user average",
        icon: <TrendingUp className="h-5 w-5" />,
        iconColor: "text-indigo-600",
        iconBgColor: "bg-indigo-100",
      },
    ];

    // Add admin-only stats
    if (isAdmin) {
      baseStats.push(
        {
          label: "Institutions",
          value: totalInstitutions,
          description: "Registered institutions",
          icon: <Building className="h-5 w-5" />,
          iconColor: "text-orange-600",
          iconBgColor: "bg-orange-100",
        },
        {
          label: "Contact Requests",
          value: totalContactRequests,
          description: `${pendingContactRequests} pending`,
          icon: <MessageSquare className="h-5 w-5" />,
          iconColor: "text-red-600",
          iconBgColor: "bg-red-100",
        }
      );
    }

    return baseStats;
  };

  const recentUsers = users.slice(0, 5);
  const recentChallenges = challenges.slice(0, 5);

  // Quick actions based on role
  const quickActions = [
    {
      href: "/admin/users",
      icon: <Plus className="h-4 w-4" />,
      label: isTeacher ? "Add Student" : "Add New User",
    },
    {
      href: "/admin/challenges/create",
      icon: <Plus className="h-4 w-4" />,
      label: "Create Challenge",
    },
    ...(isAdmin
      ? [
          {
            href: "/admin/institutions",
            icon: <Plus className="h-4 w-4" />,
            label: "Add Institution",
          },
        ]
      : []),
  ];

  const stats = getStats();

  return (
    <DashboardContainer>
      {/* Header */}
      <PageHeader
        title={isAdmin ? "Admin Dashboard" : "Teacher Dashboard"}
        description={
          isAdmin
            ? "Overview of your platform's performance and user activity"
            : `Overview of ${user?.institution?.name || "your institution"}'s performance and activity`
        }
      >
        {isAdmin && pendingContactRequests > 0 && (
          <Button asChild size="sm" variant="destructive">
            <Link href="/admin/contact-requests">
              <MessageSquare className="h-4 w-4 mr-2" />
              Review Requests ({pendingContactRequests})
            </Link>
          </Button>
        )}
      </PageHeader>

      {/* Stats Grid */}
      <DashboardSection>
        <DashboardGrid variant={isAdmin ? "cards" : "stats"}>
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              label={stat.label}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              iconColor={stat.iconColor}
              iconBgColor={stat.iconBgColor}
              trend={stat.trend}
              isLoading={isLoading}
            />
          ))}
        </DashboardGrid>
      </DashboardSection>

      {/* Quick Actions */}
      <DashboardSection>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            <CardDescription>
              {isAdmin ? "Common administrative tasks" : "Common teaching tasks"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuickActions>
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  asChild
                  variant="outline"
                  className="flex-1 justify-start"
                  size="sm"
                >
                  <Link href={action.href}>
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                  </Link>
                </Button>
              ))}
            </QuickActions>
          </CardContent>
        </Card>
      </DashboardSection>

      {/* Recent Activity */}
      <DashboardSection>
        <DashboardGrid variant="sections">
          <RecentActivityList
            title={isTeacher ? "Recent Students" : "Recent Users"}
            description={
              isTeacher
                ? "Latest registered students in your institution"
                : "Latest registered users"
            }
            items={recentUsers}
            type="user"
            viewAllHref="/admin/users"
            viewAllLabel={isTeacher ? "View All Students" : "View All Users"}
            isLoading={isLoading}
            emptyMessage="No users found"
          />

          <RecentActivityList
            title="Recent Challenges"
            description={
              isTeacher ? "Latest challenges in your institution" : "Latest created challenges"
            }
            items={recentChallenges}
            type="challenge"
            viewAllHref="/admin/challenges"
            viewAllLabel="View All Challenges"
            isLoading={isLoading}
            emptyMessage="No challenges found"
          />
        </DashboardGrid>
      </DashboardSection>
    </DashboardContainer>
  );
}

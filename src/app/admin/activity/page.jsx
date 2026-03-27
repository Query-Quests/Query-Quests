"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Users, Clock } from "lucide-react";
import { ActivityFilters, ActivityDataTable } from "@/components/admin/activity";

// Mock data generator for demo purposes
function generateMockActivity() {
  const types = [
    "login",
    "logout",
    "challenge_start",
    "challenge_complete",
    "user_created",
    "user_updated",
    "settings_changed",
    "password_changed",
  ];

  const users = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com" },
    { id: 4, name: "Alice Brown", email: "alice@example.com" },
    { id: 5, name: "Charlie Wilson", email: "charlie@example.com" },
  ];

  const descriptions = {
    login: "User logged in successfully",
    logout: "User logged out",
    challenge_start: "Started challenge: SQL Basics",
    challenge_complete: "Completed challenge with score 95%",
    user_created: "New user account created",
    user_updated: "Profile information updated",
    settings_changed: "System settings modified",
    password_changed: "Password changed successfully",
  };

  const activities = [];
  const now = new Date();

  for (let i = 0; i < 50; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const hoursAgo = Math.floor(Math.random() * 168); // Up to 7 days ago

    activities.push({
      id: i + 1,
      type,
      user,
      description: descriptions[type],
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      createdAt: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString(),
    });
  }

  return activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Mock users for filter dropdown
const mockUsers = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com" },
  { id: 4, name: "Alice Brown", email: "alice@example.com" },
  { id: 5, name: "Charlie Wilson", email: "charlie@example.com" },
];

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    userId: "all",
    dateRange: "last7days",
    startDate: null,
    endDate: null,
  });

  // Stats
  const [stats, setStats] = useState({
    totalToday: 0,
    activeUsers: 0,
    avgPerHour: 0,
  });

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real app, fetch from API with filters
      // const params = new URLSearchParams(filters);
      // const response = await fetch(`/api/admin/activity?${params}`);
      // const data = await response.json();

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockData = generateMockActivity();
      setActivities(mockData);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayActivities = mockData.filter(
        (a) => new Date(a.createdAt) >= today
      );
      const uniqueUsers = new Set(mockData.map((a) => a.user.id)).size;

      setStats({
        totalToday: todayActivities.length,
        activeUsers: uniqueUsers,
        avgPerHour: Math.round(mockData.length / 168), // 7 days * 24 hours
      });
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...activities];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.user.name.toLowerCase().includes(searchLower) ||
          a.user.email.toLowerCase().includes(searchLower) ||
          a.description?.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (filters.type && filters.type !== "all") {
      filtered = filtered.filter((a) => a.type === filters.type);
    }

    // User filter
    if (filters.userId && filters.userId !== "all") {
      filtered = filtered.filter(
        (a) => a.user.id.toString() === filters.userId
      );
    }

    // Date range filter
    const now = new Date();
    let startDate = null;

    switch (filters.dateRange) {
      case "today":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "yesterday":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "last7days":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "last30days":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "last90days":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "custom":
        if (filters.startDate) {
          startDate = new Date(filters.startDate);
        }
        break;
    }

    if (startDate) {
      filtered = filtered.filter((a) => new Date(a.createdAt) >= startDate);
    }

    if (filters.dateRange === "custom" && filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((a) => new Date(a.createdAt) <= endDate);
    }

    setFilteredActivities(filtered);
  }, [activities, filters]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Activity Log</h1>
        <p className="text-muted-foreground text-sm lg:text-base">
          Monitor user activity and system events
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalToday}</div>
            <p className="text-xs text-muted-foreground">Events recorded today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Users in the last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Per Hour</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPerHour}</div>
            <p className="text-xs text-muted-foreground">Events per hour (avg)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <ActivityFilters
        filters={filters}
        onFiltersChange={setFilters}
        users={mockUsers}
        onRefresh={loadActivities}
        isLoading={isLoading}
      />

      {/* Activity Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                {filteredActivities.length} events found
              </CardDescription>
            </div>
            {filters.type !== "all" && (
              <Badge variant="secondary" className="w-fit">
                Filtered by: {filters.type.replace("_", " ")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ActivityDataTable
            data={filteredActivities}
            isLoading={isLoading}
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}

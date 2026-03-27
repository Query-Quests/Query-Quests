"use client";

import DashboardStats from "@/components/DashboardStats";
import { useUserRole } from "@/hooks/useUserRole";

export default function AdminDashboard() {
  const { user, userRole, isLoading } = useUserRole();

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

  return <DashboardStats userRole={userRole} user={user} />;
} 
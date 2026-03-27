"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import {
  SidebarProvider,
  AdminSidebar,
  SidebarInset,
  MobileSidebarTrigger,
} from "@/components/admin/sidebar";

export default function AdminLayout({ children }) {
  const { user, isLoading, isAdminOrTeacher, panelType } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdminOrTeacher) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-96 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-red-500">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4 text-gray-600">
              You don&apos;t have permission to access this panel.
            </p>
            <Button asChild>
              <Link href="/home">Go to Main Page</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <AdminSidebar user={user} panelType={panelType} />

        {/* Main content area */}
        <SidebarInset>
          {/* Top header bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 shadow-sm lg:px-6">
            {/* Mobile menu trigger */}
            <MobileSidebarTrigger />

            {/* Welcome message */}
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                Welcome back,{" "}
                <span className="font-medium text-gray-900">{user.name}</span>
              </p>
            </div>

            {/* Panel indicator */}
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline font-medium text-gray-700">
                {panelType === "admin" ? "Admin Panel" : "Teacher Panel"}
              </span>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 lg:p-6">
            <div className="mx-auto w-full">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

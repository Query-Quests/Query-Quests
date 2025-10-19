"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Menu, BarChart3, Users, Database, Landmark, MessageSquare, Settings } from "lucide-react";
import AdminTeacherSidebar from "@/components/AdminTeacherSidebar";

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    title: "Users Management",
    href: "/admin/users",
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: "Challenges",
    href: "/admin/challenges",
    icon: <Database className="h-4 w-4" />,
  },
  {
    title: "Institutions",
    href: "/admin/institutions",
    icon: <Landmark className="h-4 w-4" />,
  },
  {
    title: "Contact Requests",
    href: "/admin/contact-requests",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

export default function AdminLayout({ children }) {
  // Get initial sidebar state - always open on desktop, persistent across navigation
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const isDesktop = window.innerWidth >= 1024;
      // On desktop, always start open and save this state
      if (isDesktop) {
        localStorage.setItem('admin-sidebar-open', 'true');
        return true;
      }
      // On mobile, use saved state or default to closed
      const saved = localStorage.getItem('admin-sidebar-open');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Get user data from localStorage first
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchUserData(parsedUser.id);
      } catch (error) {
        console.error("Error parsing user data:", error);
        window.location.href = "/home";
      }
    } else {
      // No user data in localStorage, redirect to auth
      window.location.href = "/auth";
    }
  }, []);

  // Ensure sidebar stays open on desktop during navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop && !isSidebarOpen) {
        setIsSidebarOpen(true);
        localStorage.setItem('admin-sidebar-open', 'true');
      }
    }
  }, [pathname, isSidebarOpen]);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-sidebar-open', JSON.stringify(isSidebarOpen));
    }
  }, [isSidebarOpen]);

  // Handle window resize to maintain appropriate sidebar state
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const isDesktop = window.innerWidth >= 1024;

        if (isDesktop) {
          // Always open on desktop and save state
          setIsSidebarOpen(true);
          localStorage.setItem('admin-sidebar-open', 'true');
        } else {
          // On mobile, use saved state or close
          const savedState = localStorage.getItem('admin-sidebar-open');
          setIsSidebarOpen(savedState ? JSON.parse(savedState) : false);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        // Check if user is admin, if not redirect to home page
        if (!userData.isAdmin) {
          console.log("Access denied: User is not admin");
          window.location.href = "/home";
        }
      } else {
        // If user not found or not admin, redirect to home page
        console.log("Access denied: User not found or API error");
        window.location.href = "/home";
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      window.location.href = "/home";
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return ( 
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-500">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">You don&apos;t have permission to access the admin panel.</p>
            <Button asChild>
              <Link href="/home">Go to Main Page</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminTeacherSidebar
        user={user}
        navItems={adminNavItems}
        panelType="admin"
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen} 
      />
      
      {/* Main content */}
      <div className="flex-1 min-h-screen bg-white overflow-auto lg:ml-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-between flex-1">
              <span className="text-sm text-muted-foreground flex-1">
                Welcome back, {user.name}
              </span>
              <div className="flex items-center space-x-2 ml-4">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-gray-700">Admin Panel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="lg:p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 
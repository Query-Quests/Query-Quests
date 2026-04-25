"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  X,
  Home,
  Shield,
  BarChart3,
  Users,
  Database,
  Landmark,
  MessageSquare,
  Settings,
  BookOpen,
} from "lucide-react";

// Navigation items configuration
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
    title: "Modules",
    href: "/admin/modules",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    title: "Challenges",
    href: "/admin/challenges",
    icon: <Database className="h-4 w-4" />,
  },
  {
    title: "SQL Databases",
    href: "/admin/databases",
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

const teacherNavItems = [
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
    title: "Modules",
    href: "/admin/modules",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    title: "Challenges",
    href: "/admin/challenges",
    icon: <Database className="h-4 w-4" />,
  },
  {
    title: "SQL Databases",
    href: "/admin/databases",
    icon: <Database className="h-4 w-4" />,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

const AdminTeacherSidebar = forwardRef(({ 
  user,
  panelType = "admin", // "admin" or "teacher"
}, ref) => {
  
  const pathname = usePathname();

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

  const panelConfig = {
    admin: {
      title: "Admin Panel",
      icon: Shield,
      userRole: "Administrator",
      userInitial: user?.name?.charAt(0) || 'A'
    },
    teacher: {
      title: "Teacher Panel", 
      icon: Shield,
      userRole: "Teacher",
      userInitial: user?.name?.charAt(0) || 'T'
    }
  };

  const config = panelConfig[panelType];
  const IconComponent = config.icon;
  
  // Get navigation items based on panel type
  const navItems = panelType === "admin" ? adminNavItems : teacherNavItems;

  // Expose toggle function to parent component
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    toggleSidebar,
    isSidebarOpen
  }), [isSidebarOpen]);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-sidebar-open', JSON.stringify(isSidebarOpen));
    }
  }, [isSidebarOpen]);

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

<div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-screen">
          {/* Mobile close button */}
          <div className="flex justify-end p-4 border-b lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{config.userRole}</p>
              </div>
            </div>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer - Always at bottom */}
          <div className="p-4 border-t mt-auto">
            <Button variant="ghost" asChild className="w-full justify-start">
              <Link href="/home" className="flex items-center space-x-3">
                <Home className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
});

AdminTeacherSidebar.displayName = 'AdminTeacherSidebar';

export default AdminTeacherSidebar;

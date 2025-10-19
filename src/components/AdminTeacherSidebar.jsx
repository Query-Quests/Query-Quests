"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Home, 
  Shield,
} from "lucide-react";

export default function AdminTeacherSidebar({ 
  user,
  navItems,
  panelType = "admin", // "admin" or "teacher"
  isSidebarOpen, 
  setIsSidebarOpen 
}) {
  const pathname = usePathname();



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

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

<div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg ${
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
                <p className="text-xs text-muted-foreground">Administrator</p>
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
}

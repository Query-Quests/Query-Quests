"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = useMemo(() => ["/", "/auth", "/terms", "/privacy", "/contact", "/verify-email"], []);

  useEffect(() => {
    const checkAuth = () => {
      // Check both localStorage and cookies for user data
      const user = localStorage.getItem("user");
      
      if (user) {
        try {
          const userData = JSON.parse(user);
          if (userData && userData.id) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
          setIsAuthenticated(false);
        }
      } else {
        // If no localStorage data, check if we're on a public route
        // If not on public route, redirect to login
        const isPublicRoute = publicRoutes.includes(pathname);
        if (!isPublicRoute) {
          router.push("/auth");
        }
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router, publicRoutes]);

  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = publicRoutes.includes(pathname);
      
      if (!isAuthenticated && !isPublicRoute) {
        router.push("/auth");
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, publicRoutes]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access to public routes or authenticated users
  const isPublicRoute = publicRoutes.includes(pathname);
  if (isPublicRoute || isAuthenticated) {
    return <>{children}</>;
  }

  // This should not be reached due to the redirect in useEffect
  return null;
} 
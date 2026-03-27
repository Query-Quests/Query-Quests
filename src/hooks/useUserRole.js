import { useState, useEffect } from 'react';

export function useUserRole() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Get user data from localStorage first
        const userData = localStorage.getItem("user");
        if (!userData) {
          setError("No user data found");
          window.location.href = "/auth";
          return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Fetch fresh user data from API
        await fetchUserData(parsedUser.id);
      } catch (error) {
        console.error("Error parsing user data:", error);
        setError("Invalid user data");
        window.location.href = "/home";
      }
    };

    initializeUser();
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setError(null);
      } else {
        setError("User not found or API error");
        console.log("Access denied: User not found or API error");
        window.location.href = "/home";
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to fetch user data");
      window.location.href = "/home";
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions to check user roles
  const isAdmin = user?.isAdmin || false;
  const isTeacher = user?.isTeacher || false;
  const isAdminOrTeacher = isAdmin || isTeacher;
  const userRole = isAdmin ? 'admin' : isTeacher ? 'teacher' : null;
  const panelType = isAdmin ? 'admin' : isTeacher ? 'teacher' : 'admin';

  // Check if user has admin/teacher access and redirect if not
  if (user && !isAdminOrTeacher) {
    console.log("Access denied: User is not admin or teacher");
    window.location.href = "/home";
  }

  return {
    user,
    isLoading,
    error,
    isAdmin,
    isTeacher,
    isAdminOrTeacher,
    userRole,
    panelType,
    refetchUser: () => user?.id && fetchUserData(user.id)
  };
}

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Hook to detect the current page context for contextual chat
 * Returns context information based on the current route
 */
export function usePageContext() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [context, setContext] = useState(null);

  useEffect(() => {
    let newContext = null;

    // Challenge context
    if (pathname.startsWith('/challenges/') || pathname.includes('/challenges/')) {
      const challengeId = extractIdFromPath(pathname, 'challenges');
      if (challengeId) {
        newContext = {
          type: 'challenge',
          challengeId: challengeId,
          page: 'challenge-detail'
        };
      } else if (pathname === '/challenges') {
        newContext = {
          type: 'challenges',
          page: 'challenge-list'
        };
      }
    }
    
    // Lesson context
    else if (pathname.startsWith('/lessons/') || pathname.includes('/lessons/')) {
      const lessonId = extractIdFromPath(pathname, 'lessons');
      if (lessonId) {
        newContext = {
          type: 'lesson',
          lessonId: lessonId,
          page: 'lesson-detail'
        };
      } else if (pathname === '/lessons') {
        newContext = {
          type: 'lessons',
          page: 'lesson-list'
        };
      }
    }
    
    // Teacher context
    else if (pathname.startsWith('/teacher')) {
      if (pathname.includes('/challenges')) {
        newContext = {
          type: 'teacher-challenges',
          page: 'teacher-challenges'
        };
      } else if (pathname.includes('/lessons')) {
        const lessonId = extractIdFromPath(pathname, 'lessons');
        if (lessonId) {
          newContext = {
            type: 'lesson',
            lessonId: lessonId,
            page: 'teacher-lesson-edit'
          };
        } else {
          newContext = {
            type: 'teacher-lessons',
            page: 'teacher-lessons'
          };
        }
      } else if (pathname.includes('/students')) {
        newContext = {
          type: 'teacher-students',
          page: 'teacher-students'
        };
      } else {
        newContext = {
          type: 'teacher',
          page: 'teacher-dashboard'
        };
      }
    }
    
    // Admin context
    else if (pathname.startsWith('/admin')) {
      if (pathname.includes('/challenges')) {
        const challengeId = extractIdFromPath(pathname, 'challenges');
        if (challengeId) {
          newContext = {
            type: 'challenge',
            challengeId: challengeId,
            page: 'admin-challenge-edit'
          };
        } else {
          newContext = {
            type: 'admin-challenges',
            page: 'admin-challenges'
          };
        }
      } else if (pathname.includes('/users')) {
        newContext = {
          type: 'admin-users',
          page: 'admin-users'
        };
      } else if (pathname.includes('/institutions')) {
        newContext = {
          type: 'admin-institutions',
          page: 'admin-institutions'
        };
      } else {
        newContext = {
          type: 'admin',
          page: 'admin-dashboard'
        };
      }
    }
    
    // Playground context
    else if (pathname === '/playground') {
      newContext = {
        type: 'playground',
        page: 'sql-playground'
      };
    }
    
    // Profile context
    else if (pathname === '/profile') {
      newContext = {
        type: 'profile',
        page: 'user-profile'
      };
    }
    
    // Main dashboard
    else if (pathname === '/home') {
      newContext = {
        type: 'dashboard',
        page: 'main-dashboard'
      };
    }

    setContext(newContext);
  }, [pathname, searchParams]);

  return context;
}

/**
 * Helper function to extract ID from pathname
 * @param {string} pathname - Current pathname
 * @param {string} segment - The segment to look for (e.g., 'challenges', 'lessons')
 * @returns {string|null} - Extracted ID or null
 */
function extractIdFromPath(pathname, segment) {
  const parts = pathname.split('/');
  const segmentIndex = parts.findIndex(part => part === segment);
  
  if (segmentIndex !== -1 && segmentIndex + 1 < parts.length) {
    const potentialId = parts[segmentIndex + 1];
    // Check if it's a valid ID (numeric or contains numbers)
    if (/^\d+$/.test(potentialId)) {
      return potentialId;
    }
  }
  
  return null;
}

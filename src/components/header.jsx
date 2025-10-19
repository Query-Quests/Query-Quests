"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Database,
  Book,
  LogOut,
  Menu,
  X,
  Shield,
} from "lucide-react";
import Link from "next/link";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear localStorage and redirect
      localStorage.removeItem("user");
      router.push("/auth");
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  return (
    <header className="bg-background border-b">
      <div className="container-sm mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={user ? "/home" : "/auth"} className="flex-shrink-0">
            <Database className="h-8 w-8 text-primary" aria-hidden="true" />
            <span className="sr-only">SQL Learn</span>
          </Link>
          <div className="flex items-center">
            <div className="flex justify-center">
              <nav className="hidden md:ml-6 md:flex md:space-x-8">
                <NavLink href="/home">Home</NavLink>
                <NavLink href="/lessons">Lessons</NavLink>
                <NavLink href="/challenges">Challenges</NavLink>
                {/* <NavLink href="/playground">SQL Playground</NavLink> */}
              </nav>
            </div>
          </div>
          <div className="hidden md:ml-4 md:flex md:items-center">
            <div className="mr-3 text-right">
              <div className="text-base font-medium">{user?.name || 'Loading...'}</div>
              {user?.institution && (
                <div className="text-sm text-muted-foreground">{user.institution.name}</div>
              )}
            </div>
            <UserMenu user={user} onLogout={handleLogout} />
          </div>
          <div className="flex md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Open menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink href="/lessons" mobile>
              Lessons
            </NavLink>
            <NavLink href="/challenges" mobile>
              Challenges
            </NavLink>
            <NavLink href="/playground" mobile>
              SQL Playground
            </NavLink>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <Avatar>
                  <AvatarImage src={user?.image_url || "https://github.com/shadcn.png"} alt="User" />
                  <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium">{user?.name || 'Loading...'}</div>
                <div className="text-sm font-medium text-muted-foreground">
                  {user?.institution ? user.institution.name : (user?.alias ? `@${user.alias}` : 'No institution')}
                </div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <MobileMenuItem href="/profile">Profile</MobileMenuItem>
              {user?.isAdmin && (
                <MobileMenuItem href="/admin">
                  Admin Panel
                </MobileMenuItem>
              )}
              {user?.isTeacher && !user?.isAdmin && (
                <MobileMenuItem href="/teacher">
                  Teacher Panel
                </MobileMenuItem>
              )}
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, children, mobile = false }) {
  const baseClasses =
    "text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors";
  const desktopClasses = "px-3 py-2 text-sm font-semibold";
  const mobileClasses = "block px-3 py-2 text-base font-semibold";

  return (
    <Link
      href={href}
      className={`${baseClasses} ${mobile ? mobileClasses : desktopClasses}`}
    >
      {children}
    </Link>
  );
}

function MobileMenuItem({ href, children }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      {children}
    </Link>
  );
}

function UserMenu({ user, onLogout }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image_url || "https://github.com/shadcn.png"} alt="User" />
            <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center">
            <Book className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              <span>Administration</span>
            </Link>
          </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={onLogout}
          className="hover:bg-red-500 hover:text-white focus:bg-red-500 focus:text-white cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4 text-inherit" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

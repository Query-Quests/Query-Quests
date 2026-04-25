"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Menu, X, Shield, User, Database, Bell } from "lucide-react";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/home", label: "Home" },
  { href: "/challenges", label: "Challenges" },
  { href: "/lessons", label: "Lessons" },
  { href: "/playground", label: "Playground" },
];

function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Authenticated app header — matches the Pencil `hdr1` block on
 * `05 · Home /home` and is reused across all in-app pages
 * (`/home`, `/challenges`, `/lessons`, `/playground`, `/profile`, …).
 *
 * Public/marketing pages use `<PublicHeader />` instead.
 */
export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      localStorage.removeItem("user");
      router.push("/auth");
    }
  };

  const isActive = (href) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href={user ? "/home" : "/auth"}
            className="flex items-center gap-2"
            aria-label="QueryQuest home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-green)]">
              <Database className="h-[18px] w-[18px] text-white" />
            </span>
            <span className="text-[18px] font-bold text-[var(--navy-dark)]">
              QueryQuest
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[14px] transition-colors ${
                  isActive(item.href)
                    ? "font-semibold text-[var(--accent-green)]"
                    : "font-medium text-gray-500 hover:text-[var(--navy-dark)]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:text-[var(--navy-dark)] hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
          </button>

          <UserMenu user={user} onLogout={handleLogout} />

          <button
            type="button"
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-[14px] ${
                  isActive(item.href)
                    ? "font-semibold text-[var(--accent-green)] bg-[var(--accent-green)]/10"
                    : "font-medium text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function UserMenu({ user, onLogout }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 w-9 p-0 rounded-full bg-[var(--accent-green)] hover:bg-[#15934d] text-white text-[13px] font-bold focus-visible:ring-[var(--accent-green)]"
          aria-label="Account menu"
        >
          {getInitials(user?.name)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2">
        <div className="px-2 py-2">
          <div className="text-sm font-semibold text-[var(--navy-dark)] truncate">
            {user?.name || "Loading…"}
          </div>
          <div className="text-xs text-gray-500 truncate">{user?.email}</div>
          {user?.institution?.name && (
            <div className="text-xs text-gray-400 truncate mt-0.5">
              {user.institution.name}
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer rounded-lg">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        {(user?.isAdmin || user?.isTeacher) && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center gap-2 cursor-pointer rounded-lg">
              <Shield className="h-4 w-4" />
              {user?.isAdmin ? "Admin Panel" : "Teacher Panel"}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="flex items-center gap-2 cursor-pointer rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

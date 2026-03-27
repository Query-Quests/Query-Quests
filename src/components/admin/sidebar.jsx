"use client";

import * as React from "react";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart3,
  Users,
  Database,
  Landmark,
  MessageSquare,
  Settings,
  Activity,
  Home,
  PanelLeftClose,
  PanelLeft,
  Menu,
  LogOut,
  User,
  ChevronUp,
  Shield,
} from "lucide-react";

// ============================================================================
// SIDEBAR CONTEXT
// ============================================================================

const SIDEBAR_STORAGE_KEY = "admin-sidebar-collapsed";
const SIDEBAR_WIDTH = "256px";
const SIDEBAR_COLLAPSED_WIDTH = "68px";

const SidebarContext = createContext(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

// ============================================================================
// SIDEBAR PROVIDER
// ============================================================================

export function SidebarProvider({ children, defaultCollapsed = false }) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        setIsCollapsed(stored === "true");
      }
    }
  }, []);

  // Persist collapsed state to localStorage
  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed));
    }
  }, [isCollapsed, isMounted]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const openMobile = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        toggleCollapsed,
        isMobileOpen,
        setIsMobileOpen,
        openMobile,
        closeMobile,
        toggleMobile,
        isMounted,
      }}
    >
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </SidebarContext.Provider>
  );
}

// ============================================================================
// SIDEBAR COMPONENTS
// ============================================================================

export function Sidebar({ children, className }) {
  const { isCollapsed, isMounted } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
        className
      )}
      style={{
        width: isMounted ? (isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH) : SIDEBAR_WIDTH,
      }}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ children, className }) {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={cn(
        "flex items-center border-b border-gray-100 h-16 px-4 shrink-0",
        isCollapsed ? "justify-center" : "justify-between",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SidebarContent({ children, className }) {
  return (
    <div className={cn("flex-1 overflow-y-auto py-4", className)}>
      {children}
    </div>
  );
}

export function SidebarFooter({ children, className }) {
  return (
    <div className={cn("mt-auto border-t border-gray-100 p-3 shrink-0", className)}>
      {children}
    </div>
  );
}

export function SidebarGroup({ children, className }) {
  return <div className={cn("px-3 py-2", className)}>{children}</div>;
}

export function SidebarGroupLabel({ children, className }) {
  const { isCollapsed } = useSidebar();

  if (isCollapsed) {
    return null;
  }

  return (
    <div
      className={cn(
        "px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SidebarMenu({ children, className }) {
  return <nav className={cn("flex flex-col gap-1", className)}>{children}</nav>;
}

export function SidebarMenuItem({
  href,
  icon: Icon,
  label,
  isActive,
  onClick,
  className,
}) {
  const { isCollapsed, closeMobile } = useSidebar();

  const handleClick = () => {
    closeMobile();
    onClick?.();
  };

  const content = (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
        isCollapsed && "justify-center px-2",
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function SidebarCollapseButton({ className }) {
  const { isCollapsed, toggleCollapsed } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className={cn("h-8 w-8 shrink-0", className)}
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={isCollapsed ? "right" : "bottom"}>
        {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// MOBILE SIDEBAR (Sheet-based drawer)
// ============================================================================

export function MobileSidebar({ children }) {
  const { isMobileOpen, closeMobile } = useSidebar();

  return (
    <Sheet open={isMobileOpen} onOpenChange={closeMobile}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}

export function MobileSidebarTrigger({ className }) {
  const { openMobile } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={openMobile}
      className={cn("lg:hidden h-9 w-9", className)}
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Open menu</span>
    </Button>
  );
}

// ============================================================================
// NAVIGATION ITEMS CONFIGURATION
// ============================================================================

const adminNavItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: BarChart3,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Challenges",
    href: "/admin/challenges",
    icon: Database,
  },
  {
    label: "Institutions",
    href: "/admin/institutions",
    icon: Landmark,
  },
  {
    label: "Contact Requests",
    href: "/admin/contact-requests",
    icon: MessageSquare,
  },
  {
    label: "Activity",
    href: "/admin/activity",
    icon: Activity,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

const teacherNavItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: BarChart3,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Challenges",
    href: "/admin/challenges",
    icon: Database,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

// ============================================================================
// SIDEBAR NAVIGATION
// ============================================================================

export function SidebarNav({ panelType = "admin" }) {
  const pathname = usePathname();
  const navItems = panelType === "admin" ? adminNavItems : teacherNavItems;

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <SidebarMenuItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={isActive}
          />
        );
      })}
    </SidebarMenu>
  );
}

// ============================================================================
// USER PROFILE SECTION
// ============================================================================

export function SidebarUserProfile({ user, panelType = "admin" }) {
  const { isCollapsed } = useSidebar();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/auth");
  };

  const handleNavigate = (path) => {
    router.push(path);
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "U";
  const roleLabel = panelType === "admin" ? "Administrator" : "Teacher";

  const avatarContent = (
    <Avatar className="h-9 w-9">
      <AvatarImage src={user?.avatar} alt={user?.name} />
      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
        {userInitial}
      </AvatarFallback>
    </Avatar>
  );

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 w-10 p-0 rounded-lg hover:bg-gray-100"
              >
                {avatarContent}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">Account menu</TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="right" align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleNavigate("/profile")}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleNavigate("/admin/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-auto p-2 justify-start hover:bg-gray-50 rounded-lg"
        >
          <div className="flex items-center gap-3 w-full">
            {avatarContent}
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4 font-normal"
              >
                {roleLabel}
              </Badge>
            </div>
            <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleNavigate("/profile")}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleNavigate("/admin/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// BACK TO HOME LINK
// ============================================================================

export function SidebarBackToHome() {
  const { isCollapsed, closeMobile } = useSidebar();

  const content = (
    <Link
      href="/home"
      onClick={closeMobile}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors",
        isCollapsed && "justify-center px-2"
      )}
    >
      <Home className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span>Back to Home</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">Back to Home</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

// ============================================================================
// SIDEBAR LOGO/BRANDING
// ============================================================================

export function SidebarBranding({ panelType = "admin" }) {
  const { isCollapsed } = useSidebar();
  const title = panelType === "admin" ? "Admin" : "Teacher";

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">{title} Panel</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
        <Shield className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-gray-900">{title} Panel</span>
        <span className="text-xs text-gray-500">Query Quest</span>
      </div>
    </div>
  );
}

// ============================================================================
// COMPLETE ADMIN SIDEBAR (combines all pieces)
// ============================================================================

export function AdminSidebar({ user, panelType = "admin" }) {
  const { isCollapsed } = useSidebar();

  // Desktop Sidebar Content
  const sidebarContent = (
    <>
      <SidebarHeader>
        <SidebarBranding panelType={panelType} />
        {!isCollapsed && <SidebarCollapseButton />}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarNav panelType={panelType} />
        </SidebarGroup>

        <Separator className="my-4" />

        <SidebarGroup>
          <SidebarBackToHome />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {isCollapsed && (
          <div className="flex justify-center mb-3">
            <SidebarCollapseButton />
          </div>
        )}
        <SidebarUserProfile user={user} panelType={panelType} />
      </SidebarFooter>
    </>
  );

  // Mobile Sidebar Content (always expanded)
  const mobileSidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">
            {panelType === "admin" ? "Admin" : "Teacher"} Panel
          </span>
          <span className="text-xs text-gray-500">Query Quest</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarNav panelType={panelType} />
        </SidebarGroup>

        <Separator className="my-4" />

        <SidebarGroup>
          <SidebarBackToHome />
        </SidebarGroup>
      </div>

      <div className="mt-auto border-t border-gray-100 p-3">
        <SidebarUserProfile user={user} panelType={panelType} />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <Sidebar>{sidebarContent}</Sidebar>

      {/* Mobile Sidebar (Sheet) */}
      <MobileSidebar>{mobileSidebarContent}</MobileSidebar>
    </>
  );
}

// ============================================================================
// MAIN CONTENT WRAPPER
// ============================================================================

export function SidebarInset({ children, className }) {
  const { isCollapsed, isMounted } = useSidebar();
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Track screen size for responsive margin
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Calculate margin based on sidebar state and screen size
  const marginLeft = isLargeScreen && isMounted
    ? isCollapsed
      ? SIDEBAR_COLLAPSED_WIDTH
      : SIDEBAR_WIDTH
    : "0px";

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-50 transition-all duration-300 ease-in-out",
        className
      )}
      style={{ marginLeft }}
    >
      {children}
    </div>
  );
}

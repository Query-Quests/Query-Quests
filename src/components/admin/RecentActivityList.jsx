"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, User, Database, Trophy, Clock } from "lucide-react";
import Link from "next/link";

/**
 * RecentActivityList component for displaying recent activities
 *
 * @param {Object} props
 * @param {string} props.title - The title for the activity list
 * @param {string} [props.description] - Optional description text
 * @param {Array} props.items - Array of activity items to display
 * @param {'user'|'challenge'|'custom'} [props.type] - Type of activity items
 * @param {string} [props.viewAllHref] - Link for "View All" button
 * @param {string} [props.viewAllLabel] - Label for "View All" button
 * @param {boolean} [props.isLoading] - Whether to show loading skeleton
 * @param {Function} [props.renderItem] - Custom render function for items
 * @param {string} [props.emptyMessage] - Message to display when no items
 * @param {string} [props.className] - Optional additional CSS classes
 */
function RecentActivityList({
  title,
  description,
  items = [],
  type = "custom",
  viewAllHref,
  viewAllLabel = "View All",
  isLoading = false,
  renderItem,
  emptyMessage = "No recent activity",
  className,
}) {
  if (isLoading) {
    return <RecentActivityListSkeleton title={title} className={className} />;
  }

  const defaultRenderItem = (item, index) => {
    if (type === "user") {
      return <UserActivityItem key={item.id || index} user={item} />;
    }
    if (type === "challenge") {
      return <ChallengeActivityItem key={item.id || index} challenge={item} />;
    }
    return (
      <GenericActivityItem
        key={item.id || index}
        title={item.title || item.name}
        subtitle={item.subtitle || item.description}
        badge={item.badge}
        timestamp={item.timestamp}
        icon={item.icon}
      />
    );
  };

  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) =>
              renderItem ? renderItem(item, index) : defaultRenderItem(item, index)
            )}
          </div>
        )}
        {viewAllHref && items.length > 0 && (
          <Button asChild variant="outline" className="w-full mt-4" size="sm">
            <Link href={viewAllHref}>
              <Eye className="h-4 w-4 mr-2" />
              {viewAllLabel}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * User activity item component
 */
function UserActivityItem({ user }) {
  const getRoleBadge = () => {
    if (user.isAdmin) {
      return <Badge variant="destructive">Admin</Badge>;
    }
    if (user.isTeacher) {
      return <Badge variant="default">Teacher</Badge>;
    }
    return <Badge variant="secondary">Student</Badge>;
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 rounded-full bg-blue-100 p-2">
          <User className="h-4 w-4 text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {user.institution?.name || "No institution"} • {user.points || 0} pts
          </p>
        </div>
      </div>
      {getRoleBadge()}
    </div>
  );
}

/**
 * Challenge activity item component
 */
function ChallengeActivityItem({ challenge }) {
  const getLevelBadge = (level) => {
    const colors = {
      1: "bg-green-100 text-green-800",
      2: "bg-yellow-100 text-yellow-800",
      3: "bg-orange-100 text-orange-800",
      4: "bg-red-100 text-red-800",
      5: "bg-purple-100 text-purple-800",
    };

    return (
      <span
        className={cn(
          "px-2 py-0.5 rounded-full text-xs font-medium",
          colors[level] || colors[1]
        )}
      >
        Level {level}
      </span>
    );
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 rounded-full bg-purple-100 p-2">
          <Database className="h-4 w-4 text-purple-600" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{challenge.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {challenge.solves || 0} solves • {challenge.institution?.name || "No institution"}
          </p>
        </div>
      </div>
      {getLevelBadge(challenge.level)}
    </div>
  );
}

/**
 * Generic activity item component
 */
function GenericActivityItem({ title, subtitle, badge, timestamp, icon }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="flex-shrink-0 rounded-full bg-muted p-2">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
          {timestamp && (
            <p className="text-xs text-muted-foreground">{timestamp}</p>
          )}
        </div>
      </div>
      {badge && <Badge variant="secondary">{badge}</Badge>}
    </div>
  );
}

/**
 * Loading skeleton for RecentActivityList
 */
function RecentActivityListSkeleton({ title, className }) {
  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardHeader className="pb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-2">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
        ))}
        <Skeleton className="h-9 w-full mt-4" />
      </CardContent>
    </Card>
  );
}

export {
  RecentActivityList,
  RecentActivityListSkeleton,
  UserActivityItem,
  ChallengeActivityItem,
  GenericActivityItem,
};

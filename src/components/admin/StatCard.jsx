"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * StatCard component for displaying dashboard statistics
 *
 * @param {Object} props
 * @param {string} props.label - The label/title for the stat
 * @param {string|number} props.value - The main value to display
 * @param {React.ReactNode} props.icon - The icon component to display
 * @param {string} [props.description] - Optional description text
 * @param {Object} [props.trend] - Optional trend indicator
 * @param {number} [props.trend.value] - Trend percentage value
 * @param {'up'|'down'|'neutral'} [props.trend.direction] - Trend direction
 * @param {string} [props.iconColor] - Color class for the icon (e.g., "text-blue-600")
 * @param {string} [props.iconBgColor] - Background color class for the icon (e.g., "bg-blue-100")
 * @param {boolean} [props.isLoading] - Whether to show loading skeleton
 * @param {string} [props.className] - Optional additional CSS classes
 */
function StatCard({
  label,
  value,
  icon,
  description,
  trend,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  isLoading = false,
  className,
}) {
  if (isLoading) {
    return <StatCardSkeleton className={className} />;
  }

  const getTrendIcon = () => {
    if (!trend) return null;

    const direction = trend.direction || (trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'neutral');

    switch (direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return "";

    const direction = trend.direction || (trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'neutral');

    switch (direction) {
      case 'up':
        return "text-green-600";
      case 'down':
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={cn("border-0 shadow-sm transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {label}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight">
                {value}
              </p>
              {trend && (
                <span className={cn("flex items-center gap-0.5 text-xs font-medium", getTrendColor())}>
                  {getTrendIcon()}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <div className={cn("rounded-lg p-2.5", iconBgColor)}>
            <div className={cn("h-5 w-5", iconColor)}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for StatCard
 */
function StatCardSkeleton({ className }) {
  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export { StatCard, StatCardSkeleton };

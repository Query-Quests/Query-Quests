"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DashboardGrid component for responsive dashboard layouts
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render in the grid
 * @param {'stats'|'cards'|'sections'} [props.variant] - Grid layout variant
 * @param {string} [props.className] - Optional additional CSS classes
 */
function DashboardGrid({ children, variant = "stats", className }) {
  const getGridClasses = () => {
    switch (variant) {
      case "stats":
        // Stats grid: 1 column on mobile, 2 on sm, 4 on lg
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4";
      case "cards":
        // Cards grid: 1 column on mobile, 2 on md, 3 on lg
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";
      case "sections":
        // Sections grid: 1 column on mobile, 2 on lg
        return "grid grid-cols-1 lg:grid-cols-2 gap-6";
      default:
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4";
    }
  };

  return (
    <div className={cn(getGridClasses(), className)}>
      {children}
    </div>
  );
}

/**
 * DashboardSection component for grouping dashboard content
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} [props.title] - Optional section title
 * @param {string} [props.description] - Optional section description
 * @param {React.ReactNode} [props.action] - Optional action element (button, link, etc.)
 * @param {string} [props.className] - Optional additional CSS classes
 */
function DashboardSection({ children, title, description, action, className }) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || description || action) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {title && (
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * DashboardContainer component for consistent dashboard page layout
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} [props.className] - Optional additional CSS classes
 */
function DashboardContainer({ children, className }) {
  return (
    <div className={cn("space-y-6 w-full", className)}>
      {children}
    </div>
  );
}

/**
 * QuickActions component for displaying quick action buttons
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Action buttons
 * @param {string} [props.title] - Optional title
 * @param {string} [props.description] - Optional description
 * @param {string} [props.className] - Optional additional CSS classes
 */
function QuickActions({ children, title, description, className }) {
  return (
    <div className={cn("space-y-3", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-sm font-medium">{title}</h3>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        {children}
      </div>
    </div>
  );
}

export {
  DashboardGrid,
  DashboardSection,
  DashboardContainer,
  QuickActions,
};

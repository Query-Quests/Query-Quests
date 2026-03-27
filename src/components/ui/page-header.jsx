import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * PageHeader component for consistent admin page headers
 *
 * @param {Object} props
 * @param {string} props.title - The main title of the page
 * @param {string} [props.description] - Optional description text below the title
 * @param {React.ReactNode} [props.children] - Optional action buttons or other elements
 * @param {string} [props.className] - Optional additional CSS classes
 */
function PageHeader({ title, description, children, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * PageHeaderHeading component for page title
 */
function PageHeaderHeading({ className, ...props }) {
  return (
    <h1
      className={cn(
        "text-2xl font-bold tracking-tight sm:text-3xl",
        className
      )}
      {...props}
    />
  )
}

/**
 * PageHeaderDescription component for page description
 */
function PageHeaderDescription({ className, ...props }) {
  return (
    <p
      className={cn("text-sm text-muted-foreground sm:text-base", className)}
      {...props}
    />
  )
}

/**
 * PageHeaderActions component for action buttons container
 */
function PageHeaderActions({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

export {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
  PageHeaderActions,
}

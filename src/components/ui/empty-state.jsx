import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

/**
 * EmptyState component for displaying when tables/lists have no data
 *
 * @param {Object} props
 * @param {React.ElementType} [props.icon] - Lucide icon component to display
 * @param {string} props.title - Main title text
 * @param {string} [props.description] - Optional description text
 * @param {Object} [props.action] - Optional action button configuration
 * @param {string} props.action.label - Button label
 * @param {function} props.action.onClick - Button click handler
 * @param {React.ElementType} [props.action.icon] - Optional button icon
 * @param {string} [props.action.variant] - Button variant (default: "default")
 * @param {string} [props.className] - Optional additional CSS classes
 * @param {React.ReactNode} [props.children] - Optional custom content instead of action button
 */
function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  className,
  children,
}) {
  return (
    <div
      className={cn(
        "flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50 sm:min-h-[300px]",
        className
      )}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant={action.variant || "default"}
          className="mt-6"
          onClick={action.onClick}
        >
          {action.icon && <action.icon className="mr-2 h-4 w-4" />}
          {action.label}
        </Button>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}

/**
 * EmptyStateIcon component for custom icon rendering
 */
function EmptyStateIcon({ icon: Icon, className }) {
  return (
    <div
      className={cn(
        "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted",
        className
      )}
    >
      <Icon className="h-6 w-6 text-muted-foreground" />
    </div>
  )
}

/**
 * EmptyStateTitle component for title text
 */
function EmptyStateTitle({ className, ...props }) {
  return (
    <h3
      className={cn("mt-4 text-lg font-semibold", className)}
      {...props}
    />
  )
}

/**
 * EmptyStateDescription component for description text
 */
function EmptyStateDescription({ className, ...props }) {
  return (
    <p
      className={cn(
        "mt-2 max-w-sm text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

/**
 * EmptyStateAction component for action button
 */
function EmptyStateAction({ className, ...props }) {
  return <Button className={cn("mt-6", className)} {...props} />
}

export {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateAction,
}

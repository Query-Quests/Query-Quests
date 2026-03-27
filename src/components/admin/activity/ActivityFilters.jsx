"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, Search, X, Filter, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const activityTypes = [
  { value: "all", label: "All Types" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "challenge_start", label: "Challenge Started" },
  { value: "challenge_complete", label: "Challenge Completed" },
  { value: "user_created", label: "User Created" },
  { value: "user_updated", label: "User Updated" },
  { value: "user_deleted", label: "User Deleted" },
  { value: "settings_changed", label: "Settings Changed" },
  { value: "password_changed", label: "Password Changed" },
  { value: "role_changed", label: "Role Changed" },
];

const dateRanges = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "last30days", label: "Last 30 Days" },
  { value: "last90days", label: "Last 90 Days" },
  { value: "custom", label: "Custom Range" },
];

function formatDateForInput(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

export function ActivityFilters({
  filters,
  onFiltersChange,
  users = [],
  onRefresh,
  isLoading = false,
}) {
  const [isCustomRange, setIsCustomRange] = useState(filters.dateRange === "custom");

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleDateRangeChange = (value) => {
    setIsCustomRange(value === "custom");
    handleFilterChange("dateRange", value);

    // Clear custom dates if not custom range
    if (value !== "custom") {
      onFiltersChange({
        ...filters,
        dateRange: value,
        startDate: null,
        endDate: null,
      });
    }
  };

  const clearFilters = () => {
    setIsCustomRange(false);
    onFiltersChange({
      search: "",
      type: "all",
      userId: "all",
      dateRange: "last7days",
      startDate: null,
      endDate: null,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.type !== "all" ||
    filters.userId !== "all" ||
    filters.dateRange !== "last7days" ||
    filters.startDate ||
    filters.endDate;

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* First row: Search and Type */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search activities..."
                  value={filters.search || ""}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Activity Type */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm">Activity Type</Label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) => handleFilterChange("type", value)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User Filter */}
            <div className="space-y-2">
              <Label htmlFor="user" className="text-sm">User</Label>
              <Select
                value={filters.userId || "all"}
                onValueChange={(value) => handleFilterChange("userId", value)}
              >
                <SelectTrigger id="user">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label htmlFor="dateRange" className="text-sm">Date Range</Label>
              <Select
                value={filters.dateRange || "last7days"}
                onValueChange={handleDateRangeChange}
              >
                <SelectTrigger id="dateRange">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {dateRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom date range inputs */}
          {isCustomRange && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formatDateForInput(filters.startDate)}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formatDateForInput(filters.endDate)}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2 lg:px-3"
                >
                  Clear Filters
                  <X className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { activityTypes, dateRanges };

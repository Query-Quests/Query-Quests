"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Filter } from "lucide-react";
import {
  ActivityFilters,
  ActivityDataTable,
  getCategoryForType,
} from "@/components/admin/activity";

// Pulls events from /api/admin/activity (UserChallenge, LessonProgress,
// QueryAttempt, User.last_login) and maps them to the table's expected
// row shape.
async function loadRealActivity() {
  const r = await fetch("/api/admin/activity?limit=200", { credentials: "include" });
  if (!r.ok) return [];
  const data = await r.json();
  return (data.events ?? []).map((e) => ({
    id: e.id,
    type: e.type,
    user: e.actor,
    description: e.details,
    createdAt: e.timestamp,
  }));
}

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
  });

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      setActivities(await loadRealActivity());
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...activities];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.user?.name?.toLowerCase().includes(q) ||
          a.user?.email?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.type?.toLowerCase().includes(q)
      );
    }

    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter(
        (a) => getCategoryForType(a.type) === filters.category
      );
    }

    setFilteredActivities(filtered);
  }, [activities, filters]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold text-[#030914] tracking-[-1px] leading-tight">
            Activity log
          </h1>
          <p className="text-sm text-gray-500">
            All auditable actions across the platform
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="inline-flex items-center gap-2 h-[38px] px-[14px] rounded-[10px] text-[13px] font-semibold text-[#030914] bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-3.5 w-3.5" />
            All events
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 h-[38px] px-[14px] rounded-[10px] text-[13px] font-semibold text-white bg-[#030914] hover:bg-[#030914]/90 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <ActivityFilters filters={filters} onFiltersChange={setFilters} />

      {/* Table + pagination */}
      <ActivityDataTable
        data={filteredActivities}
        isLoading={isLoading}
        pageSize={25}
      />
    </div>
  );
}

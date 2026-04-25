"use client";

import { Search, SlidersHorizontal } from "lucide-react";

const categoryChips = [
  { value: "all", label: "All events" },
  { value: "user", label: "User actions" },
  { value: "security", label: "Security" },
];

// Map an activity `type` to one of the chip categories.
function getCategoryForType(type) {
  if (!type) return "user";
  if (
    type === "login" ||
    type === "logout" ||
    type === "password_changed" ||
    type === "role_changed"
  ) {
    return "security";
  }
  return "user";
}

export function ActivityFilters({ filters, onFiltersChange }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const activeChip = filters.category || "all";

  return (
    <div className="flex items-center gap-[10px] w-full">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-[14px] top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search activity log..."
          value={filters.search || ""}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="w-full h-[38px] pl-10 pr-[14px] text-[13px] text-[#030914] placeholder:text-gray-400 bg-white border border-gray-200 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/20"
        />
      </div>

      {/* Category chips */}
      {categoryChips.map((chip) => {
        const active = activeChip === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => handleFilterChange("category", chip.value)}
            className={
              active
                ? "h-[34px] px-[14px] rounded-[8px] text-[12px] font-semibold tracking-[0.1px] bg-[#19aa59] text-white shadow-[0_1px_2px_rgba(16,185,129,0.2)] hover:bg-[#15934d] transition-colors"
                : "h-[34px] px-[14px] rounded-[8px] text-[12px] font-medium tracking-[0.1px] bg-white text-[#030914] border border-gray-200 hover:bg-gray-50 transition-colors"
            }
          >
            {chip.label}
          </button>
        );
      })}

      {/* View placeholder */}
      <button
        type="button"
        className="inline-flex items-center gap-1.5 h-[34px] px-[14px] rounded-[8px] text-[12px] font-medium text-[#030914] bg-white border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-gray-50 transition-colors"
        aria-label="View options"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        View
      </button>
    </div>
  );
}

export { categoryChips, getCategoryForType };

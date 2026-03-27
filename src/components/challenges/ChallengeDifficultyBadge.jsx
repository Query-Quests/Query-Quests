"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Difficulty levels and their colors:
 * - Level 1 (Beginner): Green
 * - Level 2 (Easy): Green/Yellow
 * - Level 3 (Medium): Yellow
 * - Level 4 (Hard): Red
 * - Level 5 (Expert): Purple/Red
 */

const difficultyConfig = {
  1: {
    label: "Beginner",
    shortLabel: "L1",
    className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  },
  2: {
    label: "Easy",
    shortLabel: "L2",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  },
  3: {
    label: "Medium",
    shortLabel: "L3",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
  },
  4: {
    label: "Hard",
    shortLabel: "L4",
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  },
  5: {
    label: "Expert",
    shortLabel: "L5",
    className: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100",
  },
};

export function ChallengeDifficultyBadge({ level, showLevel = true, compact = false, className }) {
  const config = difficultyConfig[level] || difficultyConfig[1];

  const displayText = compact
    ? config.shortLabel
    : showLevel
      ? `Level ${level} - ${config.label}`
      : config.label;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium whitespace-nowrap",
        config.className,
        className
      )}
    >
      {displayText}
    </Badge>
  );
}

export function getDifficultyLabel(level) {
  return difficultyConfig[level]?.label || "Unknown";
}

export function getDifficultyConfig(level) {
  return difficultyConfig[level] || difficultyConfig[1];
}

export default ChallengeDifficultyBadge;

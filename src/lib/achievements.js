/**
 * Achievement display metadata. Client-safe — no server-only imports.
 *
 * Adding a new achievement: append an entry here AND add a matching rule
 * in `src/lib/achievements-rules.js`. Codes must match exactly.
 *
 * Icon strings map to lucide-react component names; the profile page
 * resolves them to the actual icon at render time.
 */
export const ACHIEVEMENT_DEFINITIONS = [
  {
    code: "FIRST_10",
    title: "First 10",
    subtitle: "Solved 10 challenges",
    icon: "Trophy",
  },
  {
    code: "STREAK_7",
    title: "7-day streak",
    subtitle: "7 days in a row",
    icon: "Flame",
  },
  {
    code: "FIRST_TRY",
    title: "First-try solver",
    subtitle: "Solve a challenge on the first attempt",
    icon: "Zap",
  },
  {
    code: "HUNDRED_SOLVED",
    title: "100 solved",
    subtitle: "Solve 100 challenges",
    icon: "Lock",
  },
];

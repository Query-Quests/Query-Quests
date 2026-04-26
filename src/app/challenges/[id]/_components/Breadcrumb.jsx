import Link from "next/link";
import { Home, ChevronRight, Zap, Users } from "lucide-react";

const MONO = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace",
};

export function Breadcrumb({ challenge }) {
  const points = challenge.current_score ?? challenge.score ?? 0;
  const solves = challenge.solves ?? 0;

  return (
    <div className="flex items-center justify-between bg-white px-8 py-3 border-b border-gray-200">
      <nav className="flex items-center gap-2 text-[13px]">
        <Link
          href="/home"
          className="flex items-center gap-1 text-gray-500 hover:text-[#030914] transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        <Link
          href="/challenges"
          className="text-gray-500 hover:text-[#030914] transition-colors"
        >
          Challenges
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        <span className="font-semibold text-[#030914]">
          {challenge.name || `Challenge #${challenge.id}`}
        </span>
      </nav>

      <div className="hidden sm:flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-gray-500" />
          <span
            className="text-[12px] font-semibold text-[#030914]"
            style={MONO}
          >
            {points} pts
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3 w-3 text-gray-500" />
          <span className="text-[12px] text-gray-500" style={MONO}>
            {solves} solves
          </span>
        </div>
      </div>
    </div>
  );
}

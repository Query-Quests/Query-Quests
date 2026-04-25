import Link from "next/link";
import { Home, ChevronRight, Star, Users } from "lucide-react";

export function Breadcrumb({ challenge }) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3">
      <div className="max-w-full mx-auto flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/home" className="text-gray-500 hover:text-[#19aa59] transition-colors flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <Link href="/challenges" className="text-gray-500 hover:text-[#19aa59] transition-colors">
            Challenges
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <span className="text-[#030914] font-medium">
            {challenge.name || `Challenge #${challenge.id}`}
          </span>
        </nav>

        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="h-4 w-4 text-[#19aa59]" />
            <span className="font-semibold text-[#030914]">
              {challenge.current_score || challenge.score}
            </span>
            <span className="text-gray-400">pts</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>{challenge.solves} solves</span>
          </div>
        </div>
      </div>
    </div>
  );
}

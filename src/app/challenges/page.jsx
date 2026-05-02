"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/header";
import { Database, Search, Users, AlertCircle, CheckCircle2 } from "lucide-react";

const FONT_STYLE = {
  fontFamily: "var(--font-geist-sans), Geist, Arial, sans-serif",
};

const MONO_STYLE = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace",
};

const LEVEL_CONFIG = {
  1: { label: "EASY", dot: "var(--accent-green)" },
  2: { label: "MEDIUM", dot: "#f59e0b" },
  3: { label: "HARD", dot: "#f97316" },
  4: { label: "EXPERT", dot: "#ef4444" },
  5: { label: "MASTER", dot: "#a855f7" },
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [solvedIds, setSolvedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const userData = localStorage.getItem("user");
        if (!userData) throw new Error("User not authenticated");
        const parsedUser = JSON.parse(userData);

        let fullUser = parsedUser;
        try {
          const userResponse = await fetch(`/api/users/${parsedUser.id}`);
          if (userResponse.ok) {
            fullUser = await userResponse.json();
            localStorage.setItem("user", JSON.stringify(fullUser));
          }
        } catch {}
        if (cancelled) return;
        setUser(fullUser);

        let url = "/api/challenges";
        if (fullUser.isTeacher && !fullUser.isAdmin && fullUser.institution_id) {
          url = `/api/challenges?institution=${fullUser.institution_id}`;
        }

        const [response, statsResponse] = await Promise.all([
          fetch(url),
          fetch(`/api/users/${parsedUser.id}/stats`).catch(() => null),
        ]);
        if (!response.ok) throw new Error("Failed to fetch challenges");
        const data = await response.json();
        if (cancelled) return;
        setChallenges(Array.isArray(data) ? data : data.challenges || []);

        if (statsResponse?.ok) {
          const stats = await statsResponse.json();
          if (cancelled) return;
          const ids = new Set(
            (stats?.solvedChallenges || [])
              .map((sc) => sc?.challenge?.id || sc?.challenge_id)
              .filter(Boolean)
          );
          setSolvedIds(ids);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = challenges.filter((c) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      c.name?.toLowerCase().includes(q) ||
      c.statement?.toLowerCase().includes(q);
    const matchesLevel = selectedLevel === null || c.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const totalChallenges = challenges.length;
  const totalSolves = challenges.reduce((sum, c) => sum + (c.solves || 0), 0);

  return (
    <div
      className="min-h-screen bg-[#f9f9f9] text-[var(--navy-dark)]"
      style={FONT_STYLE}
    >
      <Header />

      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-12 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 border border-gray-200">
                <Database className="h-4 w-4 text-gray-700" />
              </span>
              <h1 className="text-[28px] font-semibold text-[var(--navy-dark)] tracking-[-0.6px] leading-none">
                SQL Challenges
              </h1>
            </div>
            <p className="text-[14px] text-gray-500 leading-[1.5] max-w-2xl">
              Master SQL through interactive challenges. Solve problems, earn
              points, and climb the leaderboard.
            </p>
          </div>

          <div className="flex items-center gap-8">
            <HeroStat label="CHALLENGES" value={totalChallenges} />
            <span className="block w-px h-10 bg-gray-200" />
            <HeroStat label="TOTAL SOLVES" value={totalSolves} />
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-8 pt-7 pb-8 flex flex-col gap-7">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              name="challenge-search"
              aria-label="Search challenges"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, topic, or table…"
              className="w-full h-[42px] pl-10 pr-4 rounded-lg border border-gray-200 bg-white text-[13px] text-[var(--navy-dark)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)]/20 focus:border-[var(--accent-green)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <FilterChip
              active={selectedLevel === null}
              onClick={() => setSelectedLevel(null)}
            >
              All challenges
            </FilterChip>
            {[1, 2, 3, 4, 5].map((lvl) => (
              <FilterChip
                key={lvl}
                active={selectedLevel === lvl}
                onClick={() => setSelectedLevel(lvl)}
              >
                Level {lvl}
              </FilterChip>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--accent-green)] border-t-transparent mx-auto mb-3" />
              <p className="text-[13px] text-gray-500">Loading challenges…</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl bg-white border border-gray-200 p-10 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-[15px] font-semibold text-[var(--navy-dark)] mb-1">
              Error loading challenges
            </h3>
            <p className="text-[13px] text-gray-500">{error}</p>
          </div>
        ) : user && !user.institution_id ? (
          <div className="rounded-xl bg-white border border-gray-200 border-l-4 border-l-amber-500 p-7 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--navy-dark)] mb-1">
                No institution assigned
              </h3>
              <p className="text-[13px] text-gray-500">
                You don&apos;t have an institution assigned. Please contact your
                administrator to get access to challenges.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-7">
            {[1, 2, 3, 4, 5].map((lvl) => {
              const items = filtered.filter((c) => c.level === lvl);
              if (items.length === 0) return null;
              return (
                <LevelGroup key={lvl} level={lvl} count={items.length}>
                  {items.map((c) => (
                    <ChallengeRow
                      key={c.id}
                      challenge={c}
                      solved={solvedIds.has(c.id)}
                    />
                  ))}
                </LevelGroup>
              );
            })}

            {filtered.length === 0 && (
              <div className="rounded-xl bg-white border border-gray-200 p-16 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Database className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-[15px] font-semibold text-[var(--navy-dark)] mb-1">
                  {searchTerm || selectedLevel
                    ? "No challenges found"
                    : "No challenges available"}
                </h3>
                <p className="text-[13px] text-gray-500 max-w-md mx-auto">
                  {searchTerm || selectedLevel
                    ? "Try adjusting your search or filter criteria."
                    : "There are no challenges available for your institution at the moment."}
                </p>
                {(searchTerm || selectedLevel) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedLevel(null);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-[12px] font-medium text-gray-500 hover:text-[var(--navy-dark)] hover:bg-gray-50 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function HeroStat({ label, value }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p
        className="text-[11px] font-semibold text-gray-500 uppercase"
        style={{ letterSpacing: "1px" }}
      >
        {label}
      </p>
      <p
        className="text-[28px] font-semibold text-[var(--navy-dark)] tracking-[-0.5px] leading-none"
        style={MONO_STYLE}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-[14px] py-[7px] rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
        active
          ? "bg-[var(--navy-dark)] text-white border border-[var(--navy-dark)]"
          : "bg-white text-gray-500 border border-gray-200 hover:text-[var(--navy-dark)]"
      }`}
      style={{ letterSpacing: "0.2px" }}
    >
      {children}
    </button>
  );
}

function LevelGroup({ level, count, children }) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];
  return (
    <div className="flex flex-col gap-3.5 w-full">
      <div className="flex items-center gap-3.5 px-1">
        <div className="flex items-center gap-2">
          <span
            className="block h-[7px] w-[7px] rounded-full"
            style={{ backgroundColor: config.dot }}
          />
          <span
            className="text-[11px] font-bold text-[var(--navy-dark)]"
            style={{ letterSpacing: "1px" }}
          >
            LEVEL {level} · {config.label}
          </span>
        </div>
        <span className="flex-1 h-px bg-gray-200" />
        <span
          className="text-[11px] font-semibold text-gray-500"
          style={{ letterSpacing: "0.3px" }}
        >
          {count} challenge{count !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex flex-col gap-3.5">{children}</div>
    </div>
  );
}

function ChallengeRow({ challenge, solved = false }) {
  const config = LEVEL_CONFIG[challenge.level] || LEVEL_CONFIG[1];
  const score = challenge.current_score ?? challenge.initial_score ?? 0;
  const solves = challenge.solves || 0;
  const title =
    challenge.name || challenge.statement?.split(".")[0] || "Untitled";
  const description =
    challenge.name && challenge.statement
      ? challenge.statement
      : challenge.statement || "";

  const cardClass = solved
    ? "rounded-xl bg-[#f0fdf4] border border-[#19aa59] px-5 py-[18px] flex flex-col gap-3 hover:border-[#15934d] transition-all group"
    : "rounded-xl bg-white border border-gray-200 px-5 py-[18px] flex flex-col gap-3 hover:border-gray-300 transition-all group";
  const cardStyle = solved
    ? { boxShadow: "0 1px 3px rgba(25,170,89,0.18)" }
    : { boxShadow: "0 1px 3px rgba(10,18,32,0.04)" };

  return (
    <Link
      href={`/challenges/${challenge.id}`}
      className={cardClass}
      style={cardStyle}
      aria-label={solved ? `${title} (already solved)` : title}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="block h-[6px] w-[6px] rounded-full"
            style={{ backgroundColor: config.dot }}
          />
          <span
            className="text-[10px] font-bold text-[var(--navy-dark)]"
            style={{ letterSpacing: "1.2px" }}
          >
            {config.label}
          </span>
          {solved && (
            <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-[#19aa59] px-1.5 py-[2px] text-[9px] font-bold text-white tracking-[0.4px]">
              <CheckCircle2 className="h-2.5 w-2.5" />
              SOLVED
            </span>
          )}
        </div>
        <span
          className="text-[11px] font-medium text-gray-500"
          style={MONO_STYLE}
        >
          {score} pts
        </span>
      </div>

      <h3 className="text-[15px] font-semibold text-[var(--navy-dark)] tracking-[-0.1px] leading-tight">
        {title}
      </h3>

      {description && (
        <p className="text-[13px] text-gray-500 leading-[1.5] line-clamp-2">
          {description}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 text-gray-500">
          <Users className="h-3 w-3" />
          <span className="text-[11px] font-medium">
            {solves} solve{solves === 1 ? "" : "s"}
          </span>
        </div>
        <span className="text-[12px] font-semibold text-[#15934d]">
          {solved ? "Review" : "Open"}{" "}
          <span className="inline-block transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}

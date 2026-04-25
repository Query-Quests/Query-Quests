"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Target,
  Flame,
  Award,
  Play,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";

const FONT_STYLE = {
  fontFamily: "var(--font-geist-sans), Geist, Arial, sans-serif",
};

const MONO_STYLE = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace",
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    setUser(parsed);

    fetch(`/api/users/${parsed.id}/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {});

    fetch("/api/leaderboard?limit=10")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.leaderboard) setLeaderboard(data.leaderboard);
      })
      .catch(() => {});
  }, []);

  const totalScore = stats?.stats?.totalScore ?? user?.totalScore ?? 0;
  const solved = stats?.stats?.totalChallenges ?? user?.solvedChallenges ?? 0;
  const streak = stats?.stats?.streak ?? 0;
  const myRankIndex = leaderboard.findIndex((row) => row.id === user?.id);
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[var(--navy-dark)]" style={FONT_STYLE}>
      <Header />

      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-12 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-[26px] font-semibold text-[var(--navy-dark)] tracking-[-0.4px]">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-[14px] text-gray-500 mt-1.5">
              Ready to continue your SQL journey? Pick up where you left off.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/challenges">
              <Button className="px-[18px] py-2.5 h-auto bg-[var(--accent-green)] hover:bg-[#15934d] text-white text-[14px] font-semibold rounded-md gap-2">
                <Play className="h-3.5 w-3.5 fill-white" />
                Start Challenge
              </Button>
            </Link>
            <Link href="/lessons">
              <Button
                variant="outline"
                className="px-[18px] py-2.5 h-auto border-gray-300 text-[var(--navy-dark)] hover:bg-gray-50 hover:text-[var(--navy-dark)] text-[14px] font-semibold rounded-md gap-2"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Browse Lessons
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-8 py-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={Trophy}
            label="Total Score"
            value={totalScore.toLocaleString()}
            delta="+12% this week"
          />
          <StatCard
            icon={Target}
            label="Challenges Completed"
            value={String(solved)}
            delta={solved > 0 ? "+5 since Monday" : null}
          />
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={streak === 1 ? "1 day" : `${streak} days`}
            delta={streak === 0 ? "Solve or complete a lesson to start" : "Keep the chain alive"}
          />
          <StatCard
            icon={Award}
            label="Rank"
            value={myRank ? `#${myRank}` : "#—"}
            delta={myRank ? "+3 this week" : null}
          />
        </div>

        <section className="flex flex-col gap-4">
          <header className="flex flex-col gap-1">
            <p
              className="text-[11px] font-semibold text-gray-500 uppercase"
              style={{ letterSpacing: "1.4px" }}
            >
              Overview
            </p>
            <h2 className="text-[18px] font-semibold text-[var(--navy-dark)]">
              Quick Actions
            </h2>
            <p className="text-[13px] text-gray-500">
              Jump back into your learning or browse what&apos;s next.
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionCard
              icon={Play}
              title="Continue Learning"
              description="Pick up where you left off with your current challenge"
              href="/challenges"
              cta="Continue"
            />
            <QuickActionCard
              icon={BookOpen}
              title="Explore Lessons"
              description="Learn new SQL concepts with structured tutorials"
              href="/lessons"
              cta="Browse"
            />
            <QuickActionCard
              icon={Trophy}
              title="View Leaderboard"
              description="See how you rank against other students"
              href="#leaderboard"
              cta="View ranking"
            />
          </div>
        </section>

        <Leaderboard leaderboard={leaderboard} currentUserId={user?.id} />
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, delta }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-5 flex items-center justify-between gap-3">
      <div className="flex flex-col gap-1.5 min-w-0">
        <p
          className="text-[11px] font-medium text-gray-500 uppercase truncate"
          style={{ letterSpacing: "0.3px" }}
        >
          {label}
        </p>
        <p className="text-[28px] font-semibold text-[var(--navy-dark)] tracking-[-0.6px] leading-none">
          {value}
        </p>
        {delta && <p className="text-[12px] text-gray-500">{delta}</p>}
      </div>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
        <Icon className="h-[18px] w-[18px] text-gray-500" />
      </span>
    </div>
  );
}

function QuickActionCard({ icon: Icon, title, description, href, cta }) {
  return (
    <Link
      href={href}
      className="rounded-xl bg-white border border-gray-200 p-6 flex flex-col gap-3.5 hover:border-gray-300 hover:shadow-sm transition-all group"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
        <Icon className="h-[18px] w-[18px] text-gray-700" />
      </span>
      <h3 className="text-[15px] font-semibold text-[var(--navy-dark)]">{title}</h3>
      <p className="text-[13px] text-gray-500 leading-[1.5]">{description}</p>
      <p className="text-[12px] font-semibold text-[var(--accent-green)]">
        {cta} <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
      </p>
    </Link>
  );
}

function Leaderboard({ leaderboard, currentUserId }) {
  return (
    <section
      id="leaderboard"
      className="rounded-xl bg-white border border-gray-200 overflow-hidden scroll-mt-24"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-200">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[15px] font-semibold text-[var(--navy-dark)] tracking-[-0.1px]">
            Leaderboard
          </h2>
          <p className="text-[12px] text-gray-500">Top performers — this month</p>
        </div>
        <Link
          href="/challenges"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-200 text-[12px] font-medium text-gray-500 hover:text-[var(--navy-dark)] hover:bg-gray-50 transition-colors"
        >
          View all
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div
        className="grid items-center gap-3.5 px-7 py-2.5 bg-[#f9f9f9] border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase"
        style={{ letterSpacing: "0.8px", gridTemplateColumns: "30px 34px 1fr auto" }}
      >
        <span>Rank</span>
        <span aria-hidden="true" />
        <span>Participant</span>
        <span>Points</span>
      </div>

      {leaderboard.length === 0 ? (
        <div className="px-7 py-12 text-center text-[13px] text-gray-500">
          No leaderboard data yet. Complete a challenge to claim your spot.
        </div>
      ) : (
        leaderboard.map((row, idx) => (
          <LeaderboardRow
            key={row.id}
            rank={idx + 1}
            row={row}
            isCurrentUser={row.id === currentUserId}
            isLast={idx === leaderboard.length - 1}
          />
        ))
      )}
    </section>
  );
}

function LeaderboardRow({ rank, row, isCurrentUser, isLast }) {
  const initials = getInitials(row.name);
  const rankLabel = String(rank).padStart(2, "0");

  if (isCurrentUser) {
    return (
      <div
        className={`grid items-center gap-3.5 px-7 py-3.5 bg-[#f0fdf4] border-l-2 border-l-[var(--accent-green)] ${
          isLast ? "" : "border-b border-b-gray-200"
        }`}
        style={{ gridTemplateColumns: "30px 34px 1fr auto" }}
      >
        <span
          className="flex h-7 items-center justify-center rounded-md bg-white border border-[var(--accent-green)] text-[11px] font-bold text-[#15934d]"
          style={{ ...MONO_STYLE, letterSpacing: "0.3px" }}
        >
          {rankLabel}
        </span>
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[var(--accent-green)] border border-[#15934d] text-[11px] font-bold text-white">
          {initials}
        </span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-[13px] font-bold text-[#15934d] truncate">{row.name}</p>
          <p className="text-[11px] text-[#15934d] truncate">
            You{row.institution?.name ? ` · ${row.institution.name}` : ""} ·{" "}
            {row.solvedChallenges} challenges solved
          </p>
        </div>
        <p
          className="text-[14px] font-bold text-[#15934d] tracking-[-0.2px]"
          style={MONO_STYLE}
        >
          {row.totalScore.toLocaleString()}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid items-center gap-3.5 px-7 py-3.5 ${
        isLast ? "" : "border-b border-b-gray-200"
      }`}
      style={{ gridTemplateColumns: "30px 34px 1fr auto" }}
    >
      <span
        className={`flex h-7 items-center justify-center rounded-md bg-white border border-gray-200 text-[11px] font-semibold ${
          rank === 1 ? "text-[var(--navy-dark)]" : "text-gray-500"
        }`}
        style={{ ...MONO_STYLE, letterSpacing: "0.4px" }}
      >
        {rankLabel}
      </span>
      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-gray-100 border border-gray-200 text-[11px] font-semibold text-[var(--navy-dark)]">
        {initials}
      </span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-[13px] font-semibold text-[var(--navy-dark)] truncate">
          {row.name}
        </p>
        <p className="text-[11px] text-gray-500 truncate">
          {row.institution?.name || "Independent"} · {row.solvedChallenges} challenges solved
        </p>
      </div>
      <p
        className="text-[14px] font-semibold text-[var(--navy-dark)] tracking-[-0.2px]"
        style={MONO_STYLE}
      >
        {row.totalScore.toLocaleString()}
      </p>
    </div>
  );
}

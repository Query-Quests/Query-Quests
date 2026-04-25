"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Loader2,
  UserPlus,
  Trophy,
  Mail,
  GraduationCap,
  BarChart3,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

const SANS = "var(--font-geist-sans), Geist, Arial, sans-serif";
const MONO = "var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace";

export default function AdminDashboard() {
  const { user, userRole, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-[#19aa59]" />
      </div>
    );
  }

  return <DashboardView userRole={userRole} user={user} />;
}

function DashboardView({ userRole, user }) {
  const isAdmin = userRole === "admin";
  const isTeacher = userRole === "teacher";

  const [users, setUsers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [challengeStats, setChallengeStats] = useState({ totalChallenges: 0 });
  const [institutions, setInstitutions] = useState([]);
  const [contactRequests, setContactRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

    async function safeJson(res, fallback) {
      try {
        return await res.json();
      } catch {
        return fallback;
      }
    }

    async function load() {
      setLoading(true);
      try {
        const usersUrl = isAdmin
          ? `${baseUrl}/api/users?limit=1000`
          : isTeacher && user?.institution_id
          ? `${baseUrl}/api/users?limit=1000&institution=${user.institution_id}`
          : null;
        const challengesUrl = isAdmin
          ? `${baseUrl}/api/challenges?limit=10`
          : isTeacher && user?.institution_id
          ? `${baseUrl}/api/challenges?limit=10&institution=${user.institution_id}`
          : null;
        const challengeStatsUrl = isAdmin
          ? `${baseUrl}/api/challenges/stats`
          : isTeacher && user?.institution_id
          ? `${baseUrl}/api/challenges/stats?institutionId=${user.institution_id}`
          : null;

        const [u, c, cs, inst, cr] = await Promise.all([
          usersUrl ? fetch(usersUrl).then((r) => safeJson(r, { users: [] })) : { users: [] },
          challengesUrl ? fetch(challengesUrl).then((r) => safeJson(r, { challenges: [] })) : { challenges: [] },
          challengeStatsUrl ? fetch(challengeStatsUrl).then((r) => safeJson(r, { totalChallenges: 0 })) : { totalChallenges: 0 },
          isAdmin ? fetch(`${baseUrl}/api/institutions`).then((r) => safeJson(r, [])) : [],
          isAdmin ? fetch(`${baseUrl}/api/contact-requests`).then((r) => safeJson(r, [])) : [],
        ]);

        setUsers(u.users || u || []);
        setChallenges(c.challenges || c || []);
        setChallengeStats(cs || { totalChallenges: 0 });
        setInstitutions(Array.isArray(inst) ? inst : []);
        setContactRequests(Array.isArray(cr) ? cr : []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, isAdmin, isTeacher]);

  const totalUsers = users.length;
  const totalChallenges = challengeStats?.totalChallenges || challenges.length;
  const totalInstitutions = institutions.length;
  const pendingContactRequests = contactRequests.filter((r) => r.status === "pending").length;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activeUsers = users.filter(
    (u) => u.last_login && new Date(u.last_login) > twentyFourHoursAgo
  ).length;

  const totalPoints = users.reduce((s, u) => s + (u.points || 0), 0);
  const avgPoints = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;

  const monthLabel = useMemo(() => {
    return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  }, []);

  const stats = isAdmin
    ? [
        { label: "Total Users", value: formatNumber(totalUsers) },
        { label: "Active Institutions", value: formatNumber(totalInstitutions) },
        { label: "Challenges Published", value: formatNumber(totalChallenges) },
        { label: "Avg. Points / User", value: formatNumber(avgPoints) },
      ]
    : [
        { label: "Institution Users", value: formatNumber(totalUsers) },
        { label: "Active (24h)", value: formatNumber(activeUsers) },
        { label: "Challenges", value: formatNumber(totalChallenges) },
        { label: "Avg. Points / User", value: formatNumber(avgPoints) },
      ];

  // Build "Recent Activity" feed: newest user, newest challenge, pending requests.
  const newestUser = [...users]
    .filter((u) => u.created_at)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  const newestChallenge = [...challenges]
    .filter((c) => c.created_at || c.createdAt)
    .sort(
      (a, b) =>
        new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)
    )[0];

  const activity = [];
  if (newestUser) {
    activity.push({
      kind: "user",
      title: `New signup: ${newestUser.name || newestUser.email || "user"}`,
      subtitle: relativeTime(newestUser.created_at),
    });
  }
  if (newestChallenge) {
    activity.push({
      kind: "challenge",
      title: `New challenge: ${newestChallenge.name || newestChallenge.title || "challenge"}`,
      subtitle: relativeTime(newestChallenge.created_at || newestChallenge.createdAt),
    });
  }
  if (isAdmin && pendingContactRequests > 0) {
    activity.push({
      kind: "contact",
      title: `${pendingContactRequests} contact request${pendingContactRequests === 1 ? "" : "s"}`,
      subtitle: "Pending review",
    });
  }

  // Top institutions by user count (computed from users[].institution_id).
  const usersByInst = useMemo(() => {
    const m = new Map();
    for (const u of users) {
      const id = u.institution_id || u.institution?.id;
      if (!id) continue;
      m.set(id, (m.get(id) || 0) + 1);
    }
    return m;
  }, [users]);
  const topInstitutions = useMemo(() => {
    return institutions
      .map((i) => ({ id: i.id, name: i.name, users: usersByInst.get(i.id) || 0 }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 5);
  }, [institutions, usersByInst]);

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: SANS }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1
            className="text-[28px] font-bold text-[#030914] leading-tight"
            style={{ letterSpacing: "-1px" }}
          >
            Dashboard
          </h1>
          <p className="text-[14px] text-gray-500">
            {isAdmin
              ? "Overview of platform activity this month"
              : `Overview of ${user?.institution?.name || "your institution"} this month`}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-[10px] bg-white border border-gray-200 px-4 py-2.5 self-start md:self-auto">
          <Calendar className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-[13px] font-semibold text-[#030914]">{monthLabel}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} loading={loading} />
        ))}
      </div>

      {/* Main grid: chart + side */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <SubmissionsCard challenges={challenges} loading={loading} />
        <div className="flex flex-col gap-4">
          <RecentActivityCard items={activity} loading={loading} />
          {isAdmin && (
            <TopInstitutionsCard institutions={topInstitutions} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, loading }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-5 flex flex-col gap-2">
      <p className="text-[12px] font-medium text-gray-500">{label}</p>
      <p
        className="text-[28px] font-bold text-[#030914] leading-none"
        style={{ fontFamily: MONO, letterSpacing: "-0.5px" }}
      >
        {loading ? "—" : value}
      </p>
      <p className="text-[12px] font-semibold text-gray-400">
        {loading ? "Loading…" : "Live data"}
      </p>
    </div>
  );
}

function SubmissionsCard({ challenges, loading }) {
  // Synthesize a 12-bucket distribution from challenges' solveCount, falling back gracefully.
  const buckets = useMemo(() => {
    const values = challenges
      .map((c) => Number(c.solveCount ?? c.solves ?? 0))
      .filter((n) => Number.isFinite(n));
    if (values.length === 0) return [];
    const sorted = [...values].sort((a, b) => a - b);
    // Pad/sample to 12 bars.
    const out = [];
    for (let i = 0; i < 12; i++) {
      const idx = Math.floor((i / 12) * sorted.length);
      out.push(sorted[idx] || 0);
    }
    return out;
  }, [challenges]);

  const max = Math.max(1, ...buckets);
  const total = buckets.reduce((s, n) => s + n, 0);

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-[#030914]">Submissions distribution</h2>
        {!loading && buckets.length > 0 && (
          <span
            className="text-[13px] font-semibold text-[#19aa59]"
            style={{ fontFamily: MONO }}
          >
            {formatNumber(total)} solves
          </span>
        )}
      </div>
      {loading ? (
        <div className="h-[160px] flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
        </div>
      ) : buckets.length === 0 ? (
        <div className="h-[160px] flex flex-col items-center justify-center text-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-[13px] text-gray-500">No submission data yet</p>
        </div>
      ) : (
        <div className="h-[160px] flex items-end gap-1">
          {buckets.map((v, i) => {
            const h = Math.max(8, Math.round((v / max) * 155));
            const dark = i >= buckets.length - 3;
            return (
              <div
                key={i}
                className="flex-1 rounded"
                style={{
                  height: `${h}px`,
                  backgroundColor: dark ? "#15934d" : "#19aa59",
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecentActivityCard({ items, loading }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-5 flex flex-col gap-3">
      <h3 className="text-[16px] font-bold text-[#030914]">Recent Activity</h3>
      {loading ? (
        <div className="py-6 flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-[13px] text-gray-500 py-2">No recent activity</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-3">
              <ActivityIcon kind={it.kind} />
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-[13px] font-semibold text-[#030914] truncate">
                  {it.title}
                </p>
                {it.subtitle && (
                  <p className="text-[12px] text-gray-500 truncate">{it.subtitle}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivityIcon({ kind }) {
  if (kind === "user") {
    return (
      <div className="h-8 w-8 rounded-lg bg-[#ecfdf5] flex items-center justify-center flex-shrink-0">
        <UserPlus className="h-4 w-4 text-[#19aa59]" />
      </div>
    );
  }
  if (kind === "challenge") {
    return (
      <div className="h-8 w-8 rounded-lg bg-[#dbeafe] flex items-center justify-center flex-shrink-0">
        <Trophy className="h-4 w-4 text-blue-600" />
      </div>
    );
  }
  return (
    <div className="h-8 w-8 rounded-lg bg-[#fef3c7] flex items-center justify-center flex-shrink-0">
      <Mail className="h-4 w-4 text-amber-600" />
    </div>
  );
}

function TopInstitutionsCard({ institutions, loading }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-5 flex flex-col gap-3">
      <h3 className="text-[16px] font-bold text-[#030914]">Top Institutions</h3>
      {loading ? (
        <div className="py-4 flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
        </div>
      ) : institutions.length === 0 ? (
        <p className="text-[13px] text-gray-500 py-2">No institutions yet</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {institutions.map((inst, i) => (
            <li key={inst.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <GraduationCap className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-[13px] font-medium text-[#030914] truncate">
                  {inst.name}
                </span>
              </div>
              <span
                className={`text-[13px] font-bold ${
                  i === 0 ? "text-[#19aa59]" : "text-[#030914]"
                }`}
                style={{ fontFamily: MONO }}
              >
                {formatNumber(inst.users)} users
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatNumber(n) {
  if (n == null || Number.isNaN(n)) return "0";
  return Number(n).toLocaleString("en-US");
}

function relativeTime(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diff = Date.now() - then;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

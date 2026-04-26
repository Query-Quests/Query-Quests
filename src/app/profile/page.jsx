"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Save, X, Trophy, Flame, Zap, Lock } from "lucide-react";
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/achievements";

const ICONS = { Trophy, Flame, Zap, Lock };

const FONT_SANS = "var(--font-geist-sans), Geist, Arial, sans-serif";
const FONT_MONO = "var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace";

const HEATMAP_LEVELS = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildHeatmap(activeDates) {
  const set = new Set(activeDates || []);
  const cols = 26;
  const rows = 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - (cols * rows - 1));

  const cells = [];
  const monthsSeen = new Map();
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const d = new Date(start);
      d.setDate(start.getDate() + c * rows + r);
      const key = d.toISOString().slice(0, 10);
      const active = set.has(key);
      let level = 0;
      if (active) {
        const seed = (d.getDate() * 7 + d.getMonth() * 13) % 4;
        level = 1 + seed;
      }
      cells.push({ col: c, row: r, level });
      if (r === 0) {
        const monthIdx = d.getMonth();
        if (!monthsSeen.has(monthIdx)) monthsSeen.set(monthIdx, c);
      }
    }
  }

  return { cells, cols, rows, monthsSeen };
}

function Heatmap({ activeDates }) {
  const { cells, cols, rows, monthsSeen } = useMemo(() => buildHeatmap(activeDates), [activeDates]);
  const cellSize = 12;
  const gap = 3;
  const width = cols * (cellSize + gap) - gap;
  const height = rows * (cellSize + gap) - gap;

  return (
    <div className="w-full">
      <div className="relative mb-1.5" style={{ height: 14 }}>
        {[...monthsSeen.entries()].map(([monthIdx, col]) => (
          <span
            key={monthIdx}
            className="absolute text-[11px] font-medium text-gray-400"
            style={{ left: `${(col / cols) * 100}%` }}
          >
            {MONTH_LABELS[monthIdx]}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        {cells.map((cell, i) => (
          <rect
            key={i}
            x={cell.col * (cellSize + gap)}
            y={cell.row * (cellSize + gap)}
            width={cellSize}
            height={cellSize}
            rx={2}
            ry={2}
            fill={HEATMAP_LEVELS[cell.level]}
          />
        ))}
      </svg>
      <div className="mt-3 flex items-center justify-end gap-1.5">
        <span className="text-[10px] font-medium text-gray-400">Less</span>
        {HEATMAP_LEVELS.map((c, i) => (
          <span key={i} className="inline-block rounded-[2px]" style={{ width: 12, height: 12, background: c }} />
        ))}
        <span className="text-[10px] font-medium text-gray-400">More</span>
      </div>
    </div>
  );
}

function StatRow({ label, value, suffix }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold tracking-[0.12em] text-gray-500">{label}</span>
      {suffix ? (
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-bold leading-none tracking-[-0.01em] text-[#030914]" style={{ fontFamily: FONT_MONO }}>
            {value}
          </span>
          <span className="text-xs text-gray-500">{suffix}</span>
        </div>
      ) : (
        <span className="text-[26px] font-bold leading-tight tracking-[-0.01em] text-[#030914]" style={{ fontFamily: FONT_MONO }}>
          {value}
        </span>
      )}
    </div>
  );
}

function Achievement({ icon: Icon, title, subtitle, locked, earnedAt }) {
  const earnedLabel = earnedAt
    ? new Date(earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-2 rounded-[10px] border bg-white px-4 py-5 ${
        locked ? "border-gray-200 opacity-70" : "border-[#19aa59]/30"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
          locked
            ? "border-gray-200 bg-white"
            : "border-[#19aa59]/30 bg-[#19aa59]/10"
        }`}
      >
        <Icon className={`h-4 w-4 ${locked ? "text-gray-400" : "text-[#19aa59]"}`} />
      </div>
      <div className={`text-[13px] font-semibold ${locked ? "text-gray-400" : "text-[#030914]"}`}>{title}</div>
      <div className={`text-[10px] ${locked ? "text-gray-400" : "text-gray-500"}`}>{subtitle}</div>
      {earnedLabel && (
        <div className="text-[9px] uppercase tracking-wider text-[#19aa59]">
          Earned · {earnedLabel}
        </div>
      )}
    </div>
  );
}

function initialsFor(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatJoined(dateLike) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function roleLabel(user) {
  if (!user) return "STUDENT";
  if (user.isAdmin) return "ADMIN";
  if (user.isTeacher) return "TEACHER";
  return "STUDENT";
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", institution_id: "none" });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        fetchUserData(parsed.id);
        fetchStats(parsed.id);
        fetchAchievements(parsed.id);
      } catch (err) {
        console.error("Error parsing user data:", err);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
    fetchInstitutions();
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
        setFormData({
          name: data.name || "",
          email: data.email || "",
          institution_id: data.institution_id?.toString() || "none",
        });
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAchievements = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}/achievements`);
      if (res.ok) {
        const data = await res.json();
        setAchievements(data.achievements || []);
      }
    } catch (err) {
      console.error("Error fetching achievements:", err);
    }
  };

  const fetchStats = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}/stats`);
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const res = await fetch("/api/institutions");
      if (res.ok) setInstitutions(await res.json());
    } catch (err) {
      console.error("Error fetching institutions:", err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dataToSend = {
        ...formData,
        institution_id: user.isAdmin
          ? (formData.institution_id === "none" ? null : formData.institution_id)
          : user.institution_id,
      };
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error updating user:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      institution_id: user?.institution_id?.toString() || "none",
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: FONT_SANS }}>
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[#19aa59]" />
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: FONT_SANS }}>
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-red-500">User not found</p>
        </div>
      </div>
    );
  }

  const totalScore = stats?.stats?.totalScore ?? user.totalScore ?? 0;
  const solvedCount = stats?.stats?.totalChallenges ?? user.solvedChallenges ?? 0;
  const totalChallenges = stats?.totalChallengesAvailable ?? 124;
  const streak = stats?.streak ?? 0;
  const rank = stats?.rank ?? "—";
  const rankTotal = stats?.totalUsers;
  const joinedAt = formatJoined(user.created_at || user.createdAt);
  const institutionName = user.institution?.name;
  const role = roleLabel(user);

  const activeDates = (stats?.solvedChallenges || []).map((sc) => {
    const d = sc.solved_at || sc.createdAt || sc.created_at;
    return d ? new Date(d).toISOString().slice(0, 10) : null;
  }).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: FONT_SANS }}>
      <Header />

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[1376px] items-center gap-7 px-12 py-9">
          <div className="flex h-[88px] w-[88px] flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100">
            <span className="text-[32px] font-semibold text-[#030914]">{initialsFor(user.name)}</span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {isEditing ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                  className="h-9 max-w-xs"
                />
                <span className="text-[11px] font-bold tracking-[0.12em] text-gray-500">{role}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <h1 className="text-[24px] font-bold tracking-[-0.02em] text-[#030914]">{user.name}</h1>
                <span className="text-[11px] font-bold tracking-[0.12em] text-gray-500">· {role}</span>
              </div>
            )}

            {isEditing ? (
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email"
                className="h-9 max-w-md"
              />
            ) : (
              <p className="text-[13px] text-gray-500">
                {user.email}
                {institutionName ? ` · ${institutionName}` : ""}
              </p>
            )}

            {isEditing && user.isAdmin ? (
              <div className="mt-1 max-w-md">
                <Label className="text-[11px] font-medium text-gray-500">Institution</Label>
                <Select
                  value={formData.institution_id}
                  onValueChange={(v) => setFormData({ ...formData, institution_id: v })}
                >
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder="Select institution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Institution</SelectItem>
                    {institutions.map((i) => (
                      <SelectItem key={i.id} value={i.id.toString()}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-[12px] leading-[1.5] text-gray-500">
                {joinedAt ? `Joined ${joinedAt}` : "Member"} · {solvedCount} challenges solved
                {streak ? ` · ${streak}-day streak` : ""}
              </p>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-3">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-9 gap-2 rounded-md bg-[#19aa59] px-3.5 text-xs font-semibold text-white hover:bg-[#15934d]"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="h-9 gap-2 rounded-md border-gray-200 bg-white px-3.5 text-xs font-semibold text-[#030914]"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="h-auto gap-2 rounded-md border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#030914] hover:bg-gray-50"
              >
                <Pencil className="h-[13px] w-[13px]" />
                Edit profile
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1376px] px-8 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex flex-1 flex-col gap-6">
            <section className="rounded-2xl border border-gray-200 bg-white px-6 pt-5 pb-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <h2 className="mb-3 text-[11px] font-bold tracking-[0.12em] text-gray-500">ACTIVITY</h2>
              <Heatmap activeDates={activeDates} />
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <h2 className="mb-4 text-[11px] font-bold tracking-[0.12em] text-gray-500">ACHIEVEMENTS</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {ACHIEVEMENT_DEFINITIONS.map((def) => {
                  const earned = achievements.find((a) => a.code === def.code);
                  const Icon = ICONS[def.icon] || Trophy;
                  return (
                    <Achievement
                      key={def.code}
                      icon={Icon}
                      title={def.title}
                      subtitle={def.subtitle}
                      locked={!earned}
                      earnedAt={earned?.earned_at}
                    />
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="w-full lg:w-[360px]">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <h2 className="mb-5 text-[11px] font-bold tracking-[0.12em] text-gray-500">STATS</h2>
              <div className="flex flex-col gap-5">
                <StatRow label="TOTAL SCORE" value={totalScore.toLocaleString()} />
                <StatRow label="SOLVED" value={`${solvedCount} / ${totalChallenges}`} />
                <div className="border-t border-gray-200" />
                <StatRow label="CURRENT STREAK" value={streak} suffix={streak === 1 ? "day" : "days"} />
                <div className="border-t border-gray-200" />
                <StatRow label="RANK" value={`#${rank}`} suffix={rankTotal ? `of ${rankTotal}` : undefined} />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

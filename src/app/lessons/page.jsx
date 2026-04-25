"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Search,
  CircleCheck,
  CircleDashed,
  Loader,
  Flame,
  ArrowRight,
} from "lucide-react";

const FONT_STYLE = {
  fontFamily: "var(--font-geist-sans), Geist, Arial, sans-serif",
};

const MONO_STYLE = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace",
};

export default function LessonsPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/modules", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { modules: [] }))
      .then((data) => setModules(Array.isArray(data?.modules) ? data.modules : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    let total = 0;
    let completed = 0;
    let inProgress = 0;
    for (const m of modules) {
      for (const l of m.lessons) {
        total++;
        if (l.status === "COMPLETED") completed++;
        else if (l.status === "IN_PROGRESS") inProgress++;
      }
    }
    return {
      total,
      completed,
      inProgress,
      remaining: Math.max(0, total - completed),
    };
  }, [modules]);

  const filteredModules = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return modules;
    return modules.filter((m) => {
      const moduleHit =
        m.title.toLowerCase().includes(q) ||
        (m.description || "").toLowerCase().includes(q);
      const lessonHit = m.lessons.some(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          (l.description || "").toLowerCase().includes(q)
      );
      return moduleHit || lessonHit;
    });
  }, [modules, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]" style={FONT_STYLE}>
        <Header />
        <div className="max-w-7xl mx-auto px-8 py-16 flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--accent-green)] border-t-transparent mx-auto mb-4" />
            <p className="text-[14px] text-gray-500">Loading lessons…</p>
          </div>
        </div>
      </div>
    );
  }

  const moduleCount = modules.length;

  return (
    <div
      className="min-h-screen bg-[#f9f9f9] text-[var(--navy-dark)]"
      style={FONT_STYLE}
    >
      <Header />

      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-12 py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200">
                <BookOpen className="h-[18px] w-[18px] text-[var(--navy-dark)]" />
              </span>
              <h1 className="text-[30px] font-bold text-[var(--navy-dark)] tracking-[-0.6px] leading-none">
                SQL Lessons
              </h1>
            </div>
            <p className="text-[14px] text-gray-500">
              Structured tutorials grouped into modules. Work through each module at your own pace — your progress is saved automatically.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--accent-green)]" />
            <span
              className="text-[11px] font-bold text-[var(--navy-dark)]"
              style={{ letterSpacing: "1px" }}
            >
              {moduleCount} {moduleCount === 1 ? "MODULE" : "MODULES"}
            </span>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-8 py-8 flex flex-col gap-6">
        <ProgressOverview {...totals} />

        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search modules and lessons…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-11 text-[14px] border-gray-200 focus:border-[var(--accent-green)] focus-visible:ring-[var(--accent-green)]/20 rounded-xl bg-white"
          />
        </div>

        {filteredModules.length === 0 ? (
          <EmptyState
            searchTerm={searchTerm}
            onClear={() => setSearchTerm("")}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredModules.map((m) => (
              <ModuleCard key={m.id} module={m} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ProgressOverview({ total, completed, inProgress, remaining }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section
      className="rounded-2xl bg-white border border-gray-200 p-8 flex flex-col gap-7"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
    >
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex flex-col gap-2.5 lg:w-72 flex-shrink-0">
          <p
            className="text-[11px] font-semibold text-gray-500 uppercase"
            style={{ letterSpacing: "1.2px" }}
          >
            Course Completion
          </p>
          <p
            className="text-[56px] font-bold text-[var(--navy-dark)] leading-none"
            style={MONO_STYLE}
          >
            {pct}%
          </p>
          <p className="text-[13px] text-gray-500">
            of the SQL course mastered
          </p>
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-gray-100 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-green)]" />
            <span className="text-[12px] font-semibold text-[var(--navy-dark)]">
              {completed} of {total} lessons
            </span>
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
          <StatTile
            icon={CircleCheck}
            iconClass="text-[var(--accent-green)]"
            value={completed}
            label="Completed"
          />
          <StatTile
            icon={Loader}
            iconClass="text-blue-600"
            value={inProgress}
            label="In progress"
          />
          <StatTile
            icon={CircleDashed}
            iconClass="text-gray-500"
            value={remaining}
            label="Remaining"
          />
          <StatTile
            icon={Flame}
            iconClass="text-amber-500"
            value={completed > 0 ? 1 : 0}
            label="Day streak"
          />
        </div>
      </div>
    </section>
  );
}

function StatTile({ icon: Icon, iconClass, value, label }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl bg-[#fafafa] border border-gray-200 p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-[18px] w-[18px] ${iconClass}`} />
        <p className="text-[26px] font-bold text-[var(--navy-dark)] leading-none">
          {value}
        </p>
      </div>
      <p className="text-[12px] text-gray-500">{label}</p>
    </div>
  );
}

function ModuleCard({ module: m }) {
  const { total, completed, percent } = m.progress;
  const firstIncomplete = m.lessons.find((l) => l.status !== "COMPLETED");
  const continueLesson = firstIncomplete ?? m.lessons[0];
  const continueLabel = completed === 0 ? "Start module" : completed === total ? "Review" : "Continue";

  return (
    <div
      className="rounded-2xl bg-white border border-gray-200 p-6 flex flex-col gap-5"
      style={{ boxShadow: "0 2px 10px rgba(10,18,32,0.04)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <p
            className="text-[10px] font-bold text-gray-500 uppercase"
            style={{ letterSpacing: "1.2px" }}
          >
            Module {m.order}
          </p>
          <h3 className="text-[20px] font-bold text-[var(--navy-dark)] tracking-[-0.3px] leading-tight">
            {m.title}
          </h3>
          {m.description && (
            <p className="text-[13px] text-gray-500 leading-[1.55]">
              {m.description}
            </p>
          )}
        </div>
        <span
          className="text-[13px] font-semibold text-[var(--navy-dark)] flex-shrink-0"
          style={MONO_STYLE}
        >
          {completed}/{total}
        </span>
      </div>

      <div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-[var(--accent-green)] transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] text-gray-500">
            {percent}% complete · {total} {total === 1 ? "lesson" : "lessons"}
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-1">
        {m.lessons.map((l, i) => {
          const completed = l.status === "COMPLETED";
          const inProgress = l.status === "IN_PROGRESS";
          return (
            <li key={l.id}>
              <Link
                href={`/lessons/${l.id}`}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {completed ? (
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--accent-green)]">
                    <CircleCheck className="h-[14px] w-[14px] text-white" />
                  </span>
                ) : inProgress ? (
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-[var(--accent-green)]">
                    <span className="block h-[8px] w-[8px] rounded-full bg-[var(--accent-green)]" />
                  </span>
                ) : (
                  <span className="block h-[18px] w-[18px] rounded-full border border-gray-300" />
                )}
                <span
                  className={`text-[12px] truncate ${
                    completed
                      ? "text-gray-500"
                      : inProgress
                      ? "font-semibold text-[#15934d]"
                      : "text-gray-600"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")} · {l.title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {continueLesson && (
        <Link
          href={`/lessons/${continueLesson.id}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[var(--accent-green)] hover:bg-[#15934d] text-white text-[13px] font-semibold transition-colors self-start"
        >
          {continueLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ searchTerm, onClear }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 py-16 px-6 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <BookOpen className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-[17px] font-semibold text-[var(--navy-dark)] mb-1.5">
        {searchTerm ? "No matches" : "No modules available"}
      </h3>
      <p className="text-[13px] text-gray-500 max-w-md mx-auto">
        {searchTerm
          ? "Try a different search term."
          : "Check back later for new lessons from your instructors."}
      </p>
      {searchTerm && (
        <Button
          variant="outline"
          className="mt-4 border-gray-300 text-[var(--navy-dark)] hover:bg-gray-50 rounded-md text-[13px]"
          onClick={onClear}
        >
          Clear search
        </Button>
      )}
    </div>
  );
}

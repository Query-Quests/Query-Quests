"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import Header from "@/components/header";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Terminal,
} from "lucide-react";

const MarkdownPreview = dynamic(
  () => import("@uiw/react-md-editor").then((m) => m.default.Markdown),
  { ssr: false }
);

const FONT_STYLE = {
  fontFamily: "var(--font-geist-sans), Geist, Arial, sans-serif",
};

const MONO_STYLE = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace",
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

function firstSqlBlock(content) {
  if (typeof content !== "string") return null;
  const m = content.match(/```sql\s*([\s\S]*?)```/i);
  return m ? m[1].trim() : null;
}

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/lessons/${id}`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Lesson not found" : "Failed to load lesson");
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        setData(json);
        // Fire-and-forget: mark started.
        fetch(`/api/lessons/${id}/progress`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "started" }),
        }).catch(() => {});
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "Failed to load lesson");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const siblings = data?.siblings ?? [];
  const moduleProgress = data?.moduleProgress ?? {};
  const moduleTitle = data?.module?.title ?? null;
  const moduleOrder = data?.module?.order ?? null;

  const currentIndex = useMemo(
    () => siblings.findIndex((s) => s.id === id),
    [siblings, id]
  );
  const total = siblings.length;
  const prevSibling = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const nextSibling =
    currentIndex >= 0 && currentIndex < total - 1
      ? siblings[currentIndex + 1]
      : null;

  const sqlSeed = useMemo(() => firstSqlBlock(data?.content), [data?.content]);
  const playgroundHref = sqlSeed
    ? `/playground?seed=${encodeURIComponent(sqlSeed)}`
    : "/playground";

  async function handleNext() {
    if (completing) return;
    setCompleting(true);
    try {
      await fetch(`/api/lessons/${id}/progress`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
    } catch {
      // Non-blocking; navigation still proceeds.
    }
    setCompleting(false);
    if (nextSibling) {
      router.push(`/lessons/${nextSibling.id}`);
    } else {
      router.push("/lessons");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]" style={FONT_STYLE}>
        <Header />
        <div className="max-w-7xl mx-auto px-8 py-16 text-gray-500 text-sm">
          Loading lesson…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]" style={FONT_STYLE}>
        <Header />
        <div className="max-w-3xl mx-auto px-8 py-16 text-center">
          <p className="text-[15px] text-gray-700 mb-4">{error || "Lesson not found"}</p>
          <Link
            href="/lessons"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--accent-green)] text-white text-[13px] font-semibold hover:bg-[#15934d]"
          >
            Back to lessons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[var(--navy-dark)]" style={FONT_STYLE}>
      <Header />

      <div className="flex">
        <Sidebar
          moduleTitle={moduleTitle}
          moduleOrder={moduleOrder}
          lessonTitle={data.title}
          siblings={siblings}
          currentId={id}
          moduleProgress={moduleProgress}
        />

        <main className="flex-1 px-16 py-10 max-w-[840px]">
          <p
            className="text-[11px] font-bold text-gray-500 uppercase mb-4"
            style={{ letterSpacing: "1.2px" }}
          >
            {currentIndex >= 0 && total > 0
              ? `Lesson ${pad2(currentIndex + 1)} of ${pad2(total)}`
              : `Lesson`}
          </p>

          <h1 className="text-[30px] font-bold text-[var(--navy-dark)] tracking-[-0.6px] mb-3">
            {data.title}
          </h1>

          {data.description && (
            <p className="text-[15px] text-gray-500 leading-[1.55] mb-8">
              {data.description}
            </p>
          )}

          <div className="lesson-body" data-color-mode="light">
            <MarkdownPreview source={data.content || ""} />
          </div>

          <div className="flex items-center justify-between mt-10">
            {prevSibling ? (
              <Link
                href={`/lessons/${prevSibling.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white border border-gray-200 text-[13px] font-semibold text-[var(--navy-dark)] hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous lesson
              </Link>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={completing}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--accent-green)] hover:bg-[#15934d] text-[13px] font-semibold text-white transition-colors disabled:opacity-60"
            >
              {nextSibling ? "Next lesson" : "Finish module"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {sqlSeed && (
            <div className="mt-10 flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-[10px]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 border border-gray-200 flex-shrink-0">
                <Terminal className="h-4 w-4 text-[var(--navy-dark)]" />
              </span>
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <p
                  className="text-[10px] font-bold text-gray-500 uppercase"
                  style={{ letterSpacing: "1px" }}
                >
                  Practice
                </p>
                <p className="text-[14px] font-semibold text-[var(--navy-dark)] tracking-[-0.1px]">
                  Try this in the Playground
                </p>
                <p className="text-[12px] text-gray-500 leading-[1.5]">
                  Run the query above against the sample tables and inspect the result set.
                </p>
              </div>
              <Link
                href={playgroundHref}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-white border border-gray-200 text-[12px] font-semibold text-[var(--navy-dark)] hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                Open Playground
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        .lesson-body .wmde-markdown,
        .lesson-body .w-md-editor-preview,
        .lesson-body .wmde-markdown-color {
          background: transparent !important;
          color: var(--navy-dark) !important;
          font-family: var(--font-geist-sans), Geist, Arial, sans-serif;
          font-size: 15px;
          line-height: 1.7;
        }
        .lesson-body h1,
        .lesson-body h2,
        .lesson-body h3 {
          color: var(--navy-dark) !important;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-size: 14px !important;
          margin-top: 28px;
          margin-bottom: 16px;
          border: 0 !important;
          padding: 0 !important;
        }
        .lesson-body p {
          color: #4b5563;
          margin: 0 0 14px;
        }
        .lesson-body strong {
          color: var(--navy-dark);
        }
        .lesson-body code {
          background: #f3f4f6 !important;
          color: var(--navy-dark) !important;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          font-family: var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace !important;
        }
        .lesson-body pre {
          background: var(--navy-dark) !important;
          border-radius: 12px !important;
          padding: 16px 20px !important;
          margin: 16px 0 !important;
        }
        .lesson-body pre code {
          background: transparent !important;
          color: #30c888 !important;
          padding: 0 !important;
          font-size: 14px !important;
          font-weight: 500;
        }
        .lesson-body pre .token.keyword {
          color: #f87171 !important;
        }
        .lesson-body pre .token.string,
        .lesson-body pre .token.number,
        .lesson-body pre .token.boolean,
        .lesson-body pre .token.operator {
          color: #93c5fd !important;
        }
        .lesson-body pre .token.comment {
          color: #94a3b8 !important;
          font-style: italic;
        }
        .lesson-body pre .token.function {
          color: #fbbf24 !important;
        }
        .lesson-body ul,
        .lesson-body ol {
          color: #4b5563;
          padding-left: 20px;
          margin: 0 0 14px;
        }
        .lesson-body li {
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
}

function Sidebar({
  moduleTitle,
  moduleOrder,
  lessonTitle,
  siblings,
  currentId,
  moduleProgress,
}) {
  return (
    <aside className="w-[320px] bg-white border-r border-gray-200 px-6 py-6 flex flex-col gap-6 self-start sticky top-[69px] min-h-[calc(100vh-69px)]">
      <Link
        href="/lessons"
        className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-[var(--navy-dark)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to lessons
      </Link>

      {moduleTitle && (
        <p
          className="text-[12px] font-bold text-gray-400 uppercase"
          style={{ letterSpacing: "0.5px" }}
        >
          Module {moduleOrder ?? 1} · {moduleTitle}
        </p>
      )}

      <h2 className="text-[18px] font-bold text-[var(--navy-dark)] -mt-3">
        {lessonTitle}
      </h2>

      <div className="h-px bg-gray-200" />

      <nav className="flex flex-col gap-1">
        {siblings.length === 0 && (
          <p className="text-[12px] text-gray-400">
            This lesson is not part of a module.
          </p>
        )}
        {siblings.map((s) => {
          const status = moduleProgress[s.id] ?? "NOT_STARTED";
          const isCurrent = s.id === currentId;
          return (
            <SidebarItem
              key={s.id}
              href={`/lessons/${s.id}`}
              title={s.title}
              isCurrent={isCurrent}
              status={status}
            />
          );
        })}
      </nav>
    </aside>
  );
}

function SidebarItem({ href, title, isCurrent, status }) {
  const completed = status === "COMPLETED";

  if (isCurrent) {
    return (
      <Link
        href={href}
        className="flex items-center gap-2.5 px-3 py-2.5 bg-[#f0fdf4] text-[var(--accent-green)] rounded-r-lg"
        style={{
          borderLeft: "3px solid var(--accent-green)",
          paddingLeft: "9px",
        }}
      >
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-[var(--accent-green)]">
          <span className="block h-[10px] w-[10px] rounded-full bg-[var(--accent-green)]" />
        </span>
        <span className="text-[13px] font-bold text-[#15934d] truncate">
          {title}
        </span>
      </Link>
    );
  }

  if (completed) {
    return (
      <Link
        href={href}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-white border-[1.5px] border-[var(--accent-green)]">
          <Check className="h-[11px] w-[11px] text-[var(--accent-green)]" strokeWidth={3} />
        </span>
        <span className="text-[13px] font-medium text-gray-500 truncate">
          {title}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-gray-300" />
      <span className="text-[13px] font-medium text-gray-500 truncate">
        {title}
      </span>
    </Link>
  );
}

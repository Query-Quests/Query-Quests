"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Eye,
  Code2,
} from "lucide-react";

const MarkdownPreview = dynamic(
  () => import("@uiw/react-md-editor").then((m) => m.default.Markdown),
  { ssr: false }
);

const MONO = { fontFamily: "var(--font-geist-mono), monospace" };

export default function AdminLessonEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [user, setUser] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [order, setOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [bodyTab, setBodyTab] = useState("markdown");

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/lessons/${id}`, { credentials: "include" }).then((r) => r.json()),
      fetch("/api/modules?all=true", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([l, mlist]) => {
        setLesson(l);
        setModules(mlist?.modules ?? []);
        if (!l?.error) {
          setTitle(l.title ?? "");
          setDescription(l.description ?? "");
          setContent(l.content ?? "");
          setModuleId(l.module_id ?? "");
          setOrder(l.order ?? 0);
          setIsPublished(!!l.isPublished);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    if (!user?.id) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/lessons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled lesson",
          content,
          description: description.trim() || null,
          order: Number(order) || 0,
          isPublished,
          updater_id: user.id,
          module_id: moduleId || null,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const fresh = await fetch(`/api/lessons/${id}`, { credentials: "include" }).then(
        (rr) => rr.json()
      );
      setLesson(fresh);
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#19aa59]" />
      </div>
    );
  }

  if (!lesson || lesson.error) {
    return (
      <div className="rounded-xl bg-white border border-gray-200 py-16 px-6 text-center">
        <p className="text-sm text-gray-700">Lesson not found.</p>
        <Link
          href="/admin/modules"
          className="inline-block mt-3 text-sm font-semibold text-[#19aa59] hover:underline"
        >
          ← Back to modules
        </Link>
      </div>
    );
  }

  const moduleHref = lesson.module?.id
    ? `/admin/modules/edit/${lesson.module.id}`
    : "/admin/modules";
  const moduleLabel = lesson.module?.title ?? "Modules";

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <Link
        href={moduleHref}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-[#030914] self-start"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to module · {moduleLabel}
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-bold text-[#030914] tracking-[-1px]">
            Edit · {title || "Untitled lesson"}
          </h1>
          <span
            className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
              isPublished
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {isPublished ? "Published" : "Draft"}
          </span>
        </div>
        <Button
          onClick={save}
          disabled={saving}
          className="bg-[#19aa59] hover:bg-[#15934d] text-white text-sm font-semibold px-4 py-2.5 h-auto rounded-lg gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="flex flex-col gap-6">
          <section className="rounded-xl bg-white border border-gray-200 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#19aa59]" />
              <h2 className="text-sm font-bold text-[#030914]">Lesson details</h2>
            </div>
            <Field label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/20"
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/20 resize-y"
              />
            </Field>

            <Field label="Body markdown">
              <div className="rounded-lg border border-gray-300 overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-200 bg-[#f9f9f9] px-2 py-1.5">
                  <div className="flex items-center gap-1">
                    <TabButton
                      active={bodyTab === "markdown"}
                      onClick={() => setBodyTab("markdown")}
                      icon={Code2}
                      label="Markdown"
                    />
                    <TabButton
                      active={bodyTab === "preview"}
                      onClick={() => setBodyTab("preview")}
                      icon={Eye}
                      label="Preview"
                    />
                  </div>
                </div>

                {bodyTab === "markdown" ? (
                  <div className="bg-[#0f1e35]">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      spellCheck={false}
                      className="block w-full min-h-[480px] bg-transparent text-[13px] text-slate-200 px-5 py-4 outline-none resize-y placeholder-slate-500"
                      style={MONO}
                      placeholder="Write your lesson in markdown…"
                    />
                  </div>
                ) : (
                  <div
                    className="lesson-body bg-white min-h-[480px] px-6 py-5 overflow-y-auto"
                    data-color-mode="light"
                  >
                    <MarkdownPreview source={content || "*Nothing to preview yet.*"} />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-500">
                Markdown supported · use <code className="px-1 py-0.5 bg-gray-100 rounded">**bold**</code>,{" "}
                <code className="px-1 py-0.5 bg-gray-100 rounded">## headings</code>,{" "}
                <code className="px-1 py-0.5 bg-gray-100 rounded">```sql</code> code blocks.
              </p>
            </Field>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-xl bg-white border border-gray-200 p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#030914]">Status</h3>
            <Toggle
              label="Published"
              description="Lesson appears in the public lessons list"
              checked={isPublished}
              onChange={setIsPublished}
            />
          </section>

          <section className="rounded-xl bg-white border border-gray-200 p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#030914]">Lesson settings</h3>
            <Field label="Module">
              <select
                value={moduleId || ""}
                onChange={(e) => setModuleId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-[#19aa59]"
              >
                <option value="">— No module —</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Order">
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-[#19aa59]"
                style={MONO}
              />
            </Field>
          </section>
        </div>
      </div>

      <style jsx global>{`
        .lesson-body .wmde-markdown {
          background: transparent !important;
          font-family: var(--font-geist-sans), Geist, Arial, sans-serif !important;
          font-size: 13px;
        }
        .lesson-body h1,
        .lesson-body h2,
        .lesson-body h3 {
          color: #030914 !important;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-size: 12px !important;
          margin-top: 16px;
          margin-bottom: 8px;
          border: 0 !important;
        }
        .lesson-body p {
          color: #4b5563;
          margin: 0 0 10px;
        }
        .lesson-body code {
          background: #f3f4f6 !important;
          color: #030914 !important;
          padding: 2px 5px;
          border-radius: 3px;
          font-size: 12px;
        }
        .lesson-body pre {
          background: #030914 !important;
          border-radius: 8px !important;
          padding: 12px 14px !important;
          margin: 10px 0 !important;
        }
        .lesson-body pre code {
          background: transparent !important;
          color: #30c888 !important;
          font-size: 12px !important;
        }
      `}</style>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
        active
          ? "bg-white text-[#030914] shadow-sm border border-gray-200"
          : "text-gray-500 hover:text-[#030914] hover:bg-white/60"
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[#030914]">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <p className="text-[13px] font-semibold text-[#030914]">{label}</p>
        {description && (
          <p className="text-[11px] text-gray-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`flex-shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-[#19aa59]" : "bg-gray-300"
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

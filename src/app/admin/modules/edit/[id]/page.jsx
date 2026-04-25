"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
  ListOrdered,
  FileText,
} from "lucide-react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

const MONO = { fontFamily: "var(--font-geist-mono), monospace" };

export default function AdminModuleEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [user, setUser] = useState(null);
  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingLesson, setCreatingLesson] = useState(false);

  // form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);

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
    fetchModule();
  }, [id]);

  async function fetchModule() {
    setLoading(true);
    try {
      const r = await fetch(`/api/modules/${id}`, { credentials: "include" });
      if (!r.ok) throw new Error("not found");
      const data = await r.json();
      setM(data);
      setTitle(data.title);
      setDescription(data.description ?? "");
      setOrder(data.order ?? 0);
      setIsPublished(!!data.isPublished);
    } catch {
      setM(null);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!user?.id) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/modules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled module",
          description: description.trim() || null,
          order: Number(order) || 0,
          isPublished,
          updater_id: user.id,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      await fetchModule();
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function addLesson() {
    if (!user?.id || !m) return;
    setCreatingLesson(true);
    try {
      const r = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled lesson",
          content: "Write your lesson content here. Markdown is supported.",
          description: null,
          order: m.lessons.length + 1,
          isPublished: false,
          creator_id: user.id,
          module_id: id,
        }),
      });
      if (!r.ok) throw new Error("create failed");
      const created = await r.json();
      router.push(`/admin/lessons/edit/${created.id}`);
    } catch (e) {
      alert("Could not add lesson: " + e.message);
    } finally {
      setCreatingLesson(false);
    }
  }

  async function deleteLesson(lessonId, lessonTitle) {
    if (!confirm(`Delete lesson "${lessonTitle}"?`)) return;
    try {
      const r = await fetch(`/api/lessons/${lessonId}?deleter_id=${user.id}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error("delete failed");
      await fetchModule();
    } catch (e) {
      alert("Could not delete: " + e.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#19aa59]" />
      </div>
    );
  }

  if (!m) {
    return (
      <div className="rounded-xl bg-white border border-gray-200 py-16 px-6 text-center">
        <p className="text-sm text-gray-700">Module not found.</p>
        <Link
          href="/admin/modules"
          className="inline-block mt-3 text-sm font-semibold text-[#19aa59] hover:underline"
        >
          ← Back to modules
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <Link
        href="/admin/modules"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-[#030914] self-start"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to modules
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-bold text-[#030914] tracking-[-1px]">
            Edit module
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
              <h2 className="text-sm font-bold text-[#030914]">Module details</h2>
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
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/20 resize-y"
              />
            </Field>
          </section>

          <section className="rounded-xl bg-white border border-gray-200 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-[#19aa59]" />
                <h2 className="text-sm font-bold text-[#030914]">
                  Lessons in this module
                </h2>
              </div>
              <Button
                onClick={addLesson}
                disabled={creatingLesson}
                size="sm"
                className="bg-[#19aa59] hover:bg-[#15934d] text-white text-xs font-semibold gap-1.5 h-8"
              >
                {creatingLesson ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                Add lesson
              </Button>
            </div>

            {m.lessons.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">
                No lessons yet. Click <strong>Add lesson</strong> to create the first one.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {m.lessons.map((l, i) => (
                  <li
                    key={l.id}
                    className="flex items-center gap-3 px-3.5 py-3 bg-[#f9f9f9] border border-gray-200 rounded-lg"
                  >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-gray-200 text-[11px] font-semibold text-[#030914]"
                      style={MONO}
                    >
                      {pad2(i + 1)}
                    </span>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#030914] truncate">
                        {l.title}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {l.description || "No description"}
                      </p>
                    </div>
                    {!l.isPublished && (
                      <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        Draft
                      </span>
                    )}
                    <Link
                      href={`/admin/lessons/edit/${l.id}`}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
                      aria-label="Edit lesson"
                    >
                      <Pencil className="h-3 w-3 text-gray-600" />
                    </Link>
                    <button
                      onClick={() => deleteLesson(l.id, l.title)}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-gray-200 bg-white hover:bg-red-50"
                      aria-label="Delete lesson"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-xl bg-white border border-gray-200 p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#030914]">Status</h3>
            <Toggle
              label="Publish immediately"
              description="Make module and its lessons visible to students"
              checked={isPublished}
              onChange={setIsPublished}
            />
          </section>
          <section className="rounded-xl bg-white border border-gray-200 p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#030914]">Module settings</h3>
            <Field label="Order">
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/20"
                style={MONO}
              />
            </Field>
          </section>
        </div>
      </div>
    </div>
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

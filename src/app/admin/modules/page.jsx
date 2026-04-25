"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Plus,
  BookOpen,
  Pencil,
  Trash2,
  ArrowRight,
  Loader2,
  Search,
} from "lucide-react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

export default function AdminModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {}
    }
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const r = await fetch("/api/modules?all=true", { credentials: "include" });
      const data = await r.json();
      setModules(data?.modules ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function createModule() {
    if (!user?.id) return;
    setCreating(true);
    try {
      const r = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled module",
          description: null,
          order: modules.length + 1,
          isPublished: false,
          creator_id: user.id,
        }),
      });
      if (!r.ok) throw new Error("create failed");
      const created = await r.json();
      router.push(`/admin/modules/edit/${created.id}`);
    } catch (e) {
      alert("Could not create module: " + e.message);
    } finally {
      setCreating(false);
    }
  }

  async function deleteModule(id, title) {
    if (!confirm(`Delete module "${title}"? Its lessons will lose their module assignment but will not be deleted.`)) return;
    setDeletingId(id);
    try {
      const r = await fetch(`/api/modules/${id}?deleter_id=${user.id}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error("delete failed");
      await fetchAll();
    } catch (e) {
      alert("Could not delete: " + e.message);
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return modules;
    return modules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.description ?? "").toLowerCase().includes(q)
    );
  }, [modules, search]);

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#030914] tracking-[-1px]">
            Modules
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {modules.length} {modules.length === 1 ? "module" : "modules"} ·{" "}
            {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
          </p>
        </div>
        <Button
          onClick={createModule}
          disabled={creating || !user}
          className="bg-[#19aa59] hover:bg-[#15934d] text-white text-sm font-semibold px-4 py-2.5 h-auto rounded-lg gap-2"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New module
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search modules…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 h-10 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/20"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#19aa59]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 py-16 px-6 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <BookOpen className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-[#030914] mb-1">
            {search ? "No matches" : "No modules yet"}
          </p>
          <p className="text-xs text-gray-500">
            {search ? "Try a different search term." : "Click 'New module' to add your first one."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((m) => (
            <ModuleAdminCard
              key={m.id}
              module={m}
              onDelete={() => deleteModule(m.id, m.title)}
              deleting={deletingId === m.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleAdminCard({ module: m, onDelete, deleting }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className="text-[10px] font-bold text-gray-500 uppercase"
              style={{ letterSpacing: "1.2px" }}
            >
              Module {pad2(m.order)}
            </p>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                m.isPublished
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {m.isPublished ? "Published" : "Draft"}
            </span>
          </div>
          <h3 className="text-[18px] font-bold text-[#030914] tracking-[-0.3px] leading-tight">
            {m.title}
          </h3>
          {m.description && (
            <p className="text-[13px] text-gray-500 leading-[1.5] line-clamp-2">
              {m.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/admin/modules/edit/${m.id}`}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50"
            aria-label="Edit module"
          >
            <Pencil className="h-3.5 w-3.5 text-gray-600" />
          </Link>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-red-50 disabled:opacity-50"
            aria-label="Delete module"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
            ) : (
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <BookOpen className="h-3.5 w-3.5" />
        {m.lessons.length} {m.lessons.length === 1 ? "lesson" : "lessons"}
      </div>

      {m.lessons.length > 0 && (
        <ul className="flex flex-col gap-1">
          {m.lessons.slice(0, 5).map((l, i) => (
            <li key={l.id}>
              <Link
                href={`/admin/lessons/edit/${l.id}`}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 group"
              >
                <span
                  className="text-[10px] font-bold text-gray-400 w-6"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {pad2(i + 1)}
                </span>
                <span className="text-[12px] text-gray-700 truncate flex-1">
                  {l.title}
                </span>
                {!l.isPublished && (
                  <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    Draft
                  </span>
                )}
              </Link>
            </li>
          ))}
          {m.lessons.length > 5 && (
            <li className="text-[11px] text-gray-400 px-2 py-1">
              + {m.lessons.length - 5} more
            </li>
          )}
        </ul>
      )}

      <Link
        href={`/admin/modules/edit/${m.id}`}
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#19aa59] hover:underline self-start mt-1"
      >
        Manage lessons
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  FileText,
  Code,
  CircleCheck,
  Lightbulb,
  Play,
  Plus,
  X,
  Hash,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

const MONO = { fontFamily: "var(--font-geist-mono), monospace" };

export default function CreateChallenge() {
  const router = useRouter();
  const { user } = useUserRole();

  const [institutions, setInstitutions] = useState([]);
  const [databases, setDatabases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    statement: "",
    help: "",
    solution: "",
    level: "1",
    initial_score: "100",
    institution_id: "",
    database_id: "",
    expectedResult: "",
    requiredKeywords: "",
  });
  const [errors, setErrors] = useState({});
  const [tagDraft, setTagDraft] = useState("");

  useEffect(() => {
    fetch("/api/institutions")
      .then((r) => (r.ok ? r.json() : []))
      .then(setInstitutions)
      .catch(() => {});
    fetch("/api/databases?status=ready&limit=100")
      .then((r) => (r.ok ? r.json() : { databases: [] }))
      .then((d) => setDatabases(d.databases || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user && user.isTeacher && !user.isAdmin && user.institution_id) {
      setFormData((p) => ({
        ...p,
        institution_id: user.institution_id.toString(),
      }));
    }
  }, [user]);

  function update(field, value) {
    setFormData((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  const tags = formData.requiredKeywords
    ? formData.requiredKeywords
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  function addTag() {
    const t = tagDraft.trim();
    if (!t) return;
    const next = [...tags, t];
    update("requiredKeywords", next.join(", "));
    setTagDraft("");
  }

  function removeTag(idx) {
    const next = tags.filter((_, i) => i !== idx);
    update("requiredKeywords", next.join(", "));
  }

  async function previewSolution() {
    if (!formData.solution.trim()) {
      toast.error("Please enter a solution query first");
      return;
    }
    if (!formData.database_id || formData.database_id === "none") {
      toast.error("Please select a database first");
      return;
    }
    setIsPreviewing(true);
    setPreviewResult(null);
    try {
      const raw = localStorage.getItem("user");
      const currentUser = raw ? JSON.parse(raw) : null;
      const r = await fetch("/api/challenges/new/preview-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: formData.solution,
          user_id: currentUser?.id,
          database_id: formData.database_id,
        }),
      });
      const result = await r.json();
      if (r.ok) {
        setPreviewResult(result);
        update("expectedResult", result.resultJson);
        toast.success(`Query returned ${result.rowCount} rows`);
      } else {
        toast.error(result.error || "Failed to preview query");
        setPreviewResult({ error: result.error });
      }
    } catch (e) {
      toast.error("Error executing query");
    } finally {
      setIsPreviewing(false);
    }
  }

  function validate() {
    const next = {};
    if (!formData.name.trim()) next.name = "Challenge name is required";
    if (!formData.statement.trim())
      next.statement = "Challenge statement is required";
    if (!formData.solution.trim()) next.solution = "Solution is required";
    if (!formData.initial_score || parseInt(formData.initial_score) < 1)
      next.initial_score = "Initial score must be at least 1";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e) {
    e?.preventDefault?.();
    if (!validate()) {
      toast.error("Please fill in all required fields");
      return;
    }
    const raw = localStorage.getItem("user");
    if (!raw) {
      toast.error("User not authenticated");
      return;
    }
    let currentUser;
    try {
      currentUser = JSON.parse(raw);
    } catch {
      toast.error("Invalid user session");
      return;
    }
    setIsLoading(true);
    try {
      const r = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          level: parseInt(formData.level),
          initial_score: parseInt(formData.initial_score),
          institution_id:
            !formData.institution_id || formData.institution_id === "none"
              ? null
              : formData.institution_id,
          database_id:
            !formData.database_id || formData.database_id === "none"
              ? null
              : formData.database_id,
          creator_id: currentUser.id,
        }),
      });
      if (r.ok) {
        toast.success("Challenge created successfully!");
        router.push("/admin/challenges");
      } else {
        const err = await r.json();
        toast.error(err.error || "Failed to create challenge");
      }
    } catch (e) {
      toast.error("Error creating challenge. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const canPreview =
    !!formData.solution.trim() &&
    !!formData.database_id &&
    formData.database_id !== "none";

  return (
    <form onSubmit={submit} className="flex flex-col gap-6 max-w-[1280px]">
      <Link
        href="/admin/challenges"
        className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-[#030914] self-start"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to challenges
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] font-bold text-[#030914] tracking-[-1px] leading-tight">
              Create a new challenge
            </h1>
            <p className="text-sm text-gray-500">
              Design a new SQL problem with test cases and scoring
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[1px] px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            Draft
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push("/admin/challenges")}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-white border border-gray-200 text-[13px] font-semibold text-[#030914] hover:bg-gray-50"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-white border border-gray-200 text-[13px] font-semibold text-[#030914] hover:bg-gray-50 disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            Save as draft
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#19aa59] hover:bg-[#15934d] text-white text-[13px] font-bold disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left column */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 flex flex-col gap-5">
          {/* Challenge details */}
          <Section icon={<FileText className="h-4 w-4 text-[#19aa59]" />} title="Challenge details">
            <Field label="Name" required error={errors.name}>
              <input
                value={formData.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g., Window Functions — Running totals"
                className={inputCls(errors.name)}
              />
            </Field>
            <Field label="Problem statement" required error={errors.statement}>
              <textarea
                rows={5}
                value={formData.statement}
                onChange={(e) => update("statement", e.target.value)}
                placeholder="Write a query using SUM() OVER that returns the running total of daily orders…"
                className={`${inputCls(errors.statement)} resize-y min-h-[110px]`}
              />
              <p className="text-[11px] text-gray-500 mt-1.5">
                Markdown supported — use ** for bold and ` for inline code.
              </p>
            </Field>
          </Section>

          <Divider />

          {/* Expected solution */}
          <Section icon={<CircleCheck className="h-4 w-4 text-[#19aa59]" />} title="Expected solution" required={!!errors.solution}>
            <textarea
              rows={6}
              value={formData.solution}
              onChange={(e) => update("solution", e.target.value)}
              placeholder={"SELECT order_date,\n       SUM(total) OVER (ORDER BY order_date) AS running_total\nFROM orders;"}
              spellCheck={false}
              style={MONO}
              className={`w-full px-4 py-3.5 text-[12.5px] leading-[1.55] rounded-lg bg-[#030914] text-[#7ee2a8] border ${
                errors.solution ? "border-red-500" : "border-[#030914]"
              } focus:outline-none focus:ring-2 focus:ring-[#19aa59]/40 placeholder:text-[#7ee2a8]/30 resize-y min-h-[150px]`}
            />
            {errors.solution && (
              <p className="text-[12px] text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.solution}
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-gray-500">
                Run your solution against the selected database to capture the expected result.
              </p>
              <button
                type="button"
                onClick={previewSolution}
                disabled={isPreviewing || !canPreview}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white border border-gray-300 text-[13px] font-medium text-[#030914] hover:bg-gray-50 disabled:opacity-50"
              >
                {isPreviewing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Validate solution
              </button>
            </div>

            {previewResult?.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>{previewResult.error}</span>
              </div>
            )}
            {previewResult && !previewResult.error && (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 bg-[#f9f9f9] border-b border-gray-200 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-[#030914]">
                    Query result ({previewResult.rowCount} rows)
                  </span>
                  <span className="text-gray-500" style={MONO}>
                    {previewResult.executionTimeMs}ms
                  </span>
                </div>
                {previewResult.rows && previewResult.rows.length > 0 ? (
                  <div className="max-h-[260px] overflow-auto">
                    <table className="w-full text-[12px]">
                      <thead className="bg-[#f9f9f9] sticky top-0">
                        <tr>
                          {Object.keys(previewResult.rows[0]).map((c) => (
                            <th
                              key={c}
                              className="text-left px-3 py-2 font-semibold text-[#030914] whitespace-nowrap border-b border-gray-200"
                            >
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewResult.rows.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            {Object.values(row).map((v, j) => (
                              <td
                                key={j}
                                className="px-3 py-2 whitespace-nowrap text-gray-700"
                                style={MONO}
                              >
                                {v === null ? (
                                  <span className="text-gray-400 italic">NULL</span>
                                ) : (
                                  String(v)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="px-3 py-4 text-[12px] text-gray-500 text-center">
                    No results
                  </p>
                )}
              </div>
            )}
          </Section>

          <Divider />

          {/* Hints */}
          <Section icon={<Lightbulb className="h-4 w-4 text-[#19aa59]" />} title="Hints & solution steps">
            <textarea
              rows={4}
              value={formData.help}
              onChange={(e) => update("help", e.target.value)}
              placeholder={"Use SUM() as a window function with OVER (...) two-level output.\nOrder the window by order_date so the total accumulates chronologically."}
              className={`${inputCls()} resize-y min-h-[100px]`}
            />
            <p className="text-[11px] text-gray-500">
              Optional. Shown to students as guidance when they request help.
            </p>
          </Section>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Status */}
          <SideCard>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#030914]">Status</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[10px] font-bold uppercase tracking-[1px] text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-[#19aa59]" />
                Draft
              </span>
            </div>
          </SideCard>

          {/* Challenge settings */}
          <SideCard>
            <h3 className="text-sm font-bold text-[#030914]">Challenge settings</h3>
            <Field label="Difficulty">
              <select
                value={formData.level}
                onChange={(e) => update("level", e.target.value)}
                className={selectCls()}
              >
                <option value="1">Level 1 — Beginner</option>
                <option value="2">Level 2 — Easy</option>
                <option value="3">Level 3 — Medium</option>
                <option value="4">Level 4 — Hard</option>
                <option value="5">Level 5 — Expert</option>
              </select>
            </Field>
            <Field label="Database">
              <select
                value={formData.database_id}
                onChange={(e) => update("database_id", e.target.value)}
                className={selectCls()}
              >
                <option value="">Select a database</option>
                <option value="none">No database (legacy mode)</option>
                {databases.map((db) => (
                  <option key={db.id} value={db.id}>
                    {db.name} ({db.tableCount} tables)
                  </option>
                ))}
              </select>
            </Field>
            {!(user?.isTeacher && !user?.isAdmin && user?.institution_id) && (
              <Field label="Institution">
                <select
                  value={formData.institution_id}
                  onChange={(e) => update("institution_id", e.target.value)}
                  className={selectCls()}
                >
                  <option value="">Platform-wide</option>
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id.toString()}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </SideCard>

          {/* Scoring */}
          <SideCard>
            <h3 className="text-sm font-bold text-[#030914]">Scoring</h3>
            <Field label="Base score" required error={errors.initial_score}>
              <input
                type="number"
                min="1"
                value={formData.initial_score}
                onChange={(e) => update("initial_score", e.target.value)}
                style={MONO}
                className={inputCls(errors.initial_score)}
              />
            </Field>
            <div className="flex items-start gap-2 rounded-md bg-[#f9f9f9] px-2.5 py-2">
              <Info className="h-3.5 w-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-gray-500 leading-snug">
                Students earn the base score on success. Difficulty level affects ranking and filtering.
              </p>
            </div>
          </SideCard>

          {/* Tags */}
          <SideCard>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#030914]">Required keywords</h3>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((t, i) => (
                  <span
                    key={`${t}-${i}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-[12px] font-medium text-[#030914]"
                  >
                    {t.toUpperCase()}
                    <button
                      type="button"
                      onClick={() => removeTag(i)}
                      className="text-gray-400 hover:text-[#030914]"
                      aria-label="Remove tag"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200">
              <Hash className="h-3.5 w-3.5 text-gray-400" />
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Type to add..."
                className="flex-1 bg-transparent text-[13px] text-[#030914] placeholder:text-gray-400 focus:outline-none"
              />
              {tagDraft && (
                <button
                  type="button"
                  onClick={addTag}
                  className="text-[#19aa59] hover:text-[#15934d]"
                  aria-label="Add tag"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-500">
              Comma-separated keywords required in the student's query.
            </p>
          </SideCard>
        </div>
      </div>
    </form>
  );
}

function inputCls(error) {
  return `w-full px-4 py-3 text-sm border rounded-lg bg-white text-[#030914] focus:outline-none focus:ring-2 focus:ring-[#19aa59]/20 ${
    error
      ? "border-red-500 focus:border-red-500"
      : "border-gray-300 focus:border-[#19aa59]"
  }`;
}

function selectCls() {
  return "w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-lg bg-white text-[#030914] focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/20";
}

function Section({ icon, title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-bold text-[#030914]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Divider() {
  return <div className="h-px bg-gray-200" />;
}

function Field({ label, required, error, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[#030914]">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
      {error && (
        <span className="text-[12px] text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </span>
      )}
    </label>
  );
}

function SideCard({ children }) {
  return (
    <section className="rounded-xl bg-white border border-gray-200 p-5 flex flex-col gap-3.5">
      {children}
    </section>
  );
}

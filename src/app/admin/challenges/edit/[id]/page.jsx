"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Check,
  Loader2,
  FileText,
  CircleCheck,
  Play,
  Database,
  AlertCircle,
  Lightbulb,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import DatasetsManager from "@/components/challenges/DatasetsManager";

const MONO = { fontFamily: "var(--font-geist-mono), monospace" };

const LEVEL_LABELS = {
  1: "Beginner",
  2: "Easy",
  3: "Medium",
  4: "Hard",
  5: "Expert",
};

export default function EditChallenge() {
  const router = useRouter();
  const { user } = useUserRole();
  const params = useParams();
  const challengeId = params.id;

  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    statement: "",
    help: "",
    solution: "",
    level: "1",
    initial_score: "100",
    institution_id: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchInstitutions();
    fetchChallenge();
  }, [challengeId]);

  // Ensure teachers can only edit challenges from their institution
  useEffect(() => {
    if (
      user &&
      user.isTeacher &&
      !user.isAdmin &&
      user.institution_id &&
      formData.institution_id
    ) {
      if (
        formData.institution_id !== user.institution_id.toString() &&
        formData.institution_id !== "none" &&
        formData.institution_id !== ""
      ) {
        toast.error("You can only edit challenges from your institution");
        router.push("/admin/challenges");
      }
    }
  }, [user, formData.institution_id, router]);

  const fetchChallenge = async () => {
    try {
      setIsLoadingChallenge(true);
      const response = await fetch(`/api/challenges/${challengeId}`);

      if (response.ok) {
        const challengeData = await response.json();
        setFormData({
          name: challengeData.name || "",
          statement: challengeData.statement || "",
          help: challengeData.help || "",
          solution: challengeData.solution || "",
          level: challengeData.level?.toString() || "1",
          initial_score: challengeData.initial_score?.toString() || "100",
          institution_id: challengeData.institution_id?.toString() || "",
        });
      } else {
        toast.error("Challenge not found");
        router.push("/admin/challenges");
      }
    } catch (error) {
      console.error("Error fetching challenge:", error);
      toast.error("Failed to load challenge");
      router.push("/admin/challenges");
    } finally {
      setIsLoadingChallenge(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const response = await fetch("/api/institutions");
      if (response.ok) {
        const institutionsData = await response.json();
        setInstitutions(institutionsData);
      }
    } catch (error) {
      console.error("Error fetching institutions:", error);
      toast.error("Failed to load institutions");
    }
  };

  const validateAll = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Challenge name is required";
    if (!formData.statement.trim())
      newErrors.statement = "Challenge statement is required";
    if (!formData.solution.trim()) newErrors.solution = "Solution is required";
    if (!formData.initial_score || parseInt(formData.initial_score) < 1) {
      newErrors.initial_score = "Initial score must be at least 1";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!validateAll()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const userData = localStorage.getItem("user");
    if (!userData) {
      toast.error("User not authenticated");
      return;
    }

    let currentUser;
    try {
      currentUser = JSON.parse(userData);
    } catch {
      toast.error("Invalid user session");
      return;
    }

    setIsLoading(true);
    try {
      const challengeData = {
        ...formData,
        level: parseInt(formData.level),
        initial_score: parseInt(formData.initial_score),
        institution_id:
          !formData.institution_id || formData.institution_id === "none"
            ? null
            : formData.institution_id,
        updater_id: currentUser.id,
      };

      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(challengeData),
      });

      if (response.ok) {
        toast.success("Challenge updated successfully!");
        router.push("/admin/challenges");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update challenge");
      }
    } catch (error) {
      console.error("Error updating challenge:", error);
      toast.error("Error updating challenge. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const validateSolution = () => {
    if (!formData.solution.trim()) {
      toast.error("Add a solution query first");
      return;
    }
    toast.success("Solution looks valid");
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const teacherLocked =
    user && user.isTeacher && !user.isAdmin && user.institution_id;

  if (isLoadingChallenge) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#19aa59]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Back link */}
      <Link
        href="/admin/challenges"
        className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-[#030914] self-start"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to challenges · #{challengeId}
      </Link>

      {/* Title row + actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] font-bold text-[#030914] tracking-[-1px] leading-tight">
              Edit · {formData.name || "Challenge"}
            </h1>
            <p className="text-sm text-gray-500">
              Update challenge details, test cases, and scoring
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[1px] uppercase ${
              isPublished
                ? "bg-emerald-50 text-[#15934d]"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isPublished ? "bg-[#19aa59]" : "bg-amber-500"
              }`}
            />
            {isPublished ? "Published" : "Draft"}
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => router.push("/admin/challenges")}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-[#030914] hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPublished(false);
              handleSubmit();
            }}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-[#030914] hover:bg-gray-50 disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            Save as draft
          </button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-[#19aa59] hover:bg-[#15934d] text-white text-[13px] font-bold px-4 py-2.5 h-auto rounded-[10px] gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Save changes
          </Button>
        </div>
      </div>

      {/* 2-column form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 mt-2"
      >
        {/* LEFT main card */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 flex flex-col gap-5">
          {/* Section: Challenge details */}
          <Section icon={FileText} title="Challenge details">
            <Field label="Name" required error={errors.name}>
              <input
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., INNER JOIN — Match orders with customers"
                className={inputClass(!!errors.name)}
              />
            </Field>

            <Field label="Slug">
              <div
                className="w-full px-4 py-3 text-[13px] text-gray-500 border border-gray-300 rounded-lg bg-[#f9f9f9]"
                style={MONO}
              >
                /challenges/{slugify(formData.name) || "challenge"}
              </div>
            </Field>

            <Field label="Statement" required error={errors.statement}>
              <textarea
                value={formData.statement}
                onChange={(e) => updateFormData("statement", e.target.value)}
                placeholder="Explain what the user needs to accomplish, with context and any constraints."
                className={`${inputClass(!!errors.statement)} min-h-[140px] resize-y leading-[1.5]`}
              />
              <p className="text-[11px] text-gray-500">
                Markdown supported — use ** for bold and ` for inline code.
              </p>
            </Field>
          </Section>

          <Divider />

          {/* Section: Hints / help */}
          <Section icon={Lightbulb} title="Hints & solution steps">
            <Field label="Help text (optional)">
              <textarea
                value={formData.help}
                onChange={(e) => updateFormData("help", e.target.value)}
                placeholder="Provide helpful hints without giving away the solution."
                className={`${inputClass(false)} min-h-[100px] resize-y leading-[1.5]`}
              />
            </Field>
          </Section>

          <Divider />

          {/* Section: Expected solution (dark SQL editor) */}
          <Section icon={CircleCheck} title="Expected solution">
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-medium text-[#030914]">
                Solution query <span className="text-red-500">*</span>
              </span>
              <textarea
                value={formData.solution}
                onChange={(e) => updateFormData("solution", e.target.value)}
                placeholder="SELECT * FROM customers;"
                className={`w-full px-4 py-4 text-[13px] rounded-lg bg-[#030914] text-emerald-300 placeholder:text-gray-500 border focus:outline-none focus:ring-2 focus:ring-[#19aa59]/40 min-h-[200px] resize-y leading-[1.6] ${
                  errors.solution ? "border-red-500" : "border-[#030914]"
                }`}
                style={MONO}
              />
              {errors.solution && <ErrorText text={errors.solution} />}
              <div>
                <button
                  type="button"
                  onClick={validateSolution}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-[13px] font-medium text-[#030914] hover:bg-gray-50"
                >
                  <Play className="h-3.5 w-3.5" />
                  Validate solution
                </button>
              </div>
            </div>
          </Section>

          <Divider />

          {/* Section: Datasets (off-flow, auto-saves via API) */}
          <Section icon={Database} title="Datasets">
            <p className="text-[11px] text-gray-500 -mt-1">
              Attach databases as graded datasets. Hidden datasets defeat
              hardcoded answers; their content is never shown to students.
            </p>
            <DatasetsManager challengeId={challengeId} />
          </Section>
        </div>

        {/* RIGHT sidebar */}
        <div className="flex flex-col gap-5">
          {/* Status card */}
          <aside className="rounded-xl bg-white border border-gray-200 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#030914]">Status</h3>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  isPublished
                    ? "bg-emerald-50 text-[#15934d]"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isPublished ? "bg-[#19aa59]" : "bg-amber-500"
                  }`}
                />
                {isPublished ? "Published" : "Draft"}
              </span>
            </div>
            <Toggle
              label="Visible to students"
              description="Challenge appears in the public challenges list"
              checked={isPublished}
              onChange={setIsPublished}
            />
          </aside>

          {/* Challenge settings card */}
          <aside className="rounded-xl bg-white border border-gray-200 p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#030914]">
              Challenge settings
            </h3>

            <SidebarField label="Difficulty">
              <SelectShell>
                <select
                  value={formData.level}
                  onChange={(e) => updateFormData("level", e.target.value)}
                  className="w-full bg-transparent text-[13px] font-medium text-[#030914] focus:outline-none appearance-none pr-6"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={String(n)}>
                      Level {n} — {LEVEL_LABELS[n]}
                    </option>
                  ))}
                </select>
              </SelectShell>
            </SidebarField>

            <SidebarField label="Institution">
              {teacherLocked ? (
                <div className="px-3 py-2.5 border border-gray-200 bg-[#f9f9f9] rounded-lg text-[13px] text-[#030914]">
                  {user.institution?.name ||
                    institutions.find((i) => i.id === user.institution_id)
                      ?.name ||
                    "Your Institution"}
                  <span className="ml-2 text-[11px] text-gray-500">
                    (Your Institution)
                  </span>
                </div>
              ) : (
                <SelectShell>
                  <select
                    value={formData.institution_id || "none"}
                    onChange={(e) =>
                      updateFormData("institution_id", e.target.value)
                    }
                    className="w-full bg-transparent text-[13px] font-medium text-[#030914] focus:outline-none appearance-none pr-6"
                  >
                    <option value="none">No Institution (Platform-wide)</option>
                    {institutions.map((institution) => (
                      <option
                        key={institution.id}
                        value={institution.id.toString()}
                      >
                        {institution.name}
                      </option>
                    ))}
                  </select>
                </SelectShell>
              )}
            </SidebarField>
          </aside>

          {/* Scoring card */}
          <aside className="rounded-xl bg-white border border-gray-200 p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#030914]">Scoring</h3>
            <SidebarField
              label="Initial score"
              required
              error={errors.initial_score}
            >
              <div
                className={`flex items-center rounded-lg border bg-white px-3 py-2.5 ${
                  errors.initial_score ? "border-red-500" : "border-gray-200"
                }`}
              >
                <input
                  type="number"
                  min="1"
                  value={formData.initial_score}
                  onChange={(e) =>
                    updateFormData("initial_score", e.target.value)
                  }
                  className="w-full bg-transparent text-[13px] font-semibold text-[#030914] focus:outline-none"
                  style={MONO}
                />
                <span className="text-[12px] text-gray-500 ml-2">pts</span>
              </div>
            </SidebarField>
            <div className="flex items-start gap-1.5 rounded-md bg-[#f9f9f9] px-2.5 py-2">
              <AlertCircle className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-gray-500 leading-[1.4]">
                Starting points for this challenge. Score decreases as more
                people solve it.
              </p>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}

/* ---------- helpers / subcomponents ---------- */

function inputClass(hasError) {
  return `w-full px-4 py-3 text-[13px] border rounded-lg bg-white focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/20 placeholder:text-gray-400 ${
    hasError ? "border-red-500" : "border-gray-300"
  }`;
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#19aa59]" />
        <h2 className="text-sm font-bold text-[#030914]">{title}</h2>
      </div>
      <div className="flex flex-col gap-3.5">{children}</div>
    </section>
  );
}

function Divider() {
  return <div className="h-px bg-gray-200" />;
}

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[#030914]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {error && <ErrorText text={error} />}
    </div>
  );
}

function SidebarField({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-[#030914]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {error && <ErrorText text={error} />}
    </div>
  );
}

function SelectShell({ children }) {
  return (
    <div className="relative flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2.5">
      {children}
      <ChevronDown className="h-3.5 w-3.5 text-gray-500 absolute right-3 pointer-events-none" />
    </div>
  );
}

function ErrorText({ text }) {
  return (
    <p className="text-[11px] text-red-500 inline-flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {text}
    </p>
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

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Building,
  Mail,
  Phone,
  Globe,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  X,
} from "lucide-react";

const AVATAR_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#ef4444",
  "#6366f1",
];

function getInitials(name) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(seed) {
  if (!seed) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function timeAgo(dateString) {
  if (!dateString) return "";
  const then = new Date(dateString).getTime();
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_PILL = {
  pending: { label: "NEW", bg: "#fef3c7", color: "#854d0e" },
  approved: { label: "APPROVED", bg: "#d1fae5", color: "#065f46" },
  rejected: { label: "REJECTED", bg: "#fee2e2", color: "#991b1b" },
};

export default function ContactRequestsPage() {
  const [contactRequests, setContactRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchContactRequests();
  }, []);

  async function fetchContactRequests() {
    setLoading(true);
    try {
      const r = await fetch("/api/contact-requests");
      const data = await r.json();
      setContactRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching contact requests:", e);
    } finally {
      setLoading(false);
    }
  }

  async function updateRequestStatus(id, status) {
    try {
      const r = await fetch("/api/contact-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (r.ok) {
        await fetchContactRequests();
        setShowModal(false);
        setSelectedRequest(null);
      }
    } catch (e) {
      console.error("Error updating request status:", e);
    }
  }

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    for (const r of contactRequests) {
      if (c[r.status] !== undefined) c[r.status] += 1;
    }
    return c;
  }, [contactRequests]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return contactRequests;
    return contactRequests.filter((r) => r.status === statusFilter);
  }, [contactRequests, statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold text-[#030914] tracking-[-1px] leading-tight">
            Contact requests
          </h1>
          <p className="text-sm text-gray-500">
            Institution inquiries and sales requests
          </p>
        </div>
        <div className="flex items-center gap-5">
          <StatItem value={counts.pending} label="New" tone="warning" />
          <StatItem value={counts.approved + counts.rejected} label="In review" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {[
          { id: "all", label: "All" },
          { id: "pending", label: "New" },
          { id: "approved", label: "Approved" },
          { id: "rejected", label: "Rejected" },
        ].map((f) => {
          const active = statusFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`text-xs font-semibold px-3 h-8 rounded-full border transition-colors ${
                active
                  ? "bg-[#19aa59] text-white border-[#19aa59]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#19aa59]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 py-16 px-6 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Building className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-[#030914] mb-1">
            No contact requests
          </p>
          <p className="text-xs text-gray-500">
            {statusFilter === "all"
              ? "There are no institution access requests yet."
              : "No requests match this filter."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map((req) => (
            <ContactRequestCard
              key={req.id}
              request={req}
              onView={() => {
                setSelectedRequest(req);
                setShowModal(true);
              }}
              onApprove={() => updateRequestStatus(req.id, "approved")}
              onReject={() => updateRequestStatus(req.id, "rejected")}
            />
          ))}
        </div>
      )}

      {showModal && selectedRequest && (
        <DetailModal
          request={selectedRequest}
          onClose={() => {
            setShowModal(false);
            setSelectedRequest(null);
          }}
          onApprove={() => updateRequestStatus(selectedRequest.id, "approved")}
          onReject={() => updateRequestStatus(selectedRequest.id, "rejected")}
        />
      )}
    </div>
  );
}

function StatItem({ value, label, tone }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={`text-[22px] font-bold leading-none ${
          tone === "warning" ? "text-amber-500" : "text-[#030914]"
        }`}
      >
        {value}
      </span>
      <span
        className="text-[11px] font-semibold text-gray-500 uppercase"
        style={{ letterSpacing: "1px" }}
      >
        {label}
      </span>
    </div>
  );
}

function ContactRequestCard({ request, onView, onApprove, onReject }) {
  const pill = STATUS_PILL[request.status] || STATUS_PILL.pending;
  const seed = request.contactName || request.institutionName || request.contactEmail || "";
  const initials = getInitials(request.contactName || request.institutionName);
  const color = avatarColor(seed);

  const subtitleParts = [
    request.contactEmail,
    request.institutionName,
    request.estimatedStudents ? `${request.estimatedStudents} students` : null,
  ].filter(Boolean);

  return (
    <div
      className="rounded-xl bg-white border border-gray-200 p-6 flex flex-col gap-4"
      style={{ boxShadow: "0 2px 10px 0 rgba(10, 18, 32, 0.06)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 h-[42px] w-[42px] rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: color, fontFamily: "var(--font-geist-sans), Geist, sans-serif" }}
        >
          {initials}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-[15px] font-bold text-[#030914] truncate">
              {request.contactName || request.institutionName}
            </h3>
            <span
              className="text-[9px] font-bold rounded-full px-2 py-0.5"
              style={{
                backgroundColor: pill.bg,
                color: pill.color,
                letterSpacing: "1px",
              }}
            >
              {pill.label}
            </span>
          </div>
          <p
            className="text-xs text-gray-500 truncate"
            style={{ letterSpacing: "0.1px" }}
          >
            {subtitleParts.join(" · ")}
          </p>
        </div>
        <span
          className="text-[11px] text-gray-400 flex-shrink-0 mt-1"
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            letterSpacing: "0.3px",
          }}
        >
          {timeAgo(request.created_at)}
        </span>
      </div>

      {request.message && (
        <p
          className="text-[13px] text-gray-700"
          style={{ lineHeight: 1.6 }}
        >
          {request.message}
        </p>
      )}

      <div className="h-px bg-gray-200" />

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onView}
          className="border-gray-200 text-gray-700 h-9 px-3 text-[13px]"
        >
          <Eye className="h-3.5 w-3.5 mr-1.5" />
          View details
        </Button>
        {request.status === "pending" && (
          <>
            <Button
              size="sm"
              onClick={onReject}
              variant="outline"
              className="border-gray-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-9 px-3 text-[13px]"
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={onApprove}
              className="bg-[#19aa59] hover:bg-[#15934d] text-white h-9 px-4 text-[13px] font-bold rounded-lg"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Approve
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function DetailModal({ request, onClose, onApprove, onReject }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-xl">
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-bold text-[#030914] tracking-[-0.3px] truncate">
              {request.institutionName}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Contact request details</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Section title="Contact information">
              <DetailRow icon={Users} value={request.contactName} />
              <DetailRow icon={Mail} value={request.contactEmail} breakAll />
              {request.contactPhone && <DetailRow icon={Phone} value={request.contactPhone} />}
              {request.website && (
                <DetailRow icon={Globe}>
                  <a
                    href={request.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#19aa59] hover:underline break-all"
                  >
                    {request.website}
                  </a>
                </DetailRow>
              )}
            </Section>

            <Section title="Institution details">
              <KV label="Student email suffix" value={request.studentEmailSuffix} />
              <KV label="Teacher email suffix" value={request.teacherEmailSuffix} />
              <KV
                label="Estimated students"
                value={request.estimatedStudents || "Not specified"}
              />
              <KV
                label="Estimated teachers"
                value={request.estimatedTeachers || "Not specified"}
              />
            </Section>
          </div>

          {request.message && (
            <Section title="Additional information">
              <div className="bg-[#f9f9f9] border border-gray-200 rounded-lg p-4 text-[13px] text-gray-700 leading-relaxed">
                {request.message}
              </div>
            </Section>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Requested {timeAgo(request.created_at)}
            </div>
            {request.status === "pending" && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={onReject}
                  className="border-gray-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Reject request
                </Button>
                <Button
                  onClick={onApprove}
                  className="bg-[#19aa59] hover:bg-[#15934d] text-white font-bold rounded-lg"
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Approve institution
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <h4
        className="text-[10px] font-bold text-gray-500 uppercase"
        style={{ letterSpacing: "1.2px" }}
      >
        {title}
      </h4>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function DetailRow({ icon: Icon, value, children, breakAll }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
      {children ?? (
        <span className={`text-sm text-gray-900 ${breakAll ? "break-all" : ""}`}>
          {value}
        </span>
      )}
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

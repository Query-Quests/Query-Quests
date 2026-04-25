"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Mail,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 10;

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * InstitutionsDataTable - Pencil-styled data table for institutions.
 */
export default function InstitutionsDataTable({
  data,
  onEdit,
  onDelete,
  isLoading,
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((inst) => {
      const name = (inst.name || "").toLowerCase();
      const address = (inst.address || "").toLowerCase();
      const sSuffix = (inst.studentEmailSuffix || "").toLowerCase();
      const tSuffix = (inst.teacherEmailSuffix || "").toLowerCase();
      return (
        name.includes(q) ||
        address.includes(q) ||
        sSuffix.includes(q) ||
        tSuffix.includes(q)
      );
    });
  }, [data, search]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const rows = filtered.slice(start, end);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Toolbar */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Filter institutions..."
            className="w-full h-[38px] pl-10 pr-3 text-[13px] text-[#030914] placeholder:text-gray-400 bg-white border border-gray-200 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/15"
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 h-[38px] px-3.5 bg-white border border-gray-200 rounded-lg text-[12px] font-medium text-[#030914] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-gray-50"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          View
        </button>
      </div>

      {/* Table card */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[minmax(0,1fr)_90px_100px_140px_minmax(0,220px)_24px] gap-4 items-center bg-[#f9fafb] border-b border-gray-200 px-5 py-3">
          <span className="text-[11px] font-bold text-gray-500 tracking-[1px]">
            INSTITUTION
          </span>
          <span className="text-[11px] font-bold text-gray-500 tracking-[1px]">
            PLAN
          </span>
          <span className="text-[11px] font-bold text-gray-500 tracking-[1px]">
            USERS / SEATS
          </span>
          <span className="text-[11px] font-bold text-gray-500 tracking-[1px]">
            CHALLENGES
          </span>
          <span className="text-[11px] font-bold text-gray-500 tracking-[1px]">
            EMAIL DOMAINS
          </span>
          <span className="sr-only">Actions</span>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#19aa59] border-t-transparent" />
              <p className="text-[12px] text-gray-500">Loading institutions...</p>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <Building2 className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-[13px] font-semibold text-[#030914] mb-1">
              {search ? "No matches" : "No institutions yet"}
            </p>
            <p className="text-[12px] text-gray-500">
              {search
                ? "Try a different search term."
                : "Click 'Add institution' to create your first one."}
            </p>
          </div>
        ) : (
          rows.map((inst, idx) => (
            <div
              key={inst.id}
              className={`grid grid-cols-[minmax(0,1fr)_90px_100px_140px_minmax(0,220px)_24px] gap-4 items-center px-5 py-3.5 hover:bg-[#f9fafb] transition-colors ${
                idx < rows.length - 1 ? "border-b border-gray-200" : ""
              }`}
            >
              {/* Name + initials */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#19aa59]">
                  <span className="text-[11px] font-bold text-white">
                    {getInitials(inst.name)}
                  </span>
                </div>
                <div className="min-w-0 flex flex-col gap-0.5">
                  <p className="text-[13px] font-semibold text-[#030914] truncate">
                    {inst.name}
                  </p>
                  {inst.address && (
                    <p
                      className="text-[11px] text-gray-500 truncate"
                      style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                    >
                      {inst.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Plan */}
              <div>
                {(() => {
                  const plan = (inst.plan || "free").toLowerCase();
                  const styles =
                    plan === "enterprise"
                      ? "bg-[#0a1220] text-white"
                      : plan === "pro"
                      ? "bg-[#19aa59]/10 text-[#15934d]"
                      : "bg-gray-100 text-gray-700";
                  return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-[1px] uppercase ${styles}`}>
                      {plan}
                    </span>
                  );
                })()}
              </div>

              {/* Users / seats */}
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                <span
                  className="text-[13px] font-semibold text-[#030914]"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {inst.userCount ?? 0}
                  <span className="text-gray-400"> / {inst.seats ?? 50}</span>
                </span>
              </div>

              {/* Challenges */}
              <div className="inline-flex">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#15934d] text-[9px] font-bold tracking-[1px]">
                  {inst.challengeCount ?? 0} CHALLENGES
                </span>
              </div>

              {/* Email domains */}
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                  <span
                    className="text-[11px] text-gray-500 truncate"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    S: {inst.studentEmailSuffix || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                  <span
                    className="text-[11px] text-gray-500 truncate"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    T: {inst.teacherEmailSuffix || "—"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md text-gray-500 hover:bg-gray-100 hover:text-[#030914]"
                    aria-label="Row actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => onEdit(inst)}>
                    <Edit className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => onDelete(inst)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[12px] text-gray-500">
            Showing {start + 1} to {end} of {total} institutions
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-white border border-gray-200 text-[12px] font-medium text-[#030914] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <span className="text-[12px] text-gray-500">
              Page {safePage + 1} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-white border border-gray-200 text-[12px] font-medium text-[#030914] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

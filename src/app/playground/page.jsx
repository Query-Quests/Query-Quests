"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/header";
import XTerminal from "@/components/XTerminal";
import {
  Database,
  ChevronDown,
  Play,
  FolderTree,
  Table2,
  Key,
  Link2,
  Hash,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

function constraintIconFromKey(key) {
  if (key === "PRI") return <Key className="h-3 w-3 text-amber-500 shrink-0" />;
  if (key === "MUL") return <Link2 className="h-3 w-3 text-[#19aa59] shrink-0" />;
  return <Hash className="h-3 w-3 text-gray-400 shrink-0" />;
}

function shortType(type) {
  return String(type || "").replace(/\(.*\)/, "").toUpperCase();
}

export default function Playground() {
  const [databases, setDatabases] = useState([]);
  const [activeDbId, setActiveDbId] = useState(null);
  const [schema, setSchema] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [expandedTable, setExpandedTable] = useState(null);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Fetch the catalog of ready databases once.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/databases", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list = (data.databases || data || []).filter(
          (d) => d.status === "ready",
        );
        setDatabases(list);
        const practice = list.find((d) => d.mysqlDbName === "practice");
        setActiveDbId((practice || list[0])?.id ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Whenever the selected database changes, pull its schema.
  useEffect(() => {
    if (!activeDbId) return;
    let cancelled = false;
    setSchemaLoading(true);
    setSchema(null);
    fetch(`/api/databases/${activeDbId}/schema`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setSchema(data.schema || null);
        setExpandedTable(data.schema?.tables?.[0]?.name ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSchemaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeDbId]);

  const activeDb = useMemo(
    () => databases.find((d) => d.id === activeDbId) || null,
    [databases, activeDbId],
  );

  const tables = useMemo(
    () =>
      (schema?.tables || []).map((t) => ({
        ...t,
        count: (t.columns || []).length,
      })),
    [schema],
  );

  const focusTerminal = () => {
    const helper = document.querySelector(".xterm-helper-textarea");
    if (helper) helper.focus();
  };

  const MONO = {
    fontFamily:
      "var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace",
  };

  return (
    <div
      className="min-h-screen bg-[#f9f9f9] flex flex-col"
      style={{ fontFamily: "var(--font-geist-sans), Geist, Arial, sans-serif" }}
    >
      <Header />

      <div className="px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSchemaOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-gray-200 text-[13px] font-semibold text-[#030914] hover:bg-gray-50 transition"
            aria-expanded={schemaOpen}
          >
            {schemaOpen ? (
              <PanelLeftClose className="h-3.5 w-3.5 text-gray-500" />
            ) : (
              <PanelLeftOpen className="h-3.5 w-3.5 text-gray-500" />
            )}
            Schema
          </button>
          <div>
            <h1 className="text-[18px] font-bold text-[#030914] tracking-tight leading-tight">
              SQL Playground
            </h1>
            <p className="text-[12px] text-gray-500">
              Experiment freely on sample datasets — no pressure, no scoring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              disabled={databases.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-gray-200 text-[13px] font-semibold text-[#030914] hover:bg-gray-50 transition disabled:opacity-50"
              aria-haspopup="listbox"
              aria-expanded={pickerOpen}
            >
              <Database className="h-3.5 w-3.5 text-gray-500" />
              {activeDb?.mysqlDbName ?? "Loading…"}
              <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
            </button>
            {pickerOpen && (
              <div className="absolute right-0 z-40 mt-1 w-72 rounded-md border border-gray-200 bg-white shadow-lg">
                <ul role="listbox" className="py-1 max-h-72 overflow-y-auto">
                  {databases.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={d.id === activeDbId}
                        onClick={() => {
                          setActiveDbId(d.id);
                          setPickerOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 ${
                          d.id === activeDbId
                            ? "bg-[#19aa59]/5 text-[#030914]"
                            : "text-[#030914]"
                        }`}
                      >
                        <div className="font-semibold">{d.mysqlDbName}</div>
                        <div className="text-[11px] text-gray-500 truncate">
                          {d.name}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={focusTerminal}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#19aa59] hover:bg-[#15934d] text-white text-[13px] font-semibold transition"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            Run query
          </button>
        </div>
      </div>

      <div className="flex-1 relative" style={{ minHeight: "calc(100vh - 165px)" }}>
        {/* Schema drawer: slides in from the left on top of the terminal */}
        <aside
          className={`absolute inset-y-0 left-0 z-30 w-[300px] bg-white border-r border-gray-200 shadow-xl flex flex-col overflow-hidden transition-transform duration-200 ${
            schemaOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between gap-2 px-3.5 py-3 bg-[#f9f9f9] border-b border-gray-200">
            <div className="flex items-center gap-2">
              <FolderTree className="h-3.5 w-3.5 text-gray-500" />
              <span
                className="text-[10px] font-bold text-gray-500"
                style={{ letterSpacing: "1.2px" }}
              >
                SCHEMA
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSchemaOpen(false)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:text-[#030914] hover:bg-white"
              aria-label="Close schema drawer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {schemaLoading && (
              <div className="px-3 py-2 text-[11px] text-gray-500">
                Loading schema…
              </div>
            )}
            {!schemaLoading && tables.length === 0 && (
              <div className="px-3 py-2 text-[11px] text-gray-500">
                No tables found.
              </div>
            )}
            {tables.map((table) => {
              const isOpen = expandedTable === table.name;
              return (
                <div key={table.name}>
                  <button
                    type="button"
                    onClick={() => setExpandedTable(isOpen ? null : table.name)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition ${
                      isOpen ? "bg-[#f9f9f9]" : "hover:bg-gray-50"
                    }`}
                  >
                    <Table2 className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span className="text-xs font-semibold text-[#030914] truncate">
                      {table.name}{" "}
                      <span className="text-gray-400 font-normal">
                        ({table.count})
                      </span>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="pl-7 pr-3 py-1 space-y-0.5" style={MONO}>
                      {(table.columns || []).map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center gap-2 text-[11px] text-gray-500 py-0.5"
                        >
                          {constraintIconFromKey(col.key)}
                          <span className="truncate">{col.name}</span>
                          <span className="ml-auto text-gray-400">
                            {shortType(col.type)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Click-outside backdrop when drawer is open */}
        {schemaOpen && (
          <button
            type="button"
            aria-label="Close schema drawer"
            onClick={() => setSchemaOpen(false)}
            className="absolute inset-0 z-20 bg-black/20"
          />
        )}

        {/* Terminal — always full width of the viewport */}
        <section className="absolute inset-0 z-10 bg-[#030914] flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0a1628] border-b border-[#1f2937]">
            <span className="flex items-center gap-1.5">
              <span className="w-[9px] h-[9px] rounded-full bg-[#ef4444]" />
              <span className="w-[9px] h-[9px] rounded-full bg-[#f59e0b]" />
              <span className="w-[9px] h-[9px] rounded-full bg-[#10b981]" />
            </span>
            <span
              className="ml-2 text-[11px] font-medium text-gray-400"
              style={MONO}
            >
              query.sql
            </span>
          </div>
          <div className="flex-1 min-h-0 px-4 py-3">
            {activeDb && (
              <XTerminal
                key={activeDb.mysqlDbName}
                mode="shell"
                databaseName={activeDb.mysqlDbName}
                className="w-full h-full"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
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

const DATASETS = [
  {
    key: "practice",
    label: "practice_db",
    description:
      "Students, courses, enrollments. The default sandbox for intro challenges.",
    tables: [
      {
        name: "users",
        description: "User accounts and profiles",
        columns: [
          { name: "id", type: "INTEGER", constraints: ["PRIMARY KEY", "AUTO_INCREMENT"] },
          { name: "name", type: "VARCHAR(255)", constraints: ["NOT NULL"] },
          { name: "email", type: "VARCHAR(255)", constraints: ["UNIQUE", "NOT NULL"] },
          { name: "alias", type: "VARCHAR(100)", constraints: [] },
          { name: "institution_id", type: "INTEGER", constraints: ["FOREIGN KEY"] },
          { name: "is_admin", type: "BOOLEAN", constraints: ["DEFAULT FALSE"] },
          { name: "is_teacher", type: "BOOLEAN", constraints: ["DEFAULT FALSE"] },
          { name: "points", type: "INTEGER", constraints: ["DEFAULT 0"] },
          { name: "solved_challenges", type: "INTEGER", constraints: ["DEFAULT 0"] },
          { name: "created_at", type: "TIMESTAMP", constraints: ["DEFAULT CURRENT_TIMESTAMP"] },
        ],
      },
      {
        name: "challenges",
        description: "SQL challenges and exercises",
        columns: [
          { name: "id", type: "INTEGER", constraints: ["PRIMARY KEY", "AUTO_INCREMENT"] },
          { name: "title", type: "VARCHAR(255)", constraints: ["NOT NULL"] },
          { name: "statement", type: "TEXT", constraints: ["NOT NULL"] },
          { name: "solution", type: "TEXT", constraints: ["NOT NULL"] },
          { name: "level", type: "INTEGER", constraints: ["NOT NULL", "DEFAULT 1"] },
          { name: "points", type: "INTEGER", constraints: ["NOT NULL", "DEFAULT 100"] },
          { name: "creator_id", type: "INTEGER", constraints: ["FOREIGN KEY"] },
          { name: "institution_id", type: "INTEGER", constraints: ["FOREIGN KEY"] },
          { name: "created_at", type: "TIMESTAMP", constraints: ["DEFAULT CURRENT_TIMESTAMP"] },
        ],
      },
      {
        name: "institutions",
        description: "Educational institutions",
        columns: [
          { name: "id", type: "INTEGER", constraints: ["PRIMARY KEY", "AUTO_INCREMENT"] },
          { name: "name", type: "VARCHAR(255)", constraints: ["NOT NULL", "UNIQUE"] },
          { name: "address", type: "TEXT", constraints: [] },
          { name: "created_at", type: "TIMESTAMP", constraints: ["DEFAULT CURRENT_TIMESTAMP"] },
        ],
      },
      {
        name: "user_activity",
        description: "User activity and progress tracking",
        columns: [
          { name: "id", type: "INTEGER", constraints: ["PRIMARY KEY", "AUTO_INCREMENT"] },
          { name: "user_id", type: "INTEGER", constraints: ["FOREIGN KEY", "NOT NULL"] },
          { name: "challenge_id", type: "INTEGER", constraints: ["FOREIGN KEY"] },
          { name: "action", type: "VARCHAR(100)", constraints: ["NOT NULL"] },
          { name: "points_earned", type: "INTEGER", constraints: ["DEFAULT 0"] },
          { name: "timestamp", type: "TIMESTAMP", constraints: ["DEFAULT CURRENT_TIMESTAMP"] },
        ],
      },
    ],
  },
];

function constraintIcon(constraints) {
  if (constraints.some((c) => c.includes("PRIMARY KEY"))) {
    return <Key className="h-3 w-3 text-amber-500 shrink-0" />;
  }
  if (constraints.some((c) => c.includes("FOREIGN KEY"))) {
    return <Link2 className="h-3 w-3 text-[#19aa59] shrink-0" />;
  }
  return <Hash className="h-3 w-3 text-gray-400 shrink-0" />;
}

function shortType(type) {
  return type.replace(/\(.*\)/, "");
}

export default function Playground() {
  const [activeDataset] = useState(DATASETS[0]);
  const [expandedTable, setExpandedTable] = useState(DATASETS[0].tables[0].name);
  const [schemaOpen, setSchemaOpen] = useState(false);

  const tables = useMemo(
    () => activeDataset.tables.map((t) => ({ ...t, count: t.columns.length })),
    [activeDataset]
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
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-gray-200 text-[13px] font-semibold text-[#030914] hover:bg-gray-50 transition"
          >
            <Database className="h-3.5 w-3.5 text-gray-500" />
            {activeDataset.label}
            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
          </button>
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
                      {table.columns.map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center gap-2 text-[11px] text-gray-500 py-0.5"
                        >
                          {constraintIcon(col.constraints)}
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
            <XTerminal
              mode="shell"
              databaseName={activeDataset.key}
              className="w-full h-full"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

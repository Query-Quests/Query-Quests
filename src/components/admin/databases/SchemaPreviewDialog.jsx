"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, Database, Table2, Hash, Key } from "lucide-react";
import { toast } from "sonner";

const MONO = "var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace";

function buildCreateTableSql(table) {
  if (!table?.columns?.length) return `-- ${table?.name ?? "table"}: no columns`;
  const colLines = table.columns.map((col) => {
    const parts = [
      `  \`${col.name}\``,
      col.type,
      col.nullable ? "NULL" : "NOT NULL",
    ];
    if (col.key === "PRI") parts.push("PRIMARY KEY");
    if (col.key === "UNI") parts.push("UNIQUE");
    return parts.join(" ");
  });
  return `CREATE TABLE \`${table.name}\` (\n${colLines.join(",\n")}\n);`;
}

export default function SchemaPreviewDialog({ open, onOpenChange, database }) {
  const [schema, setSchema] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTables, setExpandedTables] = useState([]);

  useEffect(() => {
    if (open && database?.id) {
      fetchSchema();
    }
  }, [open, database?.id]);

  const fetchSchema = async () => {
    if (!database?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/databases/${database.id}/schema?sampleData=true&sampleLimit=5`
      );
      if (response.ok) {
        const data = await response.json();
        setSchema(data.schema);
        if (data.schema?.tables?.length > 0) {
          setExpandedTables([data.schema.tables[0].name]);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch schema");
      }
    } catch (error) {
      console.error("Error fetching schema:", error);
      toast.error("Error fetching schema");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[820px] max-h-[85vh] overflow-y-auto rounded-xl border-gray-200 bg-white p-6 gap-5">
        <DialogHeader className="gap-1">
          <DialogTitle className="flex items-center gap-2.5 text-[20px] font-bold text-[#030914] tracking-[-0.3px]">
            <span className="h-9 w-9 rounded-lg bg-[#030914] flex items-center justify-center">
              <Database className="h-[18px] w-[18px] text-[#19aa59]" />
            </span>
            <span style={{ fontFamily: MONO }}>{database?.name}</span>
          </DialogTitle>
          <DialogDescription className="text-[13px] text-gray-500 leading-[1.5]">
            Database schema and sample rows.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#19aa59]" />
          </div>
        ) : schema ? (
          <div className="flex flex-col gap-4">
            {/* Summary strip */}
            <div className="flex flex-wrap items-center gap-6 px-4 py-3 rounded-xl bg-gray-100 border border-gray-200">
              <SummaryStat
                icon={<Table2 className="h-3.5 w-3.5 text-gray-500" />}
                value={schema.totalTables}
                label="tables"
              />
              <SummaryStat
                icon={<Hash className="h-3.5 w-3.5 text-gray-500" />}
                value={schema.totalRows?.toLocaleString() ?? 0}
                label="total rows"
              />
            </div>

            {/* Tables */}
            <Accordion
              type="multiple"
              value={expandedTables}
              onValueChange={setExpandedTables}
              className="flex flex-col gap-2"
            >
              {schema.tables?.map((table) => (
                <AccordionItem
                  key={table.name}
                  value={table.name}
                  className="border border-gray-200 rounded-xl bg-white overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50 [&[data-state=open]>svg]:rotate-180">
                    <div className="flex items-center gap-3 flex-1">
                      <Table2 className="h-4 w-4 text-gray-500 shrink-0" />
                      <span
                        className="text-[14px] font-bold text-[#030914]"
                        style={{ fontFamily: MONO }}
                      >
                        {table.name}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600 uppercase"
                        style={{ letterSpacing: "0.4px" }}
                      >
                        {table.rowCount.toLocaleString()} rows
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-[#15934d] uppercase"
                        style={{ letterSpacing: "0.4px" }}
                      >
                        {table.columns?.length} cols
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-0">
                    {/* DDL block (dark navy + mono green) */}
                    <div className="border-t border-gray-200 bg-[#030914]">
                      <div
                        className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase border-b border-white/10"
                        style={{ letterSpacing: "0.6px", fontFamily: MONO }}
                      >
                        CREATE TABLE
                      </div>
                      <pre
                        className="px-4 py-3 text-[12px] leading-[1.6] text-[#19aa59] whitespace-pre overflow-x-auto"
                        style={{ fontFamily: MONO }}
                      >
                        {buildCreateTableSql(table)}
                      </pre>
                    </div>

                    {/* Columns table */}
                    <div className="px-4 pt-4 pb-2">
                      <h4
                        className="text-[10px] font-bold text-gray-500 uppercase mb-2"
                        style={{ letterSpacing: "0.6px" }}
                      >
                        Columns
                      </h4>
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 text-[10px] font-bold text-gray-500 uppercase">
                            <tr>
                              <th
                                className="text-left px-3 py-2"
                                style={{ letterSpacing: "0.4px" }}
                              >
                                Name
                              </th>
                              <th
                                className="text-left px-3 py-2"
                                style={{ letterSpacing: "0.4px" }}
                              >
                                Type
                              </th>
                              <th
                                className="text-left px-3 py-2"
                                style={{ letterSpacing: "0.4px" }}
                              >
                                Nullable
                              </th>
                              <th
                                className="text-left px-3 py-2"
                                style={{ letterSpacing: "0.4px" }}
                              >
                                Key
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.columns?.map((column) => (
                              <tr
                                key={column.name}
                                className="border-t border-gray-200"
                              >
                                <td
                                  className="px-3 py-2 text-[12px] text-[#030914]"
                                  style={{ fontFamily: MONO }}
                                >
                                  {column.name}
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className="px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-semibold text-gray-700"
                                    style={{ fontFamily: MONO }}
                                  >
                                    {column.type}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-[12px] text-gray-500">
                                  {column.nullable ? "Yes" : "No"}
                                </td>
                                <td className="px-3 py-2">
                                  {column.key === "PRI" && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold text-amber-700 uppercase">
                                      <Key className="h-2.5 w-2.5" />
                                      Primary
                                    </span>
                                  )}
                                  {column.key === "MUL" && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-700 uppercase">
                                      Foreign
                                    </span>
                                  )}
                                  {column.key === "UNI" && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-[10px] font-bold text-purple-700 uppercase">
                                      Unique
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Sample data */}
                    {table.sampleData && table.sampleData.length > 0 && (
                      <div className="px-4 pt-3 pb-4">
                        <h4
                          className="text-[10px] font-bold text-gray-500 uppercase mb-2"
                          style={{ letterSpacing: "0.6px" }}
                        >
                          Sample data (first {table.sampleData.length} rows)
                        </h4>
                        <div className="rounded-lg border border-gray-200 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-[10px] font-bold text-gray-500 uppercase">
                              <tr>
                                {Object.keys(table.sampleData[0]).map((col) => (
                                  <th
                                    key={col}
                                    className="text-left px-3 py-2 whitespace-nowrap"
                                    style={{
                                      letterSpacing: "0.4px",
                                      fontFamily: MONO,
                                    }}
                                  >
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {table.sampleData.map((row, idx) => (
                                <tr
                                  key={idx}
                                  className="border-t border-gray-200"
                                >
                                  {Object.values(row).map((value, i) => (
                                    <td
                                      key={i}
                                      className="px-3 py-2 text-[12px] text-[#030914] whitespace-nowrap max-w-[220px] truncate"
                                      style={{ fontFamily: MONO }}
                                    >
                                      {value === null ? (
                                        <span className="text-gray-400 italic">
                                          NULL
                                        </span>
                                      ) : (
                                        String(value)
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Database className="h-10 w-10 mb-3 text-gray-400" />
            <p className="text-sm">No schema data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryStat({ icon, value, label }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span
        className="text-[14px] font-bold text-[#030914]"
        style={{ fontFamily: MONO }}
      >
        {value}
      </span>
      <span className="text-[12px] text-gray-500">{label}</span>
    </div>
  );
}

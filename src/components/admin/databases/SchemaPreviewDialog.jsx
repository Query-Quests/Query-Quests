"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, Database, Table2, Columns, Key, Hash } from "lucide-react";
import { toast } from "sonner";

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
        // Expand first table by default
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

  const getColumnTypeColor = (type) => {
    const typeColors = {
      int: "bg-blue-100 text-blue-800",
      bigint: "bg-blue-100 text-blue-800",
      smallint: "bg-blue-100 text-blue-800",
      tinyint: "bg-blue-100 text-blue-800",
      decimal: "bg-purple-100 text-purple-800",
      float: "bg-purple-100 text-purple-800",
      double: "bg-purple-100 text-purple-800",
      varchar: "bg-green-100 text-green-800",
      text: "bg-green-100 text-green-800",
      longtext: "bg-green-100 text-green-800",
      char: "bg-green-100 text-green-800",
      date: "bg-orange-100 text-orange-800",
      datetime: "bg-orange-100 text-orange-800",
      timestamp: "bg-orange-100 text-orange-800",
      time: "bg-orange-100 text-orange-800",
      enum: "bg-yellow-100 text-yellow-800",
      boolean: "bg-pink-100 text-pink-800",
    };
    return typeColors[type.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {database?.name}
          </DialogTitle>
          <DialogDescription>
            Database schema and sample data preview
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : schema ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Table2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{schema.totalTables}</span>
                <span className="text-muted-foreground">tables</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {schema.totalRows?.toLocaleString()}
                </span>
                <span className="text-muted-foreground">total rows</span>
              </div>
            </div>

            {/* Tables */}
            <Accordion
              type="multiple"
              value={expandedTables}
              onValueChange={setExpandedTables}
              className="space-y-2"
            >
              {schema.tables?.map((table) => (
                <AccordionItem
                  key={table.name}
                  value={table.name}
                  className="border rounded-lg"
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Table2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{table.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {table.rowCount.toLocaleString()} rows
                      </Badge>
                      <Badge variant="outline">
                        {table.columns?.length} columns
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {/* Columns */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Columns className="h-4 w-4" />
                          Columns
                        </h4>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Nullable</TableHead>
                                <TableHead>Key</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {table.columns?.map((column) => (
                                <TableRow key={column.name}>
                                  <TableCell className="font-mono text-sm">
                                    {column.name}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={getColumnTypeColor(column.type)}
                                    >
                                      {column.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {column.nullable ? "Yes" : "No"}
                                  </TableCell>
                                  <TableCell>
                                    {column.key === "PRI" && (
                                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                        <Key className="h-3 w-3 mr-1" />
                                        Primary
                                      </Badge>
                                    )}
                                    {column.key === "MUL" && (
                                      <Badge variant="outline">Foreign</Badge>
                                    )}
                                    {column.key === "UNI" && (
                                      <Badge variant="outline">Unique</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Sample Data */}
                      {table.sampleData && table.sampleData.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">
                            Sample Data (first 5 rows)
                          </h4>
                          <div className="border rounded-lg overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {Object.keys(table.sampleData[0]).map(
                                    (col) => (
                                      <TableHead
                                        key={col}
                                        className="whitespace-nowrap"
                                      >
                                        {col}
                                      </TableHead>
                                    )
                                  )}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {table.sampleData.map((row, idx) => (
                                  <TableRow key={idx}>
                                    {Object.values(row).map((value, i) => (
                                      <TableCell
                                        key={i}
                                        className="font-mono text-xs whitespace-nowrap max-w-[200px] truncate"
                                      >
                                        {value === null ? (
                                          <span className="text-muted-foreground italic">
                                            NULL
                                          </span>
                                        ) : (
                                          String(value)
                                        )}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Database className="h-12 w-12 mb-4" />
            <p>No schema data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

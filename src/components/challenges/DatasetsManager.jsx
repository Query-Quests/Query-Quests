"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Database,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

/**
 * DatasetsManager
 *
 * Lists ChallengeDataset rows for a challenge, with actions to attach
 * an existing ChallengeDatabase, toggle public/hidden, recapture the
 * expected result, and detach. Used as a tab on the admin challenge
 * edit page.
 *
 * Backend: /api/challenges/[id]/datasets and .../[datasetId].
 * The API enforces auth + teacher institution scoping; this component
 * is just the operator UX.
 */
export default function DatasetsManager({ challengeId }) {
  const [datasets, setDatasets] = useState([]);
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [pendingId, setPendingId] = useState(null); // dataset row in flight

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dsRes, dbRes] = await Promise.all([
        fetch(`/api/challenges/${challengeId}/datasets`),
        fetch(`/api/databases?limit=200&status=ready`),
      ]);
      if (!dsRes.ok) throw new Error("Failed to load datasets");
      if (!dbRes.ok) throw new Error("Failed to load databases");
      const dsBody = await dsRes.json();
      const dbBody = await dbRes.json();
      setDatasets(dsBody.datasets || []);
      setDatabases(dbBody.databases || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (challengeId) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId]);

  const togglePublic = async (dataset) => {
    setPendingId(dataset.id);
    try {
      const res = await fetch(
        `/api/challenges/${challengeId}/datasets/${dataset.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_public: !dataset.is_public }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update");
      }
      toast.success(
        dataset.is_public ? "Dataset hidden from students" : "Dataset is now public",
      );
      await refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPendingId(null);
    }
  };

  const recapture = async (dataset) => {
    setPendingId(dataset.id);
    try {
      const res = await fetch(
        `/api/challenges/${challengeId}/datasets/${dataset.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recapture: true }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to recapture");
      }
      toast.success("Expected result re-captured");
      await refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPendingId(null);
    }
  };

  const detach = async (dataset) => {
    if (
      !confirm(
        "Detach this dataset? The underlying database will not be deleted.",
      )
    ) return;
    setPendingId(dataset.id);
    try {
      const res = await fetch(
        `/api/challenges/${challengeId}/datasets/${dataset.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to detach");
      }
      toast.success("Dataset detached");
      await refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPendingId(null);
    }
  };

  const attachedDatabaseIds = new Set(datasets.map((d) => d.database?.id));
  const availableDatabases = databases.filter(
    (db) => !attachedDatabaseIds.has(db.id),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Datasets</h3>
          <p className="text-sm text-muted-foreground">
            A submission must match the expected result on every attached
            dataset. Public datasets are visible to students; hidden
            datasets defeat hardcoded answers.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setAttachOpen(true)}
          disabled={availableDatabases.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Attach dataset
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {datasets.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-muted-foreground">
          No datasets attached. Until you attach at least one, this challenge
          falls back to the legacy single-database grading path.
        </div>
      ) : (
        <div className="space-y-2">
          {datasets.map((d) => (
            <DatasetRow
              key={d.id}
              dataset={d}
              busy={pendingId === d.id}
              onToggle={() => togglePublic(d)}
              onRecapture={() => recapture(d)}
              onDetach={() => detach(d)}
            />
          ))}
        </div>
      )}

      <AttachDialog
        open={attachOpen}
        onOpenChange={setAttachOpen}
        databases={availableDatabases}
        onAttached={async () => {
          setAttachOpen(false);
          await refresh();
        }}
        challengeId={challengeId}
      />
    </div>
  );
}

function DatasetRow({ dataset, busy, onToggle, onRecapture, onDetach }) {
  const db = dataset.database;
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <Database className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">
              {db?.name || "Unknown database"}
            </span>
            {dataset.is_public ? (
              <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">
                <Eye className="h-3 w-3 mr-1" />
                Public
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                <EyeOff className="h-3 w-3 mr-1" />
                Hidden
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {db?.mysqlDbName} · v{dataset.dataset_version}
            {db?.tableCount != null && ` · ${db.tableCount} tables`}
            {db?.rowCount != null && ` · ${db.rowCount} rows`}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggle}
          disabled={busy}
        >
          {dataset.is_public ? (
            <>
              <EyeOff className="h-4 w-4 mr-1" />
              Make hidden
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Make public
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRecapture}
          disabled={busy}
          title="Re-run the reference query against this dataset"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Recapture
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={onDetach}
          disabled={busy}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function AttachDialog({ open, onOpenChange, databases, onAttached, challengeId }) {
  const [databaseId, setDatabaseId] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [expectedQuery, setExpectedQuery] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setDatabaseId("");
      setIsPublic(false);
      setExpectedQuery("");
      setDisplayOrder("0");
      setSubmitting(false);
    }
  }, [open]);

  const handleAttach = async () => {
    if (!databaseId) {
      toast.error("Pick a database first");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/datasets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          database_id: databaseId,
          is_public: isPublic,
          display_order: parseInt(displayOrder) || 0,
          expected_query: expectedQuery.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to attach");
      }
      const body = await res.json();
      toast.success(
        `Attached. Captured ${body.capture?.rowCount ?? 0} rows in ${body.capture?.executionTimeMs ?? 0} ms.`,
      );
      await onAttached();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Attach dataset</DialogTitle>
          <DialogDescription>
            Pick an existing challenge database. The reference query is
            run once against it to compute the expected result.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ds-database">Database</Label>
            <Select value={databaseId} onValueChange={setDatabaseId}>
              <SelectTrigger id="ds-database">
                <SelectValue placeholder="Choose a database" />
              </SelectTrigger>
              <SelectContent>
                {databases.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No available databases
                  </SelectItem>
                ) : (
                  databases.map((db) => (
                    <SelectItem key={db.id} value={db.id}>
                      {db.name} · {db.mysqlDbName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
            <div>
              <Label htmlFor="ds-public" className="font-medium">Public</Label>
              <p className="text-xs text-muted-foreground">
                Public datasets show their schema to students. Hidden ones
                defeat hardcoded answers.
              </p>
            </div>
            <Switch
              id="ds-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ds-order">Display order</Label>
            <Input
              id="ds-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ds-query">
              Override reference query <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="ds-query"
              placeholder="Defaults to the challenge's solution"
              value={expectedQuery}
              onChange={(e) => setExpectedQuery(e.target.value)}
              className="font-mono text-sm min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use the challenge's `solution` field as the
              reference. Override only if a different dataset needs a
              different reference query.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleAttach} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Attach
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

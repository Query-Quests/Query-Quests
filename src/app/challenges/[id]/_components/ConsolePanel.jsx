import { Terminal, Play, CheckCheck } from "lucide-react";
import XTerminal from "@/components/XTerminal";
import { QueryResults } from "./QueryResults";

export function ConsolePanel({
  challengeId,
  databaseName,
  isCompleted,
  sqlQuery,
  queryLoading,
  validating,
  queryResult,
  queryError,
  onExecute,
  onValidate,
  onTerminalResult,
  onTerminalError,
}) {
  return (
    <div className="flex w-1/2 flex-col bg-[#030914]">
      <ConsoleHeader
        sqlQuery={sqlQuery}
        queryLoading={queryLoading}
        validating={validating}
        isCompleted={isCompleted}
        onExecute={onExecute}
        onValidate={onValidate}
      />
      <div className="flex-1 min-h-0 px-6 py-4">
        <XTerminal
          mode="shell"
          challengeId={challengeId}
          databaseName={databaseName}
          onQueryResult={onTerminalResult}
          onQueryError={onTerminalError}
        />
      </div>
      <QueryResults queryResult={queryResult} queryError={queryError} />
    </div>
  );
}

function ConsoleHeader({
  sqlQuery,
  queryLoading,
  validating,
  isCompleted,
  onExecute,
  onValidate,
}) {
  return (
    <div className="flex items-center justify-between bg-[#0a1628] px-4 py-3 border-b border-[#1f2937]">
      <div className="flex items-center gap-[10px]">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-md bg-[#1f2937] border border-[#374151]">
          <Terminal className="h-3.5 w-3.5 text-[#9ca3af]" />
        </div>
        <div className="flex flex-col gap-[2px]">
          <span className="text-[12px] font-semibold text-white leading-none">
            SQL Console
          </span>
          <span className="text-[11px] text-[#9ca3af] leading-none">
            Write and run your SQL
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExecute}
          disabled={queryLoading || !sqlQuery.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#19aa59] hover:bg-[#15934d] px-[14px] py-2 text-[12px] font-semibold text-white transition disabled:opacity-50"
        >
          {queryLoading ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Play className="h-3 w-3" />
          )}
          {queryLoading ? "Running…" : "Run Query"}
        </button>
        <button
          type="button"
          onClick={onValidate}
          disabled={validating || isCompleted}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#1f2937] border border-[#374151] hover:bg-[#374151] px-[14px] py-2 text-[12px] font-semibold text-[#e5e7eb] transition disabled:opacity-50"
        >
          {validating ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-transparent" />
          ) : (
            <CheckCheck className="h-3 w-3" />
          )}
          {validating ? "Validating…" : "Validate"}
        </button>
      </div>
    </div>
  );
}

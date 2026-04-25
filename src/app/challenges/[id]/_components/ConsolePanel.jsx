import {
  Terminal,
  PanelLeft,
  PanelLeftClose,
  Maximize2,
  Play,
  RotateCcw,
  CheckCheck,
} from "lucide-react";
import XTerminal from "@/components/XTerminal";
import { Button } from "@/components/ui/button";
import { QueryResults } from "./QueryResults";
import { FloatingChallengeInfo } from "./FloatingChallengeInfo";

export function ConsolePanel({
  challenge,
  challengeId,
  databaseName,
  isExpanded,
  onToggleExpanded,
  onOpenFullscreen,
  isCompleted,
  showHint,
  onToggleHint,
  sqlQuery,
  queryLoading,
  validating,
  queryResult,
  queryError,
  onExecute,
  onValidate,
  onReset,
  onTerminalResult,
  onTerminalError,
}) {
  return (
    <div
      className={`relative bg-[#030914] flex flex-col transition-all duration-300 ${
        isExpanded ? "w-full" : "w-1/2"
      }`}
    >
      <ConsoleHeader
        isExpanded={isExpanded}
        onToggleExpanded={onToggleExpanded}
        onOpenFullscreen={onOpenFullscreen}
        sqlQuery={sqlQuery}
        queryLoading={queryLoading}
        validating={validating}
        isCompleted={isCompleted}
        onExecute={onExecute}
        onValidate={onValidate}
        onReset={onReset}
      />

      <div className="flex-1">
        <XTerminal
          mode="shell"
          challengeId={challengeId}
          databaseName={databaseName}
          onQueryResult={onTerminalResult}
          onQueryError={onTerminalError}
        />
      </div>

      {isExpanded && (
        <FloatingChallengeInfo
          challenge={challenge}
          isCompleted={isCompleted}
          showHint={showHint}
          onToggleHint={onToggleHint}
          onClose={() => onToggleExpanded(false)}
        />
      )}

      <QueryResults queryResult={queryResult} queryError={queryError} />
    </div>
  );
}

function ConsoleHeader({
  isExpanded,
  onToggleExpanded,
  onOpenFullscreen,
  sqlQuery,
  queryLoading,
  validating,
  isCompleted,
  onExecute,
  onValidate,
  onReset,
}) {
  return (
    <div className="px-4 py-3 bg-[#0a1628] border-b border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#19aa59]/20 rounded-lg flex items-center justify-center">
            <Terminal className="h-4 w-4 text-[#19aa59]" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">SQL Console</h2>
            <p className="text-xs text-gray-500">Write and execute your queries</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleExpanded((v) => !v)}
            className="border-gray-600 bg-gray-700/50 text-gray-200 hover:bg-[#19aa59]/20 hover:text-[#19aa59] hover:border-[#19aa59]/50 transition-all"
            title={isExpanded ? "Show challenge details" : "Expand terminal"}
          >
            {isExpanded ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFullscreen}
            className="border-gray-600 bg-gray-700/50 text-gray-200 hover:bg-[#19aa59]/20 hover:text-[#19aa59] hover:border-[#19aa59]/50 transition-all"
            title="Open fullscreen terminal"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-700 mx-1" />

          <Button
            onClick={onExecute}
            disabled={queryLoading || !sqlQuery.trim()}
            size="sm"
            className="bg-[#19aa59] hover:bg-[#15934d] text-white"
          >
            {queryLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {queryLoading ? "Running..." : "Run Query"}
          </Button>

          <Button
            onClick={onValidate}
            disabled={validating || isCompleted}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {validating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-2" />
            )}
            {validating ? "Validating..." : "Validate Query"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={queryLoading}
            className="border-gray-600 bg-gray-700/50 text-gray-200 hover:bg-[#19aa59]/20 hover:text-[#19aa59] hover:border-[#19aa59]/50 transition-all"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

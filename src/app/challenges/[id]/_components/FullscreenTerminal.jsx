import { Terminal, X } from "lucide-react";
import XTerminal from "@/components/XTerminal";
import { Button } from "@/components/ui/button";

export function FullscreenTerminal({ challenge, challengeId, databaseName, onClose, onResult, onError }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#030914]">
      <div className="px-4 py-3 bg-[#0a1628] border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#19aa59]/20 rounded-lg flex items-center justify-center">
              <Terminal className="h-4 w-4 text-[#19aa59]" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">SQL Console - Fullscreen</h2>
              <p className="text-xs text-gray-500">
                {challenge.name || `Challenge #${challenge.id}`}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-gray-600 bg-gray-700/50 text-gray-200 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all"
          >
            <X className="h-4 w-4 mr-2" />
            Close Fullscreen
          </Button>
        </div>
      </div>
      <div className="h-[calc(100vh-56px)]">
        <XTerminal
          mode="shell"
          challengeId={challengeId}
          databaseName={databaseName}
          onQueryResult={onResult}
          onQueryError={onError}
        />
      </div>
    </div>
  );
}

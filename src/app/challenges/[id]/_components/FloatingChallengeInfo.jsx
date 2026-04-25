import { CheckCircle, X, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LevelBadge } from "./atoms";

export function FloatingChallengeInfo({
  challenge,
  isCompleted,
  showHint,
  onToggleHint,
  onClose,
}) {
  return (
    <div className="absolute top-16 right-4 z-10 max-w-md">
      <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <LevelBadge level={challenge.level} />
              {isCompleted && (
                <Badge className="bg-[#19aa59]/10 text-[#19aa59] border-0 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Done
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <h3 className="font-semibold text-[#030914] text-sm mb-2">
            {challenge.name || `Challenge #${challenge.id}`}
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
            {challenge.statement}
          </p>
          {challenge.help && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleHint}
              className="mt-2 p-0 h-auto text-blue-600 hover:text-blue-700 text-xs"
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              {showHint ? "Hide Hint" : "Show Hint"}
            </Button>
          )}
          {showHint && challenge.help && (
            <p className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded">
              {challenge.help}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

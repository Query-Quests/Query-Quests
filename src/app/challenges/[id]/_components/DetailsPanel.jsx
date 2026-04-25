import {
  CheckCircle,
  Trophy,
  Users,
  Clock,
  GraduationCap,
  Code,
  Lightbulb,
  TrendingUp,
  Star,
  Target,
  Zap,
  Award,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LevelBadge, StatItem } from "./atoms";

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export function DetailsPanel({
  challenge,
  isExpanded,
  isCompleted,
  attempts,
  score,
  showHint,
  onToggleHint,
  showSolution,
  onToggleSolution,
}) {
  return (
    <div
      className={`bg-white flex flex-col overflow-y-auto border-l border-gray-200 transition-all duration-300 ${
        isExpanded ? "w-0 overflow-hidden" : "w-1/2"
      }`}
    >
      <Header challenge={challenge} isCompleted={isCompleted} />

      <div className="flex-1 p-6 space-y-6">
        <StatementSection statement={challenge.statement} />

        {challenge.help && (
          <HintSection help={challenge.help} showHint={showHint} onToggle={onToggleHint} />
        )}

        <StatsSection
          challenge={challenge}
          attempts={attempts}
          isCompleted={isCompleted}
          score={score}
        />

        <SolutionSection
          solution={challenge.solution}
          showSolution={showSolution}
          isCompleted={isCompleted}
          onToggle={onToggleSolution}
        />
      </div>
    </div>
  );
}

function Header({ challenge, isCompleted }) {
  return (
    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <LevelBadge level={challenge.level} />
          {isCompleted && (
            <Badge className="bg-[#19aa59]/10 text-[#19aa59] border-0">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-[#19aa59] to-emerald-600 rounded-xl flex items-center justify-center">
            <Trophy className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-[#030914] mb-3">
        {challenge.name || `SQL Challenge #${challenge.id}`}
      </h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          <span>{challenge.solves} solves</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span>{formatDate(challenge.created_at)}</span>
        </div>
        {challenge.institution && (
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4" />
            <span>{challenge.institution.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatementSection({ statement }) {
  return (
    <div>
      <h3 className="font-semibold text-[#030914] mb-3 flex items-center gap-2">
        <div className="w-6 h-6 bg-[#19aa59]/10 rounded-lg flex items-center justify-center">
          <Code className="h-3.5 w-3.5 text-[#19aa59]" />
        </div>
        Challenge Statement
      </h3>
      <Card className="border-0 shadow-sm bg-gray-50">
        <CardContent className="p-4">
          <p className="text-gray-700 leading-relaxed">{statement}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function HintSection({ help, showHint, onToggle }) {
  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="mb-2 p-0 h-auto text-blue-600 hover:text-blue-700 hover:bg-transparent"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
            <Lightbulb className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <span className="font-semibold">{showHint ? "Hide Hint" : "Need a Hint?"}</span>
        </div>
      </Button>
      {showHint && (
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">{help}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatsSection({ challenge, attempts, isCompleted, score }) {
  return (
    <div>
      <h3 className="font-semibold text-[#030914] mb-3 flex items-center gap-2">
        <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center">
          <TrendingUp className="h-3.5 w-3.5 text-violet-600" />
        </div>
        Challenge Stats
      </h3>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 divide-y divide-gray-100">
          <StatItem icon={Star} label="Base Score" value={challenge.score_base} />
          <StatItem icon={Target} label="Minimum Score" value={challenge.score_min} />
          <StatItem icon={Zap} label="Your Attempts" value={attempts} />
          {isCompleted && (
            <div className="pt-3">
              <div className="flex items-center justify-between bg-[#19aa59]/10 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-[#19aa59]">
                  <Award className="h-4 w-4" />
                  <span className="text-sm font-medium">Your Score</span>
                </div>
                <span className="font-bold text-[#19aa59] text-lg">{score}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SolutionSection({ solution, showSolution, isCompleted, onToggle }) {
  return (
    <div>
      <h3 className="font-semibold text-[#030914] mb-3 flex items-center gap-2">
        <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
          <Eye className="h-3.5 w-3.5 text-amber-600" />
        </div>
        Solution
      </h3>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className={`w-full mb-3 ${
          isCompleted
            ? "border-[#19aa59]/30 text-[#19aa59] hover:bg-[#19aa59]/10"
            : "border-gray-200 text-gray-400"
        }`}
        disabled={!isCompleted}
      >
        {showSolution ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
        {showSolution ? "Hide Solution" : "View Solution"}
      </Button>
      {!isCompleted && (
        <p className="text-xs text-gray-500 text-center">
          Complete the challenge to unlock the solution
        </p>
      )}
      {showSolution && isCompleted && (
        <Card className="border-0 shadow-sm bg-[#030914]">
          <CardContent className="p-4">
            <code className="text-sm text-[#19aa59] whitespace-pre-wrap font-mono">
              {solution}
            </code>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

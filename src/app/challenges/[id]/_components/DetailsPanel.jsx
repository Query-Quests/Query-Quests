import {
  Bookmark,
  Code,
  Lightbulb,
  TrendingUp,
  Star,
  Target,
  Zap,
  Eye,
  Lock,
  CheckCircle,
} from "lucide-react";
import { LevelBadge, SectionHeader, StatRow } from "./atoms";

const MONO = {
  fontFamily: "var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace",
};

export function DetailsPanel({
  challenge,
  isCompleted,
  attempts,
  showHint,
  onToggleHint,
}) {
  return (
    <div className="flex w-1/2 flex-col overflow-y-auto border-l border-gray-200 bg-white">
      <Header challenge={challenge} isCompleted={isCompleted} />
      <div className="flex flex-col gap-6 px-8 py-6">
        <StatementSection
          statement={challenge.statement}
          showHint={showHint}
          help={challenge.help}
          onToggleHint={onToggleHint}
        />
        <StatsSection
          challenge={challenge}
          attempts={attempts}
          isCompleted={isCompleted}
        />
        <SolutionSection
          solution={challenge.solution}
          isCompleted={isCompleted}
        />
      </div>
    </div>
  );
}

function Header({ challenge, isCompleted }) {
  return (
    <div className="flex flex-col gap-[14px] border-b border-gray-200 px-8 py-6">
      <div className="flex items-center justify-between">
        <LevelBadge level={challenge.level} />
        <button
          type="button"
          aria-label="Bookmark challenge"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:text-[#030914] hover:bg-gray-50 transition"
        >
          <Bookmark className="h-3.5 w-3.5" />
        </button>
      </div>
      <h1
        className="text-[24px] font-bold text-[#030914] leading-[1.3]"
        style={{ letterSpacing: "-0.4px" }}
      >
        {challenge.name || `SQL Challenge #${challenge.id}`}
      </h1>
      <div className="flex items-center gap-3 text-[12px] text-gray-500">
        <span style={MONO}>{challenge.solves ?? 0} solves</span>
        {challenge.institution && <span>· {challenge.institution.name}</span>}
        {isCompleted && (
          <span className="inline-flex items-center gap-1 text-[#19aa59]">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        )}
      </div>
    </div>
  );
}

function StatementSection({ statement, showHint, help, onToggleHint }) {
  return (
    <div className="flex flex-col gap-2">
      <SectionHeader icon={Code} iconColor="#19aa59" label="CHALLENGE STATEMENT" />
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-[13px] leading-[1.6] text-[#030914]">{statement}</p>
      </div>
      {help && (
        <button
          type="button"
          onClick={onToggleHint}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-[14px] py-[10px] text-[13px] font-semibold text-[#030914] hover:bg-gray-50 transition"
        >
          <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-[5px] border border-gray-200 bg-gray-100">
            <Lightbulb className="h-[13px] w-[13px] text-[#030914]" />
          </span>
          {showHint ? "Hide hint" : "Reveal a hint"}
        </button>
      )}
      {showHint && help && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] leading-[1.6] text-blue-800">
          {help}
        </div>
      )}
    </div>
  );
}

function StatsSection({ challenge, attempts, isCompleted }) {
  return (
    <div className="flex flex-col gap-2">
      <SectionHeader icon={TrendingUp} iconColor="#7c3aed" label="CHALLENGE STATS" />
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <StatRow icon={Star} label="Base Score" value={challenge.initial_score ?? challenge.score_base ?? "—"} />
        <StatRow icon={Target} label="Minimum Score" value={challenge.score_min ?? "—"} />
        <StatRow icon={Zap} label="Your Attempts" value={attempts} isLast={!isCompleted} />
        {isCompleted && (
          <StatRow
            icon={CheckCircle}
            label="Your Score"
            value={challenge.current_score ?? challenge.initial_score ?? "—"}
            isLast
          />
        )}
      </div>
    </div>
  );
}

function SolutionSection({ solution, isCompleted }) {
  return (
    <div className="flex flex-col gap-2">
      <SectionHeader icon={Eye} iconColor="#854d0e" label="SOLUTION" />
      {!isCompleted ? (
        <div className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-[14px] py-3 text-[12px] font-medium text-gray-500">
          <Lock className="h-3.5 w-3.5" />
          Complete challenge to unlock
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-[#030914] p-4">
          <pre
            className="whitespace-pre-wrap break-words text-[13px] leading-[1.6] text-[#30c888]"
            style={MONO}
          >
            {solution}
          </pre>
        </div>
      )}
    </div>
  );
}

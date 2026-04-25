const LEVELS = {
  1: { label: "Beginner", color: "bg-emerald-500", textColor: "text-emerald-700", bgColor: "bg-emerald-50" },
  2: { label: "Easy", color: "bg-[#19aa59]", textColor: "text-[#19aa59]", bgColor: "bg-[#19aa59]/10" },
  3: { label: "Medium", color: "bg-amber-500", textColor: "text-amber-700", bgColor: "bg-amber-50" },
  4: { label: "Hard", color: "bg-orange-500", textColor: "text-orange-700", bgColor: "bg-orange-50" },
  5: { label: "Expert", color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50" },
};

export function LevelBadge({ level }) {
  const config = LEVELS[level] || LEVELS[1];
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${config.bgColor}`}>
      <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
      <span className={`text-sm font-semibold ${config.textColor}`}>{config.label}</span>
    </div>
  );
}

export function StatItem({ icon: Icon, label, value, color = "text-[#030914]" }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

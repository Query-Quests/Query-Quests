// Level → display label and dot color, mirrors the Pencil "MEDIUM" pill.
const LEVELS = {
  1: { label: "BEGINNER", dot: "#10b981" },
  2: { label: "EASY",     dot: "#19aa59" },
  3: { label: "MEDIUM",   dot: "#f59e0b" },
  4: { label: "HARD",     dot: "#fb923c" },
  5: { label: "EXPERT",   dot: "#ef4444" },
};

export function LevelBadge({ level }) {
  const cfg = LEVELS[level] || LEVELS[1];
  return (
    <div className="inline-flex items-center gap-2 rounded-md">
      <span
        className="block h-[7px] w-[7px] rounded-full"
        style={{ backgroundColor: cfg.dot }}
      />
      <span
        className="text-[11px] font-bold text-[#030914]"
        style={{ letterSpacing: "1px" }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

// Section-header pattern from Pencil: 22×22 light-gray icon tile + ALL-CAPS
// muted label. Used on Statement / Stats / Solution sections.
export function SectionHeader({ icon: Icon, iconColor = "#19aa59", label }) {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-[5px] border border-gray-200 bg-gray-100">
        <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
      </div>
      <span
        className="text-[11px] font-bold text-gray-500"
        style={{ letterSpacing: "1px" }}
      >
        {label}
      </span>
    </div>
  );
}

// One row inside the stats card: muted icon + label on the left, navy-dark
// value on the right. Used three times.
export function StatRow({ icon: Icon, label, value, isLast }) {
  return (
    <div
      className={`flex items-center justify-between px-[14px] py-[10px] ${
        isLast ? "" : "border-b border-gray-200"
      }`}
    >
      <div className="flex items-center gap-2 text-gray-500">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[13px]">{label}</span>
      </div>
      <span className="text-[13px] font-bold text-[#030914]">{value}</span>
    </div>
  );
}

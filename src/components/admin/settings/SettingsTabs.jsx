"use client";

import { useState, createContext, useContext } from "react";
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Database,
  Users,
  Sparkles,
} from "lucide-react";

const tabs = [
  { id: "general", label: "General", icon: Settings },
  { id: "integrations", label: "Integrations", icon: Sparkles },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "users", label: "Users", icon: Users },
  { id: "system", label: "System", icon: Database },
];

const SettingsTabsContext = createContext({ active: "general" });

export function SettingsTabs({
  children,
  defaultValue = "general",
  onTabChange,
}) {
  const [active, setActive] = useState(defaultValue);

  const handleSelect = (id) => {
    setActive(id);
    onTabChange?.(id);
  };

  return (
    <SettingsTabsContext.Provider value={{ active }}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full lg:w-[220px] lg:flex-shrink-0">
          <p className="px-3 text-[11px] font-bold tracking-[2px] text-gray-500 mb-3">
            SETTINGS
          </p>
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const isActive = active === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelect(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-colors text-left ${
                    isActive
                      ? "bg-white border border-gray-200 text-[#030914] font-semibold"
                      : "text-gray-500 font-medium hover:bg-gray-100 border border-transparent"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      isActive ? "text-[#19aa59]" : "text-gray-500"
                    }`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col gap-6">{children}</div>
      </div>
    </SettingsTabsContext.Provider>
  );
}

export function SettingsTabContent({ value, children }) {
  const { active } = useContext(SettingsTabsContext);
  if (active !== value) return null;
  return <div className="flex flex-col gap-6">{children}</div>;
}

export { tabs };

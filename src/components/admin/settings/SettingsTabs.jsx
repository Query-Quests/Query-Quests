"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Database,
  Users
} from "lucide-react";

const tabs = [
  { id: "general", label: "General", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "users", label: "Users", icon: Users },
  { id: "system", label: "System", icon: Database },
];

export function SettingsTabs({ children, defaultValue = "general", onTabChange }) {
  return (
    <Tabs
      defaultValue={defaultValue}
      className="w-full space-y-6"
      onValueChange={onTabChange}
    >
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto gap-1 bg-muted/50 p-1">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}

export function SettingsTabContent({ value, children }) {
  return (
    <TabsContent value={value} className="mt-6 space-y-6">
      {children}
    </TabsContent>
  );
}

export { tabs };

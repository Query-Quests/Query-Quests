"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  SettingsTabs,
  SettingsTabContent,
  GeneralSettingsForm,
  IntegrationsSettingsForm,
  NotificationsSettingsForm,
  SecuritySettingsForm,
  AppearanceSettingsForm,
  UsersSettingsForm,
  SystemSettingsForm,
} from "@/components/admin/settings";

const defaultSettings = {
  // General
  platformName: "Query-Quest",
  platformUrl: "",
  contactEmail: "",
  language: "en",
  timezone: "UTC",

  // Notifications
  emailNotificationsEnabled: true,
  notifyNewUsers: true,
  notifyChallengeComplete: true,
  weeklyReportsEnabled: false,
  maintenanceAlerts: true,
  securityAlerts: true,

  // Security
  emailVerificationRequired: false,
  twoFactorEnabled: false,
  sessionTimeout: 60,
  minPasswordLength: 8,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: false,

  // Appearance
  theme: "system",
  primaryColor: "blue",
  showLogo: true,
  compactMode: false,

  // Users
  maxUsersPerInstitution: 1000,
  maxChallengesPerUser: 50,
  defaultUserRole: "student",
  pointsPerChallenge: 100,
  allowSelfRegistration: true,
  requireInstitution: false,

  // System
  maintenanceMode: false,
  maintenanceMessage: "",
};

const TAB_HEADINGS = {
  general: {
    title: "Organization settings",
    subtitle: "Settings applied across the entire QueryQuest instance.",
  },
  integrations: {
    title: "Integrations",
    subtitle: "External services used by QueryQuest, such as the Anthropic API for the in-app AI tutor.",
  },
  notifications: {
    title: "Notification settings",
    subtitle: "Decide which events trigger emails and in-app alerts.",
  },
  security: {
    title: "Security & authentication",
    subtitle: "Tighten access, sessions, and password policies.",
  },
  appearance: {
    title: "Appearance",
    subtitle: "Customize the look and feel of the platform.",
  },
  users: {
    title: "User & registration settings",
    subtitle: "Limits, defaults, and how new accounts are created.",
  },
  system: {
    title: "System",
    subtitle: "Maintenance, data export, and destructive actions.",
  },
};

export default function AdminSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSettings(defaultSettings);
      setOriginalSettings(defaultSettings);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOriginalSettings(settings);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings(originalSettings);
  };

  const handleExportData = async () => {
    try {
      toast.info("Export functionality would download platform data as JSON");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  const handleImportData = async () => {
    toast.info("Import functionality would allow uploading data from a file");
  };

  const handleResetSystem = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset the system? This action cannot be undone."
      )
    ) {
      try {
        toast.info("System reset would clear all data and restore defaults");
      } catch (error) {
        console.error("Error resetting system:", error);
        toast.error("Failed to reset system");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#19aa59]" />
      </div>
    );
  }

  const heading = TAB_HEADINGS[activeTab] ?? TAB_HEADINGS.general;

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <SettingsTabs defaultValue={activeTab} onTabChange={setActiveTab}>
        <header className="flex flex-col gap-1.5">
          <h1 className="text-[28px] font-bold text-[#030914] tracking-[-1px] leading-tight">
            {heading.title}
          </h1>
          <p className="text-sm text-gray-500">{heading.subtitle}</p>
        </header>

        <SettingsTabContent value="general">
          <GeneralSettingsForm
            settings={settings}
            onChange={handleSettingChange}
          />
        </SettingsTabContent>

        <SettingsTabContent value="integrations">
          <IntegrationsSettingsForm />
        </SettingsTabContent>

        <SettingsTabContent value="notifications">
          <NotificationsSettingsForm
            settings={settings}
            onChange={handleSettingChange}
          />
        </SettingsTabContent>

        <SettingsTabContent value="security">
          <SecuritySettingsForm
            settings={settings}
            onChange={handleSettingChange}
          />
        </SettingsTabContent>

        <SettingsTabContent value="appearance">
          <AppearanceSettingsForm
            settings={settings}
            onChange={handleSettingChange}
          />
        </SettingsTabContent>

        <SettingsTabContent value="users">
          <UsersSettingsForm
            settings={settings}
            onChange={handleSettingChange}
          />
        </SettingsTabContent>

        <SettingsTabContent value="system">
          <SystemSettingsForm
            settings={settings}
            onChange={handleSettingChange}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetSystem={handleResetSystem}
          />
        </SettingsTabContent>

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={!hasChanges || isSaving}
            className="inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-[#030914] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving || !hasChanges}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#19aa59] hover:bg-[#15934d] px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </SettingsTabs>
    </div>
  );
}

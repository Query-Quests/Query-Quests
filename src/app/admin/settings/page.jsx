"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  SettingsTabs,
  SettingsTabContent,
  GeneralSettingsForm,
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
      // In a real app, fetch settings from API
      // const response = await fetch("/api/admin/settings");
      // const data = await response.json();
      // setSettings(data);
      // setOriginalSettings(data);

      // Simulate API call
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

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // In a real app, save settings to API
      // await fetch("/api/admin/settings", {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(settings),
      // });

      // Simulate API call
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

  const handleExportData = async () => {
    try {
      // In a real app, this would trigger a download
      // const response = await fetch("/api/admin/export-data");
      // const blob = await response.blob();
      // ...

      toast.info("Export functionality would download platform data as JSON");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  const handleImportData = async () => {
    // In a real app, this would open a file picker
    toast.info("Import functionality would allow uploading data from a file");
  };

  const handleResetSystem = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset the system? This action cannot be undone."
      )
    ) {
      try {
        // await fetch("/api/admin/reset-system", { method: "POST" });
        toast.info("System reset would clear all data and restore defaults");
      } catch (error) {
        console.error("Error resetting system:", error);
        toast.error("Failed to reset system");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Settings</h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Configure platform settings and system preferences
          </p>
        </div>
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving || !hasChanges}
          className="w-full sm:w-auto"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Tabs */}
      <SettingsTabs defaultValue={activeTab} onTabChange={setActiveTab}>
        <SettingsTabContent value="general">
          <GeneralSettingsForm
            settings={settings}
            onChange={handleSettingChange}
          />
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
      </SettingsTabs>
    </div>
  );
}

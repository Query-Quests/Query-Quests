"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Save, 
  Database, 
  Users, 
  Shield, 
  Bell,
  Palette,
  Globe,
  Lock,
  Download,
  Upload,
  RefreshCw
} from "lucide-react";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    platformName: "Query-Quest",
    maxUsersPerInstitution: 1000,
    defaultUserRole: "student",
    enableEmailVerification: false,
    maintenanceMode: false,
    theme: "light",
    language: "en",
    maxChallengesPerUser: 50,
    pointsPerChallenge: 100,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // In a real app, you'd fetch settings from an API
      // For now, we'll use the default settings
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error loading settings:", error);
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // In a real app, you'd save settings to an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Settings saved:", settings);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/admin/export-data");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `query-quest-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const handleResetSystem = async () => {
    if (window.confirm("Are you sure you want to reset the system? This action cannot be undone.")) {
      try {
        const response = await fetch("/api/admin/reset-system", {
          method: "POST",
        });
        if (response.ok) {
          alert("System reset successfully");
        }
      } catch (error) {
        console.error("Error resetting system:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Configure platform settings and system preferences
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="w-full lg:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* System Actions Row */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Actions
          </h2>
          <p className="text-muted-foreground text-sm">
            Administrative actions and data management
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5" />
                <div>
                  <Label className="text-base font-medium">Export Data</Label>
                  <p className="text-sm text-muted-foreground">Download all platform data as JSON</p>
                </div>
              </div>
            </div>
            <div className="w-80 flex justify-end">
              <Button variant="outline" onClick={handleExportData}>
                Export Data
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5" />
                <div>
                  <Label className="text-base font-medium">Import Data</Label>
                  <p className="text-sm text-muted-foreground">Upload and restore data from file</p>
                </div>
              </div>
            </div>
            <div className="w-80 flex justify-end">
              <Button variant="outline">
                Import Data
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5" />
                <div>
                  <Label className="text-base font-medium">Clear Cache</Label>
                  <p className="text-sm text-muted-foreground">Clear all cached data and reset cache</p>
                </div>
              </div>
            </div>
            <div className="w-80 flex justify-end">
              <Button variant="outline">
                Clear Cache
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5" />
                <div>
                  <Label className="text-base font-medium">Reset System</Label>
                  <p className="text-sm text-muted-foreground">Reset entire system - dangerous action</p>
                </div>
              </div>
            </div>
            <div className="w-80 flex justify-end">
              <Button 
                variant="destructive" 
                onClick={handleResetSystem}
              >
                Reset System
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
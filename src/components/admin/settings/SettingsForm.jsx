"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Base form wrapper component
export function SettingsFormCard({ title, description, children }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
      </CardContent>
    </Card>
  );
}

// Form field wrapper for consistent layout
export function SettingsFormField({ label, description, children, horizontal = false }) {
  if (horizontal) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3">
        <div className="space-y-0.5 flex-1">
          <Label className="text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="sm:w-auto">{children}</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}

// Toggle setting field
export function SettingsToggle({ label, description, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium cursor-pointer">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// General Settings Form
export function GeneralSettingsForm({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <SettingsFormCard
        title="Platform Information"
        description="Configure basic platform settings"
      >
        <SettingsFormField label="Platform Name" description="The name displayed across the platform">
          <Input
            value={settings.platformName || ""}
            onChange={(e) => onChange("platformName", e.target.value)}
            placeholder="Query-Quest"
          />
        </SettingsFormField>

        <SettingsFormField label="Platform URL" description="The base URL for your platform">
          <Input
            value={settings.platformUrl || ""}
            onChange={(e) => onChange("platformUrl", e.target.value)}
            placeholder="https://query-quest.com"
          />
        </SettingsFormField>

        <SettingsFormField label="Contact Email" description="Primary contact email for support">
          <Input
            type="email"
            value={settings.contactEmail || ""}
            onChange={(e) => onChange("contactEmail", e.target.value)}
            placeholder="support@query-quest.com"
          />
        </SettingsFormField>
      </SettingsFormCard>

      <SettingsFormCard
        title="Regional Settings"
        description="Configure language and timezone"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <SettingsFormField label="Language">
            <Select
              value={settings.language || "en"}
              onValueChange={(value) => onChange("language", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
              </SelectContent>
            </Select>
          </SettingsFormField>

          <SettingsFormField label="Timezone">
            <Select
              value={settings.timezone || "UTC"}
              onValueChange={(value) => onChange("timezone", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </SettingsFormField>
        </div>
      </SettingsFormCard>
    </div>
  );
}

// Notifications Settings Form
export function NotificationsSettingsForm({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <SettingsFormCard
        title="Email Notifications"
        description="Configure email notification preferences"
      >
        <SettingsToggle
          label="Enable Email Notifications"
          description="Send email notifications to users"
          checked={settings.emailNotificationsEnabled ?? true}
          onCheckedChange={(checked) => onChange("emailNotificationsEnabled", checked)}
        />
        <Separator />
        <SettingsToggle
          label="New User Registration"
          description="Notify admins when new users register"
          checked={settings.notifyNewUsers ?? true}
          onCheckedChange={(checked) => onChange("notifyNewUsers", checked)}
        />
        <Separator />
        <SettingsToggle
          label="Challenge Completion"
          description="Notify users when they complete a challenge"
          checked={settings.notifyChallengeComplete ?? true}
          onCheckedChange={(checked) => onChange("notifyChallengeComplete", checked)}
        />
        <Separator />
        <SettingsToggle
          label="Weekly Progress Reports"
          description="Send weekly progress reports to users"
          checked={settings.weeklyReportsEnabled ?? false}
          onCheckedChange={(checked) => onChange("weeklyReportsEnabled", checked)}
        />
      </SettingsFormCard>

      <SettingsFormCard
        title="System Notifications"
        description="Configure system-level notifications"
      >
        <SettingsToggle
          label="Maintenance Alerts"
          description="Notify users about scheduled maintenance"
          checked={settings.maintenanceAlerts ?? true}
          onCheckedChange={(checked) => onChange("maintenanceAlerts", checked)}
        />
        <Separator />
        <SettingsToggle
          label="Security Alerts"
          description="Send alerts for security-related events"
          checked={settings.securityAlerts ?? true}
          onCheckedChange={(checked) => onChange("securityAlerts", checked)}
        />
      </SettingsFormCard>
    </div>
  );
}

// Security Settings Form
export function SecuritySettingsForm({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <SettingsFormCard
        title="Authentication"
        description="Configure authentication and access settings"
      >
        <SettingsToggle
          label="Email Verification Required"
          description="Require users to verify their email before accessing the platform"
          checked={settings.emailVerificationRequired ?? false}
          onCheckedChange={(checked) => onChange("emailVerificationRequired", checked)}
        />
        <Separator />
        <SettingsToggle
          label="Two-Factor Authentication"
          description="Enable 2FA for admin accounts"
          checked={settings.twoFactorEnabled ?? false}
          onCheckedChange={(checked) => onChange("twoFactorEnabled", checked)}
        />
        <Separator />
        <SettingsFormField
          label="Session Timeout"
          description="Auto-logout after inactivity (in minutes)"
          horizontal
        >
          <Select
            value={settings.sessionTimeout?.toString() || "60"}
            onValueChange={(value) => onChange("sessionTimeout", parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 min</SelectItem>
              <SelectItem value="30">30 min</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
              <SelectItem value="480">8 hours</SelectItem>
            </SelectContent>
          </Select>
        </SettingsFormField>
      </SettingsFormCard>

      <SettingsFormCard
        title="Password Policy"
        description="Configure password requirements"
      >
        <SettingsFormField
          label="Minimum Password Length"
          horizontal
        >
          <Select
            value={settings.minPasswordLength?.toString() || "8"}
            onValueChange={(value) => onChange("minPasswordLength", parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 characters</SelectItem>
              <SelectItem value="8">8 characters</SelectItem>
              <SelectItem value="10">10 characters</SelectItem>
              <SelectItem value="12">12 characters</SelectItem>
            </SelectContent>
          </Select>
        </SettingsFormField>
        <Separator />
        <SettingsToggle
          label="Require Uppercase Letters"
          description="Passwords must contain at least one uppercase letter"
          checked={settings.requireUppercase ?? true}
          onCheckedChange={(checked) => onChange("requireUppercase", checked)}
        />
        <Separator />
        <SettingsToggle
          label="Require Numbers"
          description="Passwords must contain at least one number"
          checked={settings.requireNumbers ?? true}
          onCheckedChange={(checked) => onChange("requireNumbers", checked)}
        />
        <Separator />
        <SettingsToggle
          label="Require Special Characters"
          description="Passwords must contain at least one special character"
          checked={settings.requireSpecialChars ?? false}
          onCheckedChange={(checked) => onChange("requireSpecialChars", checked)}
        />
      </SettingsFormCard>
    </div>
  );
}

// Appearance Settings Form
export function AppearanceSettingsForm({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <SettingsFormCard
        title="Theme"
        description="Customize the look and feel"
      >
        <SettingsFormField label="Color Theme">
          <Select
            value={settings.theme || "system"}
            onValueChange={(value) => onChange("theme", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System Default</SelectItem>
            </SelectContent>
          </Select>
        </SettingsFormField>

        <SettingsFormField label="Primary Color">
          <Select
            value={settings.primaryColor || "blue"}
            onValueChange={(value) => onChange("primaryColor", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="purple">Purple</SelectItem>
              <SelectItem value="orange">Orange</SelectItem>
              <SelectItem value="red">Red</SelectItem>
            </SelectContent>
          </Select>
        </SettingsFormField>
      </SettingsFormCard>

      <SettingsFormCard
        title="Branding"
        description="Customize platform branding"
      >
        <SettingsToggle
          label="Show Logo"
          description="Display the platform logo in the header"
          checked={settings.showLogo ?? true}
          onCheckedChange={(checked) => onChange("showLogo", checked)}
        />
        <Separator />
        <SettingsToggle
          label="Compact Mode"
          description="Use a more compact layout with less whitespace"
          checked={settings.compactMode ?? false}
          onCheckedChange={(checked) => onChange("compactMode", checked)}
        />
      </SettingsFormCard>
    </div>
  );
}

// Users Settings Form
export function UsersSettingsForm({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <SettingsFormCard
        title="User Limits"
        description="Configure user limits and quotas"
      >
        <SettingsFormField
          label="Max Users per Institution"
          description="Maximum number of users allowed per institution"
        >
          <Input
            type="number"
            value={settings.maxUsersPerInstitution || 1000}
            onChange={(e) => onChange("maxUsersPerInstitution", parseInt(e.target.value))}
            min={1}
          />
        </SettingsFormField>

        <SettingsFormField
          label="Max Challenges per User"
          description="Maximum number of challenges a user can create"
        >
          <Input
            type="number"
            value={settings.maxChallengesPerUser || 50}
            onChange={(e) => onChange("maxChallengesPerUser", parseInt(e.target.value))}
            min={1}
          />
        </SettingsFormField>
      </SettingsFormCard>

      <SettingsFormCard
        title="Default Settings"
        description="Default settings for new users"
      >
        <SettingsFormField label="Default User Role">
          <Select
            value={settings.defaultUserRole || "student"}
            onValueChange={(value) => onChange("defaultUserRole", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
            </SelectContent>
          </Select>
        </SettingsFormField>

        <SettingsFormField
          label="Points per Challenge"
          description="Default points awarded for completing a challenge"
        >
          <Input
            type="number"
            value={settings.pointsPerChallenge || 100}
            onChange={(e) => onChange("pointsPerChallenge", parseInt(e.target.value))}
            min={1}
          />
        </SettingsFormField>
      </SettingsFormCard>

      <SettingsFormCard
        title="Registration"
        description="Configure user registration settings"
      >
        <SettingsToggle
          label="Allow Self Registration"
          description="Allow users to create their own accounts"
          checked={settings.allowSelfRegistration ?? true}
          onCheckedChange={(checked) => onChange("allowSelfRegistration", checked)}
        />
        <Separator />
        <SettingsToggle
          label="Require Institution"
          description="Require users to select an institution during registration"
          checked={settings.requireInstitution ?? false}
          onCheckedChange={(checked) => onChange("requireInstitution", checked)}
        />
      </SettingsFormCard>
    </div>
  );
}

// System Settings Form
export function SystemSettingsForm({ settings, onChange, onExportData, onImportData, onResetSystem }) {
  return (
    <div className="space-y-6">
      <SettingsFormCard
        title="Maintenance"
        description="System maintenance options"
      >
        <SettingsToggle
          label="Maintenance Mode"
          description="Put the platform in maintenance mode (only admins can access)"
          checked={settings.maintenanceMode ?? false}
          onCheckedChange={(checked) => onChange("maintenanceMode", checked)}
        />
        <Separator />
        <SettingsFormField
          label="Maintenance Message"
          description="Message shown to users during maintenance"
        >
          <Input
            value={settings.maintenanceMessage || ""}
            onChange={(e) => onChange("maintenanceMessage", e.target.value)}
            placeholder="The platform is currently under maintenance..."
          />
        </SettingsFormField>
      </SettingsFormCard>

      <SettingsFormCard
        title="Data Management"
        description="Export, import, and manage platform data"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Export Data</Label>
              <p className="text-xs text-muted-foreground">Download all platform data as JSON</p>
            </div>
            <Button variant="outline" onClick={onExportData}>
              Export Data
            </Button>
          </div>
          <Separator />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Import Data</Label>
              <p className="text-xs text-muted-foreground">Upload and restore data from file</p>
            </div>
            <Button variant="outline" onClick={onImportData}>
              Import Data
            </Button>
          </div>
        </div>
      </SettingsFormCard>

      <SettingsFormCard
        title="Danger Zone"
        description="Irreversible system actions"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium text-destructive">Reset System</Label>
            <p className="text-xs text-muted-foreground">
              This will permanently delete all data and reset the system
            </p>
          </div>
          <Button variant="destructive" onClick={onResetSystem}>
            Reset System
          </Button>
        </div>
      </SettingsFormCard>
    </div>
  );
}

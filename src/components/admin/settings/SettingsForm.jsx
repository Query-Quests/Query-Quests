"use client";

import { Button } from "@/components/ui/button";

const inputClass =
  "w-full px-3.5 py-2.5 text-sm text-[#030914] font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/20";

const selectClass =
  "w-full appearance-none px-3.5 py-2.5 pr-9 text-sm text-[#030914] font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/20 bg-no-repeat bg-[right_0.75rem_center] bg-[length:14px_14px] bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2214%22 height=%2214%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%222.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')]";

// Card wrapper — matches Pencil setCard (rounded-xl, white, border, p-7)
export function SettingsFormCard({ title, description, children }) {
  return (
    <section className="rounded-xl bg-white border border-gray-200 p-7 flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-[#030914]">{title}</h2>
        {description && (
          <p className="text-[13px] text-gray-500">{description}</p>
        )}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

// Horizontal label-on-left / control-on-right field row (Pencil setF*)
export function SettingsFormField({ label, description, children, horizontal = true }) {
  if (!horizontal) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-[#030914]">{label}</span>
          {description && (
            <span className="text-xs text-gray-500">{description}</span>
          )}
        </div>
        {children}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
      <div className="sm:w-[240px] sm:flex-shrink-0 flex flex-col gap-1 pt-1.5">
        <span className="text-[13px] font-semibold text-[#030914]">{label}</span>
        {description && (
          <span className="text-xs text-gray-500">{description}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// Pencil-style toggle row (label/desc left, switch right)
export function SettingsToggle({ label, description, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between gap-5">
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-[13px] font-semibold text-[#030914]">{label}</span>
        {description && (
          <span className="text-xs text-gray-500">{description}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        onClick={() => onCheckedChange?.(!checked)}
        className={`flex-shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-[#19aa59] justify-end" : "bg-gray-300 justify-start"
        } p-0.5`}
      >
        <span className="inline-block h-5 w-5 rounded-full bg-white shadow" />
      </button>
    </div>
  );
}

// Native input/select wrappers used inside fields
function TextInput(props) {
  return <input {...props} className={inputClass} />;
}

function SelectInput({ value, onChange, children }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} className={selectClass}>
        {children}
      </select>
    </div>
  );
}

// ---------- General ----------
export function GeneralSettingsForm({ settings, onChange }) {
  return (
    <>
      <SettingsFormCard
        title="Platform Information"
        description="Configure basic platform settings"
      >
        <SettingsFormField
          label="Platform name"
          description="Shown in emails and browser tabs"
        >
          <TextInput
            value={settings.platformName || ""}
            onChange={(e) => onChange("platformName", e.target.value)}
            placeholder="Query-Quest"
          />
        </SettingsFormField>

        <SettingsFormField
          label="Platform URL"
          description="The base URL for your platform"
        >
          <TextInput
            value={settings.platformUrl || ""}
            onChange={(e) => onChange("platformUrl", e.target.value)}
            placeholder="https://query-quest.com"
          />
        </SettingsFormField>

        <SettingsFormField
          label="Support email"
          description="Reply-to address for system emails"
        >
          <TextInput
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
        <SettingsFormField label="Language" description="Default platform language">
          <SelectInput
            value={settings.language || "en"}
            onChange={(e) => onChange("language", e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="pt">Portuguese</option>
          </SelectInput>
        </SettingsFormField>

        <SettingsFormField
          label="Default timezone"
          description="Used for leaderboard resets & activity logs"
        >
          <SelectInput
            value={settings.timezone || "UTC"}
            onChange={(e) => onChange("timezone", e.target.value)}
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </SelectInput>
        </SettingsFormField>
      </SettingsFormCard>
    </>
  );
}

// ---------- Notifications ----------
export function NotificationsSettingsForm({ settings, onChange }) {
  return (
    <>
      <SettingsFormCard
        title="Email Notifications"
        description="Configure email notification preferences"
      >
        <SettingsToggle
          label="Enable email notifications"
          description="Send email notifications to users"
          checked={settings.emailNotificationsEnabled ?? true}
          onCheckedChange={(v) => onChange("emailNotificationsEnabled", v)}
        />
        <SettingsToggle
          label="New user registration"
          description="Notify admins when new users register"
          checked={settings.notifyNewUsers ?? true}
          onCheckedChange={(v) => onChange("notifyNewUsers", v)}
        />
        <SettingsToggle
          label="Challenge completion"
          description="Notify users when they complete a challenge"
          checked={settings.notifyChallengeComplete ?? true}
          onCheckedChange={(v) => onChange("notifyChallengeComplete", v)}
        />
        <SettingsToggle
          label="Weekly progress reports"
          description="Send weekly progress reports to users"
          checked={settings.weeklyReportsEnabled ?? false}
          onCheckedChange={(v) => onChange("weeklyReportsEnabled", v)}
        />
      </SettingsFormCard>

      <SettingsFormCard
        title="System Notifications"
        description="Configure system-level notifications"
      >
        <SettingsToggle
          label="Maintenance alerts"
          description="Notify users about scheduled maintenance"
          checked={settings.maintenanceAlerts ?? true}
          onCheckedChange={(v) => onChange("maintenanceAlerts", v)}
        />
        <SettingsToggle
          label="Security alerts"
          description="Send alerts for security-related events"
          checked={settings.securityAlerts ?? true}
          onCheckedChange={(v) => onChange("securityAlerts", v)}
        />
      </SettingsFormCard>
    </>
  );
}

// ---------- Security ----------
export function SecuritySettingsForm({ settings, onChange }) {
  return (
    <>
      <SettingsFormCard
        title="Authentication"
        description="Configure authentication and access settings"
      >
        <SettingsToggle
          label="Email verification required"
          description="Require users to verify their email before accessing the platform"
          checked={settings.emailVerificationRequired ?? false}
          onCheckedChange={(v) => onChange("emailVerificationRequired", v)}
        />
        <SettingsToggle
          label="Two-factor authentication"
          description="Enable 2FA for admin accounts"
          checked={settings.twoFactorEnabled ?? false}
          onCheckedChange={(v) => onChange("twoFactorEnabled", v)}
        />
        <SettingsFormField
          label="Session timeout"
          description="Auto-logout after inactivity"
        >
          <SelectInput
            value={(settings.sessionTimeout ?? 60).toString()}
            onChange={(e) => onChange("sessionTimeout", parseInt(e.target.value))}
          >
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="480">8 hours</option>
          </SelectInput>
        </SettingsFormField>
      </SettingsFormCard>

      <SettingsFormCard
        title="Password Policy"
        description="Configure password requirements"
      >
        <SettingsFormField
          label="Minimum password length"
          description="Strength baseline for new passwords"
        >
          <SelectInput
            value={(settings.minPasswordLength ?? 8).toString()}
            onChange={(e) => onChange("minPasswordLength", parseInt(e.target.value))}
          >
            <option value="6">6 characters</option>
            <option value="8">8 characters</option>
            <option value="10">10 characters</option>
            <option value="12">12 characters</option>
          </SelectInput>
        </SettingsFormField>
        <SettingsToggle
          label="Require uppercase letters"
          description="Passwords must contain at least one uppercase letter"
          checked={settings.requireUppercase ?? true}
          onCheckedChange={(v) => onChange("requireUppercase", v)}
        />
        <SettingsToggle
          label="Require numbers"
          description="Passwords must contain at least one number"
          checked={settings.requireNumbers ?? true}
          onCheckedChange={(v) => onChange("requireNumbers", v)}
        />
        <SettingsToggle
          label="Require special characters"
          description="Passwords must contain at least one special character"
          checked={settings.requireSpecialChars ?? false}
          onCheckedChange={(v) => onChange("requireSpecialChars", v)}
        />
      </SettingsFormCard>
    </>
  );
}

// ---------- Appearance ----------
export function AppearanceSettingsForm({ settings, onChange }) {
  return (
    <>
      <SettingsFormCard title="Theme" description="Customize the look and feel">
        <SettingsFormField
          label="Color theme"
          description="Light, dark, or follow system"
        >
          <SelectInput
            value={settings.theme || "system"}
            onChange={(e) => onChange("theme", e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System Default</option>
          </SelectInput>
        </SettingsFormField>

        <SettingsFormField
          label="Primary color"
          description="Accent used for buttons and highlights"
        >
          <SelectInput
            value={settings.primaryColor || "blue"}
            onChange={(e) => onChange("primaryColor", e.target.value)}
          >
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="purple">Purple</option>
            <option value="orange">Orange</option>
            <option value="red">Red</option>
          </SelectInput>
        </SettingsFormField>
      </SettingsFormCard>

      <SettingsFormCard title="Branding" description="Customize platform branding">
        <SettingsToggle
          label="Show logo"
          description="Display the platform logo in the header"
          checked={settings.showLogo ?? true}
          onCheckedChange={(v) => onChange("showLogo", v)}
        />
        <SettingsToggle
          label="Compact mode"
          description="Use a more compact layout with less whitespace"
          checked={settings.compactMode ?? false}
          onCheckedChange={(v) => onChange("compactMode", v)}
        />
      </SettingsFormCard>
    </>
  );
}

// ---------- Users ----------
export function UsersSettingsForm({ settings, onChange }) {
  return (
    <>
      <SettingsFormCard
        title="User Limits"
        description="Configure user limits and quotas"
      >
        <SettingsFormField
          label="Max users per institution"
          description="Maximum number of users allowed per institution"
        >
          <TextInput
            type="number"
            min={1}
            value={settings.maxUsersPerInstitution || 1000}
            onChange={(e) =>
              onChange("maxUsersPerInstitution", parseInt(e.target.value))
            }
          />
        </SettingsFormField>

        <SettingsFormField
          label="Max challenges per user"
          description="Maximum number of challenges a user can create"
        >
          <TextInput
            type="number"
            min={1}
            value={settings.maxChallengesPerUser || 50}
            onChange={(e) =>
              onChange("maxChallengesPerUser", parseInt(e.target.value))
            }
          />
        </SettingsFormField>
      </SettingsFormCard>

      <SettingsFormCard
        title="Default Settings"
        description="Default settings for new users"
      >
        <SettingsFormField
          label="Default user role"
          description="Role assigned to newly created users"
        >
          <SelectInput
            value={settings.defaultUserRole || "student"}
            onChange={(e) => onChange("defaultUserRole", e.target.value)}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </SelectInput>
        </SettingsFormField>

        <SettingsFormField
          label="Points per challenge"
          description="Default points awarded for completing a challenge"
        >
          <TextInput
            type="number"
            min={1}
            value={settings.pointsPerChallenge || 100}
            onChange={(e) =>
              onChange("pointsPerChallenge", parseInt(e.target.value))
            }
          />
        </SettingsFormField>
      </SettingsFormCard>

      <SettingsFormCard
        title="Registration"
        description="Configure user registration settings"
      >
        <SettingsToggle
          label="Allow public signup"
          description="Allow users to create their own accounts"
          checked={settings.allowSelfRegistration ?? true}
          onCheckedChange={(v) => onChange("allowSelfRegistration", v)}
        />
        <SettingsToggle
          label="Require institution"
          description="Require users to select an institution during registration"
          checked={settings.requireInstitution ?? false}
          onCheckedChange={(v) => onChange("requireInstitution", v)}
        />
      </SettingsFormCard>
    </>
  );
}

// ---------- System ----------
export function SystemSettingsForm({
  settings,
  onChange,
  onExportData,
  onImportData,
  onResetSystem,
}) {
  return (
    <>
      <SettingsFormCard
        title="Maintenance"
        description="System maintenance options"
      >
        <SettingsToggle
          label="Maintenance mode"
          description="Put the platform in maintenance mode (only admins can access)"
          checked={settings.maintenanceMode ?? false}
          onCheckedChange={(v) => onChange("maintenanceMode", v)}
        />
        <SettingsFormField
          label="Maintenance message"
          description="Message shown to users during maintenance"
        >
          <TextInput
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
        <div className="flex items-center justify-between gap-5">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[13px] font-semibold text-[#030914]">
              Export data
            </span>
            <span className="text-xs text-gray-500">
              Download all platform data as JSON
            </span>
          </div>
          <Button
            variant="outline"
            onClick={onExportData}
            className="bg-white border-gray-300 text-[#030914] hover:bg-gray-50 hover:text-[#030914] text-[13px] font-semibold rounded-lg h-auto px-4 py-2.5"
          >
            Export data
          </Button>
        </div>
        <div className="flex items-center justify-between gap-5">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[13px] font-semibold text-[#030914]">
              Import data
            </span>
            <span className="text-xs text-gray-500">
              Upload and restore data from file
            </span>
          </div>
          <Button
            variant="outline"
            onClick={onImportData}
            className="bg-white border-gray-300 text-[#030914] hover:bg-gray-50 hover:text-[#030914] text-[13px] font-semibold rounded-lg h-auto px-4 py-2.5"
          >
            Import data
          </Button>
        </div>
      </SettingsFormCard>

      <SettingsFormCard
        title="Danger Zone"
        description="Irreversible system actions"
      >
        <div className="flex items-center justify-between gap-5 rounded-lg border border-red-200 bg-red-50/40 p-4">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[13px] font-semibold text-red-700">
              Reset system
            </span>
            <span className="text-xs text-gray-500">
              This will permanently delete all data and reset the system
            </span>
          </div>
          <Button
            onClick={onResetSystem}
            className="bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold rounded-lg h-auto px-4 py-2.5"
          >
            Reset system
          </Button>
        </div>
      </SettingsFormCard>
    </>
  );
}

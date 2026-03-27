// Admin sidebar components
export {
  // Context and Provider
  SidebarProvider,
  useSidebar,

  // Core sidebar components
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarCollapseButton,

  // Mobile components
  MobileSidebar,
  MobileSidebarTrigger,

  // Navigation
  SidebarNav,

  // User profile
  SidebarUserProfile,

  // Utility components
  SidebarBackToHome,
  SidebarBranding,

  // Complete sidebar
  AdminSidebar,

  // Layout wrapper
  SidebarInset,
} from "./sidebar";

// Dashboard components
export { StatCard, StatCardSkeleton } from "./StatCard";
export {
  RecentActivityList,
  RecentActivityListSkeleton,
  UserActivityItem,
  ChallengeActivityItem,
  GenericActivityItem,
} from "./RecentActivityList";
export {
  DashboardGrid,
  DashboardSection,
  DashboardContainer,
  QuickActions,
} from "./DashboardGrid";

// Settings components
export {
  SettingsTabs,
  SettingsTabContent,
  tabs as settingsTabs,
} from "./settings";
export {
  SettingsFormCard,
  SettingsFormField,
  SettingsToggle,
  GeneralSettingsForm,
  NotificationsSettingsForm,
  SecuritySettingsForm,
  AppearanceSettingsForm,
  UsersSettingsForm,
  SystemSettingsForm,
} from "./settings";

// Activity components
export {
  ActivityFilters,
  activityTypes,
  dateRanges,
} from "./activity";
export {
  ActivityDataTable,
  activityConfig,
  getActivityConfig,
} from "./activity";

// Users management components
export {
  UserRoleBadge,
  AddUserDialog,
  EditUserDialog,
  UsersDataTable,
} from "./users";

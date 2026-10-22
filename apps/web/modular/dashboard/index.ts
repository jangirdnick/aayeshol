// Components
export {
  DashboardShell,
  Sidebar,
  SidebarHeader,
  SidebarUserProfile,
  SidebarNav,
  SidebarThemeToggle,
  SidebarProfileMenu,
  DashboardPageHeader,
} from './components';

// Hooks
export { useSidebarCollapse } from './hooks';

// Constants
export { NAV_GROUPS, SIDEBAR_COLLAPSE_STORAGE_KEY } from './constants';

// Types
export type {
  NavItem,
  NavGroup,
  SidebarProps,
  SidebarHeaderProps,
  SidebarUserProfileProps,
  SidebarNavProps,
  SidebarThemeToggleProps,
  DashboardShellProps,
} from './types';

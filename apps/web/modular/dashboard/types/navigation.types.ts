import type React from 'react';

/**
 * Navigation item specification for sidebar links.
 */
export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

/**
 * Group of navigation items separated by dividers.
 */
export interface NavGroup {
  id: string;
  items: NavItem[];
}

/**
 * Props for the main Sidebar component.
 */
export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
  className?: string;
}

/**
 * Props for the SidebarHeader subcomponent.
 */
export interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
}

/**
 * Props for the SidebarUserProfile subcomponent.
 */
export interface SidebarUserProfileProps {
  isCollapsed: boolean;
  onNavigate?: () => void;
}

/**
 * Props for the SidebarNav subcomponent.
 */
export interface SidebarNavProps {
  isCollapsed: boolean;
  onNavigate?: () => void;
}

/**
 * Props for the SidebarThemeToggle subcomponent.
 */
export interface SidebarThemeToggleProps {
  isCollapsed: boolean;
}

/**
 * Props for the DashboardShell root layout component.
 */
export interface DashboardShellProps {
  children: React.ReactNode;
}

import {
  LayoutDashboard,
  Sparkles,
  CalendarClock,
  FolderGit2,
  Workflow,
  Settings,
  BookOpen,
  Headphones,
} from 'lucide-react';
import type { NavGroup } from '../types/navigation.types';

/**
 * Key used to persist user's sidebar collapsed state in browser localStorage.
 */
export const SIDEBAR_COLLAPSE_STORAGE_KEY = 'aayeshol-sidebar-collapsed';

/**
 * Grouped navigation items configured for the Aayeshol dashboard sidebar.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'dashboard',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 'studio_and_content',
    items: [
      {
        title: 'AI Studio',
        href: '/dashboard/ai-studio',
        icon: Sparkles,
        badge: 'AI',
      },
      {
        title: 'Calendar',
        href: '/dashboard/calendar',
        icon: CalendarClock,
      },
      {
        title: 'Assets',
        href: '/dashboard/assets',
        icon: FolderGit2,
      },
    ],
  },
  {
    id: 'management',
    items: [
      {
        title: 'Integrations',
        href: '/dashboard/integrations',
        icon: Workflow,
        badge: 'Social',
      },
      {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
      },
    ],
  },
  {
    id: 'support',
    items: [
      {
        title: 'Documentation',
        href: '#',
        icon: BookOpen,
        badge: 'Soon',
      },
      {
        title: 'Help & Support',
        href: '#',
        icon: Headphones,
        badge: 'Soon',
      },
    ],
  },
];

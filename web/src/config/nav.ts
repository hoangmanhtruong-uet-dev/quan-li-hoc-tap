import type { SidebarSection } from '@/types';

export const sidebarSections: SidebarSection[] = [
  {
    label: 'Hôm nay',
    items: [
      { label: 'Tổng quan', href: '/dashboard', icon: 'layout-dashboard', segment: 'dashboard' },
      { label: 'Lịch', href: '/calendar', icon: 'calendar', segment: 'calendar' },
      { label: 'Nhiệm vụ', href: '/tasks', icon: 'check-square', segment: 'tasks' },
    ],
  },
  {
    label: 'Học tập',
    items: [
      { label: 'Academic Hub', href: '/study', icon: 'book-open', segment: 'study' },
      { label: 'AI Study Coach', href: '/coach', icon: 'sparkles', segment: 'coach' },
      { label: 'Học kỳ', href: '/study/semesters', icon: 'layers', segment: 'semesters' },
      { label: 'Môn học', href: '/study/courses', icon: 'book', segment: 'courses' },
      { label: 'Điểm số', href: '/study/grades', icon: 'bar-chart-3', segment: 'grades' },
    ],
  },
  {
    label: 'Phát triển',
    items: [
      { label: 'Lộ trình', href: '/roadmaps', icon: 'map', segment: 'roadmaps' },
      { label: 'Kỹ năng', href: '/skills', icon: 'zap', segment: 'skills' },
    ],
  },
  {
    label: 'Cộng đồng',
    items: [
      { label: 'Nhóm & Đồ án', href: '/workspaces', icon: 'layers', segment: 'workspaces' },
      { label: 'Nhóm & CLB', href: '/clubs', icon: 'users', segment: 'clubs' },
    ],
  },
  {
    label: 'Đời sống',
    items: [
      { label: 'Không gian sống', href: '/living', icon: 'home', segment: 'living' },
    ],
  },
  {
    label: 'Cá nhân',
    items: [
      { label: 'Thông báo', href: '/notifications', icon: 'bell', segment: 'notifications', badge: 3 },
      { label: 'Hồ sơ', href: '/profile', icon: 'user', segment: 'profile' },
      { label: 'Cài đặt', href: '/settings', icon: 'settings', segment: 'settings' },
    ],
  },
];

export const bottomNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard' },
  { label: 'Study', href: '/study', icon: 'book-open' },
  { label: 'Clubs', href: '/clubs', icon: 'users' },
  { label: 'Tasks', href: '/tasks', icon: 'check-square' },
  { label: 'Profile', href: '/profile', icon: 'user' },
];

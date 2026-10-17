export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number | string;
  segment?: string;
}

export interface SidebarSection {
  label: string;
  items: NavItem[];
}

export interface User {
  name: string;
  email: string;
  avatar: string;
  role: string;
  gpa: number;
  major: string;
  enrolledCourses: number;
  clubCount: number;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  coverImage: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  instructor: string;
  schedule: string;
  room: string;
  grade?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  courseId?: string;
  clubId?: string;
}

export interface Deadline {
  title: string;
  course: string;
  date: string;
  urgent: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'class' | 'study' | 'exam' | 'club' | 'personal';
}

export interface Semester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  gpa?: number;
  credits: number;
}

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  progress: number;
  nodes: RoadmapNode[];
}

export interface RoadmapNode {
  id: string;
  label: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  children: RoadmapNode[];
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  level: number;
  maxLevel: number;
  progress: number;
}

export interface LivingSpace {
  id: string;
  name: string;
  address: string;
  roommates: number;
  type: 'dorm' | 'apartment' | 'house';
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  date: string;
  split: string[];
}

export interface Chore {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'done';
}
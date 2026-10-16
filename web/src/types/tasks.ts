/**
 * CampusOS Task Management Types & Interfaces
 * Used across /tasks, /dashboard, /calendar, and Focus Mode.
 */

export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type EisenhowerQuadrant = 'do_first' | 'schedule' | 'delegate' | 'eliminate';
export type TaskDateGroupKey = 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'later' | 'done';

export interface TaskStep {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskPomodoroInfo {
  planned: number; // e.g. 3 sessions
  done: number;    // e.g. 1 session completed
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type?: 'pdf' | 'link' | 'image' | 'doc' | string;
  sizeBytes?: number;
}

export interface TaskActivityLog {
  id: string;
  timestamp: string; // ISO string
  action: 'created' | 'status_changed' | 'pomodoro_completed' | 'rescheduled' | 'subtask_toggled';
  detail?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  course?: string;              // e.g. "Mạng máy tính", "CS301"
  subjectId?: string;           // Optional link to course/subject ID
  status: TaskStatus;           // 'todo' | 'doing' | 'done'
  priority: TaskPriority;       // 'low' | 'medium' | 'high' | 'urgent'
  difficulty: number;           // 1 to 5 stars
  dueAt: string;                // ISO 8601 (YYYY-MM-DDTHH:mm:ss) or date string (YYYY-MM-DD)
  estimateMin: number;          // Estimated focus duration in minutes (e.g. 45, 90)
  actualMin: number;            // Accumulated focus minutes
  steps: TaskStep[];            // Subtasks checklist
  tags: string[];               // e.g. ['Lab', 'BTL', 'Ôn thi']
  assigneeIds?: string[];       // Team members for squad/group tasks
  pomodoros: TaskPomodoroInfo;  // { planned, done }
  rrule?: string;               // Optional recurrence rule
  quadrant?: EisenhowerQuadrant;// 'do_first' | 'schedule' | 'delegate' | 'eliminate'
  order: number;                // Sorting order within date group / column
  createdAt: string;            // ISO 8601 creation timestamp
  completedAt?: string;         // ISO 8601 completion timestamp
  notes?: string;               // Personal notes or markdown
  attachments?: TaskAttachment[];
  activityLog?: TaskActivityLog[];
}

export interface ParsedTaskResult {
  title: string;
  course?: string;
  dueDate: string;      // YYYY-MM-DD
  dueTime: string;      // HH:mm
  estimateMin: number;
  priority: TaskPriority;
  confidence: number;
  rawInput: string;
}

export interface UrgencyLevel {
  isOverdue: boolean;
  hoursRemaining: number;
  color: 'lime' | 'orange' | 'red';
  isPanic: boolean;
  displayCountdown: string;
}

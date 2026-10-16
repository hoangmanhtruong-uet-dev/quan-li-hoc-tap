import type { User, Course, Task, CalendarEvent, Semester, Club, Skill, LivingSpace } from '@/types';

export const currentUser: User = {
  name: 'Minh Nguyen',
  email: 'minh.nguyen@campus.edu.vn',
  avatar: '',
  role: 'USER',
  gpa: 3.7,
  major: 'Computer Science',
  enrolledCourses: 4,
  clubCount: 3,
};

export const mockCourses: Course[] = [
  { id: 'cs101', code: 'CS101', name: 'Introduction to Programming', credits: 4, instructor: 'Dr. Le Van A', schedule: 'Mon/Thu 8:00-9:30', room: 'A201', grade: 8.5 },
  { id: 'cs201', code: 'CS201', name: 'Data Structures & Algorithms', credits: 4, instructor: 'Dr. Tran Van B', schedule: 'Tue/Fri 10:00-11:30', room: 'B305' },
  { id: 'math101', code: 'MATH101', name: 'Calculus I', credits: 3, instructor: 'Prof. Nguyen Thi C', schedule: 'Mon/Wed 14:00-15:30', room: 'C101', grade: 7.8 },
  { id: 'eng101', code: 'ENG101', name: 'Academic English', credits: 2, instructor: 'Ms. Pham Thi D', schedule: 'Thu 13:00-16:00', room: 'D204' },
];

export const upcomingDeadlines = [
  { title: 'CS101 Assignment 3', course: 'Introduction to Programming', date: 'Jul 15', urgent: true },
  { title: 'Math problem set', course: 'Calculus I', date: 'Jul 14', urgent: false },
  { title: 'Submit lab report', course: 'CS101 Lab', date: 'Jul 16', urgent: true },
];

export const mockTasks: Task[] = [
  { id: 't1', title: 'CS101 Assignment 3', description: 'Complete linked list implementation', dueDate: '2026-07-15', priority: 'high', status: 'in_progress', courseId: 'cs201' },
  { id: 't2', title: 'Math problem set', description: 'Chapter 5 exercises 1-20', dueDate: '2026-07-14', priority: 'medium', status: 'todo', courseId: 'math101' },
  { id: 't3', title: 'Club meeting prep', description: 'Prepare slides for Saturday workshop', dueDate: '2026-07-13', priority: 'low', status: 'done', clubId: 'c1' },
  { id: 't4', title: 'Submit lab report', description: 'CS101 Lab 4 report', dueDate: '2026-07-16', priority: 'high', status: 'todo', courseId: 'cs101' },
];

export const mockEvents: CalendarEvent[] = [
  { id: 'e1', title: 'CS201 Lecture', date: '2026-07-11', time: '10:00-11:30', type: 'class' },
  { id: 'e2', title: 'Study Group', date: '2026-07-11', time: '14:00-16:00', type: 'study' },
  { id: 'e3', title: 'Math Exam', date: '2026-07-18', time: '08:00-10:00', type: 'exam' },
  { id: 'e4', title: 'Tech Club Meetup', date: '2026-07-12', time: '15:00-17:00', type: 'club' },
  { id: 'e5', title: 'Gym Session', date: '2026-07-11', time: '06:00-07:00', type: 'personal' },
];

export const mockSemesters: Semester[] = [
  { id: 's1', name: 'Freshman Fall 2025', startDate: '2025-09-01', endDate: '2025-12-31', gpa: 3.6, credits: 15 },
  { id: 's2', name: 'Freshman Spring 2026', startDate: '2026-01-15', endDate: '2026-05-30', gpa: 3.8, credits: 16 },
  { id: 's3', name: 'Sophomore Fall 2026', startDate: '2026-09-01', endDate: '2026-12-31', credits: 14 },
];

export const mockClubs: Club[] = [
  { id: 'c1', name: 'Tech Club', description: 'Programming and technology enthusiasts', memberCount: 45, coverImage: '', role: 'OWNER' },
  { id: 'c2', name: 'English Speaking Club', description: 'Practice English communication skills', memberCount: 32, coverImage: '', role: 'MEMBER' },
  { id: 'c3', name: 'Chess Club', description: 'Chess strategies and tournaments', memberCount: 18, coverImage: '', role: 'MEMBER' },
];

export const mockSkills: Skill[] = [
  { id: 'sk1', name: 'JavaScript', category: 'Programming', level: 3, maxLevel: 10, progress: 30 },
  { id: 'sk2', name: 'Python', category: 'Programming', level: 4, maxLevel: 10, progress: 40 },
  { id: 'sk3', name: 'Public Speaking', category: 'Soft Skills', level: 2, maxLevel: 10, progress: 20 },
  { id: 'sk4', name: 'Data Structures', category: 'Computer Science', level: 3, maxLevel: 10, progress: 35 },
];

export const mockLivingSpaces: LivingSpace[] = [
  { id: 'l1', name: 'Dorm A - Room 301', address: 'Campus Dormitory A, 3rd Floor', roommates: 3, type: 'dorm' },
  { id: 'l2', name: 'Sunrise Apartment', address: '123 Nguyen Hue Street', roommates: 2, type: 'apartment' },
];

export const semesterGpaData = [
  { label: 'F-Fall', gpa: 3.6 },
  { label: 'F-Spring', gpa: 3.8 },
  { label: 'S-Fall', gpa: null },
];

export const weeklyStudyHours = [
  { day: 'Mon', hours: 4 },
  { day: 'Tue', hours: 3 },
  { day: 'Wed', hours: 5 },
  { day: 'Thu', hours: 3.5 },
  { day: 'Fri', hours: 2 },
  { day: 'Sat', hours: 6 },
  { day: 'Sun', hours: 4.5 },
];
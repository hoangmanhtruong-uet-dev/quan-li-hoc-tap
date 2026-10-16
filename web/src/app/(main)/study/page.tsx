'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Clock3,
  Download,
  FileText,
  Flame,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  Layers,
  MoreHorizontal,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Video,
  X,
  Zap,
} from 'lucide-react';
import { StudySessionModal } from '@/components/shared/study-session-modal';
import { StrictPomodoroModal } from '@/features/pomodoro/strict-pomodoro-modal';
import dynamic from 'next/dynamic';

const KnowledgeMatrix3D = dynamic(
  () => import('@/components/study/knowledge-matrix-3d').then((mod) => mod.KnowledgeMatrix3D),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-[260px] sm:h-[320px] rounded-3xl overflow-hidden bg-card/40 border border-white/10 flex items-center justify-center">
        <span className="text-xs text-muted-foreground font-mono animate-pulse">
          Đang khởi tạo Knowledge Matrix 3D...
        </span>
      </div>
    ),
  }
);
import {
  SEED_COURSES,
  SEED_SEMESTERS,
  CourseItem,
  calculateSemesterGpa,
  getAcademicWarningStatus,
  solveRequiredFinalGrade,
} from '@/lib/academic-engine';

interface QuickResource {
  id: string;
  title: string;
  course: string;
  type: 'PDF' | 'Video' | 'Bài tập' | 'Tóm tắt';
  meta: string;
  icon: typeof FileText;
  color: string;
  summary: string;
  downloadUrl?: string;
}

const RESOURCES: QuickResource[] = [
  {
    id: 'r1',
    title: 'Cheat sheet Big-O Complexity & Data Structures',
    course: 'Cấu trúc dữ liệu & Giải thuật',
    type: 'PDF',
    meta: '2.4 MB · 4 trang',
    icon: FileText,
    color: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    summary:
      'Bảng tổng hợp độ phức tạp thời gian/bộ nhớ cho Array, LinkedList, BST, AVL Tree, Heap và 7 thuật toán sắp xếp kinh điển kèm mẹo nhận biết bài toán.',
  },
  {
    id: 'r2',
    title: 'Video: Phân chia Subnetting CIDR trong 15 phút',
    course: 'Mạng máy tính & Truyền thông',
    type: 'Video',
    meta: '18 phút · HD 1080p',
    icon: Video,
    color: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    summary:
      'Hướng dẫn mẹo tính nhẩm Subnet Mask, Network ID, Broadcast Address và số host khả dụng cho các dải mạng lớp A, B, C thường xuất hiện trong đề thi.',
  },
  {
    id: 'r3',
    title: 'Tuyển tập 50 bài tập trắc nghiệm Xác suất có lời giải',
    course: 'Xác suất Thống kê ứng dụng',
    type: 'Bài tập',
    meta: '12 đề · Có đáp án',
    icon: FolderOpen,
    color: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    summary:
      'Tổng hợp đề thi giữa kỳ các năm về biến ngẫu nhiên rời rạc, phân phối nhị thức, Poisson và phân phối chuẩn Gauss có giải thích chi tiết.',
  },
  {
    id: 'r4',
    title: 'Đề cương ôn tập Triết học Mác - Lênin (Hỏi đáp nhanh)',
    course: 'Triết học Mác - Lênin',
    type: 'Tóm tắt',
    meta: '32 câu trọng tâm',
    icon: FileText,
    color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    summary:
      'Tóm tắt 2 nguyên lý, 3 quy luật, 6 cặp phạm trù phép biện chứng duy vật và các câu hỏi vận dụng thực tiễn cho sinh viên thời đại số.',
  },
];

interface QuickLesson {
  id: string;
  title: string;
  completed: boolean;
}

const INITIAL_LESSONS: Record<string, QuickLesson[]> = {
  cs101: [
    { id: 'l1', title: 'Mô hình OSI & TCP/IP', completed: true },
    { id: 'l2', title: 'Tầng ứng dụng HTTP & DNS', completed: true },
    { id: 'l3', title: 'Giao vận TCP/UDP & Bắt tay 3 bước', completed: true },
    { id: 'l4', title: 'Định tuyến IP & Subnetting', completed: false },
    { id: 'l5', title: 'Tầng liên kết dữ liệu & Switch', completed: false },
  ],
  cs201: [
    { id: 'l1', title: 'Phân tích Big-O & Pointer C++', completed: true },
    { id: 'l2', title: 'Linked List, Stack & Queue', completed: true },
    { id: 'l3', title: 'Cây nhị phân tìm kiếm & AVL', completed: true },
    { id: 'l4', title: 'Bảng băm Hash Table', completed: false },
    { id: 'l5', title: 'Duyệt đồ thị BFS / DFS', completed: false },
  ],
  math101: [
    { id: 'l1', title: 'Không gian xác suất & Biến cố', completed: true },
    { id: 'l2', title: 'Công thức Bayes & Xác suất đầy đủ', completed: true },
    { id: 'l3', title: 'Biến ngẫu nhiên & Hàm phân phối', completed: false },
    { id: 'l4', title: 'Phân phối chuẩn & Định lý giới hạn', completed: false },
  ],
  ml01: [
    { id: 'l1', title: 'Triết học và vấn đề cơ bản', completed: true },
    { id: 'l2', title: 'Vật chất và ý thức', completed: true },
    { id: 'l3', title: 'Phép biện chứng duy vật', completed: false },
    { id: 'l4', title: 'Học thuyết hình thái kinh tế', completed: false },
  ],
};

const WEEKLY_STUDY_DATA = [
  { day: 'T2', hours: 3.5, label: 'Thứ Hai', focus: 'Mạng máy tính' },
  { day: 'T3', hours: 2.0, label: 'Thứ Ba', focus: 'CTDL & GT' },
  { day: 'T4', hours: 4.5, label: 'Thứ Tư', focus: 'Xác suất & Lab' },
  { day: 'T5', hours: 2.5, label: 'Thứ Năm', focus: 'Triết học' },
  { day: 'T6', hours: 3.0, label: 'Thứ Sáu', focus: 'Luyện LeetCode' },
  { day: 'T7', hours: 5.0, label: 'Thứ Bảy', focus: 'Làm Đồ án' },
  { day: 'CN', hours: 1.5, label: 'Chủ Nhật', focus: 'Ôn tập tuần' },
];

export default function StudyPage() {
  const [focusOpen, setFocusOpen] = useState(false);
  const [strictFocusOpen, setStrictFocusOpen] = useState(false);
  const [courseFilter, setCourseFilter] = useState<'all' | 'attention' | 'ongoing'>('all');
  const [focusedCourseCode, setFocusedCourseCode] = useState<string | null>(null);
  const [savedResources, setSavedResources] = useState<string[]>(['r1']);
  const [studyMinutes, setStudyMinutes] = useState(45);
  const [selectedResource, setSelectedResource] = useState<QuickResource | null>(null);
  const [lessonsMap, setLessonsMap] = useState<Record<string, QuickLesson[]>>(INITIAL_LESSONS);
  const [activeTimeframe, setActiveTimeframe] = useState<'week' | 'month'>('week');
  const [hydrated, setHydrated] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = window.localStorage.getItem('campusos-academic-hub-v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.savedResources) setSavedResources(parsed.savedResources);
        if (parsed.studyMinutes) setStudyMinutes(parsed.studyMinutes);
        if (parsed.lessonsMap) setLessonsMap(parsed.lessonsMap);
      } catch {
        window.localStorage.removeItem('campusos-academic-hub-v2');
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(
        'campusos-academic-hub-v2',
        JSON.stringify({ savedResources, studyMinutes, lessonsMap })
      );
    }
  }, [hydrated, savedResources, studyMinutes, lessonsMap]);

  // Calculations via academic-engine
  const ongoingSemester = SEED_SEMESTERS.find((s) => s.status === 'ongoing') || SEED_SEMESTERS[0]!;
  const semesterGpaStats = calculateSemesterGpa(SEED_COURSES);
  const warningStatus = getAcademicWarningStatus(3.7, 0);

  const totalCredits = SEED_COURSES.reduce((sum, c) => sum + c.credits, 0);
  const totalLessonsAll = Object.values(lessonsMap).flat().length;
  const completedLessonsAll = Object.values(lessonsMap).flat().filter((l) => l.completed).length;
  const overallProgressPercent = Math.round((completedLessonsAll / Math.max(1, totalLessonsAll)) * 100);

  const visibleCourses = useMemo(() => {
    if (courseFilter === 'attention') {
      return SEED_COURSES.filter((c) => c.status === 'warning');
    }
    return SEED_COURSES;
  }, [courseFilter]);

  const toggleLesson = (courseId: string, lessonId: string) => {
    setLessonsMap((prev) => {
      const current = prev[courseId] || [];
      const updated = current.map((l) =>
        l.id === lessonId ? { ...l, completed: !l.completed } : l
      );
      return { ...prev, [courseId]: updated };
    });
  };

  const toggleSavedResource = (rId: string) => {
    setSavedResources((prev) =>
      prev.includes(rId) ? prev.filter((id) => id !== rId) : [...prev, rId]
    );
  };

  const totalWeeklyHours =
    WEEKLY_STUDY_DATA.reduce((sum, d) => sum + d.hours, 0) + studyMinutes / 60;
  const maxDailyHour = Math.max(...WEEKLY_STUDY_DATA.map((d) => d.hours));

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 pb-16 relative">
      {/* 1. Hero Command Center with 3D Knowledge Matrix */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 backdrop-blur-2xl bg-card/40 p-6 sm:p-8 shadow-2xl">
        {/* Ambient Aurora Glows */}
        <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute right-72 top-20 h-48 w-48 rounded-full bg-purple-500/15 blur-2xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-500/10 text-cyan-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Academic Hub · Không gian Học tập & Điểm số
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
              Trung tâm Học tập & Quỹ đạo Tri thức
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              Giám sát tiến độ học phần, dự báo điểm số cuối kỳ thời gian thực, lưu trữ tài liệu tóm tắt
              và duy trì trạng thái tập trung sâu (Flow State) mỗi ngày.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setStrictFocusOpen(true)}
                className="h-11 px-5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(225,29,72,0.35)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              >
                <Flame className="w-4 h-4 fill-current" />
                Pomodoro Cực Đoan
              </button>

              <button
                onClick={() => setFocusOpen(true)}
                className="h-11 px-5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-foreground font-semibold text-sm transition-all flex items-center gap-2 backdrop-blur-md"
              >
                <Play className="w-4 h-4 fill-current text-cyan-400" />
                Đếm giờ tiêu chuẩn
              </button>

              <Link
                href="/study/courses"
                className="h-11 px-4 rounded-xl border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5 text-sm font-semibold transition-all flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" />
                Danh mục môn học
              </Link>
            </div>
          </div>

          {/* 3D Central Knowledge Matrix */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-white/10 bg-background/50 backdrop-blur-xl overflow-hidden shadow-inner">
              <KnowledgeMatrix3D
                focusCourse={focusedCourseCode}
                onSelectCourse={(code) => setFocusedCourseCode(code)}
              />
            </div>
          </div>
        </div>

        {/* Global Key Academic Metrics Strip */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Môn học kỳ I</span>
              <BookOpen className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black font-mono text-cyan-400">
              {SEED_COURSES.length} Môn
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{totalCredits} Tín chỉ đăng ký</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Tiến độ bài giảng</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black font-mono text-purple-400">
              {overallProgressPercent}%
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {completedLessonsAll} / {totalLessonsAll} Tiết đã hoàn thành
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">GPA dự kiến</span>
              <BarChart3 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              3.68 <span className="text-xs text-muted-foreground font-normal">/ 4.0</span>
            </p>
            <p className="text-[11px] text-emerald-300 font-medium mt-0.5">Xếp loại Giỏi (Dean&apos;s List)</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Chuỗi học tập</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black font-mono text-amber-400">
              14 Ngày 🔥
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">+50 XP bonus duy trì chuỗi</p>
          </div>
        </div>
      </section>

      {/* 2. Main Grid: Courses Radar & Study Rhythm */}
      <section className="grid gap-6 xl:grid-cols-[1fr_23rem]">
        <div className="space-y-6">
          {/* Spotlight Hero Course */}
          <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.08] via-card/40 to-card/60 backdrop-blur-2xl p-6 sm:p-7 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 shadow-[0_0_20px_rgba(61,232,255,0.2)]">
                  <Play className="h-8 w-8 fill-current ml-1" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      Đang học dở
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">Hôm qua lúc 21:30</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    Cây nhị phân tìm kiếm & Cân bằng AVL
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Cấu trúc dữ liệu & Giải thuật · TS. Trần Văn Bình · B305
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => setFocusOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Tiếp tục học ngay
                </button>
                <Link
                  href="/study/courses/cs201"
                  className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-foreground transition-all"
                >
                  Chi tiết môn
                </Link>
              </div>
            </div>
          </div>

          {/* Courses List with Quick Syllabus Check & Health Diagnostic */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  Môn học học kỳ này ({SEED_COURSES.length} Môn)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Đánh dấu trực tiếp tiến độ bài giảng hoặc bấm vào môn để xem chi tiết.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  onClick={() => setCourseFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    courseFilter === 'all'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tất cả ({SEED_COURSES.length})
                </button>
                <button
                  onClick={() => setCourseFilter('attention')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    courseFilter === 'attention'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Cần chú ý ({SEED_COURSES.filter((c) => c.status === 'warning').length})
                </button>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {visibleCourses.map((course) => {
                const lessons = lessonsMap[course.id] || [];
                const completedCount = lessons.filter((l) => l.completed).length;
                const progressPct =
                  lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 60;

                const solverTargetA = solveRequiredFinalGrade(course.components, 'A');

                return (
                  <div
                    key={course.id}
                    onMouseEnter={() => setFocusedCourseCode(course.code)}
                    onMouseLeave={() => setFocusedCourseCode(null)}
                    className="relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-card/40 border border-white/10 hover:border-cyan-400/40 transition-all duration-300 shadow-xl flex flex-col justify-between group"
                  >
                    <div
                      className="h-1.5 w-full"
                      style={{
                        background: `linear-gradient(90deg, ${course.color}, #3DE8FF)`,
                      }}
                    />

                    <div className="p-6 space-y-4 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border"
                            style={{
                              backgroundColor: `${course.color}20`,
                              borderColor: `${course.color}40`,
                              color: course.color,
                            }}
                          >
                            {course.code}
                          </span>
                          <h3 className="mt-1.5 text-lg font-bold text-foreground group-hover:text-cyan-300 transition-colors">
                            {course.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">{course.instructor}</p>
                        </div>

                        {course.status === 'warning' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center gap-1 shrink-0">
                            <ShieldAlert className="w-3 h-3" /> Cần chú ý
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3" /> Đúng tiến độ
                          </span>
                        )}
                      </div>

                      {/* Health Radar Tip */}
                      <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1 text-xs">
                        <div className="flex justify-between font-mono">
                          <span className="text-muted-foreground">Mục tiêu cuối kỳ (A):</span>
                          <span
                            className={`font-bold ${
                              solverTargetA.isAchievable ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            Cần thi ≥ {solverTargetA.requiredScore} điểm
                          </span>
                        </div>
                      </div>

                      {/* Interactive Quick Syllabus Check */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-muted-foreground">Tiến độ bài học:</span>
                          <span className="font-bold text-cyan-400">
                            {completedCount}/{lessons.length} ({progressPct}%)
                          </span>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progressPct}%`,
                              backgroundColor: course.color,
                            }}
                          />
                        </div>

                        {/* Interactive lesson pills */}
                        <div className="pt-2 space-y-1.5">
                          {lessons.slice(0, 3).map((l) => (
                            <div
                              key={l.id}
                              onClick={() => toggleLesson(course.id, l.id)}
                              className={`p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                                l.completed
                                  ? 'bg-cyan-500/10 border-cyan-400/30 text-foreground'
                                  : 'bg-background/40 border-white/5 text-muted-foreground hover:border-white/15'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  l.completed
                                    ? 'bg-cyan-500 border-cyan-400 text-background'
                                    : 'border-white/20'
                                }`}
                              >
                                {l.completed && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className={`truncate ${l.completed ? 'line-through opacity-70' : ''}`}>
                                {l.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        {course.schedule}
                      </span>

                      <Link
                        href={`/study/courses/${course.id}`}
                        className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                      >
                        Vào môn học
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Aside Column: Study Rhythm Chart & Quick Links */}
        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          {/* Study Rhythm Chart */}
          <div className="rounded-3xl p-6 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Nhịp học trong tuần
                </h3>
                <p className="text-xs text-muted-foreground">Tổng giờ tập trung đã ghi nhận</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/20">
                +14% vs tuần trước
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black font-mono text-cyan-400">
                  {totalWeeklyHours.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground font-mono"> / 25 giờ mục tiêu</span>
              </div>
              <span className="text-xs font-semibold text-emerald-400">Trạng thái Tốt</span>
            </div>

            {/* Interactive SVG Bar Histogram */}
            <div className="pt-2">
              <div className="flex h-32 items-end gap-2.5 px-1">
                {WEEKLY_STUDY_DATA.map((item) => {
                  const barHeightPct = Math.max(12, Math.round((item.hours / maxDailyHour) * 100));
                  const isTopDay = item.hours === maxDailyHour;

                  return (
                    <div key={item.day} className="flex flex-1 flex-col items-center gap-2 group">
                      <div className="relative w-full flex items-end justify-center h-24">
                        {/* Hover Tooltip */}
                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-mono text-cyan-300 whitespace-nowrap pointer-events-none z-10 border border-white/10">
                          {item.hours}h · {item.focus}
                        </div>

                        <div
                          className={`w-full rounded-lg transition-all duration-500 ${
                            isTopDay
                              ? 'bg-gradient-to-t from-cyan-500 to-purple-500 shadow-[0_0_12px_rgba(61,232,255,0.4)]'
                              : 'bg-cyan-500/25 hover:bg-cyan-500/50'
                          }`}
                          style={{ height: `${barHeightPct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">{item.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Flow State Recommendation Tip */}
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-xs text-cyan-200/90 leading-relaxed flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Khung giờ vàng (Flow State):</strong> Dữ liệu chỉ ra bạn đạt hiệu suất tập trung cao
                nhất vào <strong>19:30 – 22:00</strong>. Hãy sắp xếp làm bài tập lớn vào thời gian này.
              </span>
            </div>
          </div>

          {/* Academic Quick Portal Links */}
          <div className="rounded-3xl p-6 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-foreground">Cổng kết nối Học tập</h3>

            <div className="space-y-2">
              <Link
                href="/study/grades"
                className="p-3.5 rounded-2xl bg-background/50 border border-white/10 hover:border-cyan-400/30 transition-all flex items-center justify-between gap-3 text-xs font-semibold text-foreground group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <div>Bảng điểm & Dự báo CPA</div>
                    <div className="text-[10px] text-muted-foreground font-normal">
                      Máy giải điểm thi cuối kỳ
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/study/semesters"
                className="p-3.5 rounded-2xl bg-background/50 border border-white/10 hover:border-cyan-400/30 transition-all flex items-center justify-between gap-3 text-xs font-semibold text-foreground group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center text-purple-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div>Tiến độ Học kỳ & Niên giám</div>
                    <div className="text-[10px] text-muted-foreground font-normal">
                      Lịch sử 3 học kỳ gần nhất
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/study/courses"
                className="p-3.5 rounded-2xl bg-background/50 border border-white/10 hover:border-cyan-400/30 transition-all flex items-center justify-between gap-3 text-xs font-semibold text-foreground group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div>Trung tâm Môn học</div>
                    <div className="text-[10px] text-muted-foreground font-normal">
                      Bộ lọc và tìm kiếm đề cương
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </aside>
      </section>

      {/* 3. Quick Resources Library Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Tài liệu & Cheat Sheets Đề xuất
            </h2>
            <p className="text-xs text-muted-foreground">
              Bấm vào tài liệu để mở bản xem nhanh (Preview Drawer) và tải về offline.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {RESOURCES.map((res) => {
            const Icon = res.icon;
            const isSaved = savedResources.includes(res.id);

            return (
              <div
                key={res.id}
                onClick={() => setSelectedResource(res)}
                className="p-5 rounded-3xl backdrop-blur-2xl bg-card/40 border border-white/10 hover:border-cyan-400/30 transition-all cursor-pointer flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${res.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSavedResource(res.id);
                      }}
                      className={`p-2 rounded-xl transition-all ${
                        isSaved
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-cyan-300 transition-colors line-clamp-2">
                      {res.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{res.course}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-muted-foreground font-mono">
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    {res.type}
                  </span>
                  <span>{res.meta}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Document Quick Preview Drawer Modal */}
      {selectedResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedResource(null);
          }}
        >
          <div className="w-full max-w-lg h-full bg-card/95 border-l border-white/15 backdrop-blur-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${selectedResource.color}`}>
                    <selectedResource.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-cyan-300">
                      {selectedResource.type} · {selectedResource.meta}
                    </span>
                    <h3 className="text-lg font-bold text-foreground mt-1">{selectedResource.title}</h3>
                    <p className="text-xs text-muted-foreground">{selectedResource.course}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedResource(null)}
                  className="p-2 rounded-xl text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Document Summary Content */}
              <div className="space-y-3 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                  Nội dung tóm tắt & Mẹo thi
                </h4>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                  {selectedResource.summary}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-xs text-cyan-200 flex items-center justify-between">
                <span>Tài liệu đã được kiểm duyệt bởi giảng viên học phần</span>
                <span className="font-mono text-cyan-400 font-bold">100% Verified</span>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center gap-3">
              <button
                onClick={() => {
                  alert(`Đã lưu "${selectedResource.title}" vào bộ nhớ ngoại tuyến thành công!`);
                  setSelectedResource(null);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Tải về học offline (.PDF)
              </button>

              <button
                onClick={() => setSelectedResource(null)}
                className="px-5 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-foreground transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Focus Modals */}
      <StudySessionModal
        open={focusOpen}
        onClose={() => setFocusOpen(false)}
        onComplete={(minutes) => setStudyMinutes((val) => val + minutes)}
      />

      <StrictPomodoroModal
        open={strictFocusOpen}
        onClose={() => setStrictFocusOpen(false)}
        onSessionComplete={(stats) => {
          setStudyMinutes((val) => val + stats.focusMinutes);
          setStrictFocusOpen(false);
        }}
      />
    </div>
  );
}

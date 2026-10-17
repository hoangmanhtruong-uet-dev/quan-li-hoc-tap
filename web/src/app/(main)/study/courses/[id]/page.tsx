'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Calculator,
  Plus,
  ExternalLink,
  Target,
  GraduationCap,
  Percent,
  Upload,
  Download,
  Trash2,
  Eye,
  Loader2,
  Paperclip,
} from 'lucide-react';
import {
  SEED_COURSES,
  CourseItem,
  CourseGradeComponent,
  LetterGrade,
  convertScale10To4,
  computeCourseTotalScore,
  solveRequiredFinalGrade,
} from '@/lib/academic-engine';
import { mockCourses, mockTasks } from '@/data/mock';
import { StoredFile, uploadAcademicFile, formatBytes } from '@/lib/storage-engine';
import { PdfPreviewModal, PdfPreviewItem } from '@/components/common/pdf-preview-modal';
import { AiStudyHubModal } from '@/components/study/ai-study-hub-modal';
import { useCampusStore, calculateLevelAndRank } from '@/lib/campus-store';

export interface SyllabusChapter {
  id: string;
  week: number;
  title: string;
  completed: boolean;
  materials?: StoredFile[];
}

const DEFAULT_SYLLABUS: Record<string, SyllabusChapter[]> = {
  cs101: [
    {
      id: 'ch1',
      week: 1,
      title: 'Tổng quan kiến trúc mạng & mô hình OSI / TCP-IP',
      completed: true,
      materials: [
        {
          id: 'mat-cs101-w1',
          name: 'BaiGiang_Tuan1_MoHinh_OSI_TCPIP.pdf',
          url: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
          sizeBytes: 2450000,
          type: 'pdf',
          uploadedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
      ],
    },
    {
      id: 'ch2',
      week: 2,
      title: 'Tầng ứng dụng: HTTP, DNS, SMTP, Web Sockets',
      completed: true,
      materials: [
        {
          id: 'mat-cs101-w2',
          name: 'Slide_Tuan2_Application_Layer.pdf',
          url: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
          sizeBytes: 3120000,
          type: 'pdf',
          uploadedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
      ],
    },
    { id: 'ch3', week: 3, title: 'Tầng giao vận: TCP Flow Control & UDP Protocol', completed: true },
    { id: 'ch4', week: 4, title: 'Congestion Control & TCP Reno/BBR', completed: true },
    { id: 'ch5', week: 5, title: 'Tầng mạng: IP Addressing, CIDR Subnetting', completed: false },
    { id: 'ch6', week: 6, title: 'Routing Algorithms: OSPF, BGP, Bellman-Ford', completed: false },
    { id: 'ch7', week: 7, title: 'Tầng liên kết dữ liệu & Ethernet Switching', completed: false },
    { id: 'ch8', week: 8, title: 'An toàn mạng: TLS/SSL, Firewall & VPN', completed: false },
  ],
  cs201: [
    {
      id: 'cs201-1',
      week: 1,
      title: 'Phân tích độ phức tạp thuật toán Big-O',
      completed: true,
      materials: [
        {
          id: 'mat-cs201-w1',
          name: 'DSA_Tuan1_BigO_Complexity.pdf',
          url: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
          sizeBytes: 1850000,
          type: 'pdf',
          uploadedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
        },
      ],
    },
    { id: 'cs201-2', week: 2, title: 'Danh sách liên kết, Stack & Queue', completed: true },
    { id: 'cs201-3', week: 3, title: 'Cây nhị phân tìm kiếm & Cây AVL cân bằng', completed: true },
    { id: 'cs201-4', week: 4, title: 'Bảng băm (Hash Table) & Xử lý va chạm', completed: true },
    { id: 'cs201-5', week: 5, title: 'Đồ thị: BFS, DFS và ứng dụng', completed: false },
    { id: 'cs201-6', week: 6, title: 'Đường đi ngắn nhất: Dijkstra, Bellman-Ford', completed: false },
    { id: 'cs201-7', week: 7, title: 'Cây khung nhỏ nhất: Kruskal, Prim', completed: false },
    { id: 'cs201-8', week: 8, title: 'Quy hoạch động & Tham lam', completed: false },
  ],
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params.id as string) || '';

  // Match course by id or code
  const initialCourse = useMemo(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('campusos-courses-v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.customCourses && Array.isArray(parsed.customCourses)) {
            const customFound = parsed.customCourses.find(
              (c: CourseItem) =>
                c.id.toLowerCase() === rawId.toLowerCase() ||
                c.code.toLowerCase() === rawId.toLowerCase()
            );
            if (customFound) return customFound;
          }
        }
      } catch {}
    }

    const found = SEED_COURSES.find(
      (c) => c.id.toLowerCase() === rawId.toLowerCase() || c.code.toLowerCase() === rawId.toLowerCase()
    );
    if (found) return found;

    // Fallback to mockCourses
    const mockFound = mockCourses.find(
      (c) => c.id.toLowerCase() === rawId.toLowerCase() || c.code.toLowerCase() === rawId.toLowerCase()
    );
    if (mockFound) {
      return {
        id: mockFound.id,
        code: mockFound.code,
        name: mockFound.name,
        semesterId: 'sem-fall-26',
        credits: mockFound.credits,
        instructor: mockFound.instructor,
        room: mockFound.room,
        schedule: mockFound.schedule,
        syllabusUrl: '#',
        components: [
          { id: 'c1', name: 'Chuyên cần', weightPercent: 20, score: 8.5 },
          { id: 'c2', name: 'Giữa kỳ', weightPercent: 30, score: 8.0 },
          { id: 'c3', name: 'Cuối kỳ', weightPercent: 50, score: null },
        ],
        finalScore: null,
        letterGrade: '—' as LetterGrade,
        status: 'ongoing' as const,
        color: '#3DE8FF',
      };
    }
    return null;
  }, [rawId]);

  // Local state for interactive grade calculation
  const [course, setCourse] = useState<CourseItem | null>(initialCourse);
  const [targetLetter, setTargetLetter] = useState<LetterGrade>('A');
  const [syllabus, setSyllabus] = useState<SyllabusChapter[]>(() => {
    if (DEFAULT_SYLLABUS[rawId.toLowerCase()]) {
      return DEFAULT_SYLLABUS[rawId.toLowerCase()]!;
    }
    return [
      { id: 'ch1', week: 1, title: 'Giới thiệu môn học & Đề cương chi tiết', completed: true },
      { id: 'ch2', week: 2, title: 'Kiến thức nền tảng & Tài liệu tham khảo', completed: true },
      { id: 'ch3', week: 3, title: 'Chương 1: Các khái niệm cơ bản', completed: true },
      { id: 'ch4', week: 4, title: 'Chương 2: Kiến trúc và phương pháp', completed: false },
      { id: 'ch5', week: 5, title: 'Chương 3: Phân tích & Thực hành chuyên sâu', completed: false },
      { id: 'ch6', week: 6, title: 'Ôn tập và Chuẩn bị đồ án / thi cuối kỳ', completed: false },
    ];
  });

  const [activeTab, setActiveTab] = useState<'grades' | 'syllabus' | 'assignments'>('grades');
  const [previewFile, setPreviewFile] = useState<PdfPreviewItem | null>(null);
  const [uploadingWeekId, setUploadingWeekId] = useState<string | null>(null);
  const [aiHubTarget, setAiHubTarget] = useState<{
    chapter: SyllabusChapter;
    file?: StoredFile;
  } | null>(null);
  const { update: updateCampusStore } = useCampusStore();

  // Restore saved syllabus with materials if present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(`campusos_syllabus_${rawId.toLowerCase()}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSyllabus(parsed);
        }
      }
    } catch {}
  }, [rawId]);

  // Persist syllabus changes
  const saveSyllabus = (updated: SyllabusChapter[]) => {
    setSyllabus(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`campusos_syllabus_${rawId.toLowerCase()}`, JSON.stringify(updated));
      } catch {}
    }
  };

  const toggleSyllabusChapter = (chapId: string) => {
    const updated = syllabus.map((c) => (c.id === chapId ? { ...c, completed: !c.completed } : c));
    saveSyllabus(updated);
  };

  const handleUploadWeekMaterial = async (chapId: string, file: File) => {
    setUploadingWeekId(chapId);
    try {
      const stored = await uploadAcademicFile(file, 'lectures');
      const updated = syllabus.map((c) => {
        if (c.id !== chapId) return c;
        const currentMaterials = c.materials || [];
        return {
          ...c,
          materials: [...currentMaterials, stored],
        };
      });
      saveSyllabus(updated);
    } catch (err) {
      console.error('Lỗi khi tải file bài giảng:', err);
    } finally {
      setUploadingWeekId(null);
    }
  };

  const handleDeleteWeekMaterial = (chapId: string, materialId: string) => {
    const updated = syllabus.map((c) => {
      if (c.id !== chapId) return c;
      return {
        ...c,
        materials: (c.materials || []).filter((m) => m.id !== materialId),
      };
    });
    saveSyllabus(updated);
  };

  const handleDownloadFile = (file: StoredFile) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Related tasks
  const relatedTasks = useMemo(() => {
    return mockTasks.filter(
      (t) =>
        t.courseId?.toLowerCase() === rawId.toLowerCase() ||
        t.title.toLowerCase().includes(course?.name.toLowerCase() ?? '') ||
        t.title.toLowerCase().includes(course?.code.toLowerCase() ?? '')
    );
  }, [rawId, course]);

  if (!course) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Không tìm thấy thông tin môn học</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Mã môn <code className="text-cyan-400 font-mono font-bold">&quot;{rawId}&quot;</code> không tồn tại trong học kỳ hiện tại hoặc bạn chưa đăng ký.
        </p>
        <button
          onClick={() => router.push('/study/courses')}
          className="px-5 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 font-medium hover:bg-cyan-500/30 transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách môn học
        </button>
      </div>
    );
  }

  // Live recalculated score
  const computedScore10 = computeCourseTotalScore(course.components);
  const gradeConversion = convertScale10To4(computedScore10);
  const targetSolverResult = solveRequiredFinalGrade(course.components, targetLetter);

  // Syllabus progress
  const completedChaptersCount = syllabus.filter((s) => s.completed).length;
  const syllabusProgress = Math.round((completedChaptersCount / syllabus.length) * 100);

  const handleScoreChange = (compId: string, val: string) => {
    const numVal = val === '' ? null : Math.max(0, Math.min(10, parseFloat(val)));
    setCourse((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        components: prev.components.map((c) => (c.id === compId ? { ...c, score: numVal } : c)),
      };
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Navigation */}
      <div>
        <Link
          href="/study/courses"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-cyan-400 transition-colors mb-3 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Trở về Danh mục Môn học
        </Link>

        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-2xl">
          {/* Ambient Glow */}
          <div
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: course.color }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider font-mono border"
                  style={{
                    backgroundColor: `${course.color}20`,
                    borderColor: `${course.color}50`,
                    color: course.color,
                  }}
                >
                  {course.code}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-foreground/80">
                  {course.credits} Tín chỉ
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-400/20 text-cyan-300">
                  Học kỳ I · 2026–2027
                </span>
                {course.status === 'warning' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Cần chú ý
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                {course.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 text-foreground/80">
                  <User className="w-4 h-4 text-cyan-400" />
                  {course.instructor}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  {course.schedule}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  {course.room}
                </span>
              </div>
            </div>

            {/* Quick Live Performance Card */}
            <div className="flex items-center gap-4 bg-background/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shrink-0">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Điểm tích lũy dự kiến</div>
                <div className="text-2xl font-black font-mono text-cyan-400">
                  {computedScore10 !== null ? computedScore10.toFixed(2) : '—'}
                  <span className="text-xs text-muted-foreground font-normal"> / 10</span>
                </div>
                <div className="text-xs font-semibold text-emerald-400">
                  Quy đổi: {gradeConversion.scale4.toFixed(1)}/4.0 · {gradeConversion.letter}
                </div>
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border shadow-lg"
                style={{
                  backgroundColor: `${course.color}25`,
                  borderColor: `${course.color}60`,
                  color: course.color,
                }}
              >
                {gradeConversion.letter}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('grades')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'grades'
              ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(61,232,255,0.2)]'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Bảng điểm & Dự tính cuối kỳ
        </button>
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'syllabus'
              ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(61,232,255,0.2)]'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Tiến độ Đề cương ({completedChaptersCount}/{syllabus.length})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'assignments'
              ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(61,232,255,0.2)]'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
          }`}
        >
          <FileText className="w-4 h-4" />
          Bài tập & Nhiệm vụ ({relatedTasks.length})
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'grades' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Grade Component Weights & Interactive Inputs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl p-6 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Thành phần điểm môn học
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Điều chỉnh điểm số bên dưới để xem dự báo kết quả tức thì.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                  Tổng trọng số: 100%
                </span>
              </div>

              {/* Components List */}
              <div className="space-y-3">
                {course.components.map((comp) => {
                  const contribution =
                    comp.score !== null ? ((comp.score * comp.weightPercent) / 100).toFixed(2) : '—';
                  return (
                    <div
                      key={comp.id}
                      className="p-4 rounded-2xl bg-background/50 border border-white/10 hover:border-cyan-400/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">{comp.name}</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground">
                            {comp.weightPercent}% trọng số
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Đóng góp vào tổng kết: <strong className="text-cyan-400 font-mono">+{contribution}</strong> điểm
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative w-28">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={comp.score ?? ''}
                            placeholder="Chưa có"
                            onChange={(e) => handleScoreChange(comp.id, e.target.value)}
                            aria-label={`Điểm ${comp.name}`}
                            className="w-full h-11 px-3 text-center text-base font-mono font-bold rounded-xl bg-card/60 border border-white/15 text-foreground focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all placeholder:text-muted-foreground/40"
                          />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">/ 10</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Info Tip */}
              <div className="p-3.5 rounded-2xl bg-cyan-500/5 border border-cyan-400/20 flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-xs text-cyan-200/90 leading-relaxed">
                  Quy chế đào tạo: Điểm thi kết thúc học phần dưới <strong>4.0</strong> (thang 10) bị tính là điểm liệt,
                  bắt buộc phải thi lại hoặc học lại bất kể điểm quá trình.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Grade Target Solver */}
          <div className="space-y-4">
            <div className="rounded-3xl p-6 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-xl space-y-5">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-foreground">Máy giải điểm mục tiêu</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Chọn điểm chữ bạn muốn đạt, hệ thống sẽ tính toán chính xác số điểm thi cuối kỳ bạn cần đạt được:
              </p>

              {/* Target letter grade selector */}
              <div className="grid grid-cols-4 gap-2">
                {(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D'] as LetterGrade[]).map((ltr) => {
                  const isSelected = targetLetter === ltr;
                  return (
                    <button
                      key={ltr}
                      onClick={() => setTargetLetter(ltr)}
                      className={`h-11 rounded-xl text-xs font-black font-mono transition-all border ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(61,232,255,0.3)] scale-105'
                          : 'bg-background/40 border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground'
                      }`}
                    >
                      {ltr}
                    </button>
                  );
                })}
              </div>

              {/* Solver Result Box */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  targetSolverResult.isAchievable
                    ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-400/30 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-bold tracking-wider opacity-80">
                    Cần đạt bài thi cuối kỳ
                  </span>
                  <span className="text-xs font-bold font-mono">
                    Mục tiêu: {targetSolverResult.letterTarget} (≥ {targetSolverResult.targetScale10})
                  </span>
                </div>
                <div className="text-3xl font-black font-mono mb-2">
                  {targetSolverResult.requiredScore}
                  <span className="text-sm font-normal opacity-70"> / 10</span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">{targetSolverResult.explanation}</p>
              </div>

              {/* Attendance quick info */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Chuyên cần lớp học</span>
                  <span className="font-semibold text-emerald-400">100% (8/8 buổi)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full w-full" />
                </div>
                <div className="text-[11px] text-muted-foreground">Còn quyền nghỉ tối đa 2 buổi.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'syllabus' && (
        <div className="space-y-6">
          <div className="rounded-3xl p-6 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  Tiến độ bài giảng & Đề cương môn học
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Đánh dấu tuần học đã hoàn thành và đính kèm file bài giảng (PDF / Slide) tương ứng với từng tuần.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold font-mono text-cyan-400">
                  {completedChaptersCount}/{syllabus.length} Tuần ({syllabusProgress}%)
                </span>
                <div className="w-32 h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${syllabusProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {syllabus.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    item.completed
                      ? 'bg-cyan-500/5 border-cyan-400/20'
                      : 'bg-background/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Top row: Checkbox, week title, status badge */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleSyllabusChapter(item.id)}
                        title={item.completed ? 'Đánh dấu chưa học' : 'Đánh dấu đã học'}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          item.completed
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(61,232,255,0.4)]'
                            : 'border-white/20 bg-white/5 hover:border-cyan-400/50'
                        }`}
                      >
                        {item.completed && <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                      </button>
                      <div>
                        <span className="text-xs font-mono font-bold text-cyan-400/90 block">
                          Tuần {item.week}
                        </span>
                        <span
                          className={`text-sm font-semibold transition-colors ${
                            item.completed ? 'line-through opacity-70 text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>
                    </div>

                    <span
                      onClick={() => toggleSyllabusChapter(item.id)}
                      className={`text-xs px-2.5 py-1 rounded-full font-mono border shrink-0 cursor-pointer select-none transition-all ${
                        item.completed
                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30'
                          : 'bg-white/5 text-muted-foreground border-white/10 hover:text-foreground'
                      }`}
                    >
                      {item.completed ? 'Đã học' : 'Chưa học'}
                    </span>
                  </div>

                  {/* Lecture Materials Section for this week */}
                  <div className="mt-4 pt-3.5 border-t border-white/10 space-y-3">
                    {/* Materials list */}
                    {item.materials && item.materials.length > 0 && (
                      <div className="space-y-2">
                        {item.materials.map((file) => (
                          <div
                            key={file.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-background/60 border border-white/10 hover:border-cyan-400/30 transition-all text-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate max-w-xs sm:max-w-md">
                                  {file.name}
                                </p>
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono mt-0.5">
                                  <span>{formatBytes(file.sizeBytes)}</span>
                                  <span>•</span>
                                  <span>{new Date(file.uploadedAt).toLocaleDateString('vi-VN')}</span>
                                  {file.isLocalFallback && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                      Cục bộ
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => setAiHubTarget({ chapter: item, file })}
                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/40 text-purple-300 hover:text-white hover:border-purple-300 hover:shadow-[0_0_12px_rgba(168,85,247,0.3)] transition-all flex items-center gap-1.5 font-bold text-xs"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                                <span>AI Phân tích</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setPreviewFile(file)}
                                className="px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/25 transition-all flex items-center gap-1.5 font-bold text-xs shadow-[0_0_10px_rgba(61,232,255,0.15)]"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Xem trước</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(file)}
                                title="Tải file về máy"
                                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWeekMaterial(item.id, file.id)}
                                title="Xóa tài liệu bài giảng này"
                                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload button */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold cursor-pointer transition-all shadow-[0_0_12px_rgba(61,232,255,0.1)]">
                        {uploadingWeekId === item.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                            <span>Đang tải lên Supabase...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-cyan-400" />
                            <span>+ Thêm bài giảng cho tuần {item.week} (PDF/Slide)</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf,.ppt,.pptx,.doc,.docx"
                          className="hidden"
                          disabled={uploadingWeekId === item.id}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadWeekMaterial(item.id, f);
                            e.target.value = '';
                          }}
                        />
                      </label>

                      {item.materials && item.materials.length > 0 && (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {item.materials.length} tài liệu
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="rounded-3xl p-6 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Bài tập & Deadline liên quan</h3>
                <p className="text-xs text-muted-foreground">
                  Các nhiệm vụ thuộc môn {course.name} được đồng bộ từ Deadline Arena.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo bài tập mới
              </Link>
            </div>

            {relatedTasks.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Hiện không có deadline hoặc bài tập nào đang chờ xử lý cho môn học này!
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {relatedTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl bg-background/50 border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm truncate">{t.title}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            t.priority === 'high'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : t.priority === 'medium'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          Hạn chót: {t.dueDate ?? 'Không có'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${
                        t.status === 'done'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-white/5 text-muted-foreground border border-white/10'
                      }`}
                    >
                      {t.status === 'done' ? 'Đã hoàn thành' : 'Đang thực hiện'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cyber-Glass In-App PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />

      {/* Cyber-Glass AI Study Hub Modal (Bộ Tứ Toàn Năng) */}
      {aiHubTarget && course && (
        <AiStudyHubModal
          isOpen={Boolean(aiHubTarget)}
          onClose={() => setAiHubTarget(null)}
          courseId={course.id}
          courseName={course.name}
          chapterId={aiHubTarget.chapter.id}
          chapterTitle={`Tuần ${aiHubTarget.chapter.week}: ${aiHubTarget.chapter.title}`}
          pdfUrl={aiHubTarget.file?.url}
          onAddXp={(amount, reason) => {
            updateCampusStore((prev) => {
              const newXp = prev.xp + amount;
              const { level, rankTitle } = calculateLevelAndRank(newXp);
              return { ...prev, xp: newXp, level, rankTitle };
            });
          }}
        />
      )}
    </div>
  );
}
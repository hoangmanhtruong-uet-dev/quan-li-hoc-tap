/**
 * CampusOS Academic Engine
 * Comprehensive GPA/CPA calculation, grade conversion, Grade Target Solver,
 * and academic warning diagnostics tailored for university credit systems.
 */

export type LetterGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F' | '—';

export interface GradeConversion {
  scale4: number;
  letter: LetterGrade;
  description: string;
  color: string;
}

export interface CourseGradeComponent {
  id: string;
  name: string;
  weightPercent: number; // e.g. 20 (20%), 30 (30%), 50 (50%)
  score: number | null; // 0..10
}

export interface CourseItem {
  id: string;
  code: string;
  name: string;
  semesterId: string;
  credits: number;
  instructor: string;
  room: string;
  schedule: string;
  syllabusUrl?: string;
  components: CourseGradeComponent[];
  finalScore: number | null; // Computed or entered
  letterGrade: LetterGrade;
  status: 'ongoing' | 'passed' | 'warning' | 'failed';
  color: string;
}

export interface SemesterItem {
  id: string;
  name: string;
  academicYear: string;
  credits: number;
  gpa: number | null; // scale 4.0
  gpa10?: number | null;
  coursesCount: number;
  status: 'ongoing' | 'completed' | 'upcoming';
  dates: string;
  progressPercent: number;
}

// ==========================================
// 1. GRADE CONVERSION STANDARD (VIETNAM UNIVERSITY TIER)
// ==========================================

export function convertScale10To4(score10: number | null): GradeConversion {
  if (score10 === null || isNaN(score10)) {
    return { scale4: 0, letter: '—', description: 'Chưa có điểm', color: 'text-muted-foreground' };
  }

  const s = Math.max(0, Math.min(10, score10));

  if (s >= 9.0) return { scale4: 4.0, letter: 'A+', description: 'Xuất sắc', color: 'text-emerald-400' };
  if (s >= 8.5) return { scale4: 3.7, letter: 'A', description: 'Giỏi', color: 'text-emerald-400' };
  if (s >= 8.0) return { scale4: 3.5, letter: 'B+', description: 'Khá giỏi', color: 'text-cyan-400' };
  if (s >= 7.0) return { scale4: 3.0, letter: 'B', description: 'Khá', color: 'text-cyan-400' };
  if (s >= 6.5) return { scale4: 2.5, letter: 'C+', description: 'Trung bình khá', color: 'text-amber-400' };
  if (s >= 5.5) return { scale4: 2.0, letter: 'C', description: 'Trung bình', color: 'text-amber-400' };
  if (s >= 5.0) return { scale4: 1.5, letter: 'D+', description: 'Trung bình yếu', color: 'text-orange-400' };
  if (s >= 4.0) return { scale4: 1.0, letter: 'D', description: 'Đạt tối thiểu', color: 'text-orange-400' };
  return { scale4: 0.0, letter: 'F', description: 'Không đạt (Học lại)', color: 'text-rose-400' };
}

// ==========================================
// 2. WEIGHTED COURSE & GPA COMPUTATION
// ==========================================

export function computeCourseTotalScore(components: CourseGradeComponent[]): number | null {
  if (!components || components.length === 0) return null;

  let totalWeight = 0;
  let weightedSum = 0;
  let hasMissing = false;

  for (const comp of components) {
    if (comp.score !== null) {
      weightedSum += comp.score * (comp.weightPercent / 100);
      totalWeight += comp.weightPercent;
    } else {
      hasMissing = true;
    }
  }

  if (totalWeight === 0) return null;
  // If not all components graded yet, normalize to 100% scale
  if (hasMissing) {
    const activeWeightRatio = totalWeight / 100;
    return Number((weightedSum / activeWeightRatio).toFixed(2));
  }

  return Number(weightedSum.toFixed(2));
}

export function calculateSemesterGpa(courses: CourseItem[]): {
  gpa10: number;
  gpa4: number;
  totalCredits: number;
  earnedCredits: number;
} {
  const completedCourses = courses.filter((c) => c.finalScore !== null);
  if (completedCourses.length === 0) {
    return { gpa10: 0, gpa4: 0, totalCredits: 0, earnedCredits: 0 };
  }

  let totalCredits = 0;
  let earnedCredits = 0;
  let sumWeighted10 = 0;
  let sumWeighted4 = 0;

  for (const course of completedCourses) {
    const cred = course.credits || 0;
    const s10 = course.finalScore || 0;
    const { scale4 } = convertScale10To4(s10);

    totalCredits += cred;
    sumWeighted10 += s10 * cred;
    sumWeighted4 += scale4 * cred;

    if (s10 >= 4.0) {
      earnedCredits += cred;
    }
  }

  return {
    gpa10: totalCredits > 0 ? Number((sumWeighted10 / totalCredits).toFixed(2)) : 0,
    gpa4: totalCredits > 0 ? Number((sumWeighted4 / totalCredits).toFixed(2)) : 0,
    totalCredits,
    earnedCredits,
  };
}

export function calculateCumulativeCpa(
  pastSemesters: Array<{ credits: number; gpa: number }>,
  currentCourses: CourseItem[]
): { cpa4: number; totalCredits: number } {
  let totalCredits = 0;
  let totalWeighted = 0;

  for (const sem of pastSemesters) {
    if (sem.gpa > 0 && sem.credits > 0) {
      totalCredits += sem.credits;
      totalWeighted += sem.gpa * sem.credits;
    }
  }

  const currentSem = calculateSemesterGpa(currentCourses);
  if (currentSem.totalCredits > 0 && currentSem.gpa4 > 0) {
    totalCredits += currentSem.totalCredits;
    totalWeighted += currentSem.gpa4 * currentSem.totalCredits;
  }

  return {
    cpa4: totalCredits > 0 ? Number((totalWeighted / totalCredits).toFixed(2)) : 0,
    totalCredits,
  };
}

// ==========================================
// 3. GRADE TARGET SOLVER (DỰ BÁO ĐIỂM THI CUỐI KỲ)
// ==========================================

export interface FinalGradeRequirement {
  requiredScore: number;
  isAchievable: boolean;
  explanation: string;
  letterTarget: LetterGrade;
  targetScale10: number;
}

export function solveRequiredFinalGrade(
  components: CourseGradeComponent[],
  targetLetter: LetterGrade = 'A'
): FinalGradeRequirement {
  // Target cutoffs in Scale 10
  const letterCutoffs: Record<LetterGrade, number> = {
    'A+': 9.0,
    'A': 8.5,
    'B+': 8.0,
    'B': 7.0,
    'C+': 6.5,
    'C': 5.5,
    'D+': 5.0,
    'D': 4.0,
    'F': 0.0,
    '—': 8.0,
  };

  const targetScore10 = letterCutoffs[targetLetter] ?? 8.5;

  // Find the final exam component (usually with name including "cuối kỳ" or highest weight with null score)
  const finalComp = components.find(
    (c) => c.name.toLowerCase().includes('cuối kỳ') || c.name.toLowerCase().includes('final')
  ) || components[components.length - 1];

  if (!finalComp) {
    return {
      requiredScore: 0,
      isAchievable: false,
      explanation: 'Không tìm thấy cột điểm thi cuối kỳ.',
      letterTarget: targetLetter,
      targetScale10: targetScore10,
    };
  }

  const otherComponents = components.filter((c) => c.id !== finalComp.id);
  let otherWeightedSum = 0;

  for (const c of otherComponents) {
    const sc = c.score !== null ? c.score : 7.0; // fallback if process score not entered
    otherWeightedSum += sc * (c.weightPercent / 100);
  }

  const finalWeight = finalComp.weightPercent / 100;
  if (finalWeight <= 0) {
    return {
      requiredScore: 0,
      isAchievable: false,
      explanation: 'Tỷ trọng điểm cuối kỳ không hợp lệ.',
      letterTarget: targetLetter,
      targetScale10: targetScore10,
    };
  }

  // targetScore10 = otherWeightedSum + X * finalWeight
  // X = (targetScore10 - otherWeightedSum) / finalWeight
  const rawRequired = (targetScore10 - otherWeightedSum) / finalWeight;
  const roundedRequired = Math.max(0, Number(rawRequired.toFixed(2)));

  const isAchievable = roundedRequired <= 10.0;

  let explanation = '';
  if (roundedRequired <= 0) {
    explanation = `Bạn đã đủ điểm quá trình để chắc chắn đạt điểm ${targetLetter} (chỉ cần thi không bị điểm liệt >= 3.0)!`;
  } else if (isAchievable) {
    explanation = `Bạn cần đạt tối thiểu ${roundedRequired} điểm bài thi cuối kỳ (chiếm ${finalComp.weightPercent}%) để đạt tổng kết ${targetLetter}.`;
  } else {
    explanation = `Cần ${roundedRequired} điểm (vượt quá thang điểm 10.0). Bạn nên đặt mục tiêu thực tế hơn như ${
      targetLetter === 'A+' ? 'A' : targetLetter === 'A' ? 'B+' : 'B'
    }.`;
  }

  return {
    requiredScore: roundedRequired,
    isAchievable,
    explanation,
    letterTarget: targetLetter,
    targetScale10: targetScore10,
  };
}

// ==========================================
// 4. ACADEMIC WARNING SYSTEM
// ==========================================

export function getAcademicWarningStatus(
  cpa4: number,
  failedCredits: number
): {
  level: 'safe' | 'warning' | 'critical';
  title: string;
  message: string;
} {
  if (cpa4 < 2.0 || failedCredits >= 12) {
    return {
      level: 'critical',
      title: '🚨 Cảnh báo học vụ mức 2',
      message: 'CPA dưới 2.0 hoặc nợ từ 12 tín chỉ. Bạn có nguy cơ bị buộc thôi học nếu không cải thiện trong kỳ này.',
    };
  }

  if (cpa4 < 2.5 || failedCredits >= 6) {
    return {
      level: 'warning',
      title: '⚠️ Cảnh báo học vụ mức 1',
      message: 'CPA đang ở mức tiệm cận nguy hiểm. Cần ưu tiên cải thiện điểm các môn cơ sở ngành.',
    };
  }

  return {
    level: 'safe',
    title: '✅ Trạng thái học tập an toàn',
    message: 'Phong độ ổn định, bám sát lộ trình xét học bổng và tốt nghiệp đúng hạn.',
  };
}

// ==========================================
// 5. SEEDED REALISTIC VIETNAMESE STUDENT COURSES
// ==========================================

export const SEED_SEMESTERS: SemesterItem[] = [
  {
    id: 'sem-fall-26',
    name: 'Học kỳ I · 2026–2027',
    academicYear: '2026-2027',
    credits: 14,
    gpa: null,
    gpa10: null,
    coursesCount: 4,
    status: 'ongoing',
    dates: '17/08/2026 — 20/12/2026',
    progressPercent: 35,
  },
  {
    id: 'sem-spring-26',
    name: 'Học kỳ II · 2025–2026',
    academicYear: '2025-2026',
    credits: 16,
    gpa: 3.8,
    gpa10: 8.6,
    coursesCount: 5,
    status: 'completed',
    dates: '12/01/2026 — 24/05/2026',
    progressPercent: 100,
  },
  {
    id: 'sem-fall-25',
    name: 'Học kỳ I · 2025–2026',
    academicYear: '2025-2026',
    credits: 15,
    gpa: 3.65,
    gpa10: 8.3,
    coursesCount: 5,
    status: 'completed',
    dates: '18/08/2025 — 21/12/2025',
    progressPercent: 100,
  },
];

export const SEED_COURSES: CourseItem[] = [
  {
    id: 'cs101',
    code: 'CS101',
    name: 'Mạng máy tính & Truyền thông',
    semesterId: 'sem-fall-26',
    credits: 4,
    instructor: 'TS. Lê Văn An',
    room: 'D201 · Tòa D',
    schedule: 'Thứ Hai (08:00 - 11:30)',
    syllabusUrl: '#',
    components: [
      { id: 'cs101-c1', name: 'Chuyên cần & Lab', weightPercent: 20, score: 9.0 },
      { id: 'cs101-c2', name: 'Kiểm tra giữa kỳ', weightPercent: 30, score: 8.5 },
      { id: 'cs101-c3', name: 'Thi cuối kỳ', weightPercent: 50, score: null },
    ],
    finalScore: null,
    letterGrade: '—',
    status: 'ongoing',
    color: '#3DE8FF',
  },
  {
    id: 'cs201',
    code: 'CS201',
    name: 'Cấu trúc dữ liệu & Giải thuật',
    semesterId: 'sem-fall-26',
    credits: 4,
    instructor: 'TS. Trần Văn Bình',
    room: 'B305 · Tòa B',
    schedule: 'Thứ Ba (13:30 - 17:00)',
    syllabusUrl: '#',
    components: [
      { id: 'cs201-c1', name: 'Bài tập tuần', weightPercent: 20, score: 8.5 },
      { id: 'cs201-c2', name: 'Đồ án giữa kỳ', weightPercent: 30, score: 8.0 },
      { id: 'cs201-c3', name: 'Thi cuối kỳ', weightPercent: 50, score: null },
    ],
    finalScore: null,
    letterGrade: '—',
    status: 'ongoing',
    color: '#7C5CFF',
  },
  {
    id: 'math101',
    code: 'MATH101',
    name: 'Xác suất Thống kê ứng dụng',
    semesterId: 'sem-fall-26',
    credits: 3,
    instructor: 'PGS. Nguyễn Thu Hà',
    room: 'C101 · Tòa C',
    schedule: 'Thứ Tư (14:00 - 16:30)',
    syllabusUrl: '#',
    components: [
      { id: 'math101-c1', name: 'Chuyên cần', weightPercent: 20, score: 8.0 },
      { id: 'math101-c2', name: 'Giữa kỳ', weightPercent: 30, score: 6.5 },
      { id: 'math101-c3', name: 'Thi cuối kỳ', weightPercent: 50, score: null },
    ],
    finalScore: null,
    letterGrade: '—',
    status: 'warning',
    color: '#FFB800',
  },
  {
    id: 'ml01',
    code: 'ML01',
    name: 'Triết học Mác - Lênin',
    semesterId: 'sem-fall-26',
    credits: 3,
    instructor: 'ThS. Hoàng Minh Đức',
    room: 'A102 · Tòa A',
    schedule: 'Thứ Năm (09:00 - 11:30)',
    syllabusUrl: '#',
    components: [
      { id: 'ml01-c1', name: 'Thuyết trình nhóm', weightPercent: 30, score: 8.8 },
      { id: 'ml01-c2', name: 'Kiểm tra trắc nghiệm', weightPercent: 20, score: 8.0 },
      { id: 'ml01-c3', name: 'Thi cuối kỳ', weightPercent: 50, score: null },
    ],
    finalScore: null,
    letterGrade: '—',
    status: 'ongoing',
    color: '#C6FF3D',
  },
];

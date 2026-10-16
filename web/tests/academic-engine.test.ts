import test from 'node:test';
import assert from 'node:assert/strict';

import {
  convertScale10To4,
  computeCourseTotalScore,
  calculateSemesterGpa,
  calculateCumulativeCpa,
  solveRequiredFinalGrade,
  getAcademicWarningStatus,
  SEED_SEMESTERS,
  SEED_COURSES,
  type CourseGradeComponent,
  type CourseItem,
  type SemesterItem,
} from '../src/lib/academic-engine.ts';

test('Academic Engine (1/6): Scale 10 to 4 and letter grade conversions match Vietnamese university criteria', () => {
  // A+ (>= 9.0)
  const aPlus = convertScale10To4(9.5);
  assert.equal(aPlus.scale4, 4.0);
  assert.equal(aPlus.letter, 'A+');

  // A (8.5 - 8.9)
  const a = convertScale10To4(8.7);
  assert.equal(a.scale4, 3.7);
  assert.equal(a.letter, 'A');

  // B+ (8.0 - 8.4)
  const bPlus = convertScale10To4(8.0);
  assert.equal(bPlus.scale4, 3.5);
  assert.equal(bPlus.letter, 'B+');

  // B (7.0 - 7.9)
  const b = convertScale10To4(7.3);
  assert.equal(b.scale4, 3.0);
  assert.equal(b.letter, 'B');

  // C+ (6.5 - 6.9)
  const cPlus = convertScale10To4(6.6);
  assert.equal(cPlus.scale4, 2.5);
  assert.equal(cPlus.letter, 'C+');

  // C (5.5 - 6.4)
  const c = convertScale10To4(5.8);
  assert.equal(c.scale4, 2.0);
  assert.equal(c.letter, 'C');

  // D+ (5.0 - 5.4)
  const dPlus = convertScale10To4(5.2);
  assert.equal(dPlus.scale4, 1.5);
  assert.equal(dPlus.letter, 'D+');

  // D (4.0 - 4.9)
  const d = convertScale10To4(4.1);
  assert.equal(d.scale4, 1.0);
  assert.equal(d.letter, 'D');

  // F (< 4.0)
  const f = convertScale10To4(3.8);
  assert.equal(f.scale4, 0.0);
  assert.equal(f.letter, 'F');

  // Edge null / NaN
  const nullCase = convertScale10To4(null);
  assert.equal(nullCase.letter, '—');
});

test('Academic Engine (2/6): Course total score calculation with weight percentages', () => {
  const components: CourseGradeComponent[] = [
    { id: 'c1', name: 'Chuyên cần', weightPercent: 20, score: 10.0 }, // 2.0
    { id: 'c2', name: 'Giữa kỳ', weightPercent: 30, score: 8.0 },    // 2.4
    { id: 'c3', name: 'Cuối kỳ', weightPercent: 50, score: 8.0 },    // 4.0
  ];

  const total = computeCourseTotalScore(components);
  assert.equal(total, 8.4);

  // Missing final score -> projected based on available weights
  const incomplete: CourseGradeComponent[] = [
    { id: 'c1', name: 'Chuyên cần', weightPercent: 20, score: 9.0 },
    { id: 'c2', name: 'Giữa kỳ', weightPercent: 30, score: 8.0 },
    { id: 'c3', name: 'Cuối kỳ', weightPercent: 50, score: null },
  ];
  const projected = computeCourseTotalScore(incomplete);
  // (9.0 * 0.2 + 8.0 * 0.3) / 0.5 * 10 = (1.8 + 2.4) / 0.5 * 10 = 4.2 / 0.5 = 8.4
  assert.ok(projected !== null && projected > 8.0 && projected < 9.0);
});

test('Academic Engine (3/6): Weighted Semester GPA and Cumulative CPA computation', () => {
  const courses: CourseItem[] = [
    {
      id: 'c1',
      code: 'CS101',
      name: 'Môn 1',
      semesterId: 's1',
      credits: 4,
      instructor: 'A',
      room: 'R1',
      schedule: 'Mon',
      components: [],
      finalScore: 8.5, // 3.7
      letterGrade: 'A',
      status: 'passed',
      color: '#fff',
    },
    {
      id: 'c2',
      code: 'CS102',
      name: 'Môn 2',
      semesterId: 's1',
      credits: 3,
      instructor: 'B',
      room: 'R2',
      schedule: 'Tue',
      components: [],
      finalScore: 9.0, // 4.0
      letterGrade: 'A+',
      status: 'passed',
      color: '#fff',
    },
  ];

  const gpa = calculateSemesterGpa(courses);
  // Total points = 4 * 3.7 + 3 * 4.0 = 14.8 + 12.0 = 26.8
  // Total credits = 7
  // GPA = 26.8 / 7 = 3.8285... ~ 3.83
  assert.equal(gpa.gpa4, 3.83);
  assert.equal(gpa.totalCredits, 7);

  const pastSemesters = [
    { credits: 16, gpa: 3.8 },
    { credits: 14, gpa: 3.6 },
  ];

  const cpa = calculateCumulativeCpa(pastSemesters, []);
  // (16 * 3.8 + 14 * 3.6) / 30 = (60.8 + 50.4) / 30 = 111.2 / 30 = 3.706... ~ 3.71
  assert.equal(cpa.cpa4, 3.71);
  assert.equal(cpa.totalCredits, 30);
});

test('Academic Engine (4/6): Grade Target Solver calculates accurate required final exam scores', () => {
  const components: CourseGradeComponent[] = [
    { id: 'c1', name: 'Chuyên cần', weightPercent: 20, score: 9.0 }, // 1.8
    { id: 'c2', name: 'Giữa kỳ', weightPercent: 30, score: 8.5 },    // 2.55
    { id: 'c3', name: 'Thi cuối kỳ', weightPercent: 50, score: null },// 50%
  ];
  // Process score sum = 1.8 + 2.55 = 4.35
  // To reach A (>= 8.5):
  // 4.35 + finalScore * 0.5 >= 8.5 => finalScore * 0.5 >= 4.15 => finalScore >= 8.30
  const solveA = solveRequiredFinalGrade(components, 'A');
  assert.equal(solveA.letterTarget, 'A');
  assert.equal(solveA.requiredScore, 8.3);
  assert.equal(solveA.isAchievable, true);

  // To reach A+ (>= 9.0):
  // 4.35 + finalScore * 0.5 >= 9.0 => finalScore * 0.5 >= 4.65 => finalScore >= 9.30
  const solveAPlus = solveRequiredFinalGrade(components, 'A+');
  assert.equal(solveAPlus.requiredScore, 9.3);
  assert.equal(solveAPlus.isAchievable, true);

  // If process is already extremely high (e.g. 10 and 10)
  const superComponents: CourseGradeComponent[] = [
    { id: 'c1', name: 'Chuyên cần', weightPercent: 50, score: 10.0 }, // 5.0
    { id: 'c2', name: 'Giữa kỳ', weightPercent: 30, score: 10.0 },    // 3.0
    { id: 'c3', name: 'Thi cuối kỳ', weightPercent: 20, score: null },// 20%
  ];
  // Process sum = 8.0. Target C (>= 5.5) -> already >= 5.5
  const solveGuaranteed = solveRequiredFinalGrade(superComponents, 'C');
  assert.equal(solveGuaranteed.requiredScore, 0);
  assert.equal(solveGuaranteed.isAchievable, true);

  // If process is low and target is impossible
  const lowComponents: CourseGradeComponent[] = [
    { id: 'c1', name: 'Chuyên cần', weightPercent: 20, score: 4.0 }, // 0.8
    { id: 'c2', name: 'Giữa kỳ', weightPercent: 30, score: 4.0 },    // 1.2
    { id: 'c3', name: 'Thi cuối kỳ', weightPercent: 50, score: null },// 50%
  ];
  // Process sum = 2.0. Target A+ (>= 9.0): (9.0 - 2.0) / 0.5 = 14.0 > 10.0 -> impossible!
  const solveImpossible = solveRequiredFinalGrade(lowComponents, 'A+');
  assert.equal(solveImpossible.isAchievable, false);
  assert.ok(solveImpossible.requiredScore > 10.0);
});

test('Academic Engine (5/6): Academic Warning diagnostics accurately triggers warnings', () => {
  const safe = getAcademicWarningStatus(3.5, 0);
  assert.equal(safe.level, 'safe');

  const warningGpa = getAcademicWarningStatus(2.3, 0);
  assert.equal(warningGpa.level, 'warning');

  const warningCredits = getAcademicWarningStatus(3.2, 8);
  assert.equal(warningCredits.level, 'warning');

  const criticalGpa = getAcademicWarningStatus(1.8, 0);
  assert.equal(criticalGpa.level, 'critical');

  const criticalCredits = getAcademicWarningStatus(2.8, 14);
  assert.equal(criticalCredits.level, 'critical');
});

test('Academic Engine (6/6): Seed semesters and courses have valid structures', () => {
  assert.ok(SEED_SEMESTERS.length >= 3, 'Must have at least 3 seed semesters');
  assert.ok(SEED_COURSES.length >= 4, 'Must have at least 4 seed courses');

  const ongoingSem = SEED_SEMESTERS.find((s) => s.status === 'ongoing');
  assert.ok(ongoingSem, 'Must have an ongoing semester');

  for (const c of SEED_COURSES) {
    assert.ok(c.code, 'Course must have a code');
    assert.ok(c.name, 'Course must have a name');
    assert.ok(c.credits > 0, 'Course credits must be positive');
    assert.ok(c.components.length > 0, 'Course must have grade components');
    const totalWeight = c.components.reduce((sum, comp) => sum + comp.weightPercent, 0);
    assert.equal(totalWeight, 100, `Weights for ${c.code} must sum to 100%`);
  }
});

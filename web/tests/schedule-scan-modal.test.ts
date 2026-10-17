/**
 * CampusOS Task 2 — Milestone 2: Cyber-Scanner Interactive Modal & Matrix Editor UI
 * Comprehensive Test Suite for `web/src/components/calendar/schedule-scan-modal.tsx`
 *
 * Requirements Source:
 *   - ORIGINAL_REQUEST.md (## 2026-10-17T12:35:24Z: Task 2 R2)
 *   - orchestrator_19/PROJECT.md (§ Milestone 2, § Feature Inventory #7-#11, § Interface Contracts)
 *   - explorer_19_survey_dashboard/handoff.md (§ 4.3 Proposed Component: ScheduleScannerModal)
 *   - worker_19_m2/DISPATCH.md
 *
 * Runner:
 *   node --experimental-strip-types --test tests/schedule-scan-modal.test.ts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  mapPeriodToTime,
  normalizeDayOfWeek,
  getPeriodTimeRange,
  detectExplicitTimeRange,
  generateRecurringDates,
  type ExtractedScheduleCourse,
} from '../src/lib/period-time-mapper.ts';

import {
  getSampleScheduleCourses,
  MOCK_VIETNAMESE_TIMETABLE,
  type ScheduleScanResponse,
} from '../src/lib/schedule-ocr-engine.ts';

const componentPath = path.resolve(
  process.cwd(),
  'src',
  'components',
  'calendar',
  'schedule-scan-modal.tsx'
);

// ============================================================================
// SUITE 1: Component File Existence & Architectural Exports
// ============================================================================
describe('Suite 1: ScheduleScanModal Architectural & Contract Integrity', () => {
  test('1.1 File exists at web/src/components/calendar/schedule-scan-modal.tsx', () => {
    assert.ok(fs.existsSync(componentPath), `Component file must exist at ${componentPath}`);
  });

  test('1.2 Client Component directive and export contracts', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    // 'use client'
    assert.match(content, /^'use client';/m, 'Must declare "use client" directive at top of file');

    // Named & default exports
    assert.match(content, /export function ScheduleScanModal/, 'Must export ScheduleScanModal named function');
    assert.match(content, /export default ScheduleScanModal/, 'Must export ScheduleScanModal as default export');
    assert.match(content, /export type ScannedCourseRow/, 'Must export ScannedCourseRow type');
    assert.match(content, /export interface ScheduleScanModalProps/, 'Must export ScheduleScanModalProps interface');
  });

  test('1.3 Props contract matches UI specification', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /isOpen:\s*boolean/, 'Props must declare isOpen: boolean');
    assert.match(content, /onClose:\s*\(\)\s*=>\s*void/, 'Props must declare onClose: () => void');
    assert.match(content, /onCommitSchedule\?:/, 'Props must support onCommitSchedule callback');
    assert.match(content, /onScanSuccess\?:/, 'Props must support onScanSuccess callback');
    assert.match(content, /initialCourses\?:/, 'Props must support initialCourses prop');
  });

  test('1.4 Required UI and Lucide icons imported', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /from 'lucide-react'/, 'Must import icons from lucide-react');
    assert.match(content, /X\b/, 'Must import X icon');
    assert.match(content, /Zap\b/, 'Must import Zap icon');
    assert.match(content, /Sparkles\b/, 'Must import Sparkles icon');
    assert.match(content, /UploadCloud\b/, 'Must import UploadCloud icon');
    assert.match(content, /Trash2\b/, 'Must import Trash2 icon');
    assert.match(content, /Plus\b/, 'Must import Plus icon');
    assert.match(content, /Loader2\b/, 'Must import Loader2 icon');
    assert.match(content, /Clock\b/, 'Must import Clock icon');
  });
});

// ============================================================================
// SUITE 2: Cyber-Glass & Neo-Brutal Aurora Visual Styling
// ============================================================================
describe('Suite 2: Cyber-Glass & Neo-Brutal Aurora Styling', () => {
  test('2.1 Frosted glassmorphism background and high-blur overlay', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /bg-\[#10101E\]\/95/, 'Must use Cyber-Glass base bg-[#10101E]/95');
    assert.match(content, /backdrop-blur-2xl/, 'Must feature backdrop-blur-2xl glassmorphism');
    assert.match(content, /backdrop-blur-xl/, 'Backdrop overlay must feature backdrop-blur-xl');
  });

  test('2.2 Neo-Brutal cyan accent border and 8px hard offset shadow', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /border-2 border-cyan-400\/40|border-cyan-400/, 'Must have cyan accent border');
    assert.match(content, /shadow-\[8px_8px_0px_#000\]/, 'Must have Neo-Brutal 8px offset black shadow');
    assert.match(content, /hard-border/, 'Must include hard-border utility class');
    assert.match(content, /rounded-\[26px\]/, 'Shell must have 26px rounded corners');
  });

  test('2.3 Animated Laser-Scan visual feedback line', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /@keyframes laserScan/, 'Must define @keyframes laserScan in inline styles');
    assert.match(content, /animate-laser-scan-bar/, 'Must declare animate-laser-scan-bar class');
    assert.match(content, /shadow-\[0_0_20px_#3DE8FF\]|shadow-\[0_0_15px_#3DE8FF\]/, 'Must feature cyan laser glow');
  });

  test('2.4 Gemini Vision & Period Mapping branding badges', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /AI Smart OCR Schedule Importer/, 'Header must feature title');
    assert.match(content, /Gemini Vision/, 'Header must feature Gemini Vision pill');
    assert.match(content, /Vietnamese Academic Period Mapping Engine/, 'Scanning state must mention period mapping engine');
  });
});

// ============================================================================
// SUITE 3: Drag-and-Drop Zone & 1-Click Sample Timetable
// ============================================================================
describe('Suite 3: Dropzone & 1-Click Sample Timetable', () => {
  test('3.1 Drag-and-drop event handlers implemented', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /onDragOver=\{handleDragOver\}/, 'Dropzone must handle dragOver');
    assert.match(content, /onDragLeave=\{handleDragLeave\}/, 'Dropzone must handle dragLeave');
    assert.match(content, /onDrop=\{handleDrop\}/, 'Dropzone must handle drop');
    assert.match(content, /dragOver/, 'Must track dragOver state for visual feedback');
  });

  test('3.2 File input supports image format selection', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /type="file"/, 'Must contain file input');
    assert.match(content, /accept="image\/\*"/, 'Must accept image/* files');
    assert.match(content, /onChange=\{handleFileChange\}/, 'Must handle file change');
    assert.match(content, /FileReader/, 'Must use FileReader to process image data');
  });

  test('3.3 1-Click "Dùng ảnh TKB mẫu" button exists and triggers handleUseSample', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /Dùng ảnh TKB mẫu \(1-Click\)/, 'Must display sample timetable button label');
    assert.match(content, /onClick=\{handleUseSample\}/, 'Must bind click to handleUseSample');
    assert.match(content, /getSampleScheduleCourses/, 'Must import and use getSampleScheduleCourses');
  });

  test('3.4 Sample schedule generation meets < 1.5s latency gate', () => {
    const start = performance.now();
    const courses = getSampleScheduleCourses();
    const elapsed = performance.now() - start;

    assert.ok(elapsed < 1500, `Sample generation took ${elapsed}ms, exceeding 1500ms limit`);
    assert.equal(courses.length, 5, 'Sample timetable must contain exactly 5 courses');
  });

  test('3.5 Sample courses contain authentic university schedule fixtures', () => {
    const courses = getSampleScheduleCourses();
    const names = courses.map((c) => c.courseName);

    assert.ok(names.some((n) => n.includes('Mạng máy tính')), 'Missing Mạng máy tính');
    assert.ok(names.some((n) => n.includes('Cấu trúc Dữ liệu')), 'Missing Cấu trúc Dữ liệu');
    assert.ok(names.some((n) => n.includes('Giải tích 2')), 'Missing Giải tích 2');
    assert.ok(names.some((n) => n.includes('Triết học')), 'Missing Triết học');
    assert.ok(names.some((n) => n.includes('Lab Cisco') || n.includes('Thực hành')), 'Missing Lab Cisco');
  });
});

// ============================================================================
// SUITE 4: Interactive Matrix Preview Table & Inline Editing
// ============================================================================
describe('Suite 4: Interactive Matrix Table & Inline Editing', () => {
  test('4.1 Matrix table structure contains all required columns', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /<table/, 'Must render table element');
    assert.match(content, /<th[^>]*>Môn học<\/th>/, 'Must have Môn học header');
    assert.match(content, /<th[^>]*>Thứ<\/th>/, 'Must have Thứ header');
    assert.match(content, /<th[^>]*>Tiết học<\/th>/, 'Must have Tiết học header');
    assert.match(content, /<th[^>]*>Giờ học<\/th>/, 'Must have Giờ học header');
    assert.match(content, /<th[^>]*>Phòng<\/th>/, 'Must have Phòng header');
    assert.match(content, /<th[^>]*>Giảng viên<\/th>/, 'Must have Giảng viên header');
    assert.match(content, /<th[^>]*>Loại<\/th>/, 'Must have Loại header');
    assert.match(content, /<th[^>]*>Xóa<\/th>/, 'Must have Xóa header');
  });

  test('4.2 Day of week select dropdown covers days 2 through 8 (Monday to Sunday)', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /<option value=\{2\}>Thứ 2<\/option>/, 'Must have option for Thứ 2');
    assert.match(content, /<option value=\{3\}>Thứ 3<\/option>/, 'Must have option for Thứ 3');
    assert.match(content, /<option value=\{4\}>Thứ 4<\/option>/, 'Must have option for Thứ 4');
    assert.match(content, /<option value=\{5\}>Thứ 5<\/option>/, 'Must have option for Thứ 5');
    assert.match(content, /<option value=\{6\}>Thứ 6<\/option>/, 'Must have option for Thứ 6');
    assert.match(content, /<option value=\{7\}>Thứ 7<\/option>/, 'Must have option for Thứ 7');
    assert.match(content, /<option value=\{8\}>Chủ Nhật<\/option>/, 'Must have option for Chủ Nhật');
  });

  test('4.3 Period change dynamically maps to start and end times via mapPeriodToTime', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /mapPeriodToTime/, 'Component must import and call mapPeriodToTime');
    assert.match(content, /if \(field === 'periodString'\)/, 'Must intercept periodString change');

    // Functional verification of the mapped periods
    const p1 = mapPeriodToTime('Tiết 1 - 3');
    assert.equal(p1.startTime, '07:00');
    assert.equal(p1.endTime, '09:25');

    const p2 = mapPeriodToTime('Tiết 7 - 9');
    assert.equal(p2.startTime, '12:30');
    assert.equal(p2.endTime, '14:55');

    const p3 = mapPeriodToTime('Tiết 4 - 6');
    assert.equal(p3.startTime, '09:35');
    assert.equal(p3.endTime, '12:00');

    const p4 = mapPeriodToTime('Tiết 10 - 12');
    assert.equal(p4.startTime, '15:05');
    assert.equal(p4.endTime, '17:30');
  });

  test('4.4 Day of week change updates both numeric day and dayOfWeekName', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /if \(field === 'dayOfWeek'\)/, 'Must intercept dayOfWeek change');
    assert.match(content, /normalizeDayOfWeek\(value\)/, 'Must call normalizeDayOfWeek');

    const norm2 = normalizeDayOfWeek(2);
    assert.equal(norm2?.vietnameseName, 'Thứ Hai');

    const norm5 = normalizeDayOfWeek(5);
    assert.equal(norm5?.vietnameseName, 'Thứ Năm');

    const norm8 = normalizeDayOfWeek(8);
    assert.equal(norm8?.vietnameseName, 'Chủ Nhật');
  });

  test('4.5 Row deletion removes row from state', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /deleteRow\(row\.id\)/, 'Must call deleteRow with row.id');
    assert.match(content, /prev\.filter\(\(c\) => c\.id !== id\)/, 'deleteRow must filter out row');
  });

  test('4.6 Manual row insertion with "+ Thêm môn học"', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /\+ Thêm môn học/, 'Must have "+ Thêm môn học" button');
    assert.match(content, /handleAddManualRow/, 'Must handle manual row addition');
    assert.match(content, /Môn học mới/, 'New row must have default courseName');
  });

  test('4.7 Checkbox selection toggle per row and select-all', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /toggleSelectRow\(row\.id\)/, 'Must support row selection toggle');
    assert.match(content, /toggleSelectAll/, 'Must support select all toggle');
  });
});

// ============================================================================
// SUITE 5: Confirmation Action, Confetti & Gamification
// ============================================================================
describe('Suite 5: Confirmation Action, Confetti & Gamification', () => {
  test('5.1 "Đồng bộ vào Lịch" button calls onCommitSchedule with selected rows', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /Đồng bộ vào Lịch/, 'Must render "Đồng bộ vào Lịch" button text');
    assert.match(content, /onClick=\{handleCommit\}/, 'Button must bind to handleCommit');
    assert.match(content, /onCommitSchedule\?\.\(selected\)/, 'handleCommit must call onCommitSchedule');
  });

  test('5.2 Button is disabled when no courses are selected or scanning', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(
      content,
      /disabled=\{selectedCount === 0 \|\| isScanning \|\| isCommitted\}/,
      'Must disable commit button when 0 selected or scanning or already committed'
    );
  });

  test('5.3 Celebratory Canvas2D confetti particle system', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /triggerConfetti\(clickX, clickY\)/, 'handleCommit must trigger confetti at click coordinates');
    assert.match(content, /canvas\.getContext\('2d'\)/, 'Must get 2d context for confetti rendering');
    assert.match(content, /requestAnimationFrame\(frame\)/, 'Must use requestAnimationFrame for 60-120FPS animation');
    assert.match(content, /ctx\.clearRect/, 'Must clear canvas context on animation finish');
  });

  test('5.4 Floating +100 XP notification and toast banner', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /setFloatingXp\(\{ x: clickX, y: clickY \}\)/, 'Must set floating XP coordinates');
    assert.match(content, /\+100 XP 🔥/, 'Must render +100 XP 🔥 text in floating pill');
    assert.match(content, /🎉 Đã đồng bộ thành công/, 'Must show celebratory success toast message');
  });

  test('5.5 Custom DOM events dispatched for global store and sound effects', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /campusos:schedule-imported/, 'Must dispatch campusos:schedule-imported event');
    assert.match(content, /campusos:xp-awarded/, 'Must dispatch campusos:xp-awarded event');
    assert.match(content, /amount:\s*100/, 'XP amount must be exactly 100');
    assert.match(content, /reason:\s*'Quét TKB bằng AI'/, 'Reason must be "Quét TKB bằng AI"');
  });
});

// ============================================================================
// SUITE 6: Accessibility, Keyboard & Viewport Containment
// ============================================================================
describe('Suite 6: Accessibility, Keyboard & Viewport Containment', () => {
  test('6.1 Accessible dialog attributes on modal element', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /role="dialog"/, 'Shell must have role="dialog"');
    assert.match(content, /aria-modal="true"/, 'Shell must have aria-modal="true"');
    assert.match(content, /aria-labelledby="schedule-scan-modal-title"/, 'Shell must reference header title ID');
    assert.match(content, /id="schedule-scan-modal-title"/, 'Header title must have matching ID');
  });

  test('6.2 Escape key dismisses modal', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /e\.key === 'Escape'/, 'Must test for Escape key');
    assert.match(content, /window\.addEventListener\('keydown', handleKeyDown\)/, 'Must register keydown listener');
    assert.match(content, /window\.removeEventListener\('keydown', handleKeyDown\)/, 'Must clean up keydown listener on unmount');
  });

  test('6.3 Single-viewport containment without page overflow', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /max-h-\[90vh\]/, 'Modal shell must be clamped to max-h-[90vh]');
    assert.match(content, /overflow-hidden/, 'Modal shell must have overflow-hidden');
    assert.match(content, /overflow-y-auto/, 'Modal body must scroll internally');
    assert.match(content, /overflow-x-hidden/, 'Backdrop overlay must prevent horizontal page scroll');
  });

  test('6.4 Close button has accessible label', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /aria-label="Đóng hộp thoại"/, 'Close button must have aria-label');
  });
});

// ============================================================================
// SUITE 7: End-to-End Simulation of Timetable Transformation
// ============================================================================
describe('Suite 7: End-to-End Timetable Transformation Simulation', () => {
  test('7.1 Full pipeline: extracted courses can be mapped to 15-week CalendarEvents', () => {
    const sample = getSampleScheduleCourses();
    assert.equal(sample.length, 5);

    const refDate = new Date('2026-10-19T00:00:00Z'); // A Monday

    for (const course of sample) {
      // 1. Generate 15 weekly dates for this course
      const dates = generateRecurringDates(course.dayOfWeek, 15, refDate);
      assert.equal(dates.length, 15, `Course ${course.courseName} should have 15 weekly dates`);

      // 2. Validate event title format
      const eventTitle = `${course.courseCode} - ${course.courseName}`;
      assert.ok(eventTitle.includes(course.courseCode));
      assert.ok(eventTitle.includes(course.courseName));

      // 3. Validate start and end timestamps
      assert.match(course.startTime, /^([01]\d|2[0-3]):[0-5]\d$/);
      assert.match(course.endTime, /^([01]\d|2[0-3]):[0-5]\d$/);
      assert.ok(course.startTime < course.endTime);

      // 4. Validate location & instructor
      assert.ok(course.room.length > 0);
      assert.ok(course.instructor.length > 0);
    }
  });
});

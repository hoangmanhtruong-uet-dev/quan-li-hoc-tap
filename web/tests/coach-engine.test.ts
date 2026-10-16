import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SUBJECT_KNOWLEDGE_BASE,
  QUIZ_BANK,
  extractStudentContext,
  generateInteractiveQuiz,
  generateSuggestedPlan,
  generateCoachResponse,
  type StudentContext,
} from '../src/lib/coach-engine.ts';

import { syncStudyPlanToCampusEvents } from '../src/lib/coach-client-sync.ts';

import {
  createDefaultSharedState,
  getSharedState,
  resetSharedState,
  formatIsoDateOnly,
} from '../src/lib/campus-store.ts';

const REF_DATE = new Date('2026-10-13T09:00:00');

test('Coach Engine (1/7): Subject knowledge base contains deep dive for core engineering subjects', () => {
  assert.ok(SUBJECT_KNOWLEDGE_BASE['Mạng máy tính'], 'Must have Mạng máy tính');
  assert.ok(SUBJECT_KNOWLEDGE_BASE['CTDL & Giải thuật'], 'Must have CTDL & Giải thuật');
  assert.ok(SUBJECT_KNOWLEDGE_BASE['Triết học Mác - Lênin'], 'Must have Triết học');
  assert.ok(SUBJECT_KNOWLEDGE_BASE['Xác suất Thống kê'], 'Must have Xác suất Thống kê');

  const net = SUBJECT_KNOWLEDGE_BASE['Mạng máy tính']!;
  assert.match(net.deepDive.subnet || '', /Subnetting/i);
  assert.ok(net.tips.length >= 3, 'Must have at least 3 tips');

  const dsa = SUBJECT_KNOWLEDGE_BASE['CTDL & Giải thuật']!;
  assert.match(dsa.deepDive.tree || '', /AVL/i);
});

test('Coach Engine (2/7): Interactive quiz bank questions have 4 options, valid answer index, and XP reward', () => {
  const subjects = Object.keys(QUIZ_BANK);
  assert.ok(subjects.length >= 3, 'Quiz bank should support multiple subjects');

  for (const sub of subjects) {
    const questions = QUIZ_BANK[sub]!;
    for (const q of questions) {
      assert.ok(q.id, 'Question must have id');
      assert.ok(q.question.length > 10, 'Question must have meaningful prompt');
      assert.equal(q.options.length, 4, 'Question must have 4 options A, B, C, D');
      assert.ok(q.correctIndex >= 0 && q.correctIndex < 4, 'correctIndex must be in range 0..3');
      assert.ok(q.xpReward >= 10, 'xpReward must be at least 10 XP');
      assert.ok(q.explanation.length > 5, 'Must provide detailed explanation');
    }
  }

  // Quiz generator fallback
  const generated = generateInteractiveQuiz('Mạng máy tính', 2);
  assert.equal(generated.length, 2);
});

test('Coach Engine (3/7): Student context extraction accurately pulls deadlines, incomplete tasks, and streak', () => {
  const state = createDefaultSharedState(REF_DATE);
  const ctx = extractStudentContext(state, 'great');

  assert.equal(ctx.energy, 'great');
  assert.ok(ctx.streak >= 0);
  assert.ok(ctx.deadlinesCount >= 0);
  assert.ok(Array.isArray(ctx.urgentDeadlines));
  assert.ok(Array.isArray(ctx.incompleteTasks));
});

test('Coach Engine (4/7): Study plan scales intelligently with user energy levels (low, okay, great)', () => {
  const lowPlan = generateSuggestedPlan('low', 'Mạng máy tính', []);
  const okayPlan = generateSuggestedPlan('okay', 'Mạng máy tính', []);
  const greatPlan = generateSuggestedPlan('great', 'Mạng máy tính', []);

  // Low energy should be shorter (around 60 mins) to prevent burnout
  assert.ok(lowPlan.totalMinutes <= 75, 'Low energy plan should be <= 75 mins');
  assert.equal(lowPlan.blocks.length, 2);

  // Okay energy should be balanced (~135 mins)
  assert.ok(okayPlan.totalMinutes > lowPlan.totalMinutes);

  // Great energy should be highest focus (~165 mins)
  assert.ok(greatPlan.totalMinutes > okayPlan.totalMinutes);
  assert.equal(greatPlan.blocks.length, 3);
});

test('Coach Engine (5/7): syncStudyPlanToCampusEvents creates CalendarEvents and awards XP, with complete undo rollback', () => {
  resetSharedState(REF_DATE);
  const initialXp = getSharedState().xp;
  const initialEventsCount = getSharedState().events.length;

  const plan = generateSuggestedPlan('okay', 'Mạng máy tính', []);
  const { addedEvents, undo } = syncStudyPlanToCampusEvents(plan);

  assert.equal(addedEvents.length, plan.blocks.length);

  const stateAfterAccept = getSharedState();
  assert.equal(stateAfterAccept.events.length, initialEventsCount + plan.blocks.length);
  assert.equal(stateAfterAccept.xp, initialXp + 25, 'Accepting plan awards +25 XP');
  assert.equal(stateAfterAccept.aiCoachAccepted, true);

  // Rollback with undo
  undo();
  const stateAfterUndo = getSharedState();
  assert.equal(stateAfterUndo.events.length, initialEventsCount, 'Undo should restore events count');
  assert.equal(stateAfterUndo.xp, initialXp, 'Undo should rollback XP');
  assert.equal(stateAfterUndo.aiCoachAccepted, false);
});

test('Coach Engine (6/7): generateCoachResponse identifies intent for quiz, plan, subnetting, tree, and stats', () => {
  const dummyCtx: StudentContext = {
    name: 'Minh',
    level: 2,
    rankTitle: 'Cú đêm giảng đường',
    xp: 250,
    streak: 5,
    deadlinesCount: 2,
    urgentDeadlines: [{ title: 'Deadline Mạng máy tính', course: 'Mạng', due: '23:59' }],
    incompleteTasks: [{ title: 'Ôn Subnetting', priority: 'high' }],
    energy: 'okay',
    dailyMood: 'cool',
  };

  // 1. Quiz intent
  const quizRes = generateCoachResponse('Tạo quiz 3 câu môn Mạng máy tính', 'Mạng máy tính', dummyCtx);
  assert.equal(quizRes.suggestedAction, 'quiz');
  assert.ok(quizRes.quiz && quizRes.quiz.length > 0);

  // 2. Plan intent
  const planRes = generateCoachResponse('Lên kế hoạch học tập tối nay', 'Mạng máy tính', dummyCtx);
  assert.equal(planRes.suggestedAction, 'calendar');
  assert.ok(planRes.plan && planRes.plan.blocks.length > 0);

  // 3. Subnetting explanation intent
  const subnetRes = generateCoachResponse('Giải thích cách chia subnet mask /26', 'Mạng máy tính', dummyCtx);
  assert.match(subnetRes.markdown, /Subnetting/i);

  // 4. CTDL Tree intent
  const treeRes = generateCoachResponse('Cây AVL xoay như thế nào?', 'CTDL & Giải thuật', dummyCtx);
  assert.match(treeRes.markdown, /AVL/i);

  // 5. Probability intent
  const probRes = generateCoachResponse('Công thức Bayes áp dụng thế nào?', 'Xác suất Thống kê', dummyCtx);
  assert.match(probRes.markdown, /Bayes/i);
});

test('Coach Engine (7/7): Attached file context is acknowledged in response', () => {
  const dummyCtx: StudentContext = {
    name: 'Minh',
    level: 1,
    rankTitle: 'Tân sinh viên',
    xp: 50,
    streak: 2,
    deadlinesCount: 1,
    urgentDeadlines: [],
    incompleteTasks: [],
    energy: 'okay',
    dailyMood: null,
  };

  const resWithFile = generateCoachResponse('Tóm tắt bài học', 'Mạng máy tính', dummyCtx, 'De-cuong-Mang-May-Tinh.pdf');
  assert.match(resWithFile.markdown, /De-cuong-Mang-May-Tinh\.pdf/i);
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSm2Review,
  generateDeterministicArtifacts,
  chatWithPdfDocument,
} from '../src/lib/ai-study-engine.ts';

describe('AI Study Hub & SM-2 Spaced Repetition Algorithm', () => {
  it('SM-2: first repetition with perfect quality (q=5) yields 1 day interval', () => {
    const next = calculateSm2Review(0, 1, 2.5, 5);
    assert.equal(next.repetitions, 1);
    assert.equal(next.intervalDays, 1);
    // EF should increase from 2.5: 2.5 + (0.1 - 0) = 2.6
    assert.equal(next.easeFactor, 2.6);
    assert.ok(next.nextReviewAt);
  });

  it('SM-2: second repetition with good quality (q=4) yields 6 days interval', () => {
    const next = calculateSm2Review(1, 1, 2.6, 4);
    assert.equal(next.repetitions, 2);
    assert.equal(next.intervalDays, 6);
    assert.ok(next.easeFactor > 2.5);
  });

  it('SM-2: third repetition multiplies previous interval by new Ease Factor', () => {
    const prevInterval = 6;
    const prevEf = 2.6;
    const next = calculateSm2Review(2, prevInterval, prevEf, 4);
    assert.equal(next.repetitions, 3);
    const expectedInterval = Math.ceil(prevInterval * next.easeFactor);
    assert.equal(next.intervalDays, expectedInterval);
  });

  it('SM-2: failure recall (q < 3) resets repetitions to 0 and interval to 1', () => {
    const next = calculateSm2Review(4, 25, 2.5, 1);
    assert.equal(next.repetitions, 0);
    assert.equal(next.intervalDays, 1);
    // EF decreases
    assert.ok(next.easeFactor < 2.5);
  });

  it('SM-2: Ease Factor is strictly bounded below by 1.3', () => {
    let ef = 1.4;
    let rep = 2;
    let interval = 5;
    for (let i = 0; i < 5; i++) {
      const res = calculateSm2Review(rep, interval, ef, 0);
      ef = res.easeFactor;
      rep = res.repetitions;
      interval = res.intervalDays;
    }
    assert.ok(ef >= 1.3);
  });

  it('Artifacts: DSA syllabus generates full Executive Summary, 5 quizzes and 5 flashcards', () => {
    const artifacts = generateDeterministicArtifacts('Cấu trúc dữ liệu & Giải thuật', 'Tuần 1: Big-O và CTDL');
    
    // 1. Executive Summary
    assert.ok(artifacts.summary);
    assert.equal(artifacts.summary.readingTimeMinutes, 5);
    assert.ok(artifacts.summary.keyTakeaways.length >= 3);
    assert.ok(artifacts.summary.coreConcepts.length >= 3);
    assert.ok(artifacts.summary.commonPitfalls.length >= 2);

    // 2. Practice Quiz
    assert.equal(artifacts.quizzes.length, 5);
    artifacts.quizzes.forEach((q, idx) => {
      assert.ok(q.id, `Quiz ${idx} missing id`);
      assert.ok(q.question.length > 5, `Quiz ${idx} question too short`);
      assert.equal(q.options.length, 4, `Quiz ${idx} must have 4 options`);
      assert.ok(q.correctAnswerIndex >= 0 && q.correctAnswerIndex <= 3);
      assert.ok(q.explanation.length > 0);
      assert.ok(q.hint.length > 0);
      assert.ok(['EASY', 'MEDIUM', 'HARD'].includes(q.difficulty));
      assert.ok(q.xpReward >= 15);
    });

    // 3. Flashcards 3D Deck
    assert.equal(artifacts.flashcards.length, 5);
    artifacts.flashcards.forEach((fc, idx) => {
      assert.ok(fc.id, `Card ${idx} missing id`);
      assert.ok(fc.front.length > 0);
      assert.ok(fc.back.length > 0);
      assert.equal(fc.repetitions, 0);
      assert.equal(fc.intervalDays, 1);
      assert.equal(fc.easeFactor, 2.5);
    });
  });

  it('Artifacts: Generic course fallback generates valid study suite', () => {
    const artifacts = generateDeterministicArtifacts('Triết học Mác Lênin', 'Quy luật mâu thuẫn');
    assert.ok(artifacts.summary.title.includes('Quy luật mâu thuẫn'));
    assert.ok(artifacts.quizzes.length >= 3);
    assert.ok(artifacts.flashcards.length >= 3);
  });

  it('Chatbot Q&A: provides meaningful pedagogical answer and slide citation', async () => {
    const reply = await chatWithPdfDocument({
      courseName: 'Cấu trúc dữ liệu',
      chapterTitle: 'Độ phức tạp thuật toán',
      query: 'Độ phức tạp Big-O là gì?',
      chatHistory: [],
    });

    assert.equal(reply.role, 'assistant');
    assert.ok(reply.content.length > 20);
    assert.ok(reply.citation);
  });
});

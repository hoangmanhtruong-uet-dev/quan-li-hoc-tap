import test from 'node:test';
import assert from 'node:assert/strict';
import { SupervisorArbiter } from '../src/features/pomodoro/supervisor-arbiter.ts';

test('SupervisorArbiter cho phép mắng lần đầu và áp dụng cooldown', () => {
  const arbiter = new SupervisorArbiter(20);
  assert.equal(arbiter.canRoast(), true);

  arbiter.registerRoast();
  // Ngay sau khi mắng, phải bị chặn bởi cooldown
  assert.equal(arbiter.canRoast(), false);
});

test('SupervisorArbiter tôn trọng thời gian miễn trừ (Tôi đang tra tài liệu)', () => {
  const arbiter = new SupervisorArbiter(5);
  arbiter.requestExemption(120);

  assert.equal(arbiter.isExempt(), true);
  assert.equal(arbiter.canRoast(), false);
  assert.ok(arbiter.getRemainingExemptionSeconds() > 115);
});

test('SupervisorArbiter tính điểm kỷ luật chính xác theo số lần vi phạm', () => {
  const arbiter = new SupervisorArbiter(10);
  // Không vi phạm, hoàn thành 25/25 phút -> 100 điểm
  assert.equal(arbiter.calculateDisciplineScore(25, 25), 100);

  // Vi phạm 3 lần (trừ 15 điểm) -> 85 điểm
  arbiter.registerRoast();
  arbiter.registerRoast();
  arbiter.registerRoast();
  assert.equal(arbiter.calculateDisciplineScore(25, 25), 85);
});

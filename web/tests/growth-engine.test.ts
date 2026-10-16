import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getRequiredXpForNextLevel,
  awardSkillXp,
  resolveRoadmapNodeStatuses,
  calculateRoadmapProgress,
  SEED_ROADMAPS,
  SEED_SKILLS,
  type RoadmapNode,
} from '../src/lib/growth-engine.ts';

test('Growth Engine (1/5): XP requirement progression curve scales with level', () => {
  const req1 = getRequiredXpForNextLevel(1);
  const req2 = getRequiredXpForNextLevel(2);
  const req5 = getRequiredXpForNextLevel(5);
  const req10 = getRequiredXpForNextLevel(10);

  assert.ok(req1 > 0, 'Level 1 requirement must be positive');
  assert.ok(req2 > req1, 'Level 2 requires more XP than Level 1');
  assert.ok(req5 > req2, 'Level 5 requires more XP than Level 2');
  assert.ok(req10 > req5, 'Level 10 requires more XP than Level 5');
});

test('Growth Engine (2/5): Skill XP award handles level up and excess XP carry-over', () => {
  // Level 1 with 100 XP, required is 200. Award 50 XP -> stays level 1, 150 XP
  const r1 = awardSkillXp(1, 100, 50, 10);
  assert.equal(r1.newLevel, 1);
  assert.equal(r1.newXp, 150);
  assert.equal(r1.didLevelUp, false);

  // Level 1 with 150 XP, award 100 XP -> reaches 250 >= 200 -> levels up to 2, 50 XP remaining
  const r2 = awardSkillXp(1, 150, 100, 10);
  assert.equal(r2.newLevel, 2);
  assert.equal(r2.newXp, 50);
  assert.equal(r2.didLevelUp, true);
  assert.equal(r2.levelsGained, 1);

  // Reaching max level (10) caps level at 10
  const rMax = awardSkillXp(9, 500, 100000, 10);
  assert.equal(rMax.newLevel, 10);
});

test('Growth Engine (3/5): Prerequisite DAG resolver dynamically unlocks nodes', () => {
  const nodes: RoadmapNode[] = [
    {
      id: 'node-1',
      title: 'Basics',
      description: 'Intro',
      estimatedHours: 5,
      xpReward: 100,
      status: 'available',
      prerequisites: [],
      category: 'Core',
      resources: [],
    },
    {
      id: 'node-2',
      title: 'Intermediate',
      description: 'Deep dive',
      estimatedHours: 10,
      xpReward: 150,
      status: 'locked',
      prerequisites: ['node-1'],
      category: 'Core',
      resources: [],
    },
    {
      id: 'node-3',
      title: 'Advanced Capstone',
      description: 'Project',
      estimatedHours: 20,
      xpReward: 300,
      status: 'locked',
      prerequisites: ['node-1', 'node-2'],
      category: 'Capstone',
      resources: [],
    },
  ];

  // Initially: node-1 is available, node-2 & node-3 are locked
  const initial = resolveRoadmapNodeStatuses(nodes, new Set());
  assert.equal(initial[0]?.status, 'available');
  assert.equal(initial[1]?.status, 'locked');
  assert.equal(initial[2]?.status, 'locked');

  // Complete node-1: node-1 completed, node-2 unlocks (available), node-3 remains locked (needs node-2)
  const afterN1 = resolveRoadmapNodeStatuses(nodes, new Set(['node-1']));
  assert.equal(afterN1[0]?.status, 'completed');
  assert.equal(afterN1[1]?.status, 'available');
  assert.equal(afterN1[2]?.status, 'locked');

  // Complete node-1 and node-2: node-3 unlocks (available)
  const afterN2 = resolveRoadmapNodeStatuses(nodes, new Set(['node-1', 'node-2']));
  assert.equal(afterN2[0]?.status, 'completed');
  assert.equal(afterN2[1]?.status, 'completed');
  assert.equal(afterN2[2]?.status, 'available');
});

test('Growth Engine (4/5): Roadmap progress metrics calculate correctly', () => {
  const nodes: RoadmapNode[] = [
    {
      id: 'n1',
      title: 'N1',
      description: '',
      estimatedHours: 5,
      xpReward: 100,
      status: 'completed',
      prerequisites: [],
      category: '',
      resources: [],
    },
    {
      id: 'n2',
      title: 'N2',
      description: '',
      estimatedHours: 5,
      xpReward: 200,
      status: 'in_progress',
      prerequisites: [],
      category: '',
      resources: [],
    },
  ];

  const p = calculateRoadmapProgress(nodes);
  assert.equal(p.totalCount, 2);
  assert.equal(p.completedCount, 1);
  assert.equal(p.percent, 50);
  assert.equal(p.earnedXp, 100);
  assert.equal(p.totalXp, 300);
});

test('Growth Engine (5/5): Seed roadmaps and skills matrix data integrity', () => {
  assert.ok(SEED_ROADMAPS.length >= 3, 'Must have at least 3 seed roadmaps');
  assert.ok(SEED_SKILLS.length >= 4, 'Must have at least 4 seed skills');

  for (const r of SEED_ROADMAPS) {
    assert.ok(r.title, 'Roadmap must have title');
    assert.ok(r.nodes.length >= 3, 'Roadmap must have at least 3 nodes');
    assert.ok(r.gradient, 'Roadmap must have gradient');
  }

  for (const s of SEED_SKILLS) {
    assert.ok(s.name, 'Skill must have name');
    assert.ok(s.level >= 1 && s.level <= s.maxLevel, 'Level must be within valid range');
    assert.ok(s.perks.length > 0, 'Skill must have unlockable perks');
  }
});

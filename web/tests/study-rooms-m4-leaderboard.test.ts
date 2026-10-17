/**
 * M4 Leaderboard 3D Arena & Member Holographic Stage Test Suite
 *
 * Verifies:
 * 1. Leaderboard 3D Arena Component Architecture & Three.js 3-Tier Podium Contracts
 * 2. Member Holographic Grid Component Architecture & 3-Color Neon Status Light System
 * 3. Weekly Leaderboard Arena Page Route & Cyber-Glass Layout Integration
 * 4. Weekly Leaderboard Data Service & Podium Candidate Math
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  getWeeklyStudyLeaderboard,
  type LeaderboardStudent,
} from '../src/lib/study-rooms-service.ts';

const arenaComponentPath = path.resolve(
  process.cwd(),
  'src',
  'components',
  'study',
  'leaderboard-3d-arena.tsx'
);

const holoGridComponentPath = path.resolve(
  process.cwd(),
  'src',
  'components',
  'study',
  'member-holo-grid.tsx'
);

const leaderboardPagePath = path.resolve(
  process.cwd(),
  'src',
  'app',
  '(main)',
  'study',
  'rooms',
  'leaderboard',
  'page.tsx'
);

describe('M4: Leaderboard 3D Arena Component (leaderboard-3d-arena.tsx)', () => {
  test('1.1 Leaderboard 3D Arena file exists and exports Leaderboard3DArena', () => {
    assert.ok(fs.existsSync(arenaComponentPath), `Component must exist at ${arenaComponentPath}`);
    const content = fs.readFileSync(arenaComponentPath, 'utf8');

    assert.match(content, /export function Leaderboard3DArena/, 'Must export Leaderboard3DArena function');
    assert.match(content, /export default Leaderboard3DArena/, 'Must default export Leaderboard3DArena for dynamic import');
  });

  test('1.2 Three.js 3-Tier Podium System contracts: Gold, Silver, Bronze cylinders & rings', () => {
    const content = fs.readFileSync(arenaComponentPath, 'utf8');

    // Vanilla Three.js import
    assert.match(content, /import \* as THREE from 'three'/, 'Must import vanilla Three.js');

    // 3-tier podiums (Gold, Silver, Bronze)
    assert.match(content, /goldGeo|goldPodium|0xffd700/, 'Must define Gold podium geometry and gold color');
    assert.match(content, /silverGeo|silverPodium|0xd8e2ec|0xc0c0c0/, 'Must define Silver podium geometry');
    assert.match(content, /bronzeGeo|bronzePodium|0xcd7f32/, 'Must define Bronze podium geometry');

    // Center Gold tallest, Left Silver mid, Right Bronze
    assert.match(content, /position\.set\(0,\s*1\.1,\s*0\)/, 'Gold podium centered at (0, 1.1, 0)');
    assert.match(content, /position\.set\(-2\.8,\s*0\.8,\s*0\.4\)/, 'Silver podium at (-2.8, 0.8, 0.4)');
    assert.match(content, /position\.set\(2\.8,\s*0\.55,\s*0\.4\)/, 'Bronze podium at (2.8, 0.55, 0.4)');
  });

  test('1.3 Rotating Spotlight and Neon Accent Lighting System', () => {
    const content = fs.readFileSync(arenaComponentPath, 'utf8');

    assert.match(content, /THREE\.SpotLight/, 'Must instantiate dynamic SpotLight');
    assert.match(content, /spotLightTarget/, 'SpotLight must have dynamic target');
    assert.match(content, /spotLightTarget\.position\.x = Math\.sin/, 'SpotLight target must sweep/oscillate in animation loop');
    assert.match(content, /THREE\.PointLight|0x3de8ff|0xff3da5/, 'Must include cyber key and rim lights');
  });

  test('1.4 Cyberpunk Gold Trophy with Floating Neon Gem and Sine-wave Levitation', () => {
    const content = fs.readFileSync(arenaComponentPath, 'utf8');

    assert.match(content, /trophyGroup/, 'Must assemble procedural trophy group');
    assert.match(content, /trophyBaseGeo|cupGeo|handleGeo/, 'Must assemble trophy chalice and handles');
    assert.match(content, /gemGeo|gemMat|0x3de8ff/, 'Must assemble floating neon gem in trophy');
    assert.match(content, /trophyGroup\.position\.y = 3\.2 \+ Math\.sin/, 'Trophy must levitate on sine wave');
    assert.match(content, /trophyGroup\.rotation\.y \+=/, 'Trophy must continuously rotate around Y axis');
    assert.match(content, /gem\.rotation\.x \+=/, 'Gem must spin independently');
  });

  test('1.5 Neon Particle Fireworks Celebration System', () => {
    const content = fs.readFileSync(arenaComponentPath, 'utf8');

    assert.match(content, /PARTICLE_COUNT = 600/, 'Must create 600 celebration particles');
    assert.match(content, /THREE\.Points/, 'Must render particles via THREE.Points for 120FPS efficiency');
    assert.match(content, /THREE\.BufferGeometry/, 'Must use BufferGeometry for particle positions and colors');
    assert.match(content, /burstCenters/, 'Must support multiple burst center origins');
    assert.match(content, /THREE\.AdditiveBlending/, 'Must use AdditiveBlending for glowing neon effect');
  });

  test('1.6 Strict Unmount Disposal & DPR Clamp Lifecycle', () => {
    const content = fs.readFileSync(arenaComponentPath, 'utf8');

    assert.match(content, /cancelAnimationFrame\(animId\)/, 'Must cancel animation frame on unmount');
    assert.match(content, /renderer\.dispose\(\)/, 'Must dispose WebGL renderer');
    assert.match(content, /geo\.dispose\(\)/, 'Must dispose all geometries');
    assert.match(content, /mat\.dispose\(\)/, 'Must dispose all materials');
    assert.match(content, /container\.removeChild\(renderer\.domElement\)/, 'Must remove DOM canvas element');
    assert.match(content, /Math\.min\(window\.devicePixelRatio \|\| 1,\s*1\.25\)/, 'DPR must be clamped to <= 1.25');
  });

  test('1.7 Accessibility: Prefers-reduced-motion & WebGL Fallback Mode', () => {
    const content = fs.readFileSync(arenaComponentPath, 'utf8');

    assert.match(content, /prefers-reduced-motion: reduce/, 'Must listen to prefers-reduced-motion media query');
    assert.match(content, /isReducedMotion/, 'Must track reduced motion state');
    assert.match(content, /hasWebGL/, 'Must track WebGL support');
    assert.match(content, /GOLD CHAMPION/, 'Must provide elegant fallback cards for reduced motion');
  });
});

describe('M4: Member Holographic Grid Component (member-holo-grid.tsx)', () => {
  test('2.1 Member Holographic Grid file exists and exports MemberHoloGrid', () => {
    assert.ok(fs.existsSync(holoGridComponentPath), `Component must exist at ${holoGridComponentPath}`);
    const content = fs.readFileSync(holoGridComponentPath, 'utf8');

    assert.match(content, /export function MemberHoloGrid/, 'Must export MemberHoloGrid function');
    assert.match(content, /export interface MemberHoloItem/, 'Must export MemberHoloItem interface');
    assert.match(content, /export interface MemberHoloGridProps/, 'Must export MemberHoloGridProps interface');
  });

  test('2.2 Neon Status Light System: Green (Focusing), Red (Distracted), Yellow (Break)', () => {
    const content = fs.readFileSync(holoGridComponentPath, 'utf8');

    // Green: Focusing
    assert.match(content, /border-emerald-400/, 'Must have emerald green border for focusing');
    assert.match(content, /bg-emerald-400 animate-pulse/, 'Must have green pulsing status light');
    assert.match(content, /Tập trung cao độ/, 'Must label green state as Tập trung cao độ');

    // Red: Distracted / Penalized
    assert.match(content, /border-rose-500/, 'Must have rose red border for distracted');
    assert.match(content, /bg-rose-400 animate-ping/, 'Must have red warning ping light');
    assert.match(content, /Bị phạt \/ Phân tâm/, 'Must label red state as Bị phạt / Phân tâm');

    // Yellow / Amber: Break
    assert.match(content, /border-amber-400/, 'Must have amber border for break');
    assert.match(content, /bg-amber-400/, 'Must have amber status light');
    assert.match(content, /Nghỉ giải lao/, 'Must label yellow state as Nghỉ giải lao');
  });

  test('2.3 Holographic Card Styling, Metrics and Poke Interaction', () => {
    const content = fs.readFileSync(holoGridComponentPath, 'utf8');

    // Holographic scanline and glass styling
    assert.match(content, /backdrop-blur-xl/, 'Cards must feature backdrop-blur-xl');
    assert.match(content, /bg-gradient-to-r from-transparent via-cyan-400/, 'Must have holographic shimmer sheen');

    // Member metrics
    assert.match(content, /total_minutes_contributed/, 'Must format total minutes contributed');
    assert.match(content, /camera_on/, 'Must display camera state indicator');

    // Poke button
    assert.match(content, /onPokeMember/, 'Must support onPokeMember prop');
    assert.match(content, /Nhắc bạn|Đã nhắc!/, 'Must include interactive poke button');
  });

  test('2.4 Status Filtering and Search Input controls', () => {
    const content = fs.readFileSync(holoGridComponentPath, 'utf8');

    assert.match(content, /setSelectedFilter/, 'Must support filtering by status');
    assert.match(content, /setSearchQuery/, 'Must support searching member names');
    assert.match(content, /counts\.focusing/, 'Must display live counts for focusing members');
    assert.match(content, /counts\.distracted/, 'Must display live counts for distracted members');
  });
});

describe('M4: Weekly Leaderboard Arena Page (/study/rooms/leaderboard/page.tsx)', () => {
  test('3.1 Leaderboard Page route file exists and is a Client Component', () => {
    assert.ok(fs.existsSync(leaderboardPagePath), `Page must exist at ${leaderboardPagePath}`);
    const content = fs.readFileSync(leaderboardPagePath, 'utf8');

    assert.match(content, /'use client'/, 'Page must be a client component');
    assert.match(content, /export default function WeeklyLeaderboardArenaPage/, 'Must default export page component');
  });

  test('3.2 Dynamic SSR-Safe Loading for Three.js Canvas', () => {
    const content = fs.readFileSync(leaderboardPagePath, 'utf8');

    assert.match(content, /dynamic\(/, 'Must dynamically import Three.js arena');
    assert.match(content, /ssr:\s*false/, 'Must disable SSR for Three.js canvas to prevent hydration mismatch');
    assert.match(content, /Leaderboard3DArena/, 'Must mount Leaderboard3DArena');
  });

  test('3.3 Top 3 Spotlight Cards (Gold, Silver, Bronze)', () => {
    const content = fs.readFileSync(leaderboardPagePath, 'utf8');

    assert.match(content, /👑 QUÁN QUÂN TUẦN/, 'Must render Gold Champion card');
    assert.match(content, /🥈 Á QUÂN TUẦN/, 'Must render Silver Runner-up card');
    assert.match(content, /🥉 QUÝ QUÂN TUẦN/, 'Must render Bronze 3rd-place card');
    assert.match(content, /border-amber-400/, 'Gold card must have amber-400 border');
    assert.match(content, /border-slate-300/, 'Silver card must have slate-300 border');
    assert.match(content, /border-amber-700/, 'Bronze card must have bronze border');
  });

  test('3.4 Full Rankings Table and Time Period Filtering', () => {
    const content = fs.readFileSync(leaderboardPagePath, 'utf8');

    assert.match(content, /BẢNG XẾP HẠNG TOÀN DIỆN/, 'Must include full rankings section');
    assert.match(content, /Tuần này/, 'Must support weekly period filter');
    assert.match(content, /Tháng này/, 'Must support monthly period filter');
    assert.match(content, /Mọi lúc/, 'Must support all-time period filter');
    assert.match(content, /Giờ tập trung/, 'Table must have focus hours column');
    assert.match(content, /Chuỗi Streak/, 'Table must have streak column');
  });

  test('3.5 Live Online Champions Holo Grid Integration & Detail Modal', () => {
    const content = fs.readFileSync(leaderboardPagePath, 'utf8');

    assert.match(content, /<MemberHoloGrid/, 'Must embed MemberHoloGrid for live active champions');
    assert.match(content, /CHIẾN THẦN ĐANG HỌC TRỰC TUYẾN/, 'Must have live champions section header');
    assert.match(content, /selectedStudent/, 'Must support selecting a student for detail modal');
    assert.match(content, /role="dialog"/, 'Detail modal must be accessible dialog');
  });
});

describe('M4: Study Rooms Leaderboard Service Logic', () => {
  test('4.1 getWeeklyStudyLeaderboard returns ranked list with top 3 students', async () => {
    const leaderboard = await getWeeklyStudyLeaderboard();

    assert.ok(Array.isArray(leaderboard), 'Leaderboard must be an array');
    assert.ok(leaderboard.length >= 3, 'Leaderboard must contain at least 3 students');

    const top1 = leaderboard[0];
    const top2 = leaderboard[1];
    const top3 = leaderboard[2];

    assert.equal(top1.rank, 1, 'First entry must be rank 1');
    assert.equal(top2.rank, 2, 'Second entry must be rank 2');
    assert.equal(top3.rank, 3, 'Third entry must be rank 3');

    assert.ok(top1.totalFocusHours >= top2.totalFocusHours, 'Rank 1 hours >= Rank 2 hours');
    assert.ok(top2.totalFocusHours >= top3.totalFocusHours, 'Rank 2 hours >= Rank 3 hours');

    assert.ok(top1.name.length > 0, 'Rank 1 must have name');
    assert.ok(top1.rankTitle.length > 0, 'Rank 1 must have rankTitle');
    assert.ok(top1.badge.includes('Quán Quân'), 'Rank 1 badge should mention Quán Quân');
  });
});

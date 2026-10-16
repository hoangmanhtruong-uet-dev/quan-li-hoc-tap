'use client';

import React, { useState } from 'react';
import { Award, Compass, Info, Sparkles } from 'lucide-react';

export interface CompetenceSkill {
  axis: string;
  label: string;
  value: number; // 0..100
  tier: string;
  color: string;
}

export const DEFAULT_COMPETENCE_SKILLS: CompetenceSkill[] = [
  { axis: 'programming', label: 'Lập trình', value: 88, tier: 'Thành thạo', color: '#3DE8FF' },
  { axis: 'algorithms', label: 'Thuật toán', value: 82, tier: 'Nâng cao', color: '#7C5CFF' },
  { axis: 'teamwork', label: 'Đồ án & Nhóm', value: 85, tier: 'Ưu tú', color: '#C6FF3D' },
  { axis: 'time_management', label: 'Quản lý thời gian', value: 78, tier: 'Tốt', color: '#FFB800' },
  { axis: 'discipline', label: 'Kỷ luật', value: 92, tier: 'Xuất sắc', color: '#FF3D6E' },
  { axis: 'club_activities', label: 'Hoạt động CLB', value: 74, tier: 'Tích cực', color: '#3DFFB0' },
];

/**
 * Pure coordinate calculator for radar polygon nodes.
 * Starts from top (-PI / 2) and rotates clockwise.
 */
export function calculateRadarCoordinate(
  value: number,
  index: number,
  totalAxes: number = 6,
  radius: number = 90,
  center: number = 130
): { x: number; y: number } {
  const angleStep = (Math.PI * 2) / Math.max(3, totalAxes);
  const angle = index * angleStep - Math.PI / 2;
  const clampedValue = Math.max(0, Math.min(100, value));
  const r = (clampedValue / 100) * radius;

  return {
    x: Number((center + r * Math.cos(angle)).toFixed(3)),
    y: Number((center + r * Math.sin(angle)).toFixed(3)),
  };
}

/**
 * Calculates overall competence index score (weighted or arithmetic average)
 */
export function calculateOverallIndex(skills: Array<{ value: number }>): number {
  if (!skills || skills.length === 0) return 0;
  const sum = skills.reduce((acc, s) => acc + (s.value || 0), 0);
  return Number((sum / skills.length).toFixed(1));
}

interface CompetenceRadarChartProps {
  skills?: CompetenceSkill[];
  className?: string;
}

export function CompetenceRadarChart({
  skills = DEFAULT_COMPETENCE_SKILLS,
  className = '',
}: CompetenceRadarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const size = 260;
  const center = size / 2;
  const radius = 86;
  const totalAxes = skills.length;
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const overallScore = calculateOverallIndex(skills);

  // Polygon string for data path
  const polygonPoints = skills
    .map((s, idx) => {
      const { x, y } = calculateRadarCoordinate(s.value, idx, totalAxes, radius, center);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div
      className={`relative rounded-2xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 shadow-lg overflow-hidden ${className}`}
    >
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-purple-500/15 blur-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-cyan-400" />
          <h4 className="text-sm font-bold text-white tracking-tight">
            Radar Năng Lực Toàn Diện
          </h4>
        </div>

        {/* Overall Index Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cyan-400/30 bg-cyan-500/10">
          <Award className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-mono text-xs font-black text-cyan-300">
            {overallScore}
          </span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex flex-col items-center justify-center my-3">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-[230px] w-[230px] drop-shadow-[0_0_20px_rgba(61,232,255,0.15)]"
        >
          <defs>
            <linearGradient id="competenceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3DE8FF" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#7C5CFF" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#C6FF3D" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Concentric Hexagonal Grid Rings */}
          {levels.map((level) => {
            const ringPoints = Array.from({ length: totalAxes })
              .map((_, idx) => {
                const { x, y } = calculateRadarCoordinate(level * 100, idx, totalAxes, radius, center);
                return `${x},${y}`;
              })
              .join(' ');

            return (
              <polygon
                key={level}
                points={ringPoints}
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1"
                strokeDasharray={level < 1 ? '3 3' : undefined}
              />
            );
          })}

          {/* Radial Spokes / Axis Lines */}
          {skills.map((_, idx) => {
            const { x, y } = calculateRadarCoordinate(100, idx, totalAxes, radius, center);
            return (
              <line
                key={idx}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1"
              />
            );
          })}

          {/* Filled Data Polygon Area */}
          <polygon
            points={polygonPoints}
            fill="url(#competenceGrad)"
            stroke="#3DE8FF"
            strokeWidth="2"
            className="transition-all duration-300"
          />

          {/* Glowing Vertex Nodes */}
          {skills.map((s, idx) => {
            const { x, y } = calculateRadarCoordinate(s.value, idx, totalAxes, radius, center);
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={s.axis}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 7 : 4.5}
                  fill={s.color}
                  stroke="#0A0A12"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />
                {isHovered && (
                  <circle
                    cx={x}
                    cy={y}
                    r="13"
                    fill={s.color}
                    opacity="0.3"
                    className="animate-ping"
                  />
                )}
              </g>
            );
          })}

          {/* Labels Around Perimeter */}
          {skills.map((s, idx) => {
            const { x, y } = calculateRadarCoordinate(124, idx, totalAxes, radius, center);
            const isHovered = hoveredIdx === idx;

            return (
              <text
                key={s.axis}
                x={x}
                y={y + 3}
                textAnchor="middle"
                className={`text-[9.5px] tracking-tight transition-colors select-none font-bold ${
                  isHovered ? 'fill-cyan-300 font-extrabold' : 'fill-slate-300'
                }`}
              >
                {s.label}
              </text>
            );
          })}
        </svg>

        {/* Hovered Tooltip Card */}
        {hoveredIdx !== null && skills[hoveredIdx] ? (
          <div className="mt-1 flex items-center gap-2.5 rounded-xl border border-cyan-400/40 bg-slate-950/80 px-3.5 py-1.5 shadow-md">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: skills[hoveredIdx]!.color }}
            />
            <span className="text-xs font-bold text-white">
              {skills[hoveredIdx]!.label}:
            </span>
            <span className="font-mono text-xs font-black text-cyan-300">
              {skills[hoveredIdx]!.value}%
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({skills[hoveredIdx]!.tier})
            </span>
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Info className="h-3.5 w-3.5 text-cyan-400/70" />
            <span>Rê chuột vào các đỉnh để xem điểm năng lực</span>
          </div>
        )}
      </div>

      {/* Mini Highlights Footer */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
        <div>
          <span className="block text-[10px] text-muted-foreground">Mạnh nhất</span>
          <span className="text-xs font-bold text-rose-300">Kỷ luật (92)</span>
        </div>
        <div>
          <span className="block text-[10px] text-muted-foreground">Cần đẩy mạnh</span>
          <span className="text-xs font-bold text-amber-300">CLB (74)</span>
        </div>
        <div>
          <span className="block text-[10px] text-muted-foreground">Xếp hạng năng lực</span>
          <span className="text-xs font-bold text-emerald-300">Top 5% Khóa</span>
        </div>
      </div>
    </div>
  );
}

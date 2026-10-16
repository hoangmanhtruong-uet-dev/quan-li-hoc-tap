'use client';

import React, { useState } from 'react';
import { Target } from 'lucide-react';

export interface RadarTopic {
  label: string;
  value: number; // 0..100
  color: string;
}

const DEFAULT_TOPICS: RadarTopic[] = [
  { label: 'Subnetting', value: 68, color: '#3DE8FF' },
  { label: 'Cây BST/AVL', value: 75, color: '#7C5CFF' },
  { label: 'Triết học', value: 82, color: '#C6FF3D' },
  { label: 'Xác suất', value: 60, color: '#FFB800' },
  { label: 'Lập trình Web', value: 88, color: '#FF3DA5' },
];

interface KnowledgeRadarChartProps {
  topics?: RadarTopic[];
  onTopicClick?: (label: string) => void;
  className?: string;
}

export function KnowledgeRadarChart({
  topics = DEFAULT_TOPICS,
  onTopicClick,
  className = '',
}: KnowledgeRadarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const size = 260;
  const center = size / 2;
  const radius = 80;
  const numAxes = topics.length;
  const angleStep = (Math.PI * 2) / numAxes;

  // Concentric polygon rings (25%, 50%, 75%, 100%)
  const levels = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (value: number, index: number, maxRadius = radius) => {
    // Start from top (-PI / 2)
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate data polygon path
  const polygonPoints = topics
    .map((t, idx) => {
      const { x, y } = getCoordinates(t.value, idx);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-[210px] w-[210px] drop-shadow-[0_0_15px_rgba(124,92,255,0.15)]"
      >
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#3DE8FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#C6FF3D" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Concentric grid rings */}
        {levels.map((level) => {
          const ringPoints = Array.from({ length: numAxes })
            .map((_, idx) => {
              const { x, y } = getCoordinates(level * 100, idx);
              return `${x},${y}`;
            })
            .join(' ');
          return (
            <polygon
              key={level}
              points={ringPoints}
              fill="none"
              stroke="#2A2A44"
              strokeWidth="1"
              strokeDasharray={level < 1 ? '3 3' : undefined}
            />
          );
        })}

        {/* Axis radial lines */}
        {topics.map((_, idx) => {
          const { x, y } = getCoordinates(100, idx);
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#2A2A44"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon area */}
        <polygon
          points={polygonPoints}
          fill="url(#radarGradient)"
          stroke="#7C5CFF"
          strokeWidth="2"
          className="transition-all duration-500"
        />

        {/* Glowing Data Vertex Nodes */}
        {topics.map((t, idx) => {
          const { x, y } = getCoordinates(t.value, idx);
          const isHovered = hoveredIdx === idx;
          return (
            <g
              key={t.label}
              className="cursor-pointer transition-transform"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onTopicClick?.(t.label)}
            >
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 7 : 4}
                fill={t.color}
                stroke="#0A0A12"
                strokeWidth="2"
                className="transition-all duration-200"
              />
              {isHovered && (
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill={t.color}
                  opacity="0.3"
                  className="animate-ping"
                />
              )}
            </g>
          );
        })}

        {/* Labels at outer perimeter */}
        {topics.map((t, idx) => {
          const { x, y } = getCoordinates(126, idx);
          const isHovered = hoveredIdx === idx;
          return (
            <text
              key={t.label}
              x={x}
              y={y + 4}
              textAnchor="middle"
              className={`text-[9px] font-bold tracking-tight transition-colors ${
                isHovered ? 'fill-foreground font-black' : 'fill-muted-foreground'
              }`}
            >
              {t.label}
            </text>
          );
        })}
      </svg>

      {/* Interactive Tooltip Card underneath */}
      {hoveredIdx !== null && topics[hoveredIdx] ? (
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-violet-500/40 bg-card/90 px-3 py-1.5 shadow-[2px_2px_0px_#000]">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: topics[hoveredIdx]!.color }}
          />
          <span className="text-xs font-bold">{topics[hoveredIdx]!.label}:</span>
          <span className="font-mono text-xs font-black text-cyan-300">
            {topics[hoveredIdx]!.value}%
          </span>
          <span className="text-[10px] text-muted-foreground">· Nhấn để ôn tập</span>
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Target className="h-3 w-3 text-cyan-400" />
          <span>Di chuột vào các đỉnh để xem chi tiết</span>
        </div>
      )}
    </div>
  );
}

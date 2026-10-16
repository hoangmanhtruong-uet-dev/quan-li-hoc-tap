'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Plus, Sparkles, Layers, ArrowRight } from 'lucide-react';

interface WorkspaceHolo3DProps {
  onCreateClick?: () => void;
  workspaceCount?: number;
  activeTasksCount?: number;
  className?: string;
}

export function WorkspaceHolo3D({
  onCreateClick,
  workspaceCount = 3,
  activeTasksCount = 8,
  className = '',
}: WorkspaceHolo3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    // 1. Accessibility: prefers-reduced-motion check
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    // 2. WebGL check
    try {
      const canvas = document.createElement('canvas');
      const gl = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      if (!gl) {
        setHasWebGL(false);
        return () => mediaQuery.removeEventListener('change', handleMotionChange);
      }
    } catch {
      setHasWebGL(false);
      return () => mediaQuery.removeEventListener('change', handleMotionChange);
    }

    const container = containerRef.current;
    if (!container) return () => mediaQuery.removeEventListener('change', handleMotionChange);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 280;

    // 3. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // 4. Create Interconnected Project Nodes (Holographic Graph)
    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);

    // Node definitions (represents milestones & connected team deliverables)
    const nodeConfigs = [
      { pos: new THREE.Vector3(-4.5, 1.8, -1), color: 0x22d3ee, size: 0.35, label: 'Kiến trúc' },
      { pos: new THREE.Vector3(-2.2, 2.8, 1.2), color: 0x38bdf8, size: 0.45, label: 'Backend' },
      { pos: new THREE.Vector3(0, 1.5, -0.5), color: 0xa855f7, size: 0.55, label: 'Core AI' },
      { pos: new THREE.Vector3(2.5, 2.4, 0.8), color: 0xc084fc, size: 0.4, label: 'UI Cyber-Glass' },
      { pos: new THREE.Vector3(4.8, 1.2, -1.2), color: 0x34d399, size: 0.42, label: 'Deploy k8s' },
      { pos: new THREE.Vector3(-3.2, -1.2, 1), color: 0x22d3ee, size: 0.38, label: 'DB Cluster' },
      { pos: new THREE.Vector3(-0.8, -1.8, -1), color: 0x3b82f6, size: 0.48, label: 'Kanban Flow' },
      { pos: new THREE.Vector3(1.8, -1.4, 1.5), color: 0x10b981, size: 0.44, label: 'RBAC Security' },
      { pos: new THREE.Vector3(4.0, -1.6, -0.8), color: 0xf59e0b, size: 0.36, label: 'Docs Archive' },
    ];

    const sphereGeo = new THREE.SphereGeometry(1, 16, 16);
    const boxGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const nodeMeshes: THREE.Mesh[] = [];

    nodeConfigs.forEach((cfg, idx) => {
      const mat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        wireframe: idx % 2 === 1,
      });
      const mesh = new THREE.Mesh(idx % 3 === 0 ? boxGeo : sphereGeo, mat);
      mesh.position.copy(cfg.pos);
      mesh.scale.setScalar(cfg.size);
      nodesGroup.add(mesh);
      nodeMeshes.push(mesh);
    });

    // Connecting Synapse Lines
    const lineIndices: Array<[number, number]> = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [1, 6], [2, 7], [3, 8], [5, 1],
    ];

    const linePositions: number[] = [];
    lineIndices.forEach(([a, b]) => {
      const nodeA = nodeConfigs[a];
      const nodeB = nodeConfigs[b];
      if (nodeA && nodeB) {
        linePositions.push(
          nodeA.pos.x, nodeA.pos.y, nodeA.pos.z,
          nodeB.pos.x, nodeB.pos.y, nodeB.pos.z
        );
      }
    });

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
    });
    const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
    nodesGroup.add(lineMesh);

    // Ambient floating stardust particles
    const dustCount = 80;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 16;
      dustPositions[i + 1] = (Math.random() - 0.5) * 8;
      dustPositions[i + 2] = (Math.random() - 0.5) * 10;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.08,
      transparent: true,
      opacity: 0.45,
    });
    const dustMesh = new THREE.Points(dustGeo, dustMat);
    nodesGroup.add(dustMesh);

    // 5. Parallax & Animation Loop
    let targetRotY = 0;
    let targetRotX = 0;
    let isTabVisible = true;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = normX * 0.45;
      targetRotX = normY * 0.25;
    };

    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };

    container.addEventListener('mousemove', onPointerMove);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isTabVisible) return;

      const time = clock.getElapsedTime();

      // Smooth parallax & gentle rotation
      nodesGroup.rotation.y += (targetRotY - nodesGroup.rotation.y) * 0.04 + 0.0012;
      nodesGroup.rotation.x += (targetRotX - nodesGroup.rotation.x) * 0.04;

      // Pulse nodes subtly
      nodeMeshes.forEach((mesh, i) => {
        mesh.rotation.x = time * 0.3 + i;
        mesh.rotation.y = time * 0.4 + i;
        const scaleBase = nodeConfigs[i]?.size || 0.4;
        mesh.scale.setScalar(scaleBase + Math.sin(time * 2 + i) * 0.04);
      });

      // Shimmering line opacity
      lineMat.opacity = 0.25 + Math.sin(time * 1.8) * 0.1;

      // Dust drift
      dustMesh.rotation.y += 0.0004;
      dustMesh.rotation.x = Math.sin(time * 0.15) * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onPointerMove);
      cancelAnimationFrame(animId);

      // Explicit cleanup
      nodeMeshes.forEach((mesh) => {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          (mesh.material as THREE.Material).dispose();
        }
      });
      sphereGeo.dispose();
      boxGeo.dispose();
      lineGeo.dispose();
      dustGeo.dispose();
      lineMat.dispose();
      dustMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isReducedMotion]);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20 ${className}`}
    >
      {/* Aurora Ambient Glows */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />

      {/* Three.js Canvas Container */}
      {hasWebGL && !isReducedMotion ? (
        <div
          ref={containerRef}
          className="absolute inset-0 z-0 h-full w-full cursor-grab active:cursor-grabbing opacity-90"
        />
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-cyan-950/20 via-slate-900/40 to-purple-950/20" />
      )}

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col justify-between p-6 sm:p-8 md:flex-row md:items-center gap-6">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-300 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            <span>Hệ thống Đồ án & Nhóm học tập · Cyber-Glass 120FPS</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Không gian Đồ án &amp; Nghiên cứu
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Quản trị tiến độ đồ án đại học, cộng tác Kanban thời gian thực, lưu trữ tài liệu môn học và
            phân quyền thành viên minh bạch chuẩn RBAC.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>{workspaceCount} nhóm đang chạy</span>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>{activeTasksCount} nhiệm vụ cần xử lý</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {onCreateClick && (
          <div className="flex shrink-0 items-center">
            <button
              onClick={onCreateClick}
              className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/35 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              <span>Tạo nhóm mới</span>
              <ArrowRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

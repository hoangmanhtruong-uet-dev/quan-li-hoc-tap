'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Compass, Sparkles, Users, Calendar, Coins, ArrowRight, Shield } from 'lucide-react';

interface CyberClub3DProps {
  totalClubs?: number;
  totalMembers?: number;
  totalEvents?: number;
  totalTreasury?: number;
  onExploreClick?: () => void;
  className?: string;
}

export function CyberClub3D({
  totalClubs = 4,
  totalMembers = 361,
  totalEvents = 7,
  totalTreasury = 31200000,
  onExploreClick,
  className = '',
}: CyberClub3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    // 1. Accessibility: prefers-reduced-motion check
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    // 2. WebGL support check
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
    const height = container.clientHeight || 300;

    // 3. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 15);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // 4. Holographic University Shield / Emblem Group
    const emblemGroup = new THREE.Group();
    scene.add(emblemGroup);
    emblemGroup.position.set(4.2, 0, 0); // Position slightly to the right for bento balance

    // Core holographic polyhedral gem (Octahedron)
    const gemGeo = new THREE.OctahedronGeometry(2.2, 1);
    const gemMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4, // Cyan
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const gemMesh = new THREE.Mesh(gemGeo, gemMat);
    emblemGroup.add(gemMesh);

    // Inner glowing core (Sphere)
    const coreGeo = new THREE.SphereGeometry(1.0, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7, // Purple
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    emblemGroup.add(coreMesh);

    // Outer orbital ring 1 (Cyan)
    const ring1Geo = new THREE.TorusGeometry(3.4, 0.04, 16, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.7,
    });
    const ring1Mesh = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1Mesh.rotation.x = Math.PI / 3;
    emblemGroup.add(ring1Mesh);

    // Outer orbital ring 2 (Emerald)
    const ring2Geo = new THREE.TorusGeometry(4.0, 0.03, 16, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.5,
    });
    const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2Mesh.rotation.y = Math.PI / 4;
    ring2Mesh.rotation.x = -Math.PI / 6;
    emblemGroup.add(ring2Mesh);

    // Outer orbital ring 3 (Fuchsia / Neon Rose)
    const ring3Geo = new THREE.TorusGeometry(4.6, 0.03, 16, 64);
    const ring3Mat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.4,
    });
    const ring3Mesh = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3Mesh.rotation.z = Math.PI / 4;
    emblemGroup.add(ring3Mesh);

    // Surrounding constellation particle stars
    const particleCount = 70;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 16;
      dustPositions[i + 1] = (Math.random() - 0.5) * 10;
      dustPositions[i + 2] = (Math.random() - 0.5) * 8;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
    });
    const dustMesh = new THREE.Points(dustGeo, dustMat);
    scene.add(dustMesh);

    // 5. Reactive Mouse Interaction
    let targetRotY = 0;
    let targetRotX = 0;
    let isTabVisible = true;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = normX * 0.4;
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

      // Responsive emblem positioning
      if (newW < 768) {
        emblemGroup.position.set(0, 0, -2);
      } else {
        emblemGroup.position.set(4.2, 0, 0);
      }
    };

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };

    container.addEventListener('mousemove', onPointerMove);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    onResize();

    // 6. 120FPS Render Loop
    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isTabVisible) return;

      const time = clock.getElapsedTime();

      // Smooth parallax & continuous rotation
      emblemGroup.rotation.y += (targetRotY - emblemGroup.rotation.y) * 0.04 + 0.002;
      emblemGroup.rotation.x += (targetRotX - emblemGroup.rotation.x) * 0.04;

      gemMesh.rotation.y = time * 0.5;
      gemMesh.rotation.z = time * 0.3;

      coreMesh.rotation.x = -time * 0.4;
      coreMesh.rotation.y = -time * 0.6;
      const pulseScale = 1.0 + Math.sin(time * 2.5) * 0.08;
      coreMesh.scale.setScalar(pulseScale);

      ring1Mesh.rotation.z = time * 0.4;
      ring2Mesh.rotation.z = -time * 0.3;
      ring3Mesh.rotation.x = time * 0.25;

      dustMesh.rotation.y += 0.0003;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onPointerMove);
      cancelAnimationFrame(animId);

      // Disposal
      gemGeo.dispose();
      gemMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      ring3Geo.dispose();
      ring3Mat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isReducedMotion]);

  const formattedTreasury = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(totalTreasury);

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
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-cyan-950/30 via-slate-900/40 to-purple-950/30" />
      )}

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col justify-between p-6 sm:p-8 md:flex-row md:items-center gap-6">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-300 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            <span>Cộng đồng &amp; Câu lạc bộ Sinh viên · Cyber-Glass 120FPS</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Câu lạc bộ &amp; Cộng đồng Sinh viên
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Kết nối đam mê, tổ chức sự kiện chuyên nghiệp, quản trị minh bạch quỹ tài chính và phân bổ
            nhiệm vụ ban chuyên môn thời gian thực.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span>{totalClubs} câu lạc bộ</span>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-purple-400" />
              <span>{totalMembers} thành viên</span>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <span>{totalEvents} sự kiện</span>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <div className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-amber-400" />
              <span>{formattedTreasury} ngân sách</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {onExploreClick && (
          <div className="flex shrink-0 items-center">
            <button
              onClick={onExploreClick}
              className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/35 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Compass className="h-4 w-4 transition-transform group-hover:rotate-45" />
              <span>Khám phá các CLB</span>
              <ArrowRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

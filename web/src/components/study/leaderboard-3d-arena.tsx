'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import type { LeaderboardStudent } from '@/lib/study-rooms-service';
import { Trophy, Crown, Sparkles, Flame, Clock, Award, Shield, User } from 'lucide-react';

export interface Leaderboard3DArenaProps {
  topStudents?: LeaderboardStudent[];
  className?: string;
  onSelectStudent?: (student: LeaderboardStudent) => void;
}

export function Leaderboard3DArena({
  topStudents = [],
  className = '',
  onSelectStudent,
}: Leaderboard3DArenaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [hoveredRank, setHoveredRank] = useState<number | null>(null);

  // Top 3 student mappings (Rank 1: Gold, Rank 2: Silver, Rank 3: Bronze)
  const rank1 = useMemo(() => topStudents.find((s) => s.rank === 1) || topStudents[0], [topStudents]);
  const rank2 = useMemo(() => topStudents.find((s) => s.rank === 2) || topStudents[1], [topStudents]);
  const rank3 = useMemo(() => topStudents.find((s) => s.rank === 3) || topStudents[2], [topStudents]);

  useEffect(() => {
    // 1. Accessibility: Check prefers-reduced-motion
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

    let animId = 0;
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 420;

    // 3. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a14, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 9.2);
    camera.lookAt(0, 1.8, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    renderer.setSize(width, height);
    // Bounded DPR <= 1.25 for 120FPS performance guarantee
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Master group for pointer parallax
    const arenaGroup = new THREE.Group();
    scene.add(arenaGroup);

    // Collection of geometries and materials for strict unmount disposal
    const geometriesToDispose: THREE.BufferGeometry[] = [];
    const materialsToDispose: THREE.Material[] = [];

    // Helper to register disposable objects
    const registerMesh = <T extends THREE.Mesh>(mesh: T): T => {
      if (mesh.geometry) geometriesToDispose.push(mesh.geometry);
      if (Array.isArray(mesh.material)) {
        materialsToDispose.push(...mesh.material);
      } else if (mesh.material) {
        materialsToDispose.push(mesh.material);
      }
      return mesh;
    };

    // 4. Lighting System: Rotating Spotlight & Neon Fill Lights
    const ambientLight = new THREE.AmbientLight(0x22223a, 1.2);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xfff8ee, 4.5, 25, Math.PI / 5.5, 0.35, 1.1);
    spotLight.position.set(0, 9.5, 5);
    const spotLightTarget = new THREE.Object3D();
    spotLightTarget.position.set(0, 1.5, 0);
    scene.add(spotLightTarget);
    spotLight.target = spotLightTarget;
    scene.add(spotLight);

    // Cyan key fill from left
    const cyanLight = new THREE.PointLight(0x3de8ff, 2.5, 18);
    cyanLight.position.set(-5, 4, 3);
    scene.add(cyanLight);

    // Magenta / Pink rim light from right/back
    const magentaLight = new THREE.PointLight(0xff3da5, 2.5, 18);
    magentaLight.position.set(5, 4, -2);
    scene.add(magentaLight);

    // Ground Cyber Grid Reflection Disc
    const groundGeo = new THREE.CylinderGeometry(6.5, 6.5, 0.1, 48);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f1123,
      metalness: 0.9,
      roughness: 0.4,
    });
    const groundMesh = registerMesh(new THREE.Mesh(groundGeo, groundMat));
    groundMesh.position.set(0, -0.05, 0);
    arenaGroup.add(groundMesh);

    // 5. 3-Tier Podium System (Gold, Silver, Bronze)
    // Rank 1: Gold (Center, Height 2.2, Pos 0, 1.1, 0)
    const goldGeo = new THREE.CylinderGeometry(1.2, 1.3, 2.2, 36);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.88,
      roughness: 0.22,
      emissive: 0x4a3a00,
      emissiveIntensity: 0.3,
    });
    const goldPodium = registerMesh(new THREE.Mesh(goldGeo, goldMat));
    goldPodium.position.set(0, 1.1, 0);
    arenaGroup.add(goldPodium);

    // Gold neon base ring
    const goldRingGeo = new THREE.TorusGeometry(1.32, 0.045, 16, 48);
    const goldRingMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const goldRing = registerMesh(new THREE.Mesh(goldRingGeo, goldRingMat));
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.set(0, 0.05, 0);
    arenaGroup.add(goldRing);

    // Rank 2: Silver (Left, Height 1.6, Pos -2.8, 0.8, 0.4)
    const silverGeo = new THREE.CylinderGeometry(1.0, 1.1, 1.6, 36);
    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xd8e2ec,
      metalness: 0.85,
      roughness: 0.28,
      emissive: 0x1f2937,
      emissiveIntensity: 0.25,
    });
    const silverPodium = registerMesh(new THREE.Mesh(silverGeo, silverMat));
    silverPodium.position.set(-2.8, 0.8, 0.4);
    arenaGroup.add(silverPodium);

    // Silver neon base ring
    const silverRingGeo = new THREE.TorusGeometry(1.12, 0.04, 16, 48);
    const silverRingMat = new THREE.MeshBasicMaterial({ color: 0x3de8ff });
    const silverRing = registerMesh(new THREE.Mesh(silverRingGeo, silverRingMat));
    silverRing.rotation.x = Math.PI / 2;
    silverRing.position.set(-2.8, 0.05, 0.4);
    arenaGroup.add(silverRing);

    // Rank 3: Bronze (Right, Height 1.1, Pos 2.8, 0.55, 0.4)
    const bronzeGeo = new THREE.CylinderGeometry(1.0, 1.1, 1.1, 36);
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0xcd7f32,
      metalness: 0.78,
      roughness: 0.35,
      emissive: 0x381900,
      emissiveIntensity: 0.3,
    });
    const bronzePodium = registerMesh(new THREE.Mesh(bronzeGeo, bronzeMat));
    bronzePodium.position.set(2.8, 0.55, 0.4);
    arenaGroup.add(bronzePodium);

    // Bronze neon base ring
    const bronzeRingGeo = new THREE.TorusGeometry(1.12, 0.04, 16, 48);
    const bronzeRingMat = new THREE.MeshBasicMaterial({ color: 0xff8a3d });
    const bronzeRing = registerMesh(new THREE.Mesh(bronzeRingGeo, bronzeRingMat));
    bronzeRing.rotation.x = Math.PI / 2;
    bronzeRing.position.set(2.8, 0.05, 0.4);
    arenaGroup.add(bronzeRing);

    // 6. Hovering Cyberpunk Gold Trophy with Neon Gem
    const trophyGroup = new THREE.Group();
    trophyGroup.position.set(0, 3.2, 0);
    arenaGroup.add(trophyGroup);

    // Trophy Base
    const trophyBaseGeo = new THREE.CylinderGeometry(0.28, 0.36, 0.12, 24);
    const trophyBaseMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.92,
      roughness: 0.18,
    });
    const trophyBase = registerMesh(new THREE.Mesh(trophyBaseGeo, trophyBaseMat));
    trophyBase.position.set(0, -0.25, 0);
    trophyGroup.add(trophyBase);

    // Trophy Stem
    const stemGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.32, 16);
    const stem = registerMesh(new THREE.Mesh(stemGeo, trophyBaseMat));
    stem.position.set(0, -0.05, 0);
    trophyGroup.add(stem);

    // Trophy Cup (inverted chalice cone/cylinder)
    const cupGeo = new THREE.CylinderGeometry(0.42, 0.16, 0.56, 24);
    const cupMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x664400,
      emissiveIntensity: 0.25,
    });
    const cup = registerMesh(new THREE.Mesh(cupGeo, cupMat));
    cup.position.set(0, 0.32, 0);
    trophyGroup.add(cup);

    // Dual Torus Cyber Handles
    const handleGeo = new THREE.TorusGeometry(0.2, 0.038, 12, 24);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xffe066,
      metalness: 0.85,
      roughness: 0.2,
    });
    const leftHandle = registerMesh(new THREE.Mesh(handleGeo, handleMat));
    leftHandle.position.set(-0.35, 0.32, 0);
    leftHandle.rotation.y = Math.PI / 2;
    trophyGroup.add(leftHandle);

    const rightHandle = registerMesh(new THREE.Mesh(handleGeo, handleMat));
    rightHandle.position.set(0.35, 0.32, 0);
    rightHandle.rotation.y = Math.PI / 2;
    trophyGroup.add(rightHandle);

    // Floating Neon Gem in the center of the cup
    const gemGeo = new THREE.OctahedronGeometry(0.18, 0);
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0x3de8ff,
      emissive: 0x3de8ff,
      emissiveIntensity: 0.95,
      roughness: 0.1,
      metalness: 0.3,
    });
    const gem = registerMesh(new THREE.Mesh(gemGeo, gemMat));
    gem.position.set(0, 0.52, 0);
    trophyGroup.add(gem);

    // Glowing aura ring around the gem
    const gemRingGeo = new THREE.TorusGeometry(0.24, 0.02, 12, 32);
    const gemRingMat = new THREE.MeshBasicMaterial({ color: 0x3de8ff });
    const gemRing = registerMesh(new THREE.Mesh(gemRingGeo, gemRingMat));
    gemRing.position.set(0, 0.52, 0);
    gemRing.rotation.x = Math.PI / 3;
    trophyGroup.add(gemRing);

    // 7. Neon Particle Fireworks System
    const PARTICLE_COUNT = 600;
    const fireworksGeo = new THREE.BufferGeometry();
    geometriesToDispose.push(fireworksGeo);

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    // Neon color palette
    const neonPalette = [
      new THREE.Color(0x3de8ff), // Cyan
      new THREE.Color(0xc6ff3d), // Acid Lime
      new THREE.Color(0xff3da5), // Pink
      new THREE.Color(0x7c5cff), // Violet
      new THREE.Color(0xffd700), // Gold
    ];

    const burstCenters = [
      new THREE.Vector3(-2.8, 3.8, 0.2),
      new THREE.Vector3(0, 5.0, -0.4),
      new THREE.Vector3(2.8, 3.8, 0.2),
    ];

    interface FireworkParticle {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      life: number;
      centerIdx: number;
    }

    const particles: FireworkParticle[] = [];

    // Initialize fireworks particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const centerIdx = i % burstCenters.length;
      const center = burstCenters[centerIdx] || burstCenters[0]!;
      const col = neonPalette[i % neonPalette.length] || neonPalette[0]!;

      const speed = 0.03 + Math.random() * 0.07;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      const p: FireworkParticle = {
        x: center.x,
        y: center.y,
        z: center.z,
        vx: speed * Math.sin(phi) * Math.cos(theta),
        vy: speed * Math.cos(phi) + 0.02,
        vz: speed * Math.sin(phi) * Math.sin(theta),
        life: Math.random() * 80 + 20,
        centerIdx,
      };

      particles.push(p);

      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    fireworksGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    fireworksGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const fireworksMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materialsToDispose.push(fireworksMat);

    const fireworksPoints = new THREE.Points(fireworksGeo, fireworksMat);
    arenaGroup.add(fireworksPoints);

    // 8. Interactive Parallax & Animation Loop
    let targetRotY = 0;
    let targetRotX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const xNorm = (e.clientX - rect.left) / rect.width - 0.5;
      const yNorm = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = xNorm * 0.35;
      targetRotX = yNorm * 0.15;
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 900;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        lastTime = performance.now();
        animId = requestAnimationFrame(animate);
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let lastTime = performance.now();
    let clockTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      clockTime += delta;

      // Mouse Parallax smoothing
      arenaGroup.rotation.y += (targetRotY - arenaGroup.rotation.y) * 0.05;
      arenaGroup.rotation.x += (targetRotX - arenaGroup.rotation.x) * 0.05;

      // Rotating Spotlight sweep across podiums
      spotLightTarget.position.x = Math.sin(clockTime * 0.75) * 2.8;

      // Hovering Cyberpunk Trophy sine-wave levitation & rotation
      trophyGroup.position.y = 3.2 + Math.sin(clockTime * 2.2) * 0.14;
      trophyGroup.rotation.y += 0.016;

      // Spinning Gem & Aura Ring
      gem.rotation.x += 0.025;
      gem.rotation.y += 0.035;
      gemRing.rotation.z += 0.02;

      // Update Fireworks Particles
      const posAttr = fireworksGeo.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        if (!p) continue;

        p.life -= 1;

        if (p.life <= 0) {
          // Reset to random burst origin
          const center = burstCenters[p.centerIdx] || burstCenters[0]!;
          p.x = center.x;
          p.y = center.y;
          p.z = center.z;

          const speed = 0.03 + Math.random() * 0.07;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          p.vx = speed * Math.sin(phi) * Math.cos(theta);
          p.vy = speed * Math.cos(phi) + 0.025;
          p.vz = speed * Math.sin(phi) * Math.sin(theta);

          p.life = Math.random() * 90 + 30;
        } else {
          // Physics step
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;
          p.vy -= 0.0008; // gravity
        }

        posArray[i * 3] = p.x;
        posArray[i * 3 + 1] = p.y;
        posArray[i * 3 + 2] = p.z;
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Strict Resource Disposal on Unmount
    return () => {
      cancelAnimationFrame(animId);
      mediaQuery.removeEventListener('change', handleMotionChange);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Dispose geometries
      for (const geo of geometriesToDispose) {
        geo.dispose();
      }

      // Dispose materials
      for (const mat of materialsToDispose) {
        mat.dispose();
      }

      // Dispose renderer
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[400px] sm:h-[460px] overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl shadow-2xl shadow-cyan-950/30 ${className}`}
    >
      {/* Aurora Ambient Glows */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Reduced-Motion / WebGL Fallback Mode */}
      {(!hasWebGL || isReducedMotion) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-amber-400/40 bg-amber-500/20 text-amber-300 shadow-xl shadow-amber-950/40 mb-4 animate-bounce">
            <Trophy className="h-9 w-9 text-amber-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display">
            BỤC VINH DANH CHIẾN THẦN TUẦN
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mt-1 mb-6">
            Giao diện đồ họa tĩnh tối ưu hiệu năng (Chế độ giảm hiệu ứng / Không hỗ trợ WebGL).
          </p>

          {/* 3-Tier Static Podium Cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-2xl items-end">
            {/* Rank 2 (Silver) */}
            <div className="flex flex-col items-center p-4 rounded-2xl border border-slate-300/40 bg-slate-900/60 backdrop-blur-xl h-44 justify-between">
              <div className="text-xs font-black text-slate-300">🥈 HẠNG 2</div>
              <div className="text-sm font-bold text-white text-center line-clamp-1">{rank2?.name || 'Á Quân'}</div>
              <div className="text-xs font-mono text-cyan-300">{rank2?.totalFocusHours || 0} giờ</div>
              <div className="w-full bg-slate-400/20 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold text-slate-300">
                SILVER
              </div>
            </div>

            {/* Rank 1 (Gold) */}
            <div className="flex flex-col items-center p-5 rounded-2xl border-2 border-amber-400 bg-amber-500/15 backdrop-blur-xl h-56 justify-between shadow-lg shadow-amber-950/40">
              <div className="text-xs font-black text-amber-400 flex items-center gap-1">
                <Crown className="h-4 w-4" /> 👑 HẠNG 1
              </div>
              <div className="text-base font-black text-amber-200 text-center line-clamp-1">{rank1?.name || 'Quán Quân'}</div>
              <div className="text-sm font-mono text-amber-300 font-bold">{rank1?.totalFocusHours || 0} giờ</div>
              <div className="w-full bg-amber-500/30 border border-amber-400/50 h-10 rounded-xl flex items-center justify-center text-xs font-black text-amber-200">
                GOLD CHAMPION
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="flex flex-col items-center p-4 rounded-2xl border border-amber-700/50 bg-amber-950/40 backdrop-blur-xl h-36 justify-between">
              <div className="text-xs font-black text-amber-600">🥉 HẠNG 3</div>
              <div className="text-sm font-bold text-white text-center line-clamp-1">{rank3?.name || 'Quý Quân'}</div>
              <div className="text-xs font-mono text-cyan-300">{rank3?.totalFocusHours || 0} giờ</div>
              <div className="w-full bg-amber-800/30 h-6 rounded-xl flex items-center justify-center text-[10px] font-bold text-amber-500">
                BRONZE
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cyberpunk HUD Overlay Header */}
      <div className="pointer-events-none absolute left-5 top-5 z-20 space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-0.5 text-[11px] font-black text-amber-300">
          <Trophy className="h-3.5 w-3.5 text-amber-400" />
          <span>ARENA 3D THREE.JS</span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
        </div>
        <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white font-display">
          Bục Vinh Danh 3D Tuần
        </h2>
        <p className="text-xs text-slate-400 hidden sm:block">
          Cúp vàng Cyberpunk & Pháo hoa Neon vinh danh top sinh viên tập trung cao nhất
        </p>
      </div>

      {/* Interactive Podium Anchors (Overlay labels clickable directly below podiums) */}
      <div className="absolute inset-x-0 bottom-4 z-20 px-4 sm:px-8">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto">
          {/* Rank 2 Label (Left) */}
          <button
            type="button"
            onClick={() => rank2 && onSelectStudent?.(rank2)}
            onMouseEnter={() => setHoveredRank(2)}
            onMouseLeave={() => setHoveredRank(null)}
            className={`group text-left rounded-2xl border bg-slate-900/80 backdrop-blur-xl p-2.5 sm:p-3 transition-all ${
              hoveredRank === 2
                ? 'border-cyan-400 bg-cyan-500/20 scale-105 shadow-lg shadow-cyan-950/40'
                : 'border-white/10 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-black text-slate-300">
              <span>🥈 Á QUÂN</span>
              <span className="font-mono text-cyan-300">{rank2?.totalFocusHours || 0}h</span>
            </div>
            <div className="text-xs font-bold text-white truncate mt-0.5 group-hover:text-cyan-200">
              {rank2?.name || 'Trần Thảo Ly'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">{rank2?.rankTitle || 'Á Quân'}</div>
          </button>

          {/* Rank 1 Label (Center) */}
          <button
            type="button"
            onClick={() => rank1 && onSelectStudent?.(rank1)}
            onMouseEnter={() => setHoveredRank(1)}
            onMouseLeave={() => setHoveredRank(null)}
            className={`group text-left rounded-2xl border bg-amber-500/15 backdrop-blur-xl p-2.5 sm:p-3.5 transition-all -translate-y-2 ${
              hoveredRank === 1
                ? 'border-amber-300 bg-amber-500/30 scale-105 shadow-xl shadow-amber-950/60'
                : 'border-amber-400/60 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-black text-amber-300">
              <span className="flex items-center gap-1">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                👑 QUÁN QUÂN
              </span>
              <span className="font-mono text-amber-200 font-bold">{rank1?.totalFocusHours || 0}h</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-white truncate mt-0.5 group-hover:text-amber-200">
              {rank1?.name || 'Nguyễn Văn Hùng'}
            </div>
            <div className="text-[10px] text-amber-300/80 truncate font-semibold">
              {rank1?.rankTitle || 'Chiến thần qua môn'}
            </div>
          </button>

          {/* Rank 3 Label (Right) */}
          <button
            type="button"
            onClick={() => rank3 && onSelectStudent?.(rank3)}
            onMouseEnter={() => setHoveredRank(3)}
            onMouseLeave={() => setHoveredRank(null)}
            className={`group text-left rounded-2xl border bg-slate-900/80 backdrop-blur-xl p-2.5 sm:p-3 transition-all ${
              hoveredRank === 3
                ? 'border-amber-500 bg-amber-700/20 scale-105 shadow-lg shadow-amber-950/40'
                : 'border-white/10 hover:border-amber-600/50'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-black text-amber-600">
              <span>🥉 QUÝ QUÂN</span>
              <span className="font-mono text-amber-400">{rank3?.totalFocusHours || 0}h</span>
            </div>
            <div className="text-xs font-bold text-white truncate mt-0.5 group-hover:text-amber-200">
              {rank3?.name || 'Lê Hoàng Minh'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">{rank3?.rankTitle || 'Quý Quân'}</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard3DArena;

'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import * as THREE from 'three';
import type { TaskPriority } from '@/types/tasks';

export interface QuickTaskBackdrop3DProps {
  className?: string;
  priority?: TaskPriority;
  typingIntensity?: number; // 0 to 1 based on input activity
  isSuccessBurst?: boolean; // triggers celebratory explosion
  reducedMotion?: boolean;
}

export const QuickTaskBackdrop3D = memo(function QuickTaskBackdrop3D({
  className = '',
  priority = 'medium',
  typingIntensity = 0,
  isSuccessBurst = false,
  reducedMotion = false,
}: QuickTaskBackdrop3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  // References to communicate with RAF render loop without re-instantiating Three.js
  const priorityRef = useRef<TaskPriority>(priority);
  const typingIntensityRef = useRef<number>(typingIntensity);
  const isSuccessBurstRef = useRef<boolean>(isSuccessBurst);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    priorityRef.current = priority;
  }, [priority]);

  useEffect(() => {
    typingIntensityRef.current = typingIntensity;
  }, [typingIntensity]);

  useEffect(() => {
    isSuccessBurstRef.current = isSuccessBurst;
  }, [isSuccessBurst]);

  // Check viewport width & reduced motion
  useEffect(() => {
    const checkMotionAndWidth = () => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setUseFallback(Boolean(reducedMotion || prefersReduced || isMobile));
    };

    checkMotionAndWidth();
    window.addEventListener('resize', checkMotionAndWidth, { passive: true });
    return () => window.removeEventListener('resize', checkMotionAndWidth);
  }, [reducedMotion]);

  // Mouse move listener for parallax
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      if (typeof window === 'undefined') return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current = { x, y };
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('mousemove', handlePointerMove);
  }, []);

  // Three.js Lifecycle
  useEffect(() => {
    if (useFallback) return;
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera & WebGLRenderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 50);
    camera.position.set(0, 0, 7.5);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setUseFallback(true);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 2. Wireframe Icosahedron (Decorative floating geometric orb in the top corner)
    const icoGeometry = new THREE.IcosahedronGeometry(1.3, 1);
    const icoWireframeGeo = new THREE.WireframeGeometry(icoGeometry);
    const icoMaterial = new THREE.LineBasicMaterial({
      color: 0x7c5cff,
      transparent: true,
      opacity: 0.6,
      linewidth: 1,
    });
    const icoLineMesh = new THREE.LineSegments(icoWireframeGeo, icoMaterial);
    icoLineMesh.position.set(2.8, 1.8, -1.0);
    scene.add(icoLineMesh);

    // Inner glowing core sphere
    const coreGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xc6ff3d,
      transparent: true,
      opacity: 0.7,
      wireframe: true,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    icoLineMesh.add(coreMesh);

    // 3. Drifting Particle Field
    const PARTICLE_COUNT = 65;
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);
    const particleSpeeds: { vx: number; vy: number; vz: number; baseSpeed: number }[] = [];

    const defaultColors = [
      new THREE.Color(0x3de8ff), // Cyan
      new THREE.Color(0x7c5cff), // Violet
      new THREE.Color(0xc6ff3d), // Acid Lime
    ];
    const urgentColors = [
      new THREE.Color(0xff3d6e), // Neon Red
      new THREE.Color(0xff8a3d), // Orange
      new THREE.Color(0xff3da5), // Pink
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 14;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;

      const c = defaultColors[i % defaultColors.length]!;
      particleColors[i * 3 + 0] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;

      particleSpeeds.push({
        vx: (Math.random() - 0.5) * 0.008,
        vy: (Math.random() - 0.5) * 0.008,
        vz: (Math.random() - 0.5) * 0.004,
        baseSpeed: 0.005 + Math.random() * 0.01,
      });
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // 4. Confetti / Burst Particles for Task Creation
    const BURST_COUNT = 80;
    const burstPositions = new Float32Array(BURST_COUNT * 3);
    const burstVelocities: { x: number; y: number; z: number; decay: number }[] = [];
    const burstGeometry = new THREE.BufferGeometry();
    burstGeometry.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));

    const burstMaterial = new THREE.PointsMaterial({
      size: 0.24,
      color: 0xc6ff3d,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const burstSystem = new THREE.Points(burstGeometry, burstMaterial);
    scene.add(burstSystem);

    let hasTriggeredBurst = false;
    let burstProgress = 0;

    // 5. Animation Loop with Tab Visibility Check
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      if (document.visibilityState === 'hidden') {
        return; // Pause rendering when tab is hidden
      }

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      const isUrgent = priorityRef.current === 'urgent';
      const typingIntensity = typingIntensityRef.current;
      const mouse = mouseRef.current;

      // Parallax camera tilt
      camera.position.x += (mouse.x * 0.4 - camera.position.x) * 0.05;
      camera.position.y += (mouse.y * 0.3 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // Rotate icosahedron
      icoLineMesh.rotation.x += delta * 0.3;
      icoLineMesh.rotation.y += delta * 0.4;

      // Urgent jitter & color theme
      if (isUrgent) {
        icoLineMesh.position.x = 2.8 + (Math.random() - 0.5) * 0.06;
        icoLineMesh.position.y = 1.8 + (Math.random() - 0.5) * 0.06;
        icoMaterial.color.setHex(0xff3d6e);
        coreMaterial.color.setHex(0xff8a3d);
      } else {
        icoLineMesh.position.x = 2.8;
        icoLineMesh.position.y = 1.8;
        icoMaterial.color.setHex(0x7c5cff);
        coreMaterial.color.setHex(0xc6ff3d);
      }

      // Typing intensity reactive pulse
      const pulseBrightness = 0.65 + typingIntensity * 0.35 + Math.sin(elapsedTime * 3) * 0.1;
      particleMaterial.opacity = Math.min(1.0, pulseBrightness);
      particleMaterial.size = 0.16 + typingIntensity * 0.1;

      // Update drifting particles
      const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
      const colorAttr = particleGeometry.attributes.color as THREE.BufferAttribute;
      const activeColors = isUrgent ? urgentColors : defaultColors;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        let px = posAttr.getX(i);
        let py = posAttr.getY(i);
        let pz = posAttr.getZ(i);

        const spd = particleSpeeds[i]!;
        px += spd.vx * (1 + typingIntensity * 2);
        py += spd.vy * (1 + typingIntensity * 2);
        pz += spd.vz;

        // Wrap around bounds
        if (px > 7) px = -7;
        if (px < -7) px = 7;
        if (py > 5) py = -5;
        if (py < -5) py = 5;

        posAttr.setXYZ(i, px, py, pz);

        // Smoothly blend color towards target priority palette
        const targetColor = activeColors[i % activeColors.length]!;
        const cr = colorAttr.getX(i);
        const cg = colorAttr.getY(i);
        const cb = colorAttr.getZ(i);
        colorAttr.setXYZ(
          i,
          cr + (targetColor.r - cr) * 0.05,
          cg + (targetColor.g - cg) * 0.05,
          cb + (targetColor.b - cb) * 0.05
        );
      }
      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      // Handle Success Burst Confetti
      if (isSuccessBurstRef.current && !hasTriggeredBurst) {
        hasTriggeredBurst = true;
        burstProgress = 1.0;
        burstMaterial.opacity = 1.0;
        const bPosAttr = burstGeometry.attributes.position as THREE.BufferAttribute;

        burstVelocities.length = 0;
        for (let i = 0; i < BURST_COUNT; i++) {
          bPosAttr.setXYZ(i, icoLineMesh.position.x, icoLineMesh.position.y, icoLineMesh.position.z);
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const speed = 0.1 + Math.random() * 0.25;
          burstVelocities.push({
            x: Math.sin(phi) * Math.cos(theta) * speed,
            y: Math.sin(phi) * Math.sin(theta) * speed,
            z: Math.cos(phi) * speed,
            decay: 0.96 + Math.random() * 0.02,
          });
        }
        bPosAttr.needsUpdate = true;
      }

      if (hasTriggeredBurst && burstProgress > 0) {
        const bPosAttr = burstGeometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < BURST_COUNT; i++) {
          const vel = burstVelocities[i];
          if (!vel) continue;
          let bx = bPosAttr.getX(i) + vel.x;
          let by = bPosAttr.getY(i) + vel.y;
          let bz = bPosAttr.getZ(i) + vel.z;

          vel.x *= vel.decay;
          vel.y *= vel.decay;
          vel.z *= vel.decay;

          bPosAttr.setXYZ(i, bx, by, bz);
        }
        bPosAttr.needsUpdate = true;
        burstProgress -= delta * 0.8;
        burstMaterial.opacity = Math.max(0, burstProgress);
      }

      renderer?.render(scene, camera);
    };

    render();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // 6. Strict Cleanup & Disposal
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);

      // Dispose Geometries
      icoGeometry.dispose();
      icoWireframeGeo.dispose();
      coreGeometry.dispose();
      particleGeometry.dispose();
      burstGeometry.dispose();

      // Dispose Materials
      icoMaterial.dispose();
      coreMaterial.dispose();
      particleMaterial.dispose();
      burstMaterial.dispose();

      // Dispose Renderer & DOM
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [useFallback]);

  if (useFallback) {
    return (
      <div
        className={`absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#7C5CFF]/20 via-transparent to-transparent ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
});

'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import * as THREE from 'three';
import { useCampusStore } from '@/lib/campus-store';

export interface FloatingBlocks3DProps {
  className?: string;
  burstTrigger?: number; // Increment to trigger upward burst on a random cube
}

interface CubeInstanceData {
  baseX: number;
  baseY: number;
  baseZ: number;
  currentX: number;
  currentY: number;
  currentZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  driftSpeed: number;
  driftAmp: number;
  phase: number;
  scale: number;
  // Burst animation state
  isBursting: boolean;
  burstVy: number;
  burstAlpha: number;
  burstTimer: number;
}

const INSTANCE_COUNT = 40;
const NEON_PALETTE = [
  0x7c5cff, // Electric Violet
  0x3de8ff, // Cyan
  0xc6ff3d, // Acid Lime
  0xff3da5, // Neon Pink
  0x3dffb0, // Emerald Green
  0xff8a3d, // Warm Orange
];

export const FloatingBlocks3D = memo(function FloatingBlocks3D({
  className = '',
  burstTrigger = 0,
}: FloatingBlocks3DProps) {
  const { state } = useCampusStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const burstTriggerRef = useRef(burstTrigger);
  const triggerBurstNextFrameRef = useRef(false);

  // Detect mobile width & reduced motion
  useEffect(() => {
    const checkMotionAndWidth = () => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      setUseFallback(Boolean(state.reducedMotion || isMobile));
    };

    checkMotionAndWidth();
    window.addEventListener('resize', checkMotionAndWidth, { passive: true });
    return () => window.removeEventListener('resize', checkMotionAndWidth);
  }, [state.reducedMotion]);

  // Track burstTrigger changes
  useEffect(() => {
    if (burstTrigger > burstTriggerRef.current) {
      triggerBurstNextFrameRef.current = true;
      burstTriggerRef.current = burstTrigger;
    }
  }, [burstTrigger]);

  // Listen for global custom completion burst events
  useEffect(() => {
    const handleGlobalBurst = () => {
      triggerBurstNextFrameRef.current = true;
    };
    window.addEventListener('task-completed-burst', handleGlobalBurst);
    return () => window.removeEventListener('task-completed-burst', handleGlobalBurst);
  }, []);

  // Main Three.js Lifecycle
  useEffect(() => {
    if (useFallback) return;
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 240;

    // 1. Scene, Camera & WebGLRenderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 30);
    camera.position.set(0, 0, 6.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'mediump',
      stencil: false,
      depth: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Subtle Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7c5cff, 0.6);
    fillLight.position.set(-4, -2, 2);
    scene.add(fillLight);

    // 3. Single InstancedMesh (1 Draw Call for all cubes)
    const cubeGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const cubeMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
    });

    const instancedMesh = new THREE.InstancedMesh(cubeGeo, cubeMat, INSTANCE_COUNT);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Color instances with neon palette
    for (let i = 0; i < INSTANCE_COUNT; i++) {
      const colHex = NEON_PALETTE[i % NEON_PALETTE.length] ?? 0x7c5cff;
      instancedMesh.setColorAt(i, new THREE.Color(colHex));
    }
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
    scene.add(instancedMesh);

    // 4. Initialize Instance Data
    const dummy = new THREE.Object3D();
    const instances: CubeInstanceData[] = [];

    for (let i = 0; i < INSTANCE_COUNT; i++) {
      const baseX = (Math.random() - 0.5) * 11.0;
      const baseY = (Math.random() - 0.5) * 3.4;
      const baseZ = (Math.random() - 0.5) * 4.0 - 0.5;
      const scale = 0.55 + Math.random() * 0.75;

      instances.push({
        baseX,
        baseY,
        baseZ,
        currentX: baseX,
        currentY: baseY,
        currentZ: baseZ,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        rotSpeedX: (Math.random() - 0.5) * 0.6,
        rotSpeedY: (Math.random() - 0.5) * 0.6,
        rotSpeedZ: (Math.random() - 0.5) * 0.4,
        driftSpeed: 0.4 + Math.random() * 0.7,
        driftAmp: 0.15 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
        scale,
        isBursting: false,
        burstVy: 0,
        burstAlpha: 1,
        burstTimer: 0,
      });

      dummy.position.set(baseX, baseY, baseZ);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;

    // 5. Burst Particle System (Points pool for task completion FX)
    const BURST_PARTICLE_COUNT = 30;
    const burstGeo = new THREE.BufferGeometry();
    const burstPositions = new Float32Array(BURST_PARTICLE_COUNT * 3);
    const burstVelocities = new Float32Array(BURST_PARTICLE_COUNT * 3);

    for (let i = 0; i < BURST_PARTICLE_COUNT * 3; i++) {
      burstPositions[i] = 9999; // Off-screen initially
      burstVelocities[i] = 0;
    }

    burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
    const burstMat = new THREE.PointsMaterial({
      color: 0x3dffb0,
      size: 0.09,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const burstPoints = new THREE.Points(burstGeo, burstMat);
    scene.add(burstPoints);

    let burstLife = 0;

    // Function to launch burst particles at specific cube
    const triggerCubeBurst = () => {
      const targetIdx = Math.floor(Math.random() * INSTANCE_COUNT);
      const target = instances[targetIdx];
      if (!target) return;

      target.isBursting = true;
      target.burstVy = 0.16;
      target.burstTimer = 50;

      // Spawn particles at cube position
      const posAttr = burstGeo.getAttribute('position') as THREE.BufferAttribute;
      const pArr = posAttr.array as Float32Array;

      for (let i = 0; i < BURST_PARTICLE_COUNT; i++) {
        const idx = i * 3;
        pArr[idx] = target.currentX;
        pArr[idx + 1] = target.currentY;
        pArr[idx + 2] = target.currentZ;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 0.05 + Math.random() * 0.12;
        burstVelocities[idx] = Math.sin(phi) * Math.cos(theta) * speed;
        burstVelocities[idx + 1] = Math.abs(Math.cos(phi) * speed) + 0.08; // bias upward
        burstVelocities[idx + 2] = Math.sin(phi) * Math.sin(theta) * speed;
      }
      posAttr.needsUpdate = true;
      burstLife = 1.0;
      burstMat.opacity = 1.0;
    };

    // 6. Pointer Parallax Tracking
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      targetMouseX = Math.max(-1, Math.min(1, x));
      targetMouseY = Math.max(-1, Math.min(1, y));
    };

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 800;
      height = container.clientHeight || 240;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // 7. Render Loop with 120FPS Parallax & Burst Mechanics
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Save GPU when browser tab is hidden
      if (document.hidden) return;

      const elapsed = clock.getElapsedTime();

      // Check queued burst trigger
      if (triggerBurstNextFrameRef.current) {
        triggerBurstNextFrameRef.current = false;
        triggerCubeBurst();
      }

      // Smooth pointer parallax
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      camera.position.x = currentMouseX * 0.65;
      camera.position.y = currentMouseY * 0.35;
      camera.lookAt(0, 0, 0);

      // Animate instances
      for (let i = 0; i < INSTANCE_COUNT; i++) {
        const item = instances[i];
        if (!item) continue;

        if (item.isBursting) {
          item.currentY += item.burstVy;
          item.burstVy -= 0.007;
          item.rotX += 0.18;
          item.rotY += 0.22;
          item.burstTimer--;
          if (item.burstTimer <= 0) {
            item.isBursting = false;
            item.currentY = item.baseY;
          }
        } else {
          item.currentY = item.baseY + Math.sin(elapsed * item.driftSpeed + item.phase) * item.driftAmp;
          item.rotX += item.rotSpeedX * 0.02 + currentMouseX * 0.01;
          item.rotY += item.rotSpeedY * 0.02 - currentMouseY * 0.01;
        }

        dummy.position.set(item.currentX, item.currentY, item.currentZ);
        dummy.rotation.set(item.rotX, item.rotY, item.rotZ);
        dummy.scale.set(item.scale, item.scale, item.scale);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;

      // Animate burst particles
      if (burstLife > 0) {
        burstLife -= 0.022;
        burstMat.opacity = Math.max(0, burstLife);
        const posAttr = burstGeo.getAttribute('position') as THREE.BufferAttribute;
        const pArr = posAttr.array as Float32Array;

        for (let i = 0; i < BURST_PARTICLE_COUNT; i++) {
          const idx = i * 3;
          pArr[idx] = (pArr[idx] ?? 0) + (burstVelocities[idx] ?? 0);
          pArr[idx + 1] = (pArr[idx + 1] ?? 0) + (burstVelocities[idx + 1] ?? 0);
          pArr[idx + 2] = (pArr[idx + 2] ?? 0) + (burstVelocities[idx + 2] ?? 0);
          burstVelocities[idx + 1] = (burstVelocities[idx + 1] ?? 0) - 0.003; // gravity
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Proper Lifecycle Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      cubeGeo.dispose();
      cubeMat.dispose();
      burstGeo.dispose();
      burstMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [useFallback]);

  // Static Aurora Gradient Fallback (Mobile / Reduced Motion)
  if (useFallback) {
    return (
      <div
        className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-45"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 30%, rgba(124, 92, 255, 0.22), rgba(61, 232, 255, 0.12) 45%, rgba(10, 10, 18, 0) 80%)',
          }}
        />
        <div
          className="absolute -top-10 -left-10 w-60 h-60 rounded-full opacity-20 blur-3xl"
          style={{ background: '#3DFFB0' }}
        />
        <div
          className="absolute top-2 right-12 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: '#7C5CFF' }}
        />
      </div>
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

'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type OrbEmotion = 'idle' | 'thinking' | 'celebrate' | 'happy' | 'sleepy';

interface QuantumOrb3DProps {
  emotion?: OrbEmotion;
  isStreaming?: boolean;
  className?: string;
  celebrateTrigger?: number;
  interactive?: boolean;
}

export function QuantumOrb3D({
  emotion = 'idle',
  isStreaming = false,
  className = '',
  celebrateTrigger = 0,
  interactive = true,
}: QuantumOrb3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    coreGroup: THREE.Group | null;
    innerCoreMesh: THREE.Mesh | null;
    wireCoreMesh: THREE.Mesh | null;
    ring1: THREE.Mesh | null;
    ring2: THREE.Mesh | null;
    ring3: THREE.Mesh | null;
    pointLight: THREE.PointLight | null;
    stardust: THREE.Points | null;
    confettiParticles: THREE.Points | null;
    confettiVelocities: Float32Array | null;
    confettiActive: boolean;
    confettiLife: number;
    targetMouse: THREE.Vector2;
    currentMouse: THREE.Vector2;
    animFrameId: number | null;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    coreGroup: null,
    innerCoreMesh: null,
    wireCoreMesh: null,
    ring1: null,
    ring2: null,
    ring3: null,
    pointLight: null,
    stardust: null,
    confettiParticles: null,
    confettiVelocities: null,
    confettiActive: false,
    confettiLife: 0,
    targetMouse: new THREE.Vector2(0, 0),
    currentMouse: new THREE.Vector2(0, 0),
    animFrameId: null,
  });

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  // Main Three.js Setup
  useEffect(() => {
    if (reducedMotion || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 260;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
    } catch {
      setWebGLSupported(false);
      return;
    }

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.0);

    // Dynamic Lights
    const ambientLight = new THREE.AmbientLight(0x160f2e, 2.0);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x3de8ff, 4, 8);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    const rimLight1 = new THREE.DirectionalLight(0x7c5cff, 2.5);
    rimLight1.position.set(2, 3, 2);
    scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0x3de8ff, 2.0);
    rimLight2.position.set(-2, -2, -1);
    scene.add(rimLight2);

    // ==========================================
    // QUANTUM ORB HIERARCHY
    // ==========================================
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Inner Faceted Crystal Core (Icosahedron)
    const innerGeo = new THREE.IcosahedronGeometry(0.8, 1);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x1b1c38,
      emissive: 0x221155,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.15,
      flatShading: true,
    });
    const innerCoreMesh = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerCoreMesh);

    // 2. Outer Crystalline Wireframe Lattice Cage
    const wireGeo = new THREE.IcosahedronGeometry(0.98, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x3de8ff,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const wireCoreMesh = new THREE.Mesh(wireGeo, wireMat);
    coreGroup.add(wireCoreMesh);

    // 3. Gyroscopic Orbital Neon Rings
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x7c5cff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const ringGeo1 = new THREE.TorusGeometry(1.35, 0.02, 16, 64);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x3de8ff,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const ringGeo2 = new THREE.TorusGeometry(1.5, 0.018, 16, 64);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 6;
    coreGroup.add(ring2);

    const ringMat3 = new THREE.MeshBasicMaterial({
      color: 0xc6ff3d,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const ringGeo3 = new THREE.TorusGeometry(1.65, 0.015, 16, 64);
    const ring3 = new THREE.Mesh(ringGeo3, ringMat3);
    ring3.rotation.z = Math.PI / 2.5;
    coreGroup.add(ring3);

    // 4. Stardust Particle Galaxy Aura (180 particles)
    const stardustCount = 180;
    const stardustGeo = new THREE.BufferGeometry();
    const stardustPos = new Float32Array(stardustCount * 3);
    const stardustCol = new Float32Array(stardustCount * 3);

    for (let i = 0; i < stardustCount; i++) {
      const radius = 1.3 + Math.random() * 1.1;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      stardustPos[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      stardustPos[i * 3 + 1] = radius * Math.sin(phi);
      stardustPos[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      const isCyan = Math.random() > 0.5;
      stardustCol[i * 3] = isCyan ? 0.24 : 0.49;
      stardustCol[i * 3 + 1] = isCyan ? 0.91 : 0.36;
      stardustCol[i * 3 + 2] = 1.0;
    }

    stardustGeo.setAttribute('position', new THREE.BufferAttribute(stardustPos, 3));
    stardustGeo.setAttribute('color', new THREE.BufferAttribute(stardustCol, 3));

    const stardustMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const stardust = new THREE.Points(stardustGeo, stardustMat);
    scene.add(stardust);

    // 5. Celebration Supernova Confetti
    const confettiCount = 140;
    const confettiGeo = new THREE.BufferGeometry();
    const confettiPos = new Float32Array(confettiCount * 3);
    const confettiCol = new Float32Array(confettiCount * 3);
    const confettiVel = new Float32Array(confettiCount * 3);

    for (let i = 0; i < confettiCount; i++) {
      confettiPos[i * 3] = 0;
      confettiPos[i * 3 + 1] = 0;
      confettiPos[i * 3 + 2] = 0;

      const rand = Math.random();
      if (rand < 0.3) {
        confettiCol[i * 3] = 0.78; confettiCol[i * 3 + 1] = 1.0; confettiCol[i * 3 + 2] = 0.24; // Lime
      } else if (rand < 0.6) {
        confettiCol[i * 3] = 0.24; confettiCol[i * 3 + 1] = 0.91; confettiCol[i * 3 + 2] = 1.0; // Cyan
      } else {
        confettiCol[i * 3] = 1.0; confettiCol[i * 3 + 1] = 0.24; confettiCol[i * 3 + 2] = 0.65; // Pink
      }
    }

    confettiGeo.setAttribute('position', new THREE.BufferAttribute(confettiPos, 3));
    confettiGeo.setAttribute('color', new THREE.BufferAttribute(confettiCol, 3));

    const confettiMat = new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const confettiParticles = new THREE.Points(confettiGeo, confettiMat);
    scene.add(confettiParticles);

    // Store state
    stateRef.current = {
      renderer,
      scene,
      camera,
      coreGroup,
      innerCoreMesh,
      wireCoreMesh,
      ring1,
      ring2,
      ring3,
      pointLight,
      stardust,
      confettiParticles,
      confettiVelocities: confettiVel,
      confettiActive: false,
      confettiLife: 0,
      targetMouse: new THREE.Vector2(0, 0),
      currentMouse: new THREE.Vector2(0, 0),
      animFrameId: null,
    };

    // Pointer move listener
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      stateRef.current.targetMouse.set(
        Math.max(-1, Math.min(1, x)),
        Math.max(-1, Math.min(1, y))
      );
    };

    const handleMouseLeave = () => {
      stateRef.current.targetMouse.set(0, 0);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        if (newW > 0 && newH > 0 && camera && renderer) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (document.visibilityState === 'hidden') {
        stateRef.current.animFrameId = requestAnimationFrame(animate);
        return;
      }

      const st = stateRef.current;
      if (!st.renderer || !st.scene || !st.camera) return;

      // Mouse Lerp
      st.currentMouse.lerp(st.targetMouse, 0.08);

      const speedMult = isStreaming ? 2.5 : emotion === 'thinking' ? 1.8 : 1.0;

      // Orbit rotations
      if (st.coreGroup) {
        st.coreGroup.rotation.y += 0.005 * speedMult;
        st.coreGroup.rotation.x = Math.sin(time * 0.001) * 0.15 + st.currentMouse.y * 0.25;
        st.coreGroup.rotation.z = st.currentMouse.x * 0.25;

        // Gentle breathing float
        st.coreGroup.position.y = Math.sin(time * 0.002) * 0.06;
      }

      if (st.innerCoreMesh) {
        st.innerCoreMesh.rotation.x += 0.008 * speedMult;
        st.innerCoreMesh.rotation.y -= 0.01 * speedMult;
      }

      if (st.wireCoreMesh) {
        st.wireCoreMesh.rotation.x -= 0.006 * speedMult;
        st.wireCoreMesh.rotation.y += 0.008 * speedMult;
      }

      if (st.ring1) {
        st.ring1.rotation.z += 0.012 * speedMult;
      }
      if (st.ring2) {
        st.ring2.rotation.z -= 0.009 * speedMult;
      }
      if (st.ring3) {
        st.ring3.rotation.x += 0.014 * speedMult;
      }

      if (st.stardust) {
        st.stardust.rotation.y -= 0.003 * speedMult;
        st.stardust.rotation.x = Math.sin(time * 0.0008) * 0.1;
      }

      // Confetti physics
      if (st.confettiActive && st.confettiParticles && st.confettiVelocities) {
        st.confettiLife += dt;
        const posAttr = st.confettiParticles.geometry.attributes.position as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;
        const velArray = st.confettiVelocities;

        for (let i = 0; i < confettiCount; i++) {
          const idx = i * 3;
          const vx = velArray[idx] ?? 0;
          const vy = velArray[idx + 1] ?? 0;
          const vz = velArray[idx + 2] ?? 0;
          posArray[idx] = (posArray[idx] ?? 0) + vx * dt;
          posArray[idx + 1] = (posArray[idx + 1] ?? 0) + vy * dt;
          posArray[idx + 2] = (posArray[idx + 2] ?? 0) + vz * dt;
          velArray[idx + 1] = vy - 3.0 * dt;
        }
        posAttr.needsUpdate = true;

        const confettiMat = st.confettiParticles.material as THREE.PointsMaterial;
        confettiMat.opacity = Math.max(0, 1 - st.confettiLife / 2.0);

        if (st.confettiLife >= 2.0) {
          st.confettiActive = false;
          confettiMat.opacity = 0;
        }
      }

      st.renderer.render(st.scene, st.camera);
      st.animFrameId = requestAnimationFrame(animate);
    };

    stateRef.current.animFrameId = requestAnimationFrame(animate);

    return () => {
      if (stateRef.current.animFrameId) cancelAnimationFrame(stateRef.current.animFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      resizeObserver.disconnect();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [reducedMotion, interactive, emotion, isStreaming]);

  // Color & Emotion Shifts
  useEffect(() => {
    const st = stateRef.current;
    if (!st.wireCoreMesh || !st.pointLight || !st.ring1 || !st.ring2) return;

    const wireMat = st.wireCoreMesh.material as THREE.MeshBasicMaterial;
    const ringMat1 = st.ring1.material as THREE.MeshBasicMaterial;

    if (emotion === 'thinking' || isStreaming) {
      wireMat.color.setHex(0xffb800);
      ringMat1.color.setHex(0xffb800);
      st.pointLight.color.setHex(0xffb800);
      st.pointLight.intensity = 5.0;
    } else if (emotion === 'celebrate' || emotion === 'happy') {
      wireMat.color.setHex(0xc6ff3d);
      ringMat1.color.setHex(0xc6ff3d);
      st.pointLight.color.setHex(0xc6ff3d);
      st.pointLight.intensity = 5.5;
    } else {
      wireMat.color.setHex(0x3de8ff);
      ringMat1.color.setHex(0x7c5cff);
      st.pointLight.color.setHex(0x3de8ff);
      st.pointLight.intensity = 4.0;
    }
  }, [emotion, isStreaming]);

  // Supernova Confetti Trigger
  useEffect(() => {
    if (celebrateTrigger <= 0) return;
    const st = stateRef.current;
    if (!st.confettiParticles || !st.confettiVelocities) return;

    const posAttr = st.confettiParticles.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const velArray = st.confettiVelocities;

    for (let i = 0; i < 140; i++) {
      posArray[i * 3] = (Math.random() - 0.5) * 0.1;
      posArray[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
      posArray[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      const speed = 2.5 + Math.random() * 3.5;

      velArray[i * 3] = speed * Math.cos(theta) * Math.cos(phi);
      velArray[i * 3 + 1] = speed * Math.sin(phi) + 1.5;
      velArray[i * 3 + 2] = speed * Math.sin(theta) * Math.cos(phi);
    }
    posAttr.needsUpdate = true;

    const confettiMat = st.confettiParticles.material as THREE.PointsMaterial;
    confettiMat.opacity = 1.0;
    st.confettiActive = true;
    st.confettiLife = 0;
  }, [celebrateTrigger]);

  if (reducedMotion || !webGLSupported) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-card/40 p-6 backdrop-blur-2xl shadow-[0_8px_32px_rgba(124,92,255,0.15)] ${className}`}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_25px_rgba(61,232,255,0.4)]">
            <span className="text-3xl">🔮</span>
            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-400" />
          </div>
          <div>
            <p className="font-heading text-sm font-bold text-foreground">Hologram Quantum Orb</p>
            <p className="text-xs text-muted-foreground">Chế độ tĩnh tiết kiệm hiệu năng</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative h-[250px] w-full cursor-grab active:cursor-grabbing ${className}`}
      aria-label="3D Hologram Quantum Orb AI Core"
    />
  );
}

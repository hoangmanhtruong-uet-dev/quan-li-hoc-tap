'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type MascotEmotion = 'idle' | 'thinking' | 'celebrate' | 'happy' | 'sleepy';

interface CyberMascot3DProps {
  emotion?: MascotEmotion;
  isStreaming?: boolean;
  className?: string;
  celebrateTrigger?: number; // increments to trigger celebration burst
  interactive?: boolean;
}

export function CyberMascot3D({
  emotion = 'idle',
  isStreaming = false,
  className = '',
  celebrateTrigger = 0,
  interactive = true,
}: CyberMascot3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Mutable refs for Three.js state
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    mascotGroup: THREE.Group | null;
    headGroup: THREE.Group | null;
    leftEye: THREE.Mesh | null;
    rightEye: THREE.Mesh | null;
    leftPupil: THREE.Mesh | null;
    rightPupil: THREE.Mesh | null;
    leftEar: THREE.Mesh | null;
    rightEar: THREE.Mesh | null;
    coreLight: THREE.PointLight | null;
    auraParticles: THREE.Points | null;
    confettiParticles: THREE.Points | null;
    confettiVelocities: Float32Array | null;
    confettiActive: boolean;
    confettiLife: number;
    targetMouse: THREE.Vector2;
    currentMouse: THREE.Vector2;
    animFrameId: number | null;
    blinkTimer: number;
    isBlinking: boolean;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    mascotGroup: null,
    headGroup: null,
    leftEye: null,
    rightEye: null,
    leftPupil: null,
    rightPupil: null,
    leftEar: null,
    rightEar: null,
    coreLight: null,
    auraParticles: null,
    confettiParticles: null,
    confettiVelocities: null,
    confettiActive: false,
    confettiLife: 0,
    targetMouse: new THREE.Vector2(0, 0),
    currentMouse: new THREE.Vector2(0, 0),
    animFrameId: null,
    blinkTimer: 0,
    isBlinking: false,
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

  // Main Three.js setup
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
      renderer.toneMappingExposure = 1.2;
    } catch {
      setWebGLSupported(false);
      return;
    }

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 4.2);

    // Ambient and directional lighting
    const ambientLight = new THREE.AmbientLight(0x221144, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x3de8ff, 2.5);
    keyLight.position.set(2, 3, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x9d4edd, 2.0);
    rimLight.position.set(-2.5, -1, -2);
    scene.add(rimLight);

    const coreLight = new THREE.PointLight(0x3de8ff, 3, 4);
    coreLight.position.set(0, -0.3, 0.5);
    scene.add(coreLight);

    // ==========================================
    // 3D CYBER MASCOT HIERARCHY
    // ==========================================
    const mascotGroup = new THREE.Group();
    scene.add(mascotGroup);

    // Materials
    const darkArmorMat = new THREE.MeshStandardMaterial({
      color: 0x121324,
      metalness: 0.85,
      roughness: 0.25,
    });

    const whiteChassisMat = new THREE.MeshStandardMaterial({
      color: 0xebf2ff,
      metalness: 0.4,
      roughness: 0.2,
    });

    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x070913,
      metalness: 0.95,
      roughness: 0.1,
    });

    const eyeGlowMat = new THREE.MeshBasicMaterial({
      color: 0x3de8ff,
    });

    const pupilMat = new THREE.MeshBasicMaterial({
      color: 0x050c18,
    });

    const earAccentMat = new THREE.MeshStandardMaterial({
      color: 0x7c5cff,
      emissive: 0x4820a0,
      emissiveIntensity: 0.6,
      metalness: 0.5,
      roughness: 0.3,
    });

    // 1. Torso / Hover Pod
    const torsoGeo = new THREE.CylinderGeometry(0.5, 0.25, 0.7, 24);
    const torsoMesh = new THREE.Mesh(torsoGeo, darkArmorMat);
    torsoMesh.position.y = -0.55;
    mascotGroup.add(torsoMesh);

    // Torso Core Reactor Ring
    const ringGeo = new THREE.TorusGeometry(0.38, 0.05, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x3de8ff,
      emissive: 0x3de8ff,
      emissiveIntensity: 1.2,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -0.45;
    mascotGroup.add(ringMesh);

    // 2. Head Group
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.25;
    mascotGroup.add(headGroup);

    // Head Base (Rounded Box / Sphere blend)
    const headGeo = new THREE.SphereGeometry(0.85, 32, 32);
    headGeo.scale(1.15, 0.95, 1.05);
    const headMesh = new THREE.Mesh(headGeo, whiteChassisMat);
    headGroup.add(headMesh);

    // Dark Visor Faceplate
    const visorGeo = new THREE.SphereGeometry(0.82, 32, 24, 0, Math.PI);
    visorGeo.scale(1.08, 0.65, 0.9);
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.02, 0.24);
    visorMesh.rotation.y = -Math.PI / 2;
    headGroup.add(visorMesh);

    // Eyes (Dual Cyber LED Eyes)
    const eyeGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 24);
    const pupilGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16);

    // Left Eye
    const leftEye = new THREE.Mesh(eyeGeo, eyeGlowMat);
    leftEye.rotation.x = Math.PI / 2;
    leftEye.position.set(-0.35, 0.04, 0.98);
    headGroup.add(leftEye);

    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.rotation.x = Math.PI / 2;
    leftPupil.position.set(-0.35, 0.04, 1.01);
    headGroup.add(leftPupil);

    // Right Eye
    const rightEye = new THREE.Mesh(eyeGeo, eyeGlowMat.clone());
    rightEye.rotation.x = Math.PI / 2;
    rightEye.position.set(0.35, 0.04, 0.98);
    headGroup.add(rightEye);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.rotation.x = Math.PI / 2;
    rightPupil.position.set(0.35, 0.04, 1.01);
    headGroup.add(rightPupil);

    // Cyber Antenna / Headset Ears (Hovering on sides)
    const earGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.35, 16);
    const leftEar = new THREE.Mesh(earGeo, earAccentMat);
    leftEar.rotation.z = Math.PI / 3;
    leftEar.position.set(-1.08, 0.25, 0);
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, earAccentMat);
    rightEar.rotation.z = -Math.PI / 3;
    rightEar.position.set(1.08, 0.25, 0);
    headGroup.add(rightEar);

    // Cute Little Cyber Antenna on top
    const antennaStemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const antennaStem = new THREE.Mesh(antennaStemGeo, darkArmorMat);
    antennaStem.position.set(0, 0.95, 0);
    headGroup.add(antennaStem);

    const antennaTipGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const antennaTipMat = new THREE.MeshBasicMaterial({ color: 0xc6ff3d });
    const antennaTip = new THREE.Mesh(antennaTipGeo, antennaTipMat);
    antennaTip.position.set(0, 1.12, 0);
    headGroup.add(antennaTip);

    // ==========================================
    // 3. ORBITING AURA PARTICLES
    // ==========================================
    const particleCount = 75;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.35 + Math.random() * 0.7;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.6;

      positions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      positions[i * 3 + 1] = radius * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      // Cyan-violet gradient particles
      const isCyan = Math.random() > 0.4;
      colors[i * 3] = isCyan ? 0.24 : 0.61;
      colors[i * 3 + 1] = isCyan ? 0.91 : 0.36;
      colors[i * 3 + 2] = 1.0;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const auraParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(auraParticles);

    // ==========================================
    // 4. CELEBRATION CONFETTI PARTICLES
    // ==========================================
    const confettiCount = 120;
    const confettiGeo = new THREE.BufferGeometry();
    const confettiPositions = new Float32Array(confettiCount * 3);
    const confettiColors = new Float32Array(confettiCount * 3);
    const confettiVelocities = new Float32Array(confettiCount * 3);

    for (let i = 0; i < confettiCount; i++) {
      confettiPositions[i * 3] = 0;
      confettiPositions[i * 3 + 1] = 0;
      confettiPositions[i * 3 + 2] = 0;

      // Bright Gen Z neon confetti colors: lime #C6FF3D, pink #FF3DA5, cyan #3DE8FF, orange #FF8A3D
      const rand = Math.random();
      if (rand < 0.25) {
        confettiColors[i * 3] = 0.78; confettiColors[i * 3 + 1] = 1.0; confettiColors[i * 3 + 2] = 0.24; // Lime
      } else if (rand < 0.5) {
        confettiColors[i * 3] = 1.0; confettiColors[i * 3 + 1] = 0.24; confettiColors[i * 3 + 2] = 0.65; // Pink
      } else if (rand < 0.75) {
        confettiColors[i * 3] = 0.24; confettiColors[i * 3 + 1] = 0.91; confettiColors[i * 3 + 2] = 1.0; // Cyan
      } else {
        confettiColors[i * 3] = 1.0; confettiColors[i * 3 + 1] = 0.54; confettiColors[i * 3 + 2] = 0.24; // Orange
      }
    }

    confettiGeo.setAttribute('position', new THREE.BufferAttribute(confettiPositions, 3));
    confettiGeo.setAttribute('color', new THREE.BufferAttribute(confettiColors, 3));

    const confettiMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0,
    });

    const confettiParticles = new THREE.Points(confettiGeo, confettiMat);
    scene.add(confettiParticles);

    // Save refs
    stateRef.current = {
      renderer,
      scene,
      camera,
      mascotGroup,
      headGroup,
      leftEye,
      rightEye,
      leftPupil,
      rightPupil,
      leftEar,
      rightEar,
      coreLight,
      auraParticles,
      confettiParticles,
      confettiVelocities,
      confettiActive: false,
      confettiLife: 0,
      targetMouse: new THREE.Vector2(0, 0),
      currentMouse: new THREE.Vector2(0, 0),
      animFrameId: null,
      blinkTimer: 0,
      isBlinking: false,
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

    // Window resize observer
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

      // Check tab visibility
      if (document.visibilityState === 'hidden') {
        stateRef.current.animFrameId = requestAnimationFrame(animate);
        return;
      }

      const st = stateRef.current;
      if (!st.renderer || !st.scene || !st.camera) return;

      // Mouse Lerp
      st.currentMouse.lerp(st.targetMouse, 0.08);

      // Mascot Bobbing & Floating Motion
      if (st.mascotGroup) {
        st.mascotGroup.position.y = Math.sin(time * 0.002) * 0.08;
        st.mascotGroup.rotation.y = THREE.MathUtils.lerp(
          st.mascotGroup.rotation.y,
          st.currentMouse.x * 0.25,
          0.05
        );
      }

      // Head tracking pointer
      if (st.headGroup) {
        st.headGroup.rotation.y = THREE.MathUtils.lerp(
          st.headGroup.rotation.y,
          st.currentMouse.x * 0.5,
          0.1
        );
        st.headGroup.rotation.x = THREE.MathUtils.lerp(
          st.headGroup.rotation.x,
          -st.currentMouse.y * 0.35,
          0.1
        );

        // Thinking head tilt / nod
        if (emotion === 'thinking' || isStreaming) {
          st.headGroup.rotation.z = Math.sin(time * 0.005) * 0.08;
          st.headGroup.position.y = 0.25 + Math.sin(time * 0.008) * 0.03;
        } else {
          st.headGroup.rotation.z = THREE.MathUtils.lerp(st.headGroup.rotation.z, 0, 0.1);
          st.headGroup.position.y = 0.25;
        }
      }

      // Pupil slight parallax inside eyes
      if (st.leftPupil && st.rightPupil) {
        const pupilOffsetX = st.currentMouse.x * 0.04;
        const pupilOffsetY = st.currentMouse.y * 0.03;
        st.leftPupil.position.x = -0.35 + pupilOffsetX;
        st.leftPupil.position.y = 0.04 + pupilOffsetY;
        st.rightPupil.position.x = 0.35 + pupilOffsetX;
        st.rightPupil.position.y = 0.04 + pupilOffsetY;
      }

      // Blinking mechanism
      st.blinkTimer += dt;
      if (st.blinkTimer > 3.5 && !st.isBlinking) {
        st.isBlinking = true;
        st.blinkTimer = 0;
      }
      if (st.isBlinking) {
        if (st.leftEye && st.rightEye) {
          st.leftEye.scale.y = 0.08;
          st.rightEye.scale.y = 0.08;
        }
        if (st.blinkTimer > 0.14) {
          st.isBlinking = false;
          st.blinkTimer = 0;
          if (st.leftEye && st.rightEye) {
            st.leftEye.scale.y = 1;
            st.rightEye.scale.y = 1;
          }
        }
      }

      // Ear wobble
      if (st.leftEar && st.rightEar) {
        st.leftEar.position.y = 0.25 + Math.sin(time * 0.004) * 0.03;
        st.rightEar.position.y = 0.25 + Math.sin(time * 0.004 + Math.PI) * 0.03;
      }

      // Core light & Aura rotation
      if (st.auraParticles) {
        const speed = isStreaming ? 0.003 : emotion === 'thinking' ? 0.002 : 0.0008;
        st.auraParticles.rotation.y += speed;
        st.auraParticles.rotation.x = Math.sin(time * 0.001) * 0.15;
      }

      // Confetti physics when active
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
          // Gravity
          velArray[idx + 1] = vy - 3.2 * dt;
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

    // Cleanup on unmount
    return () => {
      if (stateRef.current.animFrameId) cancelAnimationFrame(stateRef.current.animFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      resizeObserver.disconnect();

      // Dispose Three.js objects
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

  // Handle emotion shifts & eye colors
  useEffect(() => {
    const st = stateRef.current;
    if (!st.leftEye || !st.rightEye || !st.coreLight) return;

    const leftMat = st.leftEye.material as THREE.MeshBasicMaterial;
    const rightMat = st.rightEye.material as THREE.MeshBasicMaterial;

    if (emotion === 'thinking' || isStreaming) {
      leftMat.color.setHex(0xffb800);
      rightMat.color.setHex(0xffb800);
      st.coreLight.color.setHex(0xffb800);
      st.coreLight.intensity = 4.0;
    } else if (emotion === 'celebrate' || emotion === 'happy') {
      leftMat.color.setHex(0xc6ff3d);
      rightMat.color.setHex(0xc6ff3d);
      st.coreLight.color.setHex(0xc6ff3d);
      st.coreLight.intensity = 4.5;
    } else {
      // Idle cyan
      leftMat.color.setHex(0x3de8ff);
      rightMat.color.setHex(0x3de8ff);
      st.coreLight.color.setHex(0x3de8ff);
      st.coreLight.intensity = 3.0;
    }
  }, [emotion, isStreaming]);

  // Handle celebration trigger burst
  useEffect(() => {
    if (celebrateTrigger <= 0) return;
    const st = stateRef.current;
    if (!st.confettiParticles || !st.confettiVelocities) return;

    const posAttr = st.confettiParticles.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const velArray = st.confettiVelocities;

    for (let i = 0; i < 120; i++) {
      posArray[i * 3] = (Math.random() - 0.5) * 0.2;
      posArray[i * 3 + 1] = 0.2;
      posArray[i * 3 + 2] = (Math.random() - 0.5) * 0.2;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 3.5;
      velArray[i * 3] = Math.cos(angle) * speed;
      velArray[i * 3 + 1] = 2.5 + Math.random() * 2.8;
      velArray[i * 3 + 2] = Math.sin(angle) * speed;
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
        className={`relative flex items-center justify-center overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-b from-violet-950/40 via-card to-background p-6 shadow-[4px_4px_0px_#000] ${className}`}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(61,232,255,0.4)]">
            <span className="text-3xl">🤖</span>
            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-400" />
          </div>
          <div>
            <p className="font-heading text-sm font-bold text-foreground">Cyber Mascot · Squad Buddy</p>
            <p className="text-xs text-muted-foreground">Chế độ tĩnh (Tiết kiệm hiệu năng)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative h-[240px] w-full cursor-grab active:cursor-grabbing ${className}`}
      aria-label="3D Cyber Mascot Squad Buddy"
    />
  );
}

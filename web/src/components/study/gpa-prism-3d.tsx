'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface GpaPrism3DProps {
  gpa?: number; // scale 4.0 (e.g. 3.75)
  className?: string;
  interactive?: boolean;
}

export function GpaPrism3D({
  gpa = 3.72,
  className = '',
  interactive = true,
}: GpaPrism3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    prismGroup: THREE.Group | null;
    prismMesh: THREE.Mesh | null;
    wirePrism: THREE.Mesh | null;
    coreLight: THREE.PointLight | null;
    refractedBeams: THREE.LineSegments | null;
    floatingGems: THREE.InstancedMesh | null;
    targetMouse: THREE.Vector2;
    currentMouse: THREE.Vector2;
    animFrameId: number | null;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    prismGroup: null,
    prismMesh: null,
    wirePrism: null,
    coreLight: null,
    refractedBeams: null,
    floatingGems: null,
    targetMouse: new THREE.Vector2(0, 0),
    currentMouse: new THREE.Vector2(0, 0),
    animFrameId: null,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  useEffect(() => {
    if (reducedMotion || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 260;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
    } catch {
      setWebGLSupported(false);
      return;
    }

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 4.5);

    // Dynamic Lights
    const ambientLight = new THREE.AmbientLight(0x181035, 2.2);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(0x3de8ff, 4.5, 6);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    const dirLight1 = new THREE.DirectionalLight(0x7c5cff, 2.2);
    dirLight1.position.set(2, 3, 2);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00f5a0, 1.8);
    dirLight2.position.set(-2, -2, -1);
    scene.add(dirLight2);

    // ==========================================
    // 3D GPA PRISM & REFRACTION BEAMS
    // ==========================================
    const prismGroup = new THREE.Group();
    scene.add(prismGroup);

    // 1. Triangular / Hexagonal Cut Prism (Cylinder with 6 sides)
    const prismGeo = new THREE.CylinderGeometry(0.85, 0.85, 1.6, 6);
    const prismMat = new THREE.MeshStandardMaterial({
      color: 0x141b36,
      emissive: 0x122244,
      emissiveIntensity: 0.9,
      metalness: 0.85,
      roughness: 0.12,
      flatShading: true,
    });
    const prismMesh = new THREE.Mesh(prismGeo, prismMat);
    prismGroup.add(prismMesh);

    // 2. Outer Wireframe Accent Cage
    const wireGeo = new THREE.CylinderGeometry(0.96, 0.96, 1.75, 6);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x3de8ff,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const wirePrism = new THREE.Mesh(wireGeo, wireMat);
    prismGroup.add(wirePrism);

    // 3. Spectral Refraction Beams (Dispersion Rays radiating outwards)
    const beamCount = 36;
    const beamPositions = new Float32Array(beamCount * 2 * 3);
    const beamColors = new Float32Array(beamCount * 2 * 3);

    for (let i = 0; i < beamCount; i++) {
      const angle = (i / beamCount) * Math.PI * 2;
      const originR = 0.88;
      const targetR = 1.9 + Math.random() * 0.5;

      // Origin vertex
      beamPositions[i * 6] = originR * Math.cos(angle);
      beamPositions[i * 6 + 1] = (Math.random() - 0.5) * 1.2;
      beamPositions[i * 6 + 2] = originR * Math.sin(angle);

      // Target vertex
      beamPositions[i * 6 + 3] = targetR * Math.cos(angle);
      beamPositions[i * 6 + 4] = (beamPositions[i * 6 + 1] ?? 0) + (Math.random() - 0.5) * 0.4;
      beamPositions[i * 6 + 5] = targetR * Math.sin(angle);

      // Spectral colors: Emerald -> Cyan -> Violet -> Amber
      const ratio = i / beamCount;
      const r = Math.sin(ratio * Math.PI) * 0.5 + 0.3;
      const g = Math.cos(ratio * Math.PI * 0.5) * 0.8;
      const b = 1.0;

      beamColors[i * 6] = r;
      beamColors[i * 6 + 1] = g;
      beamColors[i * 6 + 2] = b;

      beamColors[i * 6 + 3] = r * 0.2;
      beamColors[i * 6 + 4] = g * 0.2;
      beamColors[i * 6 + 5] = b * 0.2;
    }

    const beamGeo = new THREE.BufferGeometry();
    beamGeo.setAttribute('position', new THREE.BufferAttribute(beamPositions, 3));
    beamGeo.setAttribute('color', new THREE.BufferAttribute(beamColors, 3));

    const beamMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const refractedBeams = new THREE.LineSegments(beamGeo, beamMat);
    prismGroup.add(refractedBeams);

    // 4. Orbiting Mini Grade Shards
    const shardCount = 20;
    const shardGeo = new THREE.OctahedronGeometry(0.08, 0);
    const shardMat = new THREE.MeshBasicMaterial({ color: 0x00f5a0 });
    const floatingGems = new THREE.InstancedMesh(shardGeo, shardMat, shardCount);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < shardCount; i++) {
      const radius = 1.5 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 1.8;
      dummy.position.set(radius * Math.cos(theta), y, radius * Math.sin(theta));
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      floatingGems.setMatrixAt(i, dummy.matrix);
    }
    floatingGems.instanceMatrix.needsUpdate = true;
    prismGroup.add(floatingGems);

    stateRef.current = {
      renderer,
      scene,
      camera,
      prismGroup,
      prismMesh,
      wirePrism,
      coreLight,
      refractedBeams,
      floatingGems,
      targetMouse: new THREE.Vector2(0, 0),
      currentMouse: new THREE.Vector2(0, 0),
      animFrameId: null,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      stateRef.current.targetMouse.set(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
    };

    const handleMouseLeave = () => {
      stateRef.current.targetMouse.set(0, 0);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

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
    const animate = (time: number) => {
      if (document.visibilityState === 'hidden') {
        stateRef.current.animFrameId = requestAnimationFrame(animate);
        return;
      }

      const st = stateRef.current;
      if (!st.renderer || !st.scene || !st.camera) return;

      st.currentMouse.lerp(st.targetMouse, 0.08);

      if (st.prismGroup) {
        st.prismGroup.rotation.y += 0.007;
        st.prismGroup.rotation.x = Math.sin(time * 0.001) * 0.15 + st.currentMouse.y * 0.25;
        st.prismGroup.rotation.z = st.currentMouse.x * 0.25;
        st.prismGroup.position.y = Math.sin(time * 0.002) * 0.08;
      }

      if (st.floatingGems) {
        st.floatingGems.rotation.y -= 0.01;
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
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.InstancedMesh) {
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
  }, [reducedMotion, interactive]);

  // Update colors based on GPA scale
  useEffect(() => {
    const st = stateRef.current;
    if (!st.wirePrism || !st.coreLight) return;

    const wireMat = st.wirePrism.material as THREE.MeshBasicMaterial;

    if (gpa >= 3.6) {
      // Xuất sắc: Emerald Green & Cyan
      wireMat.color.setHex(0x00f5a0);
      st.coreLight.color.setHex(0x00f5a0);
    } else if (gpa >= 3.2) {
      // Giỏi: Cyan & Royal Violet
      wireMat.color.setHex(0x3de8ff);
      st.coreLight.color.setHex(0x3de8ff);
    } else if (gpa >= 2.5) {
      // Khá: Gold Amber
      wireMat.color.setHex(0xffb800);
      st.coreLight.color.setHex(0xffb800);
    } else {
      // Cần cải thiện: Rose Warning
      wireMat.color.setHex(0xff3d71);
      st.coreLight.color.setHex(0xff3d71);
    }
  }, [gpa]);

  if (reducedMotion || !webGLSupported) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-card/40 p-6 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] ${className}`}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/15 shadow-[0_0_20px_rgba(0,245,160,0.3)]">
            <span className="text-2xl">💎</span>
          </div>
          <p className="font-heading text-xs font-bold text-foreground">GPA Prism 3D</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative h-[250px] w-full cursor-grab active:cursor-grabbing ${className}`}
      aria-label="3D Academic GPA Prism"
    />
  );
}

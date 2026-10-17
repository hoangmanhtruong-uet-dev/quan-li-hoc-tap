'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Cpu } from 'lucide-react';

export interface Auth3DShowcaseProps {
  className?: string;
  intensity?: number;
  interactive?: boolean;
}

export function Auth3DShowcase({
  className = '',
  intensity = 1.0,
  interactive = true,
}: Auth3DShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    // 1. Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    // 2. Check WebGL support
    try {
      const testCanvas = document.createElement('canvas');
      const gl = !!(
        window.WebGLRenderingContext &&
        (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'))
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
    const width = container.clientWidth || 440;
    const height = container.clientHeight || 360;

    // 3. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. Memory Tracking for Strict Disposal
    const geometriesToDispose: THREE.BufferGeometry[] = [];
    const materialsToDispose: THREE.Material[] = [];

    const registerMesh = <T extends THREE.Mesh | THREE.Points>(obj: T): T => {
      if (obj.geometry) geometriesToDispose.push(obj.geometry);
      if (Array.isArray(obj.material)) {
        materialsToDispose.push(...obj.material);
      } else if (obj.material) {
        materialsToDispose.push(obj.material);
      }
      return obj;
    };

    // Master Group for the Hologram Sphere
    const hologramGroup = new THREE.Group();
    scene.add(hologramGroup);

    // 5. Studio Lighting System (Dual Spotlights: Cyan & Violet)
    const ambientLight = new THREE.AmbientLight(0x0e1326, 1.6);
    scene.add(ambientLight);

    // Spotlight Cyan (#38bdf8 / 0x38bdf8) from top-left
    const spotLightCyan = new THREE.SpotLight(0x38bdf8, 5.0 * intensity, 22, Math.PI / 4, 0.35, 1.1);
    spotLightCyan.position.set(-4, 5, 4);
    const cyanTarget = new THREE.Object3D();
    cyanTarget.position.set(0, 0, 0);
    scene.add(cyanTarget);
    spotLightCyan.target = cyanTarget;
    scene.add(spotLightCyan);

    // Spotlight Violet (#a855f7 / 0xa855f7) from bottom-right
    const spotLightViolet = new THREE.SpotLight(0xa855f7, 5.0 * intensity, 22, Math.PI / 4, 0.35, 1.1);
    spotLightViolet.position.set(4, -3.5, 3.5);
    const violetTarget = new THREE.Object3D();
    violetTarget.position.set(0, 0, 0);
    scene.add(violetTarget);
    spotLightViolet.target = violetTarget;
    scene.add(spotLightViolet);

    // Key Directional Rim Light
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
    rimLight.position.set(0, 4, 5);
    scene.add(rimLight);

    // 6. Cyber-Glass Hologram Geometries
    // 6.1 Central Faceted Icosahedron Core
    const coreGeo = new THREE.IcosahedronGeometry(1.22, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0a1026,
      emissive: 0x1e1548,
      emissiveIntensity: 0.7,
      metalness: 0.88,
      roughness: 0.18,
      flatShading: true,
    });
    const coreMesh = registerMesh(new THREE.Mesh(coreGeo, coreMat));
    hologramGroup.add(coreMesh);

    // 6.2 Outer Wireframe Cage (Cyan #38bdf8)
    const wireGeo = new THREE.IcosahedronGeometry(1.48, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const wireMesh = registerMesh(new THREE.Mesh(wireGeo, wireMat));
    hologramGroup.add(wireMesh);

    // 6.3 3 Gyroscopic Torus Orbital Rings
    // Ring 1: Cyan #38bdf8
    const ring1Geo = new THREE.TorusGeometry(1.85, 0.022, 16, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
    });
    const ring1 = registerMesh(new THREE.Mesh(ring1Geo, ring1Mat));
    ring1.rotation.x = Math.PI / 3;
    hologramGroup.add(ring1);

    // Ring 2: Violet #a855f7
    const ring2Geo = new THREE.TorusGeometry(2.05, 0.022, 16, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.8,
    });
    const ring2 = registerMesh(new THREE.Mesh(ring2Geo, ring2Mat));
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 6;
    hologramGroup.add(ring2);

    // Ring 3: Acid Lime #c6ff3d
    const ring3Geo = new THREE.TorusGeometry(2.25, 0.016, 16, 64);
    const ring3Mat = new THREE.MeshBasicMaterial({
      color: 0xc6ff3d,
      transparent: true,
      opacity: 0.7,
    });
    const ring3 = registerMesh(new THREE.Mesh(ring3Geo, ring3Mat));
    ring3.rotation.z = Math.PI / 5;
    hologramGroup.add(ring3);

    // 6.4 140 Quantum Stardust Point Nodes
    const PARTICLE_COUNT = 140;
    const particlesGeo = new THREE.BufferGeometry();
    geometriesToDispose.push(particlesGeo);

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    const colorCyan = new THREE.Color(0x38bdf8);
    const colorViolet = new THREE.Color(0xa855f7);
    const colorLime = new THREE.Color(0xc6ff3d);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 2.4 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const chosenColor = i % 3 === 0 ? colorCyan : i % 3 === 1 ? colorViolet : colorLime;
      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materialsToDispose.push(particlesMat);

    const particlesPoints = new THREE.Points(particlesGeo, particlesMat);
    hologramGroup.add(particlesPoints);

    // 7. Parallax Pointer Tracking & Animation Loop
    let targetRotY = 0;
    let targetRotX = 0;

    const handlePointerMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const xNorm = (e.clientX - rect.left) / rect.width - 0.5;
      const yNorm = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = xNorm * 0.45;
      targetRotX = yNorm * 0.3;
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 440;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    let lastTime = performance.now();
    let clockTime = 0;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        lastTime = performance.now();
        animId = requestAnimationFrame(animate);
      }
    };

    container.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      clockTime += delta;

      // Smooth lerp damping for pointer tracking
      hologramGroup.rotation.y += (targetRotY - hologramGroup.rotation.y) * 0.05;
      hologramGroup.rotation.x += (targetRotX - hologramGroup.rotation.x) * 0.05;

      // Sine wave levitation
      hologramGroup.position.y = Math.sin(clockTime * 1.5) * 0.12;

      // Rotate core and wireframe in opposite directions
      coreMesh.rotation.y += 0.007;
      coreMesh.rotation.x += 0.004;
      wireMesh.rotation.y -= 0.005;
      wireMesh.rotation.z += 0.003;

      // Orbital rings rotate independently
      ring1.rotation.z += 0.012;
      ring2.rotation.x += 0.009;
      ring3.rotation.y += 0.007;

      // Rotate stardust particles slowly
      particlesPoints.rotation.y += 0.003;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Strict Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animId);
      mediaQuery.removeEventListener('change', handleMotionChange);
      container.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      for (const geo of geometriesToDispose) {
        geo.dispose();
      }
      for (const mat of materialsToDispose) {
        mat.dispose();
      }
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [intensity, interactive, isReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[180px] max-h-full flex items-center justify-center overflow-hidden rounded-3xl ${className}`}
    >
      {/* Reduced-Motion & WebGL Fallback Card */}
      {(!hasWebGL || isReducedMotion) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center rounded-3xl border border-cyan-400/30 bg-card/40 backdrop-blur-2xl shadow-2xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-950/50 mb-3 animate-pulse">
            <Cpu className="h-8 w-8 text-cyan-400" />
          </div>
          <h3 className="text-lg font-black text-white font-display">
            HOLOGRAPHIC QUANTUM MATRIX
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Đồ họa tĩnh tối ưu hiệu năng và tiết kiệm pin (Chế độ giảm hiệu ứng).
          </p>
        </div>
      )}

      {/* Cyberpunk Floating Label HUD */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-cyan-400/30 bg-slate-950/70 px-3.5 py-1 text-[11px] font-semibold text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-950/50">
        <Sparkles className="h-3 w-3 text-cyan-400" />
        <span className="tracking-wider uppercase font-mono">Cyber-Glass Stage &middot; Three.js 120FPS</span>
      </div>
    </div>
  );
}

export default Auth3DShowcase;

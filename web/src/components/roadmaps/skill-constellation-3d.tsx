'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ConstellationProps {
  className?: string;
  activeCategory?: string;
  onSelectNode?: (name: string) => void;
}

interface StarNodeData {
  position: THREE.Vector3;
  color: THREE.Color;
  size: number;
  name: string;
  category: string;
  level: number;
}

export function SkillConstellation3D({
  className = '',
  activeCategory = 'Tất cả',
  onSelectNode,
}: ConstellationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    // 1. Accessibility: prefers-reduced-motion check
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    // 2. WebGL support check
    try {
      const canvas = document.createElement('canvas');
      const gl = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
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

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 350;

    // 3. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 16);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // 4. Build Constellation Clusters & Nodes
    const clusterColors: Record<string, number> = {
      'Lập trình': 0x3de8ff, // Cyan
      'Khoa học máy tính': 0x7c5cff, // Purple
      'Dữ liệu & AI': 0x10b981, // Emerald
      'Kỹ năng mềm': 0xffb800, // Amber
      'Thiết kế': 0xff3da5, // Pink
    };

    const nodeDefinitions = [
      { name: 'JavaScript', category: 'Lập trình', pos: [-4, 2, 0], level: 6 },
      { name: 'TypeScript', category: 'Lập trình', pos: [-2.5, 3.2, 1], level: 5 },
      { name: 'React 18', category: 'Lập trình', pos: [-3.8, 0.5, -1], level: 5 },
      { name: 'Next.js', category: 'Lập trình', pos: [-2, 1.2, 1.5], level: 4 },
      { name: 'Tailwind CSS', category: 'Lập trình', pos: [-5, 2.5, -1], level: 6 },

      { name: 'Python', category: 'Lập trình', pos: [1, 2.8, -1], level: 5 },
      { name: 'Data Analysis', category: 'Dữ liệu & AI', pos: [2.5, 2, 1.2], level: 4 },
      { name: 'Pandas & NumPy', category: 'Dữ liệu & AI', pos: [4, 2.6, 0], level: 4 },
      { name: 'Machine Learning', category: 'Dữ liệu & AI', pos: [3.5, 0.8, -1.5], level: 3 },

      { name: 'Data Structures', category: 'Khoa học máy tính', pos: [-0.5, -0.5, 2], level: 5 },
      { name: 'Algorithms', category: 'Khoa học máy tính', pos: [0.8, -1.8, 1], level: 4 },
      { name: 'OS Architecture', category: 'Khoa học máy tính', pos: [-1.8, -2, -0.5], level: 3 },
      { name: 'Computer Network', category: 'Khoa học máy tính', pos: [-0.2, -3.2, 0.5], level: 4 },

      { name: 'Public Speaking', category: 'Kỹ năng mềm', pos: [3, -1.5, 0.5], level: 5 },
      { name: 'Team Pitching', category: 'Kỹ năng mềm', pos: [4.2, -2.5, -1], level: 4 },
      { name: 'UI/UX Design', category: 'Thiết kế', pos: [-3, -1.2, 2], level: 4 },
    ];

    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);

    const starsData: StarNodeData[] = [];
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);

    nodeDefinitions.forEach((def) => {
      const hex = clusterColors[def.category] ?? 0x3de8ff;
      const color = new THREE.Color(hex);
      const radius = 0.16 + (def.level / 10) * 0.14;

      const material = new THREE.MeshBasicMaterial({
        color: hex,
        wireframe: false,
      });

      const sphere = new THREE.Mesh(sphereGeometry, material);
      sphere.position.set(def.pos[0] ?? 0, def.pos[1] ?? 0, def.pos[2] ?? 0);
      sphere.scale.set(radius, radius, radius);
      sphere.userData = { name: def.name, category: def.category, level: def.level };
      nodesGroup.add(sphere);

      // Glowing outer ring for high-level nodes (level >= 5)
      if (def.level >= 5) {
        const ringGeo = new THREE.RingGeometry(radius * 1.5, radius * 1.8, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: hex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(sphere.position);
        ring.rotation.x = Math.PI / 3;
        nodesGroup.add(ring);
      }

      starsData.push({
        position: sphere.position,
        color,
        size: radius,
        name: def.name,
        category: def.category,
        level: def.level,
      });
    });

    // 5. Connect Stars with Constellation Filaments
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x3de8ff,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });

    const linePoints: THREE.Vector3[] = [];
    for (let i = 0; i < starsData.length; i++) {
      for (let j = i + 1; j < starsData.length; j++) {
        const p1 = starsData[i]?.position;
        const p2 = starsData[j]?.position;
        if (!p1 || !p2) continue;

        const dist = p1.distanceTo(p2);
        // Connect nodes in proximity or belonging to same category
        const sameCategory = starsData[i]?.category === starsData[j]?.category;
        const maxDist = sameCategory ? 3.8 : 2.5;

        if (dist < maxDist) {
          linePoints.push(p1, p2);
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    nodesGroup.add(lineMesh);

    // 6. Floating Cosmic Stardust Particles
    const dustCount = 180;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 24;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      const c = Math.random() > 0.5 ? new THREE.Color(0x3de8ff) : new THREE.Color(0x7c5cff);
      dustColors[i * 3] = c.r;
      dustColors[i * 3 + 1] = c.g;
      dustColors[i * 3 + 2] = c.b;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const dustMesh = new THREE.Points(dustGeo, dustMat);
    scene.add(dustMesh);

    // 7. Raycasting & Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x;
      mouseY = y;
      targetRotY = x * 0.4;
      targetRotX = -y * 0.3;
    };

    container.addEventListener('mousemove', onPointerMove);

    // 8. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();
    let isTabVisible = true;

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) clock.start();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 350;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isTabVisible) return;

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth parallax & continuous rotation
      nodesGroup.rotation.y += (targetRotY - nodesGroup.rotation.y) * 0.05 + 0.0015;
      nodesGroup.rotation.x += (targetRotX - nodesGroup.rotation.x) * 0.05;

      // Subtle pulse on filament lines
      lineMaterial.opacity = 0.2 + Math.sin(time * 2) * 0.08;

      // Dust gently swaying
      dustMesh.rotation.y += 0.0005;
      dustMesh.rotation.x = Math.sin(time * 0.2) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onPointerMove);
      cancelAnimationFrame(animId);

      // Clean disposal
      sphereGeometry.dispose();
      lineGeometry.dispose();
      dustGeo.dispose();
      lineMaterial.dispose();
      dustMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeCategory, isReducedMotion]);

  if (!hasWebGL || isReducedMotion) {
    return (
      <div className={`relative overflow-hidden rounded-3xl bg-card/40 border border-white/10 p-6 flex flex-col items-center justify-center text-center ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-3">
          ✨
        </div>
        <h4 className="text-sm font-bold text-foreground">Bản đồ Chòm sao Năng lực</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Chế độ tĩnh: Hiển thị liên kết giữa các kỹ năng lập trình, tư duy giải thuật và kỹ năng mềm sinh viên.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[280px] sm:h-[340px] rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing ${className}`}
    >
      {/* Overlay Badge */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 backdrop-blur-md">
          Chòm sao Kỹ năng 3D · 16 Node Kết nối
        </span>
      </div>

      <div className="absolute bottom-4 right-4 z-10 pointer-events-none text-right">
        <span className="text-[10px] text-muted-foreground/80 font-mono block">
          Di chuột để xoay và khám phá chùm kỹ năng
        </span>
      </div>
    </div>
  );
}

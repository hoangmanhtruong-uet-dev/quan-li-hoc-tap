'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface KnowledgeMatrix3DProps {
  className?: string;
  focusCourse?: string | null;
  onSelectCourse?: (courseCode: string) => void;
}

interface CourseNodeData {
  mesh: THREE.Mesh;
  code: string;
  name: string;
  color: THREE.Color;
  angle: number;
  radius: number;
  baseY: number;
  speed: number;
}

export function KnowledgeMatrix3D({
  className = '',
  focusCourse = null,
  onSelectCourse,
}: KnowledgeMatrix3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null);
  const onSelectCourseRef = useRef(onSelectCourse);

  useEffect(() => {
    onSelectCourseRef.current = onSelectCourse;
  }, [onSelectCourse]);

  useEffect(() => {
    // 1. Accessibility: prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handleMotion = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotion);

    // 2. WebGL support check
    try {
      const canvas = document.createElement('canvas');
      const gl = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      if (!gl) {
        setHasWebGL(false);
        return () => mediaQuery.removeEventListener('change', handleMotion);
      }
    } catch {
      setHasWebGL(false);
      return () => mediaQuery.removeEventListener('change', handleMotion);
    }

    const container = containerRef.current;
    if (!container) return () => mediaQuery.removeEventListener('change', handleMotion);

    const width = container.clientWidth || 550;
    const height = container.clientHeight || 320;

    // 3. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 3, 13);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // 4. Central Hologram Core (Dodecahedron Matrix)
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Inner glowing crystal
    const innerGeo = new THREE.OctahedronGeometry(1.2, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x3de8ff,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const innerCrystal = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerCrystal);

    // Outer cyber cage
    const outerGeo = new THREE.IcosahedronGeometry(1.8, 1);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x7c5cff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const outerCage = new THREE.Mesh(outerGeo, outerMat);
    coreGroup.add(outerCage);

    // Orbital Ring 1
    const ringGeo1 = new THREE.TorusGeometry(3.2, 0.02, 16, 80);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x3de8ff,
      transparent: true,
      opacity: 0.4,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    // Orbital Ring 2
    const ringGeo2 = new THREE.TorusGeometry(4.0, 0.02, 16, 80);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xff3da5,
      transparent: true,
      opacity: 0.3,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 6;
    coreGroup.add(ring2);

    // 5. Orbiting Course Satellite Nodes
    const courseNodesData = [
      { code: 'CS101', name: 'Mạng máy tính', color: 0x3de8ff, radius: 3.2, speed: 0.6, baseY: 0.2 },
      { code: 'CS201', name: 'CTDL & Giải thuật', color: 0x7c5cff, radius: 3.6, speed: -0.45, baseY: -0.4 },
      { code: 'MATH101', name: 'Xác suất Thống kê', color: 0xffb800, radius: 4.1, speed: 0.35, baseY: 0.6 },
      { code: 'ML01', name: 'Triết học Mác - Lênin', color: 0x10b981, radius: 2.8, speed: -0.55, baseY: -0.2 },
    ];

    const courseNodes: CourseNodeData[] = [];
    const sphereGeo = new THREE.SphereGeometry(0.32, 16, 16);

    courseNodesData.forEach((item, index) => {
      const color = new THREE.Color(item.color);
      const mat = new THREE.MeshBasicMaterial({
        color: item.color,
      });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.userData = { code: item.code, name: item.name };
      coreGroup.add(mesh);

      // Mini ring around each satellite
      const satRingGeo = new THREE.RingGeometry(0.42, 0.48, 16);
      const satRingMat = new THREE.MeshBasicMaterial({
        color: item.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const satRing = new THREE.Mesh(satRingGeo, satRingMat);
      satRing.rotation.x = Math.PI / 2;
      mesh.add(satRing);

      courseNodes.push({
        mesh,
        code: item.code,
        name: item.name,
        color,
        angle: (index * (Math.PI * 2)) / courseNodesData.length,
        radius: item.radius,
        baseY: item.baseY,
        speed: item.speed,
      });
    });

    // 6. Dynamic Filament Rays Connecting Core to Satellites
    const filamentMat = new THREE.LineBasicMaterial({
      color: 0x3de8ff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });

    const filamentPoints: THREE.Vector3[] = [];
    for (let i = 0; i < courseNodes.length; i++) {
      filamentPoints.push(new THREE.Vector3(0, 0, 0));
      filamentPoints.push(new THREE.Vector3(0, 0, 0));
    }
    const filamentGeo = new THREE.BufferGeometry().setFromPoints(filamentPoints);
    const filamentMesh = new THREE.LineSegments(filamentGeo, filamentMat);
    coreGroup.add(filamentMesh);

    // 7. Ambient Cosmic Particles
    const dustCount = 140;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 18;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      const c = Math.random() > 0.5 ? new THREE.Color(0x3de8ff) : new THREE.Color(0x7c5cff);
      dustColors[i * 3] = c.r;
      dustColors[i * 3 + 1] = c.g;
      dustColors[i * 3 + 2] = c.b;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);

    // 8. Raycasting & Interaction
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let targetRotX = 0;
    let targetRotY = 0;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      pointer.x = x;
      pointer.y = y;
      targetRotY = x * 0.35;
      targetRotX = -y * 0.25;

      // Check intersect with satellite meshes
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(courseNodes.map((n) => n.mesh));
      if (intersects.length > 0 && intersects[0]?.object.userData?.code) {
        setHoveredCourse(intersects[0].object.userData.code as string);
      } else {
        setHoveredCourse(null);
      }
    };

    const onClick = () => {
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(courseNodes.map((n) => n.mesh));
      if (intersects.length > 0 && intersects[0]?.object.userData?.code) {
        onSelectCourseRef.current?.(intersects[0].object.userData.code as string);
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onClick);

    // 9. Render & Animation Loop
    let animId: number;
    const clock = new THREE.Clock();
    let isTabVisible = true;

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) clock.start();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 550;
      const h = container.clientHeight || 320;
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

      // Core rotation
      innerCrystal.rotation.x += delta * 0.4;
      innerCrystal.rotation.y += delta * 0.6;
      outerCage.rotation.x -= delta * 0.2;
      outerCage.rotation.y -= delta * 0.3;

      // Ring rotations
      ring1.rotation.z += delta * 0.15;
      ring2.rotation.z -= delta * 0.12;

      // Smooth camera parallax
      coreGroup.rotation.y += (targetRotY - coreGroup.rotation.y) * 0.05;
      coreGroup.rotation.x += (targetRotX - coreGroup.rotation.x) * 0.05;

      // Update orbiting satellites & connecting filaments
      const posAttr = filamentGeo.getAttribute('position') as THREE.BufferAttribute;

      courseNodes.forEach((node, idx) => {
        node.angle += delta * node.speed;
        const x = Math.cos(node.angle) * node.radius;
        const z = Math.sin(node.angle) * node.radius;
        const y = node.baseY + Math.sin(time * 2 + idx) * 0.2;
        node.mesh.position.set(x, y, z);

        // Highlight if focused or hovered
        const isHighlighted = focusCourse === node.code || hoveredCourse === node.code;
        const targetScale = isHighlighted ? 1.45 : 1.0;
        node.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

        // Update filament lines
        posAttr.setXYZ(idx * 2, 0, 0, 0); // Origin at core
        posAttr.setXYZ(idx * 2 + 1, x, y, z); // Target at satellite
      });
      posAttr.needsUpdate = true;

      // Floating dust gently swaying
      dustParticles.rotation.y += 0.0006;
      dustParticles.rotation.x = Math.sin(time * 0.15) * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      mediaQuery.removeEventListener('change', handleMotion);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('click', onClick);
      cancelAnimationFrame(animId);

      // Disposal
      innerGeo.dispose();
      innerMat.dispose();
      outerGeo.dispose();
      outerMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      sphereGeo.dispose();
      filamentGeo.dispose();
      filamentMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [focusCourse, hoveredCourse, isReducedMotion]);

  if (!hasWebGL || isReducedMotion) {
    return (
      <div className={`relative overflow-hidden rounded-3xl bg-card/40 border border-white/10 p-6 flex flex-col items-center justify-center text-center ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-3 text-xl">
          ⚛️
        </div>
        <h4 className="text-sm font-bold text-foreground">Holographic Knowledge Matrix</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Chế độ tĩnh: Không gian kết nối các môn học trọng tâm và nhịp học tập học kỳ hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[260px] sm:h-[320px] rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing select-none ${className}`}
    >
      {/* Floating Status Pill */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 backdrop-blur-md">
          Knowledge Matrix 3D · 4 Vệ tinh Môn học
        </span>
      </div>

      <div className="absolute bottom-4 right-4 z-10 pointer-events-none text-right">
        <span className="text-[10px] text-muted-foreground/80 font-mono block">
          Di chuột để xoay và khám phá quỹ đạo môn học
        </span>
      </div>
    </div>
  );
}

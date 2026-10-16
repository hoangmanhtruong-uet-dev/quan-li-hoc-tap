'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface CyberDorm3DProps {
  className?: string;
  roomMode?: 'study' | 'chill' | 'sleep';
}

export function CyberDorm3D({ className = '', roomMode = 'study' }: CyberDorm3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [currentMode, setCurrentMode] = useState<'study' | 'chill' | 'sleep'>(roomMode);

  useEffect(() => {
    // 1. Accessibility: prefers-reduced-motion check
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    // 2. WebGL check
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

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 300;

    // 3. Scene, Orthographic/Perspective Isometric Camera, Renderer
    const scene = new THREE.Scene();

    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
    // Isometric angle
    camera.position.set(12, 10, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // 4. Room Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const deskLight = new THREE.PointLight(0x3de8ff, 2.5, 10);
    deskLight.position.set(-2, 2.5, 1);
    scene.add(deskLight);

    const warmLamp = new THREE.PointLight(0xffb800, 1.8, 12);
    warmLamp.position.set(2, 3, -1);
    scene.add(warmLamp);

    // 5. Room Geometry Root Group
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    // Floor
    const floorGeo = new THREE.BoxGeometry(7, 0.2, 7);
    const floorMat = new THREE.MeshBasicMaterial({
      color: 0x0a1128,
      wireframe: false,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.1;
    roomGroup.add(floorMesh);

    // Floor Grid Outline
    const gridHelper = new THREE.GridHelper(7, 14, 0x3de8ff, 0x1f293d);
    gridHelper.position.y = 0.01;
    roomGroup.add(gridHelper);

    // Wall Back Left
    const wallGeoL = new THREE.BoxGeometry(0.1, 4, 7);
    const wallMat = new THREE.MeshBasicMaterial({ color: 0x0d1527 });
    const wallL = new THREE.Mesh(wallGeoL, wallMat);
    wallL.position.set(-3.5, 2, 0);
    roomGroup.add(wallL);

    // Wall Back Right
    const wallGeoR = new THREE.BoxGeometry(7, 4, 0.1);
    const wallR = new THREE.Mesh(wallGeoR, wallMat);
    wallR.position.set(0, 2, -3.5);
    roomGroup.add(wallR);

    // Study Desk
    const deskTopGeo = new THREE.BoxGeometry(2.4, 0.12, 1.2);
    const deskMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const desk = new THREE.Mesh(deskTopGeo, deskMat);
    desk.position.set(-2, 1.2, 1);
    roomGroup.add(desk);

    // Desk Legs
    const legGeo = new THREE.BoxGeometry(0.1, 1.2, 0.1);
    const legMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    [
      [-3.1, 0.6, 0.5],
      [-3.1, 0.6, 1.5],
      [-0.9, 0.6, 0.5],
      [-0.9, 0.6, 1.5],
    ].forEach((pos) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(pos[0] ?? 0, pos[1] ?? 0, pos[2] ?? 0);
      roomGroup.add(leg);
    });

    // Glowing Laptop on desk
    const laptopBaseGeo = new THREE.BoxGeometry(0.6, 0.04, 0.45);
    const laptopMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
    const laptopBase = new THREE.Mesh(laptopBaseGeo, laptopMat);
    laptopBase.position.set(-2, 1.3, 1);
    roomGroup.add(laptopBase);

    const screenGeo = new THREE.BoxGeometry(0.6, 0.4, 0.04);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x3de8ff }); // glowing cyan screen
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(-2, 1.5, 0.8);
    screen.rotation.x = -0.2;
    roomGroup.add(screen);

    // Bunk Bed
    const bedFrameGeo = new THREE.BoxGeometry(2.2, 0.4, 4);
    const bedMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b });
    const bed = new THREE.Mesh(bedFrameGeo, bedMat);
    bed.position.set(2.2, 0.4, -1.3);
    roomGroup.add(bed);

    // Mattress & Blanket
    const blanketGeo = new THREE.BoxGeometry(2.0, 0.2, 2.8);
    const blanketMat = new THREE.MeshBasicMaterial({ color: 0x7c5cff });
    const blanket = new THREE.Mesh(blanketGeo, blanketMat);
    blanket.position.set(2.2, 0.6, -0.7);
    roomGroup.add(blanket);

    // Pillow
    const pillowGeo = new THREE.BoxGeometry(1.6, 0.15, 0.7);
    const pillowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pillow = new THREE.Mesh(pillowGeo, pillowMat);
    pillow.position.set(2.2, 0.65, -2.8);
    roomGroup.add(pillow);

    // Student Whiteboard on Wall
    const boardGeo = new THREE.BoxGeometry(0.04, 1.4, 2.2);
    const boardMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(-3.4, 2.5, -1.2);
    roomGroup.add(board);

    // Sticky Notes on Board
    const noteGeo = new THREE.BoxGeometry(0.06, 0.25, 0.25);
    const noteMat1 = new THREE.MeshBasicMaterial({ color: 0xffb800 });
    const note1 = new THREE.Mesh(noteGeo, noteMat1);
    note1.position.set(-3.38, 2.7, -1.6);
    roomGroup.add(note1);

    const noteMat2 = new THREE.MeshBasicMaterial({ color: 0xff3da5 });
    const note2 = new THREE.Mesh(noteGeo, noteMat2);
    note2.position.set(-3.38, 2.5, -0.9);
    roomGroup.add(note2);

    // Mini Fridge
    const fridgeGeo = new THREE.BoxGeometry(1.0, 1.5, 1.0);
    const fridgeMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    const fridge = new THREE.Mesh(fridgeGeo, fridgeMat);
    fridge.position.set(2.6, 0.75, 2.2);
    roomGroup.add(fridge);

    // Ambient floating dust particles
    const pCount = 80;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 6;
      pPos[i * 3 + 1] = Math.random() * 4;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x3de8ff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const pMesh = new THREE.Points(pGeo, pMat);
    roomGroup.add(pMesh);

    // 6. Mouse parallax
    let targetRotY = 0;
    let targetRotX = 0;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = x * 0.25;
      targetRotX = y * 0.15;
    };

    container.addEventListener('mousemove', onPointerMove);

    // 7. Render Loop
    let animId: number;
    let isTabVisible = true;

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 500;
      const h = container.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isTabVisible) return;

      roomGroup.rotation.y += (targetRotY - roomGroup.rotation.y) * 0.05;
      roomGroup.rotation.x += (targetRotX - roomGroup.rotation.x) * 0.05;

      // Glow pulse on screen
      screenMat.color.setHex(
        currentMode === 'study' ? 0x3de8ff : currentMode === 'chill' ? 0xffb800 : 0x7c5cff
      );

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
      floorGeo.dispose();
      floorMat.dispose();
      wallGeoL.dispose();
      wallGeoR.dispose();
      wallMat.dispose();
      deskTopGeo.dispose();
      deskMat.dispose();
      legGeo.dispose();
      legMat.dispose();
      laptopBaseGeo.dispose();
      laptopMat.dispose();
      screenGeo.dispose();
      screenMat.dispose();
      bedFrameGeo.dispose();
      bedMat.dispose();
      blanketGeo.dispose();
      blanketMat.dispose();
      pillowGeo.dispose();
      pillowMat.dispose();
      boardGeo.dispose();
      boardMat.dispose();
      noteGeo.dispose();
      noteMat1.dispose();
      noteMat2.dispose();
      fridgeGeo.dispose();
      fridgeMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [currentMode, isReducedMotion]);

  if (!hasWebGL || isReducedMotion) {
    return (
      <div className={`rounded-3xl bg-card/40 border border-white/10 p-6 flex flex-col items-center justify-center text-center ${className}`}>
        <div className="text-3xl mb-2">🏠</div>
        <h4 className="text-sm font-bold text-foreground">Không gian KTX 3D</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Phòng sinh hoạt chung, phân chia ca trực nhật và đối soát hóa đơn điện nước.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[260px] sm:h-[300px] rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing ${className}`}
    >
      {/* Lighting Mode Switcher Pill */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1 p-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/15">
        {(['study', 'chill', 'sleep'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setCurrentMode(m)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
              currentMode === m
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m === 'study' ? '💡 Học tập' : m === 'chill' ? '☕ Thư giãn' : '🌙 Nghỉ ngơi'}
          </button>
        ))}
      </div>

      <div className="absolute bottom-4 right-4 z-10 pointer-events-none text-right">
        <span className="text-[10px] text-muted-foreground/80 font-mono block">
          Isometric Cyber-Dorm Room · Phòng 402
        </span>
      </div>
    </div>
  );
}

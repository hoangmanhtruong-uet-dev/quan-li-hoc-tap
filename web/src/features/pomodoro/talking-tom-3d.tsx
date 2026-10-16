'use client';

import React, { memo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Sparkles, AlertTriangle, Flame, Hand, Keyboard, Gauge } from 'lucide-react';
import type { CatSkinType } from './characters-data';
import { pomodoroAudio } from './audio-engine';

export type AvatarMood = 'idle' | 'watching' | 'angry' | 'roasting';

interface TalkingTom3DProps {
  mood: AvatarMood;
  characterName: string;
  skinType?: CatSkinType;
  furColor?: string;
  isSpeaking?: boolean;
  liteMode?: boolean;
  onPoke?: () => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export const TalkingTom3D = memo(function TalkingTom3D({
  mood,
  characterName,
  skinType = 'teacher',
  furColor = '#f59e0b',
  isSpeaking = false,
  liteMode = false,
  onPoke,
  onCanvasReady,
}: TalkingTom3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fpsCounterRef = useRef<HTMLSpanElement | null>(null);
  const comboCounterRef = useRef<HTMLSpanElement | null>(null);

  const moodRef = useRef<AvatarMood>(mood);
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  const skinRef = useRef<CatSkinType>(skinType);
  const liteModeRef = useRef<boolean>(liteMode);
  const targetFurColorRef = useRef<THREE.Color>(new THREE.Color(furColor));
  const onPokeRef = useRef<(() => void) | undefined>(onPoke);
  const onCanvasReadyRef = useRef<((canvas: HTMLCanvasElement) => void) | undefined>(onCanvasReady);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    skinRef.current = skinType;
  }, [skinType]);

  useEffect(() => {
    liteModeRef.current = liteMode;
  }, [liteMode]);

  useEffect(() => {
    targetFurColorRef.current.set(furColor);
  }, [furColor]);

  useEffect(() => {
    onPokeRef.current = onPoke;
  }, [onPoke]);

  useEffect(() => {
    onCanvasReadyRef.current = onCanvasReady;
  }, [onCanvasReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = 260;
    const height = 250;

    // 1. Scene, Camera & Ultra-Light WebGLRenderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.2, 25);
    camera.position.set(0, 0.42, 5.3);
    camera.lookAt(0, 0.05, 0);

    // TẮT preserveDrawingBuffer để không khoá pipeline GPU mỗi frame!
    // Chỉ dùng antialias khi không ở chế độ máy yếu
    const renderer = new THREE.WebGLRenderer({
      antialias: !liteModeRef.current,
      alpha: true,
      powerPreference: 'high-performance',
      precision: 'mediump',
      stencil: false,
      depth: true,
    });
    renderer.setSize(width, height);
    // Giới hạn DPR tối đa 1.25 (hoặc 1.0 ở chế độ mượt) để giảm 60% số lượng fragment shader
    renderer.setPixelRatio(liteModeRef.current ? 1 : Math.min(window.devicePixelRatio || 1, 1.25));

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    onCanvasReadyRef.current?.(renderer.domElement);

    // 2. Lights (2 nguồn sáng đơn giản, bỏ PointLight nặng)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.25);
    keyLight.position.set(2.5, 4.5, 4);
    scene.add(keyLight);

    // 3. Vật liệu MeshLambertMaterial (Vertex lighting siêu nhẹ, nhanh gấp 4 lần MeshStandardMaterial)
    const mainFurMat = new THREE.MeshLambertMaterial({
      color: targetFurColorRef.current.clone(),
    });
    const bellyMat = new THREE.MeshLambertMaterial({ color: 0xfff8f0 });
    const pinkMat = new THREE.MeshLambertMaterial({ color: 0xfb7185 });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const mouthInteriorMat = new THREE.MeshBasicMaterial({ color: 0x9f1239 });
    const deskWoodMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
    const laptopMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xfbbf24 });
    const tieMat = new THREE.MeshLambertMaterial({ color: 0xe11d48 });
    const darkLensMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });

    // Dùng chung 1 Unit Sphere Geometry duy nhất (16x14 segments) để giảm tối đa Draw Overhead
    const sharedSphereGeo = new THREE.SphereGeometry(1, 16, 14);

    // 4. Bongo Cat Desk & Laptop
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0, -1.65, 0.9);
    scene.add(deskGroup);

    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.2, 1.3), deskWoodMat);
    deskGroup.add(deskTop);

    const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.7), laptopMat);
    laptopBase.position.set(0, 0.13, 0.05);
    deskGroup.add(laptopBase);

    // 5. Cat Hierarchy
    const catGroup = new THREE.Group();
    scene.add(catGroup);

    // --- BODY ---
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, -1.0, 0);
    catGroup.add(bodyGroup);

    const torsoMesh = new THREE.Mesh(sharedSphereGeo, mainFurMat);
    torsoMesh.scale.set(0.88, 1.08, 0.78);
    bodyGroup.add(torsoMesh);

    const bellyMesh = new THREE.Mesh(sharedSphereGeo, bellyMat);
    bellyMesh.scale.set(0.62, 0.74, 0.38);
    bellyMesh.position.set(0, -0.05, 0.5);
    bodyGroup.add(bellyMesh);

    // --- PAWS (Hai tay Bongo Cat) ---
    const leftPaw = new THREE.Mesh(sharedSphereGeo, mainFurMat);
    leftPaw.scale.set(0.25, 0.19, 0.32);
    leftPaw.position.set(-0.52, -0.35, 0.92);
    bodyGroup.add(leftPaw);

    const rightPawGroup = new THREE.Group();
    rightPawGroup.position.set(0.52, -0.35, 0.92);
    bodyGroup.add(rightPawGroup);

    const rightPaw = new THREE.Mesh(sharedSphereGeo, mainFurMat);
    rightPaw.scale.set(0.25, 0.19, 0.32);
    rightPawGroup.add(rightPaw);

    const rulerMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.9, 0.035), goldMat);
    rulerMesh.position.set(0.12, 0.4, 0.1);
    rulerMesh.rotation.z = -0.25;
    rightPawGroup.add(rulerMesh);

    // --- TAIL ---
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0.55, -0.35, -0.55);
    bodyGroup.add(tailGroup);

    const tailGeo = new THREE.CylinderGeometry(0.09, 0.13, 1.3, 8);
    tailGeo.translate(0, 0.62, 0);
    const tailMesh = new THREE.Mesh(tailGeo, mainFurMat);
    tailMesh.rotation.z = -0.45;
    tailGroup.add(tailMesh);

    // --- HEAD ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.48, 0.1);
    catGroup.add(headGroup);

    const headMesh = new THREE.Mesh(sharedSphereGeo, mainFurMat);
    headMesh.scale.set(1.1, 0.98, 1.0);
    headGroup.add(headMesh);

    // Hai má
    const leftCheek = new THREE.Mesh(sharedSphereGeo, bellyMat);
    leftCheek.scale.set(0.38, 0.3, 0.25);
    leftCheek.position.set(-0.32, -0.24, 0.82);
    headGroup.add(leftCheek);

    const rightCheek = new THREE.Mesh(sharedSphereGeo, bellyMat);
    rightCheek.scale.set(0.38, 0.3, 0.25);
    rightCheek.position.set(0.32, -0.24, 0.82);
    headGroup.add(rightCheek);

    // Mũi
    const noseMesh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.12, 3), pinkMat);
    noseMesh.rotation.x = Math.PI;
    noseMesh.position.set(0, -0.09, 1.05);
    headGroup.add(noseMesh);

    // Ria mép
    const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    const whiskerGeo = new THREE.BoxGeometry(0.6, 0.022, 0.022);
    const createWhisker = (x: number, y: number, rotZ: number) => {
      const w = new THREE.Mesh(whiskerGeo, whiskerMat);
      w.rotation.z = rotZ;
      w.position.set(x, y, 0.9);
      headGroup.add(w);
    };
    createWhisker(-0.65, -0.17, -0.12);
    createWhisker(-0.65, -0.27, 0.08);
    createWhisker(0.65, -0.17, 0.12);
    createWhisker(0.65, -0.27, -0.08);

    // --- EARS ---
    const earGeo = new THREE.ConeGeometry(0.36, 0.7, 4);
    const innerEarGeo = new THREE.ConeGeometry(0.2, 0.45, 4);

    const leftEarGroup = new THREE.Group();
    leftEarGroup.position.set(-0.64, 0.8, 0);
    leftEarGroup.rotation.z = 0.35;
    headGroup.add(leftEarGroup);

    const leftEarMesh = new THREE.Mesh(earGeo, mainFurMat);
    leftEarMesh.rotation.y = Math.PI / 4;
    leftEarGroup.add(leftEarMesh);

    const leftInnerEar = new THREE.Mesh(innerEarGeo, pinkMat);
    leftInnerEar.rotation.y = Math.PI / 4;
    leftInnerEar.position.set(0, -0.05, 0.11);
    leftEarGroup.add(leftInnerEar);

    const rightEarGroup = new THREE.Group();
    rightEarGroup.position.set(0.64, 0.8, 0);
    rightEarGroup.rotation.z = -0.35;
    headGroup.add(rightEarGroup);

    const rightEarMesh = new THREE.Mesh(earGeo, mainFurMat);
    rightEarMesh.rotation.y = Math.PI / 4;
    rightEarGroup.add(rightEarMesh);

    const rightInnerEar = new THREE.Mesh(innerEarGeo, pinkMat);
    rightInnerEar.rotation.y = Math.PI / 4;
    rightInnerEar.position.set(0, -0.05, 0.11);
    rightEarGroup.add(rightInnerEar);

    // --- EYES ---
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.37, 0.18, 0.86);
    headGroup.add(leftEyeGroup);
    const leftEyeWhite = new THREE.Mesh(sharedSphereGeo, eyeWhiteMat);
    leftEyeWhite.scale.set(0.22, 0.26, 0.13);
    leftEyeGroup.add(leftEyeWhite);
    const leftPupil = new THREE.Mesh(sharedSphereGeo, pupilMat);
    leftPupil.scale.set(0.11, 0.13, 0.06);
    leftPupil.position.set(0, 0, 0.11);
    leftEyeGroup.add(leftPupil);

    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(0.37, 0.18, 0.86);
    headGroup.add(rightEyeGroup);
    const rightEyeWhite = new THREE.Mesh(sharedSphereGeo, eyeWhiteMat);
    rightEyeWhite.scale.set(0.22, 0.26, 0.13);
    rightEyeGroup.add(rightEyeWhite);
    const rightPupil = new THREE.Mesh(sharedSphereGeo, pupilMat);
    rightPupil.scale.set(0.11, 0.13, 0.06);
    rightPupil.position.set(0, 0, 0.11);
    rightEyeGroup.add(rightPupil);

    // Lông mày
    const browGeo = new THREE.BoxGeometry(0.34, 0.06, 0.06);
    const browMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.position.set(-0.37, 0.48, 0.96);
    headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, browMat);
    rightBrow.position.set(0.37, 0.48, 0.96);
    headGroup.add(rightBrow);

    // --- MOUTH ---
    const mouthMesh = new THREE.Mesh(sharedSphereGeo, mouthInteriorMat);
    mouthMesh.position.set(0, -0.37, 0.92);
    mouthMesh.scale.set(0.18, 0.04, 0.08);
    headGroup.add(mouthMesh);

    const tongueMesh = new THREE.Mesh(sharedSphereGeo, pinkMat);
    tongueMesh.position.set(0, -0.41, 0.96);
    tongueMesh.scale.set(0.1, 0.04, 0.05);
    headGroup.add(tongueMesh);

    // --- SKINS & ACCESSORIES ---
    const glassesGroup = new THREE.Group();
    const rimGeo = new THREE.TorusGeometry(0.26, 0.025, 6, 18);
    const leftRim = new THREE.Mesh(rimGeo, goldMat);
    leftRim.position.set(-0.37, 0.18, 1.02);
    const rightRim = new THREE.Mesh(rimGeo, goldMat);
    rightRim.position.set(0.37, 0.18, 1.02);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.03), goldMat);
    bridge.position.set(0, 0.2, 1.02);
    glassesGroup.add(leftRim, rightRim, bridge);
    headGroup.add(glassesGroup);

    const tieGroup = new THREE.Group();
    const tieKnot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.12), tieMat);
    tieKnot.position.set(0, 0.62, 0.7);
    const tieBody = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 4), tieMat);
    tieBody.rotation.x = Math.PI;
    tieBody.rotation.y = Math.PI / 4;
    tieBody.position.set(0, 0.2, 0.76);
    tieGroup.add(tieKnot, tieBody);
    bodyGroup.add(tieGroup);

    const sunglassesGroup = new THREE.Group();
    const lensGeo = new THREE.BoxGeometry(0.52, 0.3, 0.06);
    const leftLens = new THREE.Mesh(lensGeo, darkLensMat);
    leftLens.position.set(-0.37, 0.2, 1.03);
    const rightLens = new THREE.Mesh(lensGeo, darkLensMat);
    rightLens.position.set(0.37, 0.2, 1.03);
    const sunglassBar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.07), goldMat);
    sunglassBar.position.set(0, 0.33, 1.04);
    sunglassesGroup.add(leftLens, rightLens, sunglassBar);
    headGroup.add(sunglassesGroup);

    const bellCollarGroup = new THREE.Group();
    const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.06, 6, 18), tieMat);
    collarRing.rotation.x = Math.PI / 2;
    collarRing.position.set(0, 0.68, 0.05);
    const goldBell = new THREE.Mesh(sharedSphereGeo, goldMat);
    goldBell.scale.set(0.16, 0.16, 0.16);
    goldBell.position.set(0, 0.62, 0.76);
    bellCollarGroup.add(collarRing, goldBell);
    bodyGroup.add(bellCollarGroup);

    // --- 6. LIGHTWEIGHT 3D PARTICLES ---
    const particleCount = 20;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3.0;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.2 - 0.5;
      speeds[i] = 0.015 + Math.random() * 0.03;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.11,
      transparent: true,
      opacity: 0.75,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- 7. ZERO-REFLOW INTERACTION (Cached Bounding Rect) ---
    let cachedRect = renderer.domElement.getBoundingClientRect();
    const updateCachedRect = () => {
      cachedRect = renderer.domElement.getBoundingClientRect();
    };
    window.addEventListener('resize', updateCachedRect, { passive: true });
    window.addEventListener('scroll', updateCachedRect, { passive: true });

    let targetMouseX = 0;
    let targetMouseY = 0;
    let pokeBounceVelocity = 0;
    let pokeReactionTimer = 0;
    let leftPawTapTimer = 0;
    let rightPawTapTimer = 0;
    let nextPawIsLeft = true;
    let bongoCount = 0;

    let nextBlinkTime = 2.5 + Math.random() * 3.0;
    let blinkDuration = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (cachedRect.width === 0) updateCachedRect();
      const x = ((e.clientX - cachedRect.left) / cachedRect.width) * 2 - 1;
      const y = -((e.clientY - cachedRect.top) / cachedRect.height) * 2 + 1;
      targetMouseX = Math.max(-1, Math.min(1, x));
      targetMouseY = Math.max(-1, Math.min(1, y));
    };

    const handleClickPoke = () => {
      pokeBounceVelocity = 0.32;
      pokeReactionTimer = 40;
      pomodoroAudio.playAlertSound('poke');
      onPokeRef.current?.();
    };

    const handleKeyDownBongo = () => {
      if (nextPawIsLeft) {
        leftPawTapTimer = 7;
      } else {
        rightPawTapTimer = 7;
      }
      nextPawIsLeft = !nextPawIsLeft;
      bongoCount += 1;
      // Cập nhật trực tiếp vào DOM textContent, KHÔNG gọi React setState tránh lag!
      if (comboCounterRef.current) {
        comboCounterRef.current.textContent = String(bongoCount);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('keydown', handleKeyDownBongo, { passive: true });
    renderer.domElement.addEventListener('click', handleClickPoke);

    // --- 8. RENDER LOOP KÈM ĐO FPS THỰC TẾ ---
    let animFrameId: number;
    const clock = new THREE.Clock();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      // Tạm ngưng render nếu tab đang bị ẩn để tiết kiệm 100% GPU
      if (document.hidden) return;

      const now = performance.now();
      frameCount++;
      if (now - lastFpsUpdate >= 500) {
        const currentFps = Math.min(60, Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        if (fpsCounterRef.current) {
          fpsCounterRef.current.textContent = `${currentFps} FPS`;
        }
        frameCount = 0;
        lastFpsUpdate = now;
      }

      const elapsed = clock.getElapsedTime();
      const currentMood = pokeReactionTimer > 0 ? 'angry' : moodRef.current;

      if (pokeReactionTimer > 0) pokeReactionTimer--;
      if (leftPawTapTimer > 0) leftPawTapTimer--;
      if (rightPawTapTimer > 0) rightPawTapTimer--;

      mainFurMat.color.lerp(targetFurColorRef.current, 0.15);
      glassesGroup.visible = skinRef.current === 'teacher';
      tieGroup.visible = skinRef.current === 'boss' || skinRef.current === 'teacher';
      sunglassesGroup.visible = skinRef.current === 'ceo';
      bellCollarGroup.visible = skinRef.current === 'tsundere';

      const isFurious = currentMood === 'angry' || currentMood === 'roasting';
      rulerMesh.visible = isFurious;

      // Particles (Tắt hạt ở chế độ máy yếu nếu không mắng)
      particles.visible = !liteModeRef.current || isFurious;
      if (particles.visible) {
        const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;
        const speedMultiplier = isFurious ? 2.6 : 0.65;

        particleMat.color.setHex(
          isFurious ? 0xf43f5e : currentMood === 'watching' ? 0xfbbf24 : 0x38bdf8
        );

        for (let i = 0; i < particleCount; i++) {
          const yIdx = i * 3 + 1;
          posArray[yIdx] = (posArray[yIdx] || 0) + (speeds[i] || 0.02) * speedMultiplier;
          if ((posArray[yIdx] || 0) > 1.7) {
            posArray[yIdx] = -1.4;
          }
        }
        posAttr.needsUpdate = true;
      }

      // Chớp mắt tự nhiên
      if (elapsed > nextBlinkTime) {
        blinkDuration = 7;
        nextBlinkTime = elapsed + 2.8 + Math.random() * 3.5;
      }
      const eyeScaleY = blinkDuration > 0 ? 0.08 : isFurious ? 0.72 : 1.0;
      if (blinkDuration > 0) blinkDuration--;
      leftEyeGroup.scale.y = THREE.MathUtils.lerp(leftEyeGroup.scale.y, eyeScaleY, 0.45);
      rightEyeGroup.scale.y = THREE.MathUtils.lerp(rightEyeGroup.scale.y, eyeScaleY, 0.45);

      // Hô hấp & Nhảy khi bị chọc
      if (pokeBounceVelocity > 0 || catGroup.position.y > 0) {
        catGroup.position.y += pokeBounceVelocity;
        pokeBounceVelocity -= 0.028;
        if (catGroup.position.y <= 0) {
          catGroup.position.y = 0;
          pokeBounceVelocity = 0;
        }
      } else {
        catGroup.position.y = Math.sin(elapsed * 2.5) * 0.032;
      }

      // Liếc mắt và xoay đầu theo chuột
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetMouseX * 0.34, 0.14);
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, -targetMouseY * 0.2, 0.14);

      leftPupil.position.x = THREE.MathUtils.lerp(leftPupil.position.x, targetMouseX * 0.075, 0.2);
      leftPupil.position.y = THREE.MathUtils.lerp(leftPupil.position.y, targetMouseY * 0.075, 0.2);
      rightPupil.position.x = THREE.MathUtils.lerp(rightPupil.position.x, targetMouseX * 0.075, 0.2);
      rightPupil.position.y = THREE.MathUtils.lerp(rightPupil.position.y, targetMouseY * 0.075, 0.2);

      // Đuôi và Bongo Cat Paws
      const tailSpeed = isFurious ? 9.5 : 3.0;
      tailGroup.rotation.z = Math.sin(elapsed * tailSpeed) * 0.32;

      const targetLeftPawY = leftPawTapTimer > 0 ? -0.52 : -0.32;
      leftPaw.position.y = THREE.MathUtils.lerp(leftPaw.position.y, targetLeftPawY, 0.48);

      if (isFurious) {
        leftBrow.rotation.z = THREE.MathUtils.lerp(leftBrow.rotation.z, -0.45, 0.2);
        rightBrow.rotation.z = THREE.MathUtils.lerp(rightBrow.rotation.z, 0.45, 0.2);
        leftEarGroup.rotation.z = THREE.MathUtils.lerp(
          leftEarGroup.rotation.z,
          0.62 + Math.sin(elapsed * 16) * 0.07,
          0.2
        );
        rightEarGroup.rotation.z = THREE.MathUtils.lerp(
          rightEarGroup.rotation.z,
          -0.62 - Math.sin(elapsed * 16) * 0.07,
          0.2
        );
        rightPawGroup.position.y = -0.15 + Math.abs(Math.sin(elapsed * 12)) * 0.3;
        headGroup.rotation.z = Math.sin(elapsed * 14) * 0.045;
      } else {
        const browAngle = currentMood === 'watching' ? -0.14 : 0.05;
        leftBrow.rotation.z = THREE.MathUtils.lerp(leftBrow.rotation.z, browAngle, 0.14);
        rightBrow.rotation.z = THREE.MathUtils.lerp(rightBrow.rotation.z, -browAngle, 0.14);
        leftEarGroup.rotation.z = THREE.MathUtils.lerp(
          leftEarGroup.rotation.z,
          0.32 + Math.sin(elapsed * 2) * 0.035,
          0.14
        );
        rightEarGroup.rotation.z = THREE.MathUtils.lerp(
          rightEarGroup.rotation.z,
          -0.32 - Math.sin(elapsed * 2) * 0.035,
          0.14
        );
        const targetRightPawY = rightPawTapTimer > 0 ? -0.52 : -0.32;
        rightPawGroup.position.y = THREE.MathUtils.lerp(
          rightPawGroup.position.y,
          targetRightPawY,
          0.48
        );
        headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, 0, 0.14);
      }

      // Nhép miệng Lip-Sync
      const openness = isSpeakingRef.current ? pomodoroAudio.getMouthOpenness() : 0;
      const targetMouthScaleY = isSpeakingRef.current
        ? 0.05 + openness * 0.22
        : isFurious
        ? 0.07
        : 0.03;
      const targetMouthScaleX = isSpeakingRef.current ? 0.18 + openness * 0.07 : 0.18;

      mouthMesh.scale.y = THREE.MathUtils.lerp(mouthMesh.scale.y, targetMouthScaleY, 0.4);
      mouthMesh.scale.x = THREE.MathUtils.lerp(mouthMesh.scale.x, targetMouthScaleX, 0.4);
      tongueMesh.visible = mouthMesh.scale.y > 0.065;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', updateCachedRect);
      window.removeEventListener('scroll', updateCachedRect);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDownBongo);
      renderer.domElement.removeEventListener('click', handleClickPoke);

      sharedSphereGeo.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [liteMode]);

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Sân khấu 3D Canvas dùng radial-gradient tĩnh thay vì filter blur-3xl nặng GPU */}
      <div className="group relative flex flex-col items-center">
        <div
          ref={containerRef}
          title="Click để chọc Mèo hoặc gõ bàn phím để Mèo đập tay Bongo Cat!"
          style={{
            background:
              mood === 'angry' || mood === 'roasting'
                ? 'radial-gradient(circle at 50% 45%, rgba(244,63,94,0.28), rgba(15,23,42,0.95) 75%)'
                : mood === 'watching'
                ? 'radial-gradient(circle at 50% 45%, rgba(245,158,11,0.22), rgba(15,23,42,0.95) 75%)'
                : 'radial-gradient(circle at 50% 45%, rgba(56,189,248,0.18), rgba(15,23,42,0.95) 75%)',
          }}
          className="relative h-[250px] w-[260px] cursor-pointer overflow-hidden rounded-3xl border border-white/15 shadow-xl transition-transform hover:scale-[1.01] active:scale-95"
        />

        {/* Badge Combo Bongo Cat (Uncontrolled DOM update -> 0 React Re-renders) */}
        <span className="pointer-events-none absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-slate-900/90 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
          <Keyboard className="h-3 w-3" /> Bongo: <span ref={comboCounterRef}>0</span>
        </span>

        {/* Đồng hồ đo FPS trực tiếp */}
        <span className="pointer-events-none absolute bottom-4 right-2.5 flex items-center gap-1 rounded-full bg-slate-900/90 border border-white/10 px-2 py-0.5 text-[9px] font-mono text-emerald-400">
          <Gauge className="h-2.5 w-2.5" />
          <span ref={fpsCounterRef}>60 FPS</span>
        </span>

        {/* Gợi ý Chọc Mèo */}
        <span className="pointer-events-none absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-slate-900/90 border border-white/10 px-2.5 py-0.5 text-[10px] font-medium text-slate-300">
          <Hand className="h-3 w-3 text-amber-400" /> Chọc mèo
        </span>

        {/* Badge cảm xúc hiện tại */}
        <div className="absolute -bottom-2.5 flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-900 px-3 py-1 text-xs font-bold shadow-md">
          {mood === 'angry' || mood === 'roasting' ? (
            <span className="flex items-center text-rose-400">
              <Flame className="mr-1 h-3.5 w-3.5 fill-current" /> Đang cầm thước mắng
            </span>
          ) : mood === 'watching' ? (
            <span className="flex items-center text-amber-400">
              <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Đang soi màn hình
            </span>
          ) : (
            <span className="flex items-center text-sky-400">
              <Sparkles className="mr-1 h-3.5 w-3.5" /> Gõ phím cùng bạn
            </span>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm font-bold tracking-tight text-white">{characterName}</p>
    </div>
  );
});

'use client';

import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import * as THREE from 'three';
import Image from 'next/image';
import { createCatMaterials, type CatMaterialSet } from './CatMaterials';
import { buildProceduralLeoCat } from './CatProceduralMesh';
import { CatAnimator } from './CatAnimator';
import type { CatRig, CatActionState } from './CatRig';
import { getAccessoryForSlug } from './accessories';
import { useCatAudioLipSync } from './useCatAudioLipSync';
import {
  createDragRotationState,
  updateDragRotation,
  computeContactShadow,
  DRAG_ROTATION_BOUNDS,
  type DragRotationState,
} from './CatPhysics';
import { createCatParticleSystem, type CatParticleSystem } from './CatParticles';

interface CatCanvasProps {
  characterSlug: string;
  state: CatActionState;
  isSpeaking?: boolean;
  onPoke?: (region: string) => void;
  visualMode?: '3d_model' | '2d_leo';
  reducedMotion?: boolean;
  className?: string;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export const CatCanvas = memo(function CatCanvas({
  characterSlug,
  state,
  isSpeaking = false,
  onPoke,
  visualMode = '3d_model',
  reducedMotion = false,
  className = '',
  onCanvasReady,
}: CatCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animatorRef = useRef<CatAnimator | null>(null);
  const rigRef = useRef<CatRig | null>(null);
  const materialsRef = useRef<CatMaterialSet | null>(null);
  const particlesRef = useRef<CatParticleSystem | null>(null);
  const accessoryRef = useRef<THREE.Group | null>(null);
  const onPokeRef = useRef(onPoke);
  const characterSlugRef = useRef(characterSlug);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    onPokeRef.current = onPoke;
  }, [onPoke]);

  useEffect(() => {
    characterSlugRef.current = characterSlug;
  }, [characterSlug]);

  // Hook Lip-sync đồng bộ hàm jaw
  useCatAudioLipSync({
    isSpeaking,
    onJawOpenChange: useCallback((openness: number) => {
      animatorRef.current?.setJawOpen(openness);
    }, []),
  });

  // Cập nhật State cho animator mà không recreate WebGL Scene
  useEffect(() => {
    animatorRef.current?.setState(state);
  }, [state]);

  // Cập nhật Reduced Motion
  useEffect(() => {
    if (animatorRef.current) {
      animatorRef.current.reducedMotion = reducedMotion;
    }
  }, [reducedMotion]);

  // Khởi tạo Three.js Scene, Camera, Procedural Leo, Lighting, Shadow & Render loop
  // QUAN TRỌNG: Loại bỏ `state` và `reducedMotion` khỏi dependency array để chống recreate WebGL Context
  useEffect(() => {
    if (visualMode !== '3d_model') return;
    const container = containerRef.current;
    if (!container) return;

    // Kiểm tra hỗ trợ WebGL
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = 420;
    const height = 400;

    // 1. Scene & Camera (Góc perspective 3/4 trước ngồi hướng nhẹ về người dùng)
    const scene = new THREE.Scene();
    // Giữ nguyên không đặt scene.background để đảm bảo 100% trong suốt
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 30);
    camera.position.set(0, 0.52, 4.3);
    camera.lookAt(0, 0.45, 0);

    // 2. WebGLRenderer nền trong suốt (alpha: true, clearColor: 0x000000, 0)
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        premultipliedAlpha: true,
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0); // 100% Transparent
    renderer.domElement.style.background = 'transparent';
    renderer.domElement.style.maxWidth = '100%';
    renderer.domElement.style.height = 'auto';
    renderer.domElement.style.objectFit = 'contain';
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.setAttribute('aria-label', 'Nhân vật Mèo Leo giám thị Three.js nền trong suốt');

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    onCanvasReady?.(renderer.domElement);

    // 3. Studio Toon 3-Point Lighting
    // Warm Key Light (intensity 1.5, upper front-right)
    const keyLight = new THREE.DirectionalLight(0xfff4e6, 1.5);
    keyLight.position.set(3.0, 4.5, 4.0);
    scene.add(keyLight);

    // Cool Gentle Fill Light (intensity 0.65, soft cyan tint from lower front-left)
    const fillLight = new THREE.DirectionalLight(0xa5f3fc, 0.65);
    fillLight.position.set(-3.2, 1.5, 2.2);
    scene.add(fillLight);

    // Back / Rim Light (intensity 1.25, neon cyan toon rim from rear-top)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.25);
    rimLight.position.set(-3.5, 3.8, -3.2);
    scene.add(rimLight);

    // Soft Ambient
    const ambientLight = new THREE.AmbientLight(0xfffbeb, 0.75);
    scene.add(ambientLight);

    // 4. Dynamic Soft Contact Shadow Blob
    const shadowGeo = new THREE.PlaneGeometry(1.9, 1.4);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -0.68, 0.05);
    scene.add(shadowMesh);

    // 5. Materials & Dựng Procedural Leo Rig
    const materials = createCatMaterials();
    materialsRef.current = materials;

    const rig = buildProceduralLeoCat(materials);
    rigRef.current = rig;
    scene.add(rig.root);

    // 6. Zero-GC Pooled Particle VFX System
    const particles = createCatParticleSystem();
    particlesRef.current = particles;
    scene.add(particles.group);

    // Gắn phụ kiện ban đầu
    const initialAcc = getAccessoryForSlug(characterSlugRef.current, materials);
    if (initialAcc) {
      initialAcc.scale.setScalar(0.01);
      rig.accessoriesAnchor.add(initialAcc);
      accessoryRef.current = initialAcc;
    }

    // 7. Animator
    const animator = new CatAnimator(rig);
    animator.reducedMotion = reducedMotion;
    animator.setState(state);
    animator.onSpawnParticle = (type, count, origin) => {
      particles.spawn(type, count, origin);
    };
    animatorRef.current = animator;

    // 8. 3D Drag Rotation & Raycasting Pointer Controls
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2();
    const dragRotationState: DragRotationState = createDragRotationState();

    let isPointerDown = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let dragStartRotX = 0;
    let dragStartRotY = 0;
    let hasMovedSignificantly = false;

    const domElement = renderer.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      hasMovedSignificantly = false;
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      dragStartRotX = dragRotationState.rotX;
      dragStartRotY = dragRotationState.rotY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = domElement.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseNDC.set(ndcX, ndcY);
      animator.setMousePosition(ndcX, ndcY);

      // Check hover trên đầu mèo (cursor petting)
      raycaster.setFromCamera(mouseNDC, camera);
      const headHits = raycaster.intersectObject(rig.clickTargets.head, true);
      if (headHits.length > 0) {
        animator.triggerHeadPat();
      }

      if (isPointerDown) {
        const dx = e.clientX - pointerStartX;
        const dy = e.clientY - pointerStartY;
        if (!hasMovedSignificantly && Math.hypot(dx, dy) > 5) {
          hasMovedSignificantly = true;
          dragRotationState.isDragging = true;
        }

        if (dragRotationState.isDragging) {
          const targetYaw = dragStartRotY + (dx / rect.width) * (50 * Math.PI / 180);
          const targetPitch = dragStartRotX - (dy / rect.height) * (24 * Math.PI / 180);
          dragRotationState.rotY = THREE.MathUtils.clamp(
            targetYaw,
            -DRAG_ROTATION_BOUNDS.maxYaw,
            DRAG_ROTATION_BOUNDS.maxYaw
          );
          dragRotationState.rotX = THREE.MathUtils.clamp(
            targetPitch,
            -DRAG_ROTATION_BOUNDS.maxPitch,
            DRAG_ROTATION_BOUNDS.maxPitch
          );
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isPointerDown) {
        isPointerDown = false;
        dragRotationState.isDragging = false;

        // Nếu là click/tap thuần túy (không kéo xoay)
        if (!hasMovedSignificantly) {
          const rect = domElement.getBoundingClientRect();
          mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouseNDC.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

          raycaster.setFromCamera(mouseNDC, camera);
          const targets = [
            { obj: rig.clickTargets.belly, name: 'belly' },
            { obj: rig.clickTargets.head, name: 'head' },
            { obj: rig.clickTargets.pawL, name: 'paw' },
            { obj: rig.clickTargets.pawR, name: 'paw' },
            { obj: rig.clickTargets.tail, name: 'tail' },
          ];

          for (const t of targets) {
            const hits = raycaster.intersectObject(t.obj, true);
            if (hits.length > 0) {
              animator.triggerPoke(t.name as 'belly' | 'head' | 'paw' | 'tail');
              onPokeRef.current?.(t.name);
              break;
            }
          }
        }
      }
    };

    const handleWindowPointerUp = () => {
      if (isPointerDown) {
        isPointerDown = false;
        dragRotationState.isDragging = false;
      }
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointermove', handlePointerMove);
    domElement.addEventListener('pointerup', handlePointerUp);
    domElement.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('pointerup', handleWindowPointerUp);

    // 9. Quản lý Render Loop & Tạm dừng khi tab ẩn
    const clock = new THREE.Clock();
    let animFrameId: number;
    let isTabVisible = true;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        clock.getDelta(); // Tránh delta thời gian nhảy vọt
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      if (!isTabVisible) return;

      const delta = Math.min(clock.getDelta(), 0.05);

      // Cập nhật hoạt ảnh và động lực học
      animator.update(delta);

      // Cập nhật xoay kéo 3D và hồi vị lò xo
      updateDragRotation(dragRotationState, delta);
      rig.root.rotation.y = dragRotationState.rotY;
      rig.root.rotation.x = dragRotationState.rotX;

      // Cập nhật bóng tiếp xúc động (Dynamic Soft Contact Shadow)
      const catElevation = Math.max(0, rig.body.position.y - (-0.15));
      const shadowOpt = computeContactShadow(catElevation, [1.9, 1.4], 0.55);
      shadowMesh.scale.set(shadowOpt.scaleX / 1.9, 1, shadowOpt.scaleZ / 1.4);
      shadowMat.opacity = shadowOpt.opacity;
      shadowMesh.position.x = rig.body.position.x;
      shadowMesh.position.z = rig.body.position.z + 0.05;

      // Cập nhật VFX hạt
      particles.update(delta);

      // Scale-in mượt cho phụ kiện nếu có
      if (accessoryRef.current) {
        const curScale = accessoryRef.current.scale.x;
        if (curScale < 0.99) {
          const nextScale = THREE.MathUtils.lerp(curScale, 1.0, delta * 12);
          accessoryRef.current.scale.setScalar(nextScale);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Triệt để giải phóng tài nguyên WebGL khi unmount
    return () => {
      cancelAnimationFrame(animFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointermove', handlePointerMove);
      domElement.removeEventListener('pointerup', handlePointerUp);
      domElement.removeEventListener('pointercancel', handlePointerUp);

      particles.dispose();
      particlesRef.current = null;

      shadowTex.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();

      // Duyệt và dispose toàn bộ BufferGeometry và Material trong scene
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });

      materials.dispose();
      renderer.dispose();
      try {
        renderer.forceContextLoss();
      } catch {
        // ignore
      }

      if (domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }
      animatorRef.current = null;
      rigRef.current = null;
      materialsRef.current = null;
      accessoryRef.current = null;
    };
    // State and reducedMotion are updated imperatively to prevent destroying/recreating WebGL context
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCanvasReady, visualMode]);

  // Cập nhật Phụ kiện khi characterSlug thay đổi mà không hủy Scene
  useEffect(() => {
    const rig = rigRef.current;
    const materials = materialsRef.current;
    if (!rig || !materials) return;

    if (accessoryRef.current) {
      rig.accessoriesAnchor.remove(accessoryRef.current);
      accessoryRef.current = null;
    }

    const newAcc = getAccessoryForSlug(characterSlug, materials);
    if (newAcc) {
      newAcc.scale.setScalar(0.01); // Bắt đầu scale nhỏ để scale-in mượt
      rig.accessoriesAnchor.add(newAcc);
      accessoryRef.current = newAcc;
    }
  }, [characterSlug]);

  // Chế độ Fallback 2D nếu WebGL không hỗ trợ hoặc người dùng chọn 2D
  if (visualMode === '2d_leo' || !webglSupported) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center select-none cursor-pointer ${className}`}
        onClick={() => onPoke?.('belly')}
      >
        <div className="relative h-64 w-64 transition-transform hover:scale-105 active:scale-95">
          <Image
            src="/images/leo-turnaround.png"
            alt="Mèo Leo Giám Thị"
            fill
            className="object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
            priority
          />
        </div>
        <span className="mt-2 text-[11px] font-bold text-amber-300/80">
          (Chế độ Fallback 2D Mèo Leo)
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none bg-transparent ${className}`}
      style={{ background: 'transparent' }}
      title="Kéo chuột để xoay 3D, bấm vào bụng/đầu để trêu hoặc rê chuột để xoa đầu"
    />
  );
});

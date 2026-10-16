import * as THREE from 'three';

/**
 * Interface CatRig định nghĩa toàn bộ cấu trúc phân cấp (hierarchy) xương/khớp của Mèo Leo.
 * Thiết kế cho phép hoán đổi giữa Procedural Mesh (Sphere/Capsule) hoặc GLB Rig xương Morph Targets.
 */
export interface CatRig {
  // Root node
  root: THREE.Group;

  // Thân & Khung chính
  body: THREE.Group;
  chest: THREE.Group;
  belly: THREE.Group;
  neck: THREE.Group;

  // Đầu & Khuôn mặt
  head: THREE.Group;
  earL: THREE.Group;
  earR: THREE.Group;
  innerEarL?: THREE.Mesh;
  innerEarR?: THREE.Mesh;
  earTipL?: THREE.Group;
  earTipR?: THREE.Group;

  // Mắt & Lông mày
  eyeL: THREE.Group;
  eyeR: THREE.Group;
  pupilL: THREE.Mesh;
  pupilR: THREE.Mesh;
  highlightL?: THREE.Mesh;
  highlightR?: THREE.Mesh;
  upperEyelidL: THREE.Mesh;
  upperEyelidR: THREE.Mesh;
  browL: THREE.Group;
  browR: THREE.Group;

  // Mõm, Mũi, Miệng, Lưỡi, Râu, Bầu má
  muzzle: THREE.Group;
  cheekL: THREE.Mesh;
  cheekR: THREE.Mesh;
  nose: THREE.Mesh;
  jaw: THREE.Group;
  mouthInterior?: THREE.Mesh;
  tongue: THREE.Mesh;
  whiskersL: THREE.Group;
  whiskersR: THREE.Group;

  // Tay (chân trước)
  shoulderL: THREE.Group;
  shoulderR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  pawL: THREE.Group;
  pawR: THREE.Group;

  // Đuôi (chuỗi 6 đốt để uốn sóng tự nhiên)
  tailRoot: THREE.Group;
  tailSegments: THREE.Group[];
  tailTip: THREE.Mesh;

  // Khay phụ kiện theo tính cách
  accessoriesAnchor: THREE.Group;
  activeAccessory?: THREE.Group;

  // Vùng hit-test raycasting cho tương tác
  clickTargets: {
    belly: THREE.Object3D;
    head: THREE.Object3D;
    pawL: THREE.Object3D;
    pawR: THREE.Object3D;
    tail: THREE.Object3D;
  };
}

export type CatActionState =
  | 'idle'
  | 'focusing'
  | 'warning'
  | 'scolding_light'
  | 'scolding_medium'
  | 'scolding_extreme'
  | 'celebrating'
  | 'break'
  | 'poked';

export type VisemeType = 'closed' | 'a' | 'o' | 'ie' | 'smile' | 'scold_wide';

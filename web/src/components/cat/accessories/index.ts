import * as THREE from 'three';
import type { CatMaterialSet } from '../CatMaterials';

export interface AccessoryGroup extends THREE.Group {
  targetScale?: number;
  currentScale?: number;
}

/**
 * 1. Cô Giáo Chủ Nhiệm: Kính tròn gọng vàng (trên mắt) + Cà vạt đỏ (trước ngực)
 */
export function createTeacherAccessory(materials: CatMaterialSet): THREE.Group {
  const group = new THREE.Group();
  group.name = 'accessory_teacher';

  // Kính tròn gọng vàng (khớp với vị trí mắt Y: 0.52, Z: 0.81 relative to neck)
  const glassesGroup = new THREE.Group();
  glassesGroup.position.set(0, 0.52, 0.81);

  const rimGeo = new THREE.TorusGeometry(0.20, 0.022, 12, 28);
  const leftRim = new THREE.Mesh(rimGeo, materials.accessoryGold);
  leftRim.position.x = -0.34;
  const rightRim = new THREE.Mesh(rimGeo, materials.accessoryGold);
  rightRim.position.x = 0.34;

  const bridgeGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.24, 8);
  const bridge = new THREE.Mesh(bridgeGeo, materials.accessoryGold);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.y = 0.02;

  glassesGroup.add(leftRim, rightRim, bridge);

  // Cà vạt đỏ trước ngực
  const tieGroup = new THREE.Group();
  tieGroup.position.set(0, -0.15, 0.50);

  const knotGeo = new THREE.SphereGeometry(0.075, 12, 12);
  const knot = new THREE.Mesh(knotGeo, materials.accessoryRed);

  const tieBladeGeo = new THREE.ConeGeometry(0.13, 0.44, 4);
  const tieBlade = new THREE.Mesh(tieBladeGeo, materials.accessoryRed);
  tieBlade.rotation.x = Math.PI;
  tieBlade.rotation.y = Math.PI / 4;
  tieBlade.position.y = -0.22;

  tieGroup.add(knot, tieBlade);

  group.add(glassesGroup, tieGroup);
  return group;
}

/**
 * 2. Sếp Khó Tính: Cà vạt xanh công sở
 */
export function createBossAccessory(materials: CatMaterialSet): THREE.Group {
  const group = new THREE.Group();
  group.name = 'accessory_boss';

  const tieGroup = new THREE.Group();
  tieGroup.position.set(0, -0.15, 0.50);

  const knotGeo = new THREE.BoxGeometry(0.11, 0.09, 0.09);
  const knot = new THREE.Mesh(knotGeo, materials.accessoryBlue);

  const bladeGeo = new THREE.BoxGeometry(0.15, 0.46, 0.045);
  const blade = new THREE.Mesh(bladeGeo, materials.accessoryBlue);
  blade.position.y = -0.23;

  tieGroup.add(knot, blade);
  group.add(tieGroup);
  return group;
}

/**
 * 3. Tổng Tài Bá Đạo: Cổ áo vest đen nhỏ + Cà vạt
 */
export function createCeoAccessory(materials: CatMaterialSet): THREE.Group {
  const group = new THREE.Group();
  group.name = 'accessory_ceo';

  const collarGroup = new THREE.Group();
  collarGroup.position.set(0, -0.12, 0.50);

  const lapelGeo = new THREE.BoxGeometry(0.16, 0.35, 0.05);
  const leftLapel = new THREE.Mesh(lapelGeo, materials.accessoryBlack);
  leftLapel.position.set(-0.20, -0.09, 0.02);
  leftLapel.rotation.z = -0.25;

  const rightLapel = new THREE.Mesh(lapelGeo, materials.accessoryBlack);
  rightLapel.position.set(0.20, -0.09, 0.02);
  rightLapel.rotation.z = 0.25;

  const tieGeo = new THREE.BoxGeometry(0.09, 0.40, 0.035);
  const tie = new THREE.Mesh(tieGeo, materials.accessoryRed);
  tie.position.set(0, -0.14, 0.01);

  collarGroup.add(leftLapel, rightLapel, tie);
  group.add(collarGroup);
  return group;
}

/**
 * 4. Senpai Đanh Đá: Băng đô ruy băng trên đầu
 */
export function createTsundereAccessory(materials: CatMaterialSet): THREE.Group {
  const group = new THREE.Group();
  group.name = 'accessory_tsundere';

  const ribbonGroup = new THREE.Group();
  ribbonGroup.position.set(0, 1.05, 0.15);

  const bandGeo = new THREE.TorusGeometry(0.65, 0.035, 8, 24, Math.PI);
  const band = new THREE.Mesh(bandGeo, materials.accessoryRed);
  band.rotation.x = Math.PI / 2.2;

  const bowNode = new THREE.Group();
  bowNode.position.set(-0.48, 0.10, 0.12);

  const bowWingGeo = new THREE.ConeGeometry(0.11, 0.22, 6);
  const leftWing = new THREE.Mesh(bowWingGeo, materials.accessoryRed);
  leftWing.rotation.z = Math.PI / 2;
  const rightWing = new THREE.Mesh(bowWingGeo, materials.accessoryRed);
  rightWing.rotation.z = -Math.PI / 2;

  const centerSphere = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), materials.accessoryGold);

  bowNode.add(leftWing, rightWing, centerSphere);
  ribbonGroup.add(band, bowNode);
  group.add(ribbonGroup);
  return group;
}

/**
 * Factory lấy phụ kiện dựa theo slug tính cách
 */
export function getAccessoryForSlug(slug: string, materials: CatMaterialSet): THREE.Group | null {
  switch (slug) {
    case 'co-giao-chu-nhiem':
      return createTeacherAccessory(materials);
    case 'sep-kho-tinh':
      return createBossAccessory(materials);
    case 'tong-tai-ba-dao':
    case 'tong-tai-lanh-lung':
      return createCeoAccessory(materials);
    case 'senpai-danh-da':
    case 'anime-tsundere':
      return createTsundereAccessory(materials);
    default:
      return createTeacherAccessory(materials);
  }
}

import * as THREE from 'three';
import type { CatRig } from './CatRig';
import type { CatMaterialSet } from './CatMaterials';

/**
 * Tạo một lớp outline inverted hull nhẹ nhàng cho mesh
 */
function createOutlineMesh(geometry: THREE.BufferGeometry, outlineMaterial: THREE.Material, scaleOffset = 1.04): THREE.Mesh {
  const outlineMesh = new THREE.Mesh(geometry, outlineMaterial);
  outlineMesh.scale.setScalar(scaleOffset);
  outlineMesh.name = 'toon_outline';
  return outlineMesh;
}

/**
 * Xây dựng Mèo Leo hoàn toàn bằng hình khối thủ tục (Procedural Toon Meshes)
 * Tỉ lệ chibi chuẩn bám sát hình ảnh Leo: Cartoon Cat Turnaround.
 */
export function buildProceduralLeoCat(materials: CatMaterialSet): CatRig {
  const root = new THREE.Group();
  root.name = 'cat_leo_root';

  // 1. Root & Thân (Body) - Đặt tại vị trí đầm, vững
  const body = new THREE.Group();
  body.name = 'cat_body';
  body.position.set(0, -0.15, 0);
  root.add(body);

  // Thân chính (Hình bầu dục tròn mập mạp bám sát ảnh chibi Leo)
  const bodyGeo = new THREE.SphereGeometry(0.78, 24, 20);
  bodyGeo.scale(1.0, 1.08, 0.95);
  const bodyMesh = new THREE.Mesh(bodyGeo, materials.mainFur);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  body.add(bodyMesh);
  body.add(createOutlineMesh(bodyGeo, materials.outline, 1.04));

  // Vùng bụng & ngực màu kem (Cream marking)
  const belly = new THREE.Group();
  belly.name = 'cat_belly';
  const bellyGeo = new THREE.SphereGeometry(0.70, 20, 16);
  bellyGeo.scale(0.85, 0.98, 0.65);
  const bellyMesh = new THREE.Mesh(bellyGeo, materials.creamMarking);
  bellyMesh.position.set(0, -0.04, 0.38);
  belly.add(bellyMesh);
  body.add(belly);

  // Vằn tabby trên lưng (Tabby stripes on back)
  const stripeGeo = new THREE.TorusGeometry(0.76, 0.045, 8, 24, Math.PI * 0.7);
  for (let i = 0; i < 3; i++) {
    const stripe = new THREE.Mesh(stripeGeo, materials.tabbyStripe);
    stripe.rotation.x = Math.PI / 2 + 0.15;
    stripe.rotation.z = Math.PI * 0.15;
    stripe.position.set(0, 0.25 - i * 0.18, -0.2);
    body.add(stripe);
  }

  // Chest & Neck
  const chest = new THREE.Group();
  chest.name = 'cat_chest';
  chest.position.set(0, 0.32, 0.06);
  body.add(chest);

  const neck = new THREE.Group();
  neck.name = 'cat_neck';
  neck.position.set(0, 0.22, 0.04);
  chest.add(neck);

  // 2. Đầu (Head) - Đầu tròn to, má phúng phính (Chibi Leo ratio)
  const head = new THREE.Group();
  head.name = 'cat_head';
  head.position.set(0, 0.42, 0.05);
  neck.add(head);

  const headGeo = new THREE.SphereGeometry(0.85, 26, 22);
  headGeo.scale(1.18, 0.98, 1.05);
  const headMesh = new THREE.Mesh(headGeo, materials.mainFur);
  headMesh.castShadow = true;
  head.add(headMesh);
  head.add(createOutlineMesh(headGeo, materials.outline, 1.04));

  // Vằn tabby trán (3 vạch chữ M đặc trưng của mèo mướp Leo)
  const browStripeGeo = new THREE.BoxGeometry(0.05, 0.18, 0.025);
  const centerStripe = new THREE.Mesh(browStripeGeo, materials.tabbyStripe);
  centerStripe.position.set(0, 0.52, 0.78);
  centerStripe.rotation.x = -0.35;
  const leftStripe = new THREE.Mesh(browStripeGeo, materials.tabbyStripe);
  leftStripe.position.set(-0.14, 0.48, 0.76);
  leftStripe.rotation.set(-0.35, 0, 0.22);
  const rightStripe = new THREE.Mesh(browStripeGeo, materials.tabbyStripe);
  rightStripe.position.set(0.14, 0.48, 0.76);
  rightStripe.rotation.set(-0.35, 0, -0.22);
  head.add(centerStripe, leftStripe, rightStripe);

  // 3. Tai (Ears - Bo tròn góc, có lòng tai hồng san hô)
  const earL = new THREE.Group();
  earL.name = 'cat_ear_L';
  earL.position.set(-0.54, 0.62, 0.05);
  earL.rotation.set(0.1, 0, 0.35);

  const earGeo = new THREE.ConeGeometry(0.34, 0.52, 12);
  earGeo.scale(1.0, 1.0, 0.45);
  const earMeshL = new THREE.Mesh(earGeo, materials.mainFur);
  earL.add(earMeshL);
  earL.add(createOutlineMesh(earGeo, materials.outline, 1.05));

  const innerEarGeo = new THREE.ConeGeometry(0.24, 0.4, 10);
  innerEarGeo.scale(1.0, 1.0, 0.35);
  const innerEarL = new THREE.Mesh(innerEarGeo, materials.pinkInner);
  innerEarL.position.set(0, -0.04, 0.05);
  earL.add(innerEarL);

  const earTipL = new THREE.Group();
  earTipL.name = 'cat_ear_tip_L';
  earTipL.position.set(0, 0.26, 0);
  earL.add(earTipL);

  const earR = new THREE.Group();
  earR.name = 'cat_ear_R';
  earR.position.set(0.54, 0.62, 0.05);
  earR.rotation.set(0.1, 0, -0.35);

  const earMeshR = new THREE.Mesh(earGeo, materials.mainFur);
  earR.add(earMeshR);
  earR.add(createOutlineMesh(earGeo, materials.outline, 1.05));

  const innerEarR = new THREE.Mesh(innerEarGeo, materials.pinkInner);
  innerEarR.position.set(0, -0.04, 0.05);
  earR.add(innerEarR);

  const earTipR = new THREE.Group();
  earTipR.name = 'cat_ear_tip_R';
  earTipR.position.set(0, 0.26, 0);
  earR.add(earTipR);

  head.add(earL, earR);

  // 4. Mắt (Big Emerald Green Eyes bám sát ảnh Leo)
  const eyeL = new THREE.Group();
  eyeL.name = 'cat_eye_L';
  eyeL.position.set(-0.34, 0.1, 0.74);
  eyeL.rotation.set(-0.06, -0.24, 0);

  const eyeGeo = new THREE.SphereGeometry(0.22, 18, 18);
  eyeGeo.scale(1.0, 1.15, 0.45);
  const eyeMeshL = new THREE.Mesh(eyeGeo, materials.eyeGreen);
  eyeL.add(eyeMeshL);

  const pupilGeo = new THREE.SphereGeometry(0.12, 14, 14);
  pupilGeo.scale(0.85, 1.35, 0.2);
  const pupilL = new THREE.Mesh(pupilGeo, materials.eyePupil);
  pupilL.position.set(0.02, 0, 0.09);
  eyeL.add(pupilL);

  // Highlight trắng to lung linh
  const highlightGeo = new THREE.SphereGeometry(0.055, 10, 10);
  const highlightL = new THREE.Mesh(highlightGeo, materials.highlight);
  highlightL.position.set(0.05, 0.07, 0.11);
  eyeL.add(highlightL);

  // Mí mắt trên (dùng để chớp mắt)
  const eyelidGeo = new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  eyelidGeo.scale(1.04, 1.18, 0.5);
  const upperEyelidL = new THREE.Mesh(eyelidGeo, materials.mainFur);
  upperEyelidL.rotation.x = -Math.PI / 2;
  eyeL.add(upperEyelidL);

  // Mắt phải (Eye R)
  const eyeR = new THREE.Group();
  eyeR.name = 'cat_eye_R';
  eyeR.position.set(0.34, 0.1, 0.74);
  eyeR.rotation.set(-0.06, 0.24, 0);

  const eyeMeshR = new THREE.Mesh(eyeGeo, materials.eyeGreen);
  eyeR.add(eyeMeshR);

  const pupilR = new THREE.Mesh(pupilGeo, materials.eyePupil);
  pupilR.position.set(-0.02, 0, 0.09);
  eyeR.add(pupilR);

  const highlightR = new THREE.Mesh(highlightGeo, materials.highlight);
  highlightR.position.set(-0.02, 0.07, 0.11);
  eyeR.add(highlightR);

  const upperEyelidR = new THREE.Mesh(eyelidGeo, materials.mainFur);
  upperEyelidR.rotation.x = -Math.PI / 2;
  eyeR.add(upperEyelidR);

  head.add(eyeL, eyeR);

  // Lông mày nhỏ biểu cảm (Brows)
  const browL = new THREE.Group();
  browL.position.set(-0.32, 0.36, 0.78);
  const browGeo = new THREE.BoxGeometry(0.16, 0.035, 0.025);
  const browMeshL = new THREE.Mesh(browGeo, materials.tabbyStripe);
  browL.add(browMeshL);

  const browR = new THREE.Group();
  browR.position.set(0.32, 0.36, 0.78);
  const browMeshR = new THREE.Mesh(browGeo, materials.tabbyStripe);
  browR.add(browMeshR);

  head.add(browL, browR);

  // 5. Mõm màu kem (Muzzle hình chữ ω đáng yêu) + Mũi hồng
  const muzzle = new THREE.Group();
  muzzle.name = 'cat_muzzle';
  muzzle.position.set(0, -0.16, 0.74);
  head.add(muzzle);

  // 2 bầu má hình hạt dưa kem (chữ ω)
  const cheekGeo = new THREE.SphereGeometry(0.22, 16, 14);
  cheekGeo.scale(1.15, 0.9, 0.8);
  const leftCheek = new THREE.Mesh(cheekGeo, materials.creamMarking);
  leftCheek.position.set(-0.15, 0, 0.07);
  const rightCheek = new THREE.Mesh(cheekGeo, materials.creamMarking);
  rightCheek.position.set(0.15, 0, 0.07);

  muzzle.add(leftCheek, rightCheek);

  // Mũi nhỏ hình tam giác màu hồng san hô
  const noseGeo = new THREE.ConeGeometry(0.075, 0.075, 3);
  noseGeo.scale(1.1, 0.8, 0.6);
  const nose = new THREE.Mesh(noseGeo, materials.pinkInner);
  nose.rotation.x = Math.PI;
  nose.position.set(0, 0.1, 0.2);
  muzzle.add(nose);

  // Hàm & Miệng nhép (Jaw, Chin, Tongue & Mouth Interior)
  const jaw = new THREE.Group();
  jaw.name = 'cat_jaw';
  jaw.position.set(0, -0.10, 0.06);
  muzzle.add(jaw);

  // Cằm màu kem (gắn vào hàm dưới để hạ xuống rõ ràng khi há miệng)
  const chinGeo = new THREE.SphereGeometry(0.16, 14, 12);
  chinGeo.scale(1.0, 0.75, 0.7);
  const chinMesh = new THREE.Mesh(chinGeo, materials.creamMarking);
  chinMesh.position.set(0, -0.06, 0.04);
  jaw.add(chinMesh);

  // Khoang miệng (hồng sẫm bên trong)
  const mouthInteriorGeo = new THREE.SphereGeometry(0.14, 12, 10);
  mouthInteriorGeo.scale(0.9, 0.8, 0.5);
  const mouthInterior = new THREE.Mesh(mouthInteriorGeo, materials.mouthInterior);
  mouthInterior.position.set(0, 0.01, 0.02);
  jaw.add(mouthInterior);

  // Lưỡi hồng tươi
  const tongueGeo = new THREE.SphereGeometry(0.08, 10, 8);
  tongueGeo.scale(1.0, 0.45, 1.2);
  const tongue = new THREE.Mesh(tongueGeo, materials.pinkTongue);
  tongue.position.set(0, -0.02, 0.08);
  jaw.add(tongue);

  // Râu mèo trắng mảnh (3 râu mỗi bên má)
  const whiskersL = new THREE.Group();
  whiskersL.position.set(-0.3, 0.02, 0.14);
  const whiskerGeo = new THREE.CylinderGeometry(0.007, 0.003, 0.38, 6);
  whiskerGeo.rotateZ(Math.PI / 2);

  for (let i = 0; i < 3; i++) {
    const w = new THREE.Mesh(whiskerGeo, materials.whiskers);
    w.position.set(-0.14, (i - 1) * 0.045, 0);
    w.rotation.z = (i - 1) * 0.15;
    whiskersL.add(w);
  }

  const whiskersR = new THREE.Group();
  whiskersR.position.set(0.3, 0.02, 0.14);
  for (let i = 0; i < 3; i++) {
    const w = new THREE.Mesh(whiskerGeo, materials.whiskers);
    w.position.set(0.14, (i - 1) * 0.045, 0);
    w.rotation.z = -(i - 1) * 0.15;
    whiskersR.add(w);
  }
  muzzle.add(whiskersL, whiskersR);

  // 6. Tay / Chân trước (Arms & Paws - Chân thon gọn với bàn chân kem tròn xoe đặt vững)
  const shoulderL = new THREE.Group();
  shoulderL.name = 'cat_shoulder_L';
  shoulderL.position.set(-0.42, 0.16, 0.25);
  body.add(shoulderL);

  const armL = new THREE.Group();
  armL.name = 'cat_arm_L';
  shoulderL.add(armL);

  const legGeo = new THREE.CylinderGeometry(0.14, 0.17, 0.5, 14);
  const legMeshL = new THREE.Mesh(legGeo, materials.mainFur);
  legMeshL.position.set(0, -0.2, 0);
  armL.add(legMeshL);
  armL.add(createOutlineMesh(legGeo, materials.outline, 1.05));

  const pawL = new THREE.Group();
  pawL.name = 'cat_paw_L';
  pawL.position.set(0, -0.45, 0.08);
  armL.add(pawL);

  const pawGeo = new THREE.SphereGeometry(0.19, 14, 12);
  pawGeo.scale(1.0, 0.65, 1.25);
  const pawMeshL = new THREE.Mesh(pawGeo, materials.creamMarking);
  pawL.add(pawMeshL);

  // Tay phải (Arm R)
  const shoulderR = new THREE.Group();
  shoulderR.name = 'cat_shoulder_R';
  shoulderR.position.set(0.42, 0.16, 0.25);
  body.add(shoulderR);

  const armR = new THREE.Group();
  armR.name = 'cat_arm_R';
  shoulderR.add(armR);

  const legMeshR = new THREE.Mesh(legGeo, materials.mainFur);
  legMeshR.position.set(0, -0.2, 0);
  armR.add(legMeshR);
  armR.add(createOutlineMesh(legGeo, materials.outline, 1.05));

  const pawR = new THREE.Group();
  pawR.name = 'cat_paw_R';
  pawR.position.set(0, -0.45, 0.08);
  armR.add(pawR);

  const pawMeshR = new THREE.Mesh(pawGeo, materials.creamMarking);
  pawR.add(pawMeshR);

  // 7. Đuôi dài cong có chóp kem (Tail - 6 đốt khớp uốn lượn nhịp nhàng)
  const tailRoot = new THREE.Group();
  tailRoot.name = 'cat_tail_root';
  tailRoot.position.set(0, -0.35, -0.65);
  tailRoot.rotation.x = -0.35;
  body.add(tailRoot);

  const tailSegments: THREE.Group[] = [];
  let currentParent: THREE.Group = tailRoot;

  const segmentLength = 0.22;
  const numSegments = 6;

  for (let i = 0; i < numSegments; i++) {
    const seg = new THREE.Group();
    seg.name = `cat_tail_seg_${i}`;
    seg.position.set(0, 0, -segmentLength);
    currentParent.add(seg);
    tailSegments.push(seg);

    const radiusTop = 0.11 - i * 0.01;
    const radiusBottom = 0.12 - i * 0.01;
    const segGeo = new THREE.CylinderGeometry(radiusTop, radiusBottom, segmentLength, 12);
    segGeo.rotateX(Math.PI / 2);

    const segMat = i >= numSegments - 2 ? materials.creamMarking : (i % 2 === 1 ? materials.tabbyStripe : materials.mainFur);
    const segMesh = new THREE.Mesh(segGeo, segMat);
    seg.add(segMesh);

    currentParent = seg;
  }

  const tipGeo = new THREE.SphereGeometry(0.075, 12, 10);
  const tailTip = new THREE.Mesh(tipGeo, materials.creamMarking);
  tailTip.position.set(0, 0, -segmentLength * 0.6);
  currentParent.add(tailTip);

  // 8. Neo gắn phụ kiện (Accessories Anchor)
  const accessoriesAnchor = new THREE.Group();
  accessoriesAnchor.name = 'accessories_anchor';
  neck.add(accessoriesAnchor);

  // 9. Vùng bắt tương tác Raycast Hit-test
  const clickTargets = {
    belly: bellyMesh,
    head: headMesh,
    pawL: pawMeshL,
    pawR: pawMeshR,
    tail: tailRoot,
  };

  return {
    root,
    body,
    chest,
    belly,
    neck,
    head,
    earL,
    earR,
    innerEarL,
    innerEarR,
    earTipL,
    earTipR,
    eyeL,
    eyeR,
    pupilL,
    pupilR,
    highlightL,
    highlightR,
    upperEyelidL,
    upperEyelidR,
    browL,
    browR,
    muzzle,
    cheekL: leftCheek,
    cheekR: rightCheek,
    nose,
    jaw,
    mouthInterior,
    tongue,
    whiskersL,
    whiskersR,
    shoulderL,
    shoulderR,
    armL,
    armR,
    pawL,
    pawR,
    tailRoot,
    tailSegments,
    tailTip,
    accessoriesAnchor,
    clickTargets,
  };
}

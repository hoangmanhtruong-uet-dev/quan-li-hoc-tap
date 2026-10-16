import * as THREE from 'three';

/**
 * Bảng màu chuẩn từ nhân vật Leo: Cartoon Cat Turnaround
 */
export const LEO_PALETTE = {
  furOrange: 0xf97316,       // Cam ấm đặc trưng của Leo
  furTabbyStripe: 0x9a3412,  // Vằn tabby cam nâu sẫm trên trán, lưng và đuôi
  creamBellyMuzzle: 0xfef3c7,// Kem sáng ở mõm, ngực, bụng, đệm chân và chóp đuôi
  eyeGreen: 0x22c55e,        // Mắt to xanh lá sáng
  eyeIrisDark: 0x15803d,     // Xanh lá đậm viền mống mắt
  pupilBlack: 0x0f172a,      // Đồng tử đen
  highlightWhite: 0xffffff,  // Đốm sáng trắng trong mắt
  pinkNose: 0xfb7185,        // Mũi và lòng tai hồng san hô
  pinkTongue: 0xf43f5e,      // Lưỡi hồng tươi
  whiskerWhite: 0xffffff,    // Râu trắng mảnh
  outlineDarkBrown: 0x7c2d12,// Đường viền Toon outline nâu cam đậm
  shadowBlob: 0x000000,      // Bóng đổ blob mềm
};

/**
 * Tạo một DataTexture dốc 4 bậc độ sáng cho Cel/Toon shading
 */
function createToonGradientTexture(): THREE.DataTexture {
  const format = THREE.RGBAFormat;
  const size = 4;
  const data = new Uint8Array(size * 4);

  // 4 bậc sáng cel-shading rõ rệt: Tối -> Bóng trung -> Nửa sáng -> Sáng
  const levels = [85, 145, 205, 255];
  for (let i = 0; i < size; i++) {
    const val = levels[i]!;
    data[i * 4] = val;
    data[i * 4 + 1] = val;
    data[i * 4 + 2] = val;
    data[i * 4 + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, size, 1, format);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

export interface CatMaterialSet {
  gradientMap: THREE.DataTexture;
  mainFur: THREE.MeshToonMaterial;
  tabbyStripe: THREE.MeshToonMaterial;
  creamMarking: THREE.MeshToonMaterial;
  pinkInner: THREE.MeshToonMaterial;
  eyeWhite: THREE.MeshBasicMaterial;
  eyeGreen: THREE.MeshBasicMaterial;
  eyePupil: THREE.MeshBasicMaterial;
  highlight: THREE.MeshBasicMaterial;
  pinkTongue: THREE.MeshToonMaterial;
  mouthInterior: THREE.MeshBasicMaterial;
  whiskers: THREE.MeshBasicMaterial;
  outline: THREE.MeshBasicMaterial;
  blobShadow: THREE.MeshBasicMaterial;
  accessoryGold: THREE.MeshToonMaterial;
  accessoryRed: THREE.MeshToonMaterial;
  accessoryBlack: THREE.MeshToonMaterial;
  accessoryBlue: THREE.MeshToonMaterial;
  dispose: () => void;
}

export function createCatMaterials(customFurColor?: string): CatMaterialSet {
  const gradientMap = createToonGradientTexture();

  const furColor = customFurColor ? new THREE.Color(customFurColor) : new THREE.Color(LEO_PALETTE.furOrange);

  const mainFur = new THREE.MeshToonMaterial({
    color: furColor,
    gradientMap,
  });

  const tabbyStripe = new THREE.MeshToonMaterial({
    color: LEO_PALETTE.furTabbyStripe,
    gradientMap,
  });

  const creamMarking = new THREE.MeshToonMaterial({
    color: LEO_PALETTE.creamBellyMuzzle,
    gradientMap,
  });

  const pinkInner = new THREE.MeshToonMaterial({
    color: LEO_PALETTE.pinkNose,
    gradientMap,
  });

  const eyeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyeGreen = new THREE.MeshBasicMaterial({ color: LEO_PALETTE.eyeGreen });
  const eyePupil = new THREE.MeshBasicMaterial({ color: LEO_PALETTE.pupilBlack });
  const highlight = new THREE.MeshBasicMaterial({ color: LEO_PALETTE.highlightWhite });

  const pinkTongue = new THREE.MeshToonMaterial({
    color: LEO_PALETTE.pinkTongue,
    gradientMap,
  });

  const mouthInterior = new THREE.MeshBasicMaterial({ color: 0x881337 });

  const whiskers = new THREE.MeshBasicMaterial({
    color: LEO_PALETTE.whiskerWhite,
  });

  // Toon inverted hull outline material
  const outline = new THREE.MeshBasicMaterial({
    color: LEO_PALETTE.outlineDarkBrown,
    side: THREE.BackSide,
  });

  // Shadow blob mờ dưới chân
  const blobShadow = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });

  // Vật liệu phụ kiện cho các nhân cách
  const accessoryGold = new THREE.MeshToonMaterial({ color: 0xf59e0b, gradientMap });
  const accessoryRed = new THREE.MeshToonMaterial({ color: 0xe11d48, gradientMap });
  const accessoryBlack = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap });
  const accessoryBlue = new THREE.MeshToonMaterial({ color: 0x2563eb, gradientMap });

  const dispose = () => {
    gradientMap.dispose();
    mainFur.dispose();
    tabbyStripe.dispose();
    creamMarking.dispose();
    pinkInner.dispose();
    eyeWhite.dispose();
    eyeGreen.dispose();
    eyePupil.dispose();
    highlight.dispose();
    pinkTongue.dispose();
    mouthInterior.dispose();
    whiskers.dispose();
    outline.dispose();
    blobShadow.dispose();
    accessoryGold.dispose();
    accessoryRed.dispose();
    accessoryBlack.dispose();
    accessoryBlue.dispose();
  };

  return {
    gradientMap,
    mainFur,
    tabbyStripe,
    creamMarking,
    pinkInner,
    eyeWhite,
    eyeGreen,
    eyePupil,
    highlight,
    pinkTongue,
    mouthInterior,
    whiskers,
    outline,
    blobShadow,
    accessoryGold,
    accessoryRed,
    accessoryBlack,
    accessoryBlue,
    dispose,
  };
}

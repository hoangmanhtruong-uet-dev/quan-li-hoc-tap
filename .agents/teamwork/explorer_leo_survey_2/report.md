# BÁO CÁO KHẢO SÁT CHUYÊN SÂU: GIẢI PHẪU NHÂN VẬT 3D MÈO LEO, HỆ THỐNG MESH HIERARCHY, VẬT LIỆU TOON VÀ ĐỘNG LỰC HỌC HOẠT HÌNH (PHYSICS & ANIMATION ENGINE)

- **Người thực hiện:** `explorer_leo_survey_2` (Teamwork Explorer)
- **Dự án:** CampusOS Web (`d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`)
- **Ngày khảo sát:** 2026-10-13 (UTC)
- **Mục tiêu:** Khảo sát toàn diện mã nguồn hiện tại của Mèo Leo Three.js, cấu trúc cây phân cấp (rig/mesh), cơ chế hoạt họa tick hiện hữu, và thiết kế chi tiết kiến trúc tích hợp: dao động lò xo suy giảm (damped spring), Squash & Stretch bảo toàn thể tích, uốn sóng đuôi 6 đốt đa tần số, micro-saccades nhãn cầu, máy trạng thái rảnh rỗi (idle state machine), và ổn định số học 120FPS.

---

## 1. TỔNG QUAN HỆ THỐNG MÈO LEO 3D TRONG CAMPUSOS

### 1.1 Vị trí và Vai trò của Mèo Leo
Trong CampusOS, Mèo Leo là nhân vật đại diện (mascot) giám sát phiên Pomodoro tại `src/features/pomodoro/strict-pomodoro-modal.tsx`. Người dùng có thể chọn giữa:
1. **Chế độ 3D Three.js (`visualMode: '3d_model'`):** Sử dụng `<CatCanvas>` (`src/components/cat/CatCanvas.tsx`), render thời gian thực chú Mèo Leo toon 3D hoàn toàn trong suốt (`alpha: true`), có khả năng tương tác chuột (xoa đầu, chọc bụng, liếc nhìn chuột), cử động nhép môi đồng bộ Web Audio TTS giọng Bắc, và thay đổi phụ kiện theo tính cách (`characterSlug`).
2. **Chế độ 2D Fallback (`visualMode: '2d_leo'`):** Sử dụng `<MemeCatStage>` hoặc ảnh minh họa tĩnh (`/images/leo-turnaround.png`).

### 1.2 Danh mục các tệp cốt lõi liên quan
| Đường dẫn tệp | Vai trò kiến trúc | Tình trạng hiện tại |
|---|---|---|
| `src/components/cat/CatRig.ts` | Interface định nghĩa khung xương và phân cấp nhóm (Node Hierarchy) của Leo | Đã có các group chính (body, head, eyes, jaw, paws, tail 6-segments), nhưng thiếu hook riêng cho 2 má (`cheekL`, `cheekR`) và khớp chóp tai (`earTipL`, `earTipR`). |
| `src/components/cat/CatProceduralMesh.ts` | Hàm `buildProceduralLeoCat()` tạo toàn bộ hình khối procedural Three.js và lớp viền Inverted Hull Toon Outline | Dựng đầy đủ hình khối chibi Leo bám sát `leo-turnaround.png`, nhưng má (`leftCheek`, `rightCheek`) chưa được gán vào `CatRig`. |
| `src/components/cat/CatMaterials.ts` | Bảng màu `LEO_PALETTE`, tạo `DataTexture` 4 bậc cel-shading và các bộ `MeshToonMaterial` | Đã có cel-shading dốc 4 bậc cho lông cam, vằn nâu, má kem, mắt xanh lục, mũi hồng; cần bổ sung/hiệu chỉnh cho hệ thống 3-point rim lighting. |
| `src/components/cat/CatAnimator.ts` | Bộ điều khiển chuyển động thời gian thực (`update(delta)`): thở, chớp mắt, nhép miệng, uốn đuôi, biểu cảm | Hiện tại dùng hàm sin/cos đơn giản, chưa có vật lý lò xo (jiggle springs), chưa có Squash & Stretch bảo toàn thể tích, đuôi chỉ có 1 tần số sin, mắt chưa có micro-saccades, chưa có idle state machine. |
| `src/components/cat/CatCanvas.tsx` | Component React quản lý Three.js Scene, Camera, Renderer, vòng lặp RAF, Raycasting tương tác chuột và dọn dẹp bộ nhớ | Nền trong suốt 100%, có ambient + key + rim light và blob shadow canvas; cần nâng cấp ánh sáng 3 điểm toon chuẩn, bóng mềm co giãn theo Y, chuột kéo xoay góc nhìn đàn hồi, và hệ thống hạt VFX. |
| `src/components/cat/CatStateMachine.ts` | Ánh xạ ngữ cảnh Pomodoro (`PomodoroCatContext`) sang trạng thái cảm xúc (`CatActionState`) | Hoạt động tốt với 9 trạng thái: `idle`, `focusing`, `warning`, `scolding_light`, `scolding_medium`, `scolding_extreme`, `celebrating`, `break`, `poked`. Đạt 100% test `tests/pomodoro-leo.test.ts`. |
| `src/components/cat/useCatAudioLipSync.ts` | Hook nhận tín hiệu RMS biên độ âm thanh từ `pomodoroAudio.getMouthOpenness()` và truyền độ mở cằm `setJawOpen` | Đồng bộ 60-120FPS mượt mà vào `CatAnimator.updateJaw()`. |
| `src/components/cat/accessories/index.ts` | Tạo phụ kiện đặc trưng (Kính cô giáo + cà vạt đỏ, Cà vạt xanh sếp, Cổ áo vest tổng tài, Băng đô senpai) | Tự động scale-in mượt và gắn vào `accessoriesAnchor`. |

---

## 2. GIẢI PHẪU CHI TIẾT NHÂN VẬT & MESH HIERARCHY TRONG CODE

### 2.1 Cây phân cấp đối tượng (Scene Graph Hierarchy)
Trong `CatProceduralMesh.ts`, cây phân cấp đối tượng Three.js được thiết lập như sau:

```
root (THREE.Group: 'cat_leo_root')
└── body (THREE.Group: 'cat_body', pos: [0, -0.15, 0])
    ├── bodyMesh (Mesh: SphereGeometry scaled [1.0, 1.08, 0.95], mat: mainFur)
    ├── toon_outline (Mesh: Inverted Hull scale 1.04, mat: outline)
    ├── belly (THREE.Group: 'cat_belly')
    │   └── bellyMesh (Mesh: SphereGeometry scaled [0.85, 0.98, 0.65], mat: creamMarking, pos: [0, -0.04, 0.38])
    ├── backStripes [0..2] (Meshes: TorusGeometry x 3, mat: tabbyStripe)
    ├── chest (THREE.Group: 'cat_chest', pos: [0, 0.32, 0.06])
    │   └── neck (THREE.Group: 'cat_neck', pos: [0, 0.22, 0.04])
    │       ├── head (THREE.Group: 'cat_head', pos: [0, 0.42, 0.05])
    │       │   ├── headMesh (Mesh: SphereGeometry scaled [1.18, 0.98, 1.05], mat: mainFur)
    │       │   ├── toon_outline (Mesh: Inverted Hull scale 1.04)
    │       │   ├── browStripes (3 vạch chữ M trên trán, mat: tabbyStripe)
    │       │   ├── earL (Group: pos: [-0.54, 0.62, 0.05], rot: [0.1, 0, 0.35])
    │       │   │   ├── earMeshL (ConeGeometry scaled [1.0, 1.0, 0.45], mat: mainFur + outline)
    │       │   │   └── innerEarL (ConeGeometry, mat: pinkInner, pos: [0, -0.04, 0.05])
    │       │   ├── earR (Group: pos: [0.54, 0.62, 0.05], rot: [0.1, 0, -0.35])
    │       │   │   ├── earMeshR (ConeGeometry scaled [1.0, 1.0, 0.45], mat: mainFur + outline)
    │       │   │   └── innerEarR (ConeGeometry, mat: pinkInner, pos: [0, -0.04, 0.05])
    │       │   ├── eyeL (Group: pos: [-0.34, 0.1, 0.74], rot: [-0.06, -0.24, 0])
    │       │   │   ├── eyeMeshL (SphereGeometry scaled [1.0, 1.15, 0.45], mat: eyeGreen)
    │       │   │   ├── pupilL (SphereGeometry scaled [0.85, 1.35, 0.2], mat: eyePupil, pos: [0.02, 0, 0.09])
    │       │   │   ├── highlightL (SphereGeometry 0.055, mat: highlight, pos: [0.05, 0.07, 0.11])
    │       │   │   └── upperEyelidL (SphereGeometry hemisphere, mat: mainFur, rot.x: -PI/2)
    │       │   ├── eyeR (Group: pos: [0.34, 0.1, 0.74], rot: [-0.06, 0.24, 0])
    │       │   │   ├── eyeMeshR (SphereGeometry scaled [1.0, 1.15, 0.45], mat: eyeGreen)
    │       │   │   ├── pupilR (SphereGeometry scaled [0.85, 1.35, 0.2], mat: eyePupil, pos: [-0.02, 0, 0.09])
    │       │   │   ├── highlightR (SphereGeometry 0.055, mat: highlight, pos: [-0.02, 0.07, 0.11])
    │       │   │   └── upperEyelidR (SphereGeometry hemisphere, mat: mainFur, rot.x: -PI/2)
    │       │   ├── browL (Group: pos: [-0.32, 0.36, 0.78], BoxGeometry, mat: tabbyStripe)
    │       │   ├── browR (Group: pos: [0.32, 0.36, 0.78], BoxGeometry, mat: tabbyStripe)
    │       │   └── muzzle (THREE.Group: 'cat_muzzle', pos: [0, -0.16, 0.74])
    │       │       ├── leftCheek (Mesh: SphereGeometry scaled [1.15, 0.9, 0.8], pos: [-0.15, 0, 0.07], mat: creamMarking)
    │       │       ├── rightCheek (Mesh: SphereGeometry scaled [1.15, 0.9, 0.8], pos: [0.15, 0, 0.07], mat: creamMarking)
    │       │       ├── nose (Mesh: ConeGeometry, mat: pinkInner, rot.x: PI, pos: [0, 0.1, 0.2])
    │       │       ├── jaw (THREE.Group: 'cat_jaw', pos: [0, -0.10, 0.06])
    │       │       │   ├── chinMesh (Mesh: SphereGeometry scaled [1.0, 0.75, 0.7], mat: creamMarking, pos: [0, -0.06, 0.04])
    │       │       │   ├── mouthInterior (Mesh: SphereGeometry, mat: mouthInterior, pos: [0, 0.01, 0.02])
    │       │       │   └── tongue (Mesh: SphereGeometry scaled [1.0, 0.45, 1.2], mat: pinkTongue, pos: [0, -0.02, 0.08])
    │       │       ├── whiskersL (Group: pos: [-0.3, 0.02, 0.14], 3 x CylinderGeometry)
    │       │       └── whiskersR (Group: pos: [0.3, 0.02, 0.14], 3 x CylinderGeometry)
    │       └── accessoriesAnchor (THREE.Group: 'accessories_anchor')
    │           └── [activeAccessory: Kính, Cà vạt, Cổ áo vest, hoặc Băng đô]
    ├── shoulderL (THREE.Group: 'cat_shoulder_L', pos: [-0.42, 0.16, 0.25])
    │   └── armL (THREE.Group: 'cat_arm_L')
    │       ├── legMeshL (CylinderGeometry, mat: mainFur + outline, pos: [0, -0.2, 0])
    │       └── pawL (THREE.Group: 'cat_paw_L', pos: [0, -0.45, 0.08])
    │           └── pawMeshL (SphereGeometry scaled [1.0, 0.65, 1.25], mat: creamMarking)
    ├── shoulderR (THREE.Group: 'cat_shoulder_R', pos: [0.42, 0.16, 0.25])
    │   └── armR (THREE.Group: 'cat_arm_R')
    │       ├── legMeshR (CylinderGeometry, mat: mainFur + outline, pos: [0, -0.2, 0])
    │       └── pawR (THREE.Group: 'cat_paw_R', pos: [0, -0.45, 0.08])
    │           └── pawMeshR (SphereGeometry scaled [1.0, 0.65, 1.25], mat: creamMarking)
    └── tailRoot (THREE.Group: 'cat_tail_root', pos: [0, -0.35, -0.65], rot.x: -0.35)
        └── tail_seg_0 (Group: pos: [0, 0, -0.22], CylinderGeometry)
            └── tail_seg_1 (Group: pos: [0, 0, -0.22], CylinderGeometry)
                └── tail_seg_2 (Group: pos: [0, 0, -0.22], CylinderGeometry)
                    └── tail_seg_3 (Group: pos: [0, 0, -0.22], CylinderGeometry)
                        └── tail_seg_4 (Group: pos: [0, 0, -0.22], CylinderGeometry)
                            └── tail_seg_5 (Group: pos: [0, 0, -0.22], CylinderGeometry)
                                └── tailTip (Mesh: SphereGeometry 0.075, pos: [0, 0, -0.132], mat: creamMarking)
```

### 2.2 Điểm khuyết thiếu hiện tại trong Mesh Hierarchy
1. **Thiếu node má trong `CatRig`:**
   - Trong `CatProceduralMesh.ts:204-207`, hai bầu má `leftCheek` và `rightCheek` được tạo dưới dạng biến cục bộ và gán trực tiếp vào `muzzle`.
   - Trong `CatRig.ts:37-44`, interface `CatRig` không có `cheekL` và `cheekR`. Do đó, `CatAnimator` hiện không thể can thiệp riêng rẽ vào vị trí/tỷ lệ của má để tạo hiệu ứng phúng phính nảy lò xo khi quay đầu hay khi bị chọc.
   - **Giải pháp:** Cần mở rộng `CatRig` với `cheekL: THREE.Mesh` (hoặc `THREE.Group`), `cheekR: THREE.Mesh` và đưa vào đối tượng trả về của `buildProceduralLeoCat`.
2. **Khớp tai và Chóp tai:**
   - Hiện tại mỗi tai là một hình nón đơn `ConeGeometry(0.34, 0.52, 12)` gắn vào `earL` / `earR`.
   - Để tạo chuyển động rung chóp tai (ear tip jiggle): có thể mô hình hóa rung lò xo góc (angular harmonic oscillator) ngay tại `earL.rotation` và `earR.rotation` với tần số cao (8-12Hz) kèm độ trễ quán tính theo gia tốc quay của đầu, hoặc tách phần chóp tai thành `earTipL` / `earTipR`. Giải pháp lò xo góc tại gốc tai + dao động thứ cấp là tối ưu nhất vì không làm tăng số lượng polygon/draw call mà vẫn đạt độ uốn mềm mại chuẩn Disney.

---

## 3. KHẢO SÁT CHU KỲ HOẠT HỌA TICK HIỆN TẠI (`CatAnimator.ts`)

### 3.1 Nhịp thở (Breathing)
- **Vị trí code:** `CatAnimator.ts:207-250` (`updateBreathingAndTail`).
- **Logic hiện tại:**
  ```ts
  const breathCycle = Math.sin(this.time * breathSpeed);
  const bellyScaleZ = 1.0 + breathCycle * breathScale;
  this.rig.belly.scale.set(1.0 + breathCycle * (breathScale * 0.5), 1.0, bellyScaleZ);
  ```
- **Hạn chế:**
  - Chỉ biến đổi cục bộ `rig.belly.scale` theo trục Z và X.
  - Thân chính (`rig.body`) và ngực (`rig.chest`) hoàn toàn đứng yên.
  - **Không có Squash & Stretch**: Trục Y không co giãn tương ứng, vi phạm nguyên lý bảo toàn thể tích ($S_x \cdot S_y \cdot S_z \approx 1$). Chuyển động thở nhìn phẳng và thiếu sức sống của phim hoạt hình 3D.

### 3.2 Chớp mắt (Blinking)
- **Vị trí code:** `CatAnimator.ts:127-175` (`updateBlinking`).
- **Logic hiện tại:**
  - Timer ngẫu nhiên từ 2.0s đến 6.5s.
  - Khi kích hoạt: dùng `Math.sin(blinkProgress * Math.PI)` để xoay mí trên `upperEyelidL/R.rotation.x` từ $-\pi/2$ về $0$ rồi mở lại. Hỗ trợ double-blink (25% xác suất).
- **Hạn chế:**
  - Đồng tử (`pupilL`, `pupilR`) chỉ di chuyển tuyến tính theo chuột (`mouseNDC * 0.04`), hoàn toàn đứng yên khi chuột không di chuyển.
  - **Thiếu Micro-saccades**: Mắt sinh vật sống luôn có những cú giật siêu nhỏ (10-30ms) thăm dò xung quanh ngay cả khi đang tập trung nhìn một điểm.
  - **Thiếu co giãn đồng tử (Pupil Dilation)**: Mắt mèo thật co giãn rất mạnh theo cảm xúc (trợn tròn to khi tò mò/thích thú, thu nhỏ thành khe hẹp khi giận dữ/phán xét).

### 3.3 Đuôi 6 đốt (Tail Motion)
- **Vị trí code:** `CatAnimator.ts:251-260` (`updateBreathingAndTail`).
- **Logic hiện tại:**
  ```ts
  const segments = this.rig.tailSegments;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    const phaseOffset = i * 0.45;
    const angle = Math.sin(this.time * tailSpeed - phaseOffset) * tailAmplitude;
    seg.rotation.y = angle;
    seg.rotation.x = -0.05 + Math.cos(this.time * tailSpeed * 0.5 - phaseOffset) * (tailAmplitude * 0.3);
  }
  ```
- **Hạn chế:**
  - Sử dụng **đơn tần số** ($\omega = \text{tailSpeed}$ trên Y và $0.5 \times \text{tailSpeed}$ trên X) với độ trễ pha tuyến tính $\Delta \phi = 0.45 \cdot i$.
  - Do 6 đốt đuôi lồng nhau (hierarchical nesting), chuyển động cộng dồn góc khiến đuôi uốn cong như một thanh kim loại uốn dẻo đều đặn chứ không có độ quất roi (whip action), không có sóng bậc 2 (harmonic overtone), và không có cử động giật nhẹ ở chóp đuôi (tip flick) đặc trưng của loài mèo.

### 3.4 Phản ứng tương tác (Interaction & Poking)
- **Vị trí code:** `CatAnimator.ts:62-78`, `CatCanvas.tsx:177-214`.
- **Logic hiện tại:**
  - Khi click vào bụng: `rig.body.position.y += 0.08`, `annoyanceLevel` tăng, chuyển sang state `poked`.
  - Khi hover vào đầu: `triggerHeadPat()` hạ mí mắt xuống góc $-0.3$.
- **Hạn chế:**
  - Khi bị chọc bụng, thân mèo chỉ dịch lên một giá trị cố định $0.08$ rồi hạ xuống bằng lerp tuyến tính thô. Không có độ nảy giật lùi (recoil bounce) lò xo, không có squash khi tiếp đất, và không có rung lắc má/râu.
  - Khi rê chuột xoa đầu: chưa có rung cơ học tiếng gừ gừ (purr vibration), chưa có hiệu ứng hạt VFX tim bay lên.

---

## 4. BẢN THIẾT KẾ CHI TIẾT CÁC NÂNG CẤP VẬT LÝ & HOẠT HỌA

### 4.1 Hệ thống Dao động Lò xo Suy giảm (Damped Harmonic Oscillators / Jiggle Springs)

#### A. Mô hình Toán học
Phương trình vi phân dao động điều hòa suy giảm 1 bậc tự do (1-DOF Damped Oscillator):
$$\ddot{x} + 2\zeta\omega_n \dot{x} + \omega_n^2 (x - x_{\text{target}}) = \frac{F_{\text{ext}}}{m}$$

Trong đó:
- $x$: Tọa độ hiện tại (hoặc góc xoay $\theta$, hoặc tỷ lệ scale $s$).
- $v = \dot{x}$: Vận tốc dao động.
- $\omega_n = 2\pi f$: Tần số góc dao động riêng (rad/s), kiểm soát độ cứng (stiffness $k = m \omega_n^2$).
- $\zeta$: Tỷ số cản (damping ratio).
  - $\zeta < 1$: Dao động suy giảm có nảy (Underdamped) — tạo độ núng nính, mềm mại.
  - $\zeta = 1$: Cản tới hạn (Critically damped) — hồi vị nhanh nhất không vượt ngưỡng.
- $F_{\text{ext}} = -m \cdot a_{\text{parent}}$: Lực quán tính sinh ra khi bộ phận cha (đầu hoặc thân) di chuyển hoặc xoay đột ngột.

Để đảm bảo hiệu năng tối đa và không phụ thuộc vào thư viện bên ngoài, ta sử dụng thuật toán tích phân **Semi-Implicit Euler (Symplectic Euler)** đã được kiểm chứng tính ổn định:
```ts
// Thuật toán cập nhật Spring trong Animation Tick
const k = omega * omega;          // Hệ số cứng
const c = 2.0 * zeta * omega;     // Hệ số cản

const force = -k * (current - target) - c * velocity + externalAcc;
velocity += force * dt;
current += velocity * dt;
```

#### B. Bảng Tham số Vật lý Chuẩn hóa cho từng Bộ phận của Leo
| Bộ phận | Đại lượng điều khiển | Tần số $f$ (Hz) | $\omega_n$ (rad/s) | Tỷ số cản $\zeta$ | Lực kích hoạt (Excitation) | Hiện tượng vật lý |
|---|---|---|---|---|---|---|
| **Má trái & Má phải (`cheekL`, `cheekR`)** | Scale $S_x, S_y, S_z$ & Vị trí $\Delta Y, \Delta Z$ | 5.0 Hz | 31.4 rad/s | 0.60 | Gia tốc quay đầu $\ddot{\theta}_{\text{head}}$, độ mở hàm khi nói $\Delta \text{jaw}$ | Má phúng phính nảy rung khi mèo lắc đầu hoặc đang mắng gắt |
| **Bụng béo (`belly`)** | Scale $S_z, S_x$ & Vị trí $\Delta Z$ | 3.2 Hz | 20.1 rad/s | 0.52 | Chọc bụng (`poke`), tiếp đất sau cú nhảy | Bụng mỡ núng nính nảy bật 2-3 nhịp sau khi bị chọc |
| **Tai & Chóp tai (`earL`, `earR`)** | Góc nghiêng $\theta_z, \theta_x$ | 9.0 Hz | 56.5 rad/s | 0.42 | Gia tốc quay đầu, giật tai ngẫu nhiên (`twitch`), xoa đầu | Tai sụn nhẹ rung bần bật đàn hồi như tai mèo thật |
| **Râu (`whiskersL`, `whiskersR`)** | Góc chĩa $\theta_y, \theta_z$ | 12.0 Hz | 75.4 rad/s | 0.38 | Di chuyển đầu, chuyển động mở má/hàm | Râu cọ quậy mềm mại, có độ vẩy nhẹ tự nhiên |

---

### 4.2 Nguyên lý Hoạt họa Squash & Stretch Bảo toàn Thể tích

#### A. Công thức Toán học
Theo nguyên lý hoạt họa cổ điển Disney, vật thể sống dạng hữu cơ (organic flesh) khi chịu nén/kéo phải giữ nguyên thể tích:
$$V = \text{Scale}_X \cdot \text{Scale}_Y \cdot \text{Scale}_Z \approx 1.0$$

Khi thân mèo biến dạng theo trục thẳng đứng $Y$ với hệ số biến thiên $S_y$:
$$\text{Scale}_Y = 1.0 + \Delta s_y$$
Để bảo toàn thể tích đối xứng qua mặt phẳng ngang ($X$ và $Z$ biến dạng bằng nhau):
$$\text{Scale}_X = \text{Scale}_Z = \frac{1}{\sqrt{\text{Scale}_Y}} = (1.0 + \Delta s_y)^{-0.5}$$

Với các biến thiên nhỏ trong nhịp thở ($\Delta s_y \in [-0.08, 0.08]$), ta có thể tính chính xác cực nhanh bằng `1.0 / Math.sqrt(scaleY)`.

#### B. Các Tình huống Kích hoạt Squash & Stretch
1. **Nhịp thở tự nhiên (Organic Breathing):**
   - **Hít vào (Inhale):** Thân hơi vươn cao $S_y = 1.035 \implies S_x = S_z = 0.983$.
   - **Thở ra (Exhale):** Thân hơi xẹp xuống $S_y = 0.975 \implies S_x = S_z = 1.013$.
   - Riêng ở trạng thái ngủ/thở 4-7-8 (`break`), biên độ thở tăng lên $S_y \in [0.94, 1.06]$ với nhịp thở chậm rãi.
2. **Cú nảy giật mình khi chọc bụng (Poke Recoil & Bounce):**
   - **Giai đoạn 1 (Squash nén ép ban đầu):** Khi ngón tay ấn vào bụng, thân mèo thụt lại và nén dẹt: $S_y = 0.86, S_x = S_z = 1.078$.
   - **Giai đoạn 2 (Stretch bật nảy lên cao):** Toàn thân mèo bật nẩy lên $Y \uparrow 0.12$, thân kéo dãn: $S_y = 1.14, S_x = S_z = 0.937$.
   - **Giai đoạn 3 (Squash tiếp đất):** Rơi chạm đất, nén nhẹ $S_y = 0.90, S_x = S_z = 1.054$ trước khi dao động lò xo đưa về $1.0$.
3. **Bù trừ Điểm Neo Đáy (Ground Pivot Compensation):**
   - Vì gốc tọa độ Three.js của `body` nằm ở tâm khối cầu, nếu chỉ scale $S_y$ thì đáy thân mèo sẽ bị hẫng lên khỏi sàn hoặc lún xuyên qua sàn.
   - Để cố định chân mèo trên mặt đất tại $Y_{\text{ground}} = -0.68$:
     $$\Delta Y_{\text{body}} = Y_{\text{offset}} + (S_y - 1.0) \cdot H_{\text{pivot}}$$
     với $H_{\text{pivot}} \approx 0.45$. Cơ chế này giữ cho đệm chân luôn tiếp đất vững chãi trong khi phần thân trên nảy phập phồng sống động.

---

### 4.3 Nâng cấp Cử động Đuôi 6 Đốt: Lan truyền Sóng Đa Tần số (Multi-Frequency Wave Propagation)

#### A. Hạn chế của mô hình cũ và Giải pháp Đa Sóng
Mô hình cũ chỉ có 1 tần số khiến đuôi uốn đồng dạng như một thanh lò xo cứng. Đuôi mèo thật là một chuỗi đốt sống linh hoạt có sóng truyền từ gốc đến ngọn với sự giao thoa của 3 thành phần:
1. **Sóng chủ đạo (Fundamental wave $\omega_1$):** Nhịp vẫy chậm rãi, quét góc ngang lớn ($Y$ axis).
2. **Sóng điều hòa bậc 2 (Overtone harmonic $\omega_2 \approx 2.2 \omega_1$):** Uốn gợn sóng hình chữ S mềm mại chạy dọc thân đuôi.
3. **Sóng vẩy chóp đuôi (Tip micro-flicker $\omega_3 \approx 5.0 \omega_1$):** Cử động giật nhẹ ở 2 đốt cuối cùng (`seg_4`, `seg_5`).

#### B. Công thức Toán học cho Đốt thứ $i$ ($i \in [0..5]$)
Đặt chỉ số chuẩn hóa $u = \frac{i}{5} \in [0, 1]$.
Hàm bao biên độ (Amplitude Envelope) tăng dần về phía chóp đuôi:
$$A(i) = A_0 \cdot (0.35 + 0.65 \cdot u)$$

Góc xoay ngang ($Y$ axis - vẫy trái/phải):
$$\theta_y(i, t) = A(i) \cdot \left[ 0.70 \cdot \sin(\omega_1 t - k_1 \cdot i) + 0.30 \cdot \sin(\omega_2 t - k_2 \cdot i + \phi_2) \right]$$
trong đó:
- $k_1 = 0.42$ rad/đốt (độ lệch pha bước sóng cơ bản)
- $k_2 = 0.85$ rad/đốt (độ lệch pha bước sóng hài)

Góc nâng dọc ($X$ axis - uốn cong lên trời hình móc câu):
$$\theta_x(i, t) = \theta_{x0}(i) + A_x(i) \cdot \cos(0.5 \cdot \omega_1 t - k_1 \cdot i) + \text{flick}(i, t)$$
trong đó $\theta_{x0}(i) = -0.06 - 0.04 \cdot i$ tạo độ cong tự nhiên hướng lên cao, và:
$$\text{flick}(i, t) = \begin{cases} 0.08 \cdot \sin(\omega_3 t) & \text{nếu } i \ge 4 \text{ và } \text{isFlicking} \\ 0 & \text{ngược lại} \end{cases}$$

#### C. Biến điệu theo Trạng thái Cảm xúc
- **`scolding_extreme` / Cáu kỉnh:** $\omega_1 = 7.0$ rad/s, $A_0 = 0.32$, sóng giật mạnh mô phỏng đuôi quất liên hồi xuống sàn.
- **`warning` / Nghi ngờ:** $\omega_1 = 4.0$ rad/s, chóp đuôi giật nhịp nhàng từng cơn $1.5$s.
- **`idle` / Thư thái:** $\omega_1 = 1.8$ rad/s, $A_0 = 0.12$, sóng uốn lượn chậm và êm đềm.
- **`break` / Ngủ:** Đuôi buông thõng cuộn tròn quanh thân, biên độ tối thiểu $A_0 = 0.04$.

---

### 4.4 Cử động Mắt: Micro-saccades & Biểu cảm Chớp mắt Phong phú

#### A. Cơ chế Giật Vi mô Nhãn cầu (Micro-saccades Engine)
Mắt người và động vật không bao giờ nhìn chằm chằm bất động. Để tạo cảm giác nhân vật "thực sự đang sống và tư duy", ta mô hình hóa 3 thành phần chuyển động nhãn cầu:
$$\mathbf{P}_{\text{pupil}} = \mathbf{P}_{\text{mouse\_look}} + \mathbf{P}_{\text{drift}}(t) + \mathbf{P}_{\text{saccade}}$$

1. **`mouse_look`:** Đồng tử liếc theo hướng chuột người dùng (tối đa $\pm 0.04$).
2. **`drift(t)`:** Trôi chậm vi mô sinh bởi Perlin/Sine noise:
   $$\Delta x_{\text{drift}} = 0.004 \cdot \sin(1.7 t), \quad \Delta y_{\text{drift}} = 0.003 \cdot \cos(2.3 t)$$
3. **`saccade`:** Mỗi khoảng thời gian ngẫu nhiên $\tau \in [0.8, 2.4]$ giây, mắt thực hiện một cú giật nhanh trong 20ms đến một vị trí quan sát mới $(\Delta x_s, \Delta y_s) \in [-0.015, 0.015]$, sau đó giữ nguyên trạng thái cố định (fixation).

#### B. Co giãn Đồng tử Đa cảm xúc (Emotional Pupil Dilation)
Tỷ lệ scale của `pupilL` và `pupilR` biến đổi theo cảm xúc:
- **Tò mò / Xoa đầu hưởng thụ (`petted` / `celebrating`):** Đồng tử mở to tròn long lanh:
  `scale.set(1.25, 1.25, 0.2)`
- **Bình thường (`idle` / `focusing`):** Hạt dưa elip chuẩn chibi:
  `scale.set(0.85, 1.35, 0.2)`
- **Cáu kỉnh / Phán xét (`warning` / `scolding_extreme`):** Đồng tử co lại thành khe hẹp sắc lẹm:
  `scale.set(0.38, 1.55, 0.2)`

#### C. Hệ thống Chớp mắt Đa sắc thái (Expressive Blink Types)
1. **Chớp mắt thường (Standard Blink):** Thời gian nhắm 90ms, mở 120ms.
2. **Chớp mắt kép (Double Blink):** 2 cú chớp mắt liên tiếp cách nhau 100ms khi chú ý tới điều gì đó mới.
3. **Chớp mắt tin cậy / Chậm rãi (Slow Trust Blink - "Cat Kiss"):** Khi xoa đầu hoặc ở trạng thái thân thiện, mắt nhắm từ từ trong 350ms, giữ nguyên 200ms, rồi mở chậm trong 300ms.
4. **Nheo mắt phán xét (Suspicious Squint):** Mí mắt trên hạ xuống 60% ($\theta_x = -0.55$), lông mày hạ thấp.
5. **Mắt cười vòng cung (Bliss Smile `^ ^`):** Mí mắt cong lại tạo thành 2 nét chữ U ngược khi hoàn thành phiên học.

---

### 4.5 Máy Trạng thái Rảnh rỗi Tự nhiên (Idle Animation State Machine)

#### A. Kiến trúc Máy Trạng thái
Khi người dùng không tương tác trong thời gian dài ($t_{\text{inactivity}} > 10.0$ giây), Leo sẽ tự động chuyển từ trạng thái ngồi im sang chuỗi cử động ngẫu nhiên:

```
                  ┌────────────────────────────────────────┐
                  │              ACTIVE IDLE               │
                  │   (Ngồi quan sát chuột, thở phập phồng)│
                  └───────────────────┬────────────────────┘
                                      │ Inactivity > 10s
                                      ▼
                        ┌───────────────────────────┐
                        │     IDLE STATE CHOOSER    │
                        │  (Xác suất ngẫu nhiên 33%) │
                        └───────┬───────────┬───────┘
            ┌───────────────────┼───────────┴───────────────────┐
            ▼                   ▼                               ▼
┌──────────────────────┐┌──────────────────────┐┌──────────────────────┐
│  IDLE_STRETCH_YAWN   ││  IDLE_EAR_SCRATCH    ││   IDLE_PAW_LICK      │
│  (Ngáp vươn vai)     ││  (Gãi tai sau)       ││   (Liếm mu bàn chân) │
│  Thời lượng: 3.4s    ││  Thời lượng: 2.8s    ││   Thời lượng: 3.2s   │
└──────────┬───────────┘└──────────┬───────────┘└──────────┬───────────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │
                      Hoàn thành hoặc Bị ngắt bởi
                      User Poke / Mouse Move
                                   ▼
                  ┌────────────────────────────────────────┐
                  │              ACTIVE IDLE               │
                  └────────────────────────────────────────┘
```

#### B. Chi tiết 3 Cử động Phụ
1. **`IDLE_STRETCH_YAWN` (Ngáp & Vươn vai):**
   - **P1 (Hít sâu & Vươn người - 1.2s):** Thân ngửa nhẹ ra sau `body.rotation.x = -0.25`, hai chân trước duỗi thẳng ra trước, cằm mở cực đại `jawOpen = 1.0`, lưỡi cong ra ngoài, mắt nhắm tịt `eyelids = 0`.
   - **P2 (Giữ đỉnh điểm - 0.8s):** Râu giật giật về phía sau theo dao động lò xo, chóp đuôi vẫy khẽ.
   - **P3 (Thu người & Thở phào - 1.4s):** Miệng khép lại, đầu lắc nhẹ sang hai bên, trở về tư thế ban đầu.
2. **`IDLE_EAR_SCRATCH` (Gãi tai):**
   - Đầu nghiêng 20° sang phải `head.rotation.z = -0.35`.
   - Chân phải nhấc lên gần tai `armR.rotation.set(1.15, -0.3, 0.45)`.
   - Rung chân nhanh tần số 11Hz trong 1.5s tạo cử động gãi; tai rung bần bật theo nhịp gãi nhờ lò xo góc.
   - Đặt chân xuống sàn, rũ nhẹ lông đầu.
3. **`IDLE_PAW_LICK` (Liếm mu bàn chân):**
   - Chân trái nhấc lên trước ngực `armL.rotation.set(0.75, 0.25, 0.35)`, bàn chân xoay nhẹ vào trong.
   - Đầu cúi xuống `head.rotation.x = 0.28`.
   - Miệng mở khẽ, lưỡi nhô ra liếm vào bàn chân 3 nhịp (tần số 3Hz).
   - Đưa bàn chân vuốt nhẹ lên má (mèo rửa mặt) rồi hạ xuống.

#### C. Cơ chế Ngắt ưu tiên (Preemption & Blending)
Nếu người dùng rê chuột nhanh, click hoặc chọc bụng trong khi Leo đang thực hiện cử động rảnh rỗi, hệ thống sẽ:
- Lập tức hủy cử động rảnh rỗi hiện tại (`abortCurrentIdle()`).
- Sử dụng hàm nội suy góc mượt (Slerp / Hermite curve) đưa các khớp về tư thế phản hồi trong vòng 0.2s mà không bị giật cục khung hình (zero-pop blending).

---

## 5. THIẾT KẾ ÁNH SÁNG STUDIO TOON 3D, BÓNG TIẾP XÚC VÀ HỆ THỐNG HẠT VFX

### 5.1 Hệ thống Chiếu sáng 3 Điểm Studio Toon (3-Point Lighting)
Để Mèo Leo nổi bật sắc nét trên nền giao diện tối màu `#0A0A12` mà không bị chìm, cần thiết lập hệ thống 3 nguồn sáng tiêu chuẩn Studio Toon:
1. **Key Light (Đèn chính ấm):**
   - `THREE.DirectionalLight(0xffedd5, 1.4)`
   - Vị trí: `[2.8, 4.5, 3.8]` (chiếu từ phía trên bên phải mặt trước).
   - Tạo các mảng sáng ấm vàng tươi trên mặt, tai phải và ngực.
2. **Fill Light (Đèn phụ mát dịu):**
   - `THREE.DirectionalLight(0xe0f2fe, 0.55)`
   - Vị trí: `[-2.5, 2.0, 3.0]` (chiếu từ phía đối diện).
   - Làm dịu các mảng tối bên sườn trái, tránh bóng đen gắt.
3. **Backlight / Rim Light (Đèn viền lam ngọc rực rỡ):**
   - `THREE.DirectionalLight(0x38bdf8, 1.1)` (Cyan neon phù hợp phong cách Neo-Brutal Aurora).
   - Vị trí: `[-3.5, 3.2, -3.2]` (chiếu ngược từ phía sau lưng).
   - Tạo đường viền ánh sáng rực rỡ tách biệt 100% hình thể mèo khỏi nền tối đen của modal.

### 5.2 Bóng Tiếp xúc Mềm Động (Dynamic Soft Contact Shadow Blob)
- Hiện tại trong `CatCanvas.tsx:135-157`, bóng là một `PlaneGeometry` tĩnh đặt tại `Y = -0.68`.
- **Cải tiến động:** Khi thân mèo nảy lên theo trục Y (do Squash & Stretch hoặc poke recoil $\Delta Y_{\text{cat}}$):
  $$R_{\text{shadow}} = R_0 \cdot \max\left(0.4, 1.0 - 0.45 \cdot \Delta Y_{\text{cat}}\right)$$
  $$\alpha_{\text{shadow}} = \alpha_0 \cdot \max\left(0.15, 1.0 - 0.65 \cdot \Delta Y_{\text{cat}}\right)$$
- Khi mèo nảy lên cao: bóng tiếp xúc thu nhỏ lại và mờ dần.
- Khi mèo tiếp đất nén người: bóng nở rộng và đậm nét rõ rệt, tạo cảm giác không gian 3D tiếp xúc chân thực.

### 5.3 Hệ thống Hạt VFX WebGL (Points / Instanced Sprites)
Tích hợp một hệ thống hạt nhẹ nhàng bằng `THREE.Points` (chỉ 1 draw call duy nhất):
1. **Hạt Tim Hồng (Petting / Praise Hearts):**
   - Kích hoạt khi: Xoa đầu (`cursor petting`) hoặc nhận lời khen.
   - Hành vi: 6-10 hạt tim nhỏ màu hồng phấn `#fb7185` bay lơ lửng từ đỉnh đầu mèo lên cao, lắc lư nhẹ theo hàm sin và mờ dần trong 1.2s.
2. **Tia Cáu / Giọt Mồ hôi Hoạt hình (Anger Steam / Comic Sweat):**
   - Kích hoạt khi: Chọc bụng quá 3 lần (`annoyanceLevel > 2`) hoặc chuyển sang `scolding_extreme`.
   - Hành vi: 3 vạch tia sét đỏ/cam hoặc biểu tượng chữ thập gân máu cáu kỉnh xuất hiện phía trên trán giật rung 0.6s.
3. **Sao Lấp Lánh (Celebration Sparkles):**
   - Kích hoạt khi: Hoàn thành phiên Pomodoro (`state === 'celebrating'`).
   - Hành vi: Vòng sao vàng kim `#fbbf24` xoay tròn bùng nổ quanh đầu mèo.

### 5.4 Tương tác Kéo Xoay 3D Đàn hồi (Interactive Elastic Orbit)
- Người dùng có thể nhấn giữ chuột trái trên nền canvas và kéo nhẹ để xoay góc nhìn 3D của Leo:
  - Giới hạn xoay trục Y: $\theta_y \in [-25^\circ, +25^\circ]$
  - Giới hạn xoay trục X: $\theta_x \in [-12^\circ, +12^\circ]$
- Khi người dùng thả chuột: Lập tức kích hoạt dao động lò xo suy giảm đưa góc xoay trở về $(0, 0)$ một cách êm ái (`SpringDamper` damping $\zeta = 0.72$).

---

## 6. ĐÁNH GIÁ ỔN ĐỊNH SỐ HỌC, HIỆU NĂNG VÀ NGÂN SÁCH KHUNG HÌNH (120FPS)

### 6.1 Ngân sách Khung hình (Frame Budget)
- Tại tần số quét 120Hz, thời gian khả dụng cho mỗi khung hình là **8.33 milliseconds**.
- Phân bổ ngân sách hiệu năng:
  - JavaScript logic & Physics calculations: $\le 1.2\text{ ms}$
  - Three.js Matrix updates & Scene graph traversal: $\le 0.8\text{ ms}$
  - WebGL GPU draw & rasterization: $\le 2.5\text{ ms}$
  - Trình duyệt dành phần còn lại cho React Virtual DOM, CSS composites và âm thanh.

### 6.2 Ổn định Số học của Bộ tích phân Vật lý (Numerical Stability)
1. **Nguy cơ bùng nổ số học (`Delta Time Spike / NaN Boom`):**
   - Khi người dùng chuyển tab, mở DevTools, hoặc máy gặp GC pause, `delta` trong `requestAnimationFrame` có thể vọt từ $0.008$s lên $0.25$s hoặc $2.0$s.
   - Nếu đưa $\Delta t > 0.05$s vào phương trình lò xo với tần số cao $f = 12$Hz, hệ số gia tốc $k \cdot \Delta t^2$ sẽ vượt ngưỡng ổn định, biến vị trí thành $\pm \infty$ hoặc `NaN`.
   - Trong Three.js, nếu một node trong cây phân cấp bị `NaN`, toàn bộ ma trận biến đổi thế giới (`matrixWorld`) của các node con sẽ bị hỏng, khiến mô hình biến mất khỏi màn hình!
2. **Biện pháp Phòng ngừa Tuyệt đối:**
   - **Kẹp chặt Delta:**
     ```ts
     const safeDelta = Math.min(delta, 0.033); // Tối đa 33ms (tương đương tối thiểu 30FPS)
     ```
   - **Sub-stepping (Chia nhỏ bước thời gian):** Nếu `delta > 0.016`, chia thành 2 bước tích phân `dt_sub = safeDelta / 2` để đảm bảo độ chính xác vật lý.
   - **Bảo vệ chống `NaN` (Sanity Guard):**
     ```ts
     if (!Number.isFinite(this.current) || Number.isNaN(this.current)) {
       this.current = this.target;
       this.velocity = 0;
     }
     ```

### 6.3 Chính sách Không cấp phát Bộ nhớ trong Render Tick (Zero-Allocation Policy)
- Việc gọi `new THREE.Vector3()`, `new THREE.Color()`, hoặc tạo object rác `{}` bên trong `update(delta)` sẽ khiến V8 Garbage Collector dọn dẹp liên tục mỗi 3-5 giây, tạo các vi giật (micro-stutters) làm tụt FPS từ 120 xuống 45.
- **Quy tắc bắt buộc:**
  - Toàn bộ vector tạm, biến lưu trữ trạng thái lò xo, bộ đếm thời gian phải được cấp phát 1 lần duy nhất trong hàm khởi tạo constructor của `CatAnimator`.
  - Tái sử dụng các biến thành viên có sẵn (`this._tempVec`, `this._tempEuler`).

### 6.4 Vòng đời WebGL và Giải phóng Bộ nhớ (Lifecycle & Disposal)
- Trong `CatCanvas.tsx`, cơ chế cleanup khi modal đóng hoặc chuyển sang 2D phải giải phóng triệt để:
  - Tất cả các `BufferGeometry` (bao gồm hình khối của phụ kiện và hạt VFX).
  - Tất cả các `Material` và `DataTexture` (`gradientMap`, `shadowTex`).
  - Gọi `renderer.dispose()` và `renderer.forceContextLoss()`.
  - Hủy bỏ biến `animFrameId` bằng `cancelAnimationFrame()`.

---

## 7. ĐỐI SOÁT VỚI BỘ TEST HIỆN HỮU (`tests/pomodoro-leo.test.ts`)

Lệnh kiểm tra:
```bash
node --experimental-strip-types --test tests/pomodoro-leo.test.ts
```
Kết quả thực tế:
```
✔ PomodoroSettings: default values are valid and populated (0.5697ms)
✔ CatStateMachine: maps context to correct cat action states (0.162ms)
✔ CharacterData: all 4 characters exist and have valid quotes (0.1616ms)
ℹ tests 3, pass 3, fail 0
```
- Bộ test hiện tại kiểm tra tính nhất quán của `DEFAULT_POMODORO_SETTINGS`, `determineCatState` trong `CatStateMachine.ts`, và 4 nhân cách trong `characters-data.ts`.
- Mọi cải tiến về mặt vật lý chuyển động lò xo, Squash & Stretch và hoạt ảnh Three.js được đóng gói hoàn toàn bên trong `CatAnimator.ts`, `CatProceduralMesh.ts`, `CatRig.ts`, và `CatCanvas.tsx`.
- Cơ chế `CatActionState` vẫn giữ nguyên 9 trạng thái chuẩn (`idle`, `focusing`, `warning`, `scolding_light`, `scolding_medium`, `scolding_extreme`, `celebrating`, `break`, `poked`), do đó đảm bảo **100% tương thích ngược** và **không làm gãy bất kỳ bài kiểm tra nào**.

---

## 8. LỘ TRÌNH TRIỂN KHAI CHO KỸ SƯ (ACTIONABLE IMPLEMENTATION BLUEPRINT)

### Bước 1: Mở rộng `CatRig.ts` & `CatProceduralMesh.ts`
1. Bổ sung `cheekL: THREE.Mesh`, `cheekR: THREE.Mesh` vào `CatRig`.
2. Gán các mesh má kem vào `CatRig` trong `buildProceduralLeoCat()`.
3. Định vị tâm neo chân tiếp xúc đáy để chuẩn bị cho Squash & Stretch.

### Bước 2: Xây dựng Module Lò xo Vật lý Damped Spring (`SpringOscillator`)
Tạo lớp hoặc cấu trúc dữ liệu `SpringValue`:
```ts
export class SpringValue {
  public current: number;
  public target: number;
  public velocity: number = 0;
  public omega: number;
  public zeta: number;

  constructor(initial: number, frequencyHz: number, dampingRatio: number) {
    this.current = initial;
    this.target = initial;
    this.omega = 2 * Math.PI * frequencyHz;
    this.zeta = dampingRatio;
  }

  public update(dt: number) {
    const k = this.omega * this.omega;
    const c = 2 * this.zeta * this.omega;
    const force = -k * (this.current - this.target) - c * this.velocity;
    this.velocity += force * dt;
    this.current += this.velocity * dt;
  }

  public impulse(v: number) {
    this.velocity += v;
  }
}
```

### Bước 3: Nâng cấp `CatAnimator.ts`
1. Tích hợp lò xo cho:
   - `springBelly`: điều khiển nén/nảy bụng và Squash & Stretch.
   - `springCheekL`, `springCheekR`: điều khiển rung lắc má.
   - `springEarL`, `springEarR`: điều khiển rung góc tai.
   - `springWhiskers`: điều khiển vẫy râu.
2. Tích hợp công thức bảo toàn thể tích Squash & Stretch:
   $$S_x = S_z = \frac{1}{\sqrt{S_y}}$$
3. Tích hợp thuật toán uốn đuôi 6 đốt đa tần số ($\omega_1, \omega_2, \omega_3$).
4. Tích hợp Micro-saccades và co giãn đồng tử (`pupilL`, `pupilR`).
5. Xây dựng máy trạng thái Idle (`IDLE_STRETCH_YAWN`, `IDLE_EAR_SCRATCH`, `IDLE_PAW_LICK`).

### Bước 4: Nâng cấp `CatCanvas.tsx`
1. Cấu hình hệ thống chiếu sáng 3 điểm (Key, Fill, Rim Light).
2. Tích hợp co giãn bóng tiếp xúc mềm (Soft Contact Shadow) theo độ cao Y.
3. Bổ sung sự kiện kéo chuột xoay góc nhìn với cơ chế đàn hồi hồi vị.
4. Tích hợp hạt VFX WebGL (tim hồng, tia cáu, sao lấp lánh).
5. Đảm bảo dọn dẹp bộ nhớ triệt để khi unmount.

---

## 9. KẾT LUẬN

Hệ thống Mèo Leo Three.js hiện tại của CampusOS đã có nền móng rất vững chắc về mặt hình khối procedural chibi và phân loại trạng thái cảm xúc. Việc áp dụng các nguyên lý hoạt họa Disney/Pixar (Squash & Stretch bảo toàn thể tích, dao động lò xo thứ cấp cho các phần thịt mềm/sụn tai, uốn đuôi đa tần số, micro-saccades mắt sống động, cử động rảnh rỗi ngẫu nhiên, và ánh sáng 3 điểm toon) sẽ nâng tầm trải nghiệm tương tác của Leo từ một mô hình 3D cơ bản thành một nhân vật hoạt hình sống động, giàu cá tính, đạt tiêu chuẩn 120FPS mượt mà không gây giật lag.

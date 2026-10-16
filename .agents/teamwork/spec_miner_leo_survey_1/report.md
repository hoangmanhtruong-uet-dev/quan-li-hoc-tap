# BÁO CÁO KHẢO SÁT VÀ ĐẶC TẢ KỸ THUẬT: NÂNG CẤP NHÂN VẬT MÈO LEO 3D (DISNEY/PIXAR TOON)

- **Người thực hiện**: `spec_miner_leo_survey_1`
- **Thời gian**: 2026-10-13T17:30:00Z
- **Đối tượng**: Màn hình Pomodoro Giám thị CampusOS (`src/features/pomodoro/*`, `src/components/cat/*`)
- **Tài liệu căn cứ**: `ORIGINAL_REQUEST.md` (yêu cầu lúc `2026-10-13T17:18:44Z`), `DISPATCH.md`

---

## 1. TỔNG QUAN KHẢO SÁT (EXECUTIVE SUMMARY)

Khảo sát hiện trạng mã nguồn Three.js của Mèo Leo (`CatCanvas.tsx`, `CatAnimator.ts`, `CatProceduralMesh.ts`, `CatMaterials.ts`, `CatRig.ts`, `CatStateMachine.ts`, `useCatAudioLipSync.ts`, `audio-engine.ts`) ghi nhận:
1. **Kiến trúc phân cấp (CatRig Hierarchy)** đã có cấu trúc xương tương đối hoàn chỉnh gồm Root, Body, Belly, Chest, Neck, Head, Ears, Eyes, Eyelids, Brows, Muzzle, Jaw, Tongue, Whiskers, Arms/Paws, và 6 đốt Đuôi (`tailSegments: THREE.Group[6]`).
2. **Khoảng cách hiện trạng so với chuẩn hoạt hình Disney/Pixar cao cấp**:
   - **Squash & Stretch**: Nhịp thở và nảy chỉ biến đổi tùy tiện một trục (`belly.scale.z`), vi phạm định luật bảo toàn thể tích ($S_x S_y S_z \ne 1$).
   - **Vật lý lò xo (Jiggle Physics)**: Chưa có bộ giải phương trình dao động điều hòa suy giảm (damped harmonic oscillator). Má, tai, râu và bụng chưa có quán tính mềm mại tự nhiên.
   - **Chuyển động đuôi**: Hiện dùng sóng sin đơn tần đơn giản, chưa có lan truyền sóng đa tần số (multi-frequency wave propagation) và độ trễ pha động học theo từng đốt.
   - **Ánh sáng**: Mới có 2 nguồn sáng hướng và 1 ambient, thiếu nguồn Fill light tạo khối mềm chuẩn 3-point studio toon lighting; bóng tiếp xúc (blob shadow) đứng yên, không co giãn theo độ cao mèo.
   - **VFX Hạt**: Hoàn toàn vắng bóng hệ thống hạt (chưa có hạt thả tim, tia cáu/mồ hôi, hay sao lấp lánh).
   - **Tương tác**: Chưa hỗ trợ kéo chuột xoay góc nhìn 3D có độ hồi vị đàn hồi, xoa đầu chưa có rung purr, chọc bụng chưa có nảy lò xo recoil bounce, và thiếu máy trạng thái động tác rảnh rỗi (idle behaviors).
   - **Lip-Sync**: Hàm mở/đóng bằng `lerp` đối xứng, thiếu đường cong công học attack/decay bất đối xứng và rung âm lưỡi tự nhiên.

Dưới đây là bản đặc tả kỹ thuật toán học, thuật toán, kiến trúc và kiểm thử chi tiết phục vụ các kỹ sư phát triển.

---

## 2. ĐẶC TẢ R1: HOẠT ẢNH SINH ĐỘNG & VẬT LÝ THỨ CẤP (SECONDARY MOTION & SQUASH/STRETCH)

### 2.1. Phương trình bảo toàn thể tích (Volume Preservation)
Theo nguyên lý hoạt hình truyền thống Disney 12 Principles, khi một vật thể mềm co ép (squash) hoặc kéo giãn (stretch), thể tích tổng thể không đổi:
$$V = S_x(t) \cdot S_y(t) \cdot S_z(t) = 1.0$$

Khi thân mèo hoặc bụng chịu biến dạng theo trục thẳng đứng $Y$ với hệ số biến thiên $s(t) \in (-0.35, 0.40)$:
$$S_y(t) = 1.0 + s(t)$$

Để bảo toàn thể tích đối xứng tròn xoay trên mặt phẳng ngang $(X, Z)$:
$$S_x(t) = S_z(t) = \frac{1}{\sqrt{S_y(t)}} = \frac{1}{\sqrt{1.0 + s(t)}}$$

Trong tính toán thời gian thực ở 120FPS, có thể sử dụng khai triển Taylor bậc 2 hoặc trực tiếp hàm `Math.sqrt`:
```typescript
export function computeSquashStretchScale(syFactor: number): [number, number, number] {
  const clampedSy = Math.max(0.5, Math.min(1.8, syFactor));
  const sxz = 1.0 / Math.sqrt(clampedSy);
  return [sxz, clampedSy, sxz];
}
```

**Bù trừ trọng tâm mặt sàn (Ground Anchoring)**:
Khi squash xảy ra trên mặt phẳng đất ($Y_{floor} = -0.68$), vị trí đáy tiếp xúc phải đứng yên trên sàn, tâm khối phải dời xuống:
$$\Delta Y_{root}(t) = -\frac{H_0}{2} \cdot (1.0 - S_y(t))$$
với $H_0 \approx 0.95$ là chiều cao nghỉ của thân mèo.

---

### 2.2. Phương trình vi phân dao động lò xo suy giảm (Damped Harmonic Oscillator)
Đối với các bộ phận mềm gồm: Má phúng phính (cheeks), bụng mỡ (belly), chóp tai (ear tips), và râu (whiskers), chuyển động nảy mềm tuân theo phương trình vi phân bậc hai:
$$m \frac{d^2 x}{dt^2} + c \frac{dx}{dt} + k (x - x_{target}) = F_{ext}(t)$$

Quy đổi về dạng chính tắc:
$$\ddot{x}(t) + 2 \zeta \omega_0 \dot{x}(t) + \omega_0^2 (x(t) - x_{target}) = a_{ext}(t)$$
Trong đó:
- $\omega_0 = \sqrt{k/m}$: Tần số góc tự nhiên (rad/s) đặc trưng cho độ cứng.
- $\zeta = \frac{c}{2\sqrt{km}}$: Hệ số cản suy giảm (damping ratio).
  - $\zeta < 1$: Dao động dưới cản (underdamped) $\to$ tạo độ nảy đàn hồi (jiggle) mềm mại.
  - $\zeta = 1$: Cản tới hạn (critically damped) $\to$ hồi vị nhanh nhất không có vọt lố.

**Thuật toán tích phân số Semi-Implicit Euler (ổn định vô điều kiện với $\Delta t \le 0.033s$)**:
```typescript
export interface SpringState {
  position: number;
  velocity: number;
  target: number;
}

export function updateSpring(
  state: SpringState,
  omega0: number, // Tần số góc (stiffness)
  zeta: number,   // Hệ số cản (damping ratio)
  delta: number
): void {
  const dt = Math.min(delta, 0.05); // Chống tích lũy nổ delta khi lag khung hình
  const displacement = state.position - state.target;
  const acceleration = -omega0 * omega0 * displacement - 2.0 * zeta * omega0 * state.velocity;
  state.velocity += acceleration * dt;
  state.position += state.velocity * dt;
}
```

**Bảng tham số chuẩn cho các bộ phận mềm của Mèo Leo**:
| Bộ phận | Tần số góc $\omega_0$ (rad/s) | Hệ số cản $\zeta$ | Biên độ tối đa | Tác động kích hoạt (Triggers) |
|---|---|---|---|---|
| **Bụng (Belly jiggle)** | 14.0 | 0.45 (nảy 2-3 nhịp) | $\pm 0.15$ | Chọc bụng (poke), tiếp đất (landing), thở sâu |
| **Má (Cheek bounce)** | 20.0 | 0.52 (nảy mềm) | $\pm 0.08$ | Nhép giọng (jaw motion), xoa đầu, giật mình |
| **Chóp tai (Ear tips)** | 28.0 | 0.48 (vẫy nhanh) | $\pm 0.18$ rad | Quay đầu đột ngột, tai giật định kỳ, bị mắng |
| **Râu mèo (Whiskers)** | 36.0 | 0.62 (rung nhuyễn) | $\pm 0.12$ rad | Gió thở, mở miệng, lắc đầu |

---

### 2.3. Động học đuôi 6 đốt lan truyền sóng đa tần số (6-Segment Tail Multi-Frequency Wave)
Đuôi gồm 6 khớp liên hoàn $S_0, S_1, S_2, S_3, S_4, S_5$. Mỗi đốt $i \in [0, 5]$ xoay tương đối so với đốt cha $S_{i-1}$ theo phương trình sóng kết hợp 2 tần số:
$$\theta_y(i, t) = \left(1.0 + 0.14 \cdot i\right) \cdot \left[ A_1 \cdot \sin(\omega_1 t - i \cdot \phi_1) + A_2 \cdot \sin(\omega_2 t - i \cdot \phi_2 + \psi) \right]$$
$$\theta_x(i, t) = \theta_{rest, x}(i) + A_3 \cdot \cos(\omega_1 \cdot 0.5 \cdot t - i \cdot \phi_1)$$

**Ma trận tham số cử động đuôi theo trạng thái cảm xúc**:
| Trạng thái (CatActionState) | $A_1$ (rad) | $\omega_1$ (rad/s) | $\phi_1$ (rad) | $A_2$ (rad) | $\omega_2$ (rad/s) | Mô tả hình học đuôi |
|---|---|---|---|---|---|---|
| `idle` | 0.11 | 2.0 | 0.45 | 0.03 | 4.2 | Uốn lượn lững lờ, chóp đuôi phe phẩy nhẹ |
| `focusing` | 0.06 | 1.4 | 0.40 | 0.00 | 0.0 | Đuôi gập gọn giữ thăng bằng, ít động |
| `warning` | 0.22 | 4.2 | 0.55 | 0.06 | 8.0 | Vẫy dồn dập, giật đuôi cảnh báo |
| `scolding_extreme` | 0.38 | 7.5 | 0.65 | 0.14 | 15.0 | Quất đuôi dữ dội sang hai bên, nảy chóp |
| `celebrating` | 0.26 | 5.2 | 0.50 | 0.08 | 10.4 | Đuôi dựng cong hình dấu hỏi `?`, ngoáy tít |
| `break` (ngủ) | 0.04 | 0.8 | 0.35 | 0.00 | 0.0 | Đuôi cuộn tròn áp sát mạn sườn mèo |

---

### 2.4. Cử động mắt vi mô (Micro-Saccades) và Biểu cảm chớp mắt (Emotional Blinks)
- **Micro-Saccades**: Đồng tử mắt mèo thực hiện các bước nhảy ngẫu nhiên nhỏ mô phỏng cử động mắt sinh học, chu kỳ phân phối ngẫu nhiên $T_{saccade} \sim \text{Poisson}(1.2s - 2.8s)$:
  $$\Delta X_{pupil} \in [-0.012, +0.012], \quad \Delta Y_{pupil} \in [-0.008, +0.008]$$
  Bước nhảy hoàn tất trong 25ms, sau đó giữ ổn định trôi nhẹ (fixational drift).
- **Chớp mắt cảm xúc (Emotional Eyelid Angles)**:
  Góc quay trục X mí trên `upperEyelidL/R.rotation.x`:
  - `Mở to bình thường`: $-\pi/2 = -1.5708$ rad (mí cuộn biến mất).
  - `Nhắm tịt hưởng thụ (Petting / Praise)`: $-0.35$ rad, mí hơi cong hình vầng trăng khuyết hướng lên.
  - `Nheo mắt hoài nghi (Warning / Tab switch)`: Bất đối xứng — Mắt trái $-0.65$ rad, mắt phải $-0.45$ rad.
  - `Trợn to cáu kỉnh (Scolding Extreme)`: Mí giật mở tối đa $-\pi/2$, thu nhỏ đồng tử mống mắt ($S_{pupil} = 0.65$).
  - `Ngủ nhắm nghiền (Break)`: $0.0$ rad (mí đóng kín hoàn toàn 100%).

---

## 3. ĐẶC TẢ R2: ÁNH SÁNG STUDIO TOON 3D & HỆ THỐNG HIỆU ỨNG THỊ GIÁC (VFX)

### 3.1. Hệ thống chiếu sáng Studio 3 điểm (3-Point Toon Lighting)
Nhân vật được chiếu sáng bởi 3 nguồn sáng kết hợp bản đồ cel-shading:
1. **Key Light (Đèn chính ấm)**:
   - Loại: `THREE.DirectionalLight`
   - Màu sắc: `#FFF4E6` (Cam vàng nắng ấm studio)
   - Cường độ: $1.5$
   - Vị trí: $(x: 3.0, y: 4.5, z: 4.0)$
   - Mục đích: Định hình khối chính của thân, mặt và bàn chân với đường bóng đổ cel sắc nét.
2. **Fill Light (Đèn phụ dịu mát)**:
   - Loại: `THREE.DirectionalLight`
   - Màu sắc: `#A5F3FC` (Xanh cyan mát dịu)
   - Cường độ: $0.65$
   - Vị trí: $(x: -3.2, y: 1.5, z: 2.2)$
   - Mục đích: Nâng sáng vùng tối dưới cằm và mạn sườn trái, tránh hiện tượng cháy đen (black clip) nhưng không làm mất bóng đổ 2D.
3. **Rim Light / Backlight (Đèn viền tách phông)**:
   - Loại: `THREE.DirectionalLight`
   - Màu sắc: `#38BDF8` (Neon Cyan rực rỡ)
   - Cường độ: $1.25$
   - Vị trí: $(x: -3.5, y: 3.8, z: -3.2)$ hướng vào tâm $(0, 0.4, 0)$
   - Mục đích: Quét một đường viền phát sáng (grazing rim highlight) quanh đỉnh tai, má và sống lưng, làm bật nhân vật mèo màu cam tách khỏi giao diện nền tối `#0A0A12`.
4. **Ambient Light**:
   - Màu sắc: `#FFFBEB`, Cường độ $0.75$.
5. **Gradient Cel Map**:
   - `THREE.DataTexture` 4 bậc $[85, 145, 205, 255]$ gán vào `gradientMap` của `MeshToonMaterial` với `NearestFilter`.

---

### 3.2. Bóng tiếp xúc mềm thích ứng độ cao (Dynamic Soft Contact Shadow)
Bóng đổ tròn elip đặt trên mặt đất tại $Y = -0.68$, xoay ngang $R_x = -\pi/2$:
- Khi thân mèo nhảy hoặc bật nảy lên độ cao $h = \max(0, Y_{body} - Y_{rest})$:
  $$\text{Bán kính bóng: } R(h) = R_0 \cdot \max\left(0.40, 1.0 - 0.42 \cdot h\right)$$
  $$\text{Độ mờ đục (Opacity): } \alpha(h) = \alpha_0 \cdot \max\left(0.08, \frac{1.0}{1.0 + 3.2 \cdot h}\right)$$
  Với $R_0 = (1.9, 1.4)$, $\alpha_0 = 0.55$.
- Tọa độ tâm bóng bám theo hình chiếu bằng $(X_{body}, Z_{body})$ trên mặt phẳng $Y = -0.68$.

---

### 3.3. Hệ thống hạt VFX (WebGL Particle Systems)
Hệ thống sử dụng cơ chế **Object Pooling** với bộ đệm đỉnh định sẵn, cấm tuyệt đối việc tạo `new THREE.Mesh` hay `new THREE.Vector3` trong Render Loop.

#### 1. Hạt tim hồng bay lơ lửng (`VFX_Hearts`):
- **Điều kiện kích hoạt**: Khi xoa đầu (`triggerHeadPat`), nhận lời khen (`praiseQuote`), hoặc hoàn thành phiên Pomodoro.
- **Kích thước Pool**: 16 hạt.
- **Vùng sinh (Emitter Bounds)**: Hộp ngẫu nhiên quanh đỉnh đầu $[x: \pm 0.22, y: 0.55 \dots 0.75, z: 0.2 \dots 0.5]$.
- **Vận tốc ban đầu**: $v_y \sim \mathcal{U}(0.35, 0.55)$ m/s, $v_x = 0.08 \cdot \sin(6t + \phi)$.
- **Tuổi thọ ($\tau$)**: $1.4$ giây.
- **Vòng đời Alpha & Scale**:
  - $0\% \to 20\%$ tuổi thọ: Scale từ $0.0 \to 1.0$, Alpha từ $0.0 \to 1.0$.
  - $20\% \to 60\%$ tuổi thọ: Lắc lư bồng bềnh, giữ nguyên Alpha $1.0$.
  - $60\% \to 100\%$ tuổi thọ: Bay chậm dần, Alpha mờ dần từ $1.0 \to 0.0$, Scale mở rộng nhẹ $1.2$.

#### 2. Tia cáu & Mồ hôi hoạt hình (`VFX_AngerSweat`):
- **Điều kiện kích hoạt**: Bị chọc bụng (`poked`), chuyển tab lơ là (`isAwayTab`), hoặc đang mắng gắt (`scolding_extreme`).
- **Dạng thức**:
  - **Dấu gân cáu đỏ (`💢`)**: Sinh ở thái dương trán, nhấp nháy phóng to co nhỏ theo hàm $|\sin(14t)|$, tồn tại $1.2$ giây.
  - **Giọt mồ hôi xanh lơ (`💧`)**: Trượt dọc mạn thái dương rơi xuống theo gia tốc trọng trường $a_y = -0.9\text{ m/s}^2$, tồn tại $0.8$ giây.

#### 3. Sao lấp lánh ăn mừng (`VFX_Stars`):
- **Điều kiện kích hoạt**: Chuyển trạng thái `celebrating` khi hết giờ Pomodoro.
- **Kích thước Pool**: 24 hạt sao 4 cánh vàng/lime (`#FACC15`, `#C6FF3D`).
- **Động học nổ (Radial Burst)**: Vận tốc tỏa tròn góc $360^\circ$ với hệ số ma sát không khí $\gamma = 0.94$, tự xoay trục $Z$ tốc độ $10\text{ rad/s}$, lấp lánh (twinkle) theo tần số $24\text{ Hz}$.

---

### 3.4. Trong suốt 100% Canvas & Giải phóng tài nguyên (Resource Disposal)
- **Cấu hình Renderer**:
  - `alpha: true`, `antialias: true`, `premultipliedAlpha: true`.
  - `renderer.setClearColor(0x000000, 0)`.
  - DOM Element style: `background: transparent; pointer-events: auto;`.
- **Giao thức giải phóng bộ nhớ khi Unmount**:
  1. Hủy `cancelAnimationFrame(animFrameId)`.
  2. Hủy các Event Listener trên `document` và `canvas` (`visibilitychange`, `pointerdown`, `pointermove`, `pointerup`).
  3. Duyệt và dispose: Toàn bộ `BufferGeometry`, `Texture` (bao gồm shadow canvas texture, cel gradient texture, particle textures), `Material` (bao gồm các toon materials, outline back-face materials).
  4. Gọi `renderer.dispose()`, `renderer.forceContextLoss()`.
  5. Loại bỏ canvas DOM element khỏi container.

---

## 4. ĐẶC TẢ R3: TƯƠNG TÁC PHẢN HỒI CHUỘT & ĐIỀU KHIỂN TỰ NHIÊN (CONTROLS & GESTURES)

### 4.1. Kéo xoay 3D có lò xo đàn hồi hồi vị (3D Drag Rotation with Spring Return)
- **Phạm vi góc xoay giới hạn (Bounding Limits)**:
  - Trục $Y$ (Yaw - quay ngang): $\theta_y \in [-25^\circ, +25^\circ] \approx [-0.4363, +0.4363]$ rad.
  - Trục $X$ (Pitch - cúi ngửa): $\theta_x \in [-12^\circ, +12^\circ] \approx [-0.2094, +0.2094]$ rad.
- **Cơ chế kéo**:
  Khi nhấn chuột trái và di chuyển $\Delta X, \Delta Y$:
  $$\theta_{target, y} = \text{clamp}\left( \frac{\Delta X}{\text{Width}} \cdot 50^\circ, -25^\circ, +25^\circ \right)$$
  $$\theta_{target, x} = \text{clamp}\left( -\frac{\Delta Y}{\text{Height}} \cdot 24^\circ, -12^\circ, +12^\circ \right)$$
- **Cơ chế hồi vị khi buông chuột (Elastic Spring Return)**:
  Khi thả chuột (`pointerup` / `pointerleave`): $\theta_{target} = 0$.
  Góc quay nhân vật hồi vị về $0$ theo phương trình lò xo cản tới hạn ($\omega_R = 16.0\text{ rad/s}, \zeta_R = 0.72$):
  Tốc độ hồi vị êm ái, có độ nẩy khẽ qua vị trí cân bằng $\sim 1.5^\circ$ rồi dừng hẳn tại $0$.

---

### 4.2. Tương tác xoa đầu (Cursor Petting / Purr Vibration)
- **Phát hiện**: Raycast trúng `rig.clickTargets.head` kết hợp vận tốc chuột $|\vec{v}_{mouse}| > 0.05$.
- **Phản hồi**:
  1. Hai tai ép bẹp sang hai bên: $R_z(earL) \to 0.75$, $R_z(earR) \to -0.75$.
  2. Mắt nheo hình vầng trăng khuyết: $E_{upper} \to -0.35$.
  3. **Rung purr (tiếng gừ gừ)**: Rung tần số cao biên độ cực nhỏ tác động lên `rig.body.position`:
     $$\Delta X_{purr}(t) = 0.003 \cdot \sin(55 \cdot t)$$
     $$\Delta Y_{purr}(t) = 0.002 \cdot \cos(50 \cdot t)$$
  4. Hạt tim hồng `VFX_Hearts` bay lơ lửng từ sau gáy.

---

### 4.3. Tương tác chọc bụng (Belly Poke Recoil Bounce)
- **Phát hiện**: Click hoặc tap vào `rig.clickTargets.belly`.
- **Phản hồi**:
  1. **Nẩy lò xo recoil**: Đột ngột giật nảy thân lên $\Delta Y = +0.12$, thân ép squash $S_y = 0.85$, $S_x = S_z = 1.08$. Sau đó nảy dao động dập tắt dần qua lò xo $\omega_0 = 22.0\text{ rad/s}, \zeta = 0.40$ (nảy 3 nhịp).
  2. Hai chân trước co lên ôm bụng tự vệ.
  3. Lông mày nhíu cáu gắt, tai giật giật.
  4. Âm thanh phát alert `'poke'` qua `pomodoroAudio.playAlertSound('poke')`.
  5. Nếu bị chọc liên tiếp $\ge 3$ lần trong 8 giây: mèo chuyển sang trạng thái cáu quạo, phát ra tia cáu `💢`.

---

### 4.4. Động tác tự nhiên khi rảnh rỗi (Idle Timeout Behaviors)
Khi người dùng không tương tác chuột trong thời gian $T_{idle} > 12.0$ giây, hệ thống tự động kích hoạt ngẫu nhiên 1 trong 3 cử động phụ:
1. **Ngáp vươn vai (Stretch & Yawn)** (Xác suất 40%, thời lượng $3.2$s):
   Thân mèo uốn cong lưng, hai chân trước duỗi thẳng về phía trước, miệng há to $J_{open} = 0.9$, mắt nhắm lim dim, sau đó rùng mình nhẹ rồi trở về tư thế ngồi.
2. **Gãi tai (Ear Scratch)** (Xác suất 35%, thời lượng $2.5$s):
   Đầu nghiêng sang trái $25^\circ$, chân trước/sau giơ lên gãi tai với tần số rung $12\text{ Hz}$ trong 8 nhịp, tai giật liên hồi, sau đó hạ chân xuống.
3. **Liếm mu bàn chân (Paw Lick)** (Xác suất 25%, thời lượng $2.8$s):
   Một bên bàn chân nhấc lên ngang mõm, lưỡi thò ra liếm bàn chân 3 nhịp, bàn chân quệt nhẹ lên mặt lau râu, sau đó đặt chân lại vị trí ban đầu.
- **Cơ chế ngắt (Interruption Guarantee)**: Ngay khi người dùng di chuột hoặc click, động tác rảnh rỗi lập tức bị hủy và chuyển động blend mượt về vị trí theo dõi chuột trong vòng $150$ms.

---

## 5. ĐẶC TẢ R4: KHẨU HÌNH & BIỂU CẢM ĐỒNG BỘ (LIP-SYNC & EMOTION BLEND)

### 5.1. Phân tích phổ Web Audio thời gian thực
- `AnalyserNode` cấu hình `fftSize = 256`, mảng tần số 128 bins.
- Dải tần số giọng nói tiếng Việt chủ đạo: $300\text{ Hz} \dots 3400\text{ Hz}$ tương ứng bins $k \in [2, 22]$.
- Biên độ chuẩn hóa:
  $$E_{voice}(t) = \frac{1}{21} \sum_{k=2}^{22} \text{dataArray}[k]$$
  $$A_{norm}(t) = \text{clamp}\left( \frac{E_{voice}(t) - 14}{105}, 0.0, 1.0 \right)$$

### 5.2. Động học Attack / Decay bất đối xứng (Asymmetric Jaw Kinematics)
Miệng mở rất nhanh khi phát âm (Attack $\sim 30$ms) nhưng khép lại mềm mại tự nhiên (Decay $\sim 75$ms), tránh hiện tượng giật rung nhị phân (binary jitter):
$$J_{target} = A_{norm}^{0.85}$$
$$\text{Nếu } J_{target} > J_{current}: \quad J_{current} \leftarrow \text{lerp}(J_{current}, J_{target}, \Delta t \cdot 28.0)$$
$$\text{Nếu } J_{target} \le J_{current}: \quad J_{current} \leftarrow \text{lerp}(J_{current}, J_{target}, \Delta t \cdot 13.0)$$

### 5.3. Chuyển động hàm (Jaw) và Lưỡi (Tongue)
- Xoay bản lề hàm dưới: $R_{jaw, x} = -0.55 \cdot J_{current}$ rad.
- Hạ cằm xuống dưới: $Y_{jaw} = -0.10 - 0.08 \cdot J_{current}$.
- Độ dày và rung lưỡi:
  $$Y_{tongue} = -0.02 + 0.025 \cdot J_{current} \cdot \sin(26 \cdot t)$$
  $$S_{tongue, z} = 1.0 + 0.25 \cdot J_{current}$$
  $$S_{tongue, x} = 1.0 + 0.10 \cdot J_{current} \cdot \sin(20 \cdot t)$$

### 5.4. Đồng bộ biểu cảm đa bộ phận theo tính cách và lời thoại
| Nhân cách / Trạng thái | Lông mày (`browL/R`) | Mí mắt (`upperEyelid`) | Tai (`earL/R`) | Râu (`whiskers`) | Tư thế đầu |
|---|---|---|---|---|---|
| **Cô giáo chủ nhiệm (Mắng gắt)** | Nhíu dốc vào trong $R_z = \mp 0.38$ | Nheo dữ dội $E = -0.58$ | Bẻ ngang ra sau $R_z = \pm 0.55$ | Giương thẳng về trước | Chồm sát camera $R_x = -0.18$ |
| **Sếp khó tính (Mỉa mai)** | Một bên nhướng cao $R_z = +0.25$, một bên nhíu $R_z = -0.30$ | Mắt châm chọc $E_L = -0.4, E_R = -0.7$ | Tai hơi cụp | Rung nhịp | Đầu lắc nhẹ sang bên |
| **Senpai đanh đá (Tsundere)** | Cau mày vểnh $R_z = \mp 0.32$ | Đảo mắt sang góc khác | Tai giật liên hồi | Vểnh cong | Quay ngoắt mặt đi $R_y = 0.4$ |
| **Ăn mừng hoàn thành (Praise)** | Nhướng cao tươi vui $R_z = \pm 0.22$ | Cười tít mắt $E = -0.38$ | Vểnh đứng kiêu hãnh | Xòe rộng | Gật gù nhịp nhàng |

---

## 6. DANH MỤC TÍNH NĂNG KHẢO SÁT ĐƯỢC (FEATURES DISCOVERED)

| # | Phân loại | Tính năng | Mô tả chi tiết | Đầu vào (Inputs) | Đầu ra (Outputs) | Xử lý lỗi (Error Behavior) | Nguồn khám phá |
|---|---|---|---|---|---|---|---|
| 1 | **R1 Physics** | Squash & Stretch Thể tích | Giữ nguyên thể tích $S_x S_y S_z = 1$ khi nảy và thở | Hệ số $S_y \in [0.5, 1.8]$ | Vector scale $[S_x, S_y, S_z]$ | Kẹp ngưỡng $\ge 0.5$ và $\le 1.8$ | `ORIGINAL_REQUEST.md`, `CatAnimator.ts` |
| 2 | **R1 Physics** | Lò xo má, bụng, tai, râu | Dao động điều hòa suy giảm 2nd-order ODE | $\omega_0, \zeta, \Delta t, x_{target}$ | Vị trí $x(t)$, vận tốc $v(t)$ | Giới hạn $\Delta t \le 0.05$ tránh nổ tích phân | `ORIGINAL_REQUEST.md`, `CatRig.ts` |
| 3 | **R1 Physics** | Đuôi 6 đốt đa tần số | Sóng lan truyền 2 tần số có độ trễ pha từng đốt | Chỉ số đốt $i \in [0, 5]$, thời gian $t$ | Góc xoay $\theta_y(i), \theta_x(i)$ | Trả về góc 0 nếu đốt không tồn tại | `ORIGINAL_REQUEST.md`, `CatProceduralMesh.ts` |
| 4 | **R1 Physics** | Micro-saccades & Blinks | Bước nhảy giật vi mô mắt và chớp mắt cảm xúc | Chu kỳ Poisson, trạng thái cảm xúc | Tọa độ đồng tử $\Delta X, \Delta Y$, góc mí $E_{upper}$ | Giới hạn độ lệch đồng tử $\le 0.02$ | `ORIGINAL_REQUEST.md`, `CatAnimator.ts` |
| 5 | **R2 Lighting** | 3-Point Toon Lighting | Key ấm, Fill mát dịu, Rim lam ngọc nổi bật | Tọa độ ánh sáng, cường độ, màu sắc | Đối tượng `DirectionalLight`, `AmbientLight` | Fallback về ánh sáng mặc định nếu thiếu tham số | `ORIGINAL_REQUEST.md`, `CatCanvas.tsx` |
| 6 | **R2 Lighting** | Dynamic Blob Shadow | Bóng mờ co giãn bán kính và độ mờ theo độ cao $Y$ | Độ cao $Y_{cat}$, tọa độ $(X, Z)$ | Scale mặt phẳng bóng, material opacity | Ngưỡng dưới opacity $\ge 0.08$, scale $\ge 0.40$ | `ORIGINAL_REQUEST.md`, `CatCanvas.tsx` |
| 7 | **R2 VFX** | Hạt tim hồng (`VFX_Hearts`) | Bay bồng bềnh khi xoa đầu hoặc khen thưởng | Vị trí đầu mèo, sự kiện pet | 16 hạt points/sprites bay bồng bềnh | Thu hồi hạt về pool khi hết tuổi thọ | `ORIGINAL_REQUEST.md`, `CatCanvas.tsx` |
| 8 | **R2 VFX** | Tia cáu & Mồ hôi (`VFX_AngerSweat`) | Dấu gân đỏ nhấp nháy hoặc giọt mồ hôi chảy | Sự kiện poke, tab switch, scold | Sprite dấu cáu / giọt mồ hôi | Giới hạn 2 dấu cáu cùng lúc | `ORIGINAL_REQUEST.md`, `CatCanvas.tsx` |
| 9 | **R2 VFX** | Sao lấp lánh (`VFX_Stars`) | Nổ tỏa tròn xoay lấp lánh khi xong Pomodoro | Sự kiện hoàn thành phiên | 24 hạt sao vàng lấp lánh | Tự hủy sau $1.4$s, không rò rỉ bộ nhớ | `ORIGINAL_REQUEST.md`, `CatCanvas.tsx` |
| 10 | **R2 Memory** | Transparent WebGL Dispose | Nền trong suốt 100%, dọn sạch 100% tài nguyên | Unmount component | Giải phóng VRAM, WebGL context, DOM cleanup | Bắt ngoại lệ try-catch khi dispose context | `CatCanvas.tsx`, `CatMaterials.ts` |
| 11 | **R3 Control** | Kéo xoay 3D lò xo hồi vị | Xoay góc nhìn trong giới hạn có độ hồi vị đàn hồi | Drag delta $\Delta X, \Delta Y$ | Góc quay root/camera $Y \in [-25^\circ, 25^\circ], X \in [-12^\circ, 12^\circ]$ | Bắt biên clamp cứng tại giới hạn | `ORIGINAL_REQUEST.md` |
| 12 | **R3 Control** | Xoa đầu & Purr vibration | Hạ tai, nheo mắt, rung thân tần số cao | Pointer hover trên đầu | $R_z(ear) \to 0.75$, rung $\Delta Y = 0.002 \cos(50t)$ | Dừng rung ngay khi chuột rời khỏi đầu | `ORIGINAL_REQUEST.md`, `CatCanvas.tsx` |
| 13 | **R3 Control** | Chọc bụng Recoil Bounce | Nẩy bật thân lên và dao động lò xo 3 nhịp | Click trên bụng | $\Delta Y = 0.12$, squash scale, âm thanh poke | Giới hạn số lần kích hoạt liên tiếp | `ORIGINAL_REQUEST.md`, `CatCanvas.tsx` |
| 14 | **R3 Control** | Động tác rảnh rỗi (Idle Behaviors) | Ngáp vươn vai, gãi tai, liếm chân sau 12s | Bộ đếm thời gian rảnh $T_{idle} > 12$s | Hoạt ảnh tương ứng chạy 2.5–3.2s | Lập tức ngắt chuyển về bình thường khi có chuột | `ORIGINAL_REQUEST.md` |
| 15 | **R4 LipSync** | FFT Web Audio Analysis | Đo biên độ dải tần âm thanh tiếng Việt | `AnalyserNode`, `dataArray[128]` | Độ mở miệng chuẩn hóa $A_{norm} \in [0, 1]$ | Fallback về hàm sin khi không có Web Audio | `audio-engine.ts`, `useCatAudioLipSync.ts` |
| 16 | **R4 LipSync** | Asymmetric Attack/Decay | Mở hàm nhanh 30ms, ngậm hàm mềm 75ms | $A_{norm}$, delta time $\Delta t$ | Độ mở hàm mượt mà $J_{current}$ | Kẹp giá trị trong khoảng $[0.0, 1.0]$ | `CatAnimator.ts` |
| 17 | **R4 LipSync** | Đồng bộ hàm và lưỡi | Hạ cằm, mở hàm dưới, rung phập phồng lưỡi | $J_{current}$ | $R_{jaw, x}, Y_{jaw}, Y_{tongue}, S_{tongue}$ | Khóa độ sâu lưỡi không xuyên thủng sàn miệng | `CatAnimator.ts`, `CatProceduralMesh.ts` |
| 18 | **R4 Emotion** | Biến đổi cảm xúc đa bộ phận | Đồng bộ lông mày, mí, tai, râu theo tính cách | Trạng thái cảm xúc, nhân cách | Ma trận góc quay các khớp biểu cảm | Giữ nguyên tư thế an toàn khi chuyển đổi state | `CatAnimator.ts`, `CatStateMachine.ts` |

---

## 7. CÁC TRƯỜNG HỢP BIÊN & NGOẠI LỆ (EDGE CASES)

| # | Tính năng | Dữ liệu đầu vào bất thường (Input) | Hành vi quan sát / Yêu cầu bắt buộc |
|---|---|---|---|
| 1 | **Bảo toàn thể tích** | $S_y = 0.0$ hoặc $S_y < 0$ (Lỗi dữ liệu nảy âm) | Clamp cứng $S_y \ge 0.50$ để tránh chia cho 0 hoặc căn số âm gây ra `NaN`. |
| 2 | **Lò xo suy giảm** | Delta time cực lớn $\Delta t = 2.5$s (do người dùng chuyển tab rồi quay lại) | Kẹp $\Delta t \le 0.05$s trong mỗi bước tính, hoặc chạy vòng lặp cố định bước phụ (sub-stepping) để chống nổ tọa độ ra vô cực. |
| 3 | **Kéo xoay 3D** | Chuột kéo ra ngoài mép trình duyệt hoặc màn hình | Lắng nghe sự kiện `pointerup` trên cả `window` để đảm bảo luôn kích hoạt hồi vị lò xo, không bị kẹt góc nhìn lệch. |
| 4 | **Web Audio Lip-Sync** | Trình duyệt cấm Auto-play, API TTS lỗi hoặc không có quyền Micro/Audio | `pomodoroAudio` tự động fallback sang `speakFallback` (Web Speech API) hoặc dao động nhép giọng ước lượng ngẫu nhiên mượt mà, không bao giờ làm đứng ứng dụng. |
| 5 | **VFX Particles** | Người dùng liên tục spam click chọc bụng 50 lần trong 2 giây | Bộ đệm Object Pool giới hạn tối đa số hạt (16 hạt tim, 24 sao); tái sử dụng hạt cũ nhất (FIFO ring-buffer) thay vì cấp phát thêm bộ nhớ. |
| 6 | **Giảm chuyển động (Reduced Motion)** | Người dùng bật tùy chọn `reducedMotion = true` hoặc hệ điều hành bật `prefers-reduced-motion` | Tắt hiệu ứng rung giật nảy mạnh, tắt các hạt VFX bay tán xạ, chuyển sang fade êm và giảm 80% biên độ lắc đuôi/nhịp thở. |
| 7 | **Động tác rảnh rỗi** | Đang chạy cử động gãi tai thì người dùng bất ngờ click chọc bụng | Hủy ngay lập tức chuỗi cử động rảnh rỗi, blend chuyển đổi về trạng thái `poked` trong $\le 100$ms mà không bị giật khung hình. |
| 8 | **Thiết bị không hỗ trợ WebGL** | Trình duyệt cũ hoặc tắt tăng tốc phần cứng GPU | `CatCanvas` tự động chuyển sang chế độ 2D Fallback (`/images/leo-turnaround.png`) hoàn toàn trong suốt và cho phép click tương tác. |

---

## 8. ĐẶC TẢ KIỂM THỬ & TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA & TEST SPEC)

### 8.1. Tiêu chí nghiệm thu kỹ thuật (Acceptance Criteria)
1. **Kiểm tra kiểu dữ liệu và biên dịch**:
   - Lệnh `npm run typecheck` trong thư mục `web/` chạy thành công với **0 lỗi TypeScript**.
   - Bộ test `node --test tests/pomodoro-leo.test.ts` chạy thành công **100% các ca kiểm thử** (không có lỗi hay cảnh báo cú pháp).
2. **Nguyên lý chuyển động và vật lý**:
   - Hàm bảo toàn thể tích chứng minh toán học: $\forall S_y \in [0.6, 1.5]: |S_x S_y S_z - 1.0| < 0.015$.
   - Bộ dao động lò xo điều hòa suy giảm hồi tụ chính xác về giá trị đích mà không bị lệch pha vĩnh viễn.
   - Chuỗi động học đuôi 6 đốt bảo đảm tính đơn điệu của độ trễ pha $\phi_i = i \cdot \phi_0$ với $\phi_0 > 0$.
3. **Ánh sáng, VFX và bộ nhớ**:
   - Đủ 3 nguồn sáng phân biệt Key, Fill, Rim với màu sắc và cường độ xác định.
   - Bóng đổ tiếp xúc co giãn bán kính nghịch đảo với độ cao $Y$ của mèo.
   - Hệ thống hạt sử dụng bộ nhớ tĩnh (pool), không tạo mới đối tượng trong chu kỳ render.
4. **Tương tác chuột**:
   - Giới hạn góc kéo quay 3D tuân thủ nghiêm ngặt: $Y \in [-25^\circ, +25^\circ]$, $X \in [-12^\circ, +12^\circ]$.
   - Khi nhả chuột, góc quay tự hồi vị về $(0, 0)$ bằng cơ chế lò xo.

---

### 8.2. Danh mục các ca kiểm thử bổ sung cho `tests/pomodoro-leo.test.ts`
Các hàm toán học, logic động học và vật lý của Mèo Leo cần được bóc tách dạng thuần túy (pure functions) để kiểm thử độc lập mà không phụ thuộc vào WebGL Context phần cứng:

| Nhóm test | Tên ca kiểm thử | Điều kiện đầu vào | Kết quả kỳ vọng (Assertion) |
|---|---|---|---|
| **R1 Physics** | `VolumePreservation: preserves unit volume across squash and stretch bounds` | $S_y \in [0.6, 0.8, 1.0, 1.25, 1.5]$ | $S_x = S_z = 1/\sqrt{S_y}$; $|S_x \cdot S_y \cdot S_z - 1.0| < 10^{-6}$. |
| **R1 Physics** | `SpringOscillator: underdamped spring oscillates and decays to target` | $\omega_0 = 14, \zeta = 0.45, x_0 = 1.0, x_{target} = 0.0$ | Sau 2 chu kỳ: $x$ đảo dấu (có vọt lố qua 0); sau 1.5s: $|x| < 0.05$. |
| **R1 Physics** | `TailKinematics: 6 segments exhibit monotonic phase delay and amplitude amplification` | 6 đốt $i = 0 \dots 5$, $t = 1.0$s | Pha mỗi đốt thỏa mãn $\phi_{i+1} > \phi_i$; biên độ đốt ngọn lớn hơn đốt gốc. |
| **R1 Physics** | `MicroSaccades: eye drift and jump stay strictly within anatomical thresholds` | Chạy 100 bước saccades | $|\Delta X| \le 0.015$, $|\Delta Y| \le 0.010$. |
| **R2 Lighting** | `ContactShadow: radius and opacity diminish monotonically with elevation` | $h = 0.0, 0.2, 0.5, 1.0$ | $R(h_2) < R(h_1)$ và $\alpha(h_2) < \alpha(h_1)$ khi $h_2 > h_1$. |
| **R3 Controls** | `DragRotationClamp: yaw and pitch strictly bounded within specified limits` | Kéo chuột cực lớn: $\Delta X = 5000, \Delta Y = 5000$ | $|\theta_y| \le 25^\circ$ ($0.4363$ rad); $|\theta_x| \le 12^\circ$ ($0.2094$ rad). |
| **R3 Controls** | `SpringReturn: rotation smoothly converges to zero upon release` | $\theta_{start} = 0.40$, target $= 0.0$ | Sau 0.6s: $|\theta| < 0.005$ rad. |
| **R3 Controls** | `IdleTimeout: triggers appropriate idle action after 12 seconds inactivity` | $T_{idle} = 12.5$s | Trả về một trong các trạng thái: `stretch_yawn`, `ear_scratch`, `paw_lick`. |
| **R4 LipSync** | `AsymmetricJaw: attack rate is substantially faster than decay rate` | Bước mở $0 \to 1$ vs bước đóng $1 \to 0$ | Thời gian đạt 90% khi mở $< 45$ms; thời gian khép $> 60$ms. |
| **R4 Emotion** | `EmotionBlend: all facial features map congruently to personality states` | State: `scolding_extreme`, `celebrating`, `warning`, `break` | Lông mày, mí mắt và tai có tọa độ góc tương ứng chính xác. |

---

## 9. KẾT LUẬN & HƯỚNG DẪN DÀNH CHO BƯỚC THIẾT KẾ & THI CÔNG

Bản đặc tả đã số hóa toàn bộ các công thức toán học, thuật toán động học, mô hình ánh sáng studio, vòng đời hạt VFX và cơ chế tương tác người dùng theo chuẩn hoạt hình Disney/Pixar cao cấp dành cho Mèo Leo CampusOS. 

Các kỹ sư tiếp theo có thể trực tiếp triển khai:
1. `src/components/cat/CatPhysics.ts`: Chứa các hàm toán học thuần túy (`computeSquashStretchScale`, `updateSpring`, `computeTailWaveSegment`, `computeShadowScaleAndOpacity`).
2. Nâng cấp `CatAnimator.ts`: Tích hợp các bộ lò xo, máy trạng thái cử động rảnh rỗi và làm mịn lip-sync bất đối xứng.
3. Nâng cấp `CatCanvas.tsx`: Tích hợp bộ nguồn sáng 3 điểm, hệ thống hạt VFX pooling, bộ lắng nghe kéo xoay 3D và tương tác xoa đầu/chọc bụng.
4. Mở rộng `tests/pomodoro-leo.test.ts`: Bổ sung toàn diện các bài test toán học và động học được liệt kê tại Mục 8.2.

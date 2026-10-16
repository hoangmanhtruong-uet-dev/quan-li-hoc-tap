# Báo Cáo Khảo Sát Kiến Trúc Nhân Vật Mèo Leo 3D (Three.js) & Màn Hình Pomodoro CampusOS

**Người thực hiện**: `explorer_leo_survey_1`  
**Ngày khảo sát**: 2026-10-13  
**Phạm vi**: `web/` (Next.js 14 App Router, Three.js, Web Audio TTS, Pomodoro modal/screen, tests)  
**Yêu cầu gốc**: `ORIGINAL_REQUEST.md` (timestamp `## 2026-10-13T17:18:44Z`) — Nâng cấp nhân vật Mèo Leo (Three.js) đạt chuẩn hoạt hình 3D toon cao cấp phong cách Disney/Pixar.

---

## 1. Tóm Tắt Tổng Quan (Executive Summary)

Dự án CampusOS hiện đã sở hữu một hệ thống nhân vật Mèo Leo 3D hoàn chỉnh được dựng bằng **Three.js thủ tục (Procedural Meshes)** kết hợp Cel/Toon Shading (`MeshToonMaterial` + `DataTexture` bậc thang 4 dải sáng). Nhân vật được tích hợp trực tiếp vào màn hình Pomodoro kỷ luật (`StrictPomodoroModal`) thông qua component `<CatCanvas>`, kết nối với bộ máy phát âm thanh Web Audio & Microsoft Neural TTS tiếng Việt miền Bắc (`pomodoroAudio`) và hook đồng bộ khẩu hình (`useCatAudioLipSync`).

Tuy nhiên, so với tiêu chuẩn phim hoạt hình 3D toon Disney/Pixar trong bản yêu cầu nghiệp vụ, hệ thống hiện tại đang bộc lộ những khoảng cách kỹ thuật cụ thể:
1. **Chuyển động & Vật lý (R1)**: Nhịp thở hiện tại chỉ phóng to trục Z của bụng dạng tuyến tính, chưa áp dụng nguyên lý **Squash & Stretch bảo toàn thể tích** ($S_x \cdot S_y \cdot S_z \approx 1$). Tai, má, bụng và râu chưa có dao động lò xo suy giảm (**damped spring / harmonic oscillator**). Đuôi 6 đốt mới chỉ uốn sóng 1 tần số cơ bản, mắt chưa có cử động giật vi mô (**micro-saccades**).
2. **Ánh sáng & VFX (R2)**: Hệ thống ánh sáng mới có 2 đèn định hướng (Key ấm + Rim lam ngọc) và Ambient, thiếu **Fill light mát dịu** để hoàn thiện chuẩn **3-point studio lighting**. Bóng đổ tiếp xúc chân mèo (`blob shadow`) hoàn toàn tĩnh, chưa co giãn bán kính và độ mờ theo độ cao nảy người Y. Chưa có hệ thống hạt **VFX WebGL** (thả tim khi xoa đầu, tia cáu khi bị chọc, sao lấp lánh khi hoàn thành).
3. **Tương tác chuột (R3)**: Chưa có tính năng **kéo chuột xoay góc nhìn 3D** giới hạn $\pm 25^\circ$ trục Y và $\pm 12^\circ$ trục X kèm cơ chế hồi vị đàn hồi khi thả tay. Tương tác xoa đầu chưa có hiệu ứng hạ tai, lim dim, rung rơn (purr) và hạt tim. Tương tác chọc bụng chưa có nảy lò xo recoil. Thiếu máy trạng thái các cử động tự nhiên khi rảnh rỗi (**idle behaviors**: ngáp vươn vai, gãi tai, liếm bàn chân).
4. **Hiệu năng & Vòng đời WebGL**: Phát hiện một lỗi quan trọng trong `CatCanvas.tsx`: biến `state` bị đưa vào dependency array của `useEffect` khởi tạo Three.js khiến mỗi lần đổi trạng thái (từ `idle` sang `focusing`, `warning`...), toàn bộ Scene, Renderer và WebGL Context bị huỷ và khởi tạo lại từ đầu, gây chớp nháy và lãng phí GPU. Ngoài ra, các geometry thủ tục chưa được giải phóng đệ trình (`geometry.dispose()`) khi unmount.

---

## 2. Danh Mục Tệp Tin & Vai Trò Trong Hệ Thống (File Inventory)

| Tệp tin | Vị trí | Dòng | Vai trò kiến trúc |
|---|---|---|---|
| **`CatCanvas.tsx`** | `src/components/cat/CatCanvas.tsx` | 327 | Component React bọc Three.js Canvas, quản lý Camera, Renderer nền trong suốt, Lighting, Shadow plane, Raycasting chuột, Vòng lặp Render `requestAnimationFrame`, vòng đời dispose. |
| **`CatRig.ts`** | `src/components/cat/CatRig.ts` | 84 | Khai báo cấu trúc phân cấp khung xương/khớp (`CatRig`), kiểu trạng thái hành động (`CatActionState`), phân loại khẩu hình (`VisemeType`). |
| **`CatProceduralMesh.ts`** | `src/components/cat/CatProceduralMesh.ts` | 410 | Dựng toàn bộ mô hình 3D Mèo Leo từ hình khối thủ tục (Spheres, Cylinders, Boxes, Cones, Torus), tạo lớp viền Toon Outline Inverted Hull, gắn kết các clickTargets tương tác (`belly`, `head`, `pawL`, `pawR`, `tail`). |
| **`CatMaterials.ts`** | `src/components/cat/CatMaterials.ts` | 172 | Bảng màu LEO (`LEO_PALETTE`), tạo `DataTexture` 4 bậc sáng cel-shading (`gradientMap`), cấu hình các `MeshToonMaterial`, `MeshBasicMaterial` và phương thức giải phóng `dispose()`. |
| **`CatAnimator.ts`** | `src/components/cat/CatAnimator.ts` | 358 | Lớp điều khiển diễn hoạt: chớp mắt ngẫu nhiên, mở hàm/rung lưỡi lip-sync, giật tai, nhịp thở bụng, vẫy đuôi 6 đốt, xoay đầu/mắt look-at chuột, các tư thế tay theo State. |
| **`CatStateMachine.ts`** | `src/components/cat/CatStateMachine.ts` | 50 | Hàm thuần tuý `determineCatState` phân giải ngữ cảnh Pomodoro (`PomodoroCatContext`) thành `CatActionState`. |
| **`useCatAudioLipSync.ts`** | `src/components/cat/useCatAudioLipSync.ts` | 50 | Hook React đo độ mở miệng từ `pomodoroAudio.getMouthOpenness()` truyền vào `CatAnimator.setJawOpen`. |
| **`accessories/index.ts`** | `src/components/cat/accessories/index.ts` | 152 | Dựng phụ kiện 3D cho 4 nhân cách: Kính tròn + cà vạt đỏ (Cô giáo), cà vạt xanh (Sếp), cổ áo vest (Tổng tài), nơ ruy băng (Tsundere). |
| **`strict-pomodoro-modal.tsx`** | `src/features/pomodoro/strict-pomodoro-modal.tsx` | 746 | Modal học tập chính với 2 chế độ (`extreme_cat` và `chill_breathing`), nhúng `<CatCanvas>`, điều phối đồng hồ đếm ngược, phát hiện đổi tab, kích hoạt thoại mắng/khen, cửa sổ nổi PiP. |
| **`audio-engine.ts`** | `src/features/pomodoro/audio-engine.ts` | 293 | Engine Web Audio: `AudioContext`, `AnalyserNode` đo biên độ tần số thời gian thực, tổng hợp âm thanh cảnh báo (oscillator), phát giọng TTS qua `/api/tts` và fallback trình duyệt. |
| **`characters-data.ts`** | `src/features/pomodoro/characters-data.ts` | 193 | Dữ liệu cấu hình 4 nhân cách Mèo (`CHARACTERS`), giọng nói, màu lông, kho câu thoại tiếng Việt theo từng tình huống. |
| **`pomodoro-settings-store.ts`** | `src/features/pomodoro/pomodoro-settings-store.ts` | 185 | Store trạng thái cấu hình Pomodoro (`PomodoroSettings`, `PomodoroStats`), đồng bộ `localStorage` và `CustomEvent`. |
| **`pomodoro-supervisor-settings.tsx`** | `src/features/pomodoro/pomodoro-supervisor-settings.tsx` | 352 | Giao diện cấu hình Giám Sát Cực Đoan tại trang `/settings#giam-sat`. |
| **`supervisor-arbiter.ts`** | `src/features/pomodoro/supervisor-arbiter.ts` | 83 | Bộ phân xử kỷ luật: quản lý thời gian cooldown chống mắng dồn dập, miễn trừ tạm thời khi tra tài liệu, tính điểm kỷ luật. |
| **`use-tab-detection.ts`** | `src/features/pomodoro/use-tab-detection.ts` | 114 | Hook phát hiện chuyển tab thông qua `document.visibilitychange` và `window.blur/focus`. |
| **`api/tts/route.ts`** | `src/app/api/tts/route.ts` | 66 | Endpoint Node.js sử dụng `msedge-tts` chuyển văn bản thành MP3 giọng Bắc (`vi-VN-HoaiMyNeural`, `vi-VN-NamMinhNeural`). |
| **`pomodoro-leo.test.ts`** | `tests/pomodoro-leo.test.ts` | 123 | Bộ unit test kiểm tra cài đặt mặc định, máy trạng thái mèo (`CatStateMachine`), và dữ liệu nhân cách. |
| **`supervisor-arbiter.test.ts`** | `tests/supervisor-arbiter.test.ts` | 34 | Bộ unit test kiểm tra thuật toán phân xử vi phạm và tính điểm kỷ luật. |

---

## 3. Kiến Trúc Three.js, Vòng Lặp Render & Vòng Đời WebGL Hiện Tại

### 3.1. Cấu trúc Khởi tạo Cảnh & Camera
- **Scene**: `const scene = new THREE.Scene();` — Giữ nguyên không đặt `scene.background` để đảm bảo nền trong suốt 100%.
- **Camera**: `PerspectiveCamera(40, 420 / 400, 0.1, 30)` đặt tại `(0, 0.52, 4.3)`, nhìn về `(0, 0.45, 0)`. Góc nhìn cận 3/4 chính diện phù hợp nhân vật chibi ngồi trước mặt người học.
- **Renderer**:
  - `alpha: true`, `antialias: true`, `powerPreference: 'high-performance'`, `premultipliedAlpha: true`.
  - Kích thước canvas cố định 420x400 px, `pixelRatio` giới hạn `Math.min(window.devicePixelRatio || 1, 2)`.
  - `clearColor`: `0x000000, 0`.
  - `domElement`: CSS background transparent, object-fit contain.

### 3.2. Hệ Thống Chiếu Sáng Hiện Tại
- `AmbientLight(0xfff7ed, 1.1)`: Ánh sáng môi trường vàng cam nhẹ.
- `DirectionalLight(0xffedd5, 1.3)` tại `(2.8, 4.2, 3.8)`: Key light ấm phía trên bên phải.
- `DirectionalLight(0x67e8f9, 0.85)` tại `(-3.2, 2.5, -2.5)`: Rim light lam ngọc chiếu từ phía sau bên trái tạo viền sáng neon.
- *Nhận xét*: **Thiếu Fill light mát dịu** từ góc đối diện phía trước (`(-2.5, 1.8, 2.5)`), dẫn đến các mảng tối bên trái mặt mèo bị phẳng hoặc quá phụ thuộc vào ambient.

### 3.3. Bóng Đổ Tiếp Xúc (Contact Shadow)
- Sử dụng `PlaneGeometry(1.9, 1.4)` nằm ngang trên mặt phẳng $Y = -0.68$, dán texture Canvas 2D radial gradient đen mềm.
- *Nhận xét*: Bóng hiện tại hoàn toàn cố định (`scale(1, 1, 1)`, `opacity = 0.55`). Khi mèo nảy người lên cao hoặc bị chọc giật mình, bóng không co giãn hay mờ đi theo quy luật vật lý quang học.

### 3.4. Vòng Lặp Render (`requestAnimationFrame`)
- Đo thời gian bằng `THREE.Clock()`, giới hạn delta tối đa `Math.min(clock.getDelta(), 0.1)`.
- Lắng nghe sự kiện `visibilitychange` của trình duyệt: tạm ngưng render khi tab ẩn để tiết kiệm 100% GPU, gọi `clock.getDelta()` khi quay lại tab để tránh bước nhảy delta thời gian lớn.
- Cập nhật animator: `animator.update(delta)`.
- Cập nhật kích thước phụ kiện mượt mà: lerp `scale` từ 0.01 lên 1.0.

### 3.5. Bắt Lỗi Vòng Đời WebGL & Rò Rỉ Bộ Nhớ (Lifecycle Audit)
1. **Lỗi Re-init Scene khi thay đổi State**:
   Trong `CatCanvas.tsx` dòng 274:
   ```ts
   // HIỆN TẠI:
   useEffect(() => {
     // Khởi tạo Scene, Renderer, Mesh...
     return () => {
       // Dispose toàn bộ
     };
   }, [onCanvasReady, reducedMotion, state, visualMode]);
   ```
   Vì `state` nằm trong dependency array, mỗi lần `catState` thay đổi (ví dụ: người dùng bấm bắt đầu học $\rightarrow$ state chuyển từ `idle` sang `focusing`, hoặc khi bị mắng $\rightarrow$ chuyển sang `scolding_medium`), React sẽ huỷ bỏ canvas cũ và khởi tạo một WebGL Context mới tinh!
   Trong khi đó, dòng 54–57 đã có effect riêng:
   ```ts
   useEffect(() => {
     animatorRef.current?.setState(state);
   }, [state]);
   ```
   *Giải pháp*: Phải loại bỏ `state` và `reducedMotion` ra khỏi dependency array của effect khởi tạo Scene.
2. **Thiếu Dispose Geometries Thủ Tục**:
   Hàm cleanup hiện tại gọi `materials.dispose()`, nhưng các `BufferGeometry` được sinh ra trong `buildProceduralLeoCat` (`SphereGeometry`, `CylinderGeometry`, `BoxGeometry`, `ConeGeometry`, `TorusGeometry`) không được giải phóng. Cần bổ sung hàm đệ quy traverse scene để giải phóng toàn bộ geometries.

---

## 4. Đánh Giá Chi Tiết Trạng Thái Hiện Tại Của Mèo Leo 3D

### 4.1. Cấu Trúc Khung Khối 3D (`CatProceduralMesh.ts`)
- **Tỉ lệ tạo hình**: Bám sát chuẩn tranh chibi Cartoon Cat Turnaround với đầu to phúng phính (tỉ lệ chibi 1:1.2 so với thân), thân tròn đầm vững chắc.
- **Các bộ phận khớp**:
  - Thân: Hình cầu bầu dục cam + viền toon outline nâu sẫm + 3 vằn tabby hình xuyến (torus) trên lưng.
  - Bụng: Hình cầu dẹt màu kem gắn phía trước ngực và bụng.
  - Cổ & Ngực: Các nhóm trung gian kết nối thân với đầu và neo phụ kiện (`accessoriesAnchor`).
  - Đầu: Hình cầu elip to ngang + 3 vạch tabby trán chữ M.
  - Tai: 2 hình nón tam giác bo cong, có lòng tai hồng san hô.
  - Mắt: 2 mắt to màu ngọc lục bảo (`eyeGreen`), đồng tử đen hình elip (`pupilBlack`), đốm sáng lung linh trắng (`highlightWhite`), mí mắt trên xoay được để chớp mắt (`upperEyelidL`, `upperEyelidR`).
  - Lông mày: 2 thanh chữ nhật màu tabby nâu sẫm có thể xoay biểu cảm.
  - Mõm: 2 bầu má hình hạt dưa màu kem (chữ $\omega$) + mũi tam giác hồng san hô.
  - Hàm & Miệng: Nhóm `jaw` chứa cằm màu kem, khoang miệng hồng sẫm và lưỡi hồng tươi có thể rung.
  - Râu: 3 râu mảnh màu trắng mỗi bên má.
  - Chân trước: 2 cẳng chân thon gọn với bàn chân kem tròn xoe.
  - Đuôi: Chuỗi 6 đốt khớp xích (`tailSegments[0..5]`) có chóp đuôi tròn màu kem.
  - Vùng Raycast hit-test: `belly`, `head`, `pawL`, `pawR`, `tail`.

### 4.2. Vật Liệu & Cel-Shading (`CatMaterials.ts`)
- Sử dụng `THREE.MeshToonMaterial` kết hợp với `THREE.DataTexture` độ rộng 4 pixel (các ngưỡng độ sáng: 85, 145, 205, 255) tạo hiệu ứng cel-shading 4 bậc rõ rệt chuẩn phong cách hoạt hình Nhật Bản / Toon phương Tây.
- Viền Toon Outline sử dụng kỹ thuật kinh điển **Inverted Hull**: mesh nhân bản với tỉ lệ 1.04–1.05, vật liệu `MeshBasicMaterial` màu nâu sẫm `side: THREE.BackSide`.

### 4.3. Diễn Hoạt Hiện Tại (`CatAnimator.ts`)
- **Chớp mắt (`updateBlinking`)**: Đồng hồ ngẫu nhiên 2–6.5s, xác suất chớp mắt kép 25%. Mí mắt hạ góc xoay theo hình sin. Khi ở chế độ nghỉ (`break`), mắt nhắm hẳn.
- **Khẩu hình (`updateJaw`)**: Nhận `jawOpenTarget` (0–1), nội suy lerp với tốc độ $20 \times \Delta t$, xoay hàm mở ra và hạ cằm xuống, lưỡi rung nhẹ theo hàm sin tần số 26Hz.
- **Giật tai (`updateEarTwitch`)**: Sau 2–7s ngẫu nhiên, tai trái rung giật 4 chu kỳ sin rồi dừng.
- **Hơi thở & Đuôi (`updateBreathingAndTail`)**: Nhịp thở chỉ phóng to/thu nhỏ `belly.scale.z` và `belly.scale.x` theo sóng sin cơ bản. Đuôi uốn lượn lan truyền qua 6 đốt khớp với độ lệch pha $i \times 0.45$.
- **Xoay đầu & Liếc mắt (`updateHeadAndEyes`)**: Đầu xoay theo toạ độ chuột qua lerp giảm chấn, đồng tử dịch chuyển nhẹ theo hướng nhìn, lông mày xoay theo cảm xúc tương ứng từng State.
- **Cử chỉ tay (`updateArmsAndPaws`)**: Đặt các góc xoay khác nhau cho tay trái/phải theo trạng thái (`idle`, `focusing`, `warning`, `scolding`, `celebrating`, `break`, `poked`).

### 4.4. Tương Tác Chuột & Âm Thanh (`CatCanvas.tsx`, `audio-engine.ts`)
- `mousemove`: Cập nhật góc nhìn đầu mèo và raycast kiểm tra đầu để kích hoạt `triggerHeadPat()`.
- `click`: Raycast trúng bụng, đầu, chân hoặc đuôi để kích hoạt `triggerPoke()`, phát âm thanh quạo (`pomodoroAudio.playAlertSound('poke')`) và kích hoạt câu thoại gắt.
- **Bộ máy âm thanh Web Audio**:
  - Gọi API `/api/tts` gửi văn bản câu thoại tiếng Việt, nhận về luồng âm thanh MP3 (Microsoft Edge Neural TTS), giải mã thành `AudioBuffer`.
  - Kết nối luồng qua `AnalyserNode` (FFT size 256, tần số 2..40) để tính biên độ năng lượng giọng nói theo thời gian thực trả về qua `getMouthOpenness()`.
  - Có cơ chế fallback bằng Web Speech API `SpeechSynthesisUtterance` với giọng `vi-VN` khi offline hoặc lỗi mạng.

---

## 5. Bản Đồ Nâng Cấp Chuẩn Hoạt Hình Disney/Pixar (Gap Analysis & Blueprint)

Bảng đối chiếu yêu cầu nghiệp vụ và giải pháp kỹ thuật cụ thể:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PIXAR-GRADE TOON UPGRADE ARCHITECTURE                │
├────────────────────────────────────────────────────────────────────────┤
│ 1. PRINCIPLES OF ANIMATION (R1)                                        │
│    • Volume-preserving Squash & Stretch: Sx * Sy * Sz ≈ 1.0            │
│    • Damped Spring Physics: d²x/dt² = -k*(x - x0) - c*v               │
│      Applied to: Ears, Cheeks, Belly, Whiskers                         │
│    • Multi-harmonic Wave Propagation on 6-segment Tail:                │
│      θ_i(t) = A1*sin(ω1*t - k1*i) + A2*sin(ω2*t - k2*i) + drag_i      │
│    • Biological Micro-saccades (pupil jitter) & Expressive Blinks      │
├────────────────────────────────────────────────────────────────────────┤
│ 2. STUDIO 3-POINT LIGHTING & VFX (R2)                                  │
│    • Key Light (warm front-right) + Fill Light (cool front-left) +     │
│      Rim Light (cyan back-left) + Soft Ambient                         │
│    • Dynamic Soft Contact Shadow (scales diameter & opacity with Y)    │
│    • WebGL Particle System (Points/Sprites, zero external deps):       │
│      - Floating Pink Hearts (petting, praise)                          │
│      - Comic Angry Sparks & Sweat Drops (poked, scolding)              │
│      - Sparkle Stars (session completed celebration)                   │
├────────────────────────────────────────────────────────────────────────┤
│ 3. INTERACTIVE CONTROLS & BEHAVIORS (R3)                               │
│    • Mouse Drag 3D Rotation (±25° Yaw, ±12° Pitch) with Elastic Spring │
│      return-to-center upon pointerup                                   │
│    • Cursor Petting: drooped ears, blissful squint, 28Hz purr vibr,     │
│      continuous floating hearts VFX                                    │
│    • Belly Poke: sudden recoil squash -> spring rebound bounce         │
│    • Natural Idle Behaviors (after 10s inactivity):                    │
│      Yawn & Stretch | Ear Scratch Tilt | Paw Grooming                  │
├────────────────────────────────────────────────────────────────────────┤
│ 4. LIP-SYNC & EMOTION BLEND (R4)                                       │
│    • Spring-smoothed jaw opening & frequency-reactive tongue flutter   │
│    • Dynamic eyebrow, eyelid & ear blending synced with speech & role  │
└────────────────────────────────────────────────────────────────────────┘
```

### Chi tiết giải pháp kỹ thuật cho từng hạng mục:

#### Hạng mục R1: Hoạt ảnh Sinh động & Vật lý Thứ cấp (Secondary Motion & Squash/Stretch)
1. **Squash & Stretch bảo toàn thể tích**:
   - Công thức: Khi tỷ lệ trục thẳng đứng là $S_y$, hai trục ngang phải mở rộng tỷ lệ nghịch $S_x = S_z = \frac{1}{\sqrt{S_y}}$ để đảm bảo:
     $$S_x \cdot S_y \cdot S_z = \frac{1}{\sqrt{S_y}} \cdot S_y \cdot \frac{1}{\sqrt{S_y}} = 1.0$$
   - Ứng dụng:
     - Nhịp thở: $S_y = 1.0 + A_{breath} \cdot \sin(\omega t)$, biến dạng đồng thời thân và ngực.
     - Tiếp đất / bị chọc: Khi bị tác động, $S_y$ bị nén xuống $0.85$, $S_x, S_z$ phình ra $1.085$, sau đó bung giãn nảy lên $S_y = 1.12$, rồi dao động tắt dần về $1.0$.
2. **Dao động lò xo suy giảm (Harmonic Oscillators)**:
   - Xây dựng lớp vật lý nhẹ `DampedSpring`:
     ```ts
     class DampedSpring {
       value = 0;
       velocity = 0;
       target = 0;
       stiffness = 180; // Độ cứng k
       damping = 14;    // Hệ số giảm chấn c
       update(delta: number) {
         const force = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
         this.velocity += force * delta;
         this.value += this.velocity * delta;
       }
     }
     ```
   - Áp dụng độc lập cho:
     - `earSpringL`, `earSpringR`: Dao động khi đầu xoay hoặc giật tai.
     - `cheekSpring`: Dao động phúng phính khi đầu lắc hoặc bị chọc.
     - `bellySpring`: Độ nảy đàn hồi của bụng.
     - `whiskerSpring`: Râu uốn cong theo quán tính khi quay đầu.
3. **Uốn sóng đuôi 6 đốt nhiều bậc (Multi-frequency Wave Propagation)**:
   - Thay thế sóng đơn bằng tổ hợp hai sóng điều hoà kết hợp quán tính uốn:
     $$\theta_i(t) = A_1 \sin(\omega_1 t - k_1 i) + A_2 \sin(\omega_2 t - k_2 i + \phi) + \text{InertiaDrag}_i$$
   - Giúp chuyển động của đuôi mèo mềm mại, có gợn sóng từ gốc lan đến chóp như phim hoạt hình Pixar, không bị đơ cứng như một thanh kim loại.
4. **Cử động giật vi mô (Micro-saccades) & Biểu cảm mắt**:
   - Cứ mỗi 0.4–1.2s ngẫu nhiên, tạo một cú giật vi mô $\delta_x, \delta_y \in [-0.006, 0.006]$ vào vị trí đồng tử mô phỏng chuyển động sinh học mắt thật.
   - Khi được xoa đầu: mí mắt khép hờ góc $-0.25$ rad tạo ánh nhìn lim dim hưởng thụ.
   - Khi cảnh báo: nheo mắt sắc cạnh. Khi bị mắng gắt: mở trừng mắt to, đồng tử giãn.

#### Hạng mục R2: Ánh sáng Studio Toon 3D & VFX Hạt
1. **Chiếu sáng 3 điểm Studio Toon**:
   - `Key Light`: Directional Light vàng ấm `0xfff1e6`, cường độ 1.35, góc `(2.8, 4.0, 3.5)`.
   - `Fill Light`: Directional Light lam tím dịu `0xa5b4fc`, cường độ 0.65, góc `(-2.8, 2.0, 2.8)`.
   - `Rim / Back Light`: Directional Light cyan nổi bật `0x38bdf8`, cường độ 1.15, góc `(-3.2, 3.0, -3.2)`.
   - `Ambient Light`: `0xfff7ed`, cường độ 0.75 giữ độ tương phản cel-shading sắc nét.
2. **Bóng tiếp xúc động (Dynamic Contact Shadow Blob)**:
   - Trong vòng lặp render, đọc độ cao $Y$ của thân mèo (`rig.body.position.y`):
     - Khi thân nảy lên cao: bán kính bóng mở rộng nhẹ, độ mờ (`opacity`) giảm theo hàm suy giảm $e^{-\lambda \Delta Y}$.
     - Khi thân bị nén sát đất: bán kính bóng thu nhỏ, độ mờ tăng lên đậm đặc (tạo cảm giác tiếp xúc chặt với mặt sàn).
3. **Hệ thống hạt VFX WebGL (Points / Canvas Textures)**:
   - Xây dựng một module quản lý hạt `CatVfxSystem` đính vào Three.js scene:
     - Tạo 3 texture thủ tục từ Canvas 2D (trái tim hồng, tia sét/giọt mồ hôi cáu, ngôi sao vàng 4 cánh lấp lánh).
     - Quản lý mảng hạt có toạ độ, vận tốc, vòng đời (lifespan) và độ trong suốt.
     - Khi xoa đầu: phát sinh hạt tim hồng bay lơ lửng từ đỉnh đầu mèo bồng bềnh lên trên.
     - Khi chọc bụng: bật ra tia cáu / giọt mồ hôi hoạt hình giật nảy.
     - Khi hoàn thành phiên: phát nổ chùm sao lấp lánh xoay tròn xung quanh mèo.
     - Toàn bộ geometry và texture của hệ thống hạt được giải phóng khi unmount.

#### Hạng mục R3: Tương Tác Phản Hồi Chuột (Interactive Physics & Controls)
1. **Kéo xoay chuột 3D có độ đàn hồi hồi vị**:
   - Lắng nghe `pointerdown`, `pointermove`, `pointerup` trên canvas:
     - Cho phép người dùng kéo nhẹ chuột để xoay toàn bộ nhân vật quanh trục Y (giới hạn $\pm 25^\circ \approx \pm 0.436\text{ rad}$) và trục X (giới hạn $\pm 12^\circ \approx \pm 0.209\text{ rad}$).
     - Khi nhấc chuột ra (`pointerup`), hệ lò xo damped spring tự động kéo góc quay trở về $(0, 0)$ một cách êm ái, có độ nhún nhẹ khi về vị trí cân bằng.
2. **Tương tác xoa đầu (Cursor Petting)**:
   - Khi con trỏ chuột hover liên tục trên đầu mèo:
     - Hạ nhẹ 2 tai xuống 2 bên.
     - Khép mí mắt lim dim.
     - Toàn bộ thân mèo rung nhẹ tần số cao (28Hz, biên độ cực nhỏ 0.003) mô phỏng tiếng mèo rơn (purr vibration).
     - Phun hạt tim VFX hồng lơ lửng.
3. **Tương tác chọc bụng**:
   - Khi click vào bụng: kích hoạt lực nén nảy lò xo recoil (bụng thụt vào rồi bung nảy lên), tai vẫy cáu, phát âm thanh poke và hạt cáu.
4. **Hành vi tự nhiên khi rảnh rỗi (Idle Behaviors)**:
   - Thiết lập bộ đếm thời gian rảnh rỗi: nếu sau 10–14s người dùng không di chuột hoặc bấm chuột, chọn ngẫu nhiên 1 trong 3 cử động:
     - *Ngáp vươn vai*: há to miệng, vươn người ra trước, nhắm mắt rồi thu người về.
     - *Nghiêng đầu gãi tai*: đầu nghiêng một bên, tai giật 3 nhịp liên tiếp.
     - *Liếm chân*: nhấc 1 chân trước lên gần mõm, đầu cúi nhẹ 2 nhịp.

#### Hạng mục R4: Khẩu hình & Biểu cảm Đồng bộ
- Làm mượt biên độ mở cằm qua bộ lọc lò xo thay vì hàm lerp đơn giản, tránh hiện tượng giật cục khi âm thanh ngắt quãng.
- Đồng bộ biểu cảm lông mày, mí mắt và độ vểnh của tai theo từng ngữ cảnh thoại và tính cách nhân vật (Cô giáo nghiêm nghị, Sếp khó tính cau mày, Tổng tài lãnh đạm, Tsundere đỏ mặt).

---

## 6. Đánh Giá Rủi Ro & Điều Kiện Bất Biến (Invariants & Safety Gates)

### 6.1. Điều kiện Bất biến bắt buộc tuân thủ (Hard Invariants)
1. **Bộ test `tests/pomodoro-leo.test.ts` phải pass 100%**:
   - Hàm `determineCatState(ctx: PomodoroCatContext)` trong `CatStateMachine.ts` phải giữ nguyên các nhánh logic và trả về chuẩn xác 7 trạng thái đã được test (`idle`, `focusing`, `warning`, `scolding_extreme`, `celebrating`, `break`, `poked`).
   - `DEFAULT_POMODORO_SETTINGS` và `CHARACTERS` không được làm thay đổi cấu trúc hoặc làm mất câu thoại.
2. **Không lỗi TypeScript (`tsc --noEmit`)**:
   - Chế độ strict mode với `noUncheckedIndexedAccess: true` yêu cầu mọi thuộc tính tuỳ chọn phải được kiểm tra kiểu chặt chẽ.
3. **Nền trong suốt 100%**:
   - `renderer.setClearColor(0x000000, 0)`, `alpha: true`, không thêm bất kỳ nền màu hay khung viền nào vào scene Three.js để giữ tính thẩm mỹ cao cấp trên dark UI của CampusOS.
4. **Không rò rỉ bộ nhớ WebGL**:
   - Tất cả textures, materials, geometries, particle buffers và timers phải được giải phóng triệt để trong hàm cleanup của `useEffect`.

---

## 7. Đề Xuất Phân Chia Triển Khai Cho Đội Ngũ

Để hoàn thành nhiệm vụ theo quy chuẩn Teamwork, kiến nghị phân bổ các giai đoạn tiếp theo như sau:
- **Phase 1: Vật lý & Diễn Hoạt Pixar (R1 + R4)**:
  - Cập nhật `CatRig.ts` bổ sung các thuộc tính lò xo phụ nếu cần.
  - Tái cấu trúc `CatAnimator.ts` tích hợp `DampedSpring`, công thức Squash & Stretch bảo toàn thể tích, sóng đuôi đa hài, micro-saccades mắt, và khẩu hình mượt mà.
- **Phase 2: Ánh Sáng Studio, Bóng Đổ Động & VFX WebGL (R2)**:
  - Nâng cấp `CatCanvas.tsx` với hệ thống 3-point toon lighting (bổ sung Fill Light).
  - Tích hợp bóng đổ động co giãn theo trục Y.
  - Viết module hạt VFX (`CatVfxManager`) tạo hạt tim, hạt cáu, hạt sao bằng CanvasTexture thủ tục.
- **Phase 3: Tương Tác Chuột Đàn Hồi & Hành Vi Tự Nhiên Khi Rảnh (R3)**:
  - Thêm xử lý kéo chuột xoay 3D có hồi vị đàn hồi trong `CatCanvas.tsx`.
  - Bổ sung tương tác xoa đầu (purr vibration + tim) và chọc bụng nảy lò xo.
  - Bổ sung máy trạng thái hành vi rảnh rỗi (`idle behaviors`).
- **Phase 4: Sửa lỗi Vòng đời & Kiểm thử Toàn diện**:
  - Khắc phục triệt để lỗi re-init context trong `CatCanvas.tsx`.
  - Đảm bảo đệ quy `geometry.dispose()` khi unmount.
  - Chạy `npm run typecheck`, `node --test tests/pomodoro-leo.test.ts` và kiểm thử giao diện thực tế.

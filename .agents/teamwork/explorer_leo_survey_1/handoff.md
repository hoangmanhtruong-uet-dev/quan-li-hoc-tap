# Handoff Report — explorer_leo_survey_1

**Milestone**: Leo 3D Character Upgrade Survey (Pixar-grade Toon Quality)  
**Agent**: `explorer_leo_survey_1`  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_leo_survey_1\`  
**Date**: 2026-10-13  
**Handoff Type**: Hard (Investigation complete)

---

## 1. Observation

1. **Vị trí và cấu trúc nhân vật 3D Mèo Leo**:
   - Nhân vật Mèo Leo Three.js được tổ chức thành một cụm component thủ tục chuyên biệt tại thư mục `src/components/cat/`:
     - `src/components/cat/CatCanvas.tsx` (327 dòng): Component React bọc Three.js Canvas. Khởi tạo `THREE.Scene`, `PerspectiveCamera(40, 420 / 400, 0.1, 30)` tại `(0, 0.52, 4.3)`, `WebGLRenderer` với `alpha: true`, `clearColor: (0, 0)`.
     - `src/components/cat/CatProceduralMesh.ts` (410 dòng): Xây dựng mô hình 3D thủ tục bằng Three.js primitives (`SphereGeometry`, `CylinderGeometry`, `BoxGeometry`, `ConeGeometry`, `TorusGeometry`) kèm lớp viền toon outline inverted hull và click targets (`belly`, `head`, `pawL`, `pawR`, `tail`).
     - `src/components/cat/CatMaterials.ts` (172 dòng): Bảng màu `LEO_PALETTE`, tạo `DataTexture` 4 bậc sáng cel-shading (ngưỡng `85, 145, 205, 255`) cho `MeshToonMaterial`, kèm hàm `dispose()`.
     - `src/components/cat/CatRig.ts` (84 dòng): Định nghĩa phân cấp khớp (`CatRig`), trạng thái hành động (`CatActionState`), và phân loại khẩu hình (`VisemeType`).
     - `src/components/cat/CatAnimator.ts` (358 dòng): Điều khiển chớp mắt, khẩu hình nhép theo audio, giật tai, nhịp thở bụng, vẫy đuôi 6 đốt, look-at chuột, tư thế tay theo state.
     - `src/components/cat/CatStateMachine.ts` (50 dòng): Hàm `determineCatState` chuyển ngữ cảnh Pomodoro thành `CatActionState`.
     - `src/components/cat/useCatAudioLipSync.ts` (50 dòng): Hook điều khiển mở hàm theo biên độ audio `pomodoroAudio.getMouthOpenness()`.
     - `src/components/cat/accessories/index.ts` (152 dòng): Phụ kiện cho 4 nhân cách (`co-giao-chu-nhiem`, `sep-kho-tinh`, `tong-tai-ba-dao`, `anime-tsundere`).

2. **Tích hợp trong Modal Pomodoro**:
   - `src/features/pomodoro/strict-pomodoro-modal.tsx`:
     - Dòng 27: `import { CatCanvas } from '@/components/cat/CatCanvas';`
     - Dòng 417-428: Tính toán `catState` bằng `determineCatState(...)`.
     - Dòng 567-576: Render `<CatCanvas characterSlug={characterSlug} state={catState} isSpeaking={isSpeaking} visualMode={settings.visualMode} reducedMotion={settings.reducedMotion} onPoke={handlePokeCat} onCanvasReady={handleCanvasReady} />`.
     - Nền modal là gradient tối mờ, Mèo Leo 3D hiển thị không viền nền, trong suốt 100%.

3. **Hệ thống Âm thanh & TTS**:
   - `src/features/pomodoro/audio-engine.ts`:
     - Sử dụng `AudioContext` và `AnalyserNode` (`fftSize = 256`, `frequencyBinCount = 128`).
     - Phương thức `getMouthOpenness()` lấy trung bình 38 dải tần số đầu: `Math.min(1, Math.max(0, (avg - 12) / 105))`.
     - `speak(text)`: Gửi POST tới `/api/tts`, giải mã buffer bằng `ctx.decodeAudioData`, phát qua `AudioBufferSourceNode` nối vào `AnalyserNode` và `ctx.destination`.
   - `src/app/api/tts/route.ts`:
     - Sử dụng thư viện `msedge-tts` với các giọng Neural tiếng Việt chuẩn miền Bắc: `vi-VN-HoaiMyNeural` (nữ) và `vi-VN-NamMinhNeural` (nam), trả về stream MP3 24kHz.

4. **Tình trạng kiểm thử và build hiện tại**:
   - Lệnh `node --experimental-strip-types --test tests/pomodoro-leo.test.ts` trong `web/`:
     ```
     ✔ PomodoroSettings: default values are valid and populated (0.5533ms)
     ✔ CatStateMachine: maps context to correct cat action states (0.1503ms)
     ✔ CharacterData: all 4 characters exist and have valid quotes (0.152ms)
     ℹ tests 3, pass 3, fail 0
     ```
   - Lệnh `node --experimental-strip-types --test tests/supervisor-arbiter.test.ts`:
     ```
     ✔ SupervisorArbiter cho phép mắng lần đầu và áp dụng cooldown (0.8301ms)
     ✔ SupervisorArbiter tôn trọng thời gian miễn trừ (Tôi đang tra tài liệu) (0.1836ms)
     ✔ SupervisorArbiter tính điểm kỷ luật chính xác theo số lần vi phạm (0.1408ms)
     ℹ tests 3, pass 3, fail 0
     ```
   - Lệnh `npm run typecheck` (`tsc --noEmit`) trong `web/`:
     Thành công với exit code 0, 0 lỗi kiểu dữ liệu.

5. **Lỗi hiệu năng & Vòng đời phát hiện trong `CatCanvas.tsx`**:
   - Tại dòng 274 của `CatCanvas.tsx`:
     ```ts
     }, [onCanvasReady, reducedMotion, state, visualMode]);
     ```
     `state` bị đặt trong dependency array của `useEffect` khởi tạo Three.js. Do đó mỗi khi `state` chuyển đổi (ví dụ `idle` sang `focusing`), toàn bộ Scene, Canvas DOM và WebGL Renderer bị destroy và tạo mới hoàn toàn.
   - Các `BufferGeometry` thủ tục sinh ra trong `buildProceduralLeoCat` chưa được gọi `geometry.dispose()` khi component unmount.

---

## 2. Logic Chain

1. **Từ Quan sát 1 & 2**: Nhân vật Mèo Leo 3D hiện tại không dùng file model ngoài (.glb/.gltf) mà được lập trình thủ tục 100% bằng Three.js trong `src/components/cat/`. Điều này giúp ứng dụng tải cực nhanh (0ms download tài nguyên 3D lớn), nhưng đòi hỏi mọi nâng cấp diễn hoạt, ánh sáng và vật lý phải được thực hiện trực tiếp trong mã TypeScript (`CatAnimator.ts`, `CatProceduralMesh.ts`, `CatCanvas.tsx`).
2. **Từ Yêu cầu Nghiệp vụ R1 so với Quan sát 1**:
   - Chuyển động thở hiện tại chỉ điều chỉnh `belly.scale.z` và `belly.scale.x` theo hình sin đơn thuần. Chưa tuân thủ nguyên lý hoạt hình Pixar **Squash & Stretch bảo toàn thể tích**, trong đó $S_x \cdot S_y \cdot S_z \approx 1$.
   - Tai, má, bụng và râu chưa có hệ thống phương trình dao động điều hoà suy giảm (**damped harmonic oscillator**).
   - Đuôi 6 đốt chỉ dao động đơn tần $i \times 0.45$, thiếu giao thoa sóng nhiều bậc (**multi-frequency wave propagation**).
   - Mắt chỉ bám theo vị trí chuột qua lerp, thiếu các vi giật tự nhiên (**micro-saccades**).
3. **Từ Yêu cầu Nghiệp vụ R2 so với Quan sát 1 & 3**:
   - Chiếu sáng hiện tại có Ambient + Key ấm + Rim lam ngọc, thiếu Fill light mát dịu phía trước bên trái để đạt chuẩn **3-point studio lighting**.
   - Bóng đổ tiếp xúc chân mèo (`shadowMesh`) là texture tĩnh, không co giãn kích thước và độ mờ theo độ cao Y của thân mèo khi nảy.
   - Chưa hề có hệ thống hạt VFX WebGL để hiển thị tim hồng khi xoa đầu, tia cáu khi bị chọc, và sao lấp lánh khi kết thúc phiên.
4. **Từ Yêu cầu Nghiệp vụ R3 so với Quan sát 1 & 2**:
   - `CatCanvas.tsx` mới chỉ lắng nghe `mousemove` và `click`, chưa hỗ trợ kéo xoay chuột góc nhìn 3D (giới hạn $\pm 25^\circ$ trục Y, $\pm 12^\circ$ trục X) kèm cơ chế lò xo hồi vị về vị trí cân bằng.
   - Tương tác xoa đầu chưa kích hoạt biểu cảm lim dim hưởng thụ, hạ tai, rung rơn (purr vibration) và thả tim.
   - Thiếu máy trạng thái các cử động tự nhiên khi rảnh rỗi (**idle behaviors**).
5. **Từ Quan sát 4 & 5**:
   - Các bài test hiện tại kiểm tra tính đúng đắn của logic phân loại `CatStateMachine`, `PomodoroSettings` và `SupervisorArbiter`. Bất kỳ thay đổi nào cũng phải bảo tồn nghiêm ngặt các interface và logic này để đảm bảo test pass 100%.
   - Việc loại bỏ `state` khỏi dependency array của effect khởi tạo Three.js và bổ sung dispose geometries là điều kiện tiên quyết để đạt mốc hiệu năng 120FPS không rò rỉ bộ nhớ.

---

## 3. Caveats

1. **Bộ test toàn cục dự án (`npm test`)**: Khi chạy `npm test` bao gồm toàn bộ hơn 220 tests của dự án CampusOS, có 2 test thất bại nằm ở module quản lý công việc chung (`challenger-m1-tasks-reactivity.test.ts` và `tasks-redesign.test.ts`). Các test liên quan trực tiếp đến Pomodoro và Mèo Leo (`tests/pomodoro-leo.test.ts` và `tests/supervisor-arbiter.test.ts`) pass 100%. Nhiệm vụ nâng cấp Mèo Leo không được can thiệp vào các logic của task store ngoài phạm vi.
2. **Thư viện bên ngoài**: Không cài thêm các thư viện vật lý nặng (như ammo.js hay cannon-es) hay thư viện 3D wrapper ngoài Three.js có sẵn (`three: ^0.186.1`). Mọi công thức lò xo và hạt VFX phải được viết bằng toán học thuần tuý để giữ kích thước bundle tối ưu.
3. **Môi trường âm thanh**: Web Audio API yêu cầu người dùng tương tác trước khi phát âm thanh (user activation). Mã hiện tại đã có cơ chế `pomodoroAudio.unlock()` khi click nút hoặc bắt đầu phiên, cần tiếp tục duy trì cơ chế này.

---

## 4. Conclusion

1. Cấu trúc hiện tại của Mèo Leo 3D rất rõ ràng, module hoá sạch sẽ theo mô hình:
   `strict-pomodoro-modal.tsx` $\rightarrow$ `CatCanvas.tsx` $\rightarrow$ `CatProceduralMesh` + `CatMaterials` + `CatAnimator` + `CatRig` + `useCatAudioLipSync`.
2. Toàn bộ các yêu cầu R1 (Squash/Stretch, Spring Physics, Multi-harmonic Tail, Micro-saccades), R2 (3-Point Lighting, Dynamic Shadow Blob, WebGL Particle VFX), R3 (Mouse Drag Rotation with Spring Recoil, Petting Purr & Hearts, Idle Behaviors), và R4 (Smooth Lip-Sync) đều khả thi 100% bằng cách nâng cấp trực tiếp các module trong `src/components/cat/`.
3. Báo cáo khảo sát chi tiết đã được lập tại:
   `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_leo_survey_1\report.md`
4. Codebase sẵn sàng cho bước lập kế hoạch và triển khai code.

---

## 5. Verification Method

Người tiếp nhận hoặc kiểm định viên có thể độc lập xác minh các kết luận trên bằng các bước sau:

1. **Kiểm tra biên dịch TypeScript**:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run typecheck
   ```
   *Kỳ vọng*: Exit code 0, không có lỗi kiểu dữ liệu.

2. **Chạy bộ test Mèo Leo & Pomodoro**:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   node --experimental-strip-types --test tests/pomodoro-leo.test.ts
   node --experimental-strip-types --test tests/supervisor-arbiter.test.ts
   ```
   *Kỳ vọng*: 100% các test pass (3/3 mỗi file).

3. **Kiểm tra các tệp tin được khảo sát**:
   - Xem `report.md` tại:
     `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_leo_survey_1\report.md`
   - Kiểm tra mã nguồn cốt lõi tại:
     - `src/components/cat/CatCanvas.tsx`
     - `src/components/cat/CatProceduralMesh.ts`
     - `src/components/cat/CatAnimator.ts`
     - `src/components/cat/CatMaterials.ts`
     - `src/components/cat/CatRig.ts`
     - `src/features/pomodoro/strict-pomodoro-modal.tsx`
     - `src/features/pomodoro/audio-engine.ts`
     - `src/app/api/tts/route.ts`

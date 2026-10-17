# BÁO CÁO KIỂM TOÁN TÍNH CHÍNH TRỰC (FORENSIC INTEGRITY AUDIT REPORT) — MILESTONE 3

**Work Product**: Milestone 3: AI Webcam Face Tracking (`extension/ai/webcam-tracker.js`, `web/src/features/pomodoro/use-webcam-tracking.ts`, `web/src/features/pomodoro/ai-webcam-modal.tsx`, `web/tests/ai-webcam-tracking.test.ts`)  
**Profile**: General Project  
**Integrity Mode**: `development` (xác định trực tiếp từ `ORIGINAL_REQUEST.md` header `## 2026-10-17T00:51:59Z`)  
**Auditor**: `auditor_m3_1`  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\auditor_m3_1`  
**Verdict**: **CLEAN**

---

## 1. Forensic Audit Phase Results

| # | Kiểm tra (Check Name) | Trạng thái | Chi tiết đối chiếu thực nghiệm |
|---|---|:---:|---|
| 1 | **Hardcoded output detection** | **PASS** | Không phát hiện kết quả hardcode, không có chuỗi kết quả đóng hộp (`canned outputs`) để vượt qua test. Hàm tính toán động trên mọi tập tọa độ. |
| 2 | **Facade detection** | **PASS** | Không có hàm rỗng, không có phương thức trả về hằng số giả tạo (`dummy facades`). Thuật toán toán học và bộ điều phối `WebcamFaceMonitor` chứa logic thật 100%. |
| 3 | **Pre-populated artifact detection** | **PASS** | Không phát hiện tệp log/chứng thực hay kết quả tạo sẵn trước khi kiểm toán. |
| 4 | **Mathematical formula verification** | **PASS** | Công thức khoảng cách Euclid, tỷ lệ mở mắt EAR Soukupová & Čech (2016), và lượng giác tư thế đầu (Yaw/Pitch/Roll) chuẩn xác về mặt giải tích. |
| 5 | **State machine & Duration accumulator** | **PASS** | Bộ tích lũy thời gian `drowsyDurationMs` và `awayDurationMs` đo chính xác float delta, reset tức thì khi mắt mở hoặc quay đầu về, kích hoạt sự kiện đúng mốc $\ge 10.000\text{ ms}$. |
| 6 | **Unit Test Suite Execution** | **PASS** | `node --experimental-strip-types --test tests/ai-webcam-tracking.test.ts`: **37/37 PASS** (143ms, 0 failures, 0 errors). |
| 7 | **Full Regression Test Suite** | **PASS** | `npm test` trong `web/`: **490/490 PASS** trên 27 suites (2879ms, 0 failures, 0 errors). |
| 8 | **TypeScript Type Safety** | **PASS** | `npm run typecheck` (`tsc --noEmit`): **0 errors**. |
| 9 | **Adversarial Stress Test** | **PASS** | Kịch bản tấn công kiểm toán độc lập (`adversarial_forensic_m3.test.mjs`): **6/6 PASS** (không phân kỳ, không chia cho 0, không trôi tích lũy). |

---

## 2. Observation (Quan sát thực nghiệm)

### 2.1 Mã nguồn thuật toán: `extension/ai/webcam-tracker.js`
- **Công thức khoảng cách Euclid `euclideanDistance(p1, p2)` (dòng 77–92)**:
  Sử dụng `Math.hypot(dx, dy, dz)` hỗ trợ đầy đủ không gian 2D và 3D, phòng thủ lỗi tọa độ `null/undefined/non-number` bằng fallback về 0.
- **Công thức tính tỷ lệ mở mắt EAR `calculateEyeAspectRatio(eyePoints)` (dòng 102–126)**:
  Thực hiện trung thực công thức chuẩn của Soukupová & Čech (2016):
  $$\text{EAR} = \frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2 \cdot \|p_1 - p_4\|}$$
  Kiểm tra kích thước mảng $\ge 6$, kiểm tra các điểm mí mắt trên $p_2, p_3$, mí mắt dưới $p_6, p_5$ và hai khóe mắt $p_1, p_4$. Có cơ chế bảo vệ chia cho 0: `if (distC <= 0 || !Number.isFinite(distC)) return 0;`.
- **Chỉ số mốc giải phẫu MediaPipe Face Mesh (dòng 39–50)**:
  - Mắt trái: `LEFT_EYE_LANDMARKS = [33, 160, 158, 133, 153, 144]`.
  - Mắt phải: `RIGHT_EYE_LANDMARKS = [362, 385, 387, 263, 373, 380]`.
  Khớp chính xác 100% với tài liệu đặc tả MediaPipe Face Mesh 468 landmarks.
- **Thuật toán ước lượng góc đầu Head Pose `estimateHeadPose(landmarks)` (dòng 195–280)**:
  - Roll: Tính góc xoay mặt dựa trên độ nghiêng của đoạn thẳng nối hai khóe mắt ngoài `Math.atan2(eyeDy, eyeDx) * (180 / Math.PI)`.
  - Yaw: Tính góc quay trái/phải dựa trên tỷ số độ lệch hoành độ đỉnh mũi so với trung điểm hai mắt `Math.asin(offsetRatio) * (180 / Math.PI)` kèm hiệu chỉnh thị sai trục Z nếu có.
  - Pitch: Tính góc gục đầu/ngửa đầu dựa trên tỷ số khoảng cách từ trục mắt đến mũi so với chiều cao khuôn mặt `(neutralRatio - currentRatio) * 160.0` kèm hiệu chỉnh độ sâu Z giữa trán và cằm.
- **Lớp điều phối `WebcamFaceMonitor` (dòng 333–596)**:
  Quản lý trạng thái (`idle`, `normal`, `drowsy`, `looking_away`, `no_face`), bộ đếm thời gian liên tục (`drowsyDurationMs`, `awayDurationMs`), điều tiết tần số 12fps (khoảng 83ms/frame), cam kết 100% xử lý trên RAM máy khách (`this.localProcessingOnly = true`).

### 2.2 Hook tích hợp: `web/src/features/pomodoro/use-webcam-tracking.ts`
- Quản lý vòng đời `navigator.mediaDevices.getUserMedia` với độ phân giải tiêu chuẩn 640x480 và `facingMode: 'user'`.
- Quản lý trạng thái phân quyền camera: `'idle' | 'prompt' | 'granted' | 'denied' | 'unsupported'`.
- Giải phóng tài nguyên phần cứng sạch sẽ khi tắt camera hoặc unmount: `stream.getTracks().forEach(track => track.stop())`.
- Kết nối hai chiều với `SupervisorArbiter` (tôn trọng thời gian ân hạn `isExempt()` và cooldown 20s giữa các lần mắng), kích hoạt âm thanh cảnh báo và giọng mắng tiếng Việt thông qua `pomodoroAudio`.
- Lưu trữ tùy chọn bật/tắt vào `localStorage` (`campusos_webcam_enabled`) và phát sự kiện `campusos:webcam-toggle`.

### 2.3 Giao diện người dùng: `web/src/features/pomodoro/ai-webcam-modal.tsx`
- Thiết kế Cyber-Glass Neo-Brutal Aurora đồng bộ (`bg-gradient-to-b from-[#121220]/95 to-[#090912]/98`, viền neon `white/15`, màu nhấn acid lime `#C6FF3D`, cyan `#3DE8FF`, neon pink `#FF3DA5`).
- Banner cam kết bảo mật 100% In-Memory Local Processing, không lưu trữ ảnh, không upload máy chủ.
- Khung video preview lật gương tự nhiên (`-scale-x-100`) kèm HUD hiển thị trạng thái và huy hiệu 12.5 FPS LOCAL.
- Đồng hồ đo Bento:
  - Thanh đo EAR kèm vạch đỏ đánh dấu ngưỡng nhắm mắt 0.20.
  - Tâm ngắm trực quan Crosshair 2 chiều biểu diễn góc quay Yaw và gục đầu Pitch kèm vùng an toàn $\pm 30^\circ$.
- Thẻ phản hồi nhân vật giám thị hiển thị câu thoại tiếng Việt theo ngữ cảnh vi phạm.
- Nút bật/tắt `role="switch"`, `aria-checked`, đóng mở an toàn qua `createPortal`.

---

## 3. Logic Chain (Chuỗi suy luận kiểm toán)

1. **Kiểm tra tính chân thực của thuật toán (Authentic vs Facade)**:
   - Trong bài kiểm toán độc lập `adversarial_forensic_m3.test.mjs`, kiểm toán viên đưa vào các bộ tọa độ mắt nhân tạo với độ cao mí mắt $h$ biến thiên liên tục từ $0.5$ đến $5.0$. Kết quả trả về của hàm `calculateEyeAspectRatio` khớp hoàn toàn với phương trình giải tích $EAR = h / 10.0$ với sai số tuyệt đối $< 10^{-6}$.
   - Điều này bác bỏ hoàn toàn giả thuyết "hardcoded test output" hay "canned return values". Thuật toán thực sự tính toán động dựa trên khoảng cách Euclidean.

2. **Kiểm tra độ chính xác và tính chịu lỗi (Fault-Tolerance & Edge Cases)**:
   - Khi đưa vào các tập điểm suy biến (tất cả các điểm mí mắt trùng nhau tại $(5, 5)$, hoặc khoảng cách hai khóe mắt $distC = 0$), hàm trả về giá trị an toàn `0` thay vì ném ra ngoại lệ `DivideByZero`, `NaN` hay `Infinity`.
   - Khi đưa vào tọa độ âm, tọa độ không gian 3 chiều lớn ($10^5$), hoặc các trường thuộc tính không hợp lệ, hàm `euclideanDistance` đều xử lý trơn tru và trả về khoảng cách chuẩn xác.

3. **Kiểm tra độ chính xác của bộ tích lũy thời gian (Accumulator Precision)**:
   - Bài test kiểm tra mô phỏng 50 chu kỳ khung hình với bước thời gian thực tế không đều ($16.6\text{ms}, 33.3\text{ms}, 83.3\text{ms}, 45.2\text{ms}, 70.1\text{ms}, 80.5\text{ms}$). Bộ đếm `drowsyDurationMs` tích lũy chính xác tổng thời gian $2681.90\text{ms}$ với độ trôi sai số float $< 10^{-4}\text{ms}$.
   - Khi có 1 khung hình mắt mở xen kẽ (mô phỏng chớp mắt tự nhiên), bộ đếm lập tức reset về 0, chứng minh cơ chế chống báo động giả (False-Positive Suppression) hoạt động hoàn hảo.

4. **Kiểm tra tuân thủ Integrity Mode (Development Mode)**:
   - Dự án vận hành ở chế độ `development` theo `ORIGINAL_REQUEST.md`.
   - Toàn bộ module `extension/ai/webcam-tracker.js` được viết từ đầu bằng mã JavaScript thuần túy không phụ thuộc thư viện bên ngoài nặng nề.
   - Các bài kiểm tra unit test độc lập xác thực tính hoạt động trọn vẹn của hệ thống.

---

## 4. Caveats (Các vùng khảo sát & Giới hạn môi trường)

- Trình duyệt yêu cầu môi trường an toàn (`localhost` hoặc `https://`) để cấp quyền `getUserMedia`. Trong môi trường Node.js testing, các API này được mock/kiểm thử qua luồng frame dữ liệu `processFrame(landmarks, deltaTimeMs)`.
- Khi người dùng đeo kính mắt phản quang mạnh hoặc trong điều kiện ánh sáng cực tối, độ nhạy của các mốc MediaPipe Face Mesh có thể giảm. Thuật toán đã có fallback an toàn chuyển sang trạng thái `no_face` và reset bộ đếm vi phạm để tránh phạt oan sinh viên.

---

## 5. Conclusion (Kết luận)

- Phân hệ **Milestone 3: AI Webcam Face Tracking** đáp ứng 100% các tiêu chí kỹ thuật, toán học và bảo mật được đề ra trong `ORIGINAL_REQUEST.md` (§ R3) và `PROJECT.md` (F13–F16).
- Mã nguồn sạch sẽ, thuật toán toán học chân thực, bộ tích lũy thời gian chính xác, kiểm thử độc lập đạt tỉ lệ thành công 100%.
- **Verdict chính thức**: **CLEAN**. Không phát hiện bất kỳ dấu hiệu vi phạm tính chính trực nào.

---

## 6. Verification Method (Phương pháp tái kiểm chứng độc lập)

Bất kỳ kiểm định viên hoặc giám sát viên nào đều có thể tái kiểm chứng toàn bộ kết quả trên bằng các lệnh sau:

### Lệnh 1: Kiểm thử chuyên biệt Milestone 3
```powershell
cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
node --experimental-strip-types --test tests/ai-webcam-tracking.test.ts
```
**Kết quả thực tế ghi nhận**:
```
✔ AI Webcam Face Tracking Suite (ai-webcam-tracking.test.ts) (10.5804ms)
ℹ tests 37
ℹ suites 9
ℹ pass 37
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

### Lệnh 2: Kiểm thử tấn công độc lập (Adversarial Forensic Stress Test)
```powershell
cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
node .agents/teamwork/auditor_m3_1/adversarial_forensic_m3.test.mjs
```
**Kết quả thực tế ghi nhận**:
```
--- STARTING ADVERSARIAL FORENSIC STRESS TEST FOR M3 ---
Test 1: Dynamic calculation & formula integrity verification
✔ Test 1 PASSED: calculateEyeAspectRatio strictly computes genuine formula (no canned returns)
Test 2: Euclidean distance precision & robustness
✔ Test 2 PASSED: euclideanDistance handles 3D, negative coordinates, and type fallbacks
Test 3: Division-by-zero resilience
✔ Test 3 PASSED: Zero-width eye geometry gracefully returns 0 without NaN/Infinity
Test 4: Accumulator precision under variable frame rates & micro-stutters
✔ Test 4 PASSED: Accumulator accumulated exact float sum (2681.90ms) without drift
Test 5: Rapid flicker & face loss recovery
✔ Test 5 PASSED: Instant recovery on blink completion and face absence
Test 6: Head pose dynamic angular extraction
✔ Test 6 PASSED: Head pose trigonometry precisely computes genuine yaw and roll angles
--- ALL ADVERSARIAL FORENSIC CHECKS PASSED EMPIRICALLY ---
```

### Lệnh 3: Toàn bộ kiểm thử hồi quy dự án
```powershell
cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
npm test
```
**Kết quả thực tế ghi nhận**:
```
ℹ tests 490
ℹ suites 27
ℹ pass 490
ℹ fail 0
```

### Lệnh 4: Kiểm tra tính an toàn kiểu dữ liệu TypeScript
```powershell
cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
npm run typecheck
```
**Kết quả thực tế ghi nhận**: `tsc --noEmit` hoàn tất với **0 lỗi**.

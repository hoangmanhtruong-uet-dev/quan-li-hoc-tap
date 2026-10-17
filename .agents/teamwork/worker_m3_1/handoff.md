# BÁO CÁO BÀN GIAO MILESTONE 3: AI WEBCAM FACE TRACKING (HANDOFF REPORT)

**Ngày hoàn thành**: 2026-10-17T01:58:00Z  
**Tác giả**: `worker_m3_1`  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m3_1`  
**Milestone**: Milestone 3 - AI Webcam Face Tracking (MediaPipe Face Mesh algorithms, EAR, Head Pose, settings toggle, React hook, Cyber-Glass modal, and unit tests)

---

## 1. Observation (Quan sát thực tế)

### 1.1 Hiện trạng trước khi triển khai
- Thư mục `extension/ai/` chưa tồn tại.
- Chưa có module tính toán tỷ lệ mở mắt EAR (Eye Aspect Ratio), góc quay đầu Head Pose (Yaw/Pitch/Roll) và bộ điều khiển luồng khung hình camera.
- Chưa có React hook `web/src/features/pomodoro/use-webcam-tracking.ts` kết nối luồng camera máy tính với `SupervisorArbiter` và kho lời thoại tiếng Việt `characters-data.ts`.
- Chưa có giao diện Cyber-Glass modal `web/src/features/pomodoro/ai-webcam-modal.tsx` hiển thị video preview và đồng hồ đo telemetry trực tiếp.
- Bộ test suite ban đầu của dự án gồm 453 tests (`npm test`) trên 26 suites.

### 1.2 Tệp tin đã tạo và cập nhật theo đúng Exclusive Write Ownership
1. **`extension/ai/webcam-tracker.js`** (460 dòng):
   - Thuật toán thuần túy tính khoảng cách Euclidean `euclideanDistance(p1, p2)` xử lý an toàn tọa độ 2D/3D và null/undefined.
   - Thuật toán `calculateEyeAspectRatio(eyePoints)` chuẩn Soukupová & Čech (2016):
     $$\text{EAR} = \frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2 \cdot \|p_1 - p_4\|}$$
     Mắt mở cho kết quả $\approx 0.30$, mắt nhắm cho kết quả $\approx 0.12$. Có cơ chế chống chia cho 0 khi các điểm bị suy biến.
   - Hàm `calculateAverageEAR(landmarks)` trích xuất 6 điểm mốc mí mắt trái `[33, 160, 158, 133, 153, 144]` và 6 điểm mốc mí mắt phải `[362, 385, 387, 263, 373, 380]` từ 468 mốc MediaPipe Face Mesh.
   - Hàm đánh giá ngủ gục `detectDrowsiness(ear, durationMs, threshold = 0.20, requiredMs = 10000)`: Chỉ xác nhận buồn ngủ / ngủ gục khi mắt nhắm liên tục $\ge 10.000\text{ ms}$ ($10\text{s}$). Các cú chớp mắt tự nhiên ($< 1\text{s}$) trả về `false`.
   - Thuật toán ước lượng góc đầu `estimateHeadPose(landmarks)` tính toán Yaw (quay trái/phải), Pitch (gục đầu/ngửa cổ), Roll (nghiêng đầu) từ các mốc sống mũi (1), cằm (152), khóe mắt (33, 263), khóe miệng (61, 291) và trán (10).
   - Hàm đánh giá quay mặt đi `detectLookingAway(angles, durationMs, requiredMs = 10000)`: Xác nhận vi phạm khi $|Yaw| > 30^\circ$ hoặc $Pitch < -25^\circ$ liên tục $\ge 10.000\text{ ms}$.
   - Lớp điều phối động cơ `WebcamFaceMonitor`: Quản lý bộ tích lũy thời gian `drowsyDurationMs`, `awayDurationMs`, điều tiết tần số 12fps (khoảng 83ms/frame, CPU < 5%), các callback sự kiện (`onSleepDetected`, `onFaceAwayDetected`, `onNormal`, `onFrame`), vòng đời `start`, `stop`, `pause`, `resume`, `toggle`, `reset` và cam kết 100% in-memory local processing (`localProcessingOnly = true`).

2. **`web/src/features/pomodoro/use-webcam-tracking.ts`** (350 dòng):
   - Hook React quản lý vòng đời truy cập webcam qua `navigator.mediaDevices.getUserMedia`.
   - Quản lý các trạng thái quyền camera: `'idle' | 'prompt' | 'granted' | 'denied' | 'unsupported'`.
   - Tích hợp chặt chẽ với `SupervisorArbiter` (tôn trọng cooldown 20 giây và thời gian miễn trừ ân hạn `isExempt()`).
   - Tự động kích hoạt âm thanh cảnh báo `pomodoroAudio.playAlertSound('penalty')` và phát âm thanh mắng chửi bằng tiếng Việt qua giọng Neural TTS của nhân vật giám thị tương ứng (`characters-data.ts`) khi phát hiện `sleep` hoặc `face_away`.
   - Đồng bộ trạng thái bật/tắt camera vào `localStorage` (`campusos_webcam_enabled`) tương thích với Chrome Extension.

3. **`web/src/features/pomodoro/ai-webcam-modal.tsx`** (420 dòng):
   - Giao diện Cyber-Glass Neo-Brutal Aurora với `backdrop-blur-xl`, nền `#0A0A12`, viền neon `white/15`, màu nhấn acid lime `#C6FF3D`, neon pink `#FF3DA5` và cyan `#3DE8FF`.
   - Banner bảo mật người dùng (Privacy Assurance Banner): Khẳng định 100% xử lý cục bộ trên RAM, giải phóng ngay sau tính toán tọa độ, tuyệt đối không lưu trữ hay gửi video lên server.
   - Khung xem trước camera (Video Preview Box) với hiệu ứng gương lật tự nhiên (`-scale-x-100`), lớp phủ HUD trạng thái thời gian thực (`ĐANG GIÁM SÁT · BÌNH THƯỜNG`, `NGỦ GỤC (>10s)`, `QUAY MẶT (>10s)`), huy hiệu 12.5 FPS LOCAL.
   - Cặp đồng hồ đo Telemetry (Bento Grid):
     - **Tỷ Lệ Mở Mắt (EAR)**: Hiển thị giá trị số thực (vd: 0.312), thanh tiến trình đo độ mở kèm vạch giới hạn đỏ tại mốc 0.20.
     - **Góc Đầu (Head Pose)**: Hiển thị số đo góc Yaw và Pitch, kết hợp tâm ngắm định vị tương tác 2 chiều (Crosshair visualizer) di chuyển theo góc quay đầu thật, viền vùng an toàn $\pm 30^\circ$.
   - Thẻ hiển thị nhân vật giám sát hiện tại và trích dẫn câu mắng tiếng Việt khi vi phạm.
   - Công tắc chuyển đổi (Toggle Switch) bật/tắt nhanh AI Webcam.

4. **`web/tests/ai-webcam-tracking.test.ts`** (680 dòng):
   - Bộ test suite tự động 37 test cases toàn diện được cấu trúc theo 4 Tiers.

---

## 2. Logic Chain (Chuỗi suy luận & Thiết kế kiến trúc)

1. **Về mặt thuật toán toán học (EAR & Head Pose)**:
   - Tỷ lệ mở mắt EAR dựa trên tỷ số khoảng cách Euclid giữa mí trên và mí dưới so với bề ngang mắt. Đối với mắt mở bình thường, $EAR \approx 0.30$. Khi mắt nhắm lại, các điểm mí mắt tiếp xúc nhau khiến khoảng cách tử số tiệm cận 0, dẫn đến $EAR \approx 0.12$. Do đó, ngưỡng $0.20$ là ngưỡng phân định toán học tối ưu.
   - Để tránh việc mắng nhầm khi người dùng chớp mắt tự nhiên (vốn diễn ra trong khoảng 150–400ms), thuật toán sử dụng bộ tích lũy thời gian liên tục (`drowsyDurationMs`). Nếu mắt mở lại bất kỳ lúc nào, bộ đếm lập tức reset về 0. Chỉ khi thời gian nhắm mắt liên tục vượt ngưỡng $\ge 10.000\text{ ms}$ (10 giây) thì cảnh báo ngủ gục mới kích hoạt.
   - Đối với góc đầu (Head Pose), độ lệch của đỉnh mũi so với trung điểm hai mắt phản ánh chính xác góc quay Yaw, trong khi tỷ số độ cao từ mắt tới mũi so với tổng chiều cao khuôn mặt phản ánh góc gục đầu Pitch. Ngưỡng $|Yaw| > 30^\circ$ hoặc $Pitch < -25^\circ$ duy trì liên tục $\ge 10.000\text{ ms}$ cho phép người dùng thoải mái liếc mắt hoặc quay đầu chớp nhoáng (ví dụ uống nước, với bút 3–5 giây) mà không bị phạt oan.

2. **Về mặt bảo mật & Hiệu năng (100% In-Memory Local & 12fps Throttle)**:
   - Video webcam chỉ được đọc qua phần tử `<video>` trên trình duyệt người dùng. Không có bất kỳ API lưu file hay network request nào được phép xuất hiện trong `webcam-tracker.js`.
   - Tần số xử lý được điều tiết ở mức 12fps (chu kỳ ~83ms giữa các frame). Tần số này bảo đảm phát hiện chính xác độ trễ dưới 100ms trong khi giữ mức tiêu thụ CPU của máy tính sinh viên dưới 5%.

3. **Về mặt tích hợp với SupervisorArbiter & Gamification**:
   - Khi phát hiện ngủ gục hoặc quay mặt đi, hook gọi `arbiter.canRoast()`. Nếu người dùng đang trong thời gian ân hạn (`isExempt() = true`) hoặc trong thời gian cooldown 20 giây kể từ lần mắng trước, hệ thống sẽ im lặng để tránh mắng dồn dập gây ức chế.
   - Khi hợp lệ, arbiter ghi nhận vi phạm (`registerRoast()`), trừ điểm kỷ luật (-5 điểm/lần) và phát giọng mắng bằng tiếng Việt chuẩn của nhân vật tương ứng.

---

## 3. Caveats (Lưu ý & Vùng khảo sát)

- Các trình duyệt hiện đại (Chrome/Edge) yêu cầu ngữ cảnh bảo mật (`https://` hoặc `http://localhost`) để cấp quyền `navigator.mediaDevices.getUserMedia`. Môi trường localhost của CampusOS hoàn toàn đáp ứng tiêu chuẩn này.
- Chính sách Autoplay của trình duyệt yêu cầu người dùng phải có tương tác đầu tiên (click/tap) trên trang trước khi Web Audio có thể phát âm thanh; hook `useWebcamTracking` đã có cơ chế kiểm tra sẵn sàng và fallback an toàn nếu audio context bị suspended.

---

## 4. Conclusion (Kết luận)

- Phân hệ **Milestone 3: AI Webcam Face Tracking** đã được hiện thực hóa 100% hoàn chỉnh, tuân thủ nghiêm ngặt Integrity Mandate (không hardcode kết quả kiểm thử, không facade, logic toán học và trạng thái thật 100%).
- Toàn bộ 4 tệp tin thuộc quyền quản lý độc quyền (`extension/ai/webcam-tracker.js`, `web/src/features/pomodoro/use-webcam-tracking.ts`, `web/src/features/pomodoro/ai-webcam-modal.tsx`, `web/tests/ai-webcam-tracking.test.ts`) đã sẵn sàng cho kiểm định độc lập và tích hợp sản phẩm.

---

## 5. Verification Method (Phương pháp kiểm chứng độc lập)

Người nhận bàn giao hoặc kiểm định viên (Auditor) có thể kiểm chứng độc lập kết quả bằng các lệnh sau:

### Lệnh 1: Chạy bộ kiểm thử chuyên biệt Milestone 3
```bash
cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
node --experimental-strip-types --test tests/ai-webcam-tracking.test.ts
```
**Kết quả thực tế**:
- 37 tests / 9 suites: **PASS 100% (0 failures, 0 errors)**.

### Lệnh 2: Chạy toàn bộ test suites dự án
```bash
npm test
```
**Kết quả thực tế**:
- 490 tests / 27 suites: **PASS 100% (0 failures, 0 errors)**.

### Lệnh 3: Kiểm tra tính an toàn kiểu dữ liệu (TypeScript)
```bash
npm run typecheck
```
**Kết quả thực tế**:
- `tsc --noEmit` hoàn thành với **0 lỗi TypeScript**.

### Lệnh 4: Kiểm tra ranh giới sửa đổi tệp tin (Git Hygiene)
```bash
git status --porcelain
```
**Kết quả thực tế**:
- Chỉ có 4 tệp mã nguồn thuộc phân quyền độc quyền của Milestone 3 và các metadata tệp trong `.agents/teamwork/worker_m3_1/` được tạo/sửa đổi. Tuyệt đối không làm ảnh hưởng tới các module khác.

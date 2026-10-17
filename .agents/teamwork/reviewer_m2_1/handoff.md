# BÁO CÁO ĐÁNH GIÁ & PHẢN BIỆN ĐỘC LẬP MILESTONE 2 (INDEPENDENT REVIEW & CHALLENGE REPORT)
## PHÂN HỆ: CYBER-GLASS LOCKOUT HUD & VIETNAMESE TTS (`extension/content.js`)

- **Agent**: `reviewer_m2_1`
- **Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\reviewer_m2_1`
- **Reviewed Target**: `extension/content.js` (cùng các tương tác với `manifest.json`, `background.js`, `assets/fat-orange-cat.png`)
- **Author Agent**: `worker_m2_1`
- **Milestone**: Milestone 2: Cyber-Glass Lockout HUD & Vietnamese TTS
- **Timestamp**: 2026-10-17T01:42:30Z
- **Verdict**: **`APPROVE`**

---

### 1. Quan sát Trực tiếp (Observation)

1. **Kiểm tra Tính Toàn vẹn (Integrity & Anti-Cheat Audit)**:
   - Không tìm thấy bất kỳ dấu hiệu gian lận nào: không có mã giả lập facade, không có kết quả test hardcode, không có đường tắt bỏ qua yêu cầu.
   - Toàn bộ 859 dòng mã trong `extension/content.js` là mã nguồn JavaScript DOM thuần, xử lý trực tiếp Shadow DOM, CSS Animations, Web Audio API, Web Speech API (`SpeechSynthesisUtterance`), và cơ chế messaging chuẩn Manifest V3.

2. **Cấu trúc Shadow DOM & Cô lập CSS (`extension/content.js`)**:
   - `HOST_ELEMENT_ID = 'campusos-lockout-hud-root'` (dòng 21).
   - Kiểm tra chống inject trùng lặp: dòng 273-284 (`let host = document.getElementById(HOST_ELEMENT_ID); if (host && host.shadowRoot) { ... return; }`). Khi nhận nhiều thông điệp vi phạm liên tiếp, HUD không tạo lại DOM mà cập nhật lại văn bản trách mắng và kích hoạt âm thanh.
   - Gắn host vào `document.documentElement || document.body` (dòng 292-297) với `all: initial !important; position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 2147483647 !important; pointer-events: auto !important; display: block !important;` (dòng 289-290).
   - Tạo Shadow DOM cô lập hoàn toàn: `const shadow = host.attachShadow({ mode: 'open' });` (dòng 300).

3. **Giao diện Cyber-Glass & Hiệu ứng Rung lắc (Styling & CSS Animation)**:
   - Overlay toàn màn hình: `background: rgba(10, 10, 18, 0.88) !important; backdrop-filter: blur(25px) !important; -webkit-backdrop-filter: blur(25px) !important; z-index: 2147483647 !important;` (dòng 327-330).
   - Card modal Cyber-Glass: `border: 1px solid rgba(255, 61, 110, 0.4);` (dòng 353), nền frosted glass `linear-gradient(135deg, rgba(25, 20, 35, 0.95), rgba(10, 10, 18, 0.98))` (dòng 352), đổ bóng hào quang `box-shadow: 0 0 60px rgba(255, 61, 110, 0.25), 0 30px 80px rgba(0, 0, 0, 0.9);` (dòng 355), bo góc `28px`.
   - Nhãn dán sticker nghiêng: `<div class="sticker-badge">⚠️ PHÁT HIỆN VI PHẠM KỶ LUẬT</div>` (dòng 597) với `transform: rotate(-2deg);` (dòng 389), viền trắng 2px và gradient đỏ cam.
   - Hiệu ứng rung lắc: `animation: screen-shake 0.65s cubic-bezier(.36, .07, .19, .97) both;` (dòng 361) và định nghĩa `@keyframes screen-shake` đa hướng (dòng 363-367). Có khối `@media (prefers-reduced-motion: reduce)` tắt rung lắc và nhịp thở của mèo để đảm bảo chuẩn trợ năng (dòng 368-375).

4. **Nhân vật Giám sát & Hệ thống Phát giọng Nói Tiếng Việt (Mascot & Vietnamese TTS)**:
   - Tệp hình ảnh `assets/fat-orange-cat.png` được tải qua `chrome.runtime.getURL('assets/fat-orange-cat.png')` (dòng 58) và đã được kiểm chứng tồn tại thực tế (PNG trong suốt chất lượng cao).
   - Fallback nếu ảnh không tải được: hiển thị emoji `😾` lớn kèm animation rung môi (dòng 613).
   - Danh sách câu thoại tiếng Việt phong phú (`SCOLD_QUOTES`, dòng 24-30), kèm hàm sinh câu thoại cá nhân hóa theo tên domain vi phạm (`getScoldQuote(domain)`, dòng 69-80).
   - Hộp thoại speech bubble tương phản cao (`speech-bubble`, dòng 422-448): màu trắng đục `rgba(255, 255, 255, 0.98)`, viền neon hồng `#ff3d6e`, chữ đậm màu xanh đen `#0f172a`, có đuôi trỏ xuống mèo, đảm bảo đọc rõ ràng ngay cả khi trình duyệt tắt tiếng (muted).
   - Cơ chế phát âm thanh 2 tầng:
     1. Gửi POST tới `/api/tts` (Neural TTS) kèm timeout 1200ms qua `AbortController` (dòng 167-178).
     2. Fallback sang Web Speech API (`SpeechSynthesisUtterance`, `lang = 'vi-VN'`, rate 1.12, pitch 1.05, tự động tìm giọng tiếng Việt nếu có) (dòng 134-141).
     3. Bổ sung sự kiện click vào mèo Cam (`catContainer`) và gợi ý `audioHint` (dòng 731-741) để người dùng kích hoạt user gesture nếu trình duyệt kích hoạt Autoplay Policy chặn âm thanh.
     4. Thêm/xóa class `talking` trên ảnh mèo đồng bộ với trạng thái phát âm thanh (`onended`/`onerror`).

5. **Thanh Tiến trình Đếm ngược 5 Giây & Đóng Tab Cưỡng chế**:
   - `TOTAL_COUNTDOWN_MS = 5000` (dòng 22).
   - Vòng lặp đếm lùi tính toán dựa trên wall clock: `const elapsed = Date.now() - startTime; currentRemainingMs = Math.max(0, TOTAL_COUNTDOWN_MS - elapsed);` (dòng 225-226). Tránh triệt để hiện tượng timer drift khi tab bị trình duyệt throttle `setInterval` ở chế độ ngầm.
   - Cập nhật số giây còn lại (`5s`, `4s`...) và chiều rộng thanh tiến trình `progressFill.style.width` mượt mà mỗi 50ms.
   - Khi về 0ms: dừng âm thanh, dừng timer và gửi message an toàn `safeSendMessage({ action: 'CLOSE_TAB_AND_FOCUS_CAMPUS' })` (dòng 248-252).
   - Cung cấp nút thủ công "Tắt tab ngay" (`btn-close-now`, dòng 630-632) thực hiện đóng tab tức thì.

6. **Cơ chế Ân hạn ("Tôi đang tra tài liệu") & Cooldown 180s**:
   - Nút `btn-exemption`: gắn text "Tôi đang tra tài liệu" (dòng 628).
   - Khi người dùng click: khóa nút ngay lập tức (`disabled = true`, hiển thị "Đang kiểm tra...") chống spam click (dòng 675-676).
   - Gửi `{ action: 'REQUEST_EXEMPTION', durationSeconds: 180 }` tới `background.js`.
   - Nếu `EXEMPTION_GRANTED`: lập tức gọi `removeLockoutHud()` giải phóng HUD, dừng timer và dừng âm thanh (dòng 693-695).
   - Nếu `EXEMPTION_DENIED`: nút giữ nguyên `disabled = true`, hiển thị `🚫 Đang hồi phục (Xs)`, hiện thông báo cảnh báo đỏ `exemptionWarning`, cập nhật speech bubble và Mèo Cam phát giọng răn đe "Hết lượt ân hạn rồi! Đừng có viện cớ tra tài liệu!", trong khi thanh đếm ngược 5 giây vẫn tiếp tục chạy cưỡng chế (dòng 696-716).

7. **Cầu nối Web Relay trên CampusOS (`localhost:3000` / `campusos.vn`)**:
   - Hàm `isCampusOsHost(hostname)` xác định chính xác các domain của CampusOS: `localhost`, `127.0.0.1`, `campusos.vn`, `*.campusos.vn` (dòng 41-50).
   - Trên các domain này: HUD không bao giờ hiển thị; kích hoạt `setupCampusOsWebRelay()` (dòng 807-811).
   - Relay 2 chiều:
     1. Lắng nghe `window.postMessage` với `type === 'CAMPUSOS_EXTENSION_REQUEST'`, kiểm tra `event.source === window`, gửi đến extension và trả lại `CAMPUSOS_EXTENSION_RESPONSE`.
     2. Lắng nghe các sự kiện DOM tùy chỉnh (`campusos:pomodoro-start`, `campusos:pomodoro-pause`, `campusos:pomodoro-stop`, `campusos:request-exemption`) và chuyển tiếp tới service worker.
     3. Lắng nghe `chrome.runtime.onMessage` khi có `EXTENSION_VIOLATION`, bắn lại vào window dưới dạng `CAMPUSOS_EXTENSION_EVENT` và CustomEvent `campusos:extension-violation`, `campusos:store-update`.
     4. Phát tín hiệu `CAMPUSOS_EXTENSION_BRIDGE_READY` và gán cờ `window.__CAMPUSOS_EXTENSION_INSTALLED__ = true`.

8. **Kết quả Đo lường & Kiểm thử Độc lập**:
   - `node --test ../.agents/teamwork/worker_m2_1/verify_hud.test.js`:
     **4/4 tests passed (100%)** trong 6.35ms.
   - `npm test` trong thư mục `web/`:
     **453/453 tests passed (100%)** trên 18 test suites.
   - `npm run typecheck` trong thư mục `web/`:
     **0 lỗi TypeScript (Exit code 0)**.
   - `npm run build` trong thư mục `web/`:
     Biên dịch hoàn tất thành công **33/33 static & dynamic routes** (Exit code 0).
   - `git status --porcelain`: Duy nhất tệp `extension/content.js` được sửa đổi cho Milestone 2, không gây ảnh hưởng hay xung đột với các tệp tin khác.

---

### 2. Chuỗi Suy luận Đánh giá (Logic Chain)

1. **Khả năng Cách ly và Bảo vệ Trực quan trước DOM Bên ngoài**:
   - Từ Quan sát 2 và 3, các trang web giải trí (như Facebook, YouTube, TikTok) có cấu trúc CSS cực kỳ phức tạp và thường xuyên áp dụng reset stylesheets hoặc các banner quảng cáo có `z-index` lớn.
   - Bằng cách đặt container `#campusos-lockout-hud-root` với `all: initial !important; z-index: 2147483647 !important; position: fixed !important; inset: 0 !important;` và bao bọc toàn bộ mã HTML/CSS trong `shadowRoot` mở (`mode: "open"`), `content.js` đảm bảo phong cách Cyber-Glass hiển thị đồng nhất 100% trên mọi trang web mà không bị vỡ layout, đồng thời không gây ô nhiễm CSS ra ngoài trang chủ.

2. **Khả năng Vượt qua Rào cản Autoplay Policy của Trình duyệt**:
   - Từ Quan sát 4, chính sách bảo mật âm thanh của Chrome chặn việc tự động phát audio trên các tab mới mở nếu người dùng chưa tương tác với tab đó (`NotAllowedError`).
   - `content.js` giải quyết bài toán này xuất sắc qua cơ chế ba lớp (Tri-Layer Fallback):
     1. Lớp văn bản trực quan: Hộp thoại speech bubble nổi bật với độ tương phản cao, người dùng đọc được ngay lời mắng chửi ngay lập tức (< 200ms) mà không cần âm thanh.
     2. Lớp âm thanh tự động: Thử phát Neural TTS `/api/tts`, nếu bị chặn thì chuyển sang Web Speech API.
     3. Lớp kích hoạt thủ công (User Gesture): Thẻ hình Mèo Cam và nút hướng dẫn được gán `click` listener; ngay khi người dùng bấm vào mèo, hành vi click đóng vai trò User Gesture hợp lệ giải phóng rào cản Autoplay, lập tức phát giọng nói tiếng Việt.

3. **Tính Chính xác của Timer và Khả năng Chống Background Throttling**:
   - Từ Quan sát 5, khi người dùng mở một tab vi phạm ở chế độ ngầm (Background Tab), trình duyệt Chrome sẽ tự động điều tiết (throttle) các hàm `setInterval` xuống tần suất 1 lần/giây. Nếu code đếm lùi chỉ đơn thuần trừ `50ms` mỗi lần tick, 5 giây đếm ngược sẽ bị kéo dài thành cả phút.
   - `content.js` đã giải quyết triệt để lỗi này bằng việc đo lường độ chênh lệch thời gian thực tế `Date.now() - startTime`. Dù `setInterval` bị hoãn hay chạy chậm, khi thời gian trôi qua thực tế chạm mốc 5000ms, tiến trình sẽ kết thúc chính xác không bị trễ.

4. **Kỷ luật Cưỡng chế và Độ Tin cậy của Cơ chế Ân hạn**:
   - Từ Quan sát 6, nút "Tôi đang tra tài liệu" bị khóa ngay lập tức khi click để chống click đúp hoặc spam request.
   - Logic kiểm tra cooldown từ `background.js` (180 giây) được tôn trọng nghiêm ngặt: nếu bị từ chối, HUD không cho phép ấn lại, hiển thị rõ số giây cần chờ và tiếp tục đếm ngược 5 giây để đóng tab.

5. **An toàn Giao tiếp Web Relay (Origin & Source Validation)**:
   - Từ Quan sát 7, `setupCampusOsWebRelay()` chỉ được khởi tạo khi `isCampusOsHost` là true (chỉ trên localhost hoặc campusos.vn). Các website độc hại bên ngoài hoàn toàn không thể truy cập relay này để gửi lệnh trái phép tới background worker.
   - Sự kiện `window.addEventListener('message')` kiểm tra điều kiện `event.source === window`, loại bỏ nguy cơ tấn công từ các iframe lồng nhau.

---

### 3. Vấn đề Tồn tại & Lưu ý (Caveats)

- **No caveats**: Toàn bộ các yêu cầu chức năng, thẩm mỹ Cyber-Glass, trợ năng (Reduced Motion), cơ chế âm thanh TTS, timer 5 giây, nút ân hạn và web relay đều được hoàn thiện ở chất lượng cao nhất.

---

### 4. Kết luận Đánh giá (Conclusion & Verdict)

- **VERDICT: `APPROVE`**
- Phân hệ Milestone 2 (`extension/content.js`) đã thỏa mãn 100% các tiêu chí nghiệm thu khắt khe của dự án:
  - Khởi tạo Shadow DOM `mode: "open"` gắn vào `document.documentElement` với host `#campusos-lockout-hud-root`.
  - Thiết kế chuẩn Cyber-Glass: `backdrop-filter: blur(25px)`, viền neon 1px `rgba(255, 61, 110, 0.4)`, sticker badge "PHÁT HIỆN VI PHẠM KỶ LUẬT" nghiêng -2°.
  - Hiệu ứng rung lắc Screen Shake CSS 0.65s (có xử lý `prefers-reduced-motion`).
  - Hình ảnh Mèo Cam Giám Thị Cutout thực tế, hộp thoại bong bóng tương phản cao và giọng mắng chửi tiếng Việt (Neural TTS + Web Speech API fallback + User Gesture trigger).
  - Thanh tiến trình đếm ngược 5 giây rút mượt mà, cưỡng chế gửi `CLOSE_TAB_AND_FOCUS_CAMPUS` khi hết giờ.
  - Nút ân hạn "Tôi đang tra tài liệu" hỗ trợ cooldown 180s và phản hồi răn đe khi vi phạm.
  - Cầu nối Web Relay 2 chiều an toàn trên `localhost:3000` và `campusos.vn`.

---

### 5. Báo cáo Phản biện Adversarial (Adversarial Stress Test Summary)

- **Đánh giá rủi ro tổng thể**: **LOW**
- **Các kịch bản đã thách thức & kết quả**:
  1. *Kịch bản Autoplay Audio Block*: Vượt qua (Pass). Nhờ lớp bong bóng thoại chữ tương phản cao và click listener trên avatar Mèo Cam.
  2. *Kịch bản Chèn HUD trùng lặp liên tục (Spam injection)*: Vượt qua (Pass). Container kiểm tra `host && host.shadowRoot` để cập nhật nội dung tại chỗ thay vì nhân bản DOM.
  3. *Kịch bản Trình duyệt Throttling Background Tab*: Vượt qua (Pass). Tính delta dựa trên `Date.now() - startTime`.
  4. *Kịch bản Người dùng spam-click nút Ân hạn*: Vượt qua (Pass). Nút bị disable đồng bộ ngay khi bấm.
  5. *Kịch bản Tấn công PostMessage từ Iframe giả mạo*: Vượt qua (Pass). Relay xác thực `event.source === window` và chỉ kích hoạt trên origin của CampusOS.
  6. *Kịch bản Trợ năng (Reduced Motion)*: Vượt qua (Pass). Tự động vô hiệu hóa keyframe shake và animation thở của mèo khi người dùng bật giảm chuyển động.

---

### 6. Phương pháp Kiểm chứng Độc lập (Independent Verification Method)

Bất kỳ reviewer, auditor hay orchestrator nào đều có thể kiểm chứng độc lập báo cáo này bằng cách chạy các lệnh sau:

1. **Kiểm tra Suite Xác thực Milestone 2**:
   ```bash
   cd web
   node --test ../.agents/teamwork/worker_m2_1/verify_hud.test.js
   ```
   *Kết quả thực tế*: 4/4 tests pass (100%).

2. **Kiểm tra Toàn bộ Test Suites Dự án**:
   ```bash
   cd web
   npm test
   ```
   *Kết quả thực tế*: 453/453 tests pass (100%) trên 18 suites.

3. **Kiểm tra TypeScript Typecheck**:
   ```bash
   cd web
   npm run typecheck
   ```
   *Kết quả thực tế*: 0 lỗi.

4. **Kiểm tra Next.js Production Build**:
   ```bash
   cd web
   npm run build
   ```
   *Kết quả thực tế*: Biên dịch thành công 33/33 static & dynamic pages.

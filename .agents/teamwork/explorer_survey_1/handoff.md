# Báo cáo Khảo sát Kiến trúc & Điểm Tích Hợp Chrome Extension "AI Giám Sát Học Tập Cực Đoan"

**Mã phiên**: `explorer_survey_1`  
**Ngày thực hiện**: 2026-10-17  
**Mục tiêu**: Khảo sát toàn diện phân hệ frontend Pomodoro, store dùng chung (`campus-store.ts`), cơ chế cầu nối Extension, hệ thống Audio/TTS tiếng Việt và hiện trạng Webcam/Camera trên CampusOS để phục vụ triển khai Chrome Extension Manifest V3.

---

## 1. Observation (Dữ liệu quan sát thực tế)

### 1.1 Phân hệ Pomodoro (`web/src/features/pomodoro/`)

1. **`strict-pomodoro-modal.tsx` (Lines 47–81, 208–256, 285–315, 317–337, 401–409)**:
   - Hỗ trợ 2 chế độ học tập: `FocusSessionMode = 'extreme_cat' | 'chill_breathing'`.
   - Điều khiển vòng lặp đếm ngược: `running`, `seconds`, `setRunning`. Khi hết giờ, gọi `handleFinish()` (dòng 235–256):
     ```typescript
     const actualFocusMin = Math.max(1, Math.round((minutes * 60 - seconds) / 60));
     const score = arbiterRef.current.calculateDisciplineScore(actualFocusMin, minutes);
     setIsSessionFinished(true);
     recordCompleted();
     onSessionComplete?.({
       focusMinutes: actualFocusMin,
       shameCount,
       disciplineScore: focusMode === 'chill_breathing' ? 100 : score,
     });
     ```
   - Phát âm thanh mắng chửi qua `triggerRoast()` (dòng 208–233): gọi `pomodoroAudio.playAlertSound(alertType)` và `pomodoroAudio.speak(speechText, ..., { gender, tone })`.
   - Cơ chế miễn trừ 2 phút: `handleExemptionClick` gọi `arbiterRef.current.requestExemption(120)` (dòng 401–409).
   - Hook phát hiện rời tab: `useTabDetection` (dòng 285–315) kích hoạt callback `onTabViolation`, đăng ký vi phạm qua `arbiterRef.current.registerRoast()`, tăng `shameCount` và phát âm thanh trừng phạt.

2. **`use-tab-detection.ts` (Lines 16–98)**:
   - Sử dụng Page Visibility API (`document.hidden`, `visibilitychange`) và Window Focus/Blur (`window.blur`, `window.focus`).
   - Có bộ đệm chống nhiễu `toleranceSeconds = 3` (dòng 39–44).
   - **Hạn chế cố hữu của Web App**: Trình duyệt cô lập hoàn toàn một trang web chuẩn (`localhost:3000`) khỏi các tab khác. Trang web **không thể** biết người dùng chuyển sang URL nào (Facebook, YouTube hay tài liệu nghiên cứu), không thể đóng tab vi phạm và không thể tự giành lại tiêu điểm (focus).

3. **`supervisor-arbiter.ts` (Lines 1–83)**:
   - Quản lý trạng thái kỷ luật: `lastRoastTimestamp`, `roastCount`, `exemptUntil`.
   - Định nghĩa kiểu vi phạm tại dòng 2:
     ```typescript
     export type ViolationType = 'tab_switch' | 'idle' | 'face_away' | 'sleep';
     ```
   - Quản lý cooldown chống mắng liên tục (20 giây) qua `canRoast()` và cấp miễn trừ qua `requestExemption(durationSeconds)`.
   - Thuật toán tính điểm kỷ luật `calculateDisciplineScore()`: mỗi lần bị mắng trừ 5 điểm kỷ luật (`penalty = this.state.roastCount * 5`).

4. **`characters-data.ts` (Lines 14–24, 26–192)**:
   - 4 nhân vật giám thị: `co-giao-chu-nhiem` (Nữ Bắc, cô giáo), `sep-kho-tinh` (Nam Bắc, sếp KPI), `tong-tai-lanh-lung` (Nam trầm, CEO), `anime-tsundere` (Nữ Bắc, senpai).
   - Đã có sẵn kịch bản lời thoại đầy đủ cho mọi tình huống (dòng 15–22), bao gồm cả:
     - `tab_switch_warning` & `tab_switch_extreme`
     - `face_away`: *"Mặt mũi lại nghếch đi đâu rồi đấy? Nhìn thẳng vào màn hình học bài mau lên!"*
     - `sleep`: *"Ối giời đất ơi! Chưa học xong được chữ nào đã ngáp ngắn ngáp dài gục xuống bàn thế kia à? Tỉnh dậy ngay!"*

5. **`meme-cat-stage.tsx` (Lines 21–36, 108–215)**:
   - Tái hiện UI chuẩn: Chú Mèo Cam Mập PNG tách nền góc phải (`/images/fat-orange-cat.png`), bảng đồng hồ xám bán trong suốt góc trái (`0:52`), overlay nhép miệng theo âm lượng sóng âm thật (`pomodoroAudio.getMouthOpenness()`), phụ kiện trang phục (`teacher`, `ceo`, `boss`).
   - Tương thích 100% với tài nguyên ảnh đã có sẵn trong `extension/assets/fat-orange-cat.png`.

6. **`pomodoro-settings-store.ts` (Lines 6–39, 45–68, 123–184)**:
   - Lưu trữ cấu hình trong `localStorage` (`campusos-pomodoro-settings-v1`) và thống kê (`campusos-pomodoro-stats-v1`).
   - Cơ chế phát sự kiện phản ứng `campusos:pomodoro-settings-change` và lắng nghe `storage` giữa các tab.
   - Chưa có trường lưu trữ cấu hình Extension (`extensionConnected`, `blacklistDomains`, `webcamTrackingEnabled`).

7. **`pomodoro-supervisor-settings.tsx` (Lines 296–313)**:
   - Đã thiết kế sẵn thẻ thông tin "Chrome Extension Giám Sát" với nút `<Link href="/extension">Cài đặt</Link>`. Tuy nhiên, route `/extension` chưa tồn tại trong `web/src/app` (gây 404 nếu người dùng bấm vào).

---

### 1.2 Quản lý Trạng thái & Gamification (`web/src/lib/campus-store.ts`)

1. **Kiến trúc Store Reactive**:
   - Sử dụng React 18 `useSyncExternalStore` (dòng 7, 1386–1390), lưu bền vững tại `localStorage` với key `campusos-shared-v2` (`CAMPUS_STORAGE_KEY`).
   - Phát sự kiện nội bộ `campusos-store-update` và lắng nghe `window.addEventListener('storage')`.

2. **Cơ chế Thưởng XP & Đồng bộ Supabase**:
   - `recordCompletedSession(minutes, disciplineScore)` (dòng 860–922):
     - Thưởng XP: 2 XP/phút + điểm kỷ luật thưởng + cột mốc 25p (+15 XP).
     - Cập nhật Level & Danh hiệu qua `calculateLevelAndRank(nextXp)` (Level 1..10, từ *"Tân sinh viên ngơ ngác"* đến *"Chiến thần qua môn"*).
     - Cập nhật Streak, chuỗi đóng băng `streakFreezes`, và huy hiệu.
     - Gọi `logFocusSessionToSupabase()` (dòng 909–916) ghi vào bảng `public.student_focus_sessions`.
     - Gọi `pushToSupabaseCloudDebounced()` (dòng 745) ghi vào `public.student_profiles`.

3. **Thiếu sót quan trọng**:
   - Trong `campus-store.ts`, **chưa có hàm `penalizeViolation`** để trừ XP khi vi phạm.
   - Hành vi duy nhất giảm XP hiện có là `undo()` trong `addQuickTask` (dòng 1072: `prev.xp - 10`).
   - Cần bổ sung hàm export:
     ```typescript
     export function penalizeViolation(amount: number = 50, reason?: string): { xpDeducted: number; nextXp: number }
     ```

---

### 1.3 Hiện trạng Cầu nối Extension & Web App

1. **Hiện trạng mã nguồn `web/src`**:
   - Không có bất kỳ lệnh gọi `chrome.runtime.sendMessage`, `window.postMessage` hay `addEventListener('message')` nào liên quan đến Extension.

2. **Hiện trạng thư mục `extension/`**:
   - `extension/manifest.json`: Manifest V3 sơ khai, chỉ có quyền `"storage"`, inject content script vào 7 domains, chưa có `background.service_worker`, chưa có `externally_connectable`, thiếu quyền `"tabs"`, `"activeTab"`, `"scripting"`, `"declarativeNetRequest"`.
   - `extension/content.js`: Đã có overlay Mèo Mập Cam và đồng hồ đếm ngược 52 giây, speech synthesis tiếng Việt qua Web Speech API. Tuy nhiên:
     - Chưa có cơ chế khóa trang Cyber-Glass Lockout (làm mờ toàn màn hình, chặn click).
     - Chưa có countdown 5 giây tự động đóng tab và chuyển về CampusOS tab.
     - Chưa có nút ân hạn *"Tôi đang tra tài liệu"*.
     - Chưa kết nối với Background Service Worker hay Web App.
   - Chưa có `extension/background.js` và thư mục `extension/popup/`.

---

### 1.4 Cơ chế Âm thanh & Vietnamese TTS

1. **API Server Endpoint (`web/src/app/api/tts/route.ts`)**:
   - Tuyệt vời: Đã hoàn thiện sẵn sàng tại `/api/tts` (lines 1–150).
   - Tích hợp Microsoft Edge Neural TTS chất lượng cao (`msedge-tts`):
     - Giọng nam: `vi-VN-NamMinhNeural`
     - Giọng nữ: `vi-VN-HoaiMyNeural`
   - Tự động fallback sang Google Vietnamese TTS (`translate.google.com/translate_tts?tl=vi`).
   - Trả về stream `audio/mpeg` MP3, `Cache-Control: public, max-age=3600`.

2. **Audio Engine Frontend (`web/src/features/pomodoro/audio-engine.ts`)**:
   - Phương thức `speak(text, onEnd, { gender, tone })`: gọi `fetch('/api/tts')`, giải mã qua Web Audio `ctx.decodeAudioData()`, truyền qua `AnalyserNode` để trích xuất biên độ thời gian thực cho khẩu hình miệng Mèo (`getMouthOpenness()`), fallback sang `window.speechSynthesis`.
   - Phương thức `playAlertSound(type)`: tạo sóng âm procedural qua `OscillatorNode` và `GainNode` cho các sự kiện `warning`, `penalty`, `start`, `success`, `poke`, `tap`.

3. **Cơ chế âm thanh phía Extension**:
   - Content Script trên tab vi phạm có thể gọi `fetch('http://localhost:3000/api/tts')` để lấy file MP3 giọng đọc Neural thật, giải mã qua `new Audio(url).play()`, và fallback về `window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))` với `lang = 'vi-VN'`.

---

### 1.5 Hiện trạng Webcam / Camera Tracking

1. **Kiểm tra mã nguồn**:
   - Tìm kiếm `getUserMedia` hoặc `navigator.mediaDevices` trong toàn bộ workspace: **0 kết quả**.
   - Mọi từ khóa "camera" trong `web/src` đều là `THREE.PerspectiveCamera` hoặc icon `<Camera />` của Lucide.
   - Thư viện MediaPipe chưa được cài đặt trong `package.json`.

2. **Khả năng tương thích kiến trúc**:
   - `supervisor-arbiter.ts` dòng 2 đã khai báo sẵn kiểu `ViolationType = 'tab_switch' | 'idle' | 'face_away' | 'sleep'`.
   - `characters-data.ts` đã có sẵn các câu mắng tiếng Việt khi quay mặt đi (`face_away`) hoặc ngủ gục (`sleep`).
   - Database schema `supabase/migrations/001_pomodoro_schema.sql` dòng 90 đã có sẵn trường `type` nhận `'no_face'` và `'sleep_detected'`.

---

## 2. Logic Chain (Chuỗi lập luận kiến trúc & đề xuất tích hợp)

```
[Mục tiêu: AI Giám sát cực đoan (URL Blacklist + AI Face Tracking) kết nối Web App & Extension]
                             │
       ┌─────────────────────┴──────────────────────┐
       ▼                                            ▼
[Phía Web App (CampusOS)]                  [Phía Chrome Extension]
 - Bắt đầu / Dừng Pomodoro                 - Giám sát URL tab đen (Blacklist)
 - Quản trị XP & Kỷ luật                   - Lockout HUD 5s + Giọng mắng
 - Tùy chọn bật Webcam                     - Đồng bộ trạng thái 2 chiều
```

### Bước 1: Giao thức Cầu nối Hai chiều (Two-Way Communication Protocol)
- **Vấn đề**: Chrome Extension Manifest V3 cần giao tiếp với Web App chạy ở `http://localhost:3000` mà không bị gián đoạn hay phụ thuộc vào Extension ID cố định (vốn thay đổi khi tải unpacked trong môi trường phát triển).
- **Giải pháp**: Thiết kế cơ chế cầu nối lai (Hybrid Bridge):
  1. **Content Script Relay**: Inject content script của Extension vào cả `http://localhost:3000/*` (song song với các trang blacklist). Content script này đóng vai trò cầu nối DOM event:
     - Lắng nghe sự kiện từ Web App: `window.addEventListener('message', ...)` với `event.data.source === 'CAMPUSOS_WEB'`.
     - Chuyển tiếp tới Background Service Worker qua `chrome.runtime.sendMessage(event.data)`.
     - Khi nhận chỉ thị từ Background (ví dụ vi phạm phát hiện trên tab khác), Content script dispatch sự kiện `window.postMessage({ source: 'CAMPUSOS_EXTENSION', type: 'VIOLATION_DETECTED', ... })` về trang Web App.
  2. **Direct Externally Connectable**: Cấu hình `"externally_connectable": { "matches": ["http://localhost:3000/*", "https://*.vercel.app/*"] }` trong `manifest.json`. Web App có thể kiểm tra `window.chrome?.runtime?.sendMessage(EXTENSION_ID, ...)` khi cần ping trực tiếp.

### Bước 2: Bảng định nghĩa Message Contract giữa Web và Extension

| Chiều | Action / Type | Payload | Ý nghĩa |
|---|---|---|---|
| Web -> Ext | `START_FOCUS` | `{ durationMinutes, characterSlug, roastLevel, targetTaskTitle }` | Bật chế độ giám sát khắt khe trên toàn trình duyệt |
| Web -> Ext | `PAUSE_FOCUS` | `{}` | Tạm dừng giám sát |
| Web -> Ext | `STOP_FOCUS` | `{}` | Hủy phiên học, trở về trạng thái idle |
| Web -> Ext | `COMPLETE_FOCUS` | `{}` | Hoàn thành phiên, tắt giám sát |
| Web -> Ext | `REQUEST_EXEMPTION` | `{ durationSeconds: 120 }` | Bật chế độ ân hạn 2 phút (cho phép tra cứu) |
| Web -> Ext | `UPDATE_BLACKLIST` | `{ blacklist: string[] }` | Đồng bộ danh sách trang web cấm từ Web App |
| Ext -> Web | `VIOLATION_DETECTED` | `{ reason: 'blacklist_url' \| 'face_away' \| 'sleep', domain, penaltyXp: 50 }` | Báo cáo vi phạm, kích hoạt trừ -50 XP và phát âm thanh |
| Ext -> Web | `PING` / `PONG` | `{ version, status }` | Bắt tay phát hiện Extension đã cài đặt |

### Bước 3: Cập nhật Store `campus-store.ts` cho Phạt XP
- Khi nhận thông điệp `VIOLATION_DETECTED` từ Extension:
  1. Gọi `penalizeViolation(50, 'Mở trang giải trí trong giờ học')`:
     - Trừ XP: `nextXp = Math.max(0, currentXp - 50)`.
     - Cập nhật lại Level và Rank Title.
     - Dispatch event `campusos-store-update` để toàn bộ UI (Hero, Game HUD, XP bar) cập nhật ngay lập tức.
     - Gọi `pushToSupabaseCloudDebounced()` để lưu điểm XP mới lên bảng `student_profiles` / `profiles`.
  2. Tăng số lần xấu hổ: gọi `incrementPomodoroShame()` trong `pomodoro-settings-store.ts`.
  3. Kích hoạt hiệu ứng răn đe trên Web App nếu modal đang mở.

### Bước 4: Tích hợp AI Webcam Face Tracking
- Khuyến nghị triển khai mô hình module nhẹ (Lightweight Face Mesh / Eye Aspect Ratio):
  - Chạy trực tiếp trong Web App khi phiên `StrictPomodoroModal` kích hoạt (hoặc qua offscreen canvas / web worker trong Extension).
  - Thuật toán Eye Aspect Ratio (EAR):
    $$\text{EAR} = \frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2 \|p_1 - p_4\|}$$
    Nếu $\text{EAR} < 0.2$ liên tục $> 10$ giây $\rightarrow$ Phát hiện ngủ gục (`sleep`).
  - Thuật toán Head Pose: Góc lệch Yaw $> 35^\circ$ hoặc không thấy khuôn mặt liên tục $> 10$ giây $\rightarrow$ Phát hiện quay mặt / bỏ đi nơi khác (`face_away`).
  - Kích hoạt giọng mắng tương ứng từ `characters-data.ts`.

---

## 3. Caveats (Các điểm cần lưu ý & Giả định)

1. **Quyền truy cập Webcam trong trình duyệt**:
   - `getUserMedia` yêu cầu người dùng cấp quyền (Permission Prompt) và chỉ hoạt động trên HTTPS hoặc `localhost`. Cần có giao diện xin quyền rõ ràng kèm giải thích "Dữ liệu camera chỉ xử lý cục bộ trên máy bạn, 100% không upload lên server".
2. **Khác biệt môi trường Production vs Localhost**:
   - Khi chạy ở môi trường phát triển (`http://localhost:3000`), Chrome gán ID ngẫu nhiên cho extension dạng unpack. Cần cơ chế tự động nhận diện Extension qua handshake content script thay vì phụ thuộc cứng vào Extension ID.
3. **Thao tác đóng Tab của Extension**:
   - Extension API `chrome.tabs.remove(tabId)` yêu cầu quyền `"tabs"` trong `manifest.json`. Khi đếm ngược 5 giây kết thúc, Service Worker cần đóng tab vi phạm và gọi `chrome.tabs.update(campusTabId, { active: true })` để đưa người dùng trở lại tab CampusOS.

---

## 4. Conclusion (Kết luận & Đề xuất hành động cho Implementer)

1. **Khả năng tương thích của CampusOS**: Cực kỳ cao và sẵn sàng 95%. Hệ thống đã có đầy đủ:
   - UI Mèo Cam Mập và đồng hồ 0:52 (`meme-cat-stage.tsx`).
   - Engine tổng hợp giọng nói Neural TTS tiếng Bắc (`/api/tts`).
   - Kịch bản câu thoại cho cả rời tab, quay mặt đi và ngủ gục (`characters-data.ts`).
   - Arbiter phân xử cooldown và cấp miễn trừ (`supervisor-arbiter.ts`).
   - Store đồng bộ thời gian thực Supabase (`campus-store.ts`, `supabase-sync.ts`).
2. **Các hạng mục cụ thể cần triển khai (Action Items)**:
   - **Tác vụ 1 (`extension/manifest.json` & `background.js`)**: Nâng cấp manifest chuẩn MV3 đầy đủ permissions (`tabs`, `storage`, `activeTab`, `scripting`), cấu hình `externally_connectable` và xây dựng Background Service Worker quản lý phiên Pomodoro và sự kiện tab.
   - **Tác vụ 2 (`extension/content.js`)**: Nâng cấp Content Script thành Cyber-Glass Lockout HUD (làm mờ 25px toàn trang, rung lắc màn hình, đếm ngược 5s cưỡng chế đóng tab, nút ân hạn 2p, phát giọng mắng Neural TTS từ `/api/tts`).
   - **Tác vụ 3 (`extension/popup/`)**: Xây dựng giao diện Popup của Extension hiển thị đồng hồ Pomodoro đồng bộ và danh sách Blacklist domains tùy chỉnh.
   - **Tác vụ 4 (`web/src/lib/campus-store.ts`)**: Bổ sung action `penalizeViolation(amount = 50, reason)` để trừ XP và đồng bộ Supabase Cloud.
   - **Tác vụ 5 (`web/src/features/pomodoro/use-extension-bridge.ts`)**: Tạo hook cầu nối liên lạc hai chiều giữa Web App và Chrome Extension.
   - **Tác vụ 6 (`web/src/app/(main)/extension/page.tsx`)**: Tạo trang hướng dẫn cài đặt và cấu hình Extension để nút "Cài đặt" trong `/settings` hoạt động hoàn hảo.
   - **Tác vụ 7 (AI Webcam Tracking)**: Tích hợp hook giám sát khuôn mặt nhẹ nhàng bật/tắt được theo cấu hình.

---

## 5. Verification Method (Phương pháp Kiểm chứng Độc lập)

Các lệnh kiểm tra để xác nhận hệ thống không bị hồi quy (regression) và sẵn sàng tích hợp:

1. **Kiểm tra Type Safety**:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run typecheck
   ```
   *Kỳ vọng: Thoát mã 0, 0 lỗi TypeScript.*

2. **Kiểm tra Bộ Test Suite Toàn Dự án**:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm test
   ```
   *Kỳ vọng: 380/380 tests PASS (bao gồm `supervisor-arbiter.test.ts`, `pomodoro-leo.test.ts`, `tasks-redesign.test.ts`).*

3. **Kiểm tra Cú pháp & Tải Extension**:
   - Mở Chrome/Edge tại `chrome://extensions`.
   - Bật "Developer mode".
   - Bấm "Load unpacked" trỏ vào thư mục `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\extension`.
   - *Kỳ vọng: Tải thành công không có lỗi Manifest JSON hay cú pháp Service Worker.*

4. **Kiểm tra Endpoint TTS**:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3000/api/tts" -Method Post -ContentType "application/json" -Body '{"text":"Tập trung học bài ngay!","gender":"female","tone":"sarcastic"}' -OutFile "test_tts.mp3"
   ```
   *Kỳ vọng: Trả về file âm thanh `audio/mpeg` hợp lệ.*

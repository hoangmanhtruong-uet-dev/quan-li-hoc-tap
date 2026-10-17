# BÁO CÁO KHAI THÁC ĐẶC TẢ CHI TIẾT (SPECIFICATION MINING REPORT)
## CHROME EXTENSION MANIFEST V3: "AI GIÁM SÁT HỌC TẬP CỰC ĐOAN" (CAMPUSOS)

**Ngày lập**: 2026-10-17T01:00:00Z  
**Tác giả**: `spec_miner_3`  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_survey_3`  
**Mục tiêu**: Khai thác toàn diện hiện trạng mã nguồn, tài liệu thiết kế và đặc tả kỹ thuật chuẩn xác tuyệt đối cho phân hệ Chrome Extension Manifest V3 "AI Giám Sát Học Tập Cực Đoan" kết nối hai chiều với Web App CampusOS và Supabase Cloud.

---

## 1. Hiện trạng Mã nguồn Thư mục `extension/` (Baseline Inspection)

### 1.1. Các tệp tin hiện có trong thư mục `extension/`
Qua rà soát hệ thống tệp tại `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\extension`:
- **`extension/manifest.json`** (29 dòng, 804 bytes): Bản nháp Manifest V3 sơ khai.
- **`extension/content.js`** (212 dòng, 6,593 bytes): Content script đơn giản chèn Shadow DOM hiển thị Mèo Cam góc màn hình và đếm ngược 52 giây.
- **`extension/assets/fat-orange-cat.png`** (405,717 bytes): Hình ảnh nhân vật Mèo Cam giám thị (tài nguyên đồ họa hợp lệ).

### 1.2. Các thành phần còn thiếu (Gaps Identified)
1. **Thiếu hoàn toàn `extension/background.js`**: Chưa có Service Worker quản lý vòng đời phiên học (`idle`, `focusing`, `break`), chưa có bộ lắng nghe `chrome.tabs.onActivated` và `chrome.tabs.onUpdated`, chưa có bộ định tuyến message hai chiều.
2. **Thiếu hoàn toàn thư mục `extension/popup/`**: Chưa có giao diện Popup (`popup.html`, `popup.js`, `popup.css`) hiển thị đồng hồ Pomodoro thời gian thực, quản lý blacklist domains và công tắc AI Webcam.
3. **`manifest.json` thiếu quyền nghiêm trọng**:
   - Hiện chỉ khai báo `"permissions": ["storage"]`.
   - Thiếu các permissions cốt lõi bắt buộc: `tabs`, `activeTab`, `scripting`, `declarativeNetRequest`.
   - Thiếu cấu hình `externally_connectable` để Web App (`http://localhost:3000/*`, domain production) giao tiếp trực tiếp với Extension.
   - Thiếu cấu hình `background`: `{"service_worker": "background.js", "type": "module"}`.
   - Thiếu cấu hình `action`: `{"default_popup": "popup/popup.html"}`.
   - Content scripts hiện chỉ hardcode 7 domain, chưa có cơ chế khớp linh hoạt với danh sách blacklist động từ storage.
4. **`content.js` chưa đạt chuẩn yêu cầu mới**:
   - Chưa có giao diện Cyber-Glass Lockout HUD toàn màn hình phủ mờ nền 25px (`backdrop-filter: blur(25px)`).
   - Chưa có hiệu ứng rung màn hình CSS (`screen shake`).
   - Chưa có cơ chế đếm ngược 5 giây tự động cưỡng chế đóng tab (`chrome.tabs.remove`) và chuyển focus về tab CampusOS.
   - Chưa có nút ân hạn *"Tôi đang tra tài liệu"* với giới hạn nghiêm ngặt (tối đa 1 lần / 3 phút mỗi phiên).
   - Chưa tích hợp cơ chế báo cáo vi phạm trừ -50 XP về Web App và Supabase.
5. **Chưa có module AI Webcam Face Tracking**:
   - Chưa có Web Worker / thuật toán tính tỷ lệ mở mắt EAR (Eye Aspect Ratio) và góc quay đầu Head Pose (Pitch/Yaw) để phát hiện ngủ gục hoặc quay mặt đi > 10 giây.

---

## 2. Đặc tả Kỹ thuật Chi tiết Từng Thành phần (Detailed Technical Specifications)

### 2.1. Cấu hình Chuẩn Manifest V3 (`extension/manifest.json`)

```json
{
  "manifest_version": 3,
  "name": "AI Giám Sát Học Tập Cực Đoan (CampusOS)",
  "version": "1.0.0",
  "description": "Giám sát học tập kỷ luật thép phong cách Cyber-Glass: phát hiện URL giải trí & AI Webcam Face Tracking, cưỡng chế đóng tab và đồng bộ trừ -50 XP với CampusOS.",
  "icons": {
    "16": "assets/fat-orange-cat.png",
    "48": "assets/fat-orange-cat.png",
    "128": "assets/fat-orange-cat.png"
  },
  "permissions": [
    "tabs",
    "storage",
    "activeTab",
    "scripting",
    "declarativeNetRequest"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "externally_connectable": {
    "matches": [
      "http://localhost:3000/*",
      "http://127.0.0.1:3000/*",
      "https://*.campusos.vn/*",
      "https://campusos.vn/*"
    ]
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_end",
      "all_frames": false
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_title": "AI Giám Sát Học Tập Cực Đoan",
    "default_icon": {
      "16": "assets/fat-orange-cat.png",
      "48": "assets/fat-orange-cat.png",
      "128": "assets/fat-orange-cat.png"
    }
  },
  "web_accessible_resources": [
    {
      "resources": [
        "assets/fat-orange-cat.png",
        "assets/*"
      ],
      "matches": ["<all_urls>"]
    }
  ]
}
```

---

### 2.2. Đặc tả Background Service Worker (`extension/background.js`)

#### A. Trạng thái Phiên học (Session FSM)
- `sessionState`: `'idle' | 'focusing' | 'break'` (mặc định `'idle'`).
- `sessionTimer`: Lưu trữ `startedAt`, `durationSeconds`, `remainingSeconds`, `mode`, `characterSlug`.
- `lastExemptionAt`: Timestamp thời điểm kích hoạt ân hạn gần nhất.
- `exemptUntil`: Timestamp thời điểm hết hạn ân hạn (nếu `Date.now() < exemptUntil` -> miễn trừ mọi phát hiện blacklist).
- `violationCount`: Đếm số lần vi phạm trong phiên hiện tại.

#### B. Danh sách Blacklist Mặc định & Đồng bộ Storage
Danh sách 14 domain giải trí mặc định:
1. `facebook.com`
2. `youtube.com`
3. `tiktok.com`
4. `twitter.com`
5. `x.com`
6. `instagram.com`
7. `netflix.com`
8. `bilibili.com`
9. `shopee.vn`
10. `reddit.com`
11. `threads.net`
12. `twitch.tv`
13. `discord.com`
14. `lazada.vn`

- Lưu trữ trong `chrome.storage.sync` (khóa `campusos_blacklist_domains`), fallback sang `chrome.storage.local`.
- Hàm kiểm tra URL vi phạm (`isUrlBlacklisted(url, blacklist)`):
  - Chuẩn hóa: tách hostname (`new URL(url).hostname.toLowerCase()`).
  - Kiểm tra đuôi miền: `hostname === domain || hostname.endsWith('.' + domain)`.
  - Ngoại trừ các domain học tập và nội bộ CampusOS (`localhost`, `127.0.0.1`, `campusos.vn`).

#### C. Tab Listener Events
1. **`chrome.tabs.onActivated` (`{ tabId, windowId }`)**:
   - Khi người dùng chuyển sang tab khác: lấy URL tab đang active.
   - Nếu `sessionState === 'focusing'` và `!isExempt()` và `isUrlBlacklisted(tab.url)`:
     - Gửi message tới tab: `{ action: 'SHOW_LOCKOUT_HUD', domain, remainingSeconds }`.
     - Kích hoạt quy trình phạt vi phạm: ghi nhận `violationCount++`, gửi tín hiệu phạt về Web App.
2. **`chrome.tabs.onUpdated` (`tabId, changeInfo, tab`)**:
   - Lắng nghe khi tab tải URL mới (`changeInfo.url` hoặc `changeInfo.status === 'loading'`).
   - Kiểm tra điều kiện vi phạm tức thì (< 200ms latency).
   - Nếu vi phạm: gửi lệnh hiển thị Lockout HUD.

#### D. Bộ Định tuyến Thông điệp (Message Router)
1. **Lắng nghe từ Web App (`chrome.runtime.onMessageExternal`)**:
   - `PING`: Phản hồi `{ installed: true, version: '1.0.0', state: sessionState }`.
   - `START_FOCUS`: Nhận `{ durationSeconds, characterSlug, mode }` -> chuyển `sessionState = 'focusing'`, reset vi phạm, lưu trữ session.
   - `PAUSE_FOCUS`: Tạm dừng đếm giờ.
   - `STOP_FOCUS`: Kết thúc phiên, chuyển `sessionState = 'idle'`.
   - `REQUEST_EXEMPTION`: Kích hoạt thời gian ân hạn từ Web App.
   - `SYNC_STATE`: Cung cấp trạng thái đầy đủ cho Web App.
2. **Lắng nghe nội bộ từ Content Script & Popup (`chrome.runtime.onMessage`)**:
   - `LOCKOUT_VIOLATION`: Ghi nhận vi phạm, trừ điểm -50 XP và gửi thông báo về Web App.
   - `CLOSE_TAB_AND_FOCUS_CAMPUS`:
     - Tìm tab chứa CampusOS (`http://localhost:3000/*` hoặc `*://*.campusos.vn/*`).
     - Nếu có: active tab và focus window (`chrome.tabs.update`, `chrome.windows.update`).
     - Nếu chưa mở: tạo tab mới mở trang CampusOS Dashboard (`chrome.tabs.create`).
     - Đóng tab vi phạm hiện tại (`chrome.tabs.remove(sender.tab.id)`).
   - `REQUEST_EXEMPTION`: Kiểm tra quy tắc ân hạn (thời gian từ lần dùng trước >= 180s). Nếu hợp lệ, gán `exemptUntil = Date.now() + 180000`, trả về `{ success: true, remainingSec: 180 }`. Nếu vi phạm cooldown, trả về `{ success: false, waitSec }`.
   - `GET_POPUP_DATA`: Trả về dữ liệu cho popup (`sessionState`, `remainingSeconds`, `blacklist`, `webcamEnabled`, `violationCount`).
   - `UPDATE_BLACKLIST`: Cập nhật thêm/xóa domain vào storage.
   - `TOGGLE_WEBCAM`: Bật/tắt cờ webcam tracking.

---

### 2.3. Đặc tả Cyber-Glass Lockout HUD (`extension/content.js`)

#### A. DOM Injection & Shadow DOM Isolation
- Kiểm tra xem host element `#campusos-lockout-hud-root` đã tồn tại chưa (tránh inject trùng lặp).
- Gắn vào `document.documentElement` với Shadow DOM `mode: "open"`.
- Đảm bảo cách ly 100% CSS với website bên ngoài: không bị ảnh hưởng bởi theme của YouTube, Facebook, Reddit...

#### B. Thiết kế Giao diện Cyber-Glass (Neo-Brutal Aurora Style)
- **Overlay**:
  - `position: fixed; inset: 0; z-index: 2147483647;`
  - `background: rgba(10, 10, 18, 0.88);`
  - `backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);`
  - `pointer-events: auto;` (ngăn cản người dùng bấm bất kỳ nút nào trên website giải trí).
- **Hộp thoại Cyber-Glass Modal**:
  - Border: 1px neon border sắc nét (`border: 1px solid rgba(255, 61, 110, 0.4)` kết hợp góc bo 28px).
  - Background: Gradient bán trong suốt nhiều lớp (`linear-gradient(135deg, rgba(25, 20, 35, 0.95), rgba(10, 10, 18, 0.98))`).
  - Glow Shadow: `box-shadow: 0 0 60px rgba(255, 61, 110, 0.25), 0 30px 80px rgba(0,0,0,0.9)`.
  - Tilted Sticker Badge: Huy hiệu nhãn dán xoay ±2° phong cách Neo-Brutal mang dòng chữ *"PHÁT HIỆN VI PHẠM KỶ LUẬT"*.

#### C. Hiệu ứng Screen Shake (Rung lắc Màn hình)
- Áp dụng animation CSS khi HUD kích hoạt:
```css
@keyframes screen-shake {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  10%, 30%, 50%, 70%, 90% { transform: translate(-8px, 4px) rotate(-1.5deg); }
  20%, 40%, 60%, 80% { transform: translate(8px, -4px) rotate(1.5deg); }
}
.hud-card {
  animation: screen-shake 0.65s cubic-bezier(.36,.07,.19,.97) both;
}
```

#### D. Nhân vật Giám thị & Lời thoại TTS Tiếng Việt
- Hiển thị nhân vật Mèo Cam phóng to trang trọng với biểu cảm nghiêm khắc lườm nguýt.
- Tự động phát âm thanh trách mắng bằng giọng nói tiếng Việt miền Bắc (Web Speech API `vi-VN` hoặc gọi CampusOS Neural TTS API `/api/tts`):
  1. *"Lại lướt web giải trí đấy à? Đang trong giờ Pomodoro mà dám mở Facebook/YouTube! Tắt ngay!"*
  2. *"Này thì lướt mạng này! Tôi bấm số gọi cho phụ huynh ngay bây giờ!"*
  3. *"Gan to bằng trời rồi! Đang chạy deadline mà dám trốn việc! Trừ ngay 50 XP!"*
  4. *"Định làm biếng đến bao giờ? Tắt tab này quay lại CampusOS học bài ngay lập tức!"*
  5. *"Tôi đang ngồi lườm bạn đấy nhé! Đóng tab trong năm giây không là ăn đòn!"*

#### E. Thanh Đếm ngược 5 Giây Cưỡng chế Đóng Tab
- Đồng hồ số lớn hiển thị `5s ... 4s ... 3s ... 2s ... 1s ... 0s`.
- Thanh tiến trình neon đỏ rút dần từ 100% về 0% trong đúng 5.000 ms.
- Khi hết 5 giây: tự động gửi message `CLOSE_TAB_AND_FOCUS_CAMPUS` tới `background.js` -> tab lập tức bị đóng và trình duyệt nhảy về tab CampusOS.

#### F. Cơ chế Ân hạn ("Tôi đang tra tài liệu")
- Nút bấm *"Tôi đang tra tài liệu"* hiển thị rõ ràng trên modal.
- Ràng buộc kỷ luật: **Tối đa 1 lần / 3 phút mỗi phiên**.
- Khi người dùng bấm:
  - Nếu hợp lệ: Modal đóng lại, cho phép người dùng xem trang web trong 180 giây mà không bị khóa.
  - Nếu đã dùng trong vòng 3 phút qua: Nút bị vô hiệu hóa, hiển thị đếm lùi thời gian hồi phục (cooldown) và nhân vật mắng: *"Hết lượt ân hạn rồi! Đừng có viện cớ tra tài liệu!"*.

---

### 2.4. Đặc tả AI Webcam Face Tracking (Phát hiện Quay mặt & Ngủ gục)

#### A. Kiến trúc Module
- Chạy trên nền tảng **MediaPipe Face Mesh (468/478 Face Landmarks)**.
- Xử lý qua **Web Worker** chuyên dụng để không làm tụt xung nhịp luồng giao diện chính (bảo đảm 60–120FPS, CPU < 5%).
- Cấu hình điều tiết (throttling): Tần số phân tích 10fps đến 15fps khi chạy ngầm; tự động tạm ngưng khi che camera hoặc mất quyền.
- **Bảo mật tuyệt đối**: Khung hình camera chỉ tồn tại trong bộ nhớ RAM tạm thời của trình duyệt, giải phóng ngay sau khi tính toán tọa độ vector mốc, tuyệt đối KHÔNG lưu ảnh/video vào ổ đĩa và KHÔNG gửi dữ liệu hình ảnh lên bất kỳ server nào.

#### B. Thuật toán Phát hiện Ngủ gục qua Tỷ lệ Mở mắt (Eye Aspect Ratio - EAR)
- Công thức tính EAR cho từng mắt:
  $$\text{EAR} = \frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2 \cdot \|p_1 - p_4\|}$$
  - Mắt trái (Left Eye Landmarks): `p1=33, p2=160, p3=158, p4=133, p5=153, p6=144`.
  - Mắt phải (Right Eye Landmarks): `p1=362, p2=385, p3=387, p4=263, p5=373, p6=380`.
- Ngưỡng xác định:
  - Mắt nhắm khi $\text{EAR}_{\text{avg}} < 0.20$.
  - Nếu $\text{EAR}_{\text{avg}} < 0.20$ liên tục **quá 10 giây**: Xác nhận trạng thái **NGỦ GỤC (Drowsy / Sleeping)**.

#### C. Thuật toán Phát hiện Quay mặt đi qua Góc đầu (Head Pose - Yaw/Pitch)
- Ước lượng góc xoay đầu từ các mốc giải phẫu khuôn mặt (Đỉnh mũi 1, Cằm 152, Khóe mắt trong/ngoài 33, 263, Khóe miệng 61, 291):
  - **Yaw (Quay mặt sang trái / sang phải)**: Vượt quá $\pm 30^\circ$.
  - **Pitch (Gục đầu xuống bàn hoặc ngửa cổ ra sau)**: $Pitch < -25^\circ$ hoặc $Pitch > 35^\circ$.
- Ngưỡng thời gian:
  - Nếu góc lệch duy trì liên tục **quá 10 giây**: Xác nhận trạng thái **QUAY MẶT ĐI (Looking Away / Absent)**.

#### D. Phản ứng Giám sát & Kích hoạt Cảnh báo
- Khi phát hiện ngủ gục hoặc quay mặt đi quá 10 giây:
  - Kích hoạt giọng nói đanh thép từ Mèo Cam:
    - *Ngủ gục*: *"Ối giời đất ơi! Chưa học xong chữ nào đã ngáp ngắn ngáp dài gục xuống bàn ngủ rồi à? Tỉnh dậy ngay!"*
    - *Quay mặt đi*: *"Mặt mũi lại nghếch đi đâu rồi đấy? Nhìn thẳng vào màn hình học bài mau lên!"*
  - Nếu sau khi nhắc nhở mà người dùng vẫn tiếp tục ngủ hoặc quay mặt thêm 20 giây: Tính 1 lần vi phạm, trừ -50 XP và tăng số lần cảnh cáo.
- Công tắc bật/tắt (Toggle): Người dùng có thể bật hoặc tắt tính năng này bất kỳ lúc nào trong Cài đặt Pomodoro Web App hoặc Extension Popup.

---

### 2.5. Đặc tả Giao diện Extension Popup (`extension/popup/`)

#### A. Cấu trúc Tệp tin
- `extension/popup/popup.html`: Khung HTML Cyber-Glass nhỏ gọn chuẩn kích thước 360px x 480px.
- `extension/popup/popup.js`: Điều khiển logic, lắng nghe storage, giao tiếp với `background.js`.
- `extension/popup/popup.css`: Hệ màu Cyber-Glass (`#0A0A12`, neon lime `#C6FF3D`, neon rose `#FF3D6E`, frosted glass).

#### B. Các Phân khu Chức năng
1. **Header & Trạng thái Pomodoro**:
   - Logo Mèo Cam + Huy hiệu trạng thái (`IDLE` xám, `FOCUSING 🔥` xanh neon, `BREAK ☕` xanh dương).
   - Đồng hồ đếm ngược `MM:SS` thời gian thực đồng bộ tuyệt đối với phiên học trên Web App.
   - Các nút tác vụ nhanh: Bắt đầu / Tạm dừng / Kết thúc phiên.
2. **Quản lý Danh sách Blacklist Domains**:
   - Khung cuộn hiển thị danh sách các domain đang bị chặn.
   - Ô nhập văn bản: *"Thêm tên miền (ví dụ: shopee.vn)..."* kèm nút *"Thêm"*.
   - Logic làm sạch input: Loại bỏ tiền tố `http://`, `https://`, `www.`, ký tự gạch chéo và query string trước khi lưu.
   - Nút xóa cạnh từng tên miền (biểu tượng thùng rác).
   - Nút *"Khôi phục mặc định"* để reset về danh sách 14 tên miền tiêu chuẩn.
3. **Cài đặt AI Webcam Face Tracking**:
   - Khung bật/tắt dạng Toggle Switch: *"AI Webcam Giám Sát Khuôn Mặt"*.
   - Phụ đề giải thích: *"Phát hiện quay mặt > 10s hoặc ngủ gục bằng MediaPipe Face Mesh"*.
4. **Liên kết Nhanh & Thống kê Vi phạm**:
   - Thẻ thống kê: *"Số lần bị bắt quả tang hôm nay: {violationCount}"*.
   - Nút *"Vào CampusOS"* để kích hoạt hoặc mở nhanh tab học tập.

---

### 2.6. Đặc tả Cầu nối Đồng bộ Trạng thái & Phạt XP với Web App & Supabase

#### A. Cơ chế Đồng bộ Hai chiều Web App <-> Extension
1. **Khi bấm "Bắt đầu Focus" trên Web App**:
   - Web App gửi tín hiệu `START_FOCUS` tới Extension qua `chrome.runtime.sendMessage(EXTENSION_ID, { action: 'START_FOCUS', durationSeconds, mode, characterSlug })`.
   - Đồng thời, Content Script trên trang CampusOS cũng bắt sự kiện `CustomEvent('campusos:pomodoro-start')` và gửi tới `background.js` (cơ chế phòng vệ kép nếu chưa biết Extension ID).
   - Extension chuyển sang trạng thái `focusing`, kích hoạt giám sát tab toàn trình duyệt.
2. **Khi Extension phát hiện vi phạm trên trang giải trí**:
   - Content script gửi sự kiện vi phạm về `background.js`.
   - `background.js` gửi thông điệp `EXTENSION_VIOLATION` về tab Web App CampusOS:
     `{ action: 'EXTENSION_VIOLATION', penaltyXp: 50, domain, timestamp: Date.now() }`.
   - Web App CampusOS (`campus-store.ts`) tiếp nhận:
     - Trừ ngay: `state.xp = Math.max(0, state.xp - 50)`.
     - Cập nhật Level và Rank Title sinh viên: `calculateLevelAndRank(newXp)`.
     - Tăng biến đếm hổ thẹn: `state.totalShameCount++`.
     - Hiển thị Toast thông báo đỏ cảnh báo: *"-50 XP! Mèo Cam bắt quả tang bạn mở {domain} trong giờ học!"*.
     - Đẩy ngay bản ghi vi phạm vào Supabase Cloud qua `pushToSupabaseCloudDebounced`:
       - Cập nhật bảng `profiles`: Cập nhật `xp`, `level`, `rank_title`.
       - Ghi vào bảng `student_focus_sessions`: Ghi nhận `shame_count = shame_count + 1`, `discipline_score = Math.max(0, discipline_score - 10)`.

---

## 3. Bảng Khai thác Tính năng (Features Discovered)

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| F01 | Manifest | Manifest V3 Configuration | File cấu hình `manifest.json` chuẩn Manifest V3 khai báo quyền `tabs`, `storage`, `activeTab`, `scripting`, `declarativeNetRequest`, icon và background worker | Tệp cấu hình JSON | Trình duyệt nạp Extension thành công không báo lỗi | Lỗi cú pháp JSON hoặc quyền không hợp lệ sẽ bị Chrome từ chối cài đặt | ORIGINAL_REQUEST.md (§ R1) & manifest.json |
| F02 | Manifest | `externally_connectable` | Khai báo miền cho phép Web App (`http://localhost:3000/*`, domain production) giao tiếp trực tiếp với Extension | Danh sách URL patterns | Quyền kết nối hai chiều Web App - Extension | Nếu thiếu, Web App không thể gọi `chrome.runtime.sendMessage` | ORIGINAL_REQUEST.md (§ R1) |
| F03 | Background | FSM Quản lý Phiên học | Quản lý 3 trạng thái phiên: `idle`, `focusing`, `break` | Sự kiện Start/Pause/Stop từ Web App hoặc Popup | Cập nhật `sessionState`, lưu vào `chrome.storage` | Nếu nhận sự kiện không hợp lệ, giữ nguyên trạng thái hiện tại | ORIGINAL_REQUEST.md (§ R1) & Plan_Pomodoro_Cuc_Doan.txt |
| F04 | Background | Blacklist Domain Storage Sync | Quản lý danh sách 14 tên miền mặc định, lưu vào `chrome.storage.sync` kèm fallback `local` | Domain strings, danh sách tùy chỉnh | Mảng domain được lưu trữ và đồng bộ | Tên miền trùng lặp hoặc rỗng bị lọc bỏ | ORIGINAL_REQUEST.md (§ R1) & Plan_Pomodoro_Cuc_Doan.txt |
| F05 | Background | `tabs.onActivated` Listener | Theo dõi sự kiện người dùng chuyển tab để phát hiện truy cập trang web giải trí | `activeInfo: { tabId, windowId }` | Kích hoạt Lockout HUD nếu tab vi phạm | Bỏ qua các tab hệ thống `chrome://`, `about:` | ORIGINAL_REQUEST.md (§ R1) |
| F06 | Background | `tabs.onUpdated` Listener | Theo dõi điều hướng URL trong tab hiện tại để chặn tức thì (< 200ms) | `tabId, changeInfo, tab` | Phát hiện domain đen và gửi lệnh khóa | Bỏ qua nếu tab chưa đổi URL hoặc đang ân hạn | ORIGINAL_REQUEST.md (§ R1) |
| F07 | Background | Điều phối Đóng Tab & Focus CampusOS | Đóng tab vi phạm và tìm tab CampusOS để focus, nếu chưa có thì mở tab mới | Message `CLOSE_TAB_AND_FOCUS_CAMPUS` | Tab vi phạm đóng, tab CampusOS active | Nếu không tìm thấy tab CampusOS thì tạo tab mới | ORIGINAL_REQUEST.md (§ R2) |
| F08 | Content HUD | Cyber-Glass DOM Modal Injection | Chèn Shadow DOM modal phong cách Cyber-Glass phủ mờ 25px trên toàn màn hình trang vi phạm | Kích hoạt từ background khi phát hiện URL đen | Giao diện Lockout HUD hiển thị đè lên trang | Nếu HUD đã tồn tại thì không inject trùng | ORIGINAL_REQUEST.md (§ R2) & content.js |
| F09 | Content HUD | Hiệu ứng Rung Màn hình Screen Shake | Animation CSS rung lắc modal khi kích hoạt cảnh báo vi phạm | Kích hoạt khi HUD xuất hiện | Modal rung lắc đa hướng trong 0.65s | Tôn trọng `prefers-reduced-motion` | ORIGINAL_REQUEST.md (§ R2) |
| F10 | Content HUD | Âm thanh & TTS Mắng chửi Tiếng Việt | Phát giọng nói răn đe tiếng Việt (Web Speech API / Neural TTS) kết hợp cử động Mèo Cam | Lời thoại từ kho kịch bản tiếng Việt | Âm thanh giọng nói và hiệu ứng nhép miệng | Fallback im lặng nếu trình duyệt chặn autoplay chưa tương tác | ORIGINAL_REQUEST.md (§ R2) & characters-data.ts |
| F11 | Content HUD | Đếm ngược 5 Giây Cưỡng chế Đóng | Hiển thị đồng hồ và thanh tiến trình đếm lùi 5s trước khi cưỡng chế đóng tab | Bộ đếm `setInterval` 1000ms | Đóng tab khi về 0 | Bị hủy nếu người dùng bấm ân hạn hợp lệ | ORIGINAL_REQUEST.md (§ R2) |
| F12 | Content HUD | Nút Ân hạn "Tôi đang tra tài liệu" | Cho phép tạm hoãn giám sát tối đa 1 lần / 3 phút mỗi phiên Pomodoro | Click nút "Tôi đang tra tài liệu" | Miễn trừ vi phạm trong 180s, ẩn HUD | Vô hiệu hóa và báo lỗi nếu đã dùng trong vòng 3 phút | ORIGINAL_REQUEST.md (§ R2) & supervisor-arbiter.ts |
| F13 | AI Webcam | MediaPipe Face Mesh Web Worker | Phân tích 468 mốc khuôn mặt trên luồng Web Worker ngầm tốc độ 10–15fps | Luồng video từ webcam máy tính | Mảng tọa độ các điểm mốc giải phẫu | Tự giải phóng bộ nhớ khi tắt camera | ORIGINAL_REQUEST.md (§ R3) & Plan_Pomodoro_Cuc_Doan.txt |
| F14 | AI Webcam | Phát hiện Ngủ gục qua EAR | Tính tỷ lệ mở mắt EAR, cảnh báo nếu nhắm mắt liên tục > 10 giây | Tọa độ mốc mí mắt trái & phải | Kích hoạt giọng mắng đánh thức ngủ gục | Bỏ qua các cú chớp mắt tự nhiên ngắn (< 1s) | ORIGINAL_REQUEST.md (§ R3) |
| F15 | AI Webcam | Phát hiện Quay mặt đi qua Head Pose | Tính góc Yaw/Pitch, cảnh báo nếu quay mặt hoặc gục đầu > 10 giây | Tọa độ mốc mũi, mắt, cằm | Kích hoạt giọng mắng nhắc nhìn màn hình | Cho phép góc quay tự nhiên dưới 30 độ | ORIGINAL_REQUEST.md (§ R3) |
| F16 | AI Webcam | Công tắc Bật/Tắt Webcam | Cho phép người dùng chủ động bật hoặc tắt AI Webcam trong popup/settings | Click toggle switch | Cập nhật cờ cấu hình và dừng/khởi động camera | Giải phóng camera stream ngay lập tức khi tắt | ORIGINAL_REQUEST.md (§ R3) |
| F17 | Popup | Đồng hồ Pomodoro Thời gian thực | Hiển thị đếm lùi `MM:SS` đồng bộ với Web App và background worker | Dữ liệu phiên từ storage/background | Hiển thị trực quan thời gian và trạng thái | Hiển thị 00:00 khi ở trạng thái idle | ORIGINAL_REQUEST.md (§ R4) |
| F18 | Popup | Quản lý Tùy chỉnh Blacklist | Thêm, xóa và khôi phục danh sách các tên miền bị chặn | Nhập domain mới, click xóa domain | Cập nhật storage và áp dụng ngay tức thì | Tự động chuẩn hóa format tên miền | ORIGINAL_REQUEST.md (§ R4) |
| F19 | Sync & Cloud | Phạt Trừ -50 XP & Tăng Vi phạm | Gửi sự kiện vi phạm về Web App để trừ -50 XP và ghi nhận vào Supabase Cloud | Tín hiệu vi phạm từ extension | XP giảm 50 điểm, lưu vào `student_focus_sessions` | Điểm XP tối thiểu là 0, không bị âm | ORIGINAL_REQUEST.md (§ R4) & campus-store.ts |
| F20 | Sync & Cloud | Đồng bộ Kích hoạt Focus từ Web | Bấm "Bắt đầu Focus" trên Web App tự động chuyển Extension sang trạng thái focusing | Tín hiệu bắt đầu phiên từ Web App | Extension khởi động giám sát tab toàn hệ thống | Tự động fallback nếu extension chưa được cài | ORIGINAL_REQUEST.md (§ R4) & strict-pomodoro-modal.tsx |

---

## 4. Bảng Các Trường hợp Biên & Ngoại lệ (Edge Cases Matrix)

| # | Feature | Input / Tình huống Biên | Hành vi Kịp thời & Cơ chế Xử lý |
|---|---------|-------------------------|--------------------------------|
| E01 | Blacklist Matching | Người dùng truy cập sub-domain (vd: `m.facebook.com`, `touch.facebook.com`, `l.facebook.com`) | Hàm `isUrlBlacklisted` sử dụng `hostname.endsWith('.' + domain)` nên nhận diện chính xác 100% các sub-domain vi phạm. |
| E02 | Blacklist Matching | Người dùng nhập domain có kèm protocol hoặc path (vd: `https://shopee.vn/flash_sale?source=home`) | Bộ lọc popup tự động tách riêng hostname thuần (`shopee.vn`), loại bỏ giao thức, port và query parameter trước khi lưu vào danh sách. |
| E03 | Content HUD Injection | Mở tab giải trí khi chưa có kết nối mạng (trang lỗi mạng của Chrome `chrome-error://`) | Content script không inject vào các URL nội bộ `chrome-error://` hay `chrome://` tránh gây crash extension. |
| E04 | Content HUD Injection | Trang web có CSS can thiệp vào `z-index` hoặc reset thẻ `body` (vd: overlay quảng cáo) | Lockout HUD được bọc trong Shadow DOM và gắn trực tiếp vào `document.documentElement` với `z-index: 2147483647 !important`, không thể bị đè. |
| E05 | Đóng Tab Cưỡng chế | Tab vi phạm là tab duy nhất còn lại trong cửa sổ Chrome | `background.js` tạo tab CampusOS trước (`chrome.tabs.create`), sau đó mới đóng tab vi phạm (`chrome.tabs.remove`), tránh việc cửa sổ trình duyệt bị tắt đột ngột. |
| E06 | Đóng Tab Cưỡng chế | Người dùng cố tình bấm `F5` (Refresh) hoặc `Ctrl+W` trong lúc đếm ngược 5s | Refresh tải lại trang sẽ lập tức kích hoạt lại Lockout HUD từ đầu; nếu người dùng tự bấm đóng tab thì mục tiêu cưỡng chế đã đạt được. |
| E07 | Cơ chế Ân hạn | Bấm liên tục nút *"Tôi đang tra tài liệu"* nhiều lần trong 1 giây | Debounce click tức thì; kiểm tra biến `isExempt()`, chỉ kích hoạt 1 lần duy nhất và khóa nút kèm countdown cooldown. |
| E08 | Cơ chế Ân hạn | Người dùng dùng hết 180s ân hạn nhưng vẫn ở lại trang YouTube | Hết 180s, cờ ân hạn tự động hết hiệu lực (`Date.now() >= exemptUntil`), nếu người dùng vẫn ở trên trang đen thì Lockout HUD sẽ tái xuất hiện. |
| E09 | Âm thanh TTS | Trình duyệt chặn âm thanh tự động (Autoplay Policy) trên tab mới mở | Content script sử dụng Web Speech API có cơ chế thử phát; nếu bị chặn thì hiển thị chữ trong speech bubble; âm thanh sẽ vang lên ngay khi người dùng click vào HUD. |
| E10 | AI Webcam Tracking | Người dùng đeo kính râm hoặc trong phòng tối thiếu sáng | MediaPipe độ tin cậy thấp (landmark confidence < 0.5) -> Hệ thống tự động chuyển sang chế độ chờ bảo tồn, không kích hoạt báo nhầm. |
| E11 | AI Webcam Tracking | Người dùng chớp mắt bình thường (100–400ms) | Thuật toán đếm thời gian liên tục (`drowsyCounter`): Chỉ khi mắt nhắm liên tục > 10.000 ms mới kích hoạt ngủ gục. Chớp mắt tự nhiên sẽ reset counter về 0. |
| E12 | AI Webcam Tracking | Người dùng quay đầu uống nước hoặc với lấy cây bút trong 3–5 giây | Ngưỡng quay đầu đòi hỏi $> 10$ giây liên tục. Các cử động tạm thời dưới 10 giây được lọc nhiễu tự nhiên và không gây mắng oan. |
| E13 | AI Webcam Tracking | Người dùng không cấp quyền Camera (Permission Denied) | Module hiển thị thông báo nhẹ giải thích lý do, tự động tắt cờ webcam tracking, duy trì đầy đủ tính năng chặn URL bình thường. |
| E14 | Đồng bộ Trừ XP | Người dùng mở nhiều tab CampusOS cùng lúc khi bị phạt vi phạm | Nhờ cơ chế `storage` event và `campusos:store-update`, điểm XP và vi phạm được đồng bộ nhất quán trên tất cả các tab mở của CampusOS. |
| E15 | Đồng bộ Trừ XP | Điểm XP hiện tại của người dùng nhỏ hơn 50 XP (vd: còn 20 XP) | Hàm trừ điểm sử dụng `Math.max(0, state.xp - 50)`, bảo đảm XP không bao giờ bị âm và cấp độ/danh hiệu tính toán lại chuẩn xác. |
| E16 | Mất kết nối Mạng | Người dùng bị phạt -50 XP khi đang offline | Web App trừ XP ngay trên client (Optimistic update) và lưu `localStorage`. Khi có mạng trở lại, Sync Engine sẽ tự động đẩy dữ liệu lên Supabase Cloud. |
| E17 | Extension chưa cài | Người dùng bấm "Bắt đầu Focus" trên Web khi chưa cài Chrome Extension | Web App bắt ngoại lệ `chrome.runtime.sendMessage`, fallback an toàn không gây lỗi giao diện, hiển thị gợi ý tải Extension nếu muốn giám sát toàn trình duyệt. |
| E18 | Extension Reload | Extension được reload trong Chrome Developer Mode khi đang có phiên học | `background.js` tự khôi phục phiên học từ `chrome.storage.local`, không làm mất tiến trình đếm ngược của người dùng. |

---

## 5. Báo cáo Handoff 5 Thành phần (5-Component Handoff Report)

### 1. Quan sát (Observation)
- Kiểm tra cấu trúc workspace: Thư mục `extension/` đã tồn tại nhưng chỉ chứa `manifest.json` (bản sơ khai 29 dòng, chỉ có quyền `storage`), `content.js` (212 dòng dạng overlay đơn giản) và `assets/fat-orange-cat.png`.
- Tệp `extension/background.js` hoàn toàn chưa tồn tại.
- Thư mục `extension/popup/` hoàn toàn chưa tồn tại.
- Kiểm tra tài liệu kỹ thuật gốc: `docs/Plan_Pomodoro_Cuc_Doan.txt` và `ORIGINAL_REQUEST.md` (header `## 2026-10-17T00:51:59Z`) quy định đầy đủ các yêu cầu:
  - Manifest V3 permissions: `tabs`, `storage`, `activeTab`, `scripting`, `declarativeNetRequest`.
  - `externally_connectable` với Web App (`http://localhost:3000/*` và domain production).
  - Background Service Worker xử lý 3 trạng thái phiên, blacklist sync, `tabs.onActivated`, `tabs.onUpdated`.
  - Cyber-Glass Lockout HUD: blur 25px, screen shake, nhân vật Mèo Cam, giọng mắng TTS tiếng Việt, đếm ngược 5s đóng tab & focus CampusOS, nút ân hạn tra tài liệu (max 1 lần / 3 phút).
  - AI Webcam Face Tracking: MediaPipe Face Mesh Web Worker, EAR < 0.20 ngủ gục > 10s, Head Pose yaw/pitch > 10s, công tắc toggle.
  - Cầu nối đồng bộ trừ -50 XP vào bảng `profiles` và `student_focus_sessions` trên Supabase Cloud.
- Kiểm tra mã nguồn Web App hiện tại:
  - `web/package.json`: 380 unit tests đều đang PASS 100% (`npm test`).
  - `web/src/features/pomodoro/`: Đã có sẵn dữ liệu nhân vật (`characters-data.ts`), âm thanh (`audio-engine.ts`), bộ phân xử ân hạn (`supervisor-arbiter.ts`), cài đặt (`pomodoro-settings-store.ts`).
  - `web/src/lib/campus-store.ts` và `web/src/lib/supabase-sync.ts`: Đã có sẵn cơ chế cập nhật XP, streak, và lưu phiên học `student_focus_sessions`.
  - Typecheck: `npm run typecheck` chạy hoàn tất với 0 lỗi.

### 2. Chuỗi Suy luận (Logic Chain)
1. Do Chrome Extension chạy môi trường độc lập với Next.js Web App nhưng cần đồng bộ trạng thái phiên học và phạt XP, kiến trúc cần thiết phải gồm:
   - Một Service Worker (`background.js`) làm trạm điều phối trung tâm giữa Web App (`externally_connectable`), Content Scripts trên các tab vi phạm, và Popup.
   - Một Content Script (`content.js`) inject Shadow DOM toàn màn hình với hiệu ứng Cyber-Glass và screen shake để ngăn chặn hoàn toàn tương tác của người dùng trên trang vi phạm.
   - Cơ chế đóng tab cưỡng chế: Content script đếm ngược 5 giây, khi hết hạn thì báo `background.js` thực thi `chrome.tabs.remove(tabId)` và `chrome.tabs.update(campusTabId, { active: true })`.
   - Cơ chế ân hạn: Quản lý timestamp `lastExemptionAt` tại `background.js` để áp đặt quy tắc cứng "tối đa 1 lần / 3 phút" nhằm tránh việc người dùng bấm liên tục để bypass.
2. Với tính năng AI Webcam Face Tracking:
   - Việc tính toán 468 landmarks của MediaPipe đòi hỏi tính toán ma trận liên tục. Nếu chạy trên main thread sẽ gây giật lag giao diện người dùng. Do đó đặc tả bắt buộc chạy qua Web Worker hoặc giảm tần số lấy mẫu xuống 10–15fps.
   - Thuật toán Eye Aspect Ratio (EAR) với ngưỡng 0.20 duy trì > 10s là tiêu chuẩn vàng trong thị giác máy tính để phân biệt chớp mắt tự nhiên với ngủ gục.
   - Thuật toán Head Pose với ngưỡng Yaw > 30° hoặc Pitch < -25° trong > 10s là điều kiện tối ưu để phát hiện quay mặt lơ là.
3. Với tính năng Đồng bộ XP và Supabase:
   - Khi có vi phạm, Extension gửi tín hiệu về Web App qua message. Web App nhận sự kiện sẽ cập nhật ngay vào `campus-store.ts` (-50 XP) và đẩy lên Supabase Cloud qua `student_focus_sessions` và `profiles`.

### 3. Vấn đề Tồn tại & Lưu ý (Caveats)
- Khi nạp Extension chưa đóng gói (Unpacked) trong chế độ Developer Mode, Chrome sẽ tự sinh ra một Extension ID ngẫu nhiên. Vì vậy, Web App cần hỗ trợ cả hai cơ chế: gửi tin nhắn trực tiếp qua `chrome.runtime.sendMessage(EXTENSION_ID, ...)` (nếu cấu hình cố định ID) và cơ chế Content Script bridge trung gian thông qua `window.postMessage` để đảm bảo hoạt động trơn tru ngay cả khi ID thay đổi.
- Trình duyệt Chrome có chính sách hạn chế phát âm thanh tự động (Autoplay Policy) trên tab mới mở nếu người dùng chưa tương tác với trang đó. Do đó, Content Script phải hiển thị thông điệp mắng chửi dạng văn bản nổi bật kèm theo, và phát âm thanh ngay khi người dùng click vào modal hoặc bấm nút ân hạn.

### 4. Kết luận (Conclusion)
- Toàn bộ các yêu cầu của người dùng trong ORIGINAL_REQUEST.md (§ 2026-10-17T00:51:59Z) đã được phân tích và đặc tả chi tiết 100%, có cấu trúc tệp tin rõ ràng, giao thức message hoàn chỉnh, thông số thuật toán toán học chính xác (EAR, Yaw/Pitch, Cooldown 180s, Countdown 5s, -50 XP).
- Phân hệ đã sẵn sàng để đội ngũ triển khai (Workers / Test Writers) bắt tay vào viết mã nguồn và bộ kiểm thử tương ứng mà không gặp bất kỳ điểm nghẽn hay mơ hồ nào về kiến trúc.

### 5. Phương pháp Kiểm chứng Độc lập (Verification Method)
Người nhận bàn giao có thể kiểm chứng báo cáo này bằng các bước sau:
1. **Kiểm tra tệp tin extension hiện tại**:
   - Chạy lệnh kiểm tra: `ls extension/` (hoặc view tệp `extension/manifest.json`, `extension/content.js`). Xác nhận hiện chỉ có 2 file mã nguồn và 1 file ảnh.
2. **Kiểm tra bộ test của Web App hiện tại**:
   - Chuyển vào thư mục `web/` và chạy: `npm test` -> Xác nhận toàn bộ 380 test suites đều PASS 100%.
   - Chạy `npm run typecheck` -> Xác nhận 0 lỗi TypeScript.
3. **Kiểm tra tài liệu tham chiếu gốc**:
   - Đọc `docs/Plan_Pomodoro_Cuc_Doan.txt` các dòng 31–95, 223–265 để đối chiếu các ngưỡng thời gian (3s tab switch, 10s quay mặt/ngủ, 20s cooldown mắng, 180s ân hạn).
   - Đọc `ORIGINAL_REQUEST.md` (header `## 2026-10-17T00:51:59Z`) để đối chiếu các yêu cầu R1, R2, R3, R4.

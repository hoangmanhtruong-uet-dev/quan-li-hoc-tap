# BÁO CÁO BÀN GIAO MILESTONE 1 (M1 HANDOFF REPORT)
## MANIFEST V3 CONFIGURATION & BACKGROUND SERVICE WORKER ARCHITECTURE

**Worker**: `worker_m1_1`  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1_1`  
**Timestamp**: 2026-10-17T01:05:30Z  

---

### 1. Quan sát (Observation)
1. **Trạng thái ban đầu của thư mục `extension/`**:
   - `extension/manifest.json`: Chỉ có 29 dòng, chỉ khai báo quyền `"permissions": ["storage"]`, thiếu các quyền cốt lõi `tabs`, `activeTab`, `scripting`, `declarativeNetRequest`, thiếu `externally_connectable`, thiếu `background` service worker và `action`.
   - `extension/background.js`: Hoàn toàn chưa tồn tại.
2. **Yêu cầu nhiệm vụ tại `ORIGINAL_REQUEST.md` (header `## 2026-10-17T00:51:59Z`) và `PROJECT.md`**:
   - Manifest V3 hợp lệ với name `"AI Giám Sát Học Tập Cực Đoan (CampusOS)"`.
   - Permissions: `["tabs", "storage", "activeTab", "scripting", "declarativeNetRequest"]`.
   - `host_permissions: ["<all_urls>"]`.
   - `externally_connectable: { "matches": ["http://localhost:3000/*", "http://127.0.0.1:3000/*", "https://*.campusos.vn/*", "https://campusos.vn/*"] }`.
   - Background service worker: `{"service_worker": "background.js", "type": "module"}`.
   - Action popup: `{"default_popup": "popup/popup.html"}`.
   - Content scripts: `[{"matches": ["<all_urls>"], "js": ["content.js"], "run_at": "document_end"}]`.
   - Web accessible resources cho `assets/*` và `assets/fat-orange-cat.png`.
   - Background Service Worker: FSM trạng thái phiên (`idle`, `focusing`, `break`), 14 tên miền blacklist mặc định, đồng bộ storage `chrome.storage.sync` / `chrome.storage.local`, hàm kiểm tra URL blacklist `isUrlBlacklisted` hỗ trợ subdomain và ngoại trừ localhost / 127.0.0.1 / campusos.vn, bộ lắng nghe `chrome.tabs.onActivated` và `chrome.tabs.onUpdated`, xử lý `CLOSE_TAB_AND_FOCUS_CAMPUS`, kiểm soát ân hạn cooldown 180s, bộ định tuyến message hai chiều (`onMessageExternal` cho Web App và `onMessage` cho content script / popup).
3. **Các tệp đã triển khai**:
   - `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\extension\manifest.json`: Cấu hình hoàn chỉnh chuẩn Manifest V3.
   - `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\extension\background.js`: Service Worker 495 dòng mã nguồn logic thực tế đầy đủ tính năng.
   - `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1_1\test_m1_verification.mjs`: Bộ test kiểm chứng độc lập 8 test suites.
4. **Kết quả lệnh kiểm thử**:
   - Chạy `node --test .agents/teamwork/worker_m1_1/test_m1_verification.mjs`:
     ```
     ✔ Manifest V3: Syntax and Required Fields Compliance (2.415ms)
     ✔ Blacklist Domains: Contains all 14 mandatory domains (0.2505ms)
     ✔ Domain Normalization: normalizeDomain works accurately (0.4478ms)
     ✔ URL Blacklist Matcher: Exact domains and subdomains (0.5057ms)
     ✔ URL Blacklist Matcher: Exemptions for CampusOS and system URLs (0.2494ms)
     ✔ SupervisorSessionFSM: Lifecycle and state transitions (0.3344ms)
     ✔ SupervisorSessionFSM: Exemption management and 180s cooldown enforcement (0.3456ms)
     ✔ handleMessageRequest: External & Internal Message Protocol (1.8958ms)
     ℹ tests 8, suites 0, pass 8, fail 0
     ```
   - Chạy `npm test` trong thư mục `web/`: 380/380 tests PASS (exit code 0).
   - Chạy `npm run typecheck` trong thư mục `web/`: 0 errors (exit code 0).
   - Git status xác nhận chỉ chỉnh sửa `extension/manifest.json` và tạo `extension/background.js` (không xâm phạm bất kỳ file nào khác ngoài phạm vi cấp phép).

---

### 2. Chuỗi Suy luận (Logic Chain)
1. **Từ Quan sát 1 và 2**: Cần thay thế `manifest.json` sơ khai bằng tệp cấu hình chuẩn Manifest V3 đầy đủ thuộc tính: khai báo đúng quyền `permissions`, `host_permissions`, `externally_connectable` với các pattern domain của Web App, khai báo background worker kiểu module và action popup.
2. **Từ Quan sát 2 về Kiến trúc Service Worker**: `background.js` được thiết kế dưới dạng ES Module hoàn chỉnh:
   - Export lớp `SupervisorSessionFSM` quản lý trạng thái (`idle`, `focusing`, `break`), tính toán thời gian còn lại `remainingSeconds`, quản lý bộ đếm vi phạm `violationCount`, và trạng thái miễn trừ ân hạn.
   - Quản lý danh sách 14 blacklist domain mặc định (`facebook.com`, `youtube.com`, `tiktok.com`, `twitter.com`, `x.com`, `instagram.com`, `netflix.com`, `bilibili.com`, `shopee.vn`, `reddit.com`, `threads.net`, `twitch.tv`, `discord.com`, `lazada.vn`).
   - Hàm `normalizeDomain(rawInput)` và `isUrlBlacklisted(rawUrl, blacklist)` phân tích chuẩn xác URL theo đối tượng `URL`: kiểm tra giao thức `http/https`, tách hostname, ngoại trừ `localhost`, `127.0.0.1`, `campusos.vn` và subdomain của nó, và so sánh đuôi miền (`hostname === targetDomain || hostname.endsWith('.' + targetDomain)`) để chặn các subdomain giải trí (vd: `m.facebook.com`, `gaming.youtube.com`).
   - Cơ chế ân hạn quản lý `lastExemptionAt`: Nếu thời gian từ lần ân hạn trước dưới 180 giây (180.000 ms), từ chối và trả về `waitSeconds` còn lại. Nếu trên 180 giây, cấp quyền và đặt `exemptUntil = now + 180s`.
   - Cơ chế đóng tab và chuyển focus (`handleCloseTabAndFocusCampus`): Dùng `chrome.tabs.query` tìm tab CampusOS (localhost:3000 hoặc domain campusos.vn); nếu tìm thấy thì kích hoạt tab và focus window; nếu chưa mở thì tạo tab mới đến `/dashboard`; cuối cùng đóng tab vi phạm qua `chrome.tabs.remove(tabId)`.
   - Bộ lắng nghe tab: `chrome.tabs.onActivated` và `chrome.tabs.onUpdated` kiểm tra trạng thái phiên `isFocusing()` và không miễn trừ `!isExempt()`, nếu URL thuộc blacklist thì tăng `violationCount`, gửi thông điệp `SHOW_LOCKOUT_HUD` tới tab vi phạm và phát tín hiệu `EXTENSION_VIOLATION` về Web App tab.
   - Bộ định tuyến thông điệp: Hàm `handleMessageRequest` xử lý nhất quán cho cả `chrome.runtime.onMessageExternal` (từ Web App) và `chrome.runtime.onMessage` (từ content script & popup), hỗ trợ các action: `PING`, `START_FOCUS`, `PAUSE_FOCUS`, `STOP_FOCUS`, `START_BREAK`, `REQUEST_EXEMPTION`, `SYNC_STATE`, `GET_STATE`, `GET_POPUP_DATA`, `CHECK_URL`, `LOCKOUT_VIOLATION`, `CLOSE_TAB_AND_FOCUS_CAMPUS`, `UPDATE_BLACKLIST`, `ADD_BLACKLIST_DOMAIN`, `REMOVE_BLACKLIST_DOMAIN`, `RESET_BLACKLIST`, `TOGGLE_WEBCAM`.
3. **Từ Quan sát 4**: Tất cả 8 test cases trong `test_m1_verification.mjs` kiểm tra Manifest, Blacklist 14 domain, Normalization, URL matching (subdomains, localhost/campusos exemptions, system URLs), FSM lifecycle, 180s Cooldown enforcement, và message handlers đều PASS 100%. Toàn bộ 380 web tests tiếp tục pass, bảo đảm không có hồi quy.

---

### 3. Vấn đề Tồn tại & Lưu ý (Caveats)
- Các tệp `extension/content.js` và `extension/popup/*` thuộc phạm vi bàn giao của Milestone 2 và Milestone 4. `background.js` đã được thiết kế sẵn sàng các giao diện message để kết nối mượt mà với các thành phần này.
- Khi kiểm thử trên trình duyệt thực tế qua Developer Mode (`chrome://extensions`), Chrome sẽ tự cấp extension ID ngẫu nhiên; cấu hình `externally_connectable` đã khai báo đầy đủ các URL patterns `http://localhost:3000/*` và `https://*.campusos.vn/*` để Web App có thể gửi message qua ID đó.

---

### 4. Kết luận (Conclusion)
- Milestone 1 (Manifest V3 Configuration & Background Service Worker) đã hoàn thành 100%, đáp ứng đầy đủ tất cả tiêu chí kỹ thuật, kiến trúc và kiểm thử.
- Hai tệp tin được cấp quyền độc quyền (`extension/manifest.json` và `extension/background.js`) đã được tạo mới / nâng cấp với logic thật, không facade/dummy.
- Toàn bộ chất lượng mã nguồn tuân thủ Quality Gates: Manifest JSON chuẩn, 8/8 M1 verification tests pass, 380/380 web tests pass, typecheck 0 lỗi.

---

### 5. Phương pháp Kiểm chứng Độc lập (Verification Method)
Người thẩm định (Auditor) hoặc Orchestrator có thể kiểm chứng độc lập bằng các bước sau:
1. **Kiểm tra tệp tin đã tạo**:
   - `extension/manifest.json`: Xem nội dung và kiểm tra JSON hợp lệ.
   - `extension/background.js`: Xem cấu trúc FSM, 14 default domains, URL matcher, storage sync, tab listener, message router.
2. **Chạy bộ kiểm thử Milestone 1**:
   ```bash
   node --test .agents/teamwork/worker_m1_1/test_m1_verification.mjs
   ```
   *Kỳ vọng: 8 tests pass 100% không có lỗi.*
3. **Chạy kiểm thử dự án Web App**:
   ```bash
   cd web && npm test
   npm run typecheck
   ```
   *Kỳ vọng: 380 tests pass 100%, typecheck hoàn tất không có lỗi.*

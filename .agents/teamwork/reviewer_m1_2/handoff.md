# BÁO CÁO THẨM ĐỊNH ĐỘC LẬP MILESTONE 1 (M1 INDEPENDENT REVIEW & ADVERSARIAL CHALLENGE REPORT)

**Reviewer / Adversarial Critic**: `reviewer_m1_2`  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\reviewer_m1_2`  
**Parent Orchestrator ID**: `051c51ec-d4c0-431c-b685-75179c16a0da`  
**Timestamp**: 2026-10-17T01:14:00Z  
**Verdict**: **`REQUEST_CHANGES`**  

---

## 1. Quan sát Trực tiếp (Observation)

### 1.1. Các Tệp Tin Được Kiểm Tra Trực Tiếp
- `extension/manifest.json`: 66 dòng, JSON hợp lệ chuẩn Manifest V3.
- `extension/background.js`: 658 dòng, ES Module triển khai Service Worker FSM, bộ lọc URL, bộ định tuyến thông điệp, storage sync.
- `extension/assets/fat-orange-cat.png`: 405,717 bytes, tồn tại vật lý.
- `web/tests/extension-manifest.test.ts`: 163 dòng, 11 test cases thẩm định cấu hình Manifest V3.
- `web/tests/extension-bridge.test.ts`: 718 dòng, 44 test cases bao phủ 4 tầng kiểm thử (T1-T4).
- `web/src/lib/gamification.ts`: Chứa logic tính toán rank, level và XP penalty.

### 1.2. Kết Quả Kiểm Thử Độc Lập
Reviewer đã tự thực thi các lệnh kiểm thử trong môi trường thực tế:
1. `node --experimental-strip-types --test tests/extension-manifest.test.ts tests/extension-bridge.test.ts` (trong `web/`):
   ```
   ✔ Extension Bridge & Supervisor Arbitration Suite (extension-bridge.test.ts) (10.95ms)
   ✔ Chrome Extension Manifest V3 Schema & Security Suite (extension-manifest.test.ts) (4.76ms)
   ℹ tests 55, suites 11, pass 55, fail 0
   ℹ duration_ms 140.252
   ```
2. `npm test` (trong `web/`):
   ```
   ℹ tests 435, suites 14, pass 435, fail 0, duration_ms 2732.2284
   ```
3. `npm run typecheck` (trong `web/`):
   ```
   > campusos-web@0.1.0 typecheck
   > tsc --noEmit
   Exit code 0, 0 TypeScript errors.
   ```
4. `node --test .agents/teamwork/worker_m1_1/test_m1_verification.mjs`:
   ```
   ℹ tests 8, suites 0, pass 8, fail 0, duration_ms 75.3484
   ```

### 1.3. Đánh Giá Tính Liêm Chính (Integrity Audit)
- **Hardcoded test results**: Không phát hiện. Logic tính toán thời gian, chuẩn hóa URL, FSM và tính điểm hoàn toàn động.
- **Dummy / Facade implementations**: Không phát hiện. `background.js` triển khai đầy đủ các hàm xử lý storage, query tabs, broadcast message, close tab.
- **Shortcuts / Task bypass**: Không phát hiện.
- **Fabricated verification logs**: Không phát hiện. Mọi kết quả kiểm thử được reviewer tái lập chính xác 100%.

### 1.4. Phát Hiện Kiến Trúc Trực Tiếp Trên Mã Nguồn
1. **Dormancy State Loss (Mất trạng thái khi Service Worker bị tắt ngầm)**:
   Tại `extension/background.js` (dòng 600-609):
   ```javascript
   if (typeof chrome !== 'undefined' && chrome.runtime) {
     chrome.runtime.onInstalled?.addListener(() => {
       initializeExtension().catch(console.error);
     });
     chrome.runtime.onStartup?.addListener(() => {
       initializeExtension().catch(console.error);
     });
   ```
   `initializeExtension()` chỉ được gọi khi cài đặt extension (`onInstalled`) hoặc khởi động trình duyệt (`onStartup`). Nó **KHÔNG ĐƯỢC GỌI** ở top-level khi Service Worker thức dậy sau khi bị Chrome đưa vào trạng thái ngủ đông (hibernation / idle termination sau ~30 giây không hoạt động).
   Tại dòng 239:
   ```javascript
   export const sessionFsm = new SupervisorSessionFSM();
   ```
   Khi Service Worker thức dậy do sự kiện `tabs.onActivated` hoặc `tabs.onUpdated`, biến `sessionFsm` trong bộ nhớ RAM được khởi tạo lại với constructor mặc định (`state: 'idle'`). Vì `initializeExtension()` không chạy, `sessionFsm` không tải lại trạng thái `focusing` từ `chrome.storage`.
2. **Duplicate Violation Triggering Trên `tabs.onUpdated`**:
   Tại `extension/background.js` (dòng 642-656):
   ```javascript
   if (chrome.tabs?.onUpdated) {
     chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
       try {
         const urlToCheck = changeInfo.url || tab?.url;
         if (!urlToCheck) return;
         await checkAndHandleTabViolation({
           id: tabId,
           url: urlToCheck,
           windowId: tab?.windowId
         });
       } catch (err) {
         console.warn('[CampusOS Background] onUpdated handler warning:', err);
       }
     });
   }
   ```
   Khi người dùng tải một trang web vi phạm (ví dụ `facebook.com`), trình duyệt Chrome kích hoạt sự kiện `tabs.onUpdated` nhiều lần (lần 1: `status: 'loading'` kèm URL; lần 2: `title` thay đổi; lần 3: `status: 'complete'`). Vì mã nguồn dùng fallback `tab?.url` khi `changeInfo.url` không có, mỗi lần title hoặc status thay đổi đều gọi lại `checkAndHandleTabViolation`, dẫn đến vi phạm bị đếm 2–3 lần và phạt -100 XP đến -150 XP cho một lần mở trang.
3. **Thư Mục `extension/popup` Chưa Tồn Tại**:
   Trong `extension/manifest.json` khai báo `"default_popup": "popup/popup.html"`, nhưng thư mục `extension/popup` hiện chưa được tạo (dự kiến thuộc Milestone 4).

---

## 2. Chuỗi Suy Luận (Logic Chain)

### 2.1. Thẩm Định An Toàn & Bảo Mật Manifest V3 (ĐẠT)
- **Quyền hạn (Permissions)**: Khai báo đúng 5 quyền cần thiết (`tabs`, `storage`, `activeTab`, `scripting`, `declarativeNetRequest`). Không chứa bất kỳ quyền nguy hiểm nào như `webRequestBlocking`, `debugger`, `management`, `nativeMessaging`.
- **Kết nối ngoại vi (`externally_connectable`)**: Bị giới hạn nghiêm ngặt tại `http://localhost:3000/*`, `http://127.0.0.1:3000/*`, `https://*.campusos.vn/*`, `https://campusos.vn/*`. Hoàn toàn không cho phép wildcard mở `<all_urls>` hay `*://*/*`.
- **Tài nguyên truy cập web (`web_accessible_resources`)**: Chỉ công khai ảnh mascot `assets/fat-orange-cat.png` và thư mục `assets/*`, không phơi bày script hay file cấu hình nhạy cảm.

### 2.2. Thẩm Định Logic Nghiệp Vụ & An Toàn Ngoại Lệ (ĐẠT)
- **Chuẩn hóa URL (`normalizeDomain` & `getMatchedBlacklistDomain`)**:
  - `getMatchedBlacklistDomain` bọc toàn bộ logic trong khối `try...catch`, sử dụng đối tượng chuẩn `new URL(rawUrl)` và lọc giao thức `http/https`. Các URL dị dạng (`http:///`, khoảng trắng, ký tự đặc biệt, giao thức lạ `blob:`, `data:`, `file:`, `chrome://`) đều trả về an toàn `null` mà không gây văng unhandled exception.
  - Phân giải chính xác subdomain (`m.facebook.com`, `gaming.youtube.com`), đồng thời ngăn chặn triệt để tấn công giả mạo tên miền (`notfacebook.com` không bị chặn).
  - Ngoại trừ hoàn toàn `localhost`, `127.0.0.1` và `*.campusos.vn`.
- **FSM & Thuật toán Ân hạn 180s Cooldown**:
  - `requestExemption` tính toán chính xác `cooldownMs = 180000ms`, tính `waitSeconds = Math.ceil((cooldownMs - timeSinceLast) / 1000)`.
  - Kháng tua lùi đồng hồ hệ thống: Nếu `currentTime < lastExemptionAt`, `timeSinceLast` âm dẫn đến `waitSeconds` lớn hơn 180s, không thể bị exploit để reset cooldown.

### 2.3. Lập Luận Chi Tiết Về 2 Lỗi Kiến Trúc Cần Khắc Phục (CRITICAL & MAJOR)

#### Lỗi 1 (Critical): Service Worker Dormancy & Hibernation State Loss
1. Trong Chrome Manifest V3, Service Worker không chạy liên tục như Background Page của Manifest V2. Sau khoảng 30 giây không có sự kiện, tiến trình Service Worker sẽ bị Chrome giải phóng khỏi bộ nhớ RAM để tiết kiệm tài nguyên.
2. Khi người dùng bấm "Bắt đầu Focus" trên Web App CampusOS:
   - Message `START_FOCUS` được gửi tới extension.
   - `sessionFsm.startFocus()` đưa trạng thái lên `focusing` và lưu vào storage qua `persistCurrentState()`.
3. Sinh viên tập trung học trong 2 phút (Service Worker rơi vào trạng thái ngủ đông và bị terminate).
4. Sinh viên mất tập trung và mở tab `facebook.com`.
5. Chrome đánh thức Service Worker dậy và kích hoạt sự kiện `chrome.tabs.onActivated`.
6. Tuy nhiên, khi script `background.js` được nạp lại:
   - `export const sessionFsm = new SupervisorSessionFSM();` chạy, tạo phiên bản FSM mới với trạng thái mặc định là `idle`.
   - `chrome.runtime.onInstalled` **không chạy** (chỉ chạy khi cài đặt extension).
   - `chrome.runtime.onStartup` **không chạy** (chỉ chạy khi mở cả trình duyệt Chrome).
   - `initializeExtension()` không được gọi!
7. Sự kiện `tabs.onActivated` chạy hàm `checkAndHandleTabViolation(tab)`:
   - Kiểm tra: `if (!sessionFsm.isFocusing()) return;`
   - Vì `sessionFsm.state` đang là `idle`, hàm lập tức thoát (`return`).
8. **Hệ quả thực tế**: Extension hoàn toàn không phát hiện vi phạm, không hiển thị Lockout HUD và không trừ điểm XP của sinh viên! Đây là lỗ hổng cốt lõi làm vô hiệu hóa chức năng giám sát của extension trong điều kiện hoạt động thực tế.

#### Lỗi 2 (Major): Multi-Penalty Loop Trên `chrome.tabs.onUpdated`
1. Tại `tabs.onUpdated`, câu lệnh `const urlToCheck = changeInfo.url || tab?.url;` cho phép kiểm tra URL ngay cả khi `changeInfo.url` là `undefined`.
2. Khi người dùng điều hướng tới `https://youtube.com`:
   - Lần 1: Chrome gửi `changeInfo = { status: 'loading', url: 'https://youtube.com' }` -> Vi phạm đếm 1, trừ 50 XP.
   - Lần 2: Trang web cập nhật tiêu đề tab, Chrome gửi `changeInfo = { title: 'YouTube' }` (không có `changeInfo.url`). Fallback lấy `tab.url` vẫn là `https://youtube.com` -> Vi phạm đếm 2, trừ thêm 50 XP (thành -100 XP).
   - Lần 3: Trình duyệt tải xong trang, Chrome gửi `changeInfo = { status: 'complete' }`. Fallback lấy `tab.url` vẫn là `https://youtube.com` -> Vi phạm đếm 3, trừ thêm 50 XP (thành -150 XP).
3. **Hệ quả thực tế**: Người dùng chỉ mở tab một lần nhưng bị phạt lũy kế gấp 2-3 lần (mất 100 đến 150 XP thay vì 50 XP).

---

## 3. Vấn đề Tồn tại & Lưu ý (Caveats)

- Bộ test suite chạy trong môi trường Node.js (`node:test`) kiểm tra các hàm thuần túy (pure functions) và các phương thức FSM trong cùng một tiến trình bộ nhớ liên tục, nên không tự động mô phỏng chu kỳ sleep/wake của Chrome Service Worker MV3.
- Thư mục `extension/popup` chưa tồn tại là điều đã được ghi nhận trong lộ trình phân chia công việc (Milestone 4). Tuy nhiên, khi Chrome mở popup từ biểu tượng extension, nếu tệp tin `popup.html` không tồn tại sẽ gây lỗi mở popup. Cần bảo đảm M4 tạo file này đúng vị trí đã khai báo trong manifest.

---

## 4. Kết luận (Conclusion)

- **Đánh giá chung**: Chất lượng mã nguồn của Milestone 1 rất tốt, cấu trúc ES Module rõ ràng, tuân thủ 100% chuẩn Manifest V3, bảo mật nghiêm ngặt và không có bất kỳ dấu hiệu gian lận hay vi phạm liêm chính nào (0 Integrity Violations). Bộ test 55/55 và hồi quy 435/435 pass 100%.
- **Quyết định thẩm định**: **`REQUEST_CHANGES`**  
  Cần thực hiện một đợt hiệu chỉnh ngắn (khoảng 15-20 dòng code) trong `extension/background.js` để khắc phục 2 lỗi kiến trúc nêu trên trước khi chuyển giao sang Milestone 2.

### Các Yêu Cầu Thay Đổi Cụ Thể (Action Items Cho Worker)

1. **Khắc phục Lỗi 1 (Rehydration Guard khi Service Worker thức dậy)**:
   Trong `extension/background.js`, thiết lập cơ chế nạp lại trạng thái tự động mỗi khi Service Worker khởi động:
   ```javascript
   let initPromise = null;
   export function ensureInitialized() {
     if (!initPromise) {
       initPromise = initializeExtension().catch((err) => {
         console.error('[CampusOS Background] Initialization failed:', err);
         initPromise = null; // Cho phép thử lại nếu lỗi
       });
     }
     return initPromise;
   }
   
   // Kích hoạt nạp dữ liệu ngay khi Service Worker script được nạp vào bộ nhớ
   ensureInitialized();
   ```
   Đồng thời, tại đầu các hàm `checkAndHandleTabViolation` và `handleMessageRequest`, bổ sung:
   ```javascript
   await ensureInitialized();
   ```
2. **Khắc phục Lỗi 2 (Lọc sự kiện `changeInfo.url` và Debounce vi phạm)**:
   Trong bộ lắng nghe `chrome.tabs.onUpdated`:
   ```javascript
   if (chrome.tabs?.onUpdated) {
     chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
       try {
         // Chỉ kiểm tra khi có sự kiện thay đổi URL thực sự để tránh phạt trùng lặp
         if (!changeInfo.url) return;
         await checkAndHandleTabViolation({
           id: tabId,
           url: changeInfo.url,
           windowId: tab?.windowId
         });
       } catch (err) {
         console.warn('[CampusOS Background] onUpdated handler warning:', err);
       }
     });
   }
   ```
   Đồng thời trong `checkAndHandleTabViolation`, lưu vết `lastViolationTimeByTab` (ví dụ: không kích hoạt 2 lần vi phạm trên cùng một tab trong vòng 3000ms).

---

## 5. Phương pháp Kiểm chứng Độc lập (Verification Method)

Sau khi worker cập nhật các điểm trên, chạy lại các lệnh xác minh:
1. Xác minh Manifest và Bridge Suite:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   node --experimental-strip-types --test tests/extension-manifest.test.ts tests/extension-bridge.test.ts
   ```
   *Kỳ vọng: 55/55 tests PASS.*
2. Xác minh toàn bộ hệ thống Web App:
   ```powershell
   npm test
   npm run typecheck
   ```
   *Kỳ vọng: 435/435 tests PASS, 0 TypeScript errors.*
3. Kiểm tra kiểm thử độc lập kịch bản Service Worker rehydration:
   Bổ sung test case kiểm chứng việc gọi `initializeExtension()` sau khi tạo FSM mới để bảo đảm trạng thái `focusing` được khôi phục thành công từ storage.

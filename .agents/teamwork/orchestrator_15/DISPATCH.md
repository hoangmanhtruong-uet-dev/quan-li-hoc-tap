## 2026-10-17T00:52:59Z
You are orchestrator_15, the Project Orchestrator.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_15
The authoritative user request is recorded in: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md under header ## 2026-10-17T00:51:59Z.

Task Summary:
Xây dựng và kết nối hoàn chỉnh Chrome Extension Manifest V3 "AI Giám Sát Học Tập Cực Đoan" với Web App CampusOS và Supabase Cloud theo cơ chế phát hiện kép (URL Tab Blacklist & AI Webcam Face Tracking).

Requirements:
- R1: Cấu hình Manifest V3 & Kiến trúc Service Worker (extension/manifest.json, extension/background.js, externally_connectable với Web App localhost:3000 và production domain, quản lý session idle/focusing/break, blacklist, tab tracking).
- R2: Giao diện Cyber-Glass Lockout HUD & Âm thanh Mắng Chửi (extension/content.js: modal Cyber-Glass blur 25px, nhân vật giám sát rung lắc screen shake, TTS tiếng Việt mắng chửi, đếm ngược 5s đóng tab và focus về CampusOS, nút ân hạn tra tài liệu tối đa 1 lần/3 phút).
- R3: Tùy chọn AI Webcam Face Tracking (MediaPipe Face Mesh / Web Worker nhẹ, bật/tắt trong settings/popup, phát hiện quay mặt > 10s hoặc ngủ gục qua EAR/Head Pose và kích hoạt cảnh báo).
- R4: Cầu nối đồng bộ trạng thái & Phạt XP (-50 XP vào profiles và student_focus_sessions khi vi phạm, sync start focus từ web sang extension, Extension popup thời gian thực pomodoro & tùy chỉnh blacklist).

Acceptance Criteria:
- Thư mục extension/ tải thành công trên Chrome/Edge Manifest V3 không lỗi cú pháp.
- Mở tab giải trí khi Pomodoro chạy: Lockout HUD kích hoạt <200ms, phát âm thanh, đếm ngược đóng tab.
- Sự kiện vi phạm gửi về Web App và trừ -50 XP trên Supabase.
- npm test PASS 100% (380+ tests) và npm run typecheck 0 lỗi.
- Next.js Web App build thành công (npm run build).

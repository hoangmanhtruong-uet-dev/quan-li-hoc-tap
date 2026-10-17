# Dispatch Log

## 2026-10-17T07:16:00Z

From Sentinel:
You are orchestrator_17 (Project Orchestrator).
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_17
Project Root: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
Authoritative user request file: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md

Please read the latest section (2026-10-17T07:15:36Z) of ORIGINAL_REQUEST.md and coordinate the full implementation:
1. R1. Khung Bố Cục Split-Screen 50/50 & Sân Khấu 3D Three.js (`web/src/app/(auth)/layout.tsx`):
   - Desktop (≥ 1024px): Split-screen 50/50 đối xứng hoàn hảo, fixed 100vh không double scroll.
   - Mobile & Tablet (< 1024px): 1 cột trung tâm Fluid Ambient Aurora.
   - Sân khấu 3D Three.js (`web/src/components/auth/auth-3d-showcase.tsx`): Hologram Three.js quả cầu tri thức/Cyber-Glass xoay nhẹ phản ứng chuột, spotlight neon Cyan/Violet, dispose WebGL cleanly khi unmount.
   - Feature Carousel (`web/src/components/auth/auth-feature-carousel.tsx`): Auto carousel "Bộ Ba Siêu Năng", số liệu 12,450+ giờ học, quote cảm hứng.
2. R2. Trang Đăng Nhập Cyber-Glass & Tiện Ích Đột Phá (`web/src/app/(auth)/login/page.tsx`):
   - Form Cyber-Glass backdrop-blur-2xl, border-white/10, shadow neon cyan.
   - Nút "⚡ Đăng nhập nhanh Demo 1-Click" tự động điền & đăng nhập sinh viên mẫu minh.nguyen@campus.edu.vn / Demo@123456.
   - Social Login Google & GitHub qua Supabase Auth.
   - Input cyberpunk viền sáng neon, nút ẩn/hiện mật khẩu trực quan, checkbox Ghi nhớ đăng nhập.
   - Hiệu ứng rung lắc (Shake animation) khi sai thông tin kèm alert neon đỏ.
3. R3. Trang Đăng Ký & Thanh Đo Độ Mạnh Mật Khẩu (`web/src/app/(auth)/register/page.tsx`):
   - Form đăng ký sinh viên: Họ tên, Email .edu.vn, Mật khẩu, Xác nhận mật khẩu.
   - Thanh đo độ mạnh mật khẩu 4 cấp độ thời gian thực (Yếu, Trung bình, Tốt, Cực mạnh) với tiêu chí rõ ràng.
   - Checkbox đồng ý Điều khoản Dịch vụ & Quy chuẩn Học thuật CampusOS.
4. R4. Đồng Bộ Trang Quên Mật Khẩu, Đặt Lại Mật Khẩu & Xác Thực Email:
   - `web/src/app/(auth)/forgot-password/page.tsx`: Gửi link khôi phục mật khẩu, countdown 60s.
   - `web/src/app/(auth)/reset-password/page.tsx`: Form đặt lại mật khẩu mới, kiểm tra độ mạnh & xác nhận.
   - `web/src/app/(auth)/verify-email/page.tsx`: Thông báo kích hoạt tài khoản sinh viên với icon Holographic phát sáng và nút gửi lại mã.
5. Quality Gates & Verification:
   - npm test tiếp tục PASS 100% (643+ tests) và bổ sung test suite `web/tests/auth-redesign.test.ts`.
   - npm run typecheck đạt 0 lỗi TypeScript.
   - npm run build biên dịch thành công 100% các static/dynamic routes.

Maintain your progress.md and BRIEFING.md continuously. When all requirements and quality gates are met and verified, report completion back to sentinel so that the independent victory audit can be triggered.

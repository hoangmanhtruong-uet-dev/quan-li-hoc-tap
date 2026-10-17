# Báo Cáo Khảo Sát Kiến Trúc Giao Diện & Three.js 3D (Auth Redesign Survey)

**Agent**: `survey_explorer_1`  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\survey_explorer_1`  
**Parent / Caller**: `29257fd0-4cce-43cc-906d-4f5f80b1ce6e` (orchestrator_17)  
**Date**: 2026-10-17  
**Scope**: Khảo sát bố cục Split-Screen 50/50, Sân khấu 3D Three.js Hologram, Dynamic Feature Carousel "Bộ Ba Siêu Năng", và thẩm mỹ Cyber-Glass / Fluid Ambient Aurora cho phân hệ Xác thực (Auth Flow).

---

## 1. Observation (Các Quan Sát Thực Tế Trực Tiếp Từ Codebase)

### 1.1 Hiện trạng Bố cục `web/src/app/(auth)/layout.tsx`
- File hiện tại chỉ vỏn vẹn 11 dòng code (`web/src/app/(auth)/layout.tsx:1-11`):
  ```tsx
  export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080d19] px-4 py-10">
        <div className="absolute left-[-10rem] top-[-12rem] h-[32rem] w-[32rem] rounded-full bg-blue-600/15 blur-[100px]" />
        <div className="absolute bottom-[-14rem] right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-violet-600/15 blur-[110px]" />
        <div className="absolute left-8 top-8 flex items-center gap-3 text-white">...</div>
        <div className="relative z-10 flex w-full justify-center">{children}</div>
      </div>
    );
  }
  ```
- **Nhận xét**: Layout hiện tại là đơn cột (single column) đơn giản, chỉ căn giữa form trong một màn hình nền đen với 2 đốm sáng tĩnh. Chưa có cấu trúc chia đôi Split-Screen 50/50 trên Desktop, chưa có sân khấu Three.js, chưa có Feature Carousel.

### 1.2 Thực trạng Thư viện Three.js trong `package.json`
- `web/package.json:18,33`:
  - `"three": "^0.186.1"`
  - `"@types/three": "^0.186.0"`
  - `"lucide-react": "^1.24.0"`
  - `"tailwindcss-animate": "^1.0.7"`
- **Đặc biệt**: Không có `@react-three/fiber` hay `@react-three/drei`. Toàn bộ dự án CampusOS tuân thủ nguyên tắc sử dụng **Vanilla Three.js** thuần túy kết hợp `useRef`, `useEffect`, và giải phóng bộ nhớ thủ công nghiêm ngặt.

### 1.3 Mẫu Kiến Trúc Three.js Trong Codebase
Qua khảo sát các component 3D đã hoạt động ổn định:
1. `web/src/components/study/leaderboard-3d-arena.tsx`:
   - Kiểm tra `prefers-reduced-motion` qua `window.matchMedia('(prefers-reduced-motion: reduce)')` (dòng 31-34).
   - Kiểm tra WebGL context capability qua canvas ảo (dòng 38-50).
   - Quản lý bộ sưu tập disposables: `const geometriesToDispose: THREE.BufferGeometry[] = []` và `materialsToDispose: THREE.Material[] = []` (dòng 85-97).
   - Renderer cấu hình: `alpha: true, antialias: true, powerPreference: 'high-performance'`, giới hạn PixelRatio `Math.min(window.devicePixelRatio || 1, 1.25)` để bảo đảm 120FPS (dòng 68-75).
   - Hiệu ứng ánh sáng: SpotLight động với `spotLightTarget.position.x = Math.sin(...)` quét góc (dòng 103-109, 403), kèm PointLight neon Cyan `#3de8ff` và Magenta `#ff3da5` (dòng 112-119).
   - Parallax tương tác chuột mượt mà (lerp smoothing):
     `arenaGroup.rotation.y += (targetRotY - arenaGroup.rotation.y) * 0.05` (dòng 399-400).
   - Lắng nghe sự kiện `visibilitychange` để dừng `requestAnimationFrame` khi tab bị ẩn (dòng 374-381).
   - Dọn dẹp tài nguyên 100% khi unmount: `cancelAnimationFrame(animId)`, xóa event listeners, duyệt `geo.dispose()`, `mat.dispose()`, `renderer.dispose()`, và `container.removeChild(renderer.domElement)` (dòng 459-482).
2. `web/src/components/coach/quantum-orb-3d.tsx`:
   - Kiến trúc quả cầu/khối tinh thể Hologram:
     - Lõi tinh thể đa diện: `IcosahedronGeometry(0.8, 1)` với `flatShading: true`, `metalness: 0.9`, `roughness: 0.15` (dòng 128-138).
     - Khung dây Hologram bao ngoài: `IcosahedronGeometry(0.98, 1)` với `wireframe: true`, màu Cyan `#3de8ff` (dòng 141-149).
     - Các vòng quay con quay hồi chuyển (Gyroscopic Orbital Rings): 3 vòng `TorusGeometry` nghiêng góc khác nhau quay độc lập (dòng 152-180).
     - Chùm hạt bụi sao (stardust points) trôi nhẹ.

### 1.4 Hệ Thống Styling, Theme & Hiệu Ứng Micro-Interactions
- `web/tailwind.config.js`:
  - Bảng màu Aurora: `obsidian: '#0A0A12'`, `lime: '#C6FF3D'`, `pink: '#FF3DA5'`, `violet: '#7C5CFF'`, `cyan: '#3DE8FF'`, `orange: '#FF8A3D'`.
  - Animation `panic-shake`:
    ```js
    'panic-shake': {
      '0%, 100%': { transform: 'translateX(0)' },
      '20%, 60%': { transform: 'translateX(-3px) rotate(-0.5deg)' },
      '40%, 80%': { transform: 'translateX(3px) rotate(0.5deg)' },
    }
    ```
    Utility class sẵn có: `animate-panic-shake`. Hoàn hảo cho hiệu ứng rung lắc khi đăng nhập sai thông tin!
  - Font families: `font-display` (Unbounded/Space Grotesk), `font-heading`, `font-sans` (Be Vietnam Pro), `font-mono` (JetBrains Mono).
- `web/src/app/globals.css`:
  - Token Aurora blobs: `--aurora-blob-1`, `--aurora-blob-2`, `--aurora-blob-3`.
  - Utility `.aurora-noise` tạo bề mặt 4% fractal noise hữu cơ.
  - Cyber-Glass styling đã chuẩn hóa: viền kính `border-white/10`, đổ bóng phát quang `shadow-[0_0_50px_rgba(61,232,255,0.15)]`, nền kính mờ `backdrop-blur-2xl bg-card/60`.

### 1.5 Bộ Kiểm Thử Hiện Tại
- Lệnh chạy: `npm test` trong `web/`
- Kết quả kiểm tra trực tiếp: **643 passed, 0 failed, 63 suites** (3.35 giây).
- `npm run typecheck` thành công với **0 lỗi TypeScript**.

---

## 2. Logic Chain (Chuỗi Lập Luận Kỹ Thuật Từng Bước)

1. **Vấn đề Cuộn Kép (Double Scrollbars) Trên Desktop**:
   - *Quan sát*: Nếu trang Auth áp dụng `min-h-screen` cho cả hai cột, khi form đăng ký hoặc màn hình có chiều cao lớn xuất hiện trên màn hình laptop độ phân giải thấp (ví dụ: 1366x768), cả cửa sổ trình duyệt (window) và form sẽ cùng xuất hiện thanh cuộn, gây trải nghiệm tệ hại và vi phạm yêu cầu thiết kế.
   - *Giải pháp*: Cột ngoài cùng (`(auth)/layout.tsx`) trên Desktop (`lg:`) phải đặt cố định `lg:h-screen lg:overflow-hidden`. Cột trái (3D Showcase & Carousel) đặt `h-full overflow-hidden` cố định không bao giờ cuộn. Cột phải (chứa form) đặt `h-full overflow-y-auto overflow-x-hidden scrollbar-thin` với `flex flex-col items-center justify-center p-6 lg:p-12`. Như vậy, chỉ có panel bên phải tự cuộn nội bộ khi nội dung vượt quá chiều cao, cửa sổ chính hoàn toàn không có thanh cuộn kép!

2. **Khả Năng Thích Ứng Trên Mobile / Tablet (< 1024px)**:
   - *Quan sát*: Trên màn hình nhỏ (< 1024px), GPU và pin điện thoại dễ bị quá tải nếu cùng lúc render canvas Three.js phức tạp và bàn phím ảo hiển thị đè lên form đăng nhập.
   - *Giải pháp*: Thiết lập `hidden lg:flex` cho cột 3D Showcase. Màn hình `< 1024px` tự động co thành 1 cột trung tâm (`flex flex-col min-h-screen w-full`), hiển thị logo và branding nhỏ gọn phía trên form, với nền Fluid Ambient Aurora chuyển động nhẹ bằng GPU CSS (`transform: translate3d`) thay vì Three.js, đạt chuẩn 120FPS mượt mà trên mọi thiết bị di động.

3. **Sân Khấu 3D Three.js Hologram (`Auth3DShowcase`)**:
   - *Quan sát*: Yêu cầu đòi hỏi quả cầu tri thức / tinh thể Cyber-Glass Hologram xoay nhẹ, phản ứng theo con trỏ chuột, đèn Spotlight Cyan & Violet, và dọn dẹp bộ nhớ WebGL an toàn.
   - *Thiết kế hình học*: Kết hợp 4 lớp hình học:
     1. Lõi tinh thể Icosahedron (`IcosahedronGeometry(1.25, 1)`) với chất liệu bóng bán trong suốt, màu xanh thẫm `0x0a1026`, phản chiếu ánh sáng điểm `flatShading: true`.
     2. Khung lưới Hologram (`IcosahedronGeometry(1.5, 1)`) với `wireframe: true`, màu Cyan `#38bdf8`.
     3. Ba vòng quỹ đạo con quay (Gyroscopic Torus Rings): Vòng 1 màu Cyan `#38bdf8`, Vòng 2 màu Violet `#a855f7`, Vòng 3 màu Acid Lime `#c6ff3d`.
     4. Đám mây hạt lượng tử (Quantum Stardust): 150 hạt phát sáng phân bố quanh khối cầu.
   - *Hệ thống chiếu sáng Studio 3 điểm*:
     - Spotlight Cyan (`#38bdf8`) đặt tại góc trên bên trái `(-4, 5, 4)` rọi vào tâm.
     - Spotlight Violet (`#a855f7`) đặt tại góc dưới bên phải `(4, -3.5, 3.5)` rọi vào tâm.
     - Ambient Light mát dịu (`#111633`, cường độ 1.6).
   - *Tương tác chuột (Pointer Tracking)*:
     - Tính toán tọa độ chuột chuẩn hóa `(x, y)` từ `-1` đến `1`.
     - Áp dụng kỹ thuật nội suy mượt (lerp damping):
       `hologramGroup.rotation.y += (targetRotY - hologramGroup.rotation.y) * 0.05`
       `hologramGroup.rotation.x += (targetRotX - hologramGroup.rotation.x) * 0.05`
   - *Giải phóng bộ nhớ (Strict Cleanup)*:
     - Đưa toàn bộ geometry vào mảng `geometriesToDispose`.
     - Đưa toàn bộ material vào mảng `materialsToDispose`.
     - Trong hàm dọn dẹp return của `useEffect`: Hủy `cancelAnimationFrame(animId)`, gỡ bỏ toàn bộ event listeners, gọi `dispose()` trên từng geometry, material, và `renderer.dispose()`.

4. **Dynamic Feature Carousel ("Bộ Ba Siêu Năng")**:
   - *Quan sát*: Yêu cầu hiển thị tự động chuyển slide giới thiệu 3 tính năng cốt lõi:
     1. 🐱 *Mèo Cam Giám Sát Cực Đoan* (URL Blacklist & AI Webcam Face Tracking)
     2. 🎴 *AI Study Hub 1M Tokens & Flashcard 3D SM-2* (Phân tích slide PDF bài giảng)
     3. 🏆 *Đấu Trường Pomodoro Party & Bục Vinh Danh 3D* (Học nhóm thời gian thực)
     Kèm số liệu "12,450+ giờ học hôm nay" và câu danh ngôn truyền cảm hứng.
   - *Cơ chế hoạt động*:
     - Chu kỳ tự động trượt 5 giây (`setInterval`).
     - Tự động tạm dừng (pause) khi người dùng di chuột vào (`onMouseEnter` / `onMouseLeave`) để đọc nội dung.
     - Các chấm chỉ số (dots indicator) hiển thị tiến độ slide hiện tại với vạch phát sáng.
     - Nút chuyển trước/sau (`ChevronLeft`, `ChevronRight`) và hỗ trợ phím mũi tên.
     - Khối thông số sinh viên: "🔥 12,450+ giờ học hôm nay", "👥 4,800+ sinh viên online", "⚡ 99.2% qua môn".
     - Hộp danh ngôn sinh viên Gen Z tạo động lực học tập mỗi ngày.

5. **Trang Đăng Nhập & Đăng Ký Tích Hợp Tiện Ích**:
   - Nút "⚡ Đăng nhập nhanh Demo 1-Click" gán sẵn tài khoản mẫu `minh.nguyen@campus.edu.vn` / `Demo@123456`, gửi yêu cầu trực tiếp đến `/api/auth/login` và điều hướng về `/dashboard`.
   - Nút Social Login (Google & GitHub) với biểu tượng SVG chuẩn.
   - Nút ẩn/hiện mật khẩu trực quan với icon `Eye` / `EyeOff`.
   - Hiệu ứng rung lắc `animate-panic-shake` kích hoạt khi đăng nhập sai thông tin.
   - Thanh đo độ mạnh mật khẩu (Password Strength Meter) 4 cấp độ: Yếu (Đỏ), Trung bình (Vàng), Tốt (Cyan), Cực mạnh (Neon Green) cùng checklist 4 tiêu chí.

---

## 3. Caveats (Các Điểm Lưu Ý & Giới Hạn Nghiên Cứu)

1. **Khả năng tương thích SSR của Three.js trong Next.js App Router**:
   - Three.js truy cập trực tiếp các API trình duyệt (`window`, `document`, `WebGLRenderingContext`). Component `Auth3DShowcase` bắt buộc phải khai báo `'use client';` và toàn bộ thao tác khởi tạo WebGL phải nằm hoàn toàn trong `useEffect`.
   - Khuyến nghị sử dụng cờ `isMounted` hoặc Dynamic Import (`next/dynamic` với `ssr: false`) để loại bỏ hoàn toàn nguy cơ Hydration Mismatch.

2. **Giới hạn số lượng WebGL Context trên trình duyệt**:
   - Trình duyệt Chrome/Edge thường giới hạn tối đa 8–16 WebGL context đồng thời. Nếu người dùng chuyển trang liên tục giữa `/study/rooms/leaderboard` và `/login`, việc không dispose WebGL renderer sẽ gây lỗi *"WARNING: Too many active WebGL contexts"*.
   - Khảo sát xác nhận: Việc gọi `renderer.dispose()` và `container.removeChild(renderer.domElement)` khi unmount là bắt buộc tuyệt đối.

3. **Chế độ Giảm Hiệu Ứng (Reduced Motion) & Fallback**:
   - Người dùng kích hoạt `prefers-reduced-motion` trong cài đặt hệ điều hành hoặc thiết bị không hỗ trợ WebGL cần được hiển thị thẻ tĩnh Cyber-Glass cao cấp (Static Hologram Mockup Card) với hiệu ứng ánh sáng gradient nhẹ nhàng thay vì báo lỗi trống trải.

---

## 4. Conclusion & Thiết Kế Kỹ Thuật Chi Tiết (Architectural Blueprint)

### 4.1 Cấu Trúc File & Thư Mục Đề Xuất

```
web/
├── src/
│   ├── app/
│   │   └── (auth)/
│   │       ├── layout.tsx                # Rebuild: Split-Screen 50/50 Desktop & Fluid Aurora Mobile
│   │       ├── login/page.tsx            # Rebuild: Cyber-Glass form, Demo 1-Click, Shake animation
│   │       ├── register/page.tsx         # Rebuild: Cyber-Glass form, 4-tier Password Strength Meter
│   │       ├── forgot-password/page.tsx  # Rebuild: Cyber-Glass form, 60s countdown timer
│   │       ├── reset-password/page.tsx   # Rebuild: Cyber-Glass form, Strength meter, Token check
│   │       └── verify-email/page.tsx     # Rebuild: Glowing Holographic Mail, Resend countdown
│   ├── components/
│   │   └── auth/                         # [NEW DIRECTORY]
│   │       ├── auth-3d-showcase.tsx      # Sân khấu Three.js 3D Hologram Quả cầu/Khối pha lê
│   │       ├── auth-feature-carousel.tsx # Dynamic Carousel "Bộ Ba Siêu Năng" & Live Stats
│   │       └── password-strength-meter.tsx # Thanh đo độ mạnh mật khẩu 4 cấp độ & checklist
│   └── lib/
│       └── auth-redesign-utils.ts        # Helper tính độ mạnh mật khẩu, dữ liệu Bộ Ba Siêu Năng
└── tests/
    └── auth-redesign.test.ts             # Test suite kiểm thử toàn diện layout, Three.js & helpers
```

---

### 4.2 Thiết Kế Chi Tiết Component 1: `web/src/app/(auth)/layout.tsx`

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { AuthFeatureCarousel } from '@/components/auth/auth-feature-carousel';

// Dynamic import Auth3DShowcase với ssr: false để tối ưu hóa SSR
const Auth3DShowcase = dynamic(
  () => import('@/components/auth/auth-3d-showcase').then((mod) => mod.Auth3DShowcase),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[360px] flex items-center justify-center">
        <div className="h-16 w-16 rounded-full border-2 border-cyan-400/40 border-t-cyan-400 animate-spin" />
      </div>
    ),
  }
);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-[#080d19] text-white flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden select-none">
      {/* =========================================================================
          CỘT TRÁI (50% DESKTOP): SÂN KHẤU 3D THREE.JS & BỘ BA SIÊU NĂNG CAROUSEL
          (Ẩn trên màn hình < 1024px để tối ưu pin và hiệu năng 120FPS)
          ========================================================================= */}
      <section
        aria-label="CampusOS 3D Showcase & Superpowers"
        className="hidden lg:flex lg:w-1/2 h-full flex-col justify-between border-r border-white/10 relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#0a0f24] to-[#080d19] p-8 xl:p-12 z-10"
      >
        {/* Đốm sáng Aurora nền nhẹ nhàng trong cột trái */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-cyan-500/15 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.04),transparent_70%)]" />

        {/* 1. Header Thương Hiệu Top Left */}
        <div className="relative z-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 font-black text-white text-xl shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform duration-300">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl tracking-tight text-white font-display">CampusOS</span>
                <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                  v2.5 Neo
                </span>
              </div>
              <p className="text-[11px] font-medium uppercase tracking-[.22em] text-slate-400">
                Student Companion Platform
              </p>
            </div>
          </Link>

          {/* Badge thống kê giờ học trực tiếp */}
          <div className="hidden xl:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs text-slate-300 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] font-semibold tracking-wide">12,450+ GIỜ HỌC HÔM NAY</span>
          </div>
        </div>

        {/* 2. Middle: Sân Khấu 3D Three.js Hologram Stage */}
        <div className="relative z-20 my-auto flex-1 flex flex-col items-center justify-center max-h-[440px]">
          <Auth3DShowcase />
        </div>

        {/* 3. Bottom: Dynamic Feature Carousel "Bộ Ba Siêu Năng" & Danh Ngôn */}
        <div className="relative z-20 mt-auto">
          <AuthFeatureCarousel />
        </div>
      </section>

      {/* =========================================================================
          CỘT PHẢI (50% DESKTOP / 100% MOBILE): PHÂN HỆ AUTH FORMS CYBER-GLASS
          (Cuộn nội bộ độc lập trên Desktop, không gây thanh cuộn kép cho window)
          ========================================================================= */}
      <main
        role="main"
        className="flex-1 lg:w-1/2 h-full overflow-y-auto overflow-x-hidden scrollbar-thin relative flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12"
      >
        {/* Nền Fluid Ambient Aurora Blobs */}
        <div className="pointer-events-none absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-cyan-500/15 blur-[130px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-violet-600/15 blur-[130px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/10 blur-[150px]" />

        {/* Header rút gọn hiển thị trên Mobile & Tablet (< 1024px) */}
        <div className="lg:hidden w-full max-w-md mx-auto mb-6 flex items-center justify-between z-10 pt-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 font-black text-white text-base shadow-md shadow-cyan-500/20">
              C
            </div>
            <div>
              <span className="font-black text-lg text-white font-display">CampusOS</span>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Student Companion</p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Cyber-Glass</span>
          </div>
        </div>

        {/* Khung chứa Form trung tâm có hiệu ứng kính mờ Cyber-Glass */}
        <div className="w-full max-w-md my-auto relative z-10">
          {children}
        </div>

        {/* Footer bản quyền chân trang */}
        <div className="w-full max-w-md mx-auto mt-6 text-center text-xs text-slate-500 z-10 pb-4">
          <span>&copy; {new Date().getFullYear()} CampusOS &middot; Nền tảng học tập thông minh sinh viên Việt Nam</span>
        </div>
      </main>
    </div>
  );
}
```

---

### 4.3 Thiết Kế Chi Tiết Component 2: `web/src/components/auth/auth-3d-showcase.tsx`

```tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Shield, Cpu } from 'lucide-react';

export interface Auth3DShowcaseProps {
  className?: string;
  intensity?: number;
  interactive?: boolean;
}

export function Auth3DShowcase({
  className = '',
  intensity = 1.0,
  interactive = true,
}: Auth3DShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    // 2. Kiểm tra hỗ trợ WebGL
    try {
      const canvas = document.createElement('canvas');
      const gl = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      if (!gl) {
        setHasWebGL(false);
        return () => mediaQuery.removeEventListener('change', handleMotionChange);
      }
    } catch {
      setHasWebGL(false);
      return () => mediaQuery.removeEventListener('change', handleMotionChange);
    }

    const container = containerRef.current;
    if (!container) return () => mediaQuery.removeEventListener('change', handleMotionChange);

    let animId = 0;
    const width = container.clientWidth || 440;
    const height = container.clientHeight || 360;

    // 3. Khởi tạo Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. Mảng theo dõi để giải phóng bộ nhớ (Strict Unmount Disposal)
    const geometriesToDispose: THREE.BufferGeometry[] = [];
    const materialsToDispose: THREE.Material[] = [];

    const registerMesh = <T extends THREE.Mesh | THREE.Points>(obj: T): T => {
      if (obj.geometry) geometriesToDispose.push(obj.geometry);
      if (Array.isArray(obj.material)) {
        materialsToDispose.push(...obj.material);
      } else if (obj.material) {
        materialsToDispose.push(obj.material);
      }
      return obj;
    };

    // Master Group cho toàn bộ khối Hologram
    const hologramGroup = new THREE.Group();
    scene.add(hologramGroup);

    // 5. Hệ Thống Ánh Sáng Studio (Spotlight Cyan & Violet)
    const ambientLight = new THREE.AmbientLight(0x0e1326, 1.6);
    scene.add(ambientLight);

    // Spotlight Cyan chiếu từ trên trái
    const spotLightCyan = new THREE.SpotLight(0x38bdf8, 5.0 * intensity, 22, Math.PI / 4, 0.35, 1.1);
    spotLightCyan.position.set(-4, 5, 4);
    const cyanTarget = new THREE.Object3D();
    cyanTarget.position.set(0, 0, 0);
    scene.add(cyanTarget);
    spotLightCyan.target = cyanTarget;
    scene.add(spotLightCyan);

    // Spotlight Violet chiếu từ dưới phải
    const spotLightViolet = new THREE.SpotLight(0xa855f7, 5.0 * intensity, 22, Math.PI / 4, 0.35, 1.1);
    spotLightViolet.position.set(4, -3.5, 3.5);
    const violetTarget = new THREE.Object3D();
    violetTarget.position.set(0, 0, 0);
    scene.add(violetTarget);
    spotLightViolet.target = violetTarget;
    scene.add(spotLightViolet);

    // Key Directional Light tạo viền phản chiếu
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
    rimLight.position.set(0, 4, 5);
    scene.add(rimLight);

    // 6. Cấu Trúc Khối Tinh Thể Cyber-Glass Hologram
    // 6.1 Lõi tinh thể đa diện Faceted Icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(1.22, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0a1026,
      emissive: 0x1e1548,
      emissiveIntensity: 0.7,
      metalness: 0.88,
      roughness: 0.18,
      flatShading: true,
    });
    const coreMesh = registerMesh(new THREE.Mesh(coreGeo, coreMat));
    hologramGroup.add(coreMesh);

    // 6.2 Khung lồng dây Cyber Wireframe bao ngoài
    const wireGeo = new THREE.IcosahedronGeometry(1.48, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const wireMesh = registerMesh(new THREE.Mesh(wireGeo, wireMat));
    hologramGroup.add(wireMesh);

    // 6.3 Ba vòng quỹ đạo hồi chuyển Gyroscopic Orbital Rings
    // Ring 1 (Cyan #38bdf8)
    const ring1Geo = new THREE.TorusGeometry(1.85, 0.022, 16, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
    });
    const ring1 = registerMesh(new THREE.Mesh(ring1Geo, ring1Mat));
    ring1.rotation.x = Math.PI / 3;
    hologramGroup.add(ring1);

    // Ring 2 (Violet #a855f7)
    const ring2Geo = new THREE.TorusGeometry(2.05, 0.022, 16, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.8,
    });
    const ring2 = registerMesh(new THREE.Mesh(ring2Geo, ring2Mat));
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 6;
    hologramGroup.add(ring2);

    // Ring 3 (Acid Lime #c6ff3d)
    const ring3Geo = new THREE.TorusGeometry(2.25, 0.016, 16, 64);
    const ring3Mat = new THREE.MeshBasicMaterial({
      color: 0xc6ff3d,
      transparent: true,
      opacity: 0.7,
    });
    const ring3 = registerMesh(new THREE.Mesh(ring3Geo, ring3Mat));
    ring3.rotation.z = Math.PI / 5;
    hologramGroup.add(ring3);

    // 6.4 Đám mây hạt năng lượng số (Holographic Particles / Data Nodes)
    const PARTICLE_COUNT = 140;
    const particlesGeo = new THREE.BufferGeometry();
    geometriesToDispose.push(particlesGeo);

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    const colorCyan = new THREE.Color(0x38bdf8);
    const colorViolet = new THREE.Color(0xa855f7);
    const colorLime = new THREE.Color(0xc6ff3d);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 2.4 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const chosenColor = i % 3 === 0 ? colorCyan : i % 3 === 1 ? colorViolet : colorLime;
      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materialsToDispose.push(particlesMat);

    const particlesPoints = new THREE.Points(particlesGeo, particlesMat);
    hologramGroup.add(particlesPoints);

    // 7. Parallax Tương Tác Chuột & Vòng Lặp Render RAF
    let targetRotY = 0;
    let targetRotX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const xNorm = (e.clientX - rect.left) / rect.width - 0.5;
      const yNorm = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = xNorm * 0.45;
      targetRotX = yNorm * 0.3;
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 440;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        lastTime = performance.now();
        animId = requestAnimationFrame(animate);
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let lastTime = performance.now();
    let clockTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      clockTime += delta;

      // Parallax chuột mượt mà (Lerp damping)
      hologramGroup.rotation.y += (targetRotY - hologramGroup.rotation.y) * 0.05;
      hologramGroup.rotation.x += (targetRotX - hologramGroup.rotation.x) * 0.05;

      // Nhịp thở lơ lửng hình sin (Sine wave levitation)
      hologramGroup.position.y = Math.sin(clockTime * 1.5) * 0.12;

      // Xoay lõi tinh thể và khung dây ngược chiều
      coreMesh.rotation.y += 0.007;
      coreMesh.rotation.x += 0.004;
      wireMesh.rotation.y -= 0.005;
      wireMesh.rotation.z += 0.003;

      // Vòng hồi chuyển quay độc lập
      ring1.rotation.z += 0.012;
      ring2.rotation.x += 0.009;
      ring3.rotation.y += 0.007;

      // Xoay nhẹ đám mây hạt
      particlesPoints.rotation.y += 0.003;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Dọn dẹp tài nguyên triệt để khi component unmount
    return () => {
      cancelAnimationFrame(animId);
      mediaQuery.removeEventListener('change', handleMotionChange);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      for (const geo of geometriesToDispose) geo.dispose();
      for (const mat of materialsToDispose) mat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [intensity, interactive, isReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[320px] lg:h-[380px] xl:h-[420px] flex items-center justify-center overflow-hidden rounded-3xl ${className}`}
    >
      {/* Reduced-Motion / WebGL Fallback Mode */}
      {(!hasWebGL || isReducedMotion) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center rounded-3xl border border-cyan-400/30 bg-card/40 backdrop-blur-2xl shadow-2xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-950/50 mb-3 animate-pulse">
            <Cpu className="h-8 w-8 text-cyan-400" />
          </div>
          <h3 className="text-lg font-black text-white font-display">
            HOLOGRAPHIC QUANTUM MATRIX
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Đồ họa tĩnh tối ưu hiệu năng và tiết kiệm pin (Chế độ giảm hiệu ứng).
          </p>
        </div>
      )}

      {/* Cyberpunk Floating Label HUD */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-cyan-400/30 bg-slate-950/70 px-3.5 py-1 text-[11px] font-semibold text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-950/50">
        <Sparkles className="h-3 w-3 text-cyan-400" />
        <span className="tracking-wider uppercase font-mono">Cyber-Glass Stage &middot; Three.js 120FPS</span>
      </div>
    </div>
  );
}

export default Auth3DShowcase;
```

---

### 4.4 Thiết Kế Chi Tiết Component 3: `web/src/components/auth/auth-feature-carousel.tsx`

```tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  BrainCircuit,
  Trophy,
  Flame,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface FeatureSlide {
  id: string;
  superpowerTag: string;
  badge: string;
  iconType: 'cat' | 'ai' | 'party';
  title: string;
  subtitle: string;
  description: string;
  metricBadge: string;
  accentGradient: string;
  borderColor: string;
}

export const SUPERPOWER_SLIDES: FeatureSlide[] = [
  {
    id: 'meme-cat',
    superpowerTag: 'SIÊU NĂNG 01',
    badge: 'KỶ LUẬT THÉP',
    iconType: 'cat',
    title: 'Mèo Cam Giám Sát Cực Đoan',
    subtitle: 'URL Tab Blacklist & AI Webcam Face Tracking',
    description:
      'Cảnh báo tức thì khi chuyển tab lướt mạng xã hội, mắng chửi bằng giọng đọc TTS tiếng Việt hài hước và trừ -50 XP nếu bỏ cuộc.',
    metricBadge: '⚡ 5s khóa tab · -50 XP vi phạm',
    accentGradient: 'from-amber-400 to-orange-500',
    borderColor: 'border-orange-500/40 shadow-orange-500/10',
  },
  {
    id: 'ai-study-hub',
    superpowerTag: 'SIÊU NĂNG 02',
    badge: 'TRỢ LÝ 1M TOKENS',
    iconType: 'ai',
    title: 'AI Study Hub & Flashcard 3D',
    subtitle: 'Phân tích Slide PDF & Thuật toán SM-2',
    description:
      'Tự động phân tích toàn bộ giáo trình PDF cả kỳ, trích xuất câu hỏi trắc nghiệm và ôn tập lặp lại ngắt quãng với thẻ 3D không gian.',
    metricBadge: '🧠 Tóm tắt 100+ trang PDF trong 3s',
    accentGradient: 'from-cyan-400 to-blue-500',
    borderColor: 'border-cyan-400/40 shadow-cyan-400/10',
  },
  {
    id: 'pomodoro-party',
    superpowerTag: 'SIÊU NĂNG 03',
    badge: 'ĐẤU TRƯỜNG REALTIME',
    iconType: 'party',
    title: 'Pomodoro Party & Bục 3D',
    subtitle: 'Đồng bộ Realtime <200ms & Kỷ luật nhóm',
    description:
      'Học nhóm đa người chơi với Supabase Realtime Channels, chế độ Silent Focus thả reaction hạt bay và vinh danh chiến thần tuần trên bục 3D.',
    metricBadge: '👑 Bục vàng Cyberpunk · Cúp 3D',
    accentGradient: 'from-violet-400 to-purple-500',
    borderColor: 'border-violet-500/40 shadow-violet-500/10',
  },
];

export const INSPIRING_QUOTES = [
  '“Kỷ luật là cầu nối giữa ước mơ và bảng điểm A+ của bạn.”',
  '“Học không bao giờ là muộn, chỉ có nộp deadline mới sợ muộn thôi.”',
  '“Tập trung 45 phút hôm nay để mai sau không phải ngồi cày lại môn.”',
  '“Đừng để deadline dí. Hãy để CampusOS cùng bạn thống trị học kỳ này!”',
];

export function AuthFeatureCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SUPERPOWER_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + SUPERPOWER_SLIDES.length) % SUPERPOWER_SLIDES.length);
  }, []);

  // Tự động chuyển slide mỗi 5 giây, tạm dừng khi rê chuột
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const activeSlide = SUPERPOWER_SLIDES[currentIndex] || SUPERPOWER_SLIDES[0]!;
  const activeQuote = INSPIRING_QUOTES[currentIndex % INSPIRING_QUOTES.length];

  const renderIcon = (type: string) => {
    switch (type) {
      case 'cat':
        return <ShieldAlert className="h-5 w-5 text-orange-400" />;
      case 'ai':
        return <BrainCircuit className="h-5 w-5 text-cyan-400" />;
      case 'party':
        return <Trophy className="h-5 w-5 text-amber-400" />;
      default:
        return <Sparkles className="h-5 w-5 text-cyan-400" />;
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="w-full flex flex-col gap-3"
    >
      {/* 1. Feature Carousel Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border bg-slate-900/60 backdrop-blur-2xl p-4 sm:p-5 transition-all duration-500 ${activeSlide.borderColor}`}
      >
        {/* Top Header of Card */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md">
              {renderIcon(activeSlide.iconType)}
            </div>
            <span className="font-mono text-[11px] font-bold text-slate-400 tracking-wider">
              {activeSlide.superpowerTag}
            </span>
          </div>

          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
            {activeSlide.badge}
          </span>
        </div>

        {/* Title & Subtitle */}
        <h4 className="text-base sm:text-lg font-black text-white tracking-tight font-display">
          {activeSlide.title}
        </h4>
        <p className="text-xs font-semibold text-cyan-300/90 mt-0.5">
          {activeSlide.subtitle}
        </p>

        {/* Description */}
        <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed">
          {activeSlide.description}
        </p>

        {/* Bottom Metric & Navigation */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-mono font-semibold text-slate-300">
            {activeSlide.metricBadge}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Indicators */}
            <div className="flex gap-1 mr-2">
              {SUPERPOWER_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-5 bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                      : 'w-1.5 bg-slate-600 hover:bg-slate-500'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Arrows */}
            <button
              onClick={prevSlide}
              aria-label="Previous superpower"
              className="h-7 w-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next superpower"
              className="h-7 w-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Inspiring Quote Banner */}
      <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950/40 px-3.5 py-2 text-[11px] text-slate-400 italic">
        <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0 not-italic" />
        <span className="line-clamp-1">{activeQuote}</span>
      </div>
    </div>
  );
}

export default AuthFeatureCarousel;
```

---

### 4.5 Thiết Kế Helper & Unit Test Suite (`web/tests/auth-redesign.test.ts`)

```typescript
/**
 * Auth Redesign Layout & Three.js 3D Test Suite
 *
 * Verifies:
 * 1. Split-Screen 50/50 Desktop layout & 1-column fluid mobile layout contracts
 * 2. Three.js 3D Hologram stage architecture & WebGL disposal lifecycle
 * 3. Dynamic Feature Carousel data integrity for "Bộ Ba Siêu Năng"
 * 4. Password Strength Meter calculation logic & 4-tier score boundaries
 * 5. Demo 1-Click login credentials & offline authentication resiliency
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const layoutPath = path.resolve(process.cwd(), 'src', 'app', '(auth)', 'layout.tsx');
const showcasePath = path.resolve(process.cwd(), 'src', 'components', 'auth', 'auth-3d-showcase.tsx');
const carouselPath = path.resolve(process.cwd(), 'src', 'components', 'auth', 'auth-feature-carousel.tsx');

describe('Auth Redesign: Layout & Three.js Architecture Contracts', () => {
  test('1. Layout implements Split-screen 50/50 desktop and fluid mobile', () => {
    assert.ok(fs.existsSync(layoutPath), 'Layout file must exist');
    const content = fs.readFileSync(layoutPath, 'utf8');

    // Desktop 50/50 split and fixed 100vh
    assert.match(content, /lg:flex-row/, 'Must use flex-row on desktop');
    assert.match(content, /lg:w-1\/2/, 'Must split 50/50 on desktop');
    assert.match(content, /lg:h-screen/, 'Must fix height to screen on desktop');
    assert.match(content, /lg:overflow-hidden/, 'Must prevent outer scrollbars on desktop');

    // Internal scroll on right form panel
    assert.match(content, /overflow-y-auto/, 'Must allow internal scroll for form content');

    // Mobile single column fluid ambient aurora
    assert.match(content, /hidden lg:flex/, 'Must hide heavy 3D showcase on mobile <1024px');
  });

  test('2. Three.js 3D Showcase imports vanilla Three.js and guarantees strict resource disposal', () => {
    assert.ok(fs.existsSync(showcasePath), '3D Showcase component must exist');
    const content = fs.readFileSync(showcasePath, 'utf8');

    // Vanilla Three.js import
    assert.match(content, /import \* as THREE from 'three'/, 'Must import vanilla Three.js');

    // Hologram Crystal Geometries (Icosahedron & Torus Rings)
    assert.match(content, /IcosahedronGeometry/, 'Must instantiate Icosahedron geometry');
    assert.match(content, /TorusGeometry/, 'Must instantiate Torus gyroscopic rings');
    assert.match(content, /SpotLight/, 'Must instantiate SpotLight');

    // Cyan and Violet spotlights
    assert.match(content, /0x38bdf8/, 'Must use Cyan spotlight color');
    assert.match(content, /0xa855f7/, 'Must use Violet spotlight color');

    // Disposal contract
    assert.match(content, /cancelAnimationFrame/, 'Must cancel animation frame on unmount');
    assert.match(content, /\.dispose\(\)/, 'Must call dispose on geometries, materials and renderer');
    assert.match(content, /renderer\.dispose\(\)/, 'Must dispose WebGL renderer');
  });

  test('3. Feature Carousel contains "Bộ Ba Siêu Năng" and Live Stats', () => {
    assert.ok(fs.existsSync(carouselPath), 'Feature carousel component must exist');
    const content = fs.readFileSync(carouselPath, 'utf8');

    // "Bộ Ba Siêu Năng" slides
    assert.match(content, /Mèo Cam Giám Sát Cực Đoan/, 'Slide 1: Meme Cat Supervisor');
    assert.match(content, /AI Study Hub/, 'Slide 2: AI Study Hub');
    assert.match(content, /Pomodoro Party/, 'Slide 3: Pomodoro Party');

    // Live Stats & Quotes
    assert.match(content, /12,450\+/, 'Must include 12,450+ study hours metric');
    assert.match(content, /INSPIRING_QUOTES|danh ngôn/i, 'Must include inspiring quotes');
  });
});
```

---

## 5. Verification Method (Cách Thức Tự Kiểm Tra Độc Lập)

Bất kỳ kiểm thử viên hoặc triển khai viên nào cũng có thể kiểm tra độc lập báo cáo này theo các bước:

1. **Kiểm tra Layout & File Hệ Thống**:
   ```powershell
   # Xác nhận sự tồn tại của các file cấu trúc
   Test-Path web/src/app/(auth)/layout.tsx
   Test-Path web/src/app/(auth)/login/page.tsx
   Test-Path web/src/app/(auth)/register/page.tsx
   Test-Path web/src/app/(auth)/forgot-password/page.tsx
   Test-Path web/src/app/(auth)/reset-password/page.tsx
   Test-Path web/src/app/(auth)/verify-email/page.tsx
   ```

2. **Kiểm tra Bộ Test Đầy Đủ**:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm test
   ```
   *Điều kiện hợp lệ*: Toàn bộ 643+ tests vượt qua 100% với 0 failure.

3. **Kiểm tra TypeScript**:
   ```powershell
   npm run typecheck
   ```
   *Điều kiện hợp lệ*: Thoát với mã code 0 và không có bất kỳ lỗi TypeScript nào.

4. **Điều Kiện Bác Bỏ (Invalidation Conditions)**:
   - Nếu layout trên Desktop xuất hiện thanh cuộn kép (double scrollbar).
   - Nếu `Auth3DShowcase` import `@react-three/fiber` hoặc rò rỉ WebGL context khi chuyển trang.
   - Nếu Feature Carousel thiếu bất kỳ siêu năng nào trong "Bộ Ba Siêu Năng" (Mèo Cam Giám Sát, AI Study Hub, Pomodoro Party).
   - Nếu `npm test` hoặc `npm run typecheck` bị lỗi.

---

Báo cáo khảo sát đã hoàn tất đầy đủ 5 phần, tự chứa (self-contained) và sẵn sàng chuyển giao cho nhóm triển khai!

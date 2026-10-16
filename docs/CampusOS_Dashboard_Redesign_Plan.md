# CampusOS – Rebuild trang "Tổng quan" (GenZ / Phá cách)

> Plan + Prompt để đưa vào Claude Code / Cursor / v0 để build.

---

## 1. Hiện trạng (từ ảnh chụp)

**Đang có:** header chào ("Chào buổi sáng, Minh!"), streak 12 ngày, nút Thêm nhiệm vụ / Bắt đầu phiên học, Lịch trình hôm nay (3 lớp), AI Coach đề xuất khối học 45 phút, Mục tiêu tuần (8.5/12h), Deadline gần nhất (3), Môn cần chú ý, Công việc nhóm, Kỳ thi sắp tới.

**Vấn đề:**
- Layout dạng card-grid SaaS chuẩn, an toàn, nhàm, giống mọi dashboard khác.
- Hierarchy yếu: deadline "Hôm nay 23:59" (khẩn cấp nhất) bị đẩy xuống dưới.
- Gần như không có motion, không có cảm giác "sống", không có reward/gamification dù có streak.
- Không có yếu tố social, mood, hay tương tác nhanh.

**Giữ lại:** toàn bộ data logic, sidebar + header, tiếng Việt, dark-first.

---

## 2. Art Direction – "Neo-Brutal Aurora"

Một câu: **dark mode nền aurora/gradient + typography to bự kiểu poster + sticker/neo-brutal viền dày + glass lấp lánh + 3D sống động.**

| Yếu tố | Hướng |
|---|---|
| Vibe | Gen Z: hơi hỗn loạn có chủ đích, meme-able, sticker, chữ khổng lồ, bo góc lệch, xoay nhẹ |
| Màu nền | `#0A0A12` + aurora blob mờ (tím / hồng neon / cyan) chuyển động chậm |
| Accent | Acid lime `#C6FF3D`, hot pink `#FF3DA5`, electric violet `#7C5CFF`, cyan `#3DE8FF`, cam sticker `#FF8A3D` |
| Typography | Heading: **Unbounded** hoặc **Space Grotesk 700** (cỡ cực lớn, tracking âm); body: **Be Vietnam Pro** (hỗ trợ tiếng Việt chuẩn); số/mono: **JetBrains Mono** |
| Card | 2 kiểu xen kẽ: (a) glass blur + viền gradient mảnh, (b) neo-brutal: viền 2px sáng, bóng đổ cứng offset 6px 6px màu accent |
| Shape | Bo góc 24–32px, vài card xoay ±1.5°, sticker xoay lệch, badge dạng tem |
| Texture | Noise/grain overlay 4% toàn trang, grid mờ ở nền hero |
| Cursor | Custom cursor: chấm + vòng trễ, phình to khi hover card, đổi thành emoji/chữ ("click me", "done ✓") |
| Microcopy | Giọng Gen Z, vui, không lố: "Deadline đang thở sau gáy bro 🫠", "Streak 12 ngày, đừng để nó chết", "Hôm nay 3 ca, cân được" |

---

## 3. Cấu trúc trang (scroll-driven, 7 section)

### S1 – Hero 3D "Vũ trụ học tập" (100vh)
- **Three.js (React Three Fiber)**: một khối 3D ở giữa/phải: icosahedron/blob "distort" (MeshDistortMaterial) màu gradient aurora, xoay chậm, phản ứng theo chuột (parallax + nghiêng). Quanh nó là các hạt (instanced points) bay chậm.
- Blob **đổi hình theo trạng thái**: streak cao → rực lửa/to hơn; deadline gấp → đỏ nhấp nháy nhẹ; vừa hoàn thành task → "nổ" particle confetti.
- Chữ khổng lồ: `CHÀO BUỔI SÁNG, MINH.` — split từng ký tự, reveal từng chữ (stagger) khi load; từ "MINH" có hiệu ứng glitch/gradient chạy.
- Dòng phụ: ngày, "3 lớp · 1 deadline sống còn".
- **Streak 🔥 12** dạng sticker xoay lệch, bấm vào → lửa 3D/particle bắn.
- 2 CTA: `+ Thêm nhiệm vụ` (neo-brutal) và `▶ Bắt đầu phiên học` (nút magnetic: bị hút theo con trỏ, ripple khi click).
- Gợi ý scroll: mũi tên/ chữ "cuộn đi bro" nảy nhẹ.

### S2 – "Hôm nay" – Timeline ngang kéo được (pinned)
- Lịch trình hôm nay dạng **timeline ngang** (horizontal scroll theo cuộn dọc, section được pin bằng GSAP ScrollTrigger).
- Mỗi lớp là 1 card lớn; card **đang diễn ra** có viền neon pulse + thanh tiến độ live; card đã qua mờ xám; card sắp tới có countdown.
- Có "kim giờ" chạy theo thời gian thực.
- Hover card → nghiêng 3D (tilt) + hiện nút "Vào lớp / Mở tài liệu / Ghi chú nhanh".

### S3 – Deadline Arena (ưu tiên khẩn cấp)
- Layout **bento không đối xứng**: deadline gấp nhất là ô to nhất, có **countdown số khổng lồ** (HH:MM:SS) kiểu đồng hồ đếm ngược, đổi màu theo độ gấp (lime → cam → đỏ).
- Các deadline còn lại là ô nhỏ hơn, kéo thả đổi thứ tự.
- **Tick hoàn thành**: bấm vòng tròn → animation vẽ dấu ✓ (SVG path draw), card "vỡ" confetti, +XP bay lên.
- Hiệu ứng "panic mode": khi < 3 giờ, nền card rung nhẹ + viền chớp.

### S4 – AI Coach "Squad" (sticky + chat bubble)
- AI Coach thành **nhân vật mascot** (blob 3D nhỏ có mắt, theo dõi con trỏ, biết chớp mắt, đổi biểu cảm theo mood).
- Khối học đề xuất hiện như tin nhắn chat: gõ chữ (typewriter), kèm 2 nút `Chấp nhận kế hoạch` / `Bỏ qua` (bấm chấp nhận → block tự "bay" vào timeline S2).
- Chip gợi ý nhanh: "Dời xuống tối", "Ngắn hơn 25p", "Ôn kiểu flashcard".

### S5 – Stats & Goal "Game HUD"
- **Mục tiêu tuần**: vòng tròn/ring progress lớn, số đếm tăng (count-up) khi vào viewport; 71% có hiệu ứng nước dâng (liquid fill) hoặc ring gradient quay.
- **XP / Level**: thanh XP, level 7 "Sinh viên cày thuê" (hệ danh hiệu hài).
- **Heatmap streak** kiểu GitHub 12 tuần, hover xem số giờ học.
- **Môn cần chú ý**: card cảnh báo dạng sticker "⚠ Xác suất đang tụt", có sparkline điểm số animate vẽ dần.

### S6 – Squad & Kỳ thi
- **Công việc nhóm**: kanban mini 3 cột (Đang làm / Chờ review / Xong), kéo thả card; avatar thành viên chồng nhau, hover có tooltip; nút "nhắc bạn" (poke) bắn thông báo.
- **Kỳ thi sắp tới**: lịch dạng "vé concert": ngày to, countdown, thanh tiến độ ôn tập 62%, nút `Tạo đề cương AI`.

### S7 – Footer vui vẻ
- Câu quote ngẫu nhiên chạy marquee vô tận (chữ khổng lồ, 2 hàng ngược chiều): "ĐỪNG DEADLINE DÍ · ĐỪNG DEADLINE DÍ ·".
- Nút `Chốt ngày hôm nay` (end-of-day recap).

---

## 4. Tính năng MỚI

| # | Tính năng | Mô tả ngắn | Ưu tiên |
|---|---|---|---|
| 1 | **Mood check-in** | Chọn emoji tâm trạng đầu ngày (😴 😐 😎 🔥); AI Coach đổi kế hoạch/giọng điệu theo mood | P0 |
| 2 | **XP + Level + Huy hiệu** | Hoàn thành task/phiên học → XP, lên level, mở khóa sticker/theme | P0 |
| 3 | **Focus Mode / Pomodoro nổi** | Nút `Bắt đầu phiên học` mở overlay toàn màn hình: timer lớn, blob 3D "thở" theo nhịp, nhạc lo-fi toggle, chặn UI khác | P0 |
| 4 | **Quick Capture (Cmd/Ctrl+K)** | Command palette: thêm task, nhảy trang, hỏi AI, tìm môn học bằng 1 phím | P0 |
| 5 | **Deadline Countdown Live** | Đồng hồ đếm ngược, màu theo độ gấp, rung khi < 3h | P0 |
| 6 | **Streak Freeze & Heatmap** | Bảo vệ streak 1 lần/tuần, heatmap 12 tuần | P1 |
| 7 | **Daily Wrapped** | Tối cuối ngày: slide kiểu Spotify Wrapped (giờ học, task xong, môn cày nhiều nhất), share ảnh story | P1 |
| 8 | **Squad Poke / Leaderboard** | Bảng xếp hạng bạn bè theo giờ học tuần, nút nhắc nhở | P1 |
| 9 | **Vibe Theme Switcher** | Đổi theme: Aurora, Y2K Chrome, Cyber Lime, Pastel Dreamy; lưu localStorage | P1 |
| 10 | **Brain-dump Voice Note** | Giữ nút mic → nói → AI tách thành task + deadline | P2 |
| 11 | **Energy Planner** | Gợi ý khung giờ học theo thói quen thực tế + mood | P2 |
| 12 | **Easter eggs** | Konami code, bấm logo 5 lần, gõ "ngu" → mascot phản ứng | P2 |

---

## 5. Hiệu ứng, scroll & tương tác (checklist)

**Scroll**
- Lenis smooth scroll (toàn trang)
- GSAP ScrollTrigger: pin S2, parallax nền aurora, reveal từng section (clip-path / translate+blur→rõ)
- Scroll-linked: blob hero co lại & di chuyển sang góc khi cuộn qua hero
- Thanh progress cuộn mảnh phía trên, gradient

**Animation (Framer Motion + GSAP)**
- Stagger reveal cho list/card
- Count-up số, draw SVG path, ring progress, liquid fill
- Layout animation khi kéo thả / sắp xếp lại (Framer `layout`)
- Magnetic buttons, tilt cards (vanilla-tilt / tự viết bằng `useMotionValue`)
- Marquee vô hạn, glitch text, text scramble khi hover tiêu đề
- Confetti (canvas-confetti) khi hoàn thành task / lên level
- Page transition khi đổi route (View Transitions API hoặc Framer)

**Three.js (R3F + drei)**
- Hero blob: `MeshDistortMaterial`, `Float`, environment HDR nhẹ, bloom nhẹ (postprocessing)
- Particles: `Points`/`Instances` ~1.500 hạt, shader đơn giản
- Mascot AI Coach: scene nhỏ riêng, mắt follow chuột
- Focus mode: blob "thở" theo nhịp 4-7-8
- Mobile: giảm hạt xuống ~300, tắt postprocessing, `dpr={[1,1.5]}`

**Interaction**
- Custom cursor, hover sound (tùy chọn, mặc định tắt), haptic trên mobile (`navigator.vibrate`)
- Keyboard: `Cmd/Ctrl+K`, `N` thêm task, `F` focus mode, `?` hiện phím tắt
- Kéo thả (dnd-kit)

**Tôn trọng người dùng:** `prefers-reduced-motion` → tắt 3D/scroll hijack, giữ fade đơn giản. Có toggle "Giảm hiệu ứng" trong Settings.

---

## 6. Tech stack đề xuất

- **Next.js 14+ (App Router) + TypeScript + Tailwind CSS** (giữ stack hiện tại của project)
- **three, @react-three/fiber, @react-three/drei, @react-three/postprocessing**
- **gsap + ScrollTrigger**, **lenis**, **framer-motion**
- **@dnd-kit/core** (kéo thả), **canvas-confetti**, **zustand** (state: mood, XP, theme, focus)
- **cmdk** (command palette), **recharts** hoặc SVG tự vẽ (sparkline, heatmap)
- Lazy-load Three.js bằng `next/dynamic` (`ssr:false`), skeleton + fallback gradient tĩnh khi chưa load / thiết bị yếu.

**Cấu trúc thư mục gợi ý**
```
app/(app)/dashboard/page.tsx
components/dashboard/
  Hero3D/            (Scene.tsx, Blob.tsx, Particles.tsx)
  sections/          (HeroSection, TodayTimeline, DeadlineArena, CoachSquad, StatsHud, SquadExams, MarqueeFooter)
  widgets/           (StreakSticker, MoodCheckin, XpBar, CountdownBig, HeatmapStreak, GoalRing)
  fx/                (MagneticButton, TiltCard, CustomCursor, TextReveal, GlitchText, Confetti)
  focus/             (FocusOverlay.tsx)
lib/motion.ts        (variants, easing chung)
lib/store.ts         (zustand)
styles/tokens.css    (CSS variables theme)
```

---

## 7. Lộ trình (roadmap)

| Phase | Nội dung | Thời gian ước tính |
|---|---|---|
| 0 | Design tokens, font, theme, grain/aurora nền, custom cursor, Lenis | 0.5 ngày |
| 1 | Hero 3D + text reveal + streak sticker + magnetic CTA | 1–1.5 ngày |
| 2 | Timeline ngang pinned + Deadline Arena + countdown + tick/confetti | 1.5 ngày |
| 3 | AI Coach mascot + Stats HUD (ring, XP, heatmap) | 1.5 ngày |
| 4 | Squad kanban + Kỳ thi + Marquee footer | 1 ngày |
| 5 | Tính năng P0: Mood, XP, Focus Mode, Cmd+K | 1.5 ngày |
| 6 | Tối ưu hiệu năng, mobile, reduced-motion, a11y, test | 1 ngày |
| 7 | P1/P2: Wrapped, leaderboard, theme switcher, voice, easter eggs | tuỳ |

**Tiêu chí hoàn thành:** Lighthouse Performance ≥ 80 trên laptop thường, 60fps khi cuộn, trang vẫn dùng được khi tắt JS 3D (fallback), tương phản chữ đạt AA.

---

## 8. PROMPT – copy dán vào AI build

```
Bạn là senior creative front-end engineer. Hãy REBUILD hoàn toàn giao diện trang "Tổng quan" (/dashboard) của web app CampusOS (student companion, tiếng Việt) theo phong cách Gen Z phá cách, giàu hiệu ứng. Giữ nguyên sidebar, header và toàn bộ dữ liệu/logic hiện có (lịch hôm nay, deadline, mục tiêu tuần, AI Coach, công việc nhóm, kỳ thi), chỉ thay đổi UI/UX và thêm tính năng mới.

STACK: Next.js (App Router) + TypeScript + Tailwind, three + @react-three/fiber + drei + postprocessing, GSAP ScrollTrigger, Lenis, Framer Motion, dnd-kit, zustand, cmdk, canvas-confetti. Lazy-load phần 3D bằng next/dynamic (ssr:false) và có fallback gradient tĩnh.

ART DIRECTION "Neo-Brutal Aurora": nền #0A0A12 với các blob aurora (tím #7C5CFF, hồng #FF3DA5, cyan #3DE8FF) chuyển động chậm + grain 4%. Accent: acid lime #C6FF3D, cam #FF8A3D. Font: Unbounded/Space Grotesk cho heading cực lớn, Be Vietnam Pro cho body, JetBrains Mono cho số. Card xen kẽ 2 kiểu: glass blur viền gradient, và neo-brutal (viền 2px sáng, bóng cứng offset 6px). Bo góc 24–32px, một số card/sticker xoay ±1.5°. Custom cursor (chấm + vòng trễ, phình khi hover). Microcopy giọng Gen Z vui, không lố.

CẤU TRÚC (scroll-driven, 7 section):
1. HERO 3D (100vh): R3F blob distort gradient ở giữa/phải, xoay chậm, nghiêng theo chuột, ~1500 hạt bay quanh, bloom nhẹ. Blob đổi trạng thái: streak cao → lửa/to hơn, deadline gấp → ánh đỏ, hoàn thành task → nổ confetti. Chữ khổng lồ "CHÀO BUỔI SÁNG, MINH." tách ký tự, reveal stagger, "MINH" có gradient/glitch. Dòng phụ ngày + "3 lớp · 1 deadline sống còn". Sticker streak 🔥12 xoay lệch (bấm → bắn particle). CTA "+ Thêm nhiệm vụ" và "▶ Bắt đầu phiên học" dạng magnetic button có ripple. Gợi ý cuộn bouncing.
2. HÔM NAY – timeline ngang được pin (ScrollTrigger): cuộn dọc → trượt ngang. Card lớp đang diễn ra có viền neon pulse + tiến độ live; lớp đã qua mờ; lớp sắp tới có countdown; kim giờ chạy real-time. Hover → tilt 3D + quick actions (Vào lớp / Tài liệu / Ghi chú).
3. DEADLINE ARENA – bento bất đối xứng: deadline gấp nhất là ô to với countdown HH:MM:SS khổng lồ, đổi màu lime→cam→đỏ, rung + chớp viền khi <3h. Tick hoàn thành: vẽ dấu ✓ bằng SVG path, confetti, +XP bay lên. Kéo thả đổi thứ tự.
4. AI COACH SQUAD: mascot 3D nhỏ (mắt follow chuột, chớp mắt, đổi biểu cảm theo mood). Đề xuất khối học hiện dạng tin nhắn chat (typewriter) + nút "Chấp nhận kế hoạch" (block bay vào timeline) / "Bỏ qua" + chip nhanh ("Dời xuống tối", "Ngắn hơn 25p", "Ôn kiểu flashcard").
5. STATS HUD kiểu game: ring mục tiêu tuần 8.5/12h (count-up + liquid fill/gradient ring), thanh XP + level + danh hiệu hài, heatmap streak 12 tuần (hover xem số giờ), card "Môn cần chú ý" dạng sticker cảnh báo với sparkline vẽ dần.
6. SQUAD & KỲ THI: kanban mini 3 cột (Đang làm / Chờ review / Xong) kéo thả, avatar chồng, nút "nhắc bạn"; Kỳ thi dạng "vé concert" có countdown, tiến độ ôn 62%, nút "Tạo đề cương AI".
7. FOOTER: 2 hàng marquee chữ khổng lồ chạy ngược chiều + nút "Chốt ngày hôm nay" (recap cuối ngày).

TÍNH NĂNG MỚI: (P0) Mood check-in 4 emoji ảnh hưởng giọng/kế hoạch AI Coach; XP + Level + huy hiệu; Focus Mode toàn màn hình (timer lớn, blob "thở" theo nhịp, toggle lo-fi); Command palette Cmd/Ctrl+K (thêm task, điều hướng, hỏi AI); Deadline countdown live. (P1) Streak freeze, Daily Wrapped kiểu Spotify (slide + chia sẻ ảnh), leaderboard bạn bè/poke, Vibe Theme Switcher (Aurora, Y2K Chrome, Cyber Lime, Pastel Dreamy). (P2) Brain-dump voice → task, Energy Planner, easter eggs (Konami, bấm logo 5 lần).

HIỆU ỨNG & TƯƠNG TÁC: Lenis smooth scroll; ScrollTrigger reveal (clip-path/blur→rõ), parallax nền aurora, blob hero co lại sang góc khi cuộn; thanh progress cuộn gradient; stagger reveal, count-up, draw SVG, layout animation (Framer layout), magnetic button, tilt card, text scramble khi hover tiêu đề, confetti, page transition. Phím tắt: N thêm task, F focus, ? xem phím tắt.

YÊU CẦU PHI CHỨC NĂNG: 60fps; mobile giảm hạt (~300), tắt postprocessing, dpr [1,1.5]; tôn trọng prefers-reduced-motion (tắt 3D/scroll hijack, chỉ fade) + toggle "Giảm hiệu ứng"; responsive từ 360px; tương phản AA; keyboard accessible; không thêm thư viện thừa; code chia component rõ ràng (components/dashboard/{Hero3D,sections,widgets,fx,focus}, lib/motion.ts, lib/store.ts, styles/tokens.css), dữ liệu mock tách file để dễ thay bằng API thật.

CÁCH LÀM: làm theo từng phase (0: tokens/nền/cursor/Lenis → 1: Hero 3D → 2: Timeline + Deadline → 3: Coach + HUD → 4: Squad/Kỳ thi/Footer → 5: tính năng P0 → 6: tối ưu & a11y). Sau mỗi phase, chạy được và tóm tắt ngắn những gì đã làm trước khi sang phase tiếp theo.
```

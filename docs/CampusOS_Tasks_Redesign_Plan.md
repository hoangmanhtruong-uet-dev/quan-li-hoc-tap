# CampusOS – Rebuild trang "Nhiệm vụ" (GenZ / Phá cách)

> Đồng bộ style với Tổng quan và Lịch (Neo-Brutal Aurora). Plan + Prompt để đưa vào AI build.

---

## 1. Hiện trạng (từ ảnh chụp)

**Đang có:** tiêu đề "Nhiệm vụ", nút `+ Thêm nhiệm vụ` (xanh lá), 4 stat card (4 tổng, 1 đang thực hiện, 2 ưu tiên cao, 25% hoàn thành), thanh lọc (ô tìm kiếm, chip Tất cả / Cần làm / Đang làm / Hoàn thành, dropdown "Mọi ưu tiên", sort "Theo hạn"), danh sách nhiệm vụ (tên, môn, hạn, thời lượng, tiến độ bước x/y, chấm đỏ ưu tiên, badge trạng thái, mũi tên), panel phải trống "Chọn một nhiệm vụ" (chi tiết, subtasks, chỉnh sửa).

**Vấn đề:**
- Chỉ có 1 view danh sách; không có Kanban, không có ma trận ưu tiên, không thấy "việc nào làm trước".
- Ô tìm kiếm bị cắt placeholder ("Tìm thec"), dropdown ưu tiên dùng `<select>` mặc định, lệch style.
- Hạn hiển thị chỉ là "19-08", không có countdown hay độ gấp; chấm đỏ ưu tiên không rõ nghĩa.
- Panel phải trống chiếm 1/3 màn hình khi chưa chọn gì (lãng phí).
- Tick hoàn thành khô khốc, không có phần thưởng; không liên kết với Focus/Pomodoro, XP, Lịch.
- Không có kéo thả, không thao tác hàng loạt, không phím tắt.
- Mock data dùng tháng 8 trong khi ngày thực là 13/10/2026 → nên lấy ngày hệ thống để tính "quá hạn / hôm nay / mai".

**Giữ lại:** sidebar, header, nền tối có aurora đỏ-tím (trang này có sắc xanh lá làm accent chính cho "hoàn thành"), dữ liệu task, subtasks (bước), trạng thái 3 mức, ưu tiên, tiếng Việt.

---

## 2. Art direction (kế thừa 2 trang trước)

- Nền `#0A0A12` + aurora blob chậm + grain 4%, custom cursor, Lenis, font Unbounded/Space Grotesk (heading), Be Vietnam Pro (body), JetBrains Mono (số, đếm ngược).
- Task = **ticket/sticker**: viền 1.5px, bo 20px, bóng cứng offset theo màu trạng thái, hơi xoay ±0.8° khi hover.
- Màu trạng thái: Cần làm = xám-xanh `#7A8AA8`, Đang làm = violet `#8B6CFF`, Hoàn thành = lime/mint `#3DFFB0`; ưu tiên: Cao = hot pink/đỏ `#FF3D6E` (nhãn chữ rõ "CAO", không chỉ chấm), Vừa = cam `#FFB020`, Thấp = cyan `#3DE8FF`.
- Tiêu đề trang chữ khổng lồ `NHIỆM VỤ.`, dòng phụ động: "Còn 3 việc, cân được 💪" (đổi theo số việc chưa xong / quá hạn).
- Microcopy Gen Z: rỗng → "Sạch bách, đi chơi được rồi 🎉"; quá hạn → "Trễ rồi bro, làm nhanh còn kịp 🫠"; tick xong → "GG +20 XP".

---

## 3. Cấu trúc trang

### S1 – Header "Quest Board" (≤ 28vh)
- Chữ `NHIỆM VỤ.` cực lớn, text-reveal từng ký tự; nền Three.js nhẹ: **các khối lập phương/ngôi sao nhỏ lơ lửng trôi chậm** (instanced mesh ~40 khối); mỗi lần hoàn thành 1 task có 1 khối "bay lên" và vỡ thành hạt. Tắt trên mobile và khi reduced-motion.
- Nút `+ Thêm nhiệm vụ` (magnetic, giữ màu xanh lá), nút `✨ AI chia nhỏ việc`, nút `▶ Focus ngay` (chọn task gấp nhất, vào Focus Mode).
- 4 stat dạng **sticker lệch** + count-up:
  - Tổng nhiệm vụ.
  - Đang thực hiện.
  - Ưu tiên cao (chấm đỏ nhấp nháy nếu có task quá hạn).
  - Hoàn thành: **ring tròn vẽ dần** thay cho thanh ngang, 25% → số nhảy lên, đạt 100% → bùng confetti.

### S2 – Thanh điều khiển thông minh
- Switch view dạng segmented pill nền trượt: `Danh sách · Kanban · Ma trận · Hôm nay`.
- Tìm kiếm full-width co giãn, phím `/`, placeholder đầy đủ ("Tìm nhiệm vụ, môn học, thẻ…"), highlight kết quả.
- Chip trạng thái có **số đếm**, bật/tắt bằng layout animation; thay dropdown ưu tiên bằng 3 chip `Cao · Vừa · Thấp`; sort dạng menu tuỳ chỉnh (Theo hạn, Ưu tiên, Môn học, Mới tạo, AI đề xuất).
- Lọc theo môn học (chip có màu môn), thẻ (tag), "Chỉ việc có hạn tuần này".
- Thanh **hành động hàng loạt** trượt lên từ dưới khi chọn nhiều task (Đánh dấu xong, Đổi ưu tiên, Dời hạn, Xoá).

### S3 – View Danh sách (mặc định)
- Gom nhóm có header sticky: `Quá hạn · Hôm nay · Ngày mai · Tuần này · Sau đó · Đã xong`, mỗi nhóm có số đếm và nút thu gọn.
- **Task ticket:**
  - Checkbox lớn: tick → SVG vẽ ✓, ticket gạch ngang mượt, hạt confetti nhỏ, `+XP` bay lên, ticket trượt xuống nhóm "Đã xong".
  - Tiêu đề, môn (chip màu), hạn dạng **countdown** ("còn 5g 12p", đổi màu lime → cam → đỏ), thời lượng ước tính, tiến độ bước `1/3` bằng thanh chia đoạn.
  - Nhãn ưu tiên bằng chữ + màu, avatar người làm cùng (nếu nhóm).
  - Hover: tilt nhẹ, hiện hành động nhanh (▶ Focus, 📅 Đặt lịch, ✏ Sửa, ⋯).
  - Kéo thả để sắp thứ tự / đổi nhóm hạn (dnd-kit).
- Reveal stagger khi cuộn; item mới thêm "rơi" vào danh sách với spring.

### S4 – View Kanban
- 3 cột: `Cần làm · Đang làm · Hoàn thành` (có thể thêm cột tuỳ chỉnh), kéo thả card giữa cột, thả vào "Hoàn thành" thì tự tick + thưởng XP.
- Giới hạn WIP gợi ý cho "Đang làm" (cảnh báo nhẹ khi > 3).
- Cột tiêu đề dạng sticker xoay lệch; card có thanh tiến độ bước.

### S5 – Ma trận Eisenhower (mới)
- Lưới 2×2: `Làm ngay` (gấp + quan trọng), `Lên lịch`, `Giao/Dời`, `Bỏ bớt`.
- Kéo task giữa 4 ô; AI gợi ý ô phù hợp theo hạn + ưu tiên + độ khó.
- Hiệu ứng: ô "Làm ngay" viền neon pulse.

### S6 – View "Hôm nay" (mới, gọn)
- Danh sách tối đa ~5 việc **AI chọn cho hôm nay** (dựa hạn, thời lượng, giờ trống trên Lịch), tổng thời gian vs giờ rảnh, thanh "sức chứa" trong ngày.
- Nút `Chấp nhận kế hoạch` → đặt các khối học vào Lịch.

### S7 – Panel chi tiết (drawer phải)
- Khi chưa chọn: **không để trống**. Hiển thị "Việc tiếp theo nên làm" (task gấp nhất) với countdown to + nút `▶ Bắt đầu`; dưới là mini-heatmap tuần và mẹo ngắn ("Chia nhỏ việc 120 phút thành 3 khối nhé").
- Khi chọn: panel trượt vào, nội dung:
  - Tiêu đề chỉnh sửa trực tiếp, mô tả, môn, hạn (date-picker đẹp), ưu tiên, độ khó (1–5 sao), thẻ.
  - **Checklist bước (subtasks):** thêm/xoá/kéo sắp xếp, tick từng bước có hiệu ứng, thanh tiến độ tổng đổi theo.
  - **Pomodoro mini** gắn với task: số phiên đã làm / dự kiến, nút `▶ Focus` mở Focus Mode.
  - Ghi chú, file đính kèm, link tài liệu Academic Hub.
  - Lịch sử hoạt động (tạo, đổi trạng thái).
- Mobile: bottom sheet kéo được.

---

## 4. Tính năng MỚI

| # | Tính năng | Mô tả | Ưu tiên |
|---|---|---|---|
| 1 | **Nhóm theo hạn + countdown** | Quá hạn / Hôm nay / Ngày mai / Tuần này; đếm ngược đổi màu | P0 |
| 2 | **Kanban kéo thả** | 3 cột, kéo → đổi trạng thái, XP khi xong | P0 |
| 3 | **Tick có thưởng (XP + confetti)** | Đồng bộ hệ XP, streak, level với Tổng quan | P0 |
| 4 | **Panel chi tiết thông minh** | Hết trống: gợi ý "Việc tiếp theo", chỉnh sửa tại chỗ, subtasks kéo sắp xếp | P0 |
| 5 | **Thêm nhanh bằng ngôn ngữ tự nhiên** | "nộp báo cáo mạng 22/8 90p ưu tiên cao" → AI parse thành task đầy đủ | P0 |
| 6 | **Thao tác hàng loạt + phím tắt** | Chọn nhiều (Shift/Ctrl), thanh hành động nổi; `N` thêm, `J/K` lên xuống, `X` tick, `E` sửa, `F` focus | P0 |
| 7 | **AI chia nhỏ việc** | Dán mô tả bài tập → AI sinh subtasks + ước lượng thời gian | P1 |
| 8 | **Ma trận Eisenhower** | View 2×2 kéo thả, AI gợi ý ô | P1 |
| 9 | **Hôm nay: AI chọn việc** | Chọn ≤5 việc khớp giờ rảnh, đặt vào Lịch | P1 |
| 10 | **Focus gắn task (Pomodoro)** | Đếm phiên theo task, ghi nhận thời gian thực tế vs ước tính | P1 |
| 11 | **Lặp & nhắc việc** | Task lặp (hằng tuần), nhắc 1h/1 ngày trước hạn | P1 |
| 12 | **Streak "Clear the board"** | Xong hết việc hôm nay → thưởng + hiệu ứng "bảng sạch" | P1 |
| 13 | **Nhiệm vụ nhóm** | Gán người, nhắc/poke, kanban chung với nhóm/CLB | P2 |
| 14 | **Time tracking & báo cáo** | Thời gian ước tính vs thực tế, tuần này làm bao nhiêu | P2 |
| 15 | **Undo/Redo toàn trang** | Hoàn tác khi xoá/tick nhầm bằng toast | P1 |
| 16 | **Easter eggs** | Hoàn thành 10 việc liên tiếp → mưa sticker; Konami đổi theme | P2 |

---

## 5. Hiệu ứng & tương tác (checklist)

- **Vào trang:** text-reveal tiêu đề, stat sticker "bật" lên stagger, ticket trượt vào lần lượt.
- **Chuyển view:** layout animation (Framer `layoutId`) để card "bay" từ danh sách sang cột Kanban mượt, không nhảy cục.
- **Tick hoàn thành:** SVG path ✓ → gạch ngang chữ → confetti mini → +XP bay lên → ticket xuống nhóm "Đã xong"; stat ring cập nhật count-up.
- **Kéo thả:** ghost mờ, vùng thả sáng viền, snap có bounce, haptic mobile; cuộn tự động khi kéo sát mép.
- **Hover:** tilt 3D nhẹ, glow viền theo màu trạng thái, hiện hành động nhanh.
- **Countdown:** số mono nhảy từng giây (flip/tick), < 3h thì rung nhẹ + chớp viền; quá hạn thì viền đỏ + biểu tượng 🫠.
- **Three.js (nhẹ):** khối lơ lửng ở header, phản ứng với chuột + sự kiện hoàn thành; lazy-load, tắt khi reduced-motion/mobile.
- **Scroll:** Lenis, header nhóm sticky có hiệu ứng blur, thanh tiến độ cuộn mảnh; stagger reveal.
- **Empty states có hồn:** minh hoạ SVG/3D nhỏ + microcopy vui.
- **Phím tắt:** `N` thêm, `/` tìm, `1/2/3/4` đổi view, `J/K` di chuyển, `X` tick, `E` sửa, `F` focus, `Del` xoá (có undo), `?` xem tất cả, `Cmd/Ctrl+K` palette chung.
- **Tôn trọng `prefers-reduced-motion`:** chỉ fade, tắt 3D/tilt/rung; có toggle "Giảm hiệu ứng".

---

## 6. Tech stack & cấu trúc

- Giữ Next.js + TS + Tailwind. Dùng chung với 2 trang trước: framer-motion, gsap, lenis, zustand, cmdk, dnd-kit, canvas-confetti, date-fns, zod. Chỉ thêm @react-three/fiber + drei cho header (lazy-load).
- Parse ngôn ngữ tự nhiên và AI chia nhỏ việc: gọi API LLM có sẵn, trả JSON schema, validate bằng zod, fallback regex khi offline.
- Dữ liệu: store zustand + tách lớp repository để thay mock bằng API thật.

```
app/(app)/tasks/page.tsx
components/tasks/
  header/       (QuestBoardHeader.tsx, FloatingBlocks3D.tsx, StatStickers.tsx, ProgressRing.tsx)
  controls/     (ViewSwitch.tsx, SearchBar.tsx, StatusChips.tsx, PriorityChips.tsx, SortMenu.tsx, BulkBar.tsx)
  list/         (TaskGroup.tsx, TaskTicket.tsx, Countdown.tsx, CheckBurst.tsx)
  kanban/       (KanbanBoard.tsx, KanbanColumn.tsx, KanbanCard.tsx)
  matrix/       (EisenhowerMatrix.tsx)
  today/        (TodayPlan.tsx, CapacityBar.tsx)
  detail/       (DetailDrawer.tsx, NextUpPanel.tsx, SubtaskList.tsx, TaskPomodoro.tsx, ActivityLog.tsx)
  create/       (QuickAdd.tsx, TaskForm.tsx, nlpParseTask.ts, aiBreakdown.ts)
  fx/           (reuse: MagneticButton, TiltCard, Confetti, CustomCursor, TextReveal)
lib/tasks/      (grouping.ts, urgency.ts, xp.ts, recurrence.ts, shortcuts.ts)
lib/store.ts
```

**Model task:** `id, title, description?, subjectId?, status (todo|doing|done), priority (high|mid|low), difficulty (1-5), dueAt, estimateMin, actualMin, steps[{id,text,done}], tags[], assigneeIds[], pomodoros{planned,done}, rrule?, quadrant?, order, createdAt, completedAt?`

---

## 7. Lộ trình

| Phase | Nội dung | Ước tính |
|---|---|---|
| 0 | Tokens màu trạng thái/ưu tiên, model, store, mock theo ngày thực, urgency/grouping | 0.5 ngày |
| 1 | Header Quest Board + stat sticker + ring + 3D khối lơ lửng | 1 ngày |
| 2 | Thanh điều khiển (view switch, search, chip có số đếm, sort menu) | 1 ngày |
| 3 | Danh sách nhóm theo hạn + ticket + countdown + tick/XP | 1.5 ngày |
| 4 | Drawer chi tiết (Next-up, subtasks, Pomodoro mini) | 1.5 ngày |
| 5 | Kanban kéo thả + layout animation giữa các view | 1.5 ngày |
| 6 | QuickAdd NLP + hành động hàng loạt + phím tắt + Undo | 1.5 ngày |
| 7 | AI chia nhỏ việc + view Hôm nay + Ma trận | 2 ngày |
| 8 | Tối ưu hiệu năng, mobile (bottom sheet, vuốt), a11y, test | 1 ngày |
| 9 | P2: nhiệm vụ nhóm, time tracking/báo cáo, easter eggs | tuỳ |

**Tiêu chí xong:** 60fps khi kéo thả và đổi view; không còn placeholder/nội dung bị cắt; panel chi tiết không bao giờ trống; thao tác chính (thêm, tick, sửa, focus) dùng được hoàn toàn bằng bàn phím; tương phản AA; mobile 360px dùng được.

---

## 8. PROMPT – copy dán vào AI build

```
Bạn là senior creative front-end engineer. Hãy REBUILD trang "Nhiệm vụ" (/tasks) của web app CampusOS (student companion, tiếng Việt) theo cùng phong cách "Neo-Brutal Aurora" Gen Z đã dùng cho trang Tổng quan và Lịch (nền #0A0A12 + aurora blob + grain 4%, font Unbounded/Space Grotesk cho heading lớn, Be Vietnam Pro cho body, JetBrains Mono cho số/đếm ngược; card glass xen kẽ neo-brutal viền sáng + bóng cứng; custom cursor; Lenis; microcopy Gen Z vui, không lố). Giữ nguyên sidebar, header, dữ liệu task hiện có (tiêu đề, môn, hạn, thời lượng, bước x/y, ưu tiên, 3 trạng thái Cần làm/Đang làm/Hoàn thành); dùng ngày thực của hệ thống để tính quá hạn/hôm nay/ngày mai. Tái sử dụng component fx đã có (MagneticButton, TiltCard, Confetti, CustomCursor, TextReveal) và hệ XP/streak của trang Tổng quan.

STACK: Next.js (App Router) + TypeScript + Tailwind, framer-motion, gsap, lenis, @dnd-kit/core, zustand, cmdk, canvas-confetti, date-fns, zod; @react-three/fiber + drei CHỈ cho header (lazy-load, ssr:false, fallback gradient tĩnh).

MÀU: Cần làm #7A8AA8, Đang làm #8B6CFF, Hoàn thành #3DFFB0; ưu tiên Cao #FF3D6E (nhãn chữ "CAO", không chỉ chấm), Vừa #FFB020, Thấp #3DE8FF; nút chính "Thêm nhiệm vụ" giữ sắc xanh lá.

CẤU TRÚC:
1. HEADER "QUEST BOARD" (<=28vh): tiêu đề "NHIỆM VỤ." cực lớn, reveal từng ký tự; dòng phụ động theo số việc còn lại ("Còn 3 việc, cân được 💪"). Nền Three.js nhẹ: ~40 khối lập phương/ngôi sao nhỏ lơ lửng trôi chậm (instanced mesh), phản ứng với chuột; hoàn thành 1 task → 1 khối bay lên và vỡ thành hạt. Nút "+ Thêm nhiệm vụ" (magnetic), "✨ AI chia nhỏ việc", "▶ Focus ngay" (vào Focus Mode với task gấp nhất). 4 stat dạng sticker lệch + count-up: Tổng nhiệm vụ, Đang thực hiện, Ưu tiên cao (chấm đỏ nhấp nháy nếu có quá hạn), Hoàn thành dưới dạng ring tròn vẽ dần (100% → confetti).
2. THANH ĐIỀU KHIỂN: segmented pill view (Danh sách · Kanban · Ma trận · Hôm nay) có nền trượt; tìm kiếm full-width co giãn, placeholder đầy đủ "Tìm nhiệm vụ, môn học, thẻ…", phím "/", highlight kết quả; chip trạng thái có số đếm (layout animation); 3 chip ưu tiên Cao/Vừa/Thấp thay dropdown mặc định; menu sort tuỳ chỉnh (Theo hạn, Ưu tiên, Môn học, Mới tạo, AI đề xuất); lọc theo môn, thẻ, "hạn tuần này". Chọn nhiều task → thanh hành động hàng loạt trượt lên (Xong, Đổi ưu tiên, Dời hạn, Xoá).
3. DANH SÁCH: gom nhóm với header sticky (Quá hạn · Hôm nay · Ngày mai · Tuần này · Sau đó · Đã xong), có số đếm + thu gọn. Task ticket: checkbox lớn (tick → SVG vẽ ✓, gạch ngang mượt, confetti mini, +XP bay lên, ticket trượt xuống nhóm Đã xong), tiêu đề, chip môn có màu, hạn dạng countdown mono đổi màu lime→cam→đỏ (rung nhẹ + chớp viền khi <3h), thời lượng, tiến độ bước dạng thanh chia đoạn, nhãn ưu tiên bằng chữ. Hover: tilt nhẹ + glow viền + hành động nhanh (▶ Focus, 📅 Đặt lịch, ✏ Sửa, ⋯). Kéo thả đổi thứ tự/đổi nhóm hạn. Stagger reveal khi cuộn; task mới "rơi" vào bằng spring.
4. KANBAN: 3 cột kéo thả, thả vào Hoàn thành thì tự tick + XP; cảnh báo nhẹ khi "Đang làm" > 3 việc; tiêu đề cột dạng sticker xoay lệch; chuyển view dùng layoutId để card bay mượt.
5. MA TRẬN EISENHOWER: lưới 2×2 (Làm ngay / Lên lịch / Giao-Dời / Bỏ bớt), kéo thả giữa ô, AI gợi ý ô theo hạn + ưu tiên + độ khó; ô "Làm ngay" viền neon pulse.
6. HÔM NAY: AI chọn tối đa ~5 việc phù hợp giờ rảnh trên Lịch, thanh sức chứa (tổng thời gian vs giờ rảnh), nút "Chấp nhận kế hoạch" đặt các khối học vào Lịch.
7. DRAWER CHI TIẾT (phải; mobile là bottom sheet kéo được): khi chưa chọn thì KHÔNG để trống — hiện "Việc tiếp theo nên làm" (task gấp nhất, countdown lớn, nút ▶ Bắt đầu), mini-heatmap tuần và mẹo ngắn. Khi chọn: tiêu đề sửa trực tiếp, mô tả, môn, hạn (date-picker đẹp), ưu tiên, độ khó 1–5 sao, thẻ; checklist bước kéo sắp xếp có hiệu ứng tick và thanh tiến độ tổng; Pomodoro mini gắn task (phiên đã làm/dự kiến, nút ▶ Focus); ghi chú, file đính kèm, link Academic Hub; lịch sử hoạt động.

TÍNH NĂNG MỚI: (P0) nhóm theo hạn + countdown; Kanban kéo thả; tick có XP/confetti đồng bộ hệ XP; panel chi tiết thông minh; thêm nhanh bằng ngôn ngữ tự nhiên ("nộp báo cáo mạng 22/8 90p ưu tiên cao" → AI parse JSON {title,subjectId,dueAt,estimateMin,priority}, validate zod, fallback regex); thao tác hàng loạt + phím tắt. (P1) AI chia nhỏ việc (dán mô tả → subtasks + ước lượng); Ma trận Eisenhower; Hôm nay do AI chọn; Pomodoro gắn task (so thời gian thực tế vs ước tính); lặp (rrule) + nhắc việc; "Clear the board" thưởng khi xong hết việc hôm nay; Undo/Redo bằng toast. (P2) nhiệm vụ nhóm (gán người, poke), time tracking/báo cáo, easter eggs.

PHÍM TẮT: N thêm, / tìm, 1/2/3/4 đổi view, J/K di chuyển, X tick, E sửa, F focus, Del xoá (có Undo), ? xem phím tắt, Cmd/Ctrl+K palette.

YÊU CẦU PHI CHỨC NĂNG: 60fps khi kéo thả/đổi view; prefers-reduced-motion → tắt 3D/tilt/rung, chỉ fade + toggle "Giảm hiệu ứng"; responsive từ 360px; điều khiển hoàn toàn bằng bàn phím + aria (role="list/listitem", aria-checked, live region cho XP/Undo); tương phản AA; không thêm thư viện thừa; mock data tách file + lớp repository để thay bằng API; model task {id,title,description?,subjectId?,status,priority,difficulty,dueAt,estimateMin,actualMin,steps[],tags[],assigneeIds[],pomodoros{planned,done},rrule?,quadrant?,order,createdAt,completedAt?}.

CẤU TRÚC: components/tasks/{header,controls,list,kanban,matrix,today,detail,create,fx}, lib/tasks/{grouping,urgency,xp,recurrence,shortcuts}.ts, lib/store.ts.

CÁCH LÀM: theo phase (0: tokens/model/store/mock → 1: Header + stat + ring + 3D → 2: Thanh điều khiển → 3: Danh sách nhóm + ticket + countdown + tick/XP → 4: Drawer chi tiết → 5: Kanban + layout animation → 6: QuickAdd NLP + hàng loạt + phím tắt + Undo → 7: AI chia nhỏ + Hôm nay + Ma trận → 8: Tối ưu/mobile/a11y). Sau mỗi phase, chạy được và tóm tắt ngắn trước khi sang phase tiếp.
```

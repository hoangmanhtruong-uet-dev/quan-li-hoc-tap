# CampusOS – Rebuild trang "Lịch & kế hoạch" (GenZ / Phá cách)

> Đồng bộ style với trang Tổng quan (Neo-Brutal Aurora). Plan + Prompt để đưa vào AI build.

---

## 1. Hiện trạng (từ ảnh chụp)

**Đang có:** tiêu đề "Lịch & kế hoạch", toggle Tháng / Danh sách, nút Thêm sự kiện, 3 stat card (10 sự kiện, 3 deadline & bài thi, streak 12 ngày), lưới tháng 7 cột (T2–CN), chip lọc 5 loại (Lớp học, Tự học, Thi/Deadline, CLB/Nhóm, Cá nhân), pill sự kiện, "+1 sự kiện khác", panel "Ngày đã chọn" và panel "Sắp tới".

**Vấn đề:**
- Lưới tháng phẳng, ô trống to, không thấy được "ngày nào nặng/nhẹ" nhanh.
- Tên sự kiện bị cắt ("Học nhóm CTDL &...", "Thực hành Mạng ..."), phải bấm mới biết.
- Chỉ có Tháng và Danh sách: thiếu view Tuần/Ngày dạng time-grid, nên không thấy giờ trống để xếp học.
- Không kéo thả đổi lịch, không tạo nhanh bằng cách click/kéo trên lưới.
- Panel dưới (ngày đã chọn, sắp tới) nằm cuối trang, phải cuộn mới thấy.
- Không có motion, không phản hồi khi chọn ngày/đổi tháng, thiếu cảm giác sống.
- Dữ liệu mock đang hiện Tháng 8/2026 trong khi ngày thực là 13/10/2026 → nên lấy ngày thực để "Hôm nay" luôn đúng.

**Giữ lại:** sidebar, header, 5 loại sự kiện + màu, dữ liệu sự kiện, tiếng Việt, dark-first.

---

## 2. Art direction (kế thừa Tổng quan)

- Nền `#0A0A12` + aurora blob chậm + grain 4%; custom cursor, Lenis, font Unbounded/Space Grotesk (heading), Be Vietnam Pro (body), JetBrains Mono (số).
- Màu theo loại sự kiện (giữ ý nghĩa cũ, đẩy độ neon):
  - Lớp học: electric blue `#4D7CFF`
  - Tự học: violet `#8B6CFF`
  - Thi/Deadline: hot pink/đỏ `#FF3D6E`
  - CLB/Nhóm: cam vàng `#FFB020`
  - Cá nhân: lime/mint `#3DFFB0`
- Event = **sticker/ticket**: bo 14px, viền 1.5px sáng, hơi xoay ±1° khi hover, bóng cứng nhẹ cùng màu loại.
- Tiêu đề trang chữ khổng lồ: tên tháng `THÁNG 8` cực to làm hero, năm nhỏ kiểu mono bên cạnh; đổi tháng thì chữ trượt/flip như bảng sân bay.
- Microcopy Gen Z: ngày trống → "Rảnh nè, học thêm hay đi chơi tuỳ bro 😌"; ngày quá tải → "Hôm nay cháy lịch, thở đi 🥵".

---

## 3. Cấu trúc trang

### S1 – Header "Month Poster" (đầu trang, không chiếm quá 30vh)
- Chữ tên tháng khổng lồ, nền có Three.js nhẹ: **lưới điểm 3D (dot-grid) gợn sóng** theo chuột, mật độ sáng hơn ở khu vực có nhiều sự kiện (nhẹ, 1 draw call).
- Điều khiển: `‹ ›` đổi tháng (phím ←/→), `Hôm nay` (nhảy về hôm nay có animation cuộn/zoom), view switch dạng **segmented pill có nền trượt**: `Tháng · Tuần · Ngày · Agenda · Timeline`.
- Nút `+ Thêm sự kiện` magnetic; thêm nút `✨ Hỏi AI xếp lịch`.
- 3 stat dạng **sticker lệch** (xoay nhẹ, count-up): Sự kiện trong tháng, Deadline & bài thi (có chấm đỏ nhấp nháy nếu < 48h), Streak 🔥 (bấm → bắn particle).

### S2 – Bộ lọc thông minh
- Chip lọc 5 loại: bấm bật/tắt, **sự kiện loại bị tắt mờ dần/co lại** (layout animation), có số đếm trên mỗi chip; giữ phím Alt+click = chỉ xem 1 loại ("solo").
- Search nhanh trong lịch (Ctrl+F), lọc theo môn học.
- Switch "Ẩn cuối tuần", "Hiện giờ trống".

### S3 – Lưới lịch chính (Tháng)
- Ô ngày dạng card nhỏ, hover nâng nhẹ + viền glow theo loại sự kiện nhiều nhất trong ngày.
- **Heat/Load indicator**: thanh mảnh dưới số ngày (xanh→cam→đỏ) = mức bận (tổng giờ + số deadline). Ngày có deadline có "ngọn lửa/ping" nhỏ.
- Hôm nay: viền neon pulse + số ngày dạng huy hiệu. Ngày ngoài tháng mờ.
- Sự kiện: tối đa 3 pill/ô; pill hiện **đủ tên bằng tooltip/hover-expand** (không còn cắt cụt vô nghĩa); phần dư thành `+N` — bấm mở popover bung ra dạng "fan" các sticker.
- Chuyển tháng: ô lật/trượt theo hướng, stagger từng hàng (GSAP/Framer), kéo ngang trên mobile để đổi tháng.
- Chọn ngày: ô phóng to nhẹ, panel chi tiết **trượt vào từ phải** (drawer) thay vì nằm cuối trang.
- **Kéo thả** sự kiện sang ngày khác (dnd-kit): ô đích sáng lên, thả → animation "dính" + toast `Hoàn tác`.
- **Kéo chọn nhiều ngày** hoặc click đúp ô trống → quick-create (popover nhập tên bằng ngôn ngữ tự nhiên: "ôn xác suất 19h thứ 6" → AI parse).

### S4 – View Tuần / Ngày (time-grid)
- Cột ngày × hàng giờ (06:00–23:00), sticky header, đường **"bây giờ" chạy real-time**.
- Kéo để tạo khối, kéo cạnh để đổi thời lượng, kéo thân để dời giờ (snap 15 phút).
- **Khối giờ trống (free slot)** hiện vân chéo mờ + nút `+ Học ở đây`; AI Coach đề xuất khung học vàng bằng viền gradient chạy.
- Phát hiện **xung đột lịch**: 2 sự kiện chồng nhau → viền đỏ rung nhẹ + gợi ý dời.

### S5 – Timeline/Agenda
- Agenda: danh sách gom theo ngày, header ngày sticky, sự kiện reveal stagger khi cuộn.
- Timeline (mới): **lộ trình ngang cả học kỳ** (Three.js/SVG nhẹ): mỗi deadline/kỳ thi là 1 "cột mốc" 3D nổi lên theo mức quan trọng, kéo ngang để lướt, bấm → zoom vào tuần đó.

### S6 – Drawer "Ngày đã chọn" + "Sắp tới"
- Drawer phải (desktop) / bottom sheet (mobile) kéo được: tiêu đề ngày chữ to, danh sách sự kiện dạng ticket có tick hoàn thành, nút `+ Thêm`.
- Mỗi sự kiện: chấm tiến độ chuẩn bị (checklist con), nút `Vào học / Mở tài liệu / Ghi chú`.
- "Sắp tới": thanh dọc cố định bên cạnh, 5 sự kiện kế tiếp với **countdown mini**; sự kiện kế tiếp nhất có viền pulse.

---

## 4. Tính năng MỚI

| # | Tính năng | Mô tả | Ưu tiên |
|---|---|---|---|
| 1 | **View Tuần/Ngày time-grid** | Kéo thả, resize, snap 15p, đường "bây giờ" | P0 |
| 2 | **Kéo thả đổi ngày + Undo** | dnd-kit, toast hoàn tác | P0 |
| 3 | **Quick-create ngôn ngữ tự nhiên** | "ôn xác suất 19h thứ 6" → tạo sự kiện đúng loại/môn | P0 |
| 4 | **Load heat-bar mỗi ngày** | Mức bận + cảnh báo ngày quá tải | P0 |
| 5 | **Phát hiện xung đột** | Cảnh báo chồng lịch, gợi ý dời | P0 |
| 6 | **AI "Xếp lịch giúp tao"** | Chọn mục tiêu/deadline → AI lấp khối học vào giờ trống, user chấp nhận/từ chối từng khối | P1 |
| 7 | **Free-slot finder** | Hiện giờ trống, bấm để học/đặt Pomodoro; tích hợp Focus Mode | P1 |
| 8 | **Deadline countdown trên lịch** | Ngày deadline có đồng hồ đếm ngược nhỏ, đổi màu theo độ gấp | P1 |
| 9 | **Lặp sự kiện + nhắc nhở** | Lặp tuần (lớp học), nhắc trước 10p/1h/1 ngày, thông báo trình duyệt | P1 |
| 10 | **Đồng bộ/Export** | Xuất .ics, nhập từ Google Calendar/.ics (thời khoá biểu trường) | P1 |
| 11 | **Lịch nhóm (Squad view)** | Chồng lịch bạn bè lên để tìm giờ cùng rảnh họp nhóm | P2 |
| 12 | **Semester Timeline 3D** | Lộ trình cột mốc cả học kỳ | P2 |
| 13 | **Daily Plan share** | Xuất ảnh lịch hôm nay dạng story để khoe | P2 |
| 14 | **Easter eggs** | Ngày 13 thứ Sáu rung, Konami đổi theme, v.v. | P2 |

---

## 5. Hiệu ứng & tương tác (checklist)

- **Chuyển tháng/tuần**: slide + stagger, chữ tên tháng flip, giữ 60fps.
- **Chọn ngày**: scale nhẹ, drawer trượt, danh sách sự kiện reveal stagger.
- **Hover**: tilt nhẹ sticker, glow viền theo màu loại, tooltip đầy đủ tên + giờ + địa điểm.
- **Kéo thả**: ghost mờ, ô đích sáng, magnet snap, "bounce" khi thả; haptic trên mobile.
- **Tick hoàn thành**: SVG path vẽ ✓, confetti mini, +XP bay lên (đồng bộ hệ XP của Tổng quan).
- **Hôm nay**: viền pulse; đường "bây giờ" có chấm nhịp.
- **Three.js**: dot-grid gợn sóng ở header (nhẹ, tắt trên mobile/khi reduced-motion), Semester Timeline (P2, lazy-load).
- **Phím tắt**: `←/→` đổi tháng, `T` hôm nay, `M/W/D/A` chuyển view, `N` thêm sự kiện, `/` tìm kiếm, `?` xem phím tắt, `Cmd/Ctrl+K` palette dùng chung.
- **Tôn trọng `prefers-reduced-motion`**: chỉ fade, tắt 3D, có toggle "Giảm hiệu ứng".

---

## 6. Tech stack & cấu trúc

- Giữ stack hiện tại (Next.js + TS + Tailwind). Thêm: **date-fns** (hoặc dayjs), **@dnd-kit/core**, **framer-motion**, **gsap**, **lenis**, **zustand**, **cmdk**, **@react-three/fiber + drei** (chỉ header + timeline, lazy-load), **rrule** (lặp sự kiện), **ics** (export).
- Tự viết lưới lịch (không dùng FullCalendar) để kiểm soát style/animation.
- Parse ngôn ngữ tự nhiên: gọi API LLM có sẵn (JSON schema: title, type, subject, start, end, location), validate bằng zod; fallback parse đơn giản bằng regex nếu offline.

```
app/(app)/calendar/page.tsx
components/calendar/
  header/        (MonthPoster.tsx, DotGrid3D.tsx, ViewSwitch.tsx, StatStickers.tsx)
  filters/       (TypeChips.tsx, SearchBar.tsx)
  month/         (MonthGrid.tsx, DayCell.tsx, EventPill.tsx, MorePopover.tsx)
  timegrid/      (WeekView.tsx, DayView.tsx, NowLine.tsx, FreeSlot.tsx)
  agenda/        (AgendaList.tsx, SemesterTimeline.tsx)
  drawer/        (DayDrawer.tsx, EventTicket.tsx, UpcomingRail.tsx)
  create/        (QuickCreate.tsx, EventForm.tsx, nlpParse.ts)
  fx/            (reuse từ dashboard: MagneticButton, TiltCard, Confetti, CustomCursor)
lib/calendar/    (dateUtils.ts, conflicts.ts, loadScore.ts, recurrence.ts, ics.ts)
lib/store.ts     (zustand: view, selectedDate, filters, events)
```

**Model sự kiện:** `id, title, type (class|selfstudy|exam|club|personal), subjectId?, start, end, allDay, location?, rrule?, reminders[], checklist[], done, color?`

---

## 7. Lộ trình

| Phase | Nội dung | Ước tính |
|---|---|---|
| 0 | Tokens/màu loại, dateUtils, store, model, mock theo ngày thực | 0.5 ngày |
| 1 | Header Month Poster + stat stickers + view switch + filter chips | 1 ngày |
| 2 | Month grid mới (heat-bar, pill, +N popover, chuyển tháng animate) | 1.5 ngày |
| 3 | Drawer ngày + Sắp tới rail + tick/XP | 1 ngày |
| 4 | Tuần/Ngày time-grid + now-line + kéo/resize + xung đột | 2 ngày |
| 5 | Kéo thả giữa ngày + Undo + Quick-create NLP | 1.5 ngày |
| 6 | Free-slot + AI xếp lịch + lặp/nhắc + .ics | 2 ngày |
| 7 | Tối ưu, mobile (bottom sheet, swipe), a11y, test | 1 ngày |
| 8 | P2: Squad view, Semester Timeline 3D, share, easter eggs | tuỳ |

**Tiêu chí xong:** 60fps khi đổi tháng/kéo thả, tooltip hiện đủ tên sự kiện, không còn nội dung bị cắt mất thông tin, hoạt động bằng bàn phím, đạt AA tương phản, mobile 360px dùng được.

---

## 8. PROMPT – copy dán vào AI build

```
Bạn là senior creative front-end engineer. Hãy REBUILD trang "Lịch & kế hoạch" (/calendar) của web app CampusOS (student companion, tiếng Việt) theo cùng phong cách "Neo-Brutal Aurora" Gen Z đã dùng cho trang Tổng quan (nền #0A0A12 + aurora blob + grain 4%, font Unbounded/Space Grotesk cho heading lớn, Be Vietnam Pro cho body, JetBrains Mono cho số; card glass xen kẽ neo-brutal viền sáng + bóng cứng; custom cursor; Lenis; microcopy Gen Z vui, không lố). Giữ nguyên sidebar, header, 5 loại sự kiện (Lớp học, Tự học, Thi/Deadline, CLB/Nhóm, Cá nhân) và dữ liệu sự kiện hiện có; dùng ngày thực của hệ thống cho "Hôm nay". Tái sử dụng component fx đã có (MagneticButton, TiltCard, Confetti, CustomCursor).

STACK: Next.js (App Router) + TypeScript + Tailwind, date-fns, @dnd-kit/core, framer-motion, gsap, zustand, cmdk, rrule, ics, zod; @react-three/fiber + drei CHỈ cho header (lazy-load, ssr:false, fallback gradient tĩnh). Tự viết lưới lịch, không dùng FullCalendar.

MÀU LOẠI SỰ KIỆN: Lớp học #4D7CFF, Tự học #8B6CFF, Thi/Deadline #FF3D6E, CLB/Nhóm #FFB020, Cá nhân #3DFFB0.

CẤU TRÚC:
1. HEADER "MONTH POSTER" (<=30vh): tên tháng khổng lồ (vd "THÁNG 8", năm nhỏ dạng mono) có hiệu ứng flip/trượt khi đổi tháng; nền dot-grid 3D gợn sóng theo chuột, sáng hơn ở vùng nhiều sự kiện (một draw call, tắt trên mobile/reduced-motion). Điều khiển: ‹ › (phím ←/→), nút "Hôm nay" (phím T), segmented pill có nền trượt cho view: Tháng · Tuần · Ngày · Agenda · Timeline; nút "+ Thêm sự kiện" (magnetic) và "✨ Hỏi AI xếp lịch". 3 stat dạng sticker xoay lệch + count-up: Sự kiện trong tháng, Deadline & bài thi (chấm đỏ nhấp nháy nếu <48h), Streak 🔥 (bấm → particle).
2. FILTER: 5 chip loại có số đếm, bấm bật/tắt (sự kiện loại bị tắt mờ/co lại bằng layout animation), Alt+click = solo; ô tìm kiếm (phím /), lọc theo môn; switch "Ẩn cuối tuần", "Hiện giờ trống".
3. LƯỚI THÁNG: ô ngày dạng card nhỏ, hover nâng + glow theo màu loại chiếm nhiều nhất; thanh load-heat mảnh (xanh→cam→đỏ) theo tổng giờ + số deadline; ngày có deadline có ping nhỏ; hôm nay viền neon pulse. Tối đa 3 pill/ô, hover/tooltip hiện đủ tên + giờ + địa điểm (không cắt cụt mất thông tin); "+N" mở popover bung dạng fan. Đổi tháng: slide + stagger từng hàng, mobile vuốt ngang. Chọn ngày: ô scale nhẹ + drawer trượt từ phải. Kéo thả sự kiện sang ngày khác (ghost mờ, ô đích sáng, thả có bounce, toast "Hoàn tác"). Click đúp ô trống hoặc kéo chọn nhiều ngày → QuickCreate popover.
4. VIEW TUẦN/NGÀY (time-grid 06:00–23:00): sticky header, đường "bây giờ" chạy real-time, kéo để tạo khối, kéo cạnh để đổi thời lượng, kéo thân để dời giờ (snap 15 phút). Giờ trống hiện vân chéo mờ + nút "+ Học ở đây"; AI đề xuất khung học vàng bằng viền gradient. Phát hiện xung đột lịch: viền đỏ rung nhẹ + gợi ý dời.
5. AGENDA & TIMELINE: Agenda gom theo ngày, header ngày sticky, reveal stagger. Timeline cả học kỳ: các deadline/kỳ thi là cột mốc nổi lên theo mức quan trọng, kéo ngang để lướt, bấm → zoom vào tuần đó (SVG hoặc Three.js lazy-load).
6. DRAWER "NGÀY ĐÃ CHỌN" (desktop: panel phải; mobile: bottom sheet kéo được): tiêu đề ngày chữ to, danh sách ticket sự kiện có tick hoàn thành (SVG vẽ ✓ + confetti + +XP), checklist con, nút Vào học/Mở tài liệu/Ghi chú, nút "+ Thêm". Cột "Sắp tới": 5 sự kiện kế tiếp với countdown mini, sự kiện gần nhất viền pulse.

TÍNH NĂNG MỚI: (P0) view Tuần/Ngày; kéo thả đổi ngày + Undo; QuickCreate ngôn ngữ tự nhiên ("ôn xác suất 19h thứ 6" → AI parse ra JSON {title,type,subjectId,start,end,location}, validate bằng zod, fallback regex); load heat-bar; phát hiện xung đột. (P1) AI "Xếp lịch giúp tao" (lấp khối học vào giờ trống, user chấp nhận/từ chối từng khối); free-slot finder + nối Focus Mode; countdown deadline trên lịch; lặp sự kiện (rrule) + nhắc nhở; import/export .ics. (P2) Squad view chồng lịch bạn bè tìm giờ cùng rảnh, Semester Timeline 3D, xuất ảnh kế hoạch ngày để share, easter eggs.

PHÍM TẮT: ←/→ đổi tháng, T hôm nay, M/W/D/A đổi view, N thêm sự kiện, / tìm kiếm, ? xem phím tắt, Cmd/Ctrl+K command palette.

YÊU CẦU PHI CHỨC NĂNG: 60fps khi đổi tháng/kéo thả; prefers-reduced-motion → tắt 3D/scroll hijack, chỉ fade + toggle "Giảm hiệu ứng"; responsive từ 360px; điều khiển hoàn toàn bằng bàn phím + aria cho lưới (role="grid", aria-selected, aria-label đầy đủ ngày + sự kiện); tương phản AA; không thêm thư viện thừa; dữ liệu mock tách file để dễ thay bằng API; model sự kiện {id,title,type,subjectId?,start,end,allDay,location?,rrule?,reminders[],checklist[],done,color?}.

CẤU TRÚC: components/calendar/{header,filters,month,timegrid,agenda,drawer,create,fx}, lib/calendar/{dateUtils,conflicts,loadScore,recurrence,ics}.ts, lib/store.ts (zustand).

CÁCH LÀM: theo phase (0: tokens/model/store/mock → 1: Header + stat + view switch + filter → 2: Lưới tháng mới → 3: Drawer + Sắp tới → 4: Tuần/Ngày time-grid + xung đột → 5: Kéo thả + Undo + QuickCreate NLP → 6: Free-slot + AI xếp lịch + lặp/nhắc + .ics → 7: Tối ưu/mobile/a11y). Sau mỗi phase, chạy được và tóm tắt ngắn trước khi sang phase tiếp.
```

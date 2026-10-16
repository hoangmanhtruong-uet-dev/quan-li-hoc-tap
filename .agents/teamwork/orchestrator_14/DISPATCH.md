# Dispatch Log

## 2026-10-16T20:26:43Z
You are the Project Orchestrator (orchestrator_14) for CampusOS.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_14
Project root: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
Web app directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
Authoritative request log: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md

Mission:
Hợp nhất toàn bộ Backend của CampusOS sang hệ sinh thái Supabase (PostgreSQL, Supabase Auth, Row Level Security, Realtime WebSockets, Supabase Storage) theo mô hình Offline-First with Optimistic Sync.

Integrity mode: development

Requirements:
### R1. Schema Migrations & Row Level Security (`supabase/migrations/`)
- Tạo migration PostgreSQL hoàn chỉnh (`003_complete_campusos_schema.sql`) bao gồm các thực thể:
  - `profiles`: Hồ sơ sinh viên liên kết `auth.users(id)`, điểm XP, level, rank title, streak, vibe theme.
  - `tasks`: Nhiệm vụ học tập, ma trận Eisenhower (Q1-Q4), subtasks JSONB, attachments JSONB.
  - `courses` & `course_syllabus`: Môn học, giảng viên, tín chỉ, thành phần điểm số, giáo trình từng tuần và tài liệu PDF.
  - `workspaces`, `workspace_members`, `workspace_kanban_tasks`, `workspace_documents`: Quản lý nhóm đồ án phân quyền RBAC.
  - `clubs`, `club_events`, `club_finances`: Phân hệ CLB sinh viên.
  - `dorm_spaces`, `dorm_chores`, `dorm_expenses`: Không gian sống KTX và chia tiền quỹ.
  - `student_notifications`: Trung tâm thông báo học vụ & deadline.
- Thiết lập đầy đủ RLS Policies cho tất cả các bảng: người dùng chỉ đọc/ghi dữ liệu của chính mình (`auth.uid() = user_id`), các bảng nhóm (`workspaces`, `clubs`, `dorm_spaces`) tuân thủ quan hệ thành viên/phân quyền.

### R2. Storage Buckets cho Tài liệu & Slide Bài giảng PDF
- Thiết lập 3 Supabase Storage Buckets với policies công khai/riêng tư phù hợp:
  - `academic-materials`: Lưu slide bài giảng PDF từng tuần của môn học.
  - `task-attachments`: Lưu tệp đính kèm nhiệm vụ học tập.
  - `student-avatars`: Lưu ảnh thẻ sinh viên holographic.
- Nâng cấp `storage-engine.ts` để upload file thật lên Supabase Storage với fallback offline.

### R3. Offline-First Optimistic Sync Engine & Realtime WebSockets
- Mở rộng `src/lib/supabase-sync.ts` thành **CampusOS Sync Engine**:
  - Tải nhanh 0ms từ cache/localStorage khi mở trang.
  - Tự động đồng bộ ngầm 2 chiều khi có mạng (Optimistic updates).
  - Lắng nghe realtime qua kênh `supabase.channel('campusos-realtime')` cho `tasks`, `notifications`, `workspaces`.
  - Fallback an toàn khi chưa cấu hình Supabase Cloud hoặc đang offline (không gây gián đoạn hay crash).

### R4. Hợp nhất Supabase Auth & Cập nhật API / Middleware
- Chuyển đổi xác thực đăng nhập, đăng ký, đăng xuất, quên mật khẩu sang Supabase Auth.
- Cập nhật middleware bảo vệ route và tự động khởi tạo hồ sơ sinh viên mới.
- Loại bỏ sự phụ thuộc MySQL cũ, đảm bảo thống nhất 100% stack Supabase Postgres.

Acceptance Criteria:
- `npm run typecheck` hoàn thành với 0 lỗi TypeScript trên toàn bộ codebase.
- `npm test` vượt qua 100% các bài test (339+ tests) và các test case mới cho Sync Engine.
- `npm run build` biên dịch thành công 100% các route (34+ static & dynamic routes).
- Tích hợp mượt mà với UI Cyber-Glass hiện tại, không gây vỡ giao diện hay lỗi SSR hydration.

Operational Guidelines:
1. Maintain your own BRIEFING.md and progress.md in your working directory (`d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_14`).
2. Dispatch subagents for research, implementation, and review as needed following team conventions.
3. Keep progress.md regularly updated so Sentinel monitoring can report progress and verify liveness.
4. When work is complete and all Quality Gates pass, write handoff.md and send a message claiming completion to Sentinel. Sentinel will trigger the independent Victory Auditor.

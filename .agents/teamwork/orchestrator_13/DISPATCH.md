# DISPATCH — 2026-10-16T17:40:00Z

You are the Project Orchestrator (orchestrator_13).

## Working Directory
- Your metadata directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_13\`
- App working directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`
- Original user request: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md` (see timestamp `## 2026-10-16T17:39:47Z`)

## Mission
Tiếp tục triển khai rebuild toàn diện các phân hệ còn lại của nền tảng CampusOS theo chuẩn thiết kế Cyber-Glass cao cấp (Frosted Glassmorphism, 1px Neon Border, Fluid Ambient Aurora), đồ họa 3D Three.js 120FPS, logic nghiệp vụ chuyên sâu và đáp ứng 100% Quality Gates (npm run typecheck 0 lỗi, npm test pass 100%, npm run build pass).

Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
Integrity mode: development

### R1. Nhóm học tập & Đồ án (`/workspaces`, `/workspaces/[workspaceId]`)
- Rebuild giao diện Cyber-Glass cho trang danh sách Workspace và chi tiết Workspace.
- Hỗ trợ phân quyền thành viên chặt chẽ (OWNER, ADMIN, MANAGER, MEMBER, VIEWER).
- Bảng Kanban nhiệm vụ nhóm đồ án, tài liệu chia sẻ, và nhật ký hoạt động thời gian thực.

### R2. Câu lạc bộ sinh viên (`/clubs`, `/clubs/[id]`, và các trang con)
- Rebuild `/clubs`, `/clubs/[id]`, `/clubs/[id]/events`, `/clubs/[id]/finance`, `/clubs/[id]/members`, `/clubs/[id]/tasks`.
- Quản lý sự kiện CLB, thu chi quỹ câu lạc bộ, phân bổ nhiệm vụ ban sự kiện.

### R3. Hồ sơ, Thông báo & Cài đặt (`/profile`, `/notifications`, `/settings`)
- Rebuild `/profile`: Thẻ sinh viên Cyber-Glass holographic, radar năng lực tổng hợp, thống kê tín chỉ và danh hiệu đạt được.
- Rebuild `/notifications`: Trung tâm thông báo chia tab (Tất cả, Deadline, CLB, Học vụ), đánh dấu đã đọc và xóa thông báo.
- Rebuild `/settings`: Trung tâm cài đặt hệ thống (Giao diện dark mode, thông báo đẩy, bảo mật tài khoản, đồng bộ lịch Google Calendar).

### Acceptance Criteria & Quality Gates
- [ ] npm run typecheck hoàn thành với 0 lỗi (TypeScript 5.5).
- [ ] npm test vượt qua 100% các bài unit test hiện có.
- [ ] npm run build biên dịch thành công toàn bộ static pages mà không có bất kỳ lỗi SSR hay ESLint unescaped entities nào.
- [ ] Thiết kế Cyber-Glass đồng bộ với toàn hệ thống: viền neon 1px (border-white/10, border-cyan-400/30), nền mờ thủy tinh (backdrop-blur-2xl bg-card/40), không vỡ layout, không tràn chiều ngang (overflow-x-hidden).

## Operating Instructions
1. Initialize your `BRIEFING.md`, `progress.md`, and master plan/feature breakdown in your metadata directory.
2. Decompose into clear milestones (e.g., Exploration/Architecture, R1 Workspaces, R2 Clubs, R3 Profile/Notifications/Settings, and Quality Gates/Verification).
3. Dispatch specialized subagents (explorers, workers, reviewers, challengers, testers) as needed per Teamwork protocols.
4. Keep `progress.md` updated at every milestone.
5. Report to Sentinel upon completion for independent victory audit.

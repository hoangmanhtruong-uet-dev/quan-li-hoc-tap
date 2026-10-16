# Product Requirements Document (PRD)

## 1. Overview

**Tên sản phẩm:** Student Study Companion (MVP)

**Mục tiêu:**
- Giúp sinh viên tổ chức học tập bằng một sản phẩm hướng học tập, không chỉ là lịch và tài liệu.
- Tạo vòng lặp học tập: nhập dữ liệu → AI lập kế hoạch → học và hoàn thành → theo dõi tiến độ → phân tích kết quả → AI điều chỉnh.
- Triển khai MVP tập trung vào 5 không gian cốt lõi: Today, Academic Hub, AI Study Coach, Roadmap AI, Team Workspace. Student Finance được giữ lại cho giai đoạn sau.

## 2. Bối cảnh và người dùng

### Người dùng chính
- Sinh viên đại học, cao đẳng.
- Sinh viên IT cần quản lý học tập, deadline, lịch thi, roadmap kỹ năng, và dự án nhóm.

### Vấn đề cần giải quyết
- Sinh viên có nhiều lịch học, deadline và tài liệu, nhưng khó giữ nhịp học hàng ngày.
- AI hiện tại chỉ là chatbot, chưa chủ động lập kế hoạch học.
- Học nhóm và việc quản lý deadline theo môn chưa rõ ràng.

## 3. Quyền lợi chính của MVP

### Today
- Cho người dùng thấy tình trạng học tập của ngày hôm nay ngay khi mở app.
- Giúp bắt đầu phiên học nhanh với Pomodoro và tài liệu kèm theo.

### Academic Hub
- Quản lý lịch học, deadline, lịch thi và điểm trong cùng một nơi.
- Cho phép nhập lịch thủ công, chỉnh sửa, import cơ bản, và theo dõi tiến độ môn học.

### AI Study Coach
- AI hiểu hiện trạng học tập và đề xuất hành động.
- Tạo kế hoạch học, ưu tiên deadline, phát hiện phần yếu, điều chỉnh nhịp học.

### Roadmap AI
- Tạo roadmap học tập cá nhân hóa theo định hướng nghề nghiệp.
- Hiển thị tiến độ và đề xuất bước tiếp theo.

### Team Workspace
- Quản lý dự án nhóm cơ bản với nhiệm vụ, phân công, tiến độ.
- Hiện trạng nhóm và đề xuất cân bằng khối lượng.

## 4. MVP Scope

### A. Today (MVP)
- Landing page hiển thị:
  - Lịch học hôm nay.
  - Deadline/nhắc nhở gần nhất.
  - Lịch thi sắp tới.
  - Nhiệm vụ AI đề xuất.
  - Kế hoạch học trong ngày.
  - Tiến độ mục tiêu tuần.
  - Cảnh báo môn nguy cơ tụt do điểm/tiến độ.
  - Bộ tóm tắt chi tiêu cơ bản (chỉ thể hiện nếu có dữ liệu).
  - Công việc nhóm cần xử lý.
- Nút "Bắt đầu phiên học" kích hoạt:
  - Pomodoro.
  - Hiển thị tài liệu liên quan.
  - Ghi nhận thời gian học.
  - Cập nhật tiến độ học.

### B. Academic Hub (MVP)
- Lịch học:
  - Nhập lịch thủ công.
  - Chỉnh sửa thời gian, phòng, giảng viên, link.
  - Lặp theo tuần.
- Deadline:
  - CRUD deadline với môn, loại bài, độ ưu tiên, hạn chót, thời gian dự kiến.
  - Các nhiệm vụ nhỏ.
  - Liên kết file.
  - AI đề xuất chia deadline thành task nhỏ.
- Lịch thi:
  - Ngày, giờ, phòng, hình thức, phạm vi ôn tập.
  - Số ngày còn lại.
  - Tiến độ ôn tập cơ bản.
- Quản lý điểm:
  - Cấu trúc điểm từng môn với thành phần điểm.
  - Tính điểm hiện tại và dự đoán điểm cần đạt.
  - Hiển thị GPA hiện tại và GPA dự kiến với kịch bản đơn giản.

### C. AI Study Coach (MVP)
- Hồ sơ học tập: môn đang học, tiến độ, deadline, điểm hiện tại, mục tiêu GPA.
- AI đưa ra đề xuất hành động cụ thể:
  - Điều chỉnh trọng số học tập theo deadline và điểm yếu.
  - Nên học môn nào, dành bao nhiêu phút.
  - Chia nhỏ deadline.
  - Gợi ý tài liệu học.
- Chat với tài liệu (MVP giới hạn ở upload file + tìm kiếm nội dung cơ bản).
- Lưu ý: MVP không phải là chatbot toàn bộ kiến thức; tập trung vào trợ lý hành động.

### D. Roadmap AI (MVP)
- Onboarding câu hỏi nghề nghiệp cơ bản.
- Tạo roadmap học tập cơ bản cho 1-2 chuyên ngành IT.
- Hiển thị giai đoạn, node, tiến độ, kỹ năng tiên quyết.
- AI chỉ định bước tiếp theo dựa trên tiến độ hiện tại.
- Mở rộng sang lĩnh vực khác lưu lại cho giai đoạn sau.

### E. Team Workspace (MVP)
- Khả năng tạo workspace nhóm cơ bản.
- Quản lý nhiệm vụ, deadline, thành viên.
- Hiển thị tiến độ nhóm và phân công.
- Kanban board đơn giản.
- AI cảnh báo khi khối lượng chênh lệch hoặc deadline nguy cơ trễ.

### F. Student Finance ( ngoài MVP )
- Giữ lại cho giai đoạn sau.
- Trong MVP chỉ cho phép hiển thị ví dụ nếu dữ liệu đã tồn tại, nhưng không xây dựng chức năng nhập sâu.

## 5. Out-of-Scope for MVP

- Tự động sửa lịch, tự động thay đổi deadline/exam schedule khi chưa được người dùng xác nhận.
- Import Google Calendar / OCR ảnh thời khóa biểu cho MVP đầu tiên.
- Xử lý RLS nâng cao cho nhóm nhiều doanh nghiệp.
- Lập đề thi thử toàn diện và chấm tự động phức tạp.
- Finance full-featured.
- Multi-tenant enterprise-level security beyond student/team basic access.

## 5.1 AI Behavior Contract (bắt buộc cho MVP)

### A. AI chỉ “gợi ý hành động”
- AI Study Coach và các AI recommendation endpoint **không trực tiếp ghi thay đổi** vào:
  - lịch học (schedules)
  - deadline và sub-tasks (academic_events + deadline_tasks)
  - lịch thi (exam topics)
- Mọi thay đổi đều ở dạng **recommendation: suggested**.

### B. Chỉ người dùng xác nhận mới “áp dụng”
- Khi người dùng bấm chấp nhận (accept/apply), hệ thống chuyển trạng thái recommendation:
  - suggested → accepted (kèm timestamp)
- Nếu người dùng dismiss, recommendation bị đánh dấu dismissed và không được tự động apply.

### C. “Bỏ lỡ kế hoạch” không tự sửa
- Nếu user không hoàn thành một kế hoạch/ngày (missed plan), hệ thống cho phép AI:
  - tạo daily plan mới theo bối cảnh hiện tại
- Nhưng hệ thống **không tự edit lịch đã tồn tại**; daily plan mới chỉ là recommended blocks.


## 6. Success criteria

- Người dùng có thể khởi động app và thấy Today dashboard.
- Người dùng có thể tạo lịch học, deadline, lịch thi và nhập điểm môn.
- AI gợi ý kế hoạch học trong ngày dựa trên dữ liệu thực tế.
- Người dùng có thể tạo roadmap nghề nghiệp và nhận đề xuất bước tiếp theo.
- Nhóm có thể tạo workspace và phân công nhiệm vụ.

## 7. Metrics to track

- Tỷ lệ hoàn thành phiên học từ Today.
- Số deadline được chia nhỏ thành task.
- Số đề xuất AI được người dùng chấp nhận.
- Số workspace nhóm hoạt động.
- Thời gian trung bình mỗi phiên học.

## 8. User flows

### Flow 1: Ngày học
1. Mở app, đến Today.
2. Xem lịch học, deadline gần nhất, đề xuất AI.
3. Nhấn "Bắt đầu phiên học".
4. Hoàn thành phiên và cập nhật tiến độ.

### Flow 2: Quản lý học tập
1. Vào Academic Hub.
2. Tạo lịch học và deadline.
3. Nhập điểm môn và tiến độ ôn tập.
4. Nhận đề xuất AI để cân bằng lịch.

### Flow 3: Roadmap
1. Onboarding chọn định hướng.
2. Nhận roadmap gợi ý.
3. Cập nhật tiến độ và ưu tiên node kế tiếp.

### Flow 4: Nhóm
1. Tạo Team Workspace.
2. Thêm thành viên và nhiệm vụ.
3. Theo dõi tiến độ và điều chỉnh phân công.

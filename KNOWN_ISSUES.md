# Known Issues and Assumptions

## Scope assumptions
- MVP tập trung vào học tập và nhóm; finance chỉ giữ làm tham khảo để không mở rộng quá sớm.
- OCR và Google Calendar import được coi là nâng cao, không đưa vào MVP đầu tiên.
- AI phần lớn là đề xuất hành động, không phải chatbot toàn bộ kiến thức.
- Semantic document search bằng `pgvector` là khả thi nhưng có thể giữ lại cho tính năng mở rộng.

## Technical unknowns
- Chưa xác định nền tảng AI backend/công cụ cho lời khuyên (OpenAI, local model, Supabase vector search).
- Chưa rõ mức độ tích hợp dữ liệu nhóm với AI để đảm bảo riêng tư.
- Việc tính toán tiến độ GPA dự kiến cần chuẩn hóa trọng số điểm cho từng trường hợp môn học.

## UI / UX risks
- Quá nhiều thông tin trên Today page có thể làm người dùng bị quá tải.
- Nếu AI đề xuất không đủ chính xác, người dùng có thể mất niềm tin.
- Team Workspace và Academic Hub cùng tồn tại cần rõ ràng phân biệt để không gây nhầm lẫn.

## Data modeling issues
- `academic_events.type` simplifies deadline/exam/study_goal but có thể không đủ nếu mở rộng sâu hơn.
- `uploaded_documents.access_scope` chưa thay thế cho chính sách RLS tinh vi.
- Roadmap node prerequisites được lưu trong text; nếu mở rộng cần chuyển thành quan hệ explicit.

## Edge cases
- Trùng lặp lịch học cùng thời điểm: cần cảnh báo khi tạo/sửa lịch (không tự merge schedule).
- Deadline có số ngày còn lại âm: chuyển trạng thái `missed` và Today hiển thị cảnh báo.
- “Bỏ lỡ kế hoạch” (missed plan): AI tạo daily plan mới ở dạng suggested blocks, KHÔNG tự sửa lịch/schedule đã tồn tại.
- Điểm/midterm/final components chưa đủ để dự đoán: Today/AI phải hiển thị trạng thái “insufficient data” và không giả định.
- Double-accept recommendation: apply endpoint phải idempotent theo `recommendation_id` (không tạo applied trùng lặp).
- Team task assignee bị xóa khỏi workspace hoặc mất quyền: task hiển thị unassigned hoặc không cho apply thay đổi; comment chỉ cho member hiện tại.
- Document upload bị truy cập sai scope: query/apply AI cần trả về 403 và không rò rỉ excerpt.


## Long-term issues to track
- Mở rộng Student Finance mà không làm nặng sản phẩm chính.
- Hỗ trợ nhiều định dạng roadmap ngoài IT.
- Hỗ trợ người dùng nhập dữ liệu tự động từ lịch, tài liệu, và đề thi cũ.
- Cải thiện AI từ "đề xuất" thành "điều chỉnh kế hoạch thông minh" với feedback loop thực tế.

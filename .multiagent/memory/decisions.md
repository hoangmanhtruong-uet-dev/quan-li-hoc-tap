# Architecture Decisions

## ADR-001: Lựa chọn Tech Stack TypeScript + React + Vite + Vitest
- **Trạng thái**: Đã phê duyệt (Approved by User & Planner).
- **Bối cảnh**: Cần một môi trường phát triển cờ vua vừa có thể kiểm thử đơn vị độc lập logic FIDE trong terminal, vừa có giao diện tương tác trực quan ngay trên trình duyệt mà không cần cài đặt desktop engine phức tạp.
- **Quyết định**: Sử dụng TypeScript cho toàn bộ dự án:
  - `src/core/` viết bằng Pure TypeScript, không phụ thuộc vào bất kỳ thư viện UI hay Node API nào, cho phép chạy đa nền tảng (Web, Node, Tests, Web Worker).
  - Vitest dùng làm test runner cho tốc độ cao và native TypeScript / ESM support.
  - React + Vite cho giao diện web tương tác mượt mà.

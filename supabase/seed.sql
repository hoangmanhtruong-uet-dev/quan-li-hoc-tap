-- ==============================================================================
-- Dữ liệu hạt giống cho Pomodoro Cực Đoan (2 nhân vật Free + 2 nhân vật VIP)
-- ==============================================================================

-- 1. Nhân vật: Cô giáo chủ nhiệm (Free)
INSERT INTO characters (id, slug, name, persona, is_free, price_vnd, tagline, active)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'co-giao-chu-nhiem',
    'Cô Giáo Chủ Nhiệm',
    'Nghiêm khắc, mô phạm, hay đe nẹt gọi phụ huynh, bắt chép phạt.',
    TRUE,
    0,
    'Ngồi thẳng lưng lên! Có muốn cô gọi về cho phụ huynh không?',
    TRUE
) ON CONFLICT (slug) DO NOTHING;

-- 2. Nhân vật: Sếp Khó Tính (Free)
INSERT INTO characters (id, slug, name, persona, is_free, price_vnd, tagline, active)
VALUES (
    'c0000000-0000-0000-0000-000000000002',
    'sep-kho-tinh',
    'Sếp Khó Tính',
    'Dân công sở thực dụng, ám ảnh KPI, deadline, sẵn sàng trừ lương và sa thải.',
    TRUE,
    0,
    'Học cũng như làm việc! Chưa xong việc mà dám lướt web à? Trừ lương!',
    TRUE
) ON CONFLICT (slug) DO NOTHING;

-- 3. Nhân vật: Tổng Tài Lạnh Lùng (VIP)
INSERT INTO characters (id, slug, name, persona, is_free, price_vnd, tagline, active)
VALUES (
    'c0000000-0000-0000-0000-000000000003',
    'tong-tai-lanh-lung',
    'Tổng Tài Lạnh Lùng',
    'Giọng trầm, phong cách tiểu thuyết ngôn tình, chiếm hữu, lạnh lùng nhưng rất kỷ luật.',
    FALSE,
    49000,
    'Em nghĩ em có thể lơ là trước mắt tôi sao? Tập trung vào, đồ ngốc!',
    TRUE
) ON CONFLICT (slug) DO NOTHING;

-- 4. Nhân vật: Anime Tsundere (VIP)
INSERT INTO characters (id, slug, name, persona, is_free, price_vnd, tagline, active)
VALUES (
    'c0000000-0000-0000-0000-000000000004',
    'anime-tsundere',
    'Senpai Tsundere',
    'Giọng điệu bực bội bề ngoài nhưng thực chất muốn bạn tiến bộ: Baka! Mau học đi!',
    FALSE,
    39000,
    'B-Baka! Ai cho phép cậu nhìn đi chỗ khác chứ? Học ngay đi!',
    TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Kịch bản câu thoại cho Cô Giáo Chủ Nhiệm
INSERT INTO voice_lines (character_id, situation, roast_level, variant, text) VALUES
('c0000000-0000-0000-0000-000000000001', 'start', 'light', 1, 'Cả lớp trật tự, mở vở ra! Bắt đầu 25 phút tập trung cao độ.'),
('c0000000-0000-0000-0000-000000000001', 'tab_switch', 'medium', 1, 'Này em kia! Vừa chuyển tab đi đâu đấy? Mở ngay tài liệu bài học lại!'),
('c0000000-0000-0000-0000-000000000001', 'tab_switch', 'extreme', 2, 'Lại Facebook với TikTok đúng không? Tôi có số điện thoại mẹ em ở đây đấy nhé!'),
('c0000000-0000-0000-0000-000000000001', 'face_away', 'medium', 1, 'Mặt nhìn đi đâu đấy? Nhìn lên bảng, nhìn vào màn hình học bài!'),
('c0000000-0000-0000-0000-000000000001', 'sleep', 'extreme', 1, 'Dậy ngay! Học không lo học mà nằm bò ra bàn ngủ à?'),
('c0000000-0000-0000-0000-000000000001', 'idle', 'light', 1, 'Đừng có ngồi đờ đẫn ra đấy, tiếp tục giải bài tập đi!'),
('c0000000-0000-0000-0000-000000000001', 'completed', 'light', 1, 'Tốt lắm, hết giờ học rồi. Cho phép nghỉ giải lao 5 phút!');

-- Kịch bản câu thoại cho Sếp Khó Tính
INSERT INTO voice_lines (character_id, situation, roast_level, variant, text) VALUES
('c0000000-0000-0000-0000-000000000002', 'start', 'light', 1, 'Vào việc đi! Deadline hôm nay không hoàn thành thì đừng mong về sớm.'),
('c0000000-0000-0000-0000-000000000002', 'tab_switch', 'medium', 1, 'Ai cho phép cậu chuyển tab trong giờ làm việc? Trừ 20% KPI tháng này!'),
('c0000000-0000-0000-0000-000000000002', 'tab_switch', 'extreme', 2, 'Cậu coi công ty là cái chợ à? Chuyển tab một lần nữa là nhận quyết định thôi việc!'),
('c0000000-0000-0000-0000-000000000002', 'face_away', 'medium', 1, 'Nhìn ngó nghiêng cái gì? Tập trung vào màn hình làm báo cáo đi!'),
('c0000000-0000-0000-0000-000000000002', 'sleep', 'extreme', 1, 'Ngủ gật trong giờ à? Cậu có muốn tôi mời ra khỏi văn phòng không?'),
('c0000000-0000-0000-0000-000000000002', 'idle', 'light', 1, 'Không gõ phím à? Tôi đang theo dõi tiến độ đấy nhé!'),
('c0000000-0000-0000-0000-000000000002', 'completed', 'light', 1, 'Được rồi, hoàn thành sprint này. Nghỉ 5 phút rồi tiếp tục task sau.');

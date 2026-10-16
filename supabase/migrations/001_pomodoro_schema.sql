-- ==============================================================================
-- Schema Supabase Postgres cho Pomodoro Cực Đoan (Strict Pomodoro)
-- ==============================================================================

-- 1. Kích hoạt extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Bảng Characters (Nhân vật giám sát)
CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    persona TEXT NOT NULL,
    is_free BOOLEAN DEFAULT FALSE,
    price_vnd INTEGER DEFAULT 0,
    avatar_url VARCHAR(500),
    preview_url VARCHAR(500),
    tagline VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bảng Voice Packs (Gói giọng nói)
CREATE TABLE IF NOT EXISTS voice_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_vnd INTEGER DEFAULT 0,
    sample_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bảng Voice Lines (Thư viện kịch bản câu thoại)
CREATE TABLE IF NOT EXISTS voice_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    situation VARCHAR(50) NOT NULL, -- 'start', 'tab_switch', 'idle', 'face_away', 'sleep', 'completed', 'give_up'
    roast_level VARCHAR(20) NOT NULL, -- 'light', 'medium', 'extreme'
    variant INTEGER DEFAULT 1,
    audio_url VARCHAR(500),
    text TEXT NOT NULL,
    duration_ms INTEGER DEFAULT 3000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bảng Entitlements (Quyền sở hữu nhân vật / gói giọng của người dùng)
CREATE TABLE IF NOT EXISTS entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    voice_pack_id UUID REFERENCES voice_packs(id) ON DELETE CASCADE,
    source VARCHAR(50) DEFAULT 'purchase', -- 'purchase', 'promo', 'free_tier'
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Bảng Orders (Đơn hàng & Giao dịch thanh toán PayOS / VietQR)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'character', 'voice_pack', 'pro_plan'
    item_id UUID NOT NULL,
    amount_vnd INTEGER NOT NULL,
    provider VARCHAR(50) DEFAULT 'payos',
    provider_ref VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled', 'refunded'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- 7. Bảng Study Sessions (Phiên học Pomodoro Cực Đoan)
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    focus_minutes INTEGER NOT NULL,
    planned_minutes INTEGER NOT NULL,
    roast_level VARCHAR(20) DEFAULT 'medium',
    discipline_score INTEGER DEFAULT 100,
    shame_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'completed', -- 'completed', 'abandoned'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Bảng Distraction Events (Nhật ký các lần xao nhãng trong phiên học)
CREATE TABLE IF NOT EXISTS distraction_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'tab_hidden', 'window_blur', 'idle', 'no_face', 'sleep_detected'
    roast_level VARCHAR(20) NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_ms INTEGER DEFAULT 0
);

-- 9. Bảng Daily Stats (Tổng kết kỷ luật hàng ngày)
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    focus_minutes INTEGER DEFAULT 0,
    sessions_count INTEGER DEFAULT 0,
    shame_count INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 1,
    discipline_avg INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- ==============================================================================
-- Bật Row Level Security (RLS) bảo mật theo user
-- ==============================================================================
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distraction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Policy đọc công khai cho characters và voice_packs
CREATE POLICY "Public read characters" ON characters FOR SELECT USING (active = TRUE);
CREATE POLICY "Public read voice_packs" ON voice_packs FOR SELECT USING (TRUE);
CREATE POLICY "Public read voice_lines" ON voice_lines FOR SELECT USING (TRUE);

-- Policy user-owned
CREATE POLICY "User read entitlements" ON entitlements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User read orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User read sessions" ON study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User insert sessions" ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User update sessions" ON study_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User read events" ON distraction_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM study_sessions WHERE study_sessions.id = distraction_events.session_id AND study_sessions.user_id = auth.uid())
);
CREATE POLICY "User insert events" ON distraction_events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM study_sessions WHERE study_sessions.id = distraction_events.session_id AND study_sessions.user_id = auth.uid())
);

CREATE POLICY "User read daily_stats" ON daily_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User update daily_stats" ON daily_stats FOR ALL USING (auth.uid() = user_id);

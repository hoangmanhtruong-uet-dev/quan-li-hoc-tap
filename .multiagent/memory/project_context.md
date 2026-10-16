# TarotCouple — Multi-Agent Memory & Project Context

## 1. Design Read (per `design-taste-frontend` skill)
- **Design Read:** *"Reading this as: Mobile-first Spiritual Infotainment Web App (PWA) for Vietnamese Gen Z (10–27yo, peak hours 22:00–02:00), with an Editorial Mystic-Noir & Warm Gold language (avoiding generic AI-purple slop), leaning toward Tailwind v4 utilities + Cormorant Garamond / Be Vietnam Pro typography + tactile 3D card physics via Framer Motion."*
- **Three Dials:**
  - `DESIGN_VARIANCE: 8` (Asymmetric ritual layouts, tactile card fan, editorial story card)
  - `MOTION_INTENSITY: 7` (60fps shuffle physics, 3s haptic energy charge, 3D card flip reveal)
  - `VISUAL_DENSITY: 4` (Focused mobile ritual stages, generous breathing room)

## 2. Locked Product Decisions (from PLAN.md v2)
- **Deck Scope (Phase 0 & 1):** 22 Major Arcana (`0 - The Fool` to `21 - The World`), Rider-Waite-Smith 1909 Public Domain art with ornamental gold SVG frames, bilingual names (`name_en`, `name_vi`), `keywords_up`, `keywords_rev`.
- **Readers (Phase 0 & 1):**
  1. `ba_co_mo_hon` ("Bà Cố Mỏ Hỗn" — sharp, witty, Gen Z slang, calls out delusions; automatically switches to "Bà Ngoại Vui Tính" when user age is 10–15).
  2. `tien_tu_chua_lanh` ("Tiên Tử Chữa Lành" — empathetic, warm, comforting, gentle self-care guidance).
- **Age Policy (`10+`):**
  - Collect `birth_year` in onboarding/question step.
  - **10–15yo (Kid/Teen Safe Mode):** Topics switched to *Tình bạn & Crush học đường*, *Học tập / Thi cử*, *Năng lượng ngày mới*. Payments disabled 100%. Tone softened to wholesome/encouraging.
  - **16–17yo:** All entertainment topics enabled, payments disabled.
  - **18+:** Full topics, full savage tone, PayOS ready (Phase 2).
- **Safety & Crisis Intervention:**
  - Pre-AI server keyword scanner + AI `safety_flag` (`none` | `sensitive` | `crisis`).
  - If `crisis` is triggered: bypass tarot reading, show supportive intervention screen with hotlines (**111**, **115**, **Đường dây nóng Ngày Mai 096 306 1414**), hide share/upsell.
- **Server-Side Card Selection & AI Validation:**
  - Server shuffles 22 Major Arcana using CSPRNG (`crypto.getRandomValues`) with Fisher-Yates and 30% reversed probability.
  - Client selects 3 indices `(i, j, k)` from the fan -> Server maps to drawn cards -> Calls `TarotAIProvider` (Gemini API with `responseSchema` + deterministic rich fallback when API key is not configured or quota reached) -> Validates output via **Zod** with up to 2 retries -> Returns structured JSON including 3 `savage_quotes` options.
- **Server-Side 9:16 Story Card (`1080x1920`):**
  - Rendered via Next.js `ImageResponse` (`next/og` / Satori) at `/api/story-card` so it renders identically on iOS Safari, Android, and desktop.
  - Privacy toggle (`hide_question`) enabled by default.
  - Quote switcher cycles through the 3 generated `savage_quotes` at zero extra AI cost.

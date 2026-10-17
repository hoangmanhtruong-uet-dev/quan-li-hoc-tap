/**
 * Campus LAB VIP & 4-Tier Monetization Matrix Engine
 * Pinned to Napas 247 standard banking specifications.
 */

export type LabTier = 'free' | 'plus' | 'pro' | 'ultra';

export interface TierLimits {
  aiRequestsPerDay: number;
  tokensPerMonth: number;
  paperVaultLimit: number;
  hasMultiAiPipeline: boolean;
  hasUltraDefense: boolean;
  hasMcpHub: boolean;
}

export interface TierConfig {
  id: LabTier;
  name: string;
  badgeTitle: 'Free' | 'VIP Neo' | 'Pro Researcher' | 'Ultra Scholar';
  priceVnd: number;
  priceUsd: number;
  description: string;
  tagline: string;
  popular?: boolean;
  features: string[];
  limits: TierLimits;
}

export const VIETQR_BANK_CONFIG = {
  bin: '970422', // MBBank Napas 247 BIN
  bankName: 'MBBank (Ngân hàng TMCP Quân Đội)',
  bankShortName: 'MBBank',
  bankAccount: '0338866999',
  accountName: 'CAMPUSOS LAB RESEARCH',
  template: 'compact2' as const,
};

export const TIER_RANKS: Record<LabTier, number> = {
  free: 0,
  plus: 1,
  pro: 2,
  ultra: 3,
};

export const TIER_CONFIGS: Record<LabTier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free Tier',
    badgeTitle: 'Free',
    priceVnd: 0,
    priceUsd: 0,
    description: 'Trải nghiệm các tính năng học tập và quản lý thời khóa biểu cốt lõi của CampusOS.',
    tagline: 'Khởi đầu thông minh cho sinh viên',
    features: [
      'Quản lý TKB, Deadlines & Nhiệm vụ Kanban',
      'Giám thị Mèo Mập Pomodoro & Chill Lo-fi',
      'Tra cứu tối đa 5 tài liệu trong Paper Vault',
      '5 lượt hỏi AI Study Coach mỗi ngày',
      'Đồng bộ đám mây Supabase cá nhân',
    ],
    limits: {
      aiRequestsPerDay: 5,
      tokensPerMonth: 50_000,
      paperVaultLimit: 5,
      hasMultiAiPipeline: false,
      hasUltraDefense: false,
      hasMcpHub: false,
    },
  },
  plus: {
    id: 'plus',
    name: 'VIP Neo',
    badgeTitle: 'VIP Neo',
    priceVnd: 50_000,
    priceUsd: 2,
    description: 'Gói tăng tốc bứt phá điểm số với quyền truy cập không gian nghiên cứu Campus LAB.',
    tagline: 'Vũ khí bứt phá học kỳ',
    features: [
      'Mở khóa toàn bộ Campus LAB Research Workspace cơ bản',
      'Paper Vault lưu trữ tới 50 bài báo & trích dẫn BibTeX',
      '50 lượt phân tích tài liệu & hỏi đáp AI mỗi ngày',
      'Tích hợp MCP Client Hub cơ bản (arXiv search, BibTeX)',
      'Huy hiệu VIP Neo hiệu ứng Neon Cyan độc quyền',
    ],
    limits: {
      aiRequestsPerDay: 50,
      tokensPerMonth: 500_000,
      paperVaultLimit: 50,
      hasMultiAiPipeline: false,
      hasUltraDefense: false,
      hasMcpHub: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro Researcher',
    badgeTitle: 'Pro Researcher',
    priceVnd: 175_000,
    priceUsd: 7,
    popular: true,
    description: 'Nghiên cứu chuyên sâu với Multi-AI Pipeline (Perplexity + Gemini + Claude).',
    tagline: 'Sự lựa chọn tốt nhất cho NCKH & Đồ án',
    features: [
      'Multi-AI Pipeline 3 giai đoạn: Perplexity Web -> Gemini PDF -> Claude Essay',
      'Paper Vault lưu trữ 250 bài báo & trích dẫn APA, IEEE, MLA',
      '200 lượt phân tích AI chuyên sâu mỗi ngày',
      'MCP Hub kết nối custom SSE servers không giới hạn',
      'BYOK (Bring Your Own Key) cho Gemini, Anthropic, Perplexity',
      'Huy hiệu Pro Researcher hiệu ứng Aurora Shimmer',
    ],
    limits: {
      aiRequestsPerDay: 200,
      tokensPerMonth: 2_500_000,
      paperVaultLimit: 250,
      hasMultiAiPipeline: true,
      hasUltraDefense: false,
      hasMcpHub: true,
    },
  },
  ultra: {
    id: 'ultra',
    name: 'Ultra Scholar',
    badgeTitle: 'Ultra Scholar',
    priceVnd: 500_000,
    priceUsd: 20,
    description: 'Vũ khí tốt nghiệp tối thượng ($20 VIP Tier) — Bảo vệ khóa luận & luận văn xuất sắc.',
    tagline: 'Vũ khí bảo vệ khóa luận điểm 10',
    features: [
      'Exclusive Ultra Defense Suite: Hội đồng phản biện AI 3 giáo sư ảo (10 câu hỏi & đáp án 10/10)',
      '1-Click PPTX Slide Generator: Tạo slide bảo vệ khóa luận 12-15 trang chuẩn học thuật',
      'Turnitin-Safe Pre-checker: Quét trùng lặp & Paraphraser đưa tỷ lệ tương đồng <10%',
      'Multi-AI Pipeline & Paper Vault không giới hạn (1.000+ tài liệu)',
      '1.000 lượt AI requests/ngày & 10.000.000 tokens/tháng',
      'Huy hiệu Ultra Scholar hiệu ứng Hologram mạ vàng độc quyền',
    ],
    limits: {
      aiRequestsPerDay: 1_000,
      tokensPerMonth: 10_000_000,
      paperVaultLimit: 1_000,
      hasMultiAiPipeline: true,
      hasUltraDefense: true,
      hasMcpHub: true,
    },
  },
};

export function formatTransferSyntax(userId: string): string {
  const sanitized = (userId || 'STUDENT')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 16);
  return `CAMPUSLAB ${sanitized || 'STUDENT'}`;
}

export function generateVietQrUrl(params: {
  amount: number;
  userId: string;
  tier: LabTier;
  template?: 'compact2' | 'compact' | 'qr_only' | 'print';
}): {
  qrUrl: string;
  syntax: string;
  bankAccount: string;
  bankName: string;
  bankShortName: string;
  accountName: string;
  bin: string;
  amount: number;
} {
  const template = params.template || VIETQR_BANK_CONFIG.template;
  const syntax = formatTransferSyntax(params.userId);
  const encodedSyntax = encodeURIComponent(syntax);
  const encodedName = encodeURIComponent(VIETQR_BANK_CONFIG.accountName);

  const qrUrl = `https://img.vietqr.io/image/${VIETQR_BANK_CONFIG.bin}-${VIETQR_BANK_CONFIG.bankAccount}-${template}.png?amount=${params.amount}&addInfo=${encodedSyntax}&accountName=${encodedName}`;

  return {
    qrUrl,
    syntax,
    bankAccount: VIETQR_BANK_CONFIG.bankAccount,
    bankName: VIETQR_BANK_CONFIG.bankName,
    bankShortName: VIETQR_BANK_CONFIG.bankShortName,
    accountName: VIETQR_BANK_CONFIG.accountName,
    bin: VIETQR_BANK_CONFIG.bin,
    amount: params.amount,
  };
}

export function getTierConfig(tier: LabTier = 'free'): TierConfig {
  return TIER_CONFIGS[tier] || TIER_CONFIGS.free;
}

export function isTierSufficient(currentTier: LabTier = 'free', requiredTier: LabTier): boolean {
  return (TIER_RANKS[currentTier] ?? 0) >= (TIER_RANKS[requiredTier] ?? 0);
}

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(amount)
    .replace('₫', 'đ');
}

export function formatUsd(amount: number): string {
  return `$${amount}`;
}

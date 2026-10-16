/**
 * CampusOS Living & Community Engine
 * Dorm & Roommate management, Vietnamese EVN electric/water tier calculation,
 * and Greedy Min-Cash-Flow debt settlement minimization algorithm.
 */

export interface RoommateMember {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  phone: string;
  role: 'lead' | 'member';
  netBalance: number; // Positive = being owed, Negative = owes money
  penaltyPoints: number; // Cleanliness / chore infraction points
}

export type UtilityType = 'electric' | 'water' | 'internet' | 'rent' | 'trash' | 'food';

export interface UtilityBill {
  id: string;
  type: UtilityType;
  title: string;
  month: string;
  amount: number;
  paidById: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  usageIndex?: {
    start: number;
    end: number;
    unit: 'kWh' | 'm³';
  };
}

export interface ChoreTask {
  id: string;
  title: string;
  assigneeId: string;
  dayOfWeek: string; // 'Thứ Hai', 'Thứ Ba', ...
  status: 'pending' | 'completed' | 'missed';
  penaltyAmount: number; // VND fined to room common fund if missed
}

export interface DebtTransfer {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
}

export interface LivingSpaceItem {
  id: string;
  name: string;
  type: 'dorm' | 'apartment' | 'house';
  roomNumber: string;
  address: string;
  members: RoommateMember[];
  bills: UtilityBill[];
  chores: ChoreTask[];
  commonFundBalance: number;
}

// ==========================================
// 1. VIETNAMESE ELECTRICITY TIER PRICING (EVN)
// ==========================================

export const EVN_TIERS = [
  { maxKwh: 50, pricePerKwh: 1806 },
  { maxKwh: 100, pricePerKwh: 1866 },
  { maxKwh: 200, pricePerKwh: 2167 },
  { maxKwh: 300, pricePerKwh: 2729 },
  { maxKwh: 400, pricePerKwh: 3050 },
  { maxKwh: Infinity, pricePerKwh: 3151 },
];

/**
 * Calculates total electricity cost according to EVN progressive tiers + 8% VAT
 */
export function calculateEvnElectricityCost(kwhUsed: number): {
  subtotal: number;
  vat: number;
  totalAmount: number;
  breakdown: Array<{ tierIndex: number; kwhInTier: number; price: number; amount: number }>;
} {
  let remainingKwh = Math.max(0, kwhUsed);
  let previousMax = 0;
  let subtotal = 0;
  const breakdown = [];

  for (let i = 0; i < EVN_TIERS.length; i++) {
    const tier = EVN_TIERS[i]!;
    const tierCapacity = tier.maxKwh - previousMax;
    const kwhInTier = Math.min(remainingKwh, tierCapacity);

    if (kwhInTier > 0) {
      const amount = kwhInTier * tier.pricePerKwh;
      subtotal += amount;
      breakdown.push({
        tierIndex: i + 1,
        kwhInTier,
        price: tier.pricePerKwh,
        amount,
      });
      remainingKwh -= kwhInTier;
    }

    previousMax = tier.maxKwh;
    if (remainingKwh <= 0) break;
  }

  const vat = Math.round(subtotal * 0.08); // 8% VAT
  const totalAmount = subtotal + vat;

  return {
    subtotal,
    vat,
    totalAmount,
    breakdown,
  };
}

// ==========================================
// 2. MIN-CASH-FLOW DEBT SETTLEMENT ALGORITHM
// ==========================================

/**
 * Given a list of members with current net balances (computed from who paid what),
 * calculates the MINIMUM number of money transfers to settle all roommate debts.
 * Complexity: O(N log N) via Greedy matching.
 */
export function settleDebtsMinimally(members: RoommateMember[]): DebtTransfer[] {
  // Map of member id -> name
  const nameMap = new Map<string, string>();
  members.forEach((m) => nameMap.set(m.id, m.name));

  // Separate into debtors (< 0) and creditors (> 0)
  const debtors: Array<{ id: string; amount: number }> = [];
  const creditors: Array<{ id: string; amount: number }> = [];

  members.forEach((m) => {
    const rounded = Math.round(m.netBalance);
    if (rounded < -10) {
      debtors.push({ id: m.id, amount: -rounded }); // positive debt
    } else if (rounded > 10) {
      creditors.push({ id: m.id, amount: rounded });
    }
  });

  const transfers: DebtTransfer[] = [];

  // Greedy match
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx]!;
    const creditor = creditors[cIdx]!;

    const settledAmount = Math.min(debtor.amount, creditor.amount);

    if (settledAmount > 0) {
      transfers.push({
        fromMemberId: debtor.id,
        fromName: nameMap.get(debtor.id) || debtor.id,
        toMemberId: creditor.id,
        toName: nameMap.get(creditor.id) || creditor.id,
        amount: settledAmount,
      });

      debtor.amount -= settledAmount;
      creditor.amount -= settledAmount;
    }

    if (debtor.amount <= 10) dIdx++;
    if (creditor.amount <= 10) cIdx++;
  }

  return transfers;
}

// ==========================================
// 3. SEEDED REALISTIC VIETNAMESE STUDENT LIVING SPACE
// ==========================================

export const SEED_LIVING_SPACE: LivingSpaceItem = {
  id: 'ktx-b4-402',
  name: 'Phòng 402 · KTX Khu B Đại học Quốc gia',
  type: 'dorm',
  roomNumber: 'B4-402',
  address: 'Khu B ĐHQG-HCM, TP. Dĩ An, Bình Dương',
  commonFundBalance: 420000,
  members: [
    {
      id: 'm1',
      name: 'Minh Tuấn (Trưởng phòng)',
      nickname: 'Tuấn Ca',
      avatar: '👨‍💻',
      phone: '0912 345 678',
      role: 'lead',
      netBalance: 320000, // Đang ứng trước tiền điện
      penaltyPoints: 0,
    },
    {
      id: 'm2',
      name: 'Hoàng Long',
      nickname: 'Long Tạ',
      avatar: '🎸',
      phone: '0988 765 432',
      role: 'member',
      netBalance: -150000,
      penaltyPoints: 1,
    },
    {
      id: 'm3',
      name: 'Bảo Khánh',
      nickname: 'Khánh Pro',
      avatar: '🎮',
      phone: '0977 123 456',
      role: 'member',
      netBalance: -170000,
      penaltyPoints: 0,
    },
    {
      id: 'm4',
      name: 'Đức Huy',
      nickname: 'Huy Mập',
      avatar: '🍳',
      phone: '0903 888 999',
      role: 'member',
      netBalance: 0,
      penaltyPoints: 2,
    },
  ],
  bills: [
    {
      id: 'b1',
      type: 'electric',
      title: 'Tiền điện sinh hoạt tháng 10/2026',
      month: '10/2026',
      amount: 485000,
      paidById: 'm1',
      dueDate: '20/10/2026',
      status: 'pending',
      usageIndex: { start: 2450, end: 2680, unit: 'kWh' }, // 230 kWh
    },
    {
      id: 'b2',
      type: 'water',
      title: 'Tiền nước sinh hoạt tháng 10/2026',
      month: '10/2026',
      amount: 140000,
      paidById: 'm1',
      dueDate: '20/10/2026',
      status: 'paid',
      usageIndex: { start: 110, end: 122, unit: 'm³' },
    },
    {
      id: 'b3',
      type: 'internet',
      title: 'Cáp quang FPT Giga 150Mbps',
      month: '10/2026',
      amount: 220000,
      paidById: 'm2',
      dueDate: '15/10/2026',
      status: 'paid',
    },
  ],
  chores: [
    {
      id: 'ch1',
      title: 'Quét dọn & Lau sàn phòng sinh hoạt',
      assigneeId: 'm2',
      dayOfWeek: 'Thứ Hai',
      status: 'completed',
      penaltyAmount: 30000,
    },
    {
      id: 'ch2',
      title: 'Cọ rửa nhà vệ sinh & gương phòng tắm',
      assigneeId: 'm3',
      dayOfWeek: 'Thứ Ba',
      status: 'pending',
      penaltyAmount: 50000,
    },
    {
      id: 'ch3',
      title: 'Đổ rác & thay túi rác hành lang',
      assigneeId: 'm4',
      dayOfWeek: 'Thứ Tư',
      status: 'pending',
      penaltyAmount: 20000,
    },
    {
      id: 'ch4',
      title: 'Lau tủ lạnh & dọn bồn rửa bát',
      assigneeId: 'm1',
      dayOfWeek: 'Thứ Sáu',
      status: 'pending',
      penaltyAmount: 30000,
    },
  ],
};

/**
 * CampusOS AI Study Coach Engine
 * Provides rich deterministic student knowledge base, interactive quiz generator,
 * context injection from campus-store, and dynamic study plan builder with calendar sync.
 */

import type { CampusOSSharedState } from './campus-store.ts';

function formatIsoDateOnly(date: Date, offsetDays = 0): string {
  const d = new Date(date);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type CoachSubject =
  | 'Mạng máy tính'
  | 'CTDL & Giải thuật'
  | 'Triết học Mác - Lênin'
  | 'Xác suất Thống kê'
  | 'Toán rời rạc'
  | 'Lập trình Web'
  | 'Tất cả môn học';

export interface QuizQuestion {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctIndex: number; // 0..3
  explanation: string;
  xpReward: number;
}

export interface StudyPlanBlock {
  id: string;
  time: string;
  start: string; // HH:mm
  end: string;   // HH:mm
  title: string;
  detail: string;
  subject: string;
  durationMin: number;
  color: string;
}

export interface SuggestedStudyPlan {
  id: string;
  title: string;
  totalMinutes: number;
  date: string; // YYYY-MM-DD
  blocks: StudyPlanBlock[];
}

export interface StudentContext {
  name: string;
  level: number;
  rankTitle: string;
  xp: number;
  streak: number;
  deadlinesCount: number;
  urgentDeadlines: Array<{ title: string; course?: string; due?: string }>;
  incompleteTasks: Array<{ title: string; course?: string; priority: string }>;
  energy: 'low' | 'okay' | 'great';
  dailyMood: string | null;
}

// ==========================================
// 1. KNOWLEDGE BASE PER ACADEMIC DOMAIN
// ==========================================

export const SUBJECT_KNOWLEDGE_BASE: Record<string, { summary: string; tips: string[]; deepDive: Record<string, string> }> = {
  'Mạng máy tính': {
    summary: 'Mạng máy tính nghiên cứu kiến trúc đa tầng (OSI & TCP/IP), giao thức truyền tin, định tuyến, và phân tầng mạng IP/Subnetting.',
    tips: [
      'Công thức số host khả dụng cho prefix /n: 2^(32 - n) - 2 (trừ network IP và broadcast IP).',
      'Bước nhảy (block size) của một octet = 256 - giá trị subnet mask octet đó.',
      'TCP là connection-oriented, đảm bảo 3-way handshake (SYN, SYN-ACK, ACK), còn UDP là connectionless phục vụ streaming / realtime.',
      'Private IP ranges chuẩn RFC 1918: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.',
    ],
    deepDive: {
      subnet: `### 🌐 Bản chất của Subnetting (Chia mạng con)
Subnetting giống như việc chia một khu chung cư lớn thành nhiều block nhà riêng biệt:
- **IP Address:** Địa chỉ định danh phòng và nhà.
- **Network Bits:** Tên tòa nhà / phân khu.
- **Host Bits:** Số phòng cụ thể trong tòa.
- **Subnet Mask:** Ranh giới phân định bit nào thuộc về mạng, bit nào thuộc về máy con.

**Ví dụ thực tế với \`192.168.1.0/26\`:**
1. Số bit host mượn: 26 - 24 = 2 bits. Số subnet tạo ra: $2^2 = 4$ subnets.
2. Số bit host còn lại: 32 - 26 = 6 bits.
3. Số IP mỗi subnet: $2^6 = 64$. Số IP khả dụng: $64 - 2 = 62$ IP cho máy tính.
4. Bước nhảy (Step): 64.
   - Subnet 1: \`192.168.1.0/26\` (Khả dụng: \`.1\` -> \`.62\`, Broadcast: \`.63\`)
   - Subnet 2: \`192.168.1.64/26\` (Khả dụng: \`.65\` -> \`.126\`, Broadcast: \`.127\`)
   - Subnet 3: \`192.168.1.128/26\` (Khả dụng: \`.129\` -> \`.190\`, Broadcast: \`.191\`)
   - Subnet 4: \`192.168.1.192/26\` (Khả dụng: \`.193\` -> \`.254\`, Broadcast: \`.255\`)`,
      osi: `### 🗼 Mô hình OSI 7 Tầng vs TCP/IP 4 Tầng
Mẹo nhớ 7 tầng OSI từ dưới lên: **"Please Do Not Throw Sausage Pizza Away"**
1. **Physical (Vật lý):** Bits, cáp đồng, cáp quang, sóng wifi.
2. **Data Link (Liên kết dữ liệu):** Frames, địa chỉ MAC, Switch.
3. **Network (Mạng):** Packets, địa chỉ IP, Router.
4. **Transport (Giao vận):** Segments, TCP/UDP, Port numbers.
5. **Session (Phiên):** Thiết lập, duy trì, ngắt kết nối phiên làm việc.
6. **Presentation (Trình bày):** Mã hóa, nén dữ liệu (SSL/TLS, JSON, JPEG).
7. **Application (Ứng dụng):** HTTP, DNS, FTP, SMTP.`,
    },
  },
  'CTDL & Giải thuật': {
    summary: 'Cấu trúc dữ liệu và Giải thuật là nền tảng của khoa học máy tính: Cây nhị phân, Cây AVL, Đồ thị, Quy hoạch động, và thuật toán tìm kiếm/sắp xếp.',
    tips: [
      'Cây tìm kiếm nhị phân (BST): Nhánh trái < Gốc < Nhánh phải. Duyệt In-order (L-N-R) cho thứ tự tăng dần.',
      'Cây AVL là cây BST tự cân bằng có hệ số cân bằng (Balance Factor = H_left - H_right) nằm trong {-1, 0, 1}. Xoay đơn (LL, RR) hoặc xoay kép (LR, RL).',
      'Độ phức tạp: Quicksort/Mergesort là O(N log N), Binary Search là O(log N), Traversal trên đồ thị (BFS/DFS) là O(V + E).',
      'Thuật toán Dijkstra dùng hàng đợi ưu tiên (Min-Heap) tìm đường đi ngắn nhất với trọng số không âm trong O((V + E) log V).',
    ],
    deepDive: {
      tree: `### 🌲 Cây Tìm Kiếm Nhị Phân & Cây AVL
**1. Tính chất cây BST:**
Mọi node ở cây con bên trái đều nhỏ hơn node hiện tại, mọi node bên phải đều lớn hơn node hiện tại.
Khi duyệt theo **In-order (L-Root-R)**, bạn sẽ nhận được dãy số được sắp xếp tăng dần!

**2. Hiện tượng suy biến cây BST:**
Nếu thêm dãy số đã tăng dần: \`1, 2, 3, 4, 5\` vào BST thông thường, cây sẽ thoái hóa thành **Danh sách liên kết**, thời gian tìm kiếm từ $O(\\log N)$ sụp đổ xuống $O(N)$.

**3. Giải pháp AVL Tree (Adelson-Velsky and Landis):**
Mỗi node lưu chiều cao. Hệ số cân bằng: $BF = \\text{height}(L) - \\text{height}(R)$.
Nếu $|BF| > 1$, kích hoạt tái cân bằng:
- **Lệch Trái - Trái (LL):** Xoay phải (Right Rotation) 1 lần tại node mất cân bằng.
- **Lệch Phải - Phải (RR):** Xoay trái (Left Rotation) 1 lần.
- **Lệch Trái - Phải (LR):** Xoay trái tại con trái, sau đó xoay phải tại node gốc.
- **Lệch Phải - Trái (RL):** Xoay phải tại con phải, sau đó xoay trái tại node gốc.`,
    },
  },
  'Triết học Mác - Lênin': {
    summary: 'Chủ nghĩa duy vật biện chứng và chủ nghĩa duy vật lịch sử: Các quy luật cơ bản, cặp phạm trù, hình thái kinh tế - xã hội, giá trị thặng dư.',
    tips: [
      'Quy luật mâu thuẫn là hạt nhân của phép biện chứng duy vật: Sự thống nhất và đấu tranh giữa các mặt đối lập là nguồn gốc, động lực của sự vận động và phát triển.',
      'Quy luật lượng - chất: Tích lũy về lượng đến một giới hạn nhất định (độ) sẽ vượt qua điểm nút, dẫn đến bước nhảy làm biến đổi về chất.',
      'Quy luật phủ định của phủ định: Phát triển theo hình xoắn ốc (xoáy ốc), không phải đường thẳng hay vòng tròn khép kín.',
      'Cơ sở hạ tầng quyết định kiến trúc thượng tầng; Kiến trúc thượng tầng tác động trở lại cơ sở hạ tầng.',
    ],
    deepDive: {
      luat: `### ⚖️ 3 Quy Luật Cơ Bản Của Phép Biện Chứng Duy Vật
1. **Quy luật mâu thuẫn (Nguồn gốc, động lực):**
   - Mặt đối lập: Những mặt có khuynh hướng, tính chất trái ngược nhau cùng tồn tại trong một chỉnh thể.
   - Đấu tranh giữa các mặt đối lập là tuyệt đối; Thống nhất giữa các mặt đối lập là tương đối.
2. **Quy luật Lượng - Chất (Cách thức vận động):**
   - **Độ:** Khoảng giới hạn mà sự thay đổi về lượng chưa làm thay đổi căn bản về chất.
   - **Điểm nút:** Thời điểm ranh giới mà lượng tích tụ đủ để chất bắt đầu thay đổi.
   - **Bước nhảy:** Quá trình chuyển hóa chất cũ thành chất mới (Ví dụ: 0°C -> 99°C nước vẫn lỏng, chạm 100°C bốc hơi thành khí).
3. **Quy luật Phủ định của phủ định (Khuynh hướng phát triển):**
   - Kế thừa biện chứng: Giữ lại những hạt nhân tích cực, loại bỏ yếu tố lạc hậu.
   - Xu hướng phát triển theo **đường xoáy trôn ốc**: Dường như quay lại điểm xuất phát nhưng ở trình độ cao hơn.`,
    },
  },
  'Xác suất Thống kê': {
    summary: 'Lý thuyết xác suất, biến ngẫu nhiên, các quy luật phân phối (Nhị thức, Poisson, Chuẩn, Student), và kiểm định giả thuyết thống kê.',
    tips: [
      'Công thức Bayes: P(A|B) = [P(B|A) * P(A)] / P(B). Cực kỳ hữu dụng để cập nhật niềm tin xác suất khi có thêm bằng chứng mới.',
      'Phân phối chuẩn N(mu, sigma^2): 68% dữ liệu nằm trong [mu - sigma, mu + sigma], 95% nằm trong [mu - 2*sigma, mu + 2*sigma], 99.7% nằm trong [mu - 3*sigma, mu + 3*sigma].',
      'Kỳ vọng toán học E(X) là giá trị trung bình theo trọng số xác suất; Phương sai Var(X) = E(X^2) - [E(X)]^2 đo độ phân tán.',
      'Định lý giới hạn trung tâm: Tổng (hoặc trung bình) của nhiều biến ngẫu nhiên độc lập có cùng phân phối sẽ tiệm cận về phân phối chuẩn khi n đủ lớn.',
    ],
    deepDive: {
      bayes: `### 🎲 Công Thức Xác Suất Đầy Đủ & Định Lý Bayes
**Công thức Bayes:**
$$P(A_i|B) = \\frac{P(A_i) \\cdot P(B|A_i)}{\\sum_{j=1}^n P(A_j) \\cdot P(B|A_j)}$$

**Ví dụ bài toán xét nghiệm y tế kinh điển:**
- Tỉ lệ mắc bệnh hiếm trong cộng đồng: $P(\\text{Bệnh}) = 1\\% = 0.01$.
- Độ nhạy xét nghiệm (nếu có bệnh thì test dương tính): $P(+\\mid\\text{Bệnh}) = 99\\%$.
- Dương tính giả (không bệnh nhưng test vẫn báo dương): $P(+\\mid\\text{Khỏe}) = 5\\%$.

Nếu một người đi test và nhận kết quả **dương tính (+)**, xác suất thực sự người đó bị bệnh là bao nhiêu?
- $P(+) = (0.01 \\times 0.99) + (0.99 \\times 0.05) = 0.0099 + 0.0495 = 0.0594$.
- $P(\\text{Bệnh}\\mid+) = \\frac{0.0099}{0.0594} \\approx 16.67\\%$.
-> Dù que test chính xác 99%, xác suất mắc bệnh thực tế chỉ khoảng **16.7%** vì căn bệnh rất hiếm!`,
    },
  },
  'Toán rời rạc': {
    summary: 'Cơ sở logic mệnh đề, lý thuyết tập hợp, quan hệ, phép đếm tổ hợp, đại số Boole và lý thuyết đồ thị (Euler, Hamilton, Cây khung tối thiểu).',
    tips: [
      'Đồ thị Euler: Có chu trình Euler khi và chỉ khi mọi đỉnh đều có bậc chẵn; Có đường đi Euler khi có đúng 0 hoặc 2 đỉnh bậc lẻ.',
      'Định lý Dirac: Nếu đồ thị đơn vô hướng có n >= 3 đỉnh và mỗi đỉnh có deg(v) >= n/2 thì đồ thị có chu trình Hamilton.',
      'Thuật toán Kruskal và Prim: Tìm cây khung nhỏ nhất (MST) trên đồ thị liên thông có trọng số.',
    ],
    deepDive: {},
  },
  'Lập trình Web': {
    summary: 'Kiến trúc Next.js App Router, React Server Components (RSC), Client Components, Zustand/SyncExternalStore, Tailwind CSS, và Web Vitals.',
    tips: [
      'Next.js App Router mặc định mọi component trong app/ là React Server Component (RSC), không bundle JS về client nếu không có "use client".',
      'Tối ưu re-render: Dùng React 18 useSyncExternalStore thay vì gắn useState listener toàn cục để tránh tearing.',
      'CSS Containment: Dùng min-w-0 và minmax(0, 1fr) trên grid item để triệt tiêu lỗi tràn ngang (horizontal overflow).',
    ],
    deepDive: {},
  },
};

// ==========================================
// 2. INTERACTIVE QUIZ BANK
// ==========================================

export const QUIZ_BANK: Record<string, QuizQuestion[]> = {
  'Mạng máy tính': [
    {
      id: 'net-q1',
      subject: 'Mạng máy tính',
      question: 'Với địa chỉ IP 192.168.1.130/26, địa chỉ mạng (Network Address) và địa chỉ Broadcast tương ứng là gì?',
      options: [
        'A. Network: 192.168.1.0 · Broadcast: 192.168.1.127',
        'B. Network: 192.168.1.128 · Broadcast: 192.168.1.191',
        'C. Network: 192.168.1.128 · Broadcast: 192.168.1.255',
        'D. Network: 192.168.1.64 · Broadcast: 192.168.1.127',
      ],
      correctIndex: 1,
      explanation: 'Prefix /26 có bước nhảy là 64 (256 - 192). Các dải mạng: 0-63, 64-127, 128-191. Địa chỉ 130 nằm trong dải 128..191, nên Network ID là .128 và Broadcast là .191.',
      xpReward: 15,
    },
    {
      id: 'net-q2',
      subject: 'Mạng máy tính',
      question: 'Trong mô hình TCP/IP, quá trình bắt tay 3 bước (3-way Handshake) của giao thức TCP sử dụng các cờ (flags) theo thứ tự nào?',
      options: [
        'A. ACK -> SYN -> SYN-ACK',
        'B. SYN -> ACK -> FIN',
        'C. SYN -> SYN-ACK -> ACK',
        'D. SYN -> PSH -> ACK',
      ],
      correctIndex: 2,
      explanation: 'TCP 3-way Handshake bắt đầu bằng Client gửi cờ SYN, Server phản hồi SYN + ACK, và Client gửi lại cờ ACK hoàn tất kết nối.',
      xpReward: 15,
    },
    {
      id: 'net-q3',
      subject: 'Mạng máy tính',
      question: 'Bạn cần cấp phát mạng con cho một phòng thực hành có tối đa 28 máy tính. Prefix CIDR tối ưu nhất (tiết kiệm IP nhất) là gì?',
      options: [
        'A. /26 (Tối đa 62 host)',
        'B. /27 (Tối đa 30 host)',
        'C. /28 (Tối đa 14 host)',
        'D. /25 (Tối đa 126 host)',
      ],
      correctIndex: 1,
      explanation: 'Prefix /27 có 32 - 27 = 5 bit host. Số host khả dụng = 2^5 - 2 = 30 máy. 30 >= 28 nên /27 là tối ưu nhất.',
      xpReward: 15,
    },
  ],
  'CTDL & Giải thuật': [
    {
      id: 'dsa-q1',
      subject: 'CTDL & Giải thuật',
      question: 'Khi duyệt một Cây Tìm Kiếm Nhị Phân (BST) theo thứ tự In-order (Left - Root - Right), kết quả thu được sẽ có tính chất gì?',
      options: [
        'A. Thứ tự giảm dần từ lớn đến bé',
        'B. Thứ tự tăng dần từ bé đến lớn',
        'C. Đưa node gốc lên đầu tiên',
        'D. Ngẫu nhiên tùy theo chiều cao cây',
      ],
      correctIndex: 1,
      explanation: 'Do tính chất BST: con trái luôn nhỏ hơn gốc, gốc nhỏ hơn con phải. Nên duyệt In-order (Trái -> Gốc -> Phải) luôn tạo ra dãy tăng dần hoàn hảo.',
      xpReward: 15,
    },
    {
      id: 'dsa-q2',
      subject: 'CTDL & Giải thuật',
      question: 'Cây AVL bị mất cân bằng dạng Lệch Phải - Trái (RL: Right-Left) tại node X. Thao tác quay cần thực hiện là gì?',
      options: [
        'A. Quay đơn sang trái tại X',
        'B. Quay kép: Quay phải tại con phải của X, sau đó quay trái tại X',
        'C. Quay kép: Quay trái tại con trái của X, sau đó quay phải tại X',
        'D. Quay đơn sang phải tại X',
      ],
      correctIndex: 1,
      explanation: 'Với trường hợp RL, ta phải quay phải (Right Rotation) ở node con bên phải trước để đưa về dạng RR, sau đó quay trái (Left Rotation) ở node gốc X.',
      xpReward: 15,
    },
  ],
  'Triết học Mác - Lênin': [
    {
      id: 'phil-q1',
      subject: 'Triết học Mác - Lênin',
      question: 'Theo phép biện chứng duy vật, quy luật nào được coi là "hạt nhân", vạch ra nguồn gốc và động lực bên trong của sự vận động, phát triển?',
      options: [
        'A. Quy luật Phủ định của phủ định',
        'B. Quy luật Chuyển hóa từ những thay đổi về lượng dẫn đến thay đổi về chất',
        'C. Quy luật Thống nhất và đấu tranh giữa các mặt đối lập (Quy luật mâu thuẫn)',
        'D. Quy luật Tồn tại xã hội quyết định ý thức xã hội',
      ],
      correctIndex: 2,
      explanation: 'Lênin từng khẳng định: Phép biện chứng có thể định nghĩa tóm tắt là học thuyết về sự thống nhất của các mặt đối lập. Quy luật mâu thuẫn chính là hạt nhân của phép biện chứng duy vật.',
      xpReward: 15,
    },
  ],
  'Xác suất Thống kê': [
    {
      id: 'stat-q1',
      subject: 'Xác suất Thống kê',
      question: 'Cho biến ngẫu nhiên X tuân theo phân phối chuẩn N(mu = 50, sigma^2 = 16). Khoảng giá trị chứa xấp xỉ 95% dữ liệu của X là:',
      options: [
        'A. [46, 54]',
        'B. [42, 58]',
        'C. [38, 62]',
        'D. [34, 66]',
      ],
      correctIndex: 1,
      explanation: 'Phương sai sigma^2 = 16 => Độ lệch chuẩn sigma = 4. Theo quy tắc thực nghiệm 2-sigma của phân phối chuẩn, khoảng 95% dữ liệu nằm trong [mu - 2*sigma, mu + 2*sigma] = [50 - 8, 50 + 8] = [42, 58].',
      xpReward: 15,
    },
  ],
};

// ==========================================
// 3. STUDENT CONTEXT EXTRACTION
// ==========================================

export function extractStudentContext(
  state: CampusOSSharedState,
  energy: 'low' | 'okay' | 'great' = 'okay'
): StudentContext {
  const urgentDeadlines = (state.deadlines || [])
    .filter((d) => !d.completed && (d.urgent || (d.date && d.date.includes(formatIsoDateOnly(new Date(), 0)))))
    .slice(0, 3)
    .map((d) => ({
      title: d.title,
      course: d.course,
      due: d.displayDate || d.dueDate || d.date,
    }));

  const incompleteTasks = (state.tasks || [])
    .filter((t) => t.status !== 'done')
    .slice(0, 4)
    .map((t) => ({
      title: t.title,
      course: t.course,
      priority: t.priority,
    }));

  return {
    name: 'Minh',
    level: state.level || 1,
    rankTitle: state.rankTitle || 'Tân sinh viên ngơ ngác',
    xp: state.xp || 0,
    streak: state.streak || 1,
    deadlinesCount: state.deadlines?.filter((d) => !d.completed).length || 0,
    urgentDeadlines,
    incompleteTasks,
    energy,
    dailyMood: state.dailyMood,
  };
}

// ==========================================
// 4. INTERACTIVE QUIZ GENERATOR
// ==========================================

export function generateInteractiveQuiz(subject: string, count = 3): QuizQuestion[] {
  let pool = QUIZ_BANK[subject];
  if (!pool || pool.length === 0) {
    // Fallback: collect across all subjects
    pool = Object.values(QUIZ_BANK).flat();
  }
  return pool.slice(0, count);
}

// ==========================================
// 5. SUGGESTED STUDY PLAN BUILDER
// ==========================================

export function generateSuggestedPlan(
  energy: 'low' | 'okay' | 'great' = 'okay',
  contextSubject = 'Mạng máy tính',
  deadlines: Array<{ title: string; course?: string }> = []
): SuggestedStudyPlan {
  const todayStr = formatIsoDateOnly(new Date(), 0);
  const urgentTitle = deadlines[0]?.title || `Ôn tập ${contextSubject}`;

  if (energy === 'low') {
    return {
      id: `plan-${Date.now()}`,
      title: 'Nhịp hồi phục & Ôn nhẹ nhàng',
      totalMinutes: 60,
      date: todayStr,
      blocks: [
        {
          id: `b-${Date.now()}-1`,
          time: '19:00',
          start: '19:00',
          end: '19:35',
          title: `Đọc lại tóm tắt & Flashcard ${contextSubject}`,
          detail: '35 phút · Nhịp độ vừa phải, ghi chú ý chính',
          subject: contextSubject,
          durationMin: 35,
          color: 'bg-blue-400',
        },
        {
          id: `b-${Date.now()}-2`,
          time: '19:45',
          start: '19:45',
          end: '20:10',
          title: 'Review checklist & Dọn dẹp góc học tập',
          detail: '25 phút · Chuẩn bị cho ngày mai, đi ngủ sớm',
          subject: 'Phục hồi năng lượng',
          durationMin: 25,
          color: 'bg-emerald-400',
        },
      ],
    };
  }

  if (energy === 'great') {
    return {
      id: `plan-${Date.now()}`,
      title: 'Chiến thần tập trung cao độ',
      totalMinutes: 165, // 2h45m
      date: todayStr,
      blocks: [
        {
          id: `b-${Date.now()}-1`,
          time: '17:30',
          start: '17:30',
          end: '18:15',
          title: `Chinh phục ${urgentTitle}`,
          detail: '45 phút · Focus sâu không điện thoại',
          subject: contextSubject,
          durationMin: 45,
          color: 'bg-rose-400',
        },
        {
          id: `b-${Date.now()}-2`,
          time: '19:00',
          start: '19:00',
          end: '20:00',
          title: 'Luyện 5 bài thuật toán Cây AVL & Đồ thị',
          detail: '60 phút · Cấu trúc dữ liệu & Giải thuật',
          subject: 'CTDL & Giải thuật',
          durationMin: 60,
          color: 'bg-violet-400',
        },
        {
          id: `b-${Date.now()}-3`,
          time: '20:30',
          start: '20:30',
          end: '21:30',
          title: 'Review mã nguồn & Hoàn thiện đồ án nhóm',
          detail: '60 phút · Dự án Web & API sync',
          subject: 'Lập trình Web',
          durationMin: 60,
          color: 'bg-amber-400',
        },
      ],
    };
  }

  // Default 'okay'
  return {
    id: `plan-${Date.now()}`,
    title: 'Tối nay · Nhịp Pomodoro cân bằng',
    totalMinutes: 135, // 2h15m
    date: todayStr,
    blocks: [
      {
        id: `b-${Date.now()}-1`,
        time: '17:30',
        start: '17:30',
        end: '18:15',
        title: `Ôn tập công thức ${contextSubject}`,
        detail: '45 phút · Mạng máy tính & Subnetting',
        subject: contextSubject,
        durationMin: 45,
        color: 'bg-blue-400',
      },
      {
        id: `b-${Date.now()}-2`,
        time: '19:00',
        start: '19:00',
        end: '20:00',
        title: 'Luyện 3 bài tập Cây nhị phân',
        detail: '60 phút · CTDL & GT',
        subject: 'CTDL & Giải thuật',
        durationMin: 60,
        color: 'bg-violet-400',
      },
      {
        id: `b-${Date.now()}-3`,
        time: '21:00',
        start: '21:00',
        end: '21:30',
        title: 'Review API & Tóm tắt cùng nhóm',
        detail: '30 phút · Thư thả trước khi nghỉ',
        subject: 'Dự án Web',
        durationMin: 30,
        color: 'bg-emerald-400',
      },
    ],
  };
}

// ==========================================
// 6. RICH LOCAL COACH GENERATOR
// ==========================================

export function generateCoachResponse(
  prompt: string,
  contextSubject: string,
  studentContext: StudentContext,
  attachedFileName?: string
): {
  markdown: string;
  quiz?: QuizQuestion[];
  plan?: SuggestedStudyPlan;
  suggestedAction?: 'focus' | 'calendar' | 'quiz';
} {
  const normalized = prompt.toLowerCase().trim();
  const fileNote = attachedFileName
    ? `\n\n> 📎 Đã ghi nhận tài liệu **${attachedFileName}**. Mình đã trích xuất ngữ cảnh chính để hỗ trợ bạn.`
    : '';

  // 1. Quiz request
  if (normalized.includes('quiz') || normalized.includes('trắc nghiệm') || normalized.includes('kiểm tra')) {
    const quiz = generateInteractiveQuiz(contextSubject, 3);
    const markdown = `Tuyệt vời! Dưới đây là **Mini Quiz 3 câu hỏi nhanh** về **${contextSubject}** để bạn kiểm tra kiến thức ngay.
Mỗi câu đúng sẽ cộng ngay **+15 XP** vào tài khoản của bạn! 🎯

👇 **Hãy chọn đáp án trực tiếp trên thẻ trắc nghiệm bên dưới:**${fileNote}`;
    return { markdown, quiz, suggestedAction: 'quiz' };
  }

  // 2. Study Plan request
  if (
    normalized.includes('kế hoạch') ||
    normalized.includes('tối nay') ||
    normalized.includes('lịch') ||
    normalized.includes('học gì')
  ) {
    const plan = generateSuggestedPlan(studentContext.energy, contextSubject, studentContext.urgentDeadlines);
    const markdown = `Dựa vào mức năng lượng hiện tại (**${
      studentContext.energy === 'great' ? 'Rất sung sức 🔥' : studentContext.energy === 'low' ? 'Hơi mệt mỏi 🍵' : 'Ổn định ⚡'
    }**) và các deadline gần nhất, mình đã thiết kế **Kế hoạch học tập tối ưu** cho bạn:

- ⏱ **Tổng thời gian học:** ${plan.totalMinutes} phút (đã kèm khoảng nghỉ giãn cơ)
- 🎯 **Mục tiêu ưu tiên:** Giải quyết bài tập ${studentContext.urgentDeadlines[0]?.title || contextSubject}
- 📅 **Đồng bộ:** Bạn có thể bấm nút **"Chấp nhận kế hoạch"** bên phải hoặc bên dưới để tự động chèn vào Lịch học và Dashboard!${fileNote}`;
    return { markdown, plan, suggestedAction: 'calendar' };
  }

  // 3. Subnetting / Mạng máy tính
  if (normalized.includes('subnet') || normalized.includes('chia mạng') || (normalized.includes('mạng') && normalized.includes('ip'))) {
    const netKb = SUBJECT_KNOWLEDGE_BASE['Mạng máy tính']!;
    return {
      markdown: `${netKb.deepDive.subnet || ''}\n\n💡 **Mẹo của Coach:** Để nhớ nhanh bước nhảy, hãy lấy $256 - \\text{mask octet}$. Ví dụ mask $.192 \\Rightarrow 256 - 192 = 64$. Bạn muốn mình tạo quiz 3 câu về Subnetting để thử sức luôn không?${fileNote}`,
      suggestedAction: 'quiz',
    };
  }

  // 4. CTDL & Cây nhị phân / AVL / Dijkstra
  if (normalized.includes('cây') || normalized.includes('bst') || normalized.includes('avl') || normalized.includes('dijkstra') || normalized.includes('ctdl')) {
    const dsaKb = SUBJECT_KNOWLEDGE_BASE['CTDL & Giải thuật']!;
    return {
      markdown: `${dsaKb.deepDive.tree || ''}\n\n💡 **Lời khuyên thực chiến:** Khi đi thi hoặc phỏng vấn, nếu đề yêu cầu tự cân bằng, hãy luôn nhớ kiểm tra chiều cao con trái và con phải. Bấm "Focus cùng Coach" để dành 45 phút code cài đặt cây AVL nhé!${fileNote}`,
      suggestedAction: 'focus',
    };
  }

  // 5. Triết học Mác - Lênin
  if (normalized.includes('triết') || normalized.includes('mâu thuẫn') || normalized.includes('lượng chất') || normalized.includes('phủ định')) {
    const philKb = SUBJECT_KNOWLEDGE_BASE['Triết học Mác - Lênin']!;
    return {
      markdown: `${philKb.deepDive.luat || ''}\n\n💡 **Gợi ý ôn thi:** Đề thi Triết học luôn yêu cầu liên hệ thực tiễn sinh viên. Khi nói về "quy luật Lượng - Chất", hãy lấy ví dụ: Mỗi ngày học 45 phút (tích lũy lượng) thì đến ngày thi sẽ tự tin qua môn (biến đổi về chất)!${fileNote}`,
      suggestedAction: 'focus',
    };
  }

  // 6. Xác suất thống kê
  if (normalized.includes('xác suất') || normalized.includes('thống kê') || normalized.includes('bayes') || normalized.includes('chuẩn')) {
    const statKb = SUBJECT_KNOWLEDGE_BASE['Xác suất Thống kê']!;
    return {
      markdown: `${statKb.deepDive.bayes || ''}\n\n💡 **Ghi nhớ:** Công thức Bayes luôn trả lời câu hỏi: *"Biết rằng sự kiện B đã xảy ra, xác suất nguyên nhân là A_i bằng bao nhiêu?"*${fileNote}`,
      suggestedAction: 'quiz',
    };
  }

  // 7. Phân tích tiến độ tuần
  if (normalized.includes('tiến độ') || normalized.includes('tuần') || normalized.includes('phân tích')) {
    return {
      markdown: `### 📊 Báo Cáo Phân Tích Nhịp Học & Tiến Độ Tuần Này
Chào **${studentContext.name}** (Cấp ${studentContext.level} · *${studentContext.rankTitle}*),

- 🔥 **Chuỗi học tập (Streak):** **${studentContext.streak} ngày liên tiếp** — phong độ cực kỳ ổn định!
- ⚡ **Tổng điểm kinh nghiệm (XP):** **${studentContext.xp} XP**.
- ⏳ **Deadlines chưa xong:** **${studentContext.deadlinesCount} nhiệm vụ**.
${studentContext.urgentDeadlines.map((d) => `  - 🚨 *${d.title}* (${d.course || 'Chung'}) — Hạn: **${d.due || 'Hôm nay'}**`).join('\n')}

**Nhận định của Coach:**
1. Môn **${contextSubject}** đang có bài tập gấp, nên dành phiên học tập trung đầu tiên tối nay.
2. Năng lượng của bạn đang ở mức **${studentContext.energy.toUpperCase()}**, hãy giữ nhịp học 45 phút - nghỉ 10 phút để không bị kiệt sức.${fileNote}`,
      suggestedAction: 'calendar',
    };
  }

  // Default intelligent assistant response
  return {
    markdown: `Mình đã hiểu câu hỏi của bạn về **"${prompt}"** trong môn **${contextSubject}**.

Là bạn đồng hành học tập của sinh viên CampusOS, mình có thể giúp bạn:
1. 💡 **Giải thích bản chất khái niệm:** Đi kèm ví dụ thực tế và công thức dễ nhớ.
2. 🎯 **Tạo Mini Quiz kiểm tra:** 3 câu trắc nghiệm nhanh có chấm điểm và cộng **+XP**.
3. ⏱ **Lên lộ trình học 45–90 phút:** Tự động đồng bộ vào Lịch học và Dashboard.
4. 🐱 **Bật chế độ Focus cùng Coach:** Học tập trung không xao nhãng.

Bạn muốn mình thực hiện bước nào trước?${fileNote}`,
    suggestedAction: 'focus',
  };
}

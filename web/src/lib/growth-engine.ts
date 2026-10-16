/**
 * CampusOS Growth & Skills Matrix Engine
 * Skill mastery modeling, prerequisite graph resolver, XP progression curves,
 * and comprehensive roadmap curriculum for university students.
 */

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  xpReward: number;
  status: 'completed' | 'in_progress' | 'available' | 'locked';
  prerequisites: string[]; // Node IDs required before unlocking
  category: string;
  resources: Array<{ title: string; url: string; type: 'video' | 'doc' | 'exercise' }>;
}

export interface RoadmapItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: 'Chuyên ngành' | 'Kỹ năng' | 'Nghề nghiệp';
  level: 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
  duration: string;
  gradient: string;
  accentColor: string;
  nodes: RoadmapNode[];
}

export interface SkillNode {
  id: string;
  name: string;
  category: 'Lập trình' | 'Khoa học máy tính' | 'Dữ liệu & AI' | 'Kỹ năng mềm';
  level: number; // 1..10
  maxLevel: number;
  currentXp: number;
  nextLevelXp: number;
  totalXp: number;
  streakDays: number;
  lastPracticed?: string;
  color: string;
  description: string;
  perks: Array<{ level: number; title: string; unlocked: boolean }>;
}

// ==========================================
// 1. XP PROGRESSION & LEVEL CURVES
// ==========================================

export const XP_PER_LEVEL_BASE = 200;
export const XP_EXPONENT = 1.35;

/**
 * Calculates required XP to advance from current level to level + 1
 */
export function getRequiredXpForNextLevel(level: number): number {
  if (level <= 0) return XP_PER_LEVEL_BASE;
  return Math.round(XP_PER_LEVEL_BASE * Math.pow(level, XP_EXPONENT));
}

/**
 * Evaluates skill level advancement based on added XP
 */
export function awardSkillXp(
  currentLevel: number,
  currentXp: number,
  earnedXp: number,
  maxLevel: number = 10
): {
  newLevel: number;
  newXp: number;
  nextLevelXp: number;
  didLevelUp: boolean;
  levelsGained: number;
} {
  let lvl = currentLevel;
  let xp = currentXp + earnedXp;
  let didLevelUp = false;
  let levelsGained = 0;

  while (lvl < maxLevel) {
    const needed = getRequiredXpForNextLevel(lvl);
    if (xp >= needed) {
      xp -= needed;
      lvl += 1;
      didLevelUp = true;
      levelsGained += 1;
    } else {
      break;
    }
  }

  // If reached max level, cap XP
  if (lvl >= maxLevel) {
    lvl = maxLevel;
    xp = Math.min(xp, getRequiredXpForNextLevel(maxLevel));
  }

  return {
    newLevel: lvl,
    newXp: xp,
    nextLevelXp: getRequiredXpForNextLevel(lvl),
    didLevelUp,
    levelsGained,
  };
}

// ==========================================
// 2. PREREQUISITE GRAPH & NODE STATUS RESOLVER
// ==========================================

/**
 * Recalculates unlock states across a roadmap DAG based on completed node IDs
 */
export function resolveRoadmapNodeStatuses(
  nodes: RoadmapNode[],
  completedNodeIds: Set<string>
): RoadmapNode[] {
  return nodes.map((node) => {
    if (completedNodeIds.has(node.id)) {
      return { ...node, status: 'completed' as const };
    }

    const allPrereqsMet =
      node.prerequisites.length === 0 ||
      node.prerequisites.every((prereqId) => completedNodeIds.has(prereqId));

    if (!allPrereqsMet) {
      return { ...node, status: 'locked' as const };
    }

    // If prereqs met and not completed, check if it was already marked in_progress
    if (node.status === 'in_progress') {
      return node;
    }

    return { ...node, status: 'available' as const };
  });
}

/**
 * Calculates overall completion metrics of a roadmap
 */
export function calculateRoadmapProgress(nodes: RoadmapNode[]): {
  percent: number;
  completedCount: number;
  totalCount: number;
  earnedXp: number;
  totalXp: number;
} {
  if (nodes.length === 0) {
    return { percent: 0, completedCount: 0, totalCount: 0, earnedXp: 0, totalXp: 0 };
  }

  let completedCount = 0;
  let earnedXp = 0;
  let totalXp = 0;

  for (const node of nodes) {
    totalXp += node.xpReward;
    if (node.status === 'completed') {
      completedCount += 1;
      earnedXp += node.xpReward;
    }
  }

  const percent = Math.round((completedCount / nodes.length) * 100);

  return {
    percent,
    completedCount,
    totalCount: nodes.length,
    earnedXp,
    totalXp,
  };
}

// ==========================================
// 3. SEED ROADMAPS & CURRICULUM
// ==========================================

export const SEED_ROADMAPS: RoadmapItem[] = [
  {
    id: 'r1',
    slug: 'computer-science',
    title: 'Khoa học máy tính & Công nghệ phần mềm',
    description: 'Xây dựng nền móng vững chắc: Cấu trúc dữ liệu & Giải thuật, Hệ điều hành, Mạng máy tính và Kiến trúc hệ thống.',
    category: 'Chuyên ngành',
    level: 'Trung cấp',
    duration: '8 tháng',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
    accentColor: '#3DE8FF',
    nodes: [
      {
        id: 'cs-n1',
        title: 'Nhập môn Lập trình & Tư duy thuật toán',
        description: 'Biến, rẽ nhánh, vòng lặp, mảng và tư duy giải quyết bài toán với C++/Python.',
        estimatedHours: 20,
        xpReward: 100,
        status: 'completed',
        prerequisites: [],
        category: 'Nền tảng',
        resources: [
          { title: 'CS50x: Introduction to Computer Science', url: 'https://cs50.harvard.edu/x', type: 'video' },
          { title: 'Tài liệu giải thuật căn bản', url: '#', type: 'doc' },
        ],
      },
      {
        id: 'cs-n2',
        title: 'Cấu trúc dữ liệu cơ bản',
        description: 'Danh sách liên kết, Stack, Queue và phân tích độ phức tạp thời gian Big-O.',
        estimatedHours: 25,
        xpReward: 150,
        status: 'completed',
        prerequisites: ['cs-n1'],
        category: 'CTDL',
        resources: [
          { title: 'Visualgo Data Structures Visualizer', url: 'https://visualgo.net', type: 'exercise' },
        ],
      },
      {
        id: 'cs-n3',
        title: 'Cây & Bảng băm (Tree & Hash Tables)',
        description: 'Cây nhị phân tìm kiếm BST, Cây AVL cân bằng, Heap và Hash Table xử lý va chạm.',
        estimatedHours: 30,
        xpReward: 200,
        status: 'in_progress',
        prerequisites: ['cs-n2'],
        category: 'CTDL Nâng cao',
        resources: [
          { title: 'Luyện 50 bài LeetCode Tree Patterns', url: '#', type: 'exercise' },
        ],
      },
      {
        id: 'cs-n4',
        title: 'Lý thuyết Đồ thị & Thuật toán',
        description: 'Duyệt BFS, DFS, Đường đi ngắn nhất Dijkstra, Cây khung nhỏ nhất Kruskal/Prim.',
        estimatedHours: 35,
        xpReward: 250,
        status: 'available',
        prerequisites: ['cs-n3'],
        category: 'Thuật toán',
        resources: [
          { title: 'Graph Theory Algorithms Course', url: '#', type: 'video' },
        ],
      },
      {
        id: 'cs-n5',
        title: 'Hệ điều hành & Tiến trình (OS)',
        description: 'Process, Thread, Đồng bộ hóa Mutex/Semaphore, Quản lý bộ nhớ ảo Virtual Memory.',
        estimatedHours: 40,
        xpReward: 300,
        status: 'locked',
        prerequisites: ['cs-n3'],
        category: 'Hệ thống',
        resources: [
          { title: 'Operating Systems: Three Easy Pieces (OSTEP)', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', type: 'doc' },
        ],
      },
      {
        id: 'cs-n6',
        title: 'Mạng máy tính & Giao thức TCP/IP',
        description: 'Mô hình OSI 7 tầng, HTTP/HTTPS, TCP Socket, Subnetting và Định tuyến gói tin.',
        estimatedHours: 30,
        xpReward: 250,
        status: 'locked',
        prerequisites: ['cs-n5'],
        category: 'Hệ thống',
        resources: [
          { title: 'Computer Networking: A Top-Down Approach', url: '#', type: 'doc' },
        ],
      },
      {
        id: 'cs-n7',
        title: 'Cơ sở dữ liệu quan hệ & SQL',
        description: 'Thiết kế lược đồ ERD, Chuẩn hóa 3NF, Câu lệnh SQL nâng cao và Index tối ưu truy vấn.',
        estimatedHours: 25,
        xpReward: 200,
        status: 'locked',
        prerequisites: ['cs-n2'],
        category: 'Dữ liệu',
        resources: [
          { title: 'PostgreSQL Mastery Guide', url: '#', type: 'exercise' },
        ],
      },
      {
        id: 'cs-n8',
        title: 'Đồ án tổng hợp tốt nghiệp lộ trình',
        description: 'Xây dựng dịch vụ mạng phân tán hoặc phần mềm xử lý dữ liệu quy mô lớn.',
        estimatedHours: 60,
        xpReward: 500,
        status: 'locked',
        prerequisites: ['cs-n4', 'cs-n6', 'cs-n7'],
        category: 'Dự án thực tế',
        resources: [
          { title: 'Hướng dẫn xây dựng Production-ready Backend', url: '#', type: 'video' },
        ],
      },
    ],
  },
  {
    id: 'r2',
    slug: 'full-stack-web',
    title: 'Full-Stack Modern Web Developer',
    description: 'Từ HTML/CSS/TypeScript đến Next.js, React Server Components, REST/GraphQL API và Cloud Deployment.',
    category: 'Nghề nghiệp',
    level: 'Cơ bản',
    duration: '6 tháng',
    gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
    accentColor: '#7C5CFF',
    nodes: [
      {
        id: 'fs-n1',
        title: 'HTML5 Semantic & Modern Tailwind CSS',
        description: 'Flexbox, Grid, Responsive Design, Design Tokens và Utility-First Styling.',
        estimatedHours: 20,
        xpReward: 100,
        status: 'completed',
        prerequisites: [],
        category: 'Frontend',
        resources: [{ title: 'Tailwind Labs Official Walkthrough', url: '#', type: 'video' }],
      },
      {
        id: 'fs-n2',
        title: 'Modern JavaScript (ES6+) & TypeScript',
        description: 'Types, Interfaces, Generics, Promises, Async/Await và DOM Manipulation.',
        estimatedHours: 30,
        xpReward: 150,
        status: 'completed',
        prerequisites: ['fs-n1'],
        category: 'Ngôn ngữ',
        resources: [{ title: 'TypeScript Deep Dive', url: '#', type: 'doc' }],
      },
      {
        id: 'fs-n3',
        title: 'React 18 & Component Driven Architecture',
        description: 'Hooks (useState, useEffect, useMemo), Custom Hooks, Context API và Virtual DOM.',
        estimatedHours: 35,
        xpReward: 200,
        status: 'in_progress',
        prerequisites: ['fs-n2'],
        category: 'Frontend',
        resources: [{ title: 'React Documentation (react.dev)', url: 'https://react.dev', type: 'doc' }],
      },
      {
        id: 'fs-n4',
        title: 'Next.js App Router & Server Components',
        description: 'Server Actions, Streaming SSR, Parallel Routes, SEO và Caching Strategies.',
        estimatedHours: 40,
        xpReward: 300,
        status: 'available',
        prerequisites: ['fs-n3'],
        category: 'Framework',
        resources: [{ title: 'Next.js Official Learn Course', url: '#', type: 'exercise' }],
      },
      {
        id: 'fs-n5',
        title: 'Backend API & Database (Node.js/Supabase)',
        description: 'RESTful API, JWT Authentication, Postgres Row Level Security và Prisma/Drizzle ORM.',
        estimatedHours: 40,
        xpReward: 300,
        status: 'locked',
        prerequisites: ['fs-n4'],
        category: 'Backend',
        resources: [{ title: 'Fullstack Auth & Database Security', url: '#', type: 'video' }],
      },
    ],
  },
  {
    id: 'r3',
    slug: 'ai-data-science',
    title: 'AI & Data Science Specialist',
    description: 'Chinh phục phân tích dữ liệu, Machine Learning cơ bản đến Deep Learning và Generative AI ứng dụng.',
    category: 'Nghề nghiệp',
    level: 'Nâng cao',
    duration: '9 tháng',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    accentColor: '#10B981',
    nodes: [
      {
        id: 'ai-n1',
        title: 'Python for Data Analysis & NumPy',
        description: 'Thao tác mảng nhiều chiều, vectorization và tính toán ma trận với NumPy.',
        estimatedHours: 20,
        xpReward: 100,
        status: 'completed',
        prerequisites: [],
        category: 'Nền tảng',
        resources: [{ title: 'Python Data Science Handbook', url: '#', type: 'doc' }],
      },
      {
        id: 'ai-n2',
        title: 'Pandas & Data Wrangling',
        description: 'Làm sạch dữ liệu, xử lý missing values, groupby và trực quan hóa Matplotlib/Seaborn.',
        estimatedHours: 25,
        xpReward: 150,
        status: 'in_progress',
        prerequisites: ['ai-n1'],
        category: 'Phân tích',
        resources: [{ title: 'Kaggle Data Cleaning Micro-Course', url: '#', type: 'exercise' }],
      },
      {
        id: 'ai-n3',
        title: 'Classical Machine Learning (Scikit-Learn)',
        description: 'Hồi quy tuyến tính, Logistic Regression, Random Forest, SVM và Cross Validation.',
        estimatedHours: 45,
        xpReward: 300,
        status: 'locked',
        prerequisites: ['ai-n2'],
        category: 'ML',
        resources: [{ title: 'Hands-On Machine Learning with Scikit-Learn', url: '#', type: 'doc' }],
      },
    ],
  },
];

// ==========================================
// 4. SEED SKILLS MATRIX (VIETNAMESE UNIVERSITY PROFILES)
// ==========================================

export const SEED_SKILLS: SkillNode[] = [
  {
    id: 'sk1',
    name: 'JavaScript / TypeScript',
    category: 'Lập trình',
    level: 6,
    maxLevel: 10,
    currentXp: 350,
    nextLevelXp: 500,
    totalXp: 2850,
    streakDays: 14,
    lastPracticed: 'Hôm nay',
    color: '#F7DF1E',
    description: 'Ngôn ngữ cốt lõi cho Web hiện đại, asynchronous programming, generic typing và design patterns.',
    perks: [
      { level: 3, title: 'Code Refactor: Làm chủ closures & event loop', unlocked: true },
      { level: 5, title: 'Type Guru: Generic constraints & mapped types', unlocked: true },
      { level: 7, title: 'Performance: Memory leak profiling & micro-benchmarking', unlocked: false },
      { level: 10, title: 'Grandmaster: Kiến trúc framework & AST parser', unlocked: false },
    ],
  },
  {
    id: 'sk2',
    name: 'Python for Engineering',
    category: 'Lập trình',
    level: 5,
    maxLevel: 10,
    currentXp: 180,
    nextLevelXp: 420,
    totalXp: 2100,
    streakDays: 8,
    lastPracticed: 'Hôm qua',
    color: '#3776AB',
    description: 'Xử lý tự động hóa, tính toán khoa học, phân tích dữ liệu và scripting tốc độ cao.',
    perks: [
      { level: 3, title: 'Scripting: Làm chủ OS module & regex automation', unlocked: true },
      { level: 5, title: 'OOP & Metaclasses: Dunder methods & decorators', unlocked: true },
      { level: 8, title: 'Concurrency: Asyncio & multiprocessing pipeline', unlocked: false },
    ],
  },
  {
    id: 'sk3',
    name: 'Cấu trúc dữ liệu & Thuật toán',
    category: 'Khoa học máy tính',
    level: 4,
    maxLevel: 10,
    currentXp: 220,
    nextLevelXp: 350,
    totalXp: 1650,
    streakDays: 5,
    lastPracticed: '2 ngày trước',
    color: '#7C5CFF',
    description: 'Tư duy thuật toán tối ưu, làm chủ cây, đồ thị, quy hoạch động và chuẩn bị phỏng vấn kỹ thuật.',
    perks: [
      { level: 2, title: 'Big-O: Đọc vị độ phức tạp không gian & thời gian', unlocked: true },
      { level: 4, title: 'Tree Master: Duyệt cây DFS/BFS không đệ quy', unlocked: true },
      { level: 6, title: 'DP Architect: Nhận diện mẫu bài quy hoạch động', unlocked: false },
      { level: 8, title: 'Graph Wizard: Shortest path & flow network', unlocked: false },
    ],
  },
  {
    id: 'sk4',
    name: 'Thuyết trình & Truyền đạt ý tưởng',
    category: 'Kỹ năng mềm',
    level: 5,
    maxLevel: 10,
    currentXp: 310,
    nextLevelXp: 420,
    totalXp: 1950,
    streakDays: 12,
    lastPracticed: 'Hôm nay',
    color: '#10B981',
    description: 'Thuyết phục bảo vệ đồ án, giao tiếp nhóm đa ngành, pitch ý tưởng khởi nghiệp rõ ràng và cuốn hút.',
    perks: [
      { level: 3, title: 'Slide Master: Nguyên lý visual storytelling & contrast', unlocked: true },
      { level: 5, title: 'Stage Presence: Kiểm soát ngữ điệu & ngôn ngữ cơ thể', unlocked: true },
      { level: 7, title: 'Q&A Defense: Xử lý câu hỏi khó từ hội đồng phản biện', unlocked: false },
    ],
  },
  {
    id: 'sk5',
    name: 'Thiết kế giao diện UI/UX',
    category: 'Lập trình',
    level: 4,
    maxLevel: 10,
    currentXp: 90,
    nextLevelXp: 350,
    totalXp: 1300,
    streakDays: 3,
    lastPracticed: '3 ngày trước',
    color: '#FF3DA5',
    description: 'Typography, phối màu neon cyber-glass, micro-interactions và tối ưu trải nghiệm người dùng sinh viên.',
    perks: [
      { level: 2, title: 'Color Theory: Bảng màu WCAG AA & dark theme contrast', unlocked: true },
      { level: 4, title: 'Motion: Easing curves & spring physics', unlocked: true },
      { level: 7, title: 'Design System: Tokens, headless primitives & Figma syncing', unlocked: false },
    ],
  },
];

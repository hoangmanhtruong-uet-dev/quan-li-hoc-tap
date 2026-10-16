import { useSyncExternalStore, useCallback, useMemo } from 'react';

export type ClubRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
export type ClubDepartment =
  | 'Ban Chủ nhiệm'
  | 'Ban Chuyên môn & Kỹ thuật'
  | 'Ban Truyền thông & Sự kiện'
  | 'Ban Đối ngoại & Tài chính';

export type TransactionType = 'income' | 'expense';
export type TransactionCategory =
  | 'Hội phí'
  | 'Tài trợ'
  | 'Sự kiện'
  | 'Hậu cần & Thiết bị'
  | 'Khen thưởng';

export type FundType = 'general' | 'event' | 'reserve';

export interface ClubMember {
  id: string;
  name: string;
  studentId: string;
  avatar: string;
  role: ClubRole;
  department: ClubDepartment;
  joinedDate: string;
  activeScore: number;
}

export interface ClubTransaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  fundType: FundType;
  amount: number;
  description: string;
  date: string;
  createdByName: string;
}

export interface ClubEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;
  location: string;
  category: 'Workshop' | 'Hackathon' | 'Sinh hoạt' | 'Giao lưu';
  department: ClubDepartment;
  maxAttendees: number;
  attendeeIds: string[];
  bannerGradient: string;
}

export interface ClubTask {
  id: string;
  title: string;
  description: string;
  department: ClubDepartment;
  assigneeIds: string[];
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  eventId?: string;
}

export interface ClubDetail {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: 'Công nghệ' | 'Ngoại ngữ' | 'Nghệ thuật' | 'Thể thao';
  establishedYear: number;
  members: ClubMember[];
  events: ClubEvent[];
  transactions: ClubTransaction[];
  tasks: ClubTask[];
  generalFundBalance: number;
  eventFundBalance: number;
  reserveFundBalance: number;
  coverGradient: string;
  iconName: string;
  tags: string[];
  currentUserRole?: ClubRole;
}

export interface ClubMetrics {
  totalClubs: number;
  totalMembers: number;
  totalEvents: number;
  totalTreasury: number;
  pendingTasks: number;
}

export const CLUB_STORAGE_KEY = 'campusos-clubs-v2';
export const CLUB_CHANGE_EVENT = 'campusos-clubs-change';

/**
 * 4 Distinct University Clubs Seed Data
 */
export function getInitialClubs(): ClubDetail[] {
  return [
    {
      id: 'c1',
      name: 'Campus Tech Club',
      shortName: 'CTC',
      description: 'Cộng đồng lập trình, sản phẩm số, điện toán đám mây và đổi mới sáng tạo công nghệ hàng đầu trường đại học.',
      category: 'Công nghệ',
      establishedYear: 2021,
      currentUserRole: 'OWNER',
      coverGradient: 'from-blue-600 via-cyan-500 to-teal-400',
      iconName: 'Code2',
      tags: ['Lập trình', 'AI & Cloud', 'Hackathon', 'Web Dev'],
      generalFundBalance: 14500000,
      eventFundBalance: 8200000,
      reserveFundBalance: 5000000,
      members: [
        {
          id: 'ctc-m1',
          name: 'Nguyễn Văn Minh (Bạn)',
          studentId: '20210001',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          role: 'OWNER',
          department: 'Ban Chủ nhiệm',
          joinedDate: '2023-09-01',
          activeScore: 98,
        },
        {
          id: 'ctc-m2',
          name: 'Trần Thị Thu Lan',
          studentId: '20210045',
          avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
          role: 'ADMIN',
          department: 'Ban Chuyên môn & Kỹ thuật',
          joinedDate: '2023-09-15',
          activeScore: 94,
        },
        {
          id: 'ctc-m3',
          name: 'Lê Hoàng Nam',
          studentId: '20220112',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
          role: 'MANAGER',
          department: 'Ban Truyền thông & Sự kiện',
          joinedDate: '2024-02-10',
          activeScore: 88,
        },
        {
          id: 'ctc-m4',
          name: 'Phạm Minh Anh',
          studentId: '20220304',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
          role: 'MEMBER',
          department: 'Ban Đối ngoại & Tài chính',
          joinedDate: '2024-03-01',
          activeScore: 85,
        },
        {
          id: 'ctc-m5',
          name: 'Vũ Đức Thịnh',
          studentId: '20230550',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
          role: 'MEMBER',
          department: 'Ban Chuyên môn & Kỹ thuật',
          joinedDate: '2024-09-20',
          activeScore: 78,
        },
      ],
      events: [
        {
          id: 'ctc-e1',
          title: 'Hack Night: Build for Campus 2026',
          description: 'Đêm thi lập trình 24h thần tốc sáng tạo các giải pháp phục vụ chuyển đổi số đời sống sinh viên.',
          date: '2026-10-24',
          startTime: '18:30',
          endTime: '22:30',
          location: 'Innovation Lab - Tòa nhà CNTT',
          category: 'Hackathon',
          department: 'Ban Chuyên môn & Kỹ thuật',
          maxAttendees: 60,
          attendeeIds: ['ctc-m1', 'ctc-m2', 'ctc-m3', 'user-guest-1', 'user-guest-2'],
          bannerGradient: 'from-blue-600 via-indigo-600 to-purple-600',
        },
        {
          id: 'ctc-e2',
          title: 'Workshop: Agentic AI & Next.js Fullstack Architecture',
          description: 'Tìm hiểu kiến trúc Multi-Agent, Tool Calling và tối ưu hóa hiệu năng ứng dụng React App Router.',
          date: '2026-11-02',
          startTime: '14:00',
          endTime: '17:00',
          location: 'Hội trường B1 - ĐHBK',
          category: 'Workshop',
          department: 'Ban Chuyên môn & Kỹ thuật',
          maxAttendees: 120,
          attendeeIds: ['ctc-m1', 'ctc-m4'],
          bannerGradient: 'from-cyan-600 to-emerald-600',
        },
        {
          id: 'ctc-e3',
          title: 'Sinh hoạt định kỳ & Chào đón tân thành viên Gen 5',
          description: 'Gặp gỡ giao lưu đầu năm học, phổ biến quy chế hoạt động và phân bổ các nhóm dự án nghiên cứu.',
          date: '2026-09-28',
          startTime: '19:00',
          endTime: '21:00',
          location: 'Phòng Hội thảo Thư viện Tạ Quang Bửu',
          category: 'Sinh hoạt',
          department: 'Ban Chủ nhiệm',
          maxAttendees: 80,
          attendeeIds: ['ctc-m1', 'ctc-m2', 'ctc-m3', 'ctc-m4', 'ctc-m5'],
          bannerGradient: 'from-slate-700 to-slate-900',
        },
      ],
      transactions: [
        {
          id: 'ctc-t1',
          type: 'income',
          category: 'Hội phí',
          fundType: 'general',
          amount: 5000000,
          description: 'Thu hội phí đầu kỳ I năm học 2026-2027 (50 thành viên)',
          date: '2026-09-10',
          createdByName: 'Phạm Minh Anh',
        },
        {
          id: 'ctc-t2',
          type: 'income',
          category: 'Tài trợ',
          fundType: 'event',
          amount: 10000000,
          description: 'Tài trợ kim cương từ VNG Cloud cho giải Hack Night 2026',
          date: '2026-10-01',
          createdByName: 'Nguyễn Văn Minh',
        },
        {
          id: 'ctc-t3',
          type: 'expense',
          category: 'Hậu cần & Thiết bị',
          fundType: 'event',
          amount: 1800000,
          description: 'Mua server router Wi-Fi 6 tốc độ cao phục vụ phòng Hackathon',
          date: '2026-10-12',
          createdByName: 'Trần Thị Thu Lan',
        },
        {
          id: 'ctc-t4',
          type: 'expense',
          category: 'Sự kiện',
          fundType: 'general',
          amount: 1200000,
          description: 'Teabreak và nước uống buổi sinh hoạt định kỳ tân thành viên',
          date: '2026-09-28',
          createdByName: 'Lê Hoàng Nam',
        },
      ],
      tasks: [
        {
          id: 'ctc-tsk1',
          title: 'Hoàn thiện đề bài & Thể lệ Hack Night 2026',
          description: 'Thống nhất tiêu chí chấm điểm và ban giám khảo khách mời từ doanh nghiệp.',
          department: 'Ban Chuyên môn & Kỹ thuật',
          assigneeIds: ['ctc-m2'],
          dueDate: '2026-10-20',
          priority: 'high',
          status: 'in_progress',
        },
        {
          id: 'ctc-tsk2',
          title: 'Thiết kế bộ nhận diện truyền thông & Backdrop Hack Night',
          description: 'Sản xuất visual Cyber-Glass cho Facebook Fanpage và poster in ấn tại giảng đường.',
          department: 'Ban Truyền thông & Sự kiện',
          assigneeIds: ['ctc-m3'],
          dueDate: '2026-10-18',
          priority: 'high',
          status: 'review',
        },
        {
          id: 'ctc-tsk3',
          title: 'Liên hệ tài trợ thiết bị & Quà tặng thí sinh',
          description: 'Ký kết biên bản thỏa thuận tài trợ với các công ty đối tác công nghệ.',
          department: 'Ban Đối ngoại & Tài chính',
          assigneeIds: ['ctc-m4'],
          dueDate: '2026-10-22',
          priority: 'medium',
          status: 'todo',
        },
        {
          id: 'ctc-tsk4',
          title: 'Đặt phòng lab máy chủ và kiểm tra hệ thống điện dự phòng',
          description: 'Làm việc với Ban quản lý cơ sở vật chất nhà trường.',
          department: 'Ban Chủ nhiệm',
          assigneeIds: ['ctc-m1'],
          dueDate: '2026-10-15',
          priority: 'medium',
          status: 'done',
        },
      ],
    },
    {
      id: 'c2',
      name: 'English Speaking Club',
      shortName: 'ESC',
      description: 'Luyện phản xạ, hùng biện, thuyết trình tiếng Anh học thuật và mở rộng mạng lưới giao lưu quốc tế.',
      category: 'Ngoại ngữ',
      establishedYear: 2019,
      currentUserRole: 'MEMBER',
      coverGradient: 'from-violet-600 via-fuchsia-500 to-pink-500',
      iconName: 'Languages',
      tags: ['IELTS', 'Debate', 'Public Speaking', 'Coffee Talk'],
      generalFundBalance: 8200000,
      eventFundBalance: 3500000,
      reserveFundBalance: 2000000,
      members: [
        {
          id: 'esc-m1',
          name: 'Đỗ Thảo Vy',
          studentId: '20221450',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
          role: 'OWNER',
          department: 'Ban Chủ nhiệm',
          joinedDate: '2023-10-01',
          activeScore: 96,
        },
        {
          id: 'esc-m2',
          name: 'Nguyễn Văn Minh (Bạn)',
          studentId: '20210001',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          role: 'MEMBER',
          department: 'Ban Chuyên môn & Kỹ thuật',
          joinedDate: '2024-01-15',
          activeScore: 82,
        },
        {
          id: 'esc-m3',
          name: 'Hoàng Minh Tuấn',
          studentId: '20223011',
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
          role: 'MANAGER',
          department: 'Ban Truyền thông & Sự kiện',
          joinedDate: '2023-11-20',
          activeScore: 89,
        },
      ],
      events: [
        {
          id: 'esc-e1',
          title: 'Campus Debate Championship 2026: AI vs Human Intellect',
          description: 'Tranh biện theo luật nghị viện Anh (BP) về tác động của trí tuệ nhân tạo đối với tương lai nghề nghiệp.',
          date: '2026-10-28',
          startTime: '18:00',
          endTime: '21:30',
          location: 'Hội trường C2 - Đại học Bách Khoa',
          category: 'Giao lưu',
          department: 'Ban Chuyên môn & Kỹ thuật',
          maxAttendees: 150,
          attendeeIds: ['esc-m1', 'esc-m2', 'esc-m3'],
          bannerGradient: 'from-purple-600 via-pink-600 to-rose-500',
        },
        {
          id: 'esc-e2',
          title: 'English Coffee Talk: Overcoming Imposter Syndrome',
          description: 'Giao lưu thân mật cuối tuần cùng diễn giả cựu sinh viên nhận học bổng Chevening.',
          date: '2026-11-08',
          startTime: '09:00',
          endTime: '11:30',
          location: 'The Coffee House - Tạ Quang Bửu',
          category: 'Sinh hoạt',
          department: 'Ban Truyền thông & Sự kiện',
          maxAttendees: 35,
          attendeeIds: ['esc-m2'],
          bannerGradient: 'from-amber-600 to-orange-500',
        },
      ],
      transactions: [
        {
          id: 'esc-t1',
          type: 'income',
          category: 'Hội phí',
          fundType: 'general',
          amount: 3200000,
          description: 'Thu hội phí sinh hoạt quý 4/2026',
          date: '2026-10-02',
          createdByName: 'Đỗ Thảo Vy',
        },
        {
          id: 'esc-t2',
          type: 'expense',
          category: 'Khen thưởng',
          fundType: 'event',
          amount: 1500000,
          description: 'Cúp lưu niệm và phần thưởng cho đội vô địch Debate Mini',
          date: '2026-10-10',
          createdByName: 'Đỗ Thảo Vy',
        },
      ],
      tasks: [
        {
          id: 'esc-tsk1',
          title: 'Mời Ban Giám khảo chấm chung kết Debate Championship',
          description: 'Gửi thư mời chính thức tới giảng viên khoa Ngoại ngữ và chuyên gia debate.',
          department: 'Ban Đối ngoại & Tài chính',
          assigneeIds: ['esc-m1'],
          dueDate: '2026-10-23',
          priority: 'high',
          status: 'todo',
        },
        {
          id: 'esc-tsk2',
          title: 'Tổng hợp danh sách các cặp đấu bảng Debate',
          description: 'Xếp lịch bốc thăm và kiểm tra thông tin các đội đăng ký thi đấu.',
          department: 'Ban Chuyên môn & Kỹ thuật',
          assigneeIds: ['esc-m2'],
          dueDate: '2026-10-24',
          priority: 'medium',
          status: 'in_progress',
        },
      ],
    },
    {
      id: 'c3',
      name: 'CLB Nhiếp ảnh & Media',
      shortName: 'CPS',
      description: 'Kể câu chuyện đời sống sinh viên, văn hóa khuôn viên trường và ghi dấu thanh xuân qua ống kính nghệ thuật.',
      category: 'Nghệ thuật',
      establishedYear: 2020,
      currentUserRole: 'VIEWER',
      coverGradient: 'from-amber-500 via-rose-500 to-purple-600',
      iconName: 'Camera',
      tags: ['Nhiếp ảnh', 'Cinematography', 'Exhibition', 'Design'],
      generalFundBalance: 5400000,
      eventFundBalance: 2800000,
      reserveFundBalance: 1500000,
      members: [
        {
          id: 'cps-m1',
          name: 'Bùi Hải Đăng',
          studentId: '20214820',
          avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
          role: 'OWNER',
          department: 'Ban Chủ nhiệm',
          joinedDate: '2023-08-01',
          activeScore: 92,
        },
        {
          id: 'cps-m2',
          name: 'Lê Diệu Hương',
          studentId: '20225102',
          avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
          role: 'ADMIN',
          department: 'Ban Truyền thông & Sự kiện',
          joinedDate: '2023-09-01',
          activeScore: 90,
        },
      ],
      events: [
        {
          id: 'cps-e1',
          title: 'Golden Hour Photo Walk: Mùa Thu Bách Khoa',
          description: 'Chụp ảnh đường phố và kiến trúc giảng đường mùa lá rụng cùng các nhiếp ảnh gia kỳ cựu.',
          date: '2026-10-25',
          startTime: '16:00',
          endTime: '18:30',
          location: 'Cổng Parabol - Đại học Bách Khoa',
          category: 'Sinh hoạt',
          department: 'Ban Chuyên môn & Kỹ thuật',
          maxAttendees: 40,
          attendeeIds: ['cps-m1', 'cps-m2'],
          bannerGradient: 'from-amber-500 via-orange-600 to-rose-600',
        },
      ],
      transactions: [
        {
          id: 'cps-t1',
          type: 'income',
          category: 'Tài trợ',
          fundType: 'general',
          amount: 4000000,
          description: 'Tiền thù lao chụp kỷ yếu và tài trợ từ studio đối tác',
          date: '2026-09-15',
          createdByName: 'Bùi Hải Đăng',
        },
        {
          id: 'cps-t2',
          type: 'expense',
          category: 'Hậu cần & Thiết bị',
          fundType: 'reserve',
          amount: 850000,
          description: 'Bảo dưỡng ống kính và tủ chống ẩm của câu lạc bộ',
          date: '2026-10-05',
          createdByName: 'Bùi Hải Đăng',
        },
      ],
      tasks: [
        {
          id: 'cps-tsk1',
          title: 'Khảo sát cung đường chụp cho Photo Walk',
          description: 'Chọn các góc ánh sáng đẹp quanh hồ Tiền và khu nhà C.',
          department: 'Ban Chuyên môn & Kỹ thuật',
          assigneeIds: ['cps-m1'],
          dueDate: '2026-10-22',
          priority: 'medium',
          status: 'in_progress',
        },
      ],
    },
    {
      id: 'c4',
      name: 'CLB Cờ vua & Chiến thuật',
      shortName: 'CSC',
      description: 'Rèn luyện tư duy phản biện, chiến thuật đỉnh cao qua các giải đấu cờ chớp, cờ tiêu chuẩn và phân tích ván đấu quốc tế.',
      category: 'Thể thao',
      establishedYear: 2022,
      currentUserRole: 'MEMBER',
      coverGradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      iconName: 'Trophy',
      tags: ['Cờ vua', 'Blitz', 'Chiến thuật', 'Giải đấu'],
      generalFundBalance: 3100000,
      eventFundBalance: 1500000,
      reserveFundBalance: 800000,
      members: [
        {
          id: 'csc-m1',
          name: 'Vũ Quốc Khánh',
          studentId: '20211100',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
          role: 'OWNER',
          department: 'Ban Chủ nhiệm',
          joinedDate: '2023-09-01',
          activeScore: 95,
        },
        {
          id: 'csc-m2',
          name: 'Nguyễn Văn Minh (Bạn)',
          studentId: '20210001',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          role: 'MEMBER',
          department: 'Ban Chuyên môn & Kỹ thuật',
          joinedDate: '2024-03-01',
          activeScore: 80,
        },
      ],
      events: [
        {
          id: 'csc-e1',
          title: 'Blitz Cup 2026: Giải Cờ chớp Sinh viên Mở rộng',
          description: 'Hơn 64 kỳ thủ tranh tài 7 vòng hệ Thụy Sĩ tốc độ 3+2 hấp dẫn kịch tính.',
          date: '2026-10-30',
          startTime: '13:30',
          endTime: '17:30',
          location: 'Nhà thi đấu Thể thao Sinh viên',
          category: 'Hackathon',
          department: 'Ban Chuyên môn & Kỹ thuật',
          maxAttendees: 64,
          attendeeIds: ['csc-m1', 'csc-m2'],
          bannerGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
        },
      ],
      transactions: [
        {
          id: 'csc-t1',
          type: 'income',
          category: 'Hội phí',
          fundType: 'general',
          amount: 1500000,
          description: 'Lệ phí đăng ký giải đấu Blitz Cup từ các kỳ thủ',
          date: '2026-10-08',
          createdByName: 'Vũ Quốc Khánh',
        },
      ],
      tasks: [
        {
          id: 'csc-tsk1',
          title: 'Chuẩn bị 32 đồng hồ thi đấu DGT và bàn cờ tiêu chuẩn',
          description: 'Kiểm tra pin và độ chính xác của đồng hồ điện tử.',
          department: 'Ban Đối ngoại & Tài chính',
          assigneeIds: ['csc-m1'],
          dueDate: '2026-10-28',
          priority: 'high',
          status: 'todo',
        },
      ],
    },
  ];
}

// Global in-memory cache and subscribers for useSyncExternalStore
type ClubSubscriber = () => void;
const subscribers = new Set<ClubSubscriber>();
let memoryClubs: ClubDetail[] | null = null;

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('[ClubEngine] Subscriber callback error:', e);
    }
  });
}

function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key === CLUB_STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (Array.isArray(parsed)) {
          memoryClubs = parsed;
          notifySubscribers();
        }
      } catch (err) {
        console.warn('[ClubEngine] Failed to parse cross-tab club store:', err);
      }
    }
  });

  window.addEventListener(CLUB_CHANGE_EVENT, (event: Event) => {
    const custom = event as CustomEvent<ClubDetail[]>;
    if (custom.detail && custom.detail !== memoryClubs) {
      memoryClubs = custom.detail;
      notifySubscribers();
    }
  });
}

/**
 * Read clubs from localStorage or fallback to initial seed
 */
export function getStoredClubs(): ClubDetail[] {
  if (typeof window === 'undefined') {
    if (!memoryClubs) {
      memoryClubs = getInitialClubs();
    }
    return memoryClubs;
  }
  if (memoryClubs) {
    return memoryClubs;
  }
  try {
    const raw = localStorage.getItem(CLUB_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialClubs();
      memoryClubs = initial;
      localStorage.setItem(CLUB_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= 4) {
      memoryClubs = parsed;
      return parsed;
    }
    // If stale or corrupted cache, reseed with full 4 clubs
    const initial = getInitialClubs();
    memoryClubs = initial;
    localStorage.setItem(CLUB_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    memoryClubs = getInitialClubs();
    return memoryClubs;
  }
}

/**
 * Persist clubs to storage and notify subscribers
 * Deep-clones arrays & nested objects to guarantee referential invalidation for useSyncExternalStore!
 */
export function persistClubs(clubs: ClubDetail[]): void {
  memoryClubs = clubs.map((c) => ({
    ...c,
    tags: [...c.tags],
    members: c.members.map((m) => ({ ...m })),
    events: c.events.map((e) => ({ ...e, attendeeIds: [...e.attendeeIds] })),
    transactions: c.transactions.map((t) => ({ ...t })),
    tasks: c.tasks.map((t) => ({ ...t, assigneeIds: [...t.assigneeIds] })),
  }));

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CLUB_STORAGE_KEY, JSON.stringify(memoryClubs));
      window.dispatchEvent(new CustomEvent(CLUB_CHANGE_EVENT, { detail: memoryClubs }));
    } catch (err) {
      console.error('[ClubEngine] Failed to write clubs to localStorage:', err);
    }
  }
  notifySubscribers();
}

/**
 * Reset all clubs to default seeds
 */
export function resetClubsToDefault(): ClubDetail[] {
  memoryClubs = null;
  const initial = getInitialClubs();
  persistClubs(initial);
  return memoryClubs || initial;
}

/**
 * Get club by ID (guarantees finding c1..c4)
 */
export function getClubById(id: string): ClubDetail | undefined {
  const clubs = getStoredClubs();
  return clubs.find((c) => c.id === id);
}

/**
 * Calculate overall metrics for the club hub
 */
export function getClubMetrics(clubs: ClubDetail[]): ClubMetrics {
  const totalClubs = clubs.length;
  let totalMembers = 0;
  let totalEvents = 0;
  let totalTreasury = 0;
  let pendingTasks = 0;

  clubs.forEach((c) => {
    totalMembers += c.members.length;
    totalEvents += c.events.length;
    totalTreasury += c.generalFundBalance + c.eventFundBalance + c.reserveFundBalance;
    pendingTasks += c.tasks.filter((t) => t.status !== 'done').length;
  });

  return {
    totalClubs,
    totalMembers,
    totalEvents,
    totalTreasury,
    pendingTasks,
  };
}

/**
 * Calculate detailed treasury figures for a specific club
 */
export function calculateClubTreasury(club: ClubDetail) {
  const totalIncome = club.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = club.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = club.generalFundBalance + club.eventFundBalance + club.reserveFundBalance;

  return {
    generalFund: club.generalFundBalance,
    eventFund: club.eventFundBalance,
    reserveFund: club.reserveFundBalance,
    totalBalance,
    totalIncome,
    totalExpense,
  };
}

/**
 * Record a new financial transaction for a club and update fund balance
 */
export function recordClubTransaction(
  clubId: string,
  transactionInput: Omit<ClubTransaction, 'id'>,
): { success: boolean; transaction?: ClubTransaction; error?: string } {
  const list = getStoredClubs();
  const clubIndex = list.findIndex((c) => c.id === clubId);
  if (clubIndex === -1) return { success: false, error: 'Không tìm thấy câu lạc bộ' };

  const club = list[clubIndex];
  if (!club) return { success: false, error: 'Không tìm thấy câu lạc bộ' };

  const amount = Number(transactionInput.amount);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Số tiền giao dịch không hợp lệ' };
  }

  // Determine which fund is impacted
  const fund = transactionInput.fundType || 'general';
  let nextGeneral = club.generalFundBalance;
  let nextEvent = club.eventFundBalance;
  let nextReserve = club.reserveFundBalance;

  if (transactionInput.type === 'income') {
    if (fund === 'general') nextGeneral += amount;
    else if (fund === 'event') nextEvent += amount;
    else if (fund === 'reserve') nextReserve += amount;
  } else {
    // Expense: verify sufficiency
    if (fund === 'general') {
      if (nextGeneral < amount) return { success: false, error: 'Số dư Quỹ chung không đủ để thực hiện chi phí' };
      nextGeneral -= amount;
    } else if (fund === 'event') {
      if (nextEvent < amount) return { success: false, error: 'Số dư Quỹ sự kiện không đủ để thực hiện chi phí' };
      nextEvent -= amount;
    } else if (fund === 'reserve') {
      if (nextReserve < amount) return { success: false, error: 'Số dư Quỹ dự phòng không đủ để thực hiện chi phí' };
      nextReserve -= amount;
    }
  }

  const newTx: ClubTransaction = {
    ...transactionInput,
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    amount,
  };

  const updatedClub: ClubDetail = {
    ...club,
    generalFundBalance: nextGeneral,
    eventFundBalance: nextEvent,
    reserveFundBalance: nextReserve,
    transactions: [newTx, ...club.transactions],
  };

  list[clubIndex] = updatedClub;
  persistClubs(list);

  return { success: true, transaction: newTx };
}

/**
 * Toggle RSVP for a club event
 */
export function toggleClubEventRsvp(
  clubId: string,
  eventId: string,
  userId: string,
): { success: boolean; isAttending: boolean; error?: string } {
  const list = getStoredClubs();
  const club = list.find((c) => c.id === clubId);
  if (!club) return { success: false, isAttending: false, error: 'Câu lạc bộ không tồn tại' };

  const event = club.events.find((e) => e.id === eventId);
  if (!event) return { success: false, isAttending: false, error: 'Sự kiện không tồn tại' };

  const isAttending = event.attendeeIds.includes(userId);

  if (isAttending) {
    // Leave event
    event.attendeeIds = event.attendeeIds.filter((id) => id !== userId);
    persistClubs(list);
    return { success: true, isAttending: false };
  } else {
    // Check capacity
    if (event.attendeeIds.length >= event.maxAttendees) {
      return { success: false, isAttending: false, error: 'Sự kiện đã đủ số lượng người đăng ký tối đa' };
    }
    event.attendeeIds.push(userId);
    persistClubs(list);
    return { success: true, isAttending: true };
  }
}

/**
 * Generate iCalendar RFC 5545 string for downloading or syncing an event
 */
export function generateIcsForEvent(event: ClubEvent, clubName: string): string {
  const formatDateToIcs = (dateStr: string, timeStr: string) => {
    // dateStr: YYYY-MM-DD, timeStr: HH:mm
    const [year, month, day] = dateStr.split('-');
    const [hour, minute] = timeStr.split(':');
    return `${year}${month}${day}T${hour}${minute}00`;
  };

  const startUtc = formatDateToIcs(event.date, event.startTime);
  const endUtc = formatDateToIcs(event.date, event.endTime);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusOS//Student Club Calendar//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:club-event-${event.id}@campusos.vn`,
    `DTSTAMP:${formatDateToIcs(new Date().toISOString().split('T')[0] ?? '2026-10-16', '12:00')}Z`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:[${clubName}] ${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    `CATEGORIES:${event.category}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Create a new event for a club
 */
export function createClubEvent(
  clubId: string,
  eventInput: Omit<ClubEvent, 'id' | 'attendeeIds'>,
): ClubEvent | null {
  const list = getStoredClubs();
  const club = list.find((c) => c.id === clubId);
  if (!club) return null;

  const newEvent: ClubEvent = {
    ...eventInput,
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    attendeeIds: ['ctc-m1'], // Current user automatically registered
  };

  club.events.unshift(newEvent);
  persistClubs(list);
  return newEvent;
}

/**
 * Task Management: Create, update status, delete task
 */
export function createClubTask(
  clubId: string,
  taskInput: Omit<ClubTask, 'id'>,
): ClubTask | null {
  const list = getStoredClubs();
  const club = list.find((c) => c.id === clubId);
  if (!club) return null;

  const newTask: ClubTask = {
    ...taskInput,
    id: `ctsk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };

  club.tasks.unshift(newTask);
  persistClubs(list);
  return newTask;
}

export function updateClubTaskStatus(
  clubId: string,
  taskId: string,
  newStatus: ClubTask['status'],
): ClubTask | null {
  const list = getStoredClubs();
  const club = list.find((c) => c.id === clubId);
  if (!club) return null;

  const task = club.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  task.status = newStatus;
  persistClubs(list);
  return task;
}

export function updateClubTask(
  clubId: string,
  taskId: string,
  updates: Partial<ClubTask>,
): ClubTask | null {
  const list = getStoredClubs();
  const club = list.find((c) => c.id === clubId);
  if (!club) return null;

  const task = club.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  Object.assign(task, updates);
  persistClubs(list);
  return task;
}

export function deleteClubTask(clubId: string, taskId: string): boolean {
  const list = getStoredClubs();
  const club = list.find((c) => c.id === clubId);
  if (!club) return false;

  const initialLen = club.tasks.length;
  club.tasks = club.tasks.filter((t) => t.id !== taskId);
  if (club.tasks.length === initialLen) return false;

  persistClubs(list);
  return true;
}

/**
 * Member Management: Invite, change role, remove member
 */
export function addClubMember(
  clubId: string,
  memberInput: Omit<ClubMember, 'id' | 'joinedDate' | 'activeScore'>,
): ClubMember | null {
  const list = getStoredClubs();
  const club = list.find((c) => c.id === clubId);
  if (!club) return null;

  const newMember: ClubMember = {
    ...memberInput,
    id: `cm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    joinedDate: new Date().toISOString().split('T')[0] ?? '2026-10-16',
    activeScore: 70,
  };

  club.members.push(newMember);
  persistClubs(list);
  return newMember;
}

export function updateClubMemberRole(
  clubId: string,
  memberId: string,
  newRole: ClubRole,
  newDepartment?: ClubDepartment,
): boolean {
  const list = getStoredClubs();
  const club = list.find((c) => c.id === clubId);
  if (!club) return false;

  const member = club.members.find((m) => m.id === memberId);
  if (!member) return false;

  member.role = newRole;
  if (newDepartment) member.department = newDepartment;

  persistClubs(list);
  return true;
}

export function removeClubMember(clubId: string, memberId: string): boolean {
  const list = getStoredClubs();
  const club = list.find((c) => c.id === clubId);
  if (!club) return false;

  const initLen = club.members.length;
  club.members = club.members.filter((m) => m.id !== memberId);
  if (club.members.length === initLen) return false;

  persistClubs(list);
  return true;
}

/**
 * React 18 Hook: useClubs
 */
export function useClubs() {
  const clubs = useSyncExternalStore(
    subscribe,
    getStoredClubs,
    () => getInitialClubs(),
  );

  const metrics = useMemo(() => getClubMetrics(clubs), [clubs]);

  const handleRecordTransaction = useCallback(
    (clubId: string, tx: Omit<ClubTransaction, 'id'>) => recordClubTransaction(clubId, tx),
    [],
  );

  const handleToggleRsvp = useCallback(
    (clubId: string, eventId: string, userId: string) => toggleClubEventRsvp(clubId, eventId, userId),
    [],
  );

  const handleCreateEvent = useCallback(
    (clubId: string, ev: Omit<ClubEvent, 'id' | 'attendeeIds'>) => createClubEvent(clubId, ev),
    [],
  );

  const handleCreateTask = useCallback(
    (clubId: string, task: Omit<ClubTask, 'id'>) => createClubTask(clubId, task),
    [],
  );

  const handleUpdateTaskStatus = useCallback(
    (clubId: string, taskId: string, status: ClubTask['status']) => updateClubTaskStatus(clubId, taskId, status),
    [],
  );

  const handleDeleteTask = useCallback(
    (clubId: string, taskId: string) => deleteClubTask(clubId, taskId),
    [],
  );

  const handleAddMember = useCallback(
    (clubId: string, member: Omit<ClubMember, 'id' | 'joinedDate' | 'activeScore'>) => addClubMember(clubId, member),
    [],
  );

  const handleUpdateMemberRole = useCallback(
    (clubId: string, memberId: string, role: ClubRole, dept?: ClubDepartment) => updateClubMemberRole(clubId, memberId, role, dept),
    [],
  );

  const handleRemoveMember = useCallback(
    (clubId: string, memberId: string) => removeClubMember(clubId, memberId),
    [],
  );

  const handleResetClubs = useCallback(() => resetClubsToDefault(), []);

  return {
    clubs,
    metrics,
    recordTransaction: handleRecordTransaction,
    toggleRsvp: handleToggleRsvp,
    createEvent: handleCreateEvent,
    createTask: handleCreateTask,
    updateTaskStatus: handleUpdateTaskStatus,
    deleteTask: handleDeleteTask,
    addMember: handleAddMember,
    updateMemberRole: handleUpdateMemberRole,
    removeMember: handleRemoveMember,
    resetClubs: handleResetClubs,
  };
}

/**
 * React 18 Hook: useClub (single club by ID)
 */
export function useClub(clubId: string) {
  const store = useClubs();
  const club = useMemo(() => store.clubs.find((c) => c.id === clubId), [store.clubs, clubId]);

  const treasury = useMemo(() => (club ? calculateClubTreasury(club) : null), [club]);

  return {
    ...store,
    club,
    treasury,
    recordTransaction: (tx: Omit<ClubTransaction, 'id'>) => store.recordTransaction(clubId, tx),
    toggleRsvp: (eventId: string, userId: string = 'ctc-m1') => store.toggleRsvp(clubId, eventId, userId),
    createEvent: (ev: Omit<ClubEvent, 'id' | 'attendeeIds'>) => store.createEvent(clubId, ev),
    createTask: (task: Omit<ClubTask, 'id'>) => store.createTask(clubId, task),
    updateTaskStatus: (taskId: string, status: ClubTask['status']) => store.updateTaskStatus(clubId, taskId, status),
    deleteTask: (taskId: string) => store.deleteTask(clubId, taskId),
    addMember: (member: Omit<ClubMember, 'id' | 'joinedDate' | 'activeScore'>) => store.addMember(clubId, member),
    updateMemberRole: (memberId: string, role: ClubRole, dept?: ClubDepartment) => store.updateMemberRole(clubId, memberId, role, dept),
    removeMember: (memberId: string) => store.removeMember(clubId, memberId),
  };
}

import { useSyncExternalStore, useCallback, useMemo } from 'react';
import {
  canManageWorkspaceRole,
  isLastOwnerChangeBlocked,
  hasWorkspacePermission,
  WORKSPACE_ROLES,
  WORKSPACE_PERMISSIONS,
  WORKSPACE_PERMISSION_MATRIX,
  type WorkspaceRole,
  type WorkspacePermission,
} from './workspace-permissions.ts';

export {
  canManageWorkspaceRole,
  isLastOwnerChangeBlocked,
  hasWorkspacePermission,
  WORKSPACE_ROLES,
  WORKSPACE_PERMISSIONS,
  WORKSPACE_PERMISSION_MATRIX,
};
export type { WorkspaceRole, WorkspacePermission };

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface WorkspaceSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface WorkspaceTaskAttachment {
  id: string;
  name: string;
  url: string;
  sizeBytes?: number;
  type?: string;
}

export interface WorkspaceTask {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  assigneeId?: string;
  status: 'todo' | 'doing' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  subtasks: WorkspaceSubtask[];
  createdAt: string;
  attachments?: WorkspaceTaskAttachment[];
}

export interface WorkspaceDocument {
  id: string;
  workspaceId: string;
  name: string;
  category: 'report' | 'slides' | 'source' | 'reference';
  fileSize: string;
  uploaderName: string;
  updatedAt: string;
  url?: string;
}

export interface WorkspaceActivityItem {
  id: string;
  workspaceId: string;
  actorName: string;
  actorAvatar: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface WorkspaceItem {
  id: string;
  name: string;
  description: string;
  courseCode: string;
  courseName: string;
  semester: string;
  type: 'project' | 'research' | 'competition';
  progressPercent: number;
  members: WorkspaceMember[];
  tasks: WorkspaceTask[];
  documents: WorkspaceDocument[];
  activities: WorkspaceActivityItem[];
  currentUserRole: WorkspaceRole;
}

export interface CreateWorkspaceInput {
  name: string;
  description: string;
  courseCode: string;
  courseName: string;
  semester: string;
  type: 'project' | 'research' | 'competition';
  initialRole?: WorkspaceRole;
}

export const WORKSPACE_STORAGE_KEY = 'campusos-workspaces-v2';
export const WORKSPACE_CHANGE_EVENT = 'campusos-workspaces-change';

/**
 * Calculate progress percent based on completed tasks
 */
export function calculateWorkspaceProgress(tasks: WorkspaceTask[]): number {
  if (!tasks || tasks.length === 0) return 0;
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  return Math.round((doneCount / tasks.length) * 100);
}

/**
 * 3 Realistic Vietnamese University Academic Workspaces
 */
export function getInitialWorkspaces(): WorkspaceItem[] {
  return [
    {
      id: 'ws-ai-capstone',
      name: 'Đồ án Tốt nghiệp - AI Campus Companion',
      description: 'Hệ thống trợ lý học tập thông minh tích hợp Agentic AI & phân tích dữ liệu học vụ thời gian thực cho sinh viên.',
      courseCode: 'IT4900',
      courseName: 'Đồ án Tốt nghiệp CNTT',
      semester: 'Học kỳ 1 - 2026',
      type: 'project',
      progressPercent: 67,
      currentUserRole: 'OWNER',
      members: [
        {
          id: 'mem-1',
          name: 'Nguyễn Văn Minh (Bạn)',
          email: 'minh.nv2101@sis.hust.edu.vn',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          role: 'OWNER',
          joinedAt: '2026-08-15T08:00:00Z',
        },
        {
          id: 'mem-2',
          name: 'Trần Thị Thu Lan',
          email: 'lan.ttt2104@sis.hust.edu.vn',
          avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
          role: 'ADMIN',
          joinedAt: '2026-08-15T08:30:00Z',
        },
        {
          id: 'mem-3',
          name: 'Lê Hoàng Nam',
          email: 'nam.lh2109@sis.hust.edu.vn',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
          role: 'MEMBER',
          joinedAt: '2026-08-16T09:00:00Z',
        },
        {
          id: 'mem-4',
          name: 'TS. Phạm Anh Tuấn (GVHD)',
          email: 'tuan.pa@soict.hust.edu.vn',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
          role: 'VIEWER',
          joinedAt: '2026-08-20T14:00:00Z',
        },
      ],
      tasks: [
        {
          id: 'task-101',
          workspaceId: 'ws-ai-capstone',
          title: 'Hoàn thiện kiến trúc Hybrid State Sync & IndexedDB Fallback',
          description: 'Xây dựng cơ chế đồng bộ debounced với Supabase và offline-first qua localStorage.',
          assigneeId: 'mem-1',
          status: 'done',
          priority: 'high',
          dueDate: '2026-10-10',
          subtasks: [
            { id: 'sub-1', title: 'Thiết kế Event bus', completed: true },
            { id: 'sub-2', title: 'Cache layer local storage', completed: true },
            { id: 'sub-3', title: 'Stress test 50 req/s', completed: true },
          ],
          createdAt: '2026-09-25T10:00:00Z',
        },
        {
          id: 'task-102',
          workspaceId: 'ws-ai-capstone',
          title: 'Thiết kế Toon Mascot 3D tương tác Squash & Stretch',
          description: 'Áp dụng nguyên lý hoạt họa Disney/Pixar, vật lý lò xo jiggle cho tai/má/bụng mèo Leo.',
          assigneeId: 'mem-2',
          status: 'done',
          priority: 'high',
          dueDate: '2026-10-14',
          subtasks: [
            { id: 'sub-4', title: 'Mô hình hóa Three.js mesh', completed: true },
            { id: 'sub-5', title: 'Physics spring damper', completed: true },
          ],
          createdAt: '2026-10-01T08:00:00Z',
        },
        {
          id: 'task-103',
          workspaceId: 'ws-ai-capstone',
          title: 'Tối ưu hóa chỉ số LCP & FID dưới 1.2s trên thiết bị di động',
          description: 'Phân tách bundle, lazy-load các module 3D và tối ưu hóa CSS animations.',
          assigneeId: 'mem-3',
          status: 'doing',
          priority: 'medium',
          dueDate: '2026-10-22',
          subtasks: [
            { id: 'sub-6', title: 'Phân tích Webpack bundle analyzer', completed: true },
            { id: 'sub-7', title: 'Dynamic import Three.js components', completed: false },
          ],
          createdAt: '2026-10-05T09:30:00Z',
        },
        {
          id: 'task-104',
          workspaceId: 'ws-ai-capstone',
          title: 'Kiểm thử hộp đen & Kiểm thử tải API Agent AI',
          description: 'Viết kịch bản stress test mô phỏng 100 sinh viên truy vấn cùng lúc.',
          assigneeId: 'mem-2',
          status: 'doing',
          priority: 'high',
          dueDate: '2026-10-25',
          subtasks: [
            { id: 'sub-8', title: 'Kịch bản Artillery / k6', completed: false },
            { id: 'sub-9', title: 'Đánh giá độ trễ p99', completed: false },
          ],
          createdAt: '2026-10-08T11:00:00Z',
        },
        {
          id: 'task-105',
          workspaceId: 'ws-ai-capstone',
          title: 'Biên soạn Đề cương chi tiết Báo cáo Đồ án Tốt nghiệp',
          description: 'Tổng hợp cấu trúc 5 chương theo quy định của Viện CNTT.',
          assigneeId: 'mem-1',
          status: 'review',
          priority: 'medium',
          dueDate: '2026-10-28',
          subtasks: [
            { id: 'sub-10', title: 'Dự thảo Chương 1 & 2', completed: true },
            { id: 'sub-11', title: 'Xin ý kiến phản biện GVHD', completed: false },
          ],
          createdAt: '2026-10-10T14:20:00Z',
        },
        {
          id: 'task-106',
          workspaceId: 'ws-ai-capstone',
          title: 'Chuẩn bị Slide & Video Demo bảo vệ thử nghiệm đợt 1',
          description: 'Quay screencast 5 phút thể hiện toàn bộ tính năng cốt lõi của CampusOS.',
          status: 'todo',
          priority: 'low',
          dueDate: '2026-11-05',
          subtasks: [
            { id: 'sub-12', title: 'Soạn outline slide thuyết trình', completed: false },
            { id: 'sub-13', title: 'Thu âm voice-over tiếng Việt', completed: false },
          ],
          createdAt: '2026-10-12T16:00:00Z',
        },
      ],
      documents: [
        {
          id: 'doc-101',
          workspaceId: 'ws-ai-capstone',
          name: 'De-cuong-Do-an-Tot-nghiep-AI-CampusOS-v2.pdf',
          category: 'report',
          fileSize: '4.8 MB',
          uploaderName: 'Nguyễn Văn Minh',
          updatedAt: '2026-10-11T10:30:00Z',
          url: '#',
        },
        {
          id: 'doc-102',
          workspaceId: 'ws-ai-capstone',
          name: 'Slide-Bao-cao-Tien-do-Tuan-8.pptx',
          category: 'slides',
          fileSize: '12.4 MB',
          uploaderName: 'Trần Thị Thu Lan',
          updatedAt: '2026-10-13T15:00:00Z',
          url: '#',
        },
        {
          id: 'doc-103',
          workspaceId: 'ws-ai-capstone',
          name: 'campusos-ai-core-engine-v1.4.zip',
          category: 'source',
          fileSize: '38.2 MB',
          uploaderName: 'Lê Hoàng Nam',
          updatedAt: '2026-10-14T09:15:00Z',
          url: '#',
        },
        {
          id: 'doc-104',
          workspaceId: 'ws-ai-capstone',
          name: 'Huong-dan-trinh-bay-khoa-luan-2026.pdf',
          category: 'reference',
          fileSize: '1.2 MB',
          uploaderName: 'TS. Phạm Anh Tuấn',
          updatedAt: '2026-08-25T11:00:00Z',
          url: '#',
        },
      ],
      activities: [
        {
          id: 'act-101',
          workspaceId: 'ws-ai-capstone',
          actorName: 'Nguyễn Văn Minh',
          actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          action: 'đã hoàn thành nhiệm vụ',
          target: 'Hoàn thiện kiến trúc Hybrid State Sync',
          timestamp: '2026-10-10T11:20:00Z',
        },
        {
          id: 'act-102',
          workspaceId: 'ws-ai-capstone',
          actorName: 'Trần Thị Thu Lan',
          actorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
          action: 'đã tải lên tài liệu',
          target: 'Slide-Bao-cao-Tien-do-Tuan-8.pptx',
          timestamp: '2026-10-13T15:02:00Z',
        },
        {
          id: 'act-103',
          workspaceId: 'ws-ai-capstone',
          actorName: 'Nguyễn Văn Minh',
          actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          action: 'đã chuyển sang trạng thái Chờ review',
          target: 'Biên soạn Đề cương chi tiết Báo cáo Đồ án Tốt nghiệp',
          timestamp: '2026-10-14T16:45:00Z',
        },
      ],
    },
    {
      id: 'ws-net-design',
      name: 'Mạng máy tính - Thiết kế hệ thống mạng doanh nghiệp',
      description: 'Đồ án môn học: Quy hoạch VLAN, định tuyến OSPF đa vùng, triển khai tường lửa pfSense và dịch vụ mạng nội bộ.',
      courseCode: 'IT3080',
      courseName: 'Mạng máy tính',
      semester: 'Học kỳ 1 - 2026',
      type: 'project',
      progressPercent: 40,
      currentUserRole: 'ADMIN',
      members: [
        {
          id: 'mem-21',
          name: 'Đặng Tuấn Kiệt',
          email: 'kiet.dt2102@sis.hust.edu.vn',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
          role: 'OWNER',
          joinedAt: '2026-09-01T08:00:00Z',
        },
        {
          id: 'mem-1',
          name: 'Nguyễn Văn Minh (Bạn)',
          email: 'minh.nv2101@sis.hust.edu.vn',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          role: 'ADMIN',
          joinedAt: '2026-09-01T08:30:00Z',
        },
        {
          id: 'mem-22',
          name: 'Vũ Minh Trang',
          email: 'trang.vm2105@sis.hust.edu.vn',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
          role: 'MEMBER',
          joinedAt: '2026-09-02T10:00:00Z',
        },
      ],
      tasks: [
        {
          id: 'task-201',
          workspaceId: 'ws-net-design',
          title: 'Phân chia không gian địa chỉ IPv4 VLSM & IPv6 Prefix',
          description: 'Tính toán subnetting cho 6 phòng ban với 450 máy trạm và 30 máy chủ.',
          assigneeId: 'mem-1',
          status: 'done',
          priority: 'high',
          dueDate: '2026-10-05',
          subtasks: [
            { id: 'sub-201', title: 'Bảng quy hoạch IP', completed: true },
            { id: 'sub-202', title: 'Bảo lưu dải IP dự phòng', completed: true },
          ],
          createdAt: '2026-09-15T08:00:00Z',
        },
        {
          id: 'task-202',
          workspaceId: 'ws-net-design',
          title: 'Cấu hình Cisco Packet Tracer: VLAN, Trunking 802.1Q và Router-on-a-stick',
          description: 'Tạo topology mô phỏng 3 switch Layer 2 và 1 router biên.',
          assigneeId: 'mem-21',
          status: 'done',
          priority: 'medium',
          dueDate: '2026-10-12',
          subtasks: [
            { id: 'sub-203', title: 'VLAN 10, 20, 30, 99', completed: true },
            { id: 'sub-204', title: 'DHCP Helper Address', completed: true },
          ],
          createdAt: '2026-09-20T09:00:00Z',
        },
        {
          id: 'task-203',
          workspaceId: 'ws-net-design',
          title: 'Triển khai OSPF Multi-Area trên hệ thống Router Cisco IOS',
          description: 'Thiết lập Area 0 Backbone và Area 1 Chi nhánh.',
          assigneeId: 'mem-1',
          status: 'doing',
          priority: 'high',
          dueDate: '2026-10-26',
          subtasks: [
            { id: 'sub-205', title: 'Cấu hình Router-ID và Passive Interface', completed: true },
            { id: 'sub-206', title: 'Xác thực MD5 OSPF', completed: false },
          ],
          createdAt: '2026-10-01T10:00:00Z',
        },
        {
          id: 'task-204',
          workspaceId: 'ws-net-design',
          title: 'Cấu hình NAT Overload (PAT) và Access Control List (ACL)',
          description: 'Ngăn chặn VLAN khách truy cập dải máy chủ nội bộ.',
          assigneeId: 'mem-22',
          status: 'todo',
          priority: 'medium',
          dueDate: '2026-10-30',
          subtasks: [
            { id: 'sub-207', title: 'Standard & Extended ACLs', completed: false },
          ],
          createdAt: '2026-10-05T14:00:00Z',
        },
        {
          id: 'task-205',
          workspaceId: 'ws-net-design',
          title: 'Viết báo cáo kỹ thuật và đo kiểm thông lượng mạng iPerf3',
          description: 'Tổng hợp sơ đồ đấu nối và file .pkt nộp hệ thống LMS.',
          status: 'todo',
          priority: 'low',
          dueDate: '2026-11-08',
          subtasks: [],
          createdAt: '2026-10-10T08:00:00Z',
        },
      ],
      documents: [
        {
          id: 'doc-201',
          workspaceId: 'ws-net-design',
          name: 'Topology-Do-an-Mang-Doanh-Nghiep.pkt',
          category: 'source',
          fileSize: '2.1 MB',
          uploaderName: 'Đặng Tuấn Kiệt',
          updatedAt: '2026-10-12T16:00:00Z',
          url: '#',
        },
        {
          id: 'doc-202',
          workspaceId: 'ws-net-design',
          name: 'Bang-Phan-Chia-Subnet-VLSM.xlsx',
          category: 'report',
          fileSize: '320 KB',
          uploaderName: 'Nguyễn Văn Minh',
          updatedAt: '2026-10-05T14:30:00Z',
          url: '#',
        },
        {
          id: 'doc-203',
          workspaceId: 'ws-net-design',
          name: 'Cisco-CCNA-Enterprise-Networking-Guide.pdf',
          category: 'reference',
          fileSize: '18.5 MB',
          uploaderName: 'Vũ Minh Trang',
          updatedAt: '2026-09-10T10:00:00Z',
          url: '#',
        },
      ],
      activities: [
        {
          id: 'act-201',
          workspaceId: 'ws-net-design',
          actorName: 'Đặng Tuấn Kiệt',
          actorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
          action: 'đã hoàn thành nhiệm vụ',
          target: 'Cấu hình Cisco Packet Tracer: VLAN, Trunking 802.1Q',
          timestamp: '2026-10-12T16:05:00Z',
        },
      ],
    },
    {
      id: 'ws-vision-nckh',
      name: 'Nghiên cứu khoa học - Học máy thị giác cho Y tế số',
      description: 'Phát hiện sớm tổn thương phổi trên ảnh X-Quang lồng ngực sử dụng Vision Transformer (ViT) và Self-Supervised Learning.',
      courseCode: 'NCKH2026',
      courseName: 'Nghiên cứu khoa học SV',
      semester: 'Năm học 2026-2027',
      type: 'research',
      progressPercent: 75,
      currentUserRole: 'OWNER',
      members: [
        {
          id: 'mem-1',
          name: 'Nguyễn Văn Minh (Bạn)',
          email: 'minh.nv2101@sis.hust.edu.vn',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          role: 'OWNER',
          joinedAt: '2026-07-01T08:00:00Z',
        },
        {
          id: 'mem-31',
          name: 'Hoàng Quốc Bảo',
          email: 'bao.hq2106@sis.hust.edu.vn',
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
          role: 'MANAGER',
          joinedAt: '2026-07-05T09:00:00Z',
        },
        {
          id: 'mem-32',
          name: 'ThS. Nguyễn Diệu Linh',
          email: 'linh.nd@vinbrain.net',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
          role: 'VIEWER',
          joinedAt: '2026-07-15T14:00:00Z',
        },
      ],
      tasks: [
        {
          id: 'task-301',
          workspaceId: 'ws-vision-nckh',
          title: 'Tiền xử lý tập dữ liệu NIH ChestX-ray14 & Augmentation',
          description: 'Cân bằng histogram CLAHE, chuẩn hóa kích thước 512x512 và chia fold 5-fold cross validation.',
          assigneeId: 'mem-1',
          status: 'done',
          priority: 'high',
          dueDate: '2026-08-30',
          subtasks: [
            { id: 'sub-301', title: 'Lọc bỏ ảnh nhiễu', completed: true },
            { id: 'sub-302', title: 'Data augmentation pipeline', completed: true },
          ],
          createdAt: '2026-08-01T08:00:00Z',
        },
        {
          id: 'task-302',
          workspaceId: 'ws-vision-nckh',
          title: 'Fine-tune mô hình Swin-Transformer Base với Cosine Annealing',
          description: 'Huấn luyện trên 4x GPU A100 qua cluster Viện Tin học.',
          assigneeId: 'mem-31',
          status: 'done',
          priority: 'high',
          dueDate: '2026-09-25',
          subtasks: [
            { id: 'sub-303', title: 'Cấu hình Mixed Precision FP16', completed: true },
            { id: 'sub-304', title: 'Log chỉ số qua Weights & Biases', completed: true },
          ],
          createdAt: '2026-09-01T10:00:00Z',
        },
        {
          id: 'task-303',
          workspaceId: 'ws-vision-nckh',
          title: 'Tạo bản đồ giải thích quyết định Grad-CAM++ & So sánh F1-Score',
          description: 'Vẽ heatmap định vị vùng tổn thương để bác sĩ đối chiếu.',
          assigneeId: 'mem-1',
          status: 'done',
          priority: 'medium',
          dueDate: '2026-10-15',
          subtasks: [
            { id: 'sub-305', title: 'Tính AUC-ROC đa nhãn', completed: true },
            { id: 'sub-306', title: 'Export Grad-CAM overlays', completed: true },
          ],
          createdAt: '2026-09-28T11:00:00Z',
        },
        {
          id: 'task-304',
          workspaceId: 'ws-vision-nckh',
          title: 'Hoàn thiện bản thảo bài báo khoa học chuẩn bị submit IEEE RIVF',
          description: 'Soạn thảo bằng LaTeX theo template 2 cột của IEEE Conference.',
          assigneeId: 'mem-1',
          status: 'doing',
          priority: 'high',
          dueDate: '2026-11-15',
          subtasks: [
            { id: 'sub-307', title: 'Viết phần Methodology & Experiments', completed: true },
            { id: 'sub-308', title: 'So sánh SOTA với DenseNet-121', completed: false },
          ],
          createdAt: '2026-10-02T15:00:00Z',
        },
      ],
      documents: [
        {
          id: 'doc-301',
          workspaceId: 'ws-vision-nckh',
          name: 'Draft-Paper-SwinViT-ChestXRay-v1.pdf',
          category: 'report',
          fileSize: '3.4 MB',
          uploaderName: 'Nguyễn Văn Minh',
          updatedAt: '2026-10-14T20:00:00Z',
          url: '#',
        },
        {
          id: 'doc-302',
          workspaceId: 'ws-vision-nckh',
          name: 'Slide-Seminars-AI-Health-October.pdf',
          category: 'slides',
          fileSize: '8.9 MB',
          uploaderName: 'Hoàng Quốc Bảo',
          updatedAt: '2026-10-12T09:00:00Z',
          url: '#',
        },
        {
          id: 'doc-303',
          workspaceId: 'ws-vision-nckh',
          name: 'swin_chest_xray_model_best_auc92.pt',
          category: 'source',
          fileSize: '345 MB',
          uploaderName: 'Hoàng Quốc Bảo',
          updatedAt: '2026-09-26T18:00:00Z',
          url: '#',
        },
        {
          id: 'doc-304',
          workspaceId: 'ws-vision-nckh',
          name: 'IEEE-Conference-Template-LaTeX.zip',
          category: 'reference',
          fileSize: '850 KB',
          uploaderName: 'ThS. Nguyễn Diệu Linh',
          updatedAt: '2026-07-20T11:00:00Z',
          url: '#',
        },
      ],
      activities: [
        {
          id: 'act-301',
          workspaceId: 'ws-vision-nckh',
          actorName: 'Nguyễn Văn Minh',
          actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          action: 'đã hoàn thành nhiệm vụ',
          target: 'Tạo bản đồ giải thích quyết định Grad-CAM++',
          timestamp: '2026-10-15T10:12:00Z',
        },
      ],
    },
  ];
}

type Subscriber = () => void;
const subscribers = new Set<Subscriber>();
let memoryWorkspaces: WorkspaceItem[] | null = null;

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('[WorkspaceEngine] Subscriber error:', e);
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
    if (event.key === WORKSPACE_STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (Array.isArray(parsed)) {
          memoryWorkspaces = parsed;
          notifySubscribers();
        }
      } catch (err) {
        console.warn('[WorkspaceEngine] Failed to parse cross-tab storage:', err);
      }
    }
  });

  window.addEventListener(WORKSPACE_CHANGE_EVENT, (event: Event) => {
    const custom = event as CustomEvent<WorkspaceItem[]>;
    if (custom.detail && custom.detail !== memoryWorkspaces) {
      memoryWorkspaces = custom.detail;
      notifySubscribers();
    }
  });
}

/**
 * Read workspaces from localStorage or default seed
 */
export function getStoredWorkspaces(): WorkspaceItem[] {
  if (typeof window === 'undefined') {
    if (!memoryWorkspaces) {
      memoryWorkspaces = getInitialWorkspaces();
    }
    return memoryWorkspaces;
  }
  if (memoryWorkspaces) {
    return memoryWorkspaces;
  }
  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialWorkspaces();
      memoryWorkspaces = initial;
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      memoryWorkspaces = parsed;
      return parsed;
    }
    const initial = getInitialWorkspaces();
    memoryWorkspaces = initial;
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    memoryWorkspaces = getInitialWorkspaces();
    return memoryWorkspaces;
  }
}

/**
 * Persist workspaces and dispatch change event
 */
export function persistWorkspaces(workspaces: WorkspaceItem[]): void {
  // Clone array and deep-clone workspace items to guarantee referential change for useSyncExternalStore
  memoryWorkspaces = workspaces.map((ws) => ({
    ...ws,
    members: [...ws.members],
    tasks: ws.tasks.map((t) => ({ ...t, subtasks: [...t.subtasks] })),
    documents: [...ws.documents],
    activities: [...ws.activities],
  }));

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(memoryWorkspaces));
      window.dispatchEvent(new CustomEvent(WORKSPACE_CHANGE_EVENT, { detail: memoryWorkspaces }));
    } catch (err) {
      console.error('Failed to persist workspaces to localStorage:', err);
    }
  }
  notifySubscribers();
}

/**
 * Reset all workspaces to defaults
 */
export function resetWorkspacesToDefault(): WorkspaceItem[] {
  memoryWorkspaces = null;
  const initial = getInitialWorkspaces();
  persistWorkspaces(initial);
  return memoryWorkspaces || initial;
}

/**
 * Retrieve a workspace by ID
 */
export function getWorkspaceById(id: string): WorkspaceItem | undefined {
  const list = getStoredWorkspaces();
  return list.find((w) => w.id === id);
}

/**
 * Create a new workspace
 */
export function createWorkspace(input: CreateWorkspaceInput): WorkspaceItem {
  const list = getStoredWorkspaces();
  const id = `ws-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const currentUserRole: WorkspaceRole = input.initialRole || 'OWNER';

  const newWorkspace: WorkspaceItem = {
    id,
    name: input.name.trim(),
    description: input.description.trim(),
    courseCode: input.courseCode.trim().toUpperCase(),
    courseName: input.courseName.trim(),
    semester: input.semester.trim(),
    type: input.type,
    progressPercent: 0,
    currentUserRole,
    members: [
      {
        id: `mem-${Date.now()}`,
        name: 'Nguyễn Văn Minh (Bạn)',
        email: 'minh.nv2101@sis.hust.edu.vn',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        role: currentUserRole,
        joinedAt: new Date().toISOString(),
      },
    ],
    tasks: [],
    documents: [],
    activities: [
      {
        id: `act-${Date.now()}`,
        workspaceId: id,
        actorName: 'Nguyễn Văn Minh',
        actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        action: 'đã khởi tạo nhóm',
        target: input.name.trim(),
        timestamp: new Date().toISOString(),
      },
    ],
  };

  list.unshift(newWorkspace);
  persistWorkspaces(list);
  return newWorkspace;
}

/**
 * Update an existing workspace
 */
export function updateWorkspace(id: string, updates: Partial<WorkspaceItem>): WorkspaceItem | undefined {
  const list = getStoredWorkspaces();
  const index = list.findIndex((w) => w.id === id);
  if (index === -1) return undefined;

  const current = list[index];
  if (!current) return undefined;

  const updated: WorkspaceItem = {
    ...current,
    ...updates,
    progressPercent: updates.tasks ? calculateWorkspaceProgress(updates.tasks) : current.progressPercent,
  };

  list[index] = updated;
  persistWorkspaces(list);
  return updated;
}

/**
 * Delete a workspace
 */
export function deleteWorkspace(id: string): boolean {
  const list = getStoredWorkspaces();
  const filtered = list.filter((w) => w.id !== id);
  if (filtered.length === list.length) return false;
  persistWorkspaces(filtered);
  return true;
}

/**
 * Create a task inside a workspace
 */
export function createWorkspaceTask(
  workspaceId: string,
  taskInput: Omit<WorkspaceTask, 'id' | 'workspaceId' | 'createdAt'>,
): WorkspaceTask | null {
  const list = getStoredWorkspaces();
  const ws = list.find((w) => w.id === workspaceId);
  if (!ws) return null;

  const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newTask: WorkspaceTask = {
    ...taskInput,
    id: taskId,
    workspaceId,
    createdAt: new Date().toISOString(),
  };

  ws.tasks.push(newTask);
  ws.progressPercent = calculateWorkspaceProgress(ws.tasks);

  ws.activities.unshift({
    id: `act-${Date.now()}`,
    workspaceId,
    actorName: 'Nguyễn Văn Minh',
    actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    action: 'đã tạo nhiệm vụ',
    target: newTask.title,
    timestamp: new Date().toISOString(),
  });

  persistWorkspaces(list);
  return newTask;
}

/**
 * Update an existing task in a workspace
 */
export function updateWorkspaceTask(
  workspaceId: string,
  taskId: string,
  updates: Partial<WorkspaceTask>,
): WorkspaceTask | null {
  const list = getStoredWorkspaces();
  const ws = list.find((w) => w.id === workspaceId);
  if (!ws) return null;

  const taskIndex = ws.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) return null;

  const currentTask = ws.tasks[taskIndex];
  if (!currentTask) return null;

  const updatedTask: WorkspaceTask = {
    ...currentTask,
    ...updates,
  };

  ws.tasks[taskIndex] = updatedTask;
  ws.progressPercent = calculateWorkspaceProgress(ws.tasks);

  persistWorkspaces(list);
  return updatedTask;
}

/**
 * Move a task to a new Kanban column
 */
export function moveWorkspaceTask(
  workspaceId: string,
  taskId: string,
  newStatus: WorkspaceTask['status'],
): WorkspaceTask | null {
  const list = getStoredWorkspaces();
  const ws = list.find((w) => w.id === workspaceId);
  if (!ws) return null;

  const task = ws.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const oldStatus = task.status;
  if (oldStatus === newStatus) return task;

  task.status = newStatus;
  ws.progressPercent = calculateWorkspaceProgress(ws.tasks);

  const statusMap: Record<WorkspaceTask['status'], string> = {
    todo: 'Cần làm',
    doing: 'Đang làm',
    review: 'Chờ review',
    done: 'Hoàn thành',
  };

  ws.activities.unshift({
    id: `act-${Date.now()}`,
    workspaceId,
    actorName: 'Nguyễn Văn Minh',
    actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    action: `đã chuyển trạng thái sang "${statusMap[newStatus]}"`,
    target: task.title,
    timestamp: new Date().toISOString(),
  });

  persistWorkspaces(list);
  return task;
}

/**
 * Toggle a subtask completion status
 */
export function toggleWorkspaceSubtask(
  workspaceId: string,
  taskId: string,
  subtaskId: string,
): WorkspaceTask | null {
  const list = getStoredWorkspaces();
  const ws = list.find((w) => w.id === workspaceId);
  if (!ws) return null;

  const task = ws.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const subtask = task.subtasks.find((s) => s.id === subtaskId);
  if (!subtask) return null;

  subtask.completed = !subtask.completed;
  persistWorkspaces(list);
  return task;
}

/**
 * Delete a task from a workspace
 */
export function deleteWorkspaceTask(workspaceId: string, taskId: string): boolean {
  const list = getStoredWorkspaces();
  const ws = list.find((w) => w.id === workspaceId);
  if (!ws) return false;

  const initialLength = ws.tasks.length;
  const deletedTask = ws.tasks.find((t) => t.id === taskId);
  ws.tasks = ws.tasks.filter((t) => t.id !== taskId);

  if (ws.tasks.length === initialLength) return false;

  ws.progressPercent = calculateWorkspaceProgress(ws.tasks);

  if (deletedTask) {
    ws.activities.unshift({
      id: `act-${Date.now()}`,
      workspaceId,
      actorName: 'Nguyễn Văn Minh',
      actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      action: 'đã xóa nhiệm vụ',
      target: deletedTask.title,
      timestamp: new Date().toISOString(),
    });
  }

  persistWorkspaces(list);
  return true;
}

/**
 * Add a document to a workspace
 */
export function addWorkspaceDocument(
  workspaceId: string,
  docInput: Omit<WorkspaceDocument, 'id' | 'workspaceId' | 'updatedAt'>,
): WorkspaceDocument | null {
  const list = getStoredWorkspaces();
  const ws = list.find((w) => w.id === workspaceId);
  if (!ws) return null;

  const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newDoc: WorkspaceDocument = {
    ...docInput,
    id: docId,
    workspaceId,
    updatedAt: new Date().toISOString(),
  };

  ws.documents.unshift(newDoc);

  ws.activities.unshift({
    id: `act-${Date.now()}`,
    workspaceId,
    actorName: docInput.uploaderName || 'Nguyễn Văn Minh',
    actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    action: 'đã tải lên tài liệu',
    target: newDoc.name,
    timestamp: new Date().toISOString(),
  });

  persistWorkspaces(list);
  return newDoc;
}

/**
 * Delete a document from a workspace
 */
export function deleteWorkspaceDocument(workspaceId: string, docId: string): boolean {
  const list = getStoredWorkspaces();
  const ws = list.find((w) => w.id === workspaceId);
  if (!ws) return false;

  const initialLength = ws.documents.length;
  const deletedDoc = ws.documents.find((d) => d.id === docId);
  ws.documents = ws.documents.filter((d) => d.id !== docId);

  if (ws.documents.length === initialLength) return false;

  if (deletedDoc) {
    ws.activities.unshift({
      id: `act-${Date.now()}`,
      workspaceId,
      actorName: 'Nguyễn Văn Minh',
      actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      action: 'đã gỡ bỏ tài liệu',
      target: deletedDoc.name,
      timestamp: new Date().toISOString(),
    });
  }

  persistWorkspaces(list);
  return true;
}

/**
 * Invite a member to a workspace
 */
export function inviteWorkspaceMember(
  workspaceId: string,
  memberInput: Omit<WorkspaceMember, 'id' | 'joinedAt'>,
): WorkspaceMember | null {
  const list = getStoredWorkspaces();
  const ws = list.find((w) => w.id === workspaceId);
  if (!ws) return null;

  const memberId = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newMember: WorkspaceMember = {
    ...memberInput,
    id: memberId,
    joinedAt: new Date().toISOString(),
  };

  ws.members.push(newMember);

  ws.activities.unshift({
    id: `act-${Date.now()}`,
    workspaceId,
    actorName: 'Nguyễn Văn Minh',
    actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    action: 'đã mời thành viên mới',
    target: `${newMember.name} (${newMember.role})`,
    timestamp: new Date().toISOString(),
  });

  persistWorkspaces(list);
  return newMember;
}

/**
 * Change member role with strict RBAC enforcement
 */
export function changeWorkspaceMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: WorkspaceRole,
  actorRole: WorkspaceRole,
): { success: boolean; error?: string; member?: WorkspaceMember } {
  const list = getStoredWorkspaces();
  const ws = list.find((w) => w.id === workspaceId);
  if (!ws) return { success: false, error: 'Không tìm thấy nhóm' };

  const member = ws.members.find((m) => m.id === memberId);
  if (!member) return { success: false, error: 'Không tìm thấy thành viên' };

  if (member.role === newRole) {
    return { success: true, member };
  }

  // RBAC check: can actor manage target's current and next role?
  if (!canManageWorkspaceRole(actorRole, member.role, newRole)) {
    return {
      success: false,
      error: `Bạn (${actorRole}) không có quyền thay đổi vai trò của ${member.name} từ ${member.role} sang ${newRole}.`,
    };
  }

  // Last OWNER protection check
  if (member.role === 'OWNER' && newRole !== 'OWNER') {
    const ownerCount = ws.members.filter((m) => m.role === 'OWNER').length;
    if (isLastOwnerChangeBlocked('OWNER', ownerCount)) {
      return {
        success: false,
        error: 'Không thể hạ cấp OWNER duy nhất của nhóm. Hãy bổ nhiệm một OWNER khác trước.',
      };
    }
  }

  const oldRole = member.role;
  member.role = newRole;

  ws.activities.unshift({
    id: `act-${Date.now()}`,
    workspaceId,
    actorName: 'Nguyễn Văn Minh',
    actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    action: `đã thay đổi vai trò từ ${oldRole} thành ${newRole}`,
    target: member.name,
    timestamp: new Date().toISOString(),
  });

  persistWorkspaces(list);
  return { success: true, member };
}

/**
 * Remove a member with strict RBAC enforcement
 */
export function removeWorkspaceMember(
  workspaceId: string,
  memberId: string,
  actorRole: WorkspaceRole,
): { success: boolean; error?: string } {
  const list = getStoredWorkspaces();
  const ws = list.find((w) => w.id === workspaceId);
  if (!ws) return { success: false, error: 'Không tìm thấy nhóm' };

  const member = ws.members.find((m) => m.id === memberId);
  if (!member) return { success: false, error: 'Không tìm thấy thành viên' };

  // Actor cannot remove if cannot manage role
  if (!canManageWorkspaceRole(actorRole, member.role)) {
    return {
      success: false,
      error: `Bạn (${actorRole}) không có quyền xóa thành viên có vai trò ${member.role}.`,
    };
  }

  // Protect last OWNER
  if (member.role === 'OWNER') {
    const ownerCount = ws.members.filter((m) => m.role === 'OWNER').length;
    if (isLastOwnerChangeBlocked('OWNER', ownerCount)) {
      return {
        success: false,
        error: 'Không thể xóa OWNER duy nhất của nhóm.',
      };
    }
  }

  const removedName = member.name;
  ws.members = ws.members.filter((m) => m.id !== memberId);

  ws.activities.unshift({
    id: `act-${Date.now()}`,
    workspaceId,
    actorName: 'Nguyễn Văn Minh',
    actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    action: 'đã xóa thành viên',
    target: removedName,
    timestamp: new Date().toISOString(),
  });

  persistWorkspaces(list);
  return { success: true };
}

/**
 * Calculate summary metrics across all workspaces
 */
export function getWorkspaceMetrics(workspaces: WorkspaceItem[]): {
  totalWorkspaces: number;
  pendingTasks: number;
  completedTasks: number;
  nearestDeadline: string | null;
  totalMembers: number;
  completionRate: number;
} {
  const totalWorkspaces = workspaces.length;
  let pendingTasks = 0;
  let completedTasks = 0;
  const uniqueMemberEmails = new Set<string>();
  let nearestDate: Date | null = null;
  const now = new Date();

  for (const ws of workspaces) {
    for (const m of ws.members) {
      if (m.email) uniqueMemberEmails.add(m.email);
    }
    for (const t of ws.tasks) {
      if (t.status === 'done') {
        completedTasks++;
      } else {
        pendingTasks++;
        if (t.dueDate) {
          const d = new Date(t.dueDate);
          if (!isNaN(d.getTime()) && d >= now) {
            if (!nearestDate || d < nearestDate) {
              nearestDate = d;
            }
          }
        }
      }
    }
  }

  const allTasksCount = pendingTasks + completedTasks;
  const completionRate = allTasksCount > 0 ? Math.round((completedTasks / allTasksCount) * 100) : 0;

  return {
    totalWorkspaces,
    pendingTasks,
    completedTasks,
    nearestDeadline: nearestDate ? nearestDate.toISOString().split('T')[0] ?? null : null,
    totalMembers: uniqueMemberEmails.size,
    completionRate,
  };
}

/**
 * Add an activity log entry to a workspace
 */
export function addWorkspaceActivity(
  workspaceId: string,
  activityInput: Omit<WorkspaceActivityItem, 'id' | 'workspaceId' | 'timestamp'>
): WorkspaceActivityItem | null {
  const list = getStoredWorkspaces();
  const ws = list.find((w) => w.id === workspaceId);
  if (!ws) return null;

  const newActivity: WorkspaceActivityItem = {
    ...activityInput,
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    workspaceId,
    timestamp: new Date().toISOString(),
  };

  ws.activities.unshift(newActivity);
  persistWorkspaces(list);
  return newActivity;
}

// Aliases matching standard naming conventions
export const getWorkspaces = getStoredWorkspaces;
export const saveWorkspaces = persistWorkspaces;
export const resetWorkspaces = resetWorkspacesToDefault;
export const addWorkspaceTask = createWorkspaceTask;
export const addWorkspaceMember = inviteWorkspaceMember;
export const updateWorkspaceMemberRole = changeWorkspaceMemberRole;

/**
 * React 18 hook to subscribe to workspaces state with zero-lag tear-free external store syncing.
 */
export function useWorkspaces(): {
  workspaces: WorkspaceItem[];
  metrics: ReturnType<typeof getWorkspaceMetrics>;
  createWorkspace: (input: CreateWorkspaceInput) => WorkspaceItem;
  updateWorkspace: (id: string, updates: Partial<WorkspaceItem>) => WorkspaceItem | undefined;
  deleteWorkspace: (id: string) => boolean;
  createTask: (workspaceId: string, taskInput: Omit<WorkspaceTask, 'id' | 'workspaceId' | 'createdAt'>) => WorkspaceTask | null;
  updateTask: (workspaceId: string, taskId: string, updates: Partial<WorkspaceTask>) => WorkspaceTask | null;
  moveTask: (workspaceId: string, taskId: string, newStatus: WorkspaceTask['status']) => WorkspaceTask | null;
  deleteTask: (workspaceId: string, taskId: string) => boolean;
  toggleSubtask: (workspaceId: string, taskId: string, subtaskId: string) => WorkspaceTask | null;
  addDocument: (workspaceId: string, docInput: Omit<WorkspaceDocument, 'id' | 'workspaceId' | 'updatedAt'>) => WorkspaceDocument | null;
  deleteDocument: (workspaceId: string, docId: string) => boolean;
  inviteMember: (workspaceId: string, memberInput: Omit<WorkspaceMember, 'id' | 'joinedAt'>) => WorkspaceMember | null;
  changeMemberRole: (workspaceId: string, memberId: string, newRole: WorkspaceRole, actorRole: WorkspaceRole) => { success: boolean; error?: string; member?: WorkspaceMember };
  removeMember: (workspaceId: string, memberId: string, actorRole: WorkspaceRole) => { success: boolean; error?: string };
  addActivity: (workspaceId: string, activityInput: Omit<WorkspaceActivityItem, 'id' | 'workspaceId' | 'timestamp'>) => WorkspaceActivityItem | null;
  resetAll: () => WorkspaceItem[];
} {
  const workspaces = useSyncExternalStore(
    subscribe,
    getStoredWorkspaces,
    () => getInitialWorkspaces()
  );

  const metrics = useMemo(() => getWorkspaceMetrics(workspaces), [workspaces]);

  const handleCreateWorkspace = useCallback((input: CreateWorkspaceInput) => createWorkspace(input), []);
  const handleUpdateWorkspace = useCallback((id: string, updates: Partial<WorkspaceItem>) => updateWorkspace(id, updates), []);
  const handleDeleteWorkspace = useCallback((id: string) => deleteWorkspace(id), []);
  const handleCreateTask = useCallback((workspaceId: string, taskInput: Omit<WorkspaceTask, 'id' | 'workspaceId' | 'createdAt'>) => createWorkspaceTask(workspaceId, taskInput), []);
  const handleUpdateTask = useCallback((workspaceId: string, taskId: string, updates: Partial<WorkspaceTask>) => updateWorkspaceTask(workspaceId, taskId, updates), []);
  const handleMoveTask = useCallback((workspaceId: string, taskId: string, newStatus: WorkspaceTask['status']) => moveWorkspaceTask(workspaceId, taskId, newStatus), []);
  const handleDeleteTask = useCallback((workspaceId: string, taskId: string) => deleteWorkspaceTask(workspaceId, taskId), []);
  const handleToggleSubtask = useCallback((workspaceId: string, taskId: string, subtaskId: string) => toggleWorkspaceSubtask(workspaceId, taskId, subtaskId), []);
  const handleAddDocument = useCallback((workspaceId: string, docInput: Omit<WorkspaceDocument, 'id' | 'workspaceId' | 'updatedAt'>) => addWorkspaceDocument(workspaceId, docInput), []);
  const handleDeleteDocument = useCallback((workspaceId: string, docId: string) => deleteWorkspaceDocument(workspaceId, docId), []);
  const handleInviteMember = useCallback((workspaceId: string, memberInput: Omit<WorkspaceMember, 'id' | 'joinedAt'>) => inviteWorkspaceMember(workspaceId, memberInput), []);
  const handleChangeMemberRole = useCallback((workspaceId: string, memberId: string, newRole: WorkspaceRole, actorRole: WorkspaceRole) => changeWorkspaceMemberRole(workspaceId, memberId, newRole, actorRole), []);
  const handleRemoveMember = useCallback((workspaceId: string, memberId: string, actorRole: WorkspaceRole) => removeWorkspaceMember(workspaceId, memberId, actorRole), []);
  const handleAddActivity = useCallback((workspaceId: string, activityInput: Omit<WorkspaceActivityItem, 'id' | 'workspaceId' | 'timestamp'>) => addWorkspaceActivity(workspaceId, activityInput), []);
  const handleResetAll = useCallback(() => resetWorkspacesToDefault(), []);

  return {
    workspaces,
    metrics,
    createWorkspace: handleCreateWorkspace,
    updateWorkspace: handleUpdateWorkspace,
    deleteWorkspace: handleDeleteWorkspace,
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    moveTask: handleMoveTask,
    deleteTask: handleDeleteTask,
    toggleSubtask: handleToggleSubtask,
    addDocument: handleAddDocument,
    deleteDocument: handleDeleteDocument,
    inviteMember: handleInviteMember,
    changeMemberRole: handleChangeMemberRole,
    removeMember: handleRemoveMember,
    addActivity: handleAddActivity,
    resetAll: handleResetAll,
  };
}

/**
 * Hook to retrieve and interact with a specific workspace by ID.
 */
export function useWorkspace(workspaceId: string) {
  const store = useWorkspaces();
  const workspace = useMemo(
    () => store.workspaces.find((w) => w.id === workspaceId),
    [store.workspaces, workspaceId]
  );

  return {
    ...store,
    workspace,
    updateThisWorkspace: (updates: Partial<WorkspaceItem>) => store.updateWorkspace(workspaceId, updates),
    deleteThisWorkspace: () => store.deleteWorkspace(workspaceId),
    createTask: (taskInput: Omit<WorkspaceTask, 'id' | 'workspaceId' | 'createdAt'>) => store.createTask(workspaceId, taskInput),
    updateTask: (taskId: string, updates: Partial<WorkspaceTask>) => store.updateTask(workspaceId, taskId, updates),
    moveTask: (taskId: string, newStatus: WorkspaceTask['status']) => store.moveTask(workspaceId, taskId, newStatus),
    deleteTask: (taskId: string) => store.deleteTask(workspaceId, taskId),
    toggleSubtask: (taskId: string, subtaskId: string) => store.toggleSubtask(workspaceId, taskId, subtaskId),
    addDocument: (docInput: Omit<WorkspaceDocument, 'id' | 'workspaceId' | 'updatedAt'>) => store.addDocument(workspaceId, docInput),
    deleteDocument: (docId: string) => store.deleteDocument(workspaceId, docId),
    inviteMember: (memberInput: Omit<WorkspaceMember, 'id' | 'joinedAt'>) => store.inviteMember(workspaceId, memberInput),
    changeMemberRole: (memberId: string, newRole: WorkspaceRole, actorRole: WorkspaceRole) => store.changeMemberRole(workspaceId, memberId, newRole, actorRole),
    removeMember: (memberId: string, actorRole: WorkspaceRole) => store.removeMember(workspaceId, memberId, actorRole),
    addActivity: (activityInput: Omit<WorkspaceActivityItem, 'id' | 'workspaceId' | 'timestamp'>) => store.addActivity(workspaceId, activityInput),
  };
}

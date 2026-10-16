'use client';

import React, { useState } from 'react';
import {
  WorkspaceItem,
  WorkspaceDocument,
  hasWorkspacePermission,
} from '@/lib/workspace-engine';
import {
  Upload,
  FileText,
  Presentation,
  Code2,
  BookMarked,
  Download,
  Trash2,
  Plus,
  Sparkles,
  X,
  Check,
  Search,
} from 'lucide-react';

interface WorkspaceDocumentsProps {
  workspace: WorkspaceItem;
  onAddDocument: (doc: Omit<WorkspaceDocument, 'id' | 'workspaceId' | 'updatedAt'>) => void;
  onDeleteDocument: (docId: string) => void;
}

const categoryConfigs: Record<
  WorkspaceDocument['category'],
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  report: {
    label: 'Báo cáo & Đề cương',
    icon: FileText,
    color: 'text-blue-400 border-blue-400/30',
    bg: 'bg-blue-500/10',
  },
  slides: {
    label: 'Slide thuyết trình',
    icon: Presentation,
    color: 'text-amber-400 border-amber-400/30',
    bg: 'bg-amber-500/10',
  },
  source: {
    label: 'Mã nguồn & Code',
    icon: Code2,
    color: 'text-cyan-400 border-cyan-400/30',
    bg: 'bg-cyan-500/10',
  },
  reference: {
    label: 'Tài liệu tham khảo',
    icon: BookMarked,
    color: 'text-purple-400 border-purple-400/30',
    bg: 'bg-purple-500/10',
  },
};

export function WorkspaceDocuments({
  workspace,
  onAddDocument,
  onDeleteDocument,
}: WorkspaceDocumentsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [downloadNotification, setDownloadNotification] = useState<string | null>(null);

  // Upload Form State
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<WorkspaceDocument['category']>('report');
  const [newDocSize, setNewDocSize] = useState('3.2 MB');

  const canUpload = hasWorkspacePermission(workspace.currentUserRole, 'workspace.update');

  const handleDownload = (doc: WorkspaceDocument) => {
    setDownloadNotification(`Đang tải file: ${doc.name}`);
    setTimeout(() => {
      setDownloadNotification(null);
    }, 4000);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    onAddDocument({
      name: newDocName.trim(),
      category: newDocCategory,
      fileSize: newDocSize.trim() || '1.5 MB',
      uploaderName: 'Nguyễn Văn Minh',
      url: '#',
    });

    setNewDocName('');
    setIsUploadOpen(false);
  };

  const filteredDocs = workspace.documents.filter((doc) => {
    const matchCat = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchQuery =
      searchQuery === '' ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploaderName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Tài liệu &amp; Tài nguyên Đồ án</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Lưu trữ tập trung đề cương, slide báo cáo, mã nguồn và tài liệu nghiên cứu của nhóm
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-[0.98]"
          >
            <Upload className="h-4 w-4" />
            <span>Tải lên tài liệu</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'report', label: 'Báo cáo & Đề cương' },
            { id: 'slides', label: 'Slide thuyết trình' },
            { id: 'source', label: 'Mã nguồn' },
            { id: 'reference', label: 'Tham khảo' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-sm shadow-cyan-500/20'
                  : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên file hoặc người đăng..."
            className="w-full rounded-2xl border border-white/10 bg-black/30 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
          />
        </div>
      </div>

      {/* Download Alert Notification */}
      {downloadNotification && (
        <div className="flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-xs text-cyan-300 backdrop-blur-md animate-fade-in">
          <Download className="h-4 w-4 animate-bounce" />
          <span>{downloadNotification}</span>
        </div>
      )}

      {/* Document Cards Grid */}
      {filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-card/20 p-12 text-center">
          <FileText className="h-10 w-10 text-slate-600 mb-3" />
          <h4 className="text-sm font-bold text-white">Chưa có tài liệu nào trong mục này</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Tải lên tài liệu đồ án để các thành viên trong nhóm và giảng viên hướng dẫn cùng truy cập
          </p>
          {canUpload && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="mt-4 text-xs font-semibold text-cyan-400 hover:underline"
            >
              + Tải lên ngay
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => {
            const cat = categoryConfigs[doc.category] || categoryConfigs.report;
            const IconComponent = cat.icon;

            return (
              <div
                key={doc.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-5 transition-all duration-200 hover:border-cyan-400/30 hover:bg-card/70 hover:shadow-lg hover:shadow-cyan-950/20"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${cat.color} ${cat.bg}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {cat.label}
                        </span>
                        <h4 className="text-sm font-bold text-white leading-snug line-clamp-1 group-hover:text-cyan-300 transition-colors">
                          {doc.name}
                        </h4>
                      </div>
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-mono text-slate-300 shrink-0">
                      {doc.fileSize}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400 font-mono">
                    <span>Đăng bởi: <strong className="text-slate-300">{doc.uploaderName}</strong></span>
                    <span>{doc.updatedAt.slice(0, 10)}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Tải xuống</span>
                  </button>

                  {canUpload && (
                    <button
                      onClick={() => {
                        if (confirm(`Gỡ bỏ tài liệu "${doc.name}"?`)) {
                          onDeleteDocument(doc.id);
                        }
                      }}
                      className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Gỡ bỏ tài liệu"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsUploadOpen(false)}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-2xl p-6 shadow-2xl z-10 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Tải lên tài liệu đồ án</h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên file tài liệu <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="Ví dụ: De-cuong-Do-an-v1.pdf"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Danh mục</label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value as WorkspaceDocument['category'])}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="report">Báo cáo & Đề cương</option>
                  <option value="slides">Slide thuyết trình</option>
                  <option value="source">Mã nguồn & Git</option>
                  <option value="reference">Tài liệu tham khảo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dung lượng ước tính</label>
                <input
                  type="text"
                  value={newDocSize}
                  onChange={(e) => setNewDocSize(e.target.value)}
                  placeholder="2.4 MB"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/20"
                >
                  Tải lên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

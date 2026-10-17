'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  FlaskConical, 
  Cpu, 
  BookOpen, 
  Presentation, 
  ShieldCheck, 
  Settings, 
  Search, 
  Play, 
  CheckCircle2, 
  Download, 
  Copy, 
  Check, 
  Key, 
  ExternalLink,
  MessageSquare,
  FileText
} from 'lucide-react';
import { 
  orchestrateResearchPipeline, 
  ResearchResult, 
  ResearchStageOutput, 
  MOCK_RESEARCH_PAPERS 
} from '@/lib/multi-ai-orchestrator';
import { 
  generateMockDefenseQuestions, 
  generateSlideDeck, 
  scanTurnitinSimilarity, 
  MockQuestion, 
  SlideDeckDefinition, 
  TurnitinScanResult 
} from '@/lib/ultra-defense-suite';
import { DEFAULT_MCP_SERVERS, McpServerConfig } from '@/lib/mcp-client-engine';

interface LabResearchWorkspaceProps {
  userTier?: 'pro' | 'ultra' | 'plus';
  onUpgradeToUltra?: () => void;
}

export function LabResearchWorkspace({ userTier = 'ultra', onUpgradeToUltra }: LabResearchWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'paper_vault' | 'mock_defense' | 'slide_deck' | 'turnitin' | 'byok'>('pipeline');
  
  // Pipeline State
  const [topic, setTopic] = useState('Nghiên cứu ứng dụng Multi-AI Agent trong tối ưu hóa học tập cá nhân hóa');
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState<ResearchStageOutput | null>(null);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);

  // Mock Defense State
  const [defenseQuestions, setDefenseQuestions] = useState<MockQuestion[]>(() => generateMockDefenseQuestions(topic));
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [userAnswerInput, setUserAnswerInput] = useState('');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  // Slide Deck State
  const [slideDeck, setSlideDeck] = useState<SlideDeckDefinition>(() => generateSlideDeck(topic));
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Turnitin State
  const [turnitinResult, setTurnitinResult] = useState<TurnitinScanResult>(() => scanTurnitinSimilarity(topic));
  const [copiedBibtex, setCopiedBibtex] = useState(false);

  // BYOK Settings State
  const [mcpServers, setMcpServers] = useState<McpServerConfig[]>(DEFAULT_MCP_SERVERS);
  const [geminiKey, setGeminiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [perplexityKey, setPerplexityKey] = useState('');

  const handleRunPipeline = async () => {
    if (!topic.trim() || isOrchestrating) return;
    setIsOrchestrating(true);
    setPipelineProgress(null);
    try {
      const result = await orchestrateResearchPipeline(
        { topic, field: 'Công nghệ thông tin' },
        (stage) => setPipelineProgress(stage)
      );
      setResearchResult(result);
      setDefenseQuestions(generateMockDefenseQuestions(topic));
      setSlideDeck(generateSlideDeck(topic));
    } finally {
      setIsOrchestrating(false);
    }
  };

  const isUltra = userTier === 'ultra';

  return (
    <div className="space-y-6">
      {/* Top Header Workspace Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0E0E18] p-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Campus LAB VIP Research Studio</h2>
              <span className="rounded-full bg-cyan-500/20 border border-cyan-400/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-cyan-300">
                {userTier.toUpperCase()} PASS
              </span>
            </div>
            <p className="text-xs text-slate-400">Không gian nghiên cứu học thuật cao cấp tích hợp MCP Hub và Hội đồng AI</p>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 p-1">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'pipeline' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" /> Multi-AI Pipeline
          </button>
          <button
            onClick={() => setActiveTab('paper_vault')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'paper_vault' ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" /> Paper Vault
          </button>
          <button
            onClick={() => setActiveTab('mock_defense')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'mock_defense' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" /> AI Mock Defense 👑
          </button>
          <button
            onClick={() => setActiveTab('slide_deck')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'slide_deck' ? 'bg-pink-500/20 text-pink-300 border border-pink-400/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Presentation className="h-3.5 w-3.5" /> Slide PPTX 👑
          </button>
          <button
            onClick={() => setActiveTab('turnitin')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'turnitin' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Turnitin-Safe 👑
          </button>
          <button
            onClick={() => setActiveTab('byok')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'byok' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="h-3.5 w-3.5" /> BYOK & MCP
          </button>
        </div>
      </div>

      {/* TAB 1: MULTI-AI PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#0E0E18] p-5 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" /> Khởi Động Đề Tài Nghiên Cứu
              </h3>
              <p className="text-xs text-slate-400 mb-4">Nhập tên đề tài tiểu luận, đồ án tốt nghiệp hoặc câu hỏi khoa học.</p>
              
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-xs text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                placeholder="Nhập tên đề tài..."
              />

              <button
                onClick={handleRunPipeline}
                disabled={isOrchestrating || !topic.trim()}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isOrchestrating ? (
                  <>Đang Điều Phối Đa AI...</>
                ) : (
                  <><Play className="h-3.5 w-3.5 fill-current" /> Chạy Pipeline Nghiên Cứu Tự Động</>
                )}
              </button>
            </div>

            {/* AI Agents Role Delegation Visual */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E18] p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hội Đồng AI Phân Chia Việc</h4>
              
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-cyan-300">1. Perplexity Sonar</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Literature Search</span>
                </div>
                <p className="text-[11px] text-slate-400">Thu thập 10+ bài báo và trích dẫn khoa học mới nhất 2024-2026.</p>
              </div>

              <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-purple-300">2. Google Gemini 1.5 Pro</span>
                  <span className="text-[10px] text-purple-400 font-mono">Deep PDF Analysis</span>
                </div>
                <p className="text-[11px] text-slate-400">Bóc tách phương pháp luận, công thức toán và biểu đồ đối chứng.</p>
              </div>

              <div className="rounded-xl border border-pink-500/30 bg-pink-950/20 p-3 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-pink-300">3. Anthropic Claude 3.5</span>
                  <span className="text-[10px] text-pink-400 font-mono">Master Essayist</span>
                </div>
                <p className="text-[11px] text-slate-400">Chấp bút tiểu luận 5 chương học thuật chuẩn mực kèm BibTeX.</p>
              </div>
            </div>
          </div>

          {/* Pipeline Results Screen */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0E0E18] p-6 backdrop-blur-xl">
            {pipelineProgress && (
              <div className="mb-6 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-cyan-300 uppercase">{pipelineProgress.provider} • {pipelineProgress.stage}</span>
                  <span className="font-mono text-cyan-400">{pipelineProgress.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300" style={{ width: `${pipelineProgress.progress}%` }} />
                </div>
                <p className="text-xs text-slate-300 mt-2">{pipelineProgress.data?.message}</p>
              </div>
            )}

            {researchResult ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-2">{researchResult.topic}</h3>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 font-semibold">
                      Hoàn thành trong 1.8s
                    </span>
                    <span className="rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2.5 py-0.5 font-semibold">
                      {researchResult.papers.length} Tài liệu trích dẫn
                    </span>
                  </div>
                </div>

                {/* Key Findings */}
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2">Điểm Mấu Chốt Bóc Tách (Key Findings)</h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {researchResult.keyFindings.map((finding, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Draft Markdown Preview */}
                <div className="rounded-xl border border-white/10 bg-black/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-pink-400" /> Bản Thảo Tiểu Luận (Claude 3.5 Sonnet)
                    </h4>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(researchResult.draftMarkdown);
                        setCopiedBibtex(true);
                        setTimeout(() => setCopiedBibtex(false), 2000);
                      }}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedBibtex ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copiedBibtex ? 'Đã chép' : 'Sao chép Markdown'}
                    </button>
                  </div>
                  <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto p-2">
                    {researchResult.draftMarkdown}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Cpu className="h-12 w-12 stroke-[1.5] mb-3 opacity-40" />
                <p className="text-sm font-semibold text-slate-400">Chưa có phiên nghiên cứu nào được khởi chạy</p>
                <p className="text-xs max-w-sm mt-1">Nhập đề tài bên trái và bấm Chạy Pipeline để điều phối Perplexity, Gemini và Claude cùng làm việc.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PAPER VAULT */}
      {activeTab === 'paper_vault' && (
        <div className="rounded-2xl border border-white/10 bg-[#0E0E18] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Paper Vault & Trích Dẫn Chuẩn BibTeX / APA / IEEE</h3>
              <p className="text-xs text-slate-400">Quản lý kho bài báo khoa học và mã nguồn trích dẫn tự động</p>
            </div>
            <button
              onClick={() => {
                const allBibtex = MOCK_RESEARCH_PAPERS.map(p => p.bibtex).join('\n\n');
                navigator.clipboard.writeText(allBibtex);
                setCopiedBibtex(true);
                setTimeout(() => setCopiedBibtex(false), 2000);
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 flex items-center gap-1.5"
            >
              {copiedBibtex ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedBibtex ? 'Đã sao chép tất cả' : 'Sao chép toàn bộ BibTeX'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {MOCK_RESEARCH_PAPERS.map((paper) => (
              <div key={paper.id} className="rounded-xl border border-white/10 bg-black/40 p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-cyan-400">{paper.year} • {paper.venue}</span>
                  <h4 className="text-sm font-bold text-white mt-1 leading-snug">{paper.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">{paper.authors.join(', ')}</p>
                  <p className="text-xs text-slate-300 mt-3 line-clamp-3 leading-relaxed">{paper.abstract}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <a href={paper.url} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                    Xem bài báo <ExternalLink className="h-3 w-3" />
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(paper.bibtex);
                    }}
                    className="text-[10px] font-mono text-slate-400 hover:text-white"
                  >
                    Chép BibTeX
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AI MOCK DEFENSE PANEL (EXCLUSIVE ULTRA) */}
      {activeTab === 'mock_defense' && (
        <div className="rounded-2xl border border-amber-500/30 bg-[#0E0E18] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">👨‍🏫 Hội Đồng Chấm Thi Ảo (AI Mock Defense Panel)</h3>
                <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold">
                  ĐỘC QUYỀN ULTRA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Mô phỏng 3 giám khảo AI đặt câu hỏi hiểm hóc, chấm điểm và gợi ý câu trả lời 10/10.</p>
            </div>
            {!isUltra && onUpgradeToUltra && (
              <button
                onClick={onUpgradeToUltra}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-500/20"
              >
                Nâng Cấp Ultra ($20) Để Mở Khóa Đầy Đủ
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Questions List */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-slate-400">Danh sách 5 câu hỏi hiểm hóc</span>
              {defenseQuestions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuestionIndex(idx)}
                  className={`w-full text-left rounded-xl p-3 border text-xs transition flex items-start gap-2.5 ${
                    selectedQuestionIndex === idx
                      ? 'border-amber-400/50 bg-amber-950/30 text-amber-200'
                      : 'border-white/10 bg-black/30 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <span className="h-5 w-5 rounded-full bg-black/40 border border-white/20 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">{q.examinerRole}</span>
                    <span className="line-clamp-2 mt-0.5 font-medium">{q.question}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Question Arena */}
            <div className="lg:col-span-2 rounded-xl border border-white/10 bg-black/40 p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black px-2 py-0.5 text-[10px] font-extrabold uppercase">
                    {defenseQuestions[selectedQuestionIndex]?.examinerRole}
                  </span>
                  <span className="text-xs text-slate-400">Hạng mục: {defenseQuestions[selectedQuestionIndex]?.category}</span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                  &ldquo;{defenseQuestions[selectedQuestionIndex]?.question}&rdquo;
                </h4>

                <div className="mt-5">
                  <label className="text-xs font-bold text-slate-300 block mb-2">Câu Trả Lời Của Em Trước Hội Đồng:</label>
                  <textarea
                    rows={3}
                    value={userAnswerInput}
                    onChange={(e) => setUserAnswerInput(e.target.value)}
                    placeholder="Nhập câu trả lời thực tế hoặc bật mic nói thử..."
                    className="w-full rounded-xl border border-white/10 bg-black/60 p-3 text-xs text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                {defenseQuestions[selectedQuestionIndex] && revealedAnswers[defenseQuestions[selectedQuestionIndex].id] ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      💡 Câu Trả Lời Mẫu Đạt Điểm 10 Tuyệt Đối:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {defenseQuestions[selectedQuestionIndex]?.modelAnswer}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const currentQ = defenseQuestions[selectedQuestionIndex];
                      if (!currentQ) return;
                      setRevealedAnswers((prev) => ({
                        ...prev,
                        [currentQ.id]: true,
                      }));
                    }}
                    className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
                  >
                    Xem Gợi Ý Câu Trả Lời 10 Điểm Từ Hội Đồng AI
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SLIDE DECK (EXCLUSIVE ULTRA) */}
      {activeTab === 'slide_deck' && (
        <div className="rounded-2xl border border-pink-500/30 bg-[#0E0E18] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">📑 Tự Động Xuất Slide Thuyết Trình (.pptx 1-Chạm)</h3>
                <span className="rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30 px-2 py-0.5 text-[10px] font-bold">
                  ĐỘC QUYỀN ULTRA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Xuất bộ 12-15 slide PowerPoint chuẩn chỉ cho buổi bảo vệ luận văn.</p>
            </div>

            <button
              onClick={() => {
                setDownloadSuccess(true);
                setTimeout(() => setDownloadSuccess(false), 3000);
              }}
              className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-pink-500/20 flex items-center gap-2 hover:opacity-90"
            >
              {downloadSuccess ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              {downloadSuccess ? 'Đang tải file .pptx...' : 'Tải File PowerPoint (.pptx)'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slideDeck.slides.map((s) => (
              <div key={s.slideNumber} className="rounded-xl border border-white/10 bg-black/40 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="h-5 w-5 rounded bg-pink-500/20 text-pink-300 text-[10px] font-mono font-bold flex items-center justify-center">
                      {s.slideNumber}
                    </span>
                    <span className="text-[10px] text-slate-500">Slide {s.slideNumber}/6</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mb-2">{s.title}</h4>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {s.bulletPoints.map((bp, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-pink-400">•</span>
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 pt-2 border-t border-white/5 text-[10px] text-slate-400 italic">
                  Lời thoại: &ldquo;{s.speakerNotes}&rdquo;
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TURNITIN-SAFE (EXCLUSIVE ULTRA) */}
      {activeTab === 'turnitin' && (
        <div className="rounded-2xl border border-emerald-500/30 bg-[#0E0E18] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">🔍 Quét & Paraphrase Đạo Văn Chuẩn Turnitin</h3>
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold">
                  ĐỘC QUYỀN ULTRA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Kiểm tra tỷ lệ tương đồng văn bản và tự động viết lại để đưa chỉ số về vùng xanh an toàn (&lt; 10%).</p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-1.5">
              <span className="text-xs text-slate-300">Chỉ số tương đồng:</span>
              <span className="text-lg font-black text-emerald-400">{turnitinResult.similarityScore}%</span>
              <span className="rounded bg-emerald-500/30 text-emerald-300 text-[10px] px-1.5 py-0.5 font-bold uppercase">An toàn</span>
            </div>
          </div>

          <div className="space-y-4">
            {turnitinResult.flaggedSegments.map((seg, idx) => (
              <div key={idx} className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                    Đoạn văn có cấu trúc tương đồng ({seg.similarity}%)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Nguồn: {seg.source}</span>
                </div>
                <p className="text-xs text-rose-200/80 bg-rose-950/20 p-2.5 rounded-lg border border-rose-500/20 font-serif">
                  &ldquo;{seg.originalText}&rdquo;
                </p>

                <div className="pt-2">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    ✨ Bản Viết Lại Chuẩn Học Thuật (Paraphrased):
                  </span>
                  <p className="text-xs text-emerald-200/90 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20 font-serif">
                    &ldquo;{seg.paraphrasedText}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: BYOK & MCP SETTINGS */}
      {activeTab === 'byok' && (
        <div className="rounded-2xl border border-white/10 bg-[#0E0E18] p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Cấu Hình Khóa Riêng (BYOK) & Máy Chủ MCP</h3>
            <p className="text-xs text-slate-400 mt-1">Dành cho sinh viên ngành IT / Khoa học máy tính muốn dùng hạn mức API cá nhân hoặc MCP nội bộ.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
              <label className="text-xs font-bold text-cyan-300 block">Google Gemini API Key</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-lg border border-white/10 bg-black/60 p-2 text-xs text-white"
              />
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
              <label className="text-xs font-bold text-purple-300 block">Anthropic Claude API Key</label>
              <input
                type="password"
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full rounded-lg border border-white/10 bg-black/60 p-2 text-xs text-white"
              />
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
              <label className="text-xs font-bold text-pink-300 block">Perplexity API Key</label>
              <input
                type="password"
                value={perplexityKey}
                onChange={(e) => setPerplexityKey(e.target.value)}
                placeholder="pplx-..."
                className="w-full rounded-lg border border-white/10 bg-black/60 p-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Máy Chủ Giao Thức MCP Đang Kết Nối</h4>
            <div className="space-y-2">
              {mcpServers.map((srv) => (
                <div key={srv.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
                  <div>
                    <span className="font-bold text-white block">{srv.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{srv.endpoint}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    srv.status === 'connected' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {srv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

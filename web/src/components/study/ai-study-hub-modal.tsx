'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  HelpCircle,
  Brain,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Award,
  Send,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Flashcard3dDeck } from './flashcard-3d-deck';
import type {
  AiStudyHubArtifacts,
  ChatMessage,
  AiGeneratedQuizQuestion,
} from '@/lib/ai-study-engine';

interface AiStudyHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  chapterId: string;
  chapterTitle: string;
  pdfUrl?: string;
  onAddXp?: (amount: number, reason: string) => void;
}

type TabKey = 'summary' | 'quiz' | 'flashcards' | 'chat';

export function AiStudyHubModal({
  isOpen,
  onClose,
  courseId,
  courseName,
  chapterId,
  chapterTitle,
  pdfUrl,
  onAddXp,
}: AiStudyHubModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [loading, setLoading] = useState(false);
  const [artifacts, setArtifacts] = useState<AiStudyHubArtifacts | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Load or generate AI Study Artifacts
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    // Retrieve custom API key from localStorage if set by user
    const customApiKey =
      typeof window !== 'undefined' ? localStorage.getItem('campusos_gemini_api_key') || undefined : undefined;

    fetch('/api/study/ai-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId,
        courseName,
        chapterId,
        chapterTitle,
        pdfUrl,
        customApiKey,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Không thể phân tích tài liệu bài giảng');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          if (data.artifacts) {
            setArtifacts(data.artifacts);
            // Default welcome message in chat
            setChatMessages([
              {
                role: 'assistant',
                content: `Chào bạn! Mình là AI Trợ giảng của môn **${courseName}**. Mình đã nạp toàn bộ slide **"${chapterTitle}"**. Bạn có thắc mắc gì về công thức, định lý hay cách làm bài tập không?`,
                citation: `Slide: ${chapterTitle}`,
                timestamp: new Date().toISOString(),
              },
            ]);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Đã có lỗi xảy ra');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, courseId, courseName, chapterId, chapterTitle, pdfUrl]);

  if (!isOpen) return null;

  // Quiz submission & scoring
  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    if (submittedQuiz) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleToggleHint = (questionId: string) => {
    setRevealedHints((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSubmitQuiz = () => {
    if (!artifacts?.quizzes) return;
    let score = 0;
    let totalXp = 0;

    artifacts.quizzes.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        score++;
        totalXp += q.xpReward || 15;
      }
    });

    setQuizScore(score);
    setSubmittedQuiz(true);

    if (totalXp > 0 && onAddXp) {
      onAddXp(totalXp, `Hoàn thành trắc nghiệm AI: ${chapterTitle}`);
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setRevealedHints({});
    setSubmittedQuiz(false);
    setQuizScore(0);
  };

  // Chat submission
  const handleSendChat = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    if (!presetText) setChatInput('');
    setChatLoading(true);

    const customApiKey =
      typeof window !== 'undefined' ? localStorage.getItem('campusos_gemini_api_key') || undefined : undefined;

    try {
      const res = await fetch('/api/study/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          courseName,
          chapterId,
          chapterTitle,
          query: textToSend.trim(),
          chatHistory: newHistory,
          customApiKey,
        }),
      });

      if (!res.ok) throw new Error('Không thể kết nối trợ lý AI');
      const data = await res.json();
      if (data.message) {
        setChatMessages((prev) => [...prev, data.message]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Xin lỗi bạn, kết nối tới máy chủ AI bị gián đoạn. Bạn vui lòng thử lại sau ít phút nhé!',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-background/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-card/95 border border-cyan-400/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(61,232,255,0.4)] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-foreground flex items-center gap-2 truncate">
                <span>AI Study Hub: &quot;Bộ Tứ Toàn Năng&quot;</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  Gemini 1.5 Flash
                </span>
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {courseName} • {chapterTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/10 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Tabs Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-2 bg-slate-950/60 border-b border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold transition-all ${
              activeTab === 'summary'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(61,232,255,0.2)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Tóm tắt 5 phút</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold transition-all ${
              activeTab === 'quiz'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(61,232,255,0.2)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Trắc nghiệm (+XP)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold transition-all ${
              activeTab === 'flashcards'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Flashcard 3D SM-2</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(61,232,255,0.2)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chatbot Slide</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                <Sparkles className="w-4 h-4 text-purple-400 absolute top-0 right-0 animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-foreground">AI đang quét và trích xuất tri thức từ Slide...</p>
                <p className="text-xs text-muted-foreground">Đang sinh Tóm tắt, Bộ đề trắc nghiệm và Thẻ Spaced Repetition</p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && artifacts && (
            <>
              {/* TAB 1: EXECUTIVE SYLLABUS SUMMARY */}
              {activeTab === 'summary' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Top banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-400/20 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-foreground">{artifacts.summary.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Tóm tắt các điểm then chốt nhất của tuần học, tối ưu cho ôn thi cấp tốc.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-mono font-bold shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{artifacts.summary.readingTimeMinutes} phút đọc</span>
                    </div>
                  </div>

                  {/* Key takeaways */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ý chính cốt lõi (Key Takeaways)</span>
                    </h4>
                    <div className="grid gap-2">
                      {artifacts.summary.keyTakeaways.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-background/50 border border-white/10 text-xs flex items-start gap-2.5"
                        >
                          <span className="w-5 h-5 rounded-md bg-cyan-500/15 text-cyan-300 flex items-center justify-center font-mono font-bold shrink-0 text-[11px]">
                            {idx + 1}
                          </span>
                          <span className="text-slate-200 leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Core concepts */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Brain className="w-4 h-4" />
                      <span>Khái niệm & Định lý trọng tâm</span>
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {artifacts.summary.coreConcepts.map((concept, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-card/60 border border-white/10 space-y-2.5"
                        >
                          <h5 className="text-sm font-bold text-foreground">{concept.name}</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">{concept.definition}</p>
                          {concept.formulaOrLaw && (
                            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-cyan-400/20 font-mono text-[11px] text-cyan-300">
                              {concept.formulaOrLaw}
                            </div>
                          )}
                          {concept.practicalExample && (
                            <div className="text-[11px] text-slate-300 italic">
                              <span className="text-purple-400 font-semibold not-italic">Ví dụ: </span>
                              {concept.practicalExample}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Common Pitfalls */}
                  {artifacts.summary.commonPitfalls.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Bẫy sai lầm thường gặp trong đề thi (Common Pitfalls)</span>
                      </h4>
                      <div className="space-y-2">
                        {artifacts.summary.commonPitfalls.map((pitfall, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200 flex items-start gap-2.5"
                          >
                            <span className="font-mono font-bold text-rose-400 shrink-0">⚠️</span>
                            <span>{pitfall}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SMART PRACTICE QUIZ */}
              {activeTab === 'quiz' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Header bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-background/50 border border-white/10">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        Đề trắc nghiệm kiểm tra độ hiểu bài ({artifacts.quizzes.length} câu)
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Mỗi câu trả lời đúng thưởng ngay <span className="text-purple-400 font-bold">+15 XP</span> vào hồ sơ sinh viên.
                      </p>
                    </div>

                    {submittedQuiz ? (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold font-mono px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                          Điểm: {quizScore} / {artifacts.quizzes.length} (
                          {Math.round((quizScore / artifacts.quizzes.length) * 100)}%)
                        </span>
                        <button
                          type="button"
                          onClick={handleResetQuiz}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-foreground border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Làm lại</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(selectedAnswers).length === 0}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(61,232,255,0.3)] transition-all disabled:opacity-40"
                      >
                        Nộp bài & Chấm điểm
                      </button>
                    )}
                  </div>

                  {/* Questions list */}
                  <div className="space-y-5">
                    {artifacts.quizzes.map((q: AiGeneratedQuizQuestion, qIdx: number) => {
                      const isSelected = selectedAnswers[q.id] !== undefined;
                      const selectedOpt = selectedAnswers[q.id];
                      const isCorrect = submittedQuiz && selectedOpt === q.correctAnswerIndex;
                      const isWrong = submittedQuiz && isSelected && !isCorrect;

                      return (
                        <div
                          key={q.id}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                            submittedQuiz
                              ? isCorrect
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-rose-500/10 border-rose-500/30'
                              : 'bg-background/40 border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <span className="text-xs font-mono font-bold text-cyan-400">
                              Câu {qIdx + 1}:
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-muted-foreground border border-white/10">
                                {q.difficulty}
                              </span>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-400/30">
                                +{q.xpReward} XP
                              </span>
                            </div>
                          </div>

                          <p className="text-sm font-semibold text-foreground mb-4 leading-relaxed">
                            {q.question}
                          </p>

                          {/* Options */}
                          <div className="grid gap-2">
                            {q.options.map((opt, optIdx) => {
                              const isThisSelected = selectedOpt === optIdx;
                              let optStyle = 'bg-background/50 border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground';

                              if (submittedQuiz) {
                                if (optIdx === q.correctAnswerIndex) {
                                  optStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-bold';
                                } else if (isThisSelected) {
                                  optStyle = 'bg-rose-500/20 border-rose-400 text-rose-200 line-through';
                                }
                              } else if (isThisSelected) {
                                optStyle = 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold';
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => handleSelectAnswer(q.id, optIdx)}
                                  className={`p-3 rounded-xl border text-xs text-left transition-all flex items-center gap-3 ${optStyle}`}
                                >
                                  <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center font-mono font-bold shrink-0 text-[11px]">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="flex-1">{opt}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Hint Toggle */}
                          {!submittedQuiz && (
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => handleToggleHint(q.id)}
                                className="text-[11px] text-amber-400/90 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
                              >
                                <Lightbulb className="w-3.5 h-3.5" />
                                <span>{revealedHints[q.id] ? 'Ẩn gợi ý' : 'Xem gợi ý tư duy'}</span>
                              </button>
                              {revealedHints[q.id] && (
                                <div className="mt-1.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 animate-in fade-in">
                                  {q.hint}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Explanation after submission */}
                          {submittedQuiz && (
                            <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-slate-200 space-y-1">
                              <p className="font-bold text-cyan-300">💡 Giải thích chi tiết:</p>
                              <p className="leading-relaxed">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: FLASHCARD 3D SM-2 */}
              {activeTab === 'flashcards' && (
                <div className="animate-in fade-in duration-200">
                  <Flashcard3dDeck
                    initialCards={artifacts.flashcards}
                    onCompleteSession={(reviewed, xp) => {
                      if (onAddXp && xp > 0) {
                        onAddXp(xp, `Ôn tập Flashcard 3D: ${chapterTitle}`);
                      }
                    }}
                  />
                </div>
              )}

              {/* TAB 4: CHATBOT SLIDE Q&A */}
              {activeTab === 'chat' && (
                <div className="space-y-4 flex flex-col h-[460px] animate-in fade-in duration-200">
                  {/* Messages Scroll Area */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 text-xs leading-relaxed ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.role !== 'user' && (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-[0_0_10px_rgba(61,232,255,0.3)]">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] p-3.5 rounded-2xl border ${
                            msg.role === 'user'
                              ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-100 rounded-tr-none'
                              : 'bg-background/60 border-white/10 text-slate-200 rounded-tl-none space-y-1.5'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                          {msg.citation && (
                            <div className="text-[10px] font-mono text-cyan-400/80 pt-1 border-t border-white/5">
                              📌 Nguồn trích dẫn: {msg.citation}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground p-3">
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                        <span>AI Coach đang tra cứu slide và soạn câu trả lời...</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Prompts */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => handleSendChat('Tóm tắt các công thức quan trọng nhất')}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-muted-foreground hover:text-cyan-300 transition-colors"
                    >
                      📐 Công thức cốt lõi
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendChat('Cho mình 1 ví dụ bài tập thực tế có giải')}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-muted-foreground hover:text-cyan-300 transition-colors"
                    >
                      📝 Ví dụ bài tập mẫu
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendChat('Chuyên đề này thường thi bẫy vào chỗ nào?')}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-muted-foreground hover:text-rose-300 transition-colors"
                    >
                      ⚠️ Các bẫy đề thi
                    </button>
                  </div>

                  {/* Input Box */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      placeholder="Hỏi bất kỳ điều gì về slide bài giảng này..."
                      className="flex-1 h-11 px-4 rounded-xl bg-background/60 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendChat()}
                      disabled={!chatInput.trim() || chatLoading}
                      className="h-11 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-[0_0_10px_rgba(61,232,255,0.3)]"
                    >
                      <Send className="w-4 h-4" />
                      <span>Gửi</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

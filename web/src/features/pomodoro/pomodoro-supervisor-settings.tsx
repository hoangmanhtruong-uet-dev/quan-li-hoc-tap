'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Cat,
  Volume2,
  VolumeX,
  Volume1,
  Sparkles,
  Flame,
  Clock,
  ShieldAlert,
  PictureInPicture2,
  Puzzle,
  ExternalLink,
  RotateCcw,
  Box,
  Glasses,
  Briefcase,
  Crown,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHARACTERS } from './characters-data';
import { pomodoroAudio } from './audio-engine';
import {
  usePomodoroSettings,
  type PomodoroSettings,
} from './pomodoro-settings-store';
import type { RoastLevel } from './supervisor-arbiter';

const CHARACTER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'co-giao-chu-nhiem': Glasses,
  'sep-kho-tinh': Briefcase,
  'tong-tai-ba-dao': Crown,
  'tong-tai-lanh-lung': Crown,
  'senpai-danh-da': Heart,
  'anime-tsundere': Heart,
};

export function PomodoroSupervisorSettings() {
  const { settings, stats, updateSettings, resetStats } = usePomodoroSettings();
  const [testingSlug, setTestingSlug] = useState<string | null>(null);
  const [customMinInput, setCustomMinInput] = useState<string>(
    [1, 25, 45, 60].includes(settings.defaultMinutes) ? '' : String(settings.defaultMinutes)
  );

  const handleTestVoice = async (slug: string) => {
    const char = CHARACTERS[slug];
    if (!char) return;
    setTestingSlug(slug);
    await pomodoroAudio.unlock();
    const sample = char.quotes.tab_switch_warning[0] || char.tagline;
    pomodoroAudio.speak(
      sample,
      () => setTestingSlug(null),
      {
        gender: char.voiceGender,
        tone: settings.roastLevel === 'extreme' ? 'angry' : 'sarcastic',
      }
    );
  };

  const handleCustomMinChange = (val: string) => {
    setCustomMinInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0 && num <= 180) {
      updateSettings({ defaultMinutes: num });
    }
  };

  return (
    <Card id="giam-sat" className="scroll-mt-24 border-amber-500/20 bg-gradient-to-b from-amber-500/[0.03] to-transparent">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2.5 text-lg font-black text-amber-300">
            <Cat className="h-5 w-5 text-amber-400" />
            Giám Sát Cực Đoan (Mèo Leo Pomodoro)
          </CardTitle>
          <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-300 font-mono text-xs">
            <Flame className="mr-1 h-3.5 w-3.5 text-amber-400" /> Kỷ luật thép
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Cấu hình nhân cách giám thị, cấp độ răn đe, thời lượng và cơ chế hiển thị 3D Leo trong suốt. Thay đổi được đồng bộ tức thì vào màn hình học tập.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 1. Chọn Nhân cách Giám thị (4 thẻ) */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Tính cách & Giọng Mèo Giám Thị
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.values(CHARACTERS).map((c) => {
              const isSelected = settings.characterSlug === c.slug;
              const IconComp = CHARACTER_ICONS[c.slug] || Cat;
              const isTesting = testingSlug === c.slug;

              return (
                <div
                  key={c.slug}
                  onClick={() => updateSettings({ characterSlug: c.slug })}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50'
                      : 'border-border/60 bg-muted/20 hover:border-amber-500/40 hover:bg-muted/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                          isSelected ? 'border-amber-500/50 bg-amber-500/20 text-amber-300' : 'border-white/10 bg-white/5 text-slate-400'
                        }`}>
                          <IconComp className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-bold text-slate-100">{c.name}</span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                      )}
                    </div>
                    <p className="mt-2 text-xs font-medium text-amber-300/80">{c.role}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground italic line-clamp-2">
                      &ldquo;{c.tagline}&rdquo;
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">
                      Lông: <span className="inline-block w-2.5 h-2.5 rounded-full align-middle ml-1" style={{ backgroundColor: c.furColor }} />
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      disabled={isTesting}
                      className="h-7 px-2 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestVoice(c.slug);
                      }}
                    >
                      <Volume1 className={`mr-1 h-3.5 w-3.5 ${isTesting ? 'animate-pulse text-amber-400' : ''}`} />
                      {isTesting ? 'Đang phát...' : 'Nghe thử giọng'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Cấp độ chế giễu & mắng */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" /> Cấp độ chế giễu & mắng khi mất tập trung
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { level: 'light', label: 'Nhắc nhẹ', desc: 'Thân thiện, nhắc nhở nhẹ nhàng' },
              { level: 'medium', label: 'Mỉa mai', desc: 'Châm chọc thâm thúy, gắt vừa' },
              { level: 'extreme', label: 'Cực gắt ⚡', desc: 'Gắt gỏng kịch trần, đập bàn dọa méch mẹ' },
            ] as const).map(({ level, label, desc }) => (
              <button
                key={level}
                type="button"
                onClick={() => updateSettings({ roastLevel: level as RoastLevel })}
                className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
                  settings.roastLevel === level
                    ? 'border-rose-500 bg-rose-500/20 text-white ring-1 ring-rose-500/40'
                    : 'border-border/60 bg-muted/20 text-slate-400 hover:border-white/20'
                }`}
              >
                <span className="text-xs font-bold text-slate-200">{label}</span>
                <span className="mt-1 text-[10px] text-muted-foreground line-clamp-1">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Thời lượng đếm ngược mặc định */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-blue-400" /> Thời lượng đếm ngược mặc định
          </label>
          <div className="flex flex-wrap gap-2">
            {[1, 25, 45, 60].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setCustomMinInput('');
                  updateSettings({ defaultMinutes: val });
                }}
                className={`min-w-[4.5rem] rounded-xl border py-2 px-3 text-xs font-bold transition-all ${
                  settings.defaultMinutes === val && !customMinInput
                    ? 'border-aurora-lime bg-aurora-lime/20 text-aurora-lime ring-1 ring-aurora-lime/40'
                    : 'border-border/60 bg-muted/20 text-slate-400 hover:text-white'
                }`}
              >
                {val} phút
              </button>
            ))}

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-muted-foreground">Tùy chỉnh:</span>
              <input
                type="number"
                min="1"
                max="180"
                placeholder="Số phút"
                value={customMinInput}
                onChange={(e) => handleCustomMinChange(e.target.value)}
                className="h-9 w-24 rounded-xl border border-input bg-background px-2.5 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-amber-400"
              />
              <span className="text-xs text-muted-foreground">phút</span>
            </div>
          </div>
        </div>

        {/* 4. Các công tắc chức năng */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Âm thanh mắng */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                {settings.audioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-amber-400" />}
              </span>
              <div>
                <p className="text-xs font-bold text-slate-200">Nghe mắng bằng giọng nói (TTS)</p>
                <p className="text-[10px] text-muted-foreground">Phát âm thanh châm chọc bằng giọng Bắc</p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={!settings.audioMuted}
              type="button"
              onClick={() => updateSettings({ audioMuted: !settings.audioMuted })}
              className={`relative h-6 w-11 rounded-full transition-colors ${!settings.audioMuted ? 'bg-amber-500' : 'bg-muted'}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${!settings.audioMuted ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {/* Cửa sổ nổi PiP */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <PictureInPicture2 className="h-4 w-4 text-sky-400" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-200">Cho phép cửa sổ nổi PiP</p>
                <p className="text-[10px] text-muted-foreground">Ghim mèo & đồng hồ góc màn hình khi chuyển app</p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={settings.floatingPipEnabled}
              type="button"
              onClick={() => updateSettings({ floatingPipEnabled: !settings.floatingPipEnabled })}
              className={`relative h-6 w-11 rounded-full transition-colors ${settings.floatingPipEnabled ? 'bg-sky-500' : 'bg-muted'}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${settings.floatingPipEnabled ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {/* Chế độ hiển thị 3D Leo / 2D Fallback */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Box className="h-4 w-4 text-emerald-400" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-200">Hiển thị Mèo Leo 3D Three.js</p>
                <p className="text-[10px] text-muted-foreground">Tắt để chuyển sang ảnh minh họa Leo 2D</p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={settings.visualMode === '3d_model'}
              type="button"
              onClick={() => updateSettings({ visualMode: settings.visualMode === '3d_model' ? '2d_leo' : '3d_model' })}
              className={`relative h-6 w-11 rounded-full transition-colors ${settings.visualMode === '3d_model' ? 'bg-emerald-500' : 'bg-muted'}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${settings.visualMode === '3d_model' ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {/* Trạng thái Chrome Extension */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Puzzle className="h-4 w-4 text-purple-400" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-200">Chrome Extension Giám Sát</p>
                <p className="text-[10px] text-muted-foreground">Giám sát chuyển tab trên toàn bộ trình duyệt</p>
              </div>
            </div>
            <Link href="/extension">
              <Button size="sm" variant="outline" className="h-8 gap-1 rounded-xl text-[11px] font-bold border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                <span>Cài đặt</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 5. Thống kê kỷ luật */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-200">Thống kê Kỷ luật Pomodoro</p>
              <p className="text-[11px] text-muted-foreground">Tổng hợp số lần bị mèo bắt quả tang chuyển tab và phiên hoàn thành</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={resetStats}
              className="h-8 text-[11px] text-slate-400 hover:text-rose-300"
            >
              <RotateCcw className="mr-1 h-3 w-3" /> Đặt lại thống kê
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center">
              <span className="block text-[11px] font-medium text-rose-300">Tổng số lần bị mắng</span>
              <span className="mt-0.5 block text-2xl font-black text-rose-400">{stats.totalShameCount}</span>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
              <span className="block text-[11px] font-medium text-emerald-300">Phiên đã hoàn thành</span>
              <span className="mt-0.5 block text-2xl font-black text-emerald-400">{stats.sessionsCompleted}</span>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-center">
              <span className="block text-[11px] font-medium text-amber-300">Thời lượng mặc định</span>
              <span className="mt-0.5 block text-2xl font-black text-amber-400">{settings.defaultMinutes}m</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

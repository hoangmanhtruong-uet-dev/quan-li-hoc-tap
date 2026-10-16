'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useClub } from '@/lib/club-engine';
import { ClubHero } from '@/components/clubs/club-hero';
import { ClubNavTabs } from '@/components/clubs/club-nav-tabs';
import {
  Users,
  Calendar,
  Coins,
  Kanban,
  ArrowRight,
  Shield,
  Sparkles,
  Award,
  Layers,
  ArrowLeft,
} from 'lucide-react';

export default function ClubOverviewPage() {
  const params = useParams();
  const clubId = typeof params.id === 'string' ? params.id : '';
  const { club, treasury, toggleRsvp } = useClub(clubId);

  if (!club) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 mb-4">
          <Shield className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Không tìm thấy Câu lạc bộ</h2>
        <p className="mt-1 text-sm text-slate-400 max-w-sm">
          Mã định danh câu lạc bộ không tồn tại hoặc đã được chuyển giao tổ chức.
        </p>
        <Link
          href="/clubs"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 px-5 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách câu lạc bộ</span>
        </Link>
      </div>
    );
  }

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(val);

  const pendingTasks = club.tasks.filter((t) => t.status !== 'done');
  const executiveBoard = club.members.filter((m) =>
    ['OWNER', 'ADMIN', 'MANAGER'].includes(m.role),
  );

  const departments = [
    {
      name: 'Ban Chủ nhiệm',
      desc: 'Hoạch định chiến lược, đối ngoại nhà trường & quản lý chung',
      members: club.members.filter((m) => m.department === 'Ban Chủ nhiệm'),
      color: 'from-amber-500/20 to-orange-500/20 border-amber-400/30 text-amber-300',
    },
    {
      name: 'Ban Chuyên môn & Kỹ thuật',
      desc: 'Nội dung học thuật, workshop, lab thực hành & huấn luyện',
      members: club.members.filter((m) => m.department === 'Ban Chuyên môn & Kỹ thuật'),
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-400/30 text-cyan-300',
    },
    {
      name: 'Ban Truyền thông & Sự kiện',
      desc: 'Sản xuất visual, content fanpage, teabreak & hậu cần sự kiện',
      members: club.members.filter((m) => m.department === 'Ban Truyền thông & Sự kiện'),
      color: 'from-purple-500/20 to-pink-500/20 border-purple-400/30 text-purple-300',
    },
    {
      name: 'Ban Đối ngoại & Tài chính',
      desc: 'Vận động tài trợ doanh nghiệp, thu chi hội phí & thủ quỹ',
      members: club.members.filter((m) => m.department === 'Ban Đối ngoại & Tài chính'),
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-400/30 text-emerald-300',
    },
  ];

  return (
    <div className="relative min-h-screen space-y-6 pb-16 overflow-x-hidden min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* 1. Club Hero Banner */}
      <ClubHero club={club} />

      {/* 2. Navigation Tabs */}
      <ClubNavTabs
        clubId={club.id}
        eventCount={club.events.length}
        memberCount={club.members.length}
        pendingTaskCount={pendingTasks.length}
      />

      {/* 3. Executive Board Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              <span>Ban Lãnh đạo &amp; Điều hành</span>
            </h3>
            <p className="text-xs text-slate-400">
              Chủ nhiệm, Phó chủ nhiệm và các Trưởng ban phụ trách
            </p>
          </div>
          <Link
            href={`/clubs/${club.id}/members`}
            className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300"
          >
            <span>Tất cả thành viên ({club.members.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {executiveBoard.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3.5 rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-4 shadow-lg hover:border-amber-400/30 transition-all"
            >
              <Image
                src={member.avatar}
                alt={member.name}
                width={48}
                height={48}
                unoptimized
                className="h-12 w-12 rounded-2xl object-cover border border-white/15 shadow-md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-sm font-bold text-white truncate">{member.name}</h4>
                  <span className="rounded-full bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 shrink-0">
                    {member.role}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">{member.department}</p>
                <p className="font-mono text-[11px] text-slate-500">MSSV: {member.studentId}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. 4 Committees Breakdown Grid */}
      <div className="space-y-4 pt-2">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-cyan-400" />
            <span>Cơ cấu Ban Chuyên Môn</span>
          </h3>
          <p className="text-xs text-slate-400">
            Phân định trách nhiệm và thành viên phụ trách từng mảng hoạt động
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.name}
              className="flex flex-col justify-between rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 shadow-lg hover:border-cyan-400/30 transition-all"
            >
              <div className="space-y-2.5">
                <span
                  className={`inline-block rounded-xl border px-2.5 py-1 text-xs font-bold ${dept.color}`}
                >
                  {dept.name}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed min-h-[2.5rem]">
                  {dept.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-400">Nhân sự</span>
                <span className="font-mono text-sm font-bold text-white">
                  {dept.members.length} thành viên
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Split Section: Upcoming Events Teaser & Treasury / Tasks Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Left: Upcoming Events */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <span>Sự kiện sắp diễn ra</span>
              </h3>
            </div>
            <Link
              href={`/clubs/${club.id}/events`}
              className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
            >
              <span>Xem tất cả ({club.events.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {club.events.slice(0, 2).map((event) => {
              const isAttending = event.attendeeIds.includes('ctc-m1');
              return (
                <div
                  key={event.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-card/40 backdrop-blur-2xl p-4 shadow-md hover:border-emerald-400/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        {event.category}
                      </span>
                      <h4 className="mt-1.5 text-sm font-bold text-white">{event.title}</h4>
                      <p className="mt-1 text-xs text-slate-400">
                        {event.date.split('-').reverse().join('/')} · {event.startTime} - {event.endTime} · {event.location}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleRsvp(event.id, 'ctc-m1')}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                        isAttending
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                          : 'bg-white/10 text-white hover:bg-emerald-500/20 hover:text-emerald-300'
                      }`}
                    >
                      {isAttending ? '✓ Đã tham gia' : 'Tham gia'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Treasury & Committee Tasks Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-400" />
              <span>Ngân sách &amp; Quỹ CLB</span>
            </h3>
            <Link
              href={`/clubs/${club.id}/finance`}
              className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300"
            >
              <span>Sổ cái thu chi</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-card/40 p-3.5 backdrop-blur-md">
              <p className="text-[11px] text-slate-400 font-semibold">Quỹ chung</p>
              <p className="mt-1 font-mono text-sm font-extrabold text-white">
                {formatVND(club.generalFundBalance)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-card/40 p-3.5 backdrop-blur-md">
              <p className="text-[11px] text-slate-400 font-semibold">Quỹ sự kiện</p>
              <p className="mt-1 font-mono text-sm font-extrabold text-purple-300">
                {formatVND(club.eventFundBalance)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-card/40 p-3.5 backdrop-blur-md">
              <p className="text-[11px] text-slate-400 font-semibold">Quỹ dự phòng</p>
              <p className="mt-1 font-mono text-sm font-extrabold text-amber-300">
                {formatVND(club.reserveFundBalance)}
              </p>
            </div>
          </div>

          {/* Pending Tasks Snippet */}
          <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-md p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Kanban className="h-4 w-4 text-cyan-400" />
                <span>Nhiệm vụ đang thực hiện ({pendingTasks.length})</span>
              </span>
              <Link
                href={`/clubs/${club.id}/tasks`}
                className="text-xs text-cyan-400 hover:underline font-semibold"
              >
                Mở bảng Kanban →
              </Link>
            </div>

            <div className="space-y-1.5">
              {pendingTasks.slice(0, 2).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl bg-white/[0.02] p-2 text-xs"
                >
                  <span className="text-slate-300 truncate max-w-[240px]">{t.title}</span>
                  <span className="rounded-full bg-cyan-500/15 border border-cyan-400/30 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
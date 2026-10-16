'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useClub } from '@/lib/club-engine';
import { ClubHero } from '@/components/clubs/club-hero';
import { ClubNavTabs } from '@/components/clubs/club-nav-tabs';
import { ClubTasksView } from '@/components/clubs/club-tasks-view';
import { Shield, ArrowLeft } from 'lucide-react';

export default function ClubTasksSubpage() {
  const params = useParams();
  const clubId = typeof params.id === 'string' ? params.id : '';
  const { club, createTask, updateTaskStatus, deleteTask } = useClub(clubId);

  if (!club) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 mb-4">
          <Shield className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Không tìm thấy Câu lạc bộ</h2>
        <p className="mt-1 text-sm text-slate-400 max-w-sm">
          Mã định danh câu lạc bộ không tồn tại hoặc đã bị xóa.
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

  const pendingTasks = club.tasks.filter((t) => t.status !== 'done');

  return (
    <div className="relative min-h-screen space-y-6 pb-16 overflow-x-hidden min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* 1. Hero */}
      <ClubHero club={club} />

      {/* 2. Nav Tabs */}
      <ClubNavTabs
        clubId={club.id}
        eventCount={club.events.length}
        memberCount={club.members.length}
        pendingTaskCount={pendingTasks.length}
      />

      {/* 3. Tasks Kanban View */}
      <ClubTasksView
        club={club}
        onCreateTask={createTask}
        onUpdateTaskStatus={updateTaskStatus}
        onDeleteTask={deleteTask}
      />
    </div>
  );
}
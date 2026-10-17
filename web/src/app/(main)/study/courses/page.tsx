'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Grid2X2,
  List,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  X,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SEED_COURSES, type CourseItem } from '@/lib/academic-engine';

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'warning' | 'saved'>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Hydrate favorites and custom courses from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('campusos-courses-v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.favorites) setFavorites(parsed.favorites);
        if (parsed.customCourses) setCourses(parsed.customCourses);
      }
    } catch {}
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(
          'campusos-courses-v2',
          JSON.stringify({ favorites: next, customCourses: courses })
        );
      } catch {}
      return next;
    });
  };

  const visibleCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch = `${c.code} ${c.name} ${c.instructor}`
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesFilter =
        filter === 'all' ||
        (filter === 'saved' ? favorites.includes(c.id) : c.status === filter);

      return matchesSearch && matchesFilter;
    });
  }, [courses, query, filter, favorites]);

  const handleAddCourse = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const code = String(data.get('code') || '').toUpperCase().trim();
    const name = String(data.get('name') || '').trim();
    const instructor = String(data.get('instructor') || 'Chưa cập nhật').trim();
    const credits = Number(data.get('credits') || 3);
    const room = String(data.get('room') || 'Phòng học A101').trim();

    if (!code || !name) return;

    const newCourse: CourseItem = {
      id: `custom-course-${Date.now()}`,
      code,
      name,
      semesterId: 'sem-fall-26',
      credits,
      instructor,
      room,
      schedule: 'Thứ Năm (14:00 - 16:30)',
      components: [
        { id: `c-1`, name: 'Chuyên cần', weightPercent: 20, score: null },
        { id: `c-2`, name: 'Giữa kỳ', weightPercent: 30, score: null },
        { id: `c-3`, name: 'Cuối kỳ', weightPercent: 50, score: null },
      ],
      finalScore: null,
      letterGrade: '—',
      status: 'ongoing',
      color: '#7C5CFF',
    };

    const nextCourses = [...courses, newCourse];
    setCourses(nextCourses);
    setShowAddModal(false);

    try {
      localStorage.setItem(
        'campusos-courses-v2',
        JSON.stringify({
          favorites,
          customCourses: nextCourses,
        })
      );
    } catch {}
  };

  return (
    <div className="mx-auto w-full max-w-[1550px] overflow-x-hidden space-y-6">
      {/* Ambient Aurora */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-600/12 blur-[140px]" />
        <div className="absolute top-[30%] right-[-10%] h-[450px] w-[450px] rounded-full bg-violet-500/10 blur-[140px]" />
      </div>

      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-1 font-mono text-xs font-bold text-cyan-300">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> Course Hub & Syllabus
            </span>

            <h1 className="font-heading text-3xl font-black tracking-tight sm:text-4xl">
              Môn Học Học Kỳ Này
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Quản lý đề cương, lịch học trên lớp, giảng viên và tiến độ làm bài tập của mọi môn học.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
              <p className="font-mono text-2xl font-bold text-cyan-300">{courses.length}</p>
              <p className="text-[10px] text-muted-foreground">Môn học</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
              <p className="font-mono text-2xl font-bold text-violet-300">
                {courses.reduce((sum, c) => sum + c.credits, 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">Tín chỉ kỳ này</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
              <p className="font-mono text-2xl font-bold text-emerald-400">92%</p>
              <p className="text-[10px] text-muted-foreground">Đi học đầy đủ</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter Controls */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-lg flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo mã môn, tên môn hoặc tên giảng viên..."
            className="h-11 rounded-2xl border-white/10 bg-card/40 pl-10 text-sm backdrop-blur-xl focus:border-cyan-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Pills */}
          <div className="flex overflow-x-auto rounded-2xl border border-white/10 bg-card/40 p-1 backdrop-blur-xl">
            {(
              [
                ['all', 'Tất cả'],
                ['ongoing', 'Đang học'],
                ['warning', 'Cần chú ý'],
                ['saved', 'Đã ghim'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === val
                    ? 'border border-cyan-400/40 bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(61,232,255,0.25)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex rounded-2xl border border-white/10 bg-card/40 p-1 backdrop-blur-xl">
            <button
              onClick={() => setView('grid')}
              aria-label="Xem dạng lưới"
              className={`rounded-xl p-2 ${
                view === 'grid' ? 'bg-white/10 text-foreground' : 'text-muted-foreground'
              }`}
            >
              <Grid2X2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('list')}
              aria-label="Xem dạng danh sách"
              className={`rounded-xl p-2 ${
                view === 'list' ? 'bg-white/10 text-foreground' : 'text-muted-foreground'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Button
            onClick={() => setShowAddModal(true)}
            className="h-11 gap-2 rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-violet-600 to-cyan-600 font-bold text-white shadow-[0_0_15px_rgba(61,232,255,0.25)] hover:from-violet-500 hover:to-cyan-500"
          >
            <Plus className="h-4 w-4" /> Thêm môn học
          </Button>
        </div>
      </section>

      {/* Course List / Grid */}
      {visibleCourses.length > 0 ? (
        <section
          className={
            view === 'grid'
              ? 'grid gap-5 md:grid-cols-2 xl:grid-cols-3'
              : 'space-y-3'
          }
        >
          {visibleCourses.map((course) => {
            const isFav = favorites.includes(course.id);

            return (
              <div
                key={course.id}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 p-5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] transition-all hover:border-white/20 hover:-translate-y-0.5"
              >
                {/* Accent neon bar */}
                <div
                  className="absolute left-0 top-0 h-1.5 w-full"
                  style={{ backgroundColor: course.color }}
                />

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      {course.code}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                        course.status === 'warning'
                          ? 'border border-amber-400/30 bg-amber-500/15 text-amber-300'
                          : 'border border-cyan-400/30 bg-cyan-500/15 text-cyan-300'
                      }`}
                    >
                      {course.status === 'warning' ? 'Cần chú ý' : 'Đang học'}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleFavorite(course.id)}
                    className={`rounded-xl p-1.5 transition-colors ${
                      isFav ? 'text-amber-400 bg-amber-400/10' : 'text-muted-foreground hover:bg-white/5'
                    }`}
                    aria-label="Ghim môn học"
                  >
                    <Star className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <h3 className="font-heading mt-2 text-base font-bold text-foreground truncate">
                  {course.name}
                </h3>

                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                  <User className="h-3.5 w-3.5 text-cyan-400" /> {course.instructor}
                </p>

                <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-violet-400" />
                    {course.schedule}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-pink-400" />
                    {course.room}
                  </span>
                </div>

                {/* Footer with credits and link */}
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="font-mono text-xs font-semibold text-muted-foreground">
                    {course.credits} tín chỉ
                  </span>

                  <Link
                    href={`/study/courses/${course.id}`}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-white/[0.08]"
                  >
                    Vào môn học →
                  </Link>
                </div>
              </div>
            );
          })}
        </section>
      ) : courses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center backdrop-blur-xl">
          <BookOpen className="mx-auto h-8 w-8 text-cyan-400" />
          <h3 className="mt-4 font-heading text-lg font-bold">Chưa có môn học nào trong học kỳ này</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
            Bắt đầu bằng cách thêm môn học thủ công hoặc quét ảnh thời khóa biểu từ cổng trường đại học bằng AI.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => setShowAddModal(true)}
              className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-xs"
            >
              <Plus className="h-4 w-4" /> Thêm Môn Học
            </Button>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-white/10 transition-colors"
            >
              <Sparkles className="h-4 w-4" /> Quét TKB bằng AI →
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center backdrop-blur-xl">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-heading text-sm font-bold">Không tìm thấy môn học nào</p>
          <p className="mt-1 text-xs text-muted-foreground">Hãy thử thay đổi từ khóa hoặc bộ lọc tìm kiếm.</p>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <form
            onSubmit={handleAddCourse}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-6 shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold">Thêm Môn Học Mới</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl p-1 text-muted-foreground hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Mã môn (Course Code):</label>
                <Input required name="code" placeholder="VD: CS301" className="mt-1 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Tên môn học:</label>
                <Input required name="name" placeholder="VD: Trí tuệ nhân tạo" className="mt-1 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Số tín chỉ:</label>
                  <Input required name="credits" type="number" defaultValue={3} className="mt-1 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Phòng học:</label>
                  <Input name="room" placeholder="VD: D201" className="mt-1 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Giảng viên phụ trách:</label>
                <Input name="instructor" placeholder="VD: PGS. TS. Nguyễn Văn A" className="mt-1 rounded-xl" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                Hủy
              </Button>
              <Button type="submit" className="bg-cyan-600 font-bold hover:bg-cyan-500">
                Lưu môn học
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

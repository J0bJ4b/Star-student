import React, { useState, useMemo } from 'react';
import { useStudents } from '../context/StudentContext';
import { Student } from '../types';
import { StudentAvatar } from '../components/StudentAvatar';
import { StudentProfileModal } from '../components/StudentProfileModal';
import {
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  Star,
  Plus,
  Minus,
  CheckCircle2,
  Tag,
  MessageSquare,
  Users,
} from 'lucide-react';

export const AddStar: React.FC = () => {
  const {
    students,
    categories,
    addStars,
    deductStars,
    selectedClassroom,
    setSelectedClassroom,
    classrooms,
  } = useStudents();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || 'ส่งงานครบ');
  const [starRangeFilter, setStarRangeFilter] = useState<string>('all'); // all, 0-10, 10-20, 20+
  const [sortBy, setSortBy] = useState<'stars-desc' | 'stars-asc' | 'name-asc' | 'recent'>('stars-desc');
  const [quickNote, setQuickNote] = useState<string>('');
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);

  // Filter & Sort
  const processedStudents = useMemo(() => {
    let result = [...students];

    // Filter by classroom
    if (selectedClassroom !== 'all') {
      result = result.filter((s) => s.classroom === selectedClassroom);
    }

    // Filter by name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.classroom.toLowerCase().includes(q)
      );
    }

    // Filter by star range
    if (starRangeFilter === '0-10') {
      result = result.filter((s) => s.stars >= 0 && s.stars <= 10);
    } else if (starRangeFilter === '10-20') {
      result = result.filter((s) => s.stars > 10 && s.stars <= 20);
    } else if (starRangeFilter === '20+') {
      result = result.filter((s) => s.stars > 20);
    }

    // Sort
    if (sortBy === 'stars-desc') {
      result.sort((a, b) => b.stars - a.stars);
    } else if (sortBy === 'stars-asc') {
      result.sort((a, b) => a.stars - b.stars);
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'th'));
    } else if (sortBy === 'recent') {
      result.sort((a, b) => {
        const lastA = a.starHistory[0]?.timestamp || 0;
        const lastB = b.starHistory[0]?.timestamp || 0;
        return lastB - lastA;
      });
    }

    return result;
  }, [students, selectedClassroom, searchQuery, starRangeFilter, sortBy]);

  const totalFilteredStars = processedStudents.reduce((acc, s) => acc + s.stars, 0);

  const handleAddStar = (
    studentId: string,
    amount: number,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    setActiveStudentId(studentId);
    setTimeout(() => setActiveStudentId(null), 800);
    addStars(studentId, amount, selectedCategory, quickNote.trim() || undefined, e);
  };

  const handleDeductStar = (studentId: string, amount: number) => {
    setActiveStudentId(studentId);
    setTimeout(() => setActiveStudentId(null), 800);
    deductStars(studentId, amount, `ปรับลดคะแนน (${selectedCategory})`, quickNote.trim() || undefined);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#150a24] p-5 rounded-3xl border border-white/10 shadow-lg shadow-purple-950/20">
        <div>
          <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs tracking-wide">
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>โหมดเพิ่มดาวความดี</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-heading mt-0.5">
            ให้ดาวนักเรียน 🌟
          </h1>
          <p className="text-xs text-slate-400">
            เลือกหมวดหมู่ความดี แล้วกดเพิ่มดาวเต็ม (+1) หรือครึ่งดวง (+½) ให้นักเรียนได้ทันที
          </p>
        </div>

        {/* Mini stats summary */}
        <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">แสดงนักเรียน:</span>
            <span className="font-bold text-purple-300 text-sm font-heading">
              {processedStudents.length} คน
            </span>
          </div>
          <div className="h-7 w-px bg-white/10" />
          <div>
            <span className="text-slate-400 block text-[10px]">ดาวรวมในกลุ่ม:</span>
            <span className="font-bold text-amber-400 text-sm font-heading">
              {totalFilteredStars} ⭐
            </span>
          </div>
        </div>
      </div>

      {/* Category selector pill strip */}
      <div className="bg-[#150a24] p-4 rounded-2xl border border-white/10 shadow-lg shadow-purple-950/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Tag className="w-3.5 h-3.5 text-purple-400" />
            <span>เลือกเหตุผลการให้ดาว (หมวดหมู่ความดี):</span>
          </div>
          <span className="text-[11px] text-purple-400 font-medium">
            เลือกไว้: <strong>{selectedCategory}</strong>
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-400 font-semibold shadow-[0_0_12px_rgba(147,51,234,0.3)] scale-102 ring-2 ring-purple-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                }`}
              >
                {isSelected && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Optional quick note */}
        <div className="pt-2 border-t border-white/10 flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            placeholder="บันทึกย่อเพิ่มเติม (ระบุหรือไม่ก็ได้ เช่น 'ส่งการบ้านวิชาคณิตศาสตร์ครบ')"
            className="w-full text-xs px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white/5 text-slate-200 placeholder:text-slate-500"
          />
          {quickNote && (
            <button
              type="button"
              onClick={() => setQuickNote('')}
              className="text-xs text-slate-400 hover:text-slate-200 px-1"
            >
              ล้าง
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#150a24] p-4 rounded-2xl border border-white/10 shadow-lg shadow-purple-950/20 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ หรือ ชั้นเรียน..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/5 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Classroom filter */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400 whitespace-nowrap">ห้อง:</span>
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="w-full bg-transparent border-0 focus:outline-none text-xs text-white font-medium [&>option]:bg-[#150a24]"
            >
              <option value="all">ทุกชั้นเรียน</option>
              {classrooms.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Star Range filter */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 whitespace-nowrap">ช่วงดาว:</span>
            <select
              value={starRangeFilter}
              onChange={(e) => setStarRangeFilter(e.target.value)}
              className="w-full bg-transparent border-0 focus:outline-none text-xs text-white font-medium [&>option]:bg-[#150a24]"
            >
              <option value="all">ทั้งหมด</option>
              <option value="0-10">0 - 10 ดวง</option>
              <option value="10-20">11 - 20 ดวง</option>
              <option value="20+">มากกว่า 20 ดวง</option>
            </select>
          </div>

          {/* Sort options */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 whitespace-nowrap">เรียง:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-transparent border-0 focus:outline-none text-xs text-white font-medium [&>option]:bg-[#150a24]"
            >
              <option value="stars-desc">ดาวมาก ➔ น้อย</option>
              <option value="stars-asc">ดาวน้อย ➔ มาก</option>
              <option value="name-asc">ตามตัวอักษร ก-ฮ</option>
              <option value="recent">เพิ่งได้รับดาวล่าสุด</option>
            </select>
          </div>
        </div>
      </div>

      {/* Column Layout Student Cards Table */}
      {processedStudents.length === 0 ? (
        <div className="bg-[#150a24] rounded-3xl p-12 text-center border border-white/10 shadow-lg shadow-purple-950/20">
          <Users className="w-12 h-12 text-purple-400/40 mx-auto mb-3" />
          <h3 className="font-heading text-base font-bold text-slate-300">ไม่พบรายชื่อนักเรียน</h3>
          <p className="text-xs text-slate-500 mt-1">
            ลองปรับเปลี่ยนคำค้นหา หรือเพิ่มรายชื่อนักเรียนใหม่ในหน้า "จัดการนักเรียน"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedStudents.map((student) => {
            const isUpdated = activeStudentId === student.id;
            return (
              <div
                key={student.id}
                className={`bg-[#150a24] rounded-2xl p-4 border transition-all duration-200 shadow-lg shadow-purple-950/20 flex flex-col justify-between ${
                  isUpdated
                    ? 'border-amber-400 ring-2 ring-amber-400/30 scale-102 bg-purple-900/20'
                    : 'border-white/10 hover:border-purple-500/40 hover:bg-[#180c29]'
                }`}
              >
                {/* Student Info Top */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setProfileStudent(student)}
                    title="คลิกเพื่อดูโปรไฟล์และประวัติของนักเรียน"
                  >
                    <StudentAvatar
                      name={student.name}
                      avatarUrl={student.avatarUrl}
                      size="md"
                      className="border border-white/20 group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-heading font-bold text-white group-hover:text-amber-300 transition-colors text-sm leading-tight line-clamp-1">
                          {student.name}
                        </h4>
                        {student.nickname && (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                            {student.nickname}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-purple-600/20 text-purple-300 text-[10px] font-medium border border-purple-500/20">
                          {student.classroom}
                        </span>
                        <span className="text-[10px] text-purple-400/80 group-hover:text-purple-300 group-hover:underline">
                          ดูโปรไฟล์
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Star count pill */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 font-bold text-sm shrink-0 shadow-[0_0_10px_rgba(251,191,36,0.15)]">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{student.stars}</span>
                  </div>
                </div>

                {/* Last activity hint */}
                <div className="mt-3 text-[11px] text-slate-400 line-clamp-1">
                  {student.starHistory[0] ? (
                    <span>
                      ล่าสุด: {student.starHistory[0].category} (
                      {student.starHistory[0].amount > 0 ? '+' : ''}
                      {student.starHistory[0].amount})
                    </span>
                  ) : (
                    <span className="text-slate-500">ยังไม่มีประวัติดาว</span>
                  )}
                </div>

                {/* Star Control Buttons (-1, -½, +½, +1) */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="grid grid-cols-4 gap-1.5">
                    {/* -1 button */}
                    <button
                      type="button"
                      onClick={() => handleDeductStar(student.id, 1)}
                      disabled={student.stars < 1}
                      className="py-2 px-1 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all duration-150 flex flex-col items-center justify-center hover:scale-105 active:scale-95"
                      title="ลด 1 ดาว"
                    >
                      <div className="flex items-center">
                        <Minus className="w-3 h-3" />
                        <span>1</span>
                      </div>
                      <span className="text-[9px] font-normal text-red-300/70">ลด 1</span>
                    </button>

                    {/* -0.5 button */}
                    <button
                      type="button"
                      onClick={() => handleDeductStar(student.id, 0.5)}
                      disabled={student.stars < 0.5}
                      className="py-2 px-1 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all duration-150 flex flex-col items-center justify-center hover:scale-105 active:scale-95"
                      title="ลดครึ่งดาว (0.5)"
                    >
                      <div className="flex items-center">
                        <Minus className="w-3 h-3" />
                        <span>½</span>
                      </div>
                      <span className="text-[9px] font-normal text-rose-300/70">ลด ½</span>
                    </button>

                    {/* +0.5 button */}
                    <button
                      type="button"
                      onClick={(e) => handleAddStar(student.id, 0.5, e)}
                      className="py-2 px-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all duration-150 flex flex-col items-center justify-center hover:scale-105 active:scale-95 shadow-[0_0_8px_rgba(251,191,36,0.2)]"
                      title="เพิ่มครึ่งดาว (+0.5)"
                    >
                      <div className="flex items-center text-amber-400">
                        <Plus className="w-3 h-3" />
                        <span>½</span>
                      </div>
                      <span className="text-[9px] font-medium text-amber-300">+½ ดาว</span>
                    </button>

                    {/* +1 button (Primary emerald) */}
                    <button
                      type="button"
                      onClick={(e) => handleAddStar(student.id, 1, e)}
                      className="py-2 px-1 rounded-xl bg-green-500 hover:bg-green-400 text-white text-xs font-bold transition-all duration-150 flex flex-col items-center justify-center hover:scale-105 active:scale-95 shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                      title="เพิ่ม 1 ดาวเต็ม"
                    >
                      <div className="flex items-center">
                        <Plus className="w-3 h-3 text-white" />
                        <span className="text-white font-extrabold">1</span>
                      </div>
                      <span className="text-[9px] text-green-100 font-medium">+1 ดาว</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Profile & Quick Actions Modal */}
      <StudentProfileModal
        student={profileStudent}
        isOpen={!!profileStudent}
        onClose={() => setProfileStudent(null)}
      />
    </div>
  );
};

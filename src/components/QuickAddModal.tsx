import React, { useState, useMemo, useEffect } from 'react';
import { useStudents } from '../context/StudentContext';
import { StudentAvatar } from './StudentAvatar';
import {
  Sparkles,
  X,
  Search,
  CheckSquare,
  Square,
  Check,
  Tag,
  MessageSquare,
  Star,
  Users,
  School,
  ArrowRight,
  Filter,
  Flame,
} from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  const {
    students,
    categories,
    addStarsToMultiple,
    classrooms,
    selectedClassroom,
  } = useStudents();

  // Selection & Form State
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [starAmount, setStarAmount] = useState<number>(1);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || 'ส่งงานครบ');
  const [note, setNote] = useState<string>('');

  // Filtering State
  const [classroomFilter, setClassroomFilter] = useState<string>(
    selectedClassroom !== 'all' ? selectedClassroom : 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successFeedback, setSuccessFeedback] = useState<{
    count: number;
    stars: number;
  } | null>(null);

  // Sync classroom filter when opened
  useEffect(() => {
    if (isOpen) {
      setClassroomFilter(selectedClassroom !== 'all' ? selectedClassroom : 'all');
      setSelectedCategory(categories[0] || 'ส่งงานครบ');
      setSuccessFeedback(null);
      setIsSubmitting(false);
    }
  }, [isOpen, selectedClassroom, categories]);

  // Filter students based on classroom & search
  const filteredStudents = useMemo(() => {
    let list = [...students];

    if (classroomFilter !== 'all') {
      list = list.filter((s) => s.classroom === classroomFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.nickname && s.nickname.toLowerCase().includes(q)) ||
          (s.studentCode && s.studentCode.toLowerCase().includes(q)) ||
          s.classroom.toLowerCase().includes(q)
      );
    }

    // Sort alphabetically or by classroom
    return list.sort((a, b) => a.name.localeCompare(b.name, 'th'));
  }, [students, classroomFilter, searchQuery]);

  // Toggle individual student selection
  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all currently filtered students
  const handleSelectAllFiltered = () => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      filteredStudents.forEach((s) => next.add(s.id));
      return next;
    });
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedStudentIds(new Set());
  };

  // Effective star amount
  const effectiveAmount = useMemo(() => {
    if (customAmount.trim()) {
      const num = parseFloat(customAmount);
      return isNaN(num) || num <= 0 ? 1 : num;
    }
    return starAmount;
  }, [starAmount, customAmount]);

  // Handle star amount preset click
  const handlePresetAmount = (amount: number) => {
    setStarAmount(amount);
    setCustomAmount('');
  };

  // Submit batch star award
  const handleSubmit = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (selectedStudentIds.size === 0 || effectiveAmount <= 0) return;

    setIsSubmitting(true);
    const idsArray = Array.from(selectedStudentIds);

    const result = addStarsToMultiple(
      idsArray,
      effectiveAmount,
      selectedCategory,
      note.trim() || undefined,
      e as React.MouseEvent
    );

    if (result.success) {
      setSuccessFeedback({
        count: result.count,
        stars: result.totalStarsAwarded,
      });

      // Reset selection and close after a short celebration moment
      setTimeout(() => {
        setSelectedStudentIds(new Set());
        setNote('');
        setCustomAmount('');
        setIsSubmitting(false);
        setSuccessFeedback(null);
        onClose();
      }, 1400);
    } else {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedStudentIds.has(s.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="bg-[#150a24] border border-white/15 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl shadow-purple-950/60 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient decoration */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#150a24]/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-900/40 text-white">
              <Sparkles className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                  เพิ่มดาวด่วนหลายคน (Quick Add)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-semibold">
                  Batch Award
                </span>
              </div>
              <p className="text-xs text-slate-400">
                เลือกนักเรียนหลายคนพร้อมกันด้วยช่อง Checkbox แล้วมอบดาวในคลิกเดียว
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Overlay Banner */}
        {successFeedback && (
          <div className="absolute inset-0 z-30 bg-[#150a24]/95 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-bounce">
              <Sparkles className="w-8 h-8 fill-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white font-heading">
              มอบดาวสำเร็จเรียบร้อย! ✨
            </h3>
            <p className="text-sm text-emerald-300 mt-1 font-medium">
              เพิ่มดาวให้นักเรียนทั้งหมด {successFeedback.count} คน (รวมมอบ {successFeedback.stars} ⭐)
            </p>
            <span className="text-xs text-slate-400 mt-3">กำลังบันทึกและซิงก์ข้อมูล...</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          {/* STEP 1: CONFIGURE STARS & CATEGORY */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>1. กำหนดจำนวนดาว & หมวดหมู่ความดี</span>
              </span>

              {/* Star amount presets */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 mr-1">จำนวนดาว:</span>
                {[0.5, 1, 2, 3, 5].map((amt) => {
                  const isSelected = !customAmount && starAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePresetAmount(amt)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)] scale-105'
                          : 'bg-white/10 hover:bg-white/20 text-amber-300 border border-white/5'
                      }`}
                    >
                      {amt === 0.5 ? '+½' : `+${amt}`} ⭐
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom star input & Note row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="text-[11px] text-slate-400 block mb-1">
                  หรือระบุจำนวนเอง:
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="100"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="เช่น 1.5, 4"
                  className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-400 block mb-1">
                  บันทึกหมายเหตุ (ไม่บังคับ):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="เช่น ช่วยคุณครูจัดโต๊ะ, ตอบคำถามกิจกรรม"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            {/* Category selection pills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-purple-400" />
                  <span>หมวดหมู่ความดี:</span>
                </span>
                <span className="text-[11px] text-amber-300 font-semibold">
                  {selectedCategory}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-xl text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white font-bold border border-purple-400 shadow-sm shadow-purple-900/40'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 2: SELECT STUDENTS WITH CHECKBOXES */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. ติ๊กเลือกนักเรียนที่ต้องการมอบดาว</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  (เลือกแล้ว {selectedStudentIds.size} จาก {students.length} คน)
                </span>
              </span>

              {/* Quick Select Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={allFilteredSelected ? handleClearSelection : handleSelectAllFiltered}
                  className="px-3 py-1 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {allFilteredSelected ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ยกเลิกเลือกทั้งหมด</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-purple-400" />
                      <span>เลือกทั้งหมดในรายการ ({filteredStudents.length})</span>
                    </>
                  )}
                </button>

                {selectedStudentIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-2.5 py-1 text-slate-400 hover:text-rose-400 text-xs transition-colors cursor-pointer"
                  >
                    ล้าง
                  </button>
                )}
              </div>
            </div>

            {/* Filter toolbar: Search & Classroom */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ, ชื่อเล่น, รหัสประจำตัว..."
                  className="w-full pl-8 pr-8 py-2 text-xs bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Classroom filter pill buttons / select */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 shrink-0">
                <button
                  type="button"
                  onClick={() => setClassroomFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    classroomFilter === 'all'
                      ? 'bg-purple-600/40 text-purple-200 border border-purple-400 font-bold'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  ทุกห้อง ({students.length})
                </button>
                {classrooms.map((cls) => {
                  const countInClass = students.filter((s) => s.classroom === cls).length;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setClassroomFilter(cls)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        classroomFilter === cls
                          ? 'bg-purple-600/40 text-purple-200 border border-purple-400 font-bold'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      ห้อง {cls} ({countInClass})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Student List Grid with Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
              {filteredStudents.length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-500 text-xs bg-black/20 rounded-2xl border border-white/5">
                  ไม่พบรายชื่อนักเรียนที่ตรงกับเงื่อนไขการค้นหา
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const isChecked = selectedStudentIds.has(student.id);

                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none ${
                        isChecked
                          ? 'bg-gradient-to-r from-purple-950/70 to-indigo-950/70 border-purple-400/80 shadow-[0_0_15px_rgba(147,51,234,0.25)] ring-1 ring-purple-400/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Left: Checkbox + Avatar + Info */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Custom Styled Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-950'
                              : 'border border-white/30 bg-black/30 text-transparent'
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 stroke-[3] ${isChecked ? 'opacity-100' : 'opacity-0'}`} />
                        </div>

                        {/* Avatar */}
                        <StudentAvatar
                          name={student.name}
                          avatarUrl={student.avatarUrl}
                          size="sm"
                        />

                        {/* Text info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[120px]">
                              {student.name}
                            </span>
                            {student.nickname && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 font-medium shrink-0">
                                ({student.nickname})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            <span className="text-slate-400 font-medium">ห้อง {student.classroom}</span>
                            {student.studentCode && (
                              <span>• รหัส {student.studentCode}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Current Star count badge */}
                      <div className="shrink-0 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-xl border border-white/5">
                        <span className="text-amber-400 text-xs font-bold">
                          {student.stars}
                        </span>
                        <span className="text-amber-400 text-[10px]">⭐</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer: Live Summary & Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#150a24]/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-10">
          {/* Summary text */}
          <div className="text-xs text-slate-300 flex items-center gap-2 self-start sm:self-auto">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              เลือกนักเรียน{' '}
              <strong className="text-emerald-400 font-bold text-sm">
                {selectedStudentIds.size}
              </strong>{' '}
              คน • เพิ่มคนละ{' '}
              <strong className="text-amber-400 font-bold text-sm">
                +{effectiveAmount} ⭐
              </strong>
              {selectedStudentIds.size > 0 && (
                <span className="text-slate-400 ml-1">
                  (รวมมอบ{' '}
                  <strong className="text-amber-300 font-bold">
                    {(selectedStudentIds.size * effectiveAmount).toFixed(1)} ⭐
                  </strong>
                  )
                </span>
              )}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/15 text-slate-300 rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              id="confirm-quick-add-stars-button"
              onClick={handleSubmit}
              disabled={selectedStudentIds.size === 0 || effectiveAmount <= 0 || isSubmitting}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600 hover:from-emerald-400 hover:to-purple-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-102 active:scale-98"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>
                {isSubmitting
                  ? 'กำลังมอบดาว...'
                  : selectedStudentIds.size === 0
                  ? 'กรุณาเลือกนักเรียน'
                  : `มอบดาว (${selectedStudentIds.size} คน)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

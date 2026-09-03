import React, { useState, useMemo, useEffect } from 'react';
import { useStudents } from '../context/StudentContext';
import { Student } from '../types';
import {
  Search,
  Star,
  Sparkles,
  Trophy,
  Gift,
  Award,
  Calendar,
  School,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  History,
  QrCode,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ChevronLeft,
  Filter,
} from 'lucide-react';
import { useLocation, useRoute } from 'wouter';

interface StudentPortalProps {
  studentIdParam?: string;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ studentIdParam }) => {
  const { students, rewards, classrooms } = useStudents();
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute<{ id: string }>('/portal/:id');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClassroom, setActiveClassroom] = useState<string>('all');
  
  // Selected student state: priority is route param, then query string param (?student=ID), then local state
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    if (studentIdParam) return studentIdParam;
    if (match && params?.id) return params.id;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('student') || null;
    }
    return null;
  });

  // Share link toast / feedback state
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Sync if URL route changes or query string changes
  useEffect(() => {
    const idFromParam = studentIdParam || (match && params?.id ? params.id : null);
    if (idFromParam) {
      setSelectedStudentId(idFromParam);
    } else if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryId = urlParams.get('student');
      if (queryId) setSelectedStudentId(queryId);
    }
  }, [studentIdParam, match, params?.id, location]);

  // Filter students based on classroom and search
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass = activeClassroom === 'all' || s.classroom === activeClassroom;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.nickname && s.nickname.toLowerCase().includes(q)) ||
        (s.studentCode && s.studentCode.toLowerCase().includes(q));
      return matchClass && matchQuery;
    });
  }, [students, activeClassroom, searchQuery]);

  // Current viewed student
  const currentStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Rank in class or overall
  const studentRank = useMemo(() => {
    if (!currentStudent) return null;
    const sorted = [...students]
      .filter((s) => s.classroom === currentStudent.classroom)
      .sort((a, b) => b.stars - a.stars);
    const index = sorted.findIndex((s) => s.id === currentStudent.id);
    return {
      classRank: index + 1,
      totalInClass: sorted.length,
    };
  }, [students, currentStudent]);

  // Next reward target
  const nextReward = useMemo(() => {
    if (!currentStudent) return null;
    const locked = rewards
      .filter((r) => currentStudent.stars < r.requiredStars)
      .sort((a, b) => a.requiredStars - b.requiredStars);
    return locked[0] || null;
  }, [currentStudent, rewards]);

  // Generate distinct public share link for this student
  const getDirectShareLink = (stId: string) => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    return `${origin}/portal/${stId}`;
  };

  const currentShareLink = currentStudent ? getDirectShareLink(currentStudent.id) : '';

  const handleCopyLink = () => {
    if (!currentShareLink) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentShareLink);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setLocation(`/portal/${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelectedStudentId(null);
    setLocation('/portal');
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Top Banner / Welcome header */}
      <div className="bg-gradient-to-r from-purple-900/70 via-indigo-900/60 to-purple-950/80 border border-purple-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl shadow-purple-950/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-64 h-64 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Student Star Portal • สำหรับนักเรียนและผู้ปกครอง</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight flex items-center gap-2">
              <span>สมุดสะสมดาวความดีของฉัน</span>
              <span className="text-amber-400 text-xl sm:text-2xl">⭐</span>
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 mt-1 max-w-xl leading-relaxed">
              หน้านี้เป็นลิงก์แยกสำหรับให้นักเรียนและผู้ปกครองเปิดตรวจเช็กคะแนนดาวสะสมล่าสุด บันทึกความดี และดูของรางวัลที่สามารถแลกได้
            </p>
          </div>

          {/* Quick Search in Header (when in list mode or quick find) */}
          {!currentStudent && (
            <div className="w-full md:w-80">
              <div className="relative">
                <Search className="w-4 h-4 text-purple-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="พิมพ์ชื่อเล่น, ชื่อจริง หรือรหัส..."
                  className="w-full pl-10 pr-4 py-3 bg-white/10 hover:bg-white/15 focus:bg-[#120626] border border-white/15 focus:border-amber-400 rounded-2xl text-xs sm:text-sm text-white placeholder:text-purple-300/60 focus:outline-none transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-300 hover:text-white"
                  >
                    ล้าง
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Classroom Filter Chips (Only show in browse mode) */}
        {!currentStudent && (
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-purple-300 mr-1 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5" />
              <span>ห้องเรียน:</span>
            </span>
            <button
              type="button"
              onClick={() => setActiveClassroom('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeClassroom === 'all'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              ทุกห้อง ({students.length})
            </button>
            {classrooms.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveClassroom(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeClassroom === c
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Layout */}
      {currentStudent ? (
        /* INDIVIDUAL STUDENT SCORE CARD & PASSPORT */
        <div className="space-y-6 animate-fade-in">
          {/* Action Bar: Back to All Students & Share Direct Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#150a24]/80 p-3 sm:p-4 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={handleBackToList}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-purple-200 border border-white/10 rounded-xl text-xs font-semibold transition-colors self-start cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>ดูรายชื่อเพื่อนคนอื่นในห้อง</span>
            </button>

            {/* Direct Link Share Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="hidden sm:block text-xs text-slate-400">
                ส่งลิงก์นี้ให้นักเรียนดูได้ทันที:
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-950/40 cursor-pointer active:scale-95"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>คัดลอกลิงก์แล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอกลิงก์ส่งให้นักเรียน</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                title="สร้าง QR Code สแกนดูคะแนน"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>QR Code</span>
              </button>
            </div>
          </div>

          {/* Student Profile Hero Card */}
          <div className="bg-gradient-to-br from-[#1c0c33] via-[#150727] to-[#0f041d] border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Big Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-amber-400 p-1 shadow-xl shadow-purple-950/60">
                  <div className="w-full h-full rounded-[22px] bg-[#120626] overflow-hidden flex items-center justify-center">
                    {currentStudent.avatarUrl ? (
                      <img
                        src={currentStudent.avatarUrl}
                        alt={currentStudent.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl sm:text-4xl font-black text-amber-300 font-heading">
                        {currentStudent.nickname
                          ? currentStudent.nickname.slice(0, 2)
                          : currentStudent.name.slice(0, 2)}
                      </span>
                    )}
                  </div>
                </div>
                {/* Level badge */}
                <div className="absolute -bottom-2 -right-2 px-2.5 py-1 bg-amber-400 text-slate-950 font-black text-[11px] rounded-xl shadow-lg border-2 border-[#120626] flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  <span>อันดับ {studentRank?.classRank}</span>
                </div>
              </div>

              {/* Student Bio */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
                    ห้อง {currentStudent.classroom}
                  </span>
                  {currentStudent.studentCode && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-white/5 text-slate-400 border border-white/10 text-xs font-mono">
                      เลขประจำตัว: {currentStudent.studentCode}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>อัปเดตเรียลไทม์</span>
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-heading font-black text-white mt-2">
                  {currentStudent.name}
                  {currentStudent.nickname && (
                    <span className="text-amber-300 text-xl font-normal ml-2 font-sans">
                      (น้อง{currentStudent.nickname})
                    </span>
                  )}
                </h2>

                <p className="text-xs text-purple-300 mt-1">
                  ห้องเรียน {currentStudent.classroom} • อยู่ในอันดับที่ {studentRank?.classRank} จากเพื่อนทั้งหมด {studentRank?.totalInClass} คนในห้อง
                </p>

                {/* Progress bar to next reward */}
                {nextReward && (
                  <div className="mt-4 pt-4 border-t border-white/10 max-w-md">
                    <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                      <span className="flex items-center gap-1 text-amber-300 font-semibold">
                        <Gift className="w-3.5 h-3.5" />
                        <span>รางวัลถัดไป: {nextReward.name}</span>
                      </span>
                      <span className="text-slate-400 font-medium">
                        ขาดอีก {nextReward.requiredStars - currentStudent.stars} ดาว
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500 shadow-[0_0_10px_#f59e0b]"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((currentStudent.stars / nextReward.requiredStars) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Huge Star Count Badge */}
              <div className="shrink-0 bg-gradient-to-b from-amber-400/20 via-amber-500/10 to-transparent p-5 rounded-3xl border border-amber-400/30 text-center min-w-[140px] shadow-lg shadow-amber-950/20">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                  คะแนนดาวสะสม
                </span>
                <div className="flex items-center justify-center gap-1.5 my-1">
                  <Star className="w-7 h-7 text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                  <span className="text-4xl sm:text-5xl font-black text-white font-heading">
                    {currentStudent.stars}
                  </span>
                </div>
                <span className="text-[11px] text-amber-200/70 font-medium block">
                  ดวงความดี
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Grid: Left = Good Deeds History Timeline, Right = Rewards Passport */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: GOOD DEEDS TIMELINE (2 COLS) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#150a24]/90 border border-white/10 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-white text-base">
                        สมุดบันทึกประวัติการทำความดี
                      </h3>
                      <p className="text-xs text-slate-400">
                        บันทึกความดีที่คุณครูมอบให้ ({currentStudent.starHistory?.length || 0} ครั้ง)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    +{currentStudent.stars} ดาวรวม
                  </span>
                </div>

                {/* Timeline Items */}
                {!currentStudent.starHistory || currentStudent.starHistory.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Sparkles className="w-8 h-8 mx-auto text-slate-500" />
                    <p className="text-sm font-medium text-slate-300">ยังไม่มีบันทึกประวัติดาว</p>
                    <p className="text-xs text-slate-500">
                      เมื่อน้องทำความดีหรือช่วยเหลืองานในห้องเรียน คุณครูจะเพิ่มดาวให้ที่นี่นะ!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {[...currentStudent.starHistory]
                      .reverse()
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-start justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                                item.amount > 0
                                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {item.amount > 0 ? `+${item.amount}` : item.amount}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white text-xs sm:text-sm">
                                  {item.category}
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(item.timestamp).toLocaleString('th-TH', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              {item.note && (
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 inline-block">
                                  "{item.note}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-amber-400 text-xs font-bold shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{item.amount > 0 ? `+${item.amount}` : item.amount}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: REWARDS PASSPORT & CLAIM STATUS (1 COL) */}
            <div className="space-y-4">
              <div className="bg-[#150a24]/90 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white text-base">
                      สถานะของรางวัล (Rewards)
                    </h3>
                    <p className="text-xs text-slate-400">
                      รางวัลที่แลกได้ตามเกณฑ์คะแนนดาว
                    </p>
                  </div>
                </div>

                {/* Claimed Rewards Section */}
                {currentStudent.claimedRewards && currentStudent.claimedRewards.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      <span>รางวัลที่เคยได้รับแล้ว:</span>
                    </span>
                    <div className="space-y-1.5">
                      {currentStudent.claimedRewards.map((c, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between"
                        >
                          <span className="text-emerald-300 font-semibold">{c.rewardName}</span>
                          <span className="text-slate-400 text-[10px]">
                            {new Date(c.claimedAt).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Rewards list */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-xs font-bold text-white block">
                    รางวัลทั้งหมดในห้องเรียน:
                  </span>
                  <div className="space-y-2">
                    {rewards.map((r) => {
                      const canClaim = currentStudent.stars >= r.requiredStars;
                      return (
                        <div
                          key={r.id}
                          className={`p-3 rounded-2xl border transition-all ${
                            canClaim
                              ? 'bg-amber-400/10 border-amber-400/30'
                              : 'bg-white/5 border-white/5 opacity-75'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {canClaim ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                              )}
                              <span className="font-bold text-xs text-white">{r.name}</span>
                            </div>
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 ${
                                canClaim
                                  ? 'bg-amber-400 text-slate-950 font-bold'
                                  : 'bg-white/10 text-slate-300'
                              }`}
                            >
                              <Star className="w-3 h-3 fill-current" />
                              <span>{r.requiredStars} ดาว</span>
                            </span>
                          </div>
                          {r.description && (
                            <p className="text-[11px] text-slate-400 mt-1 pl-6">
                              {r.description}
                            </p>
                          )}
                          <div className="mt-2 pl-6">
                            {canClaim ? (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                ✨ ดาวครบแล้ว แจ้งคุณครูเพื่อขอแลกได้เลย!
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                ขาดอีก {r.requiredStars - currentStudent.stars} ดาว
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* GRID OF STUDENTS TO PICK FROM */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              พบน้องนักเรียน <strong>{filteredStudents.length}</strong> คน (กดเพื่อดูคะแนนหรือคัดลอกลิงก์ส่วนบุคคล)
            </span>
            <span>เรียงตามคะแนนดาวสะสม</span>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="bg-[#150a24]/90 border border-white/10 rounded-3xl p-12 text-center text-slate-400 space-y-3">
              <Search className="w-10 h-10 mx-auto text-slate-500" />
              <p className="text-base font-bold text-white">ไม่พบรายชื่อนักเรียนที่ค้นหา</p>
              <p className="text-xs text-slate-400">
                ลองตรวจสอบตัวสะกด หรือเลือกดูห้องเรียนอื่นด้านบนดูนะ
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredStudents.map((st) => (
                <div
                  key={st.id}
                  className="group relative bg-gradient-to-b from-white/10 to-white/5 hover:from-purple-900/40 hover:to-indigo-950/60 border border-white/10 hover:border-amber-400/40 rounded-3xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-950/50 flex flex-col justify-between"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectStudent(st.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-3">
                      {/* Student Avatar */}
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shrink-0 shadow-md">
                        <div className="w-full h-full rounded-[14px] bg-[#120626] overflow-hidden flex items-center justify-center">
                          {st.avatarUrl ? (
                            <img
                              src={st.avatarUrl}
                              alt={st.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-base font-bold text-amber-300 font-heading">
                              {st.nickname ? st.nickname.slice(0, 2) : st.name.slice(0, 2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {st.classroom}
                          </span>
                          {st.studentCode && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{st.studentCode}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate mt-1">
                          {st.name}
                        </h3>
                        {st.nickname && (
                          <p className="text-xs text-amber-400/90 font-medium">น้อง{st.nickname}</p>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Footer with Star Score and Direct Link Copy Button */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const directUrl = getDirectShareLink(st.id);
                        if (navigator.clipboard) navigator.clipboard.writeText(directUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="text-slate-400 hover:text-amber-300 text-[11px] flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer"
                      title="คัดลอกลิงก์เฉพาะของนักเรียนคนนี้"
                    >
                      <Copy className="w-3 h-3" />
                      <span>แชร์ลิงก์</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectStudent(st.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold hover:bg-amber-400/25 transition-colors cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{st.stars}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QR CODE MODAL FOR STUDENTS / PARENTS */}
      {showQrModal && currentStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#180b2d] border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 mx-auto flex items-center justify-center mb-3 border border-amber-400/30">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="font-heading font-bold text-white text-lg">
              QR Code สมุดดาวของน้อง{currentStudent.nickname || currentStudent.name}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              ผู้ปกครองหรือนักเรียนสามารถใช้กล้องมือถือสแกนเพื่อเปิดดูคะแนนดาวได้ทันที
            </p>

            {/* Generated QR Code Image (via standard Google Chart API) */}
            <div className="my-5 p-4 bg-white rounded-2xl inline-block shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  currentShareLink
                )}`}
                alt="QR Code"
                className="w-44 h-44 mx-auto"
              />
            </div>

            <div className="text-[11px] text-purple-300 font-mono break-all bg-white/5 p-2.5 rounded-xl border border-white/10 mb-4">
              {currentShareLink}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold transition-all"
              >
                {copiedLink ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

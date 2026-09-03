import React, { useState, useMemo } from 'react';
import { useStudents } from '../context/StudentContext';
import { Student } from '../types';
import { StudentAvatar } from '../components/StudentAvatar';
import { StudentProfileModal } from '../components/StudentProfileModal';
import {
  Trophy,
  Medal,
  Search,
  Filter,
  Star,
  Sparkles,
  School,
  Award,
} from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const { students, selectedClassroom, setSelectedClassroom, classrooms, rewards } = useStudents();
  const [searchQuery, setSearchQuery] = useState('');
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);

  // Target reward reference
  const topReward = rewards[rewards.length - 1] || { requiredStars: 30, name: 'ของรางวัลใหญ่' };

  // Filter & Sort
  const sortedStudents = useMemo(() => {
    let list = [...students];
    if (selectedClassroom !== 'all') {
      list = list.filter((s) => s.classroom === selectedClassroom);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.nickname && s.nickname.toLowerCase().includes(q)) ||
          s.classroom.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.stars - a.stars);
  }, [students, selectedClassroom, searchQuery]);

  const top1 = sortedStudents[0];
  const top2 = sortedStudents[1];
  const top3 = sortedStudents[2];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#150a24] p-5 rounded-3xl border border-white/10 shadow-lg shadow-purple-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs tracking-wide">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>ทำเนียบเกียรติยศนักเรียนคนเก่ง</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-heading mt-0.5">
            Leaderboard อันดับดาวความดี 🏆
          </h1>
          <p className="text-xs text-slate-400">
            แสดงการจัดอันดับนักเรียนตามจำนวนดาวสะสม (คลิกที่นักเรียนเพื่อดูโปรไฟล์)
          </p>
        </div>

        {/* Classroom filter pill dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs text-slate-200">
            <School className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="bg-transparent border-0 font-medium focus:ring-0 focus:outline-none cursor-pointer text-xs [&>option]:bg-[#150a24]"
            >
              <option value="all">ทุกชั้นเรียน</option>
              {classrooms.map((cls) => (
                <option key={cls} value={cls}>
                  ห้อง {cls}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Visual Presentation */}
      {sortedStudents.length > 0 && (
        <div className="bg-gradient-to-b from-[#1a0b2e] via-[#150a24] to-[#0f071a] border border-white/10 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/30 text-amber-300 text-xs font-semibold backdrop-blur-xs shadow-[0_0_12px_rgba(147,51,234,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              สุดยอดดาวเด่นประจำห้องเรียน
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-2xl mx-auto pt-2">
            {/* Rank 2 (Silver) */}
            <div className="flex flex-col items-center">
              {top2 ? (
                <div
                  className="cursor-pointer group flex flex-col items-center w-full"
                  onClick={() => setProfileStudent(top2)}
                  title="คลิกเพื่อดูโปรไฟล์"
                >
                  <div className="text-3xl sm:text-4xl mb-1">🥈</div>
                  <StudentAvatar
                    name={top2.name}
                    avatarUrl={top2.avatarUrl}
                    size="lg"
                    className="border-4 border-slate-300 shadow-md mb-2 group-hover:scale-110 transition-transform"
                  />
                  <h4 className="font-heading font-bold text-xs sm:text-sm text-center truncate w-full px-1 text-slate-100 group-hover:text-amber-300">
                    {top2.nickname || top2.name}
                  </h4>
                  <span className="text-[10px] sm:text-xs text-purple-300">{top2.classroom}</span>
                  <div className="mt-3 w-full bg-white/5 border border-white/10 backdrop-blur-xs border-t-2 border-t-slate-400 rounded-t-2xl pt-4 pb-3 text-center h-28 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-300">อันดับ 2</span>
                    <span className="text-xs sm:text-sm font-extrabold text-amber-300">
                      {top2.stars} ⭐
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-28" />
              )}
            </div>

            {/* Rank 1 (Gold) */}
            <div className="flex flex-col items-center">
              {top1 ? (
                <div
                  className="cursor-pointer group flex flex-col items-center w-full"
                  onClick={() => setProfileStudent(top1)}
                  title="คลิกเพื่อดูโปรไฟล์"
                >
                  <div className="text-4xl sm:text-5xl mb-1 animate-bounce">🥇</div>
                  <StudentAvatar
                    name={top1.name}
                    avatarUrl={top1.avatarUrl}
                    size="xl"
                    className="border-4 border-amber-400 shadow-[0_0_20px_#fbbf24] mb-2 group-hover:scale-110 transition-transform"
                  />
                  <h4 className="font-heading font-extrabold text-sm sm:text-base text-center truncate w-full px-1 text-amber-300 group-hover:underline">
                    {top1.nickname || top1.name}
                  </h4>
                  <span className="text-[10px] sm:text-xs text-purple-300">{top1.classroom}</span>
                  <div className="mt-3 w-full bg-white/10 border border-white/10 backdrop-blur-xs border-t-4 border-t-amber-400 ring-2 ring-amber-400/20 rounded-t-2xl pt-4 pb-3 text-center h-36 flex flex-col justify-between shadow-[0_0_25px_rgba(251,191,36,0.15)]">
                    <span className="text-xs sm:text-sm font-bold text-amber-200">
                      อันดับ 1 ชนะเลิศ
                    </span>
                    <span className="text-sm sm:text-base font-black text-amber-400 drop-shadow-md">
                      {top1.stars} ⭐
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-36" />
              )}
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="flex flex-col items-center">
              {top3 ? (
                <div
                  className="cursor-pointer group flex flex-col items-center w-full"
                  onClick={() => setProfileStudent(top3)}
                  title="คลิกเพื่อดูโปรไฟล์"
                >
                  <div className="text-3xl sm:text-4xl mb-1">🥉</div>
                  <StudentAvatar
                    name={top3.name}
                    avatarUrl={top3.avatarUrl}
                    size="lg"
                    className="border-4 border-orange-500 shadow-md mb-2 group-hover:scale-110 transition-transform"
                  />
                  <h4 className="font-heading font-bold text-xs sm:text-sm text-center truncate w-full px-1 text-slate-100 group-hover:text-amber-300">
                    {top3.nickname || top3.name}
                  </h4>
                  <span className="text-[10px] sm:text-xs text-purple-300">{top3.classroom}</span>
                  <div className="mt-3 w-full bg-white/5 border border-white/10 backdrop-blur-xs border-t-2 border-t-orange-600/80 rounded-t-2xl pt-4 pb-3 text-center h-24 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-orange-300">อันดับ 3</span>
                    <span className="text-xs sm:text-sm font-extrabold text-amber-300">
                      {top3.stars} ⭐
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-24" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search & Full Ranking Table */}
      <div className="bg-[#150a24] rounded-3xl p-5 border border-white/10 shadow-lg shadow-purple-950/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white font-heading">
              รายชื่ออันดับทั้งหมด ({sortedStudents.length} คน)
            </h2>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อหรือห้องเรียน..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        {sortedStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</div>
        ) : (
          <div className="space-y-2.5">
            {sortedStudents.map((student, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;
              const progressPct = Math.min(
                100,
                Math.round((student.stars / topReward.requiredStars) * 100)
              );

              return (
                <div
                  key={student.id}
                  onClick={() => setProfileStudent(student)}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group ${
                    rank === 1
                      ? 'bg-amber-400/10 border-amber-400/30 ring-1 ring-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                      : rank === 2
                      ? 'bg-white/5 border-slate-400/30'
                      : rank === 3
                      ? 'bg-white/5 border-orange-600/30'
                      : 'bg-white/5 border-white/5 hover:border-purple-500/30 hover:bg-white/10'
                  }`}
                >
                  {/* Left: Rank & Avatar & Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-heading font-extrabold text-xs shrink-0">
                      {rank === 1 ? (
                        <span className="text-lg">🥇</span>
                      ) : rank === 2 ? (
                        <span className="text-lg">🥈</span>
                      ) : rank === 3 ? (
                        <span className="text-lg">🥉</span>
                      ) : (
                        <span className="text-slate-400">#{rank}</span>
                      )}
                    </div>

                    <StudentAvatar
                      name={student.name}
                      avatarUrl={student.avatarUrl}
                      size="md"
                      className="border border-white/20 group-hover:scale-105 transition-transform shrink-0"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                          {student.name}
                        </span>
                        {student.nickname && (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                            {student.nickname}
                          </span>
                        )}
                        {isTop3 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            เก่งมาก ⭐
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-xs">
                        ห้อง {student.classroom} • บันทึกแล้ว {student.starHistory.length} ครั้ง • คลิกดูโปรไฟล์
                      </span>
                    </div>
                  </div>

                  {/* Right: Progress bar & Star total */}
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="w-32 sm:w-40 hidden sm:block">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>สู่เป้าหมาย</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-amber-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 font-bold text-sm font-heading shadow-[0_0_8px_rgba(251,191,36,0.15)]">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{student.stars} ดวง</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Student Profile Modal */}
      <StudentProfileModal
        student={profileStudent}
        isOpen={!!profileStudent}
        onClose={() => setProfileStudent(null)}
      />
    </div>
  );
};

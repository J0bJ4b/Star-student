import React, { useState } from 'react';
import { Link } from 'wouter';
import { useStudents } from '../context/StudentContext';
import { Student } from '../types';
import { StudentAvatar } from '../components/StudentAvatar';
import { StudentProfileModal } from '../components/StudentProfileModal';
import {
  Sparkles,
  Users,
  Trophy,
  Gift,
  Award,
  Star,
  TrendingUp,
  ArrowRight,
  Clock,
  ChevronRight,
  Cloud,
  FileSpreadsheet,
} from 'lucide-react';
import { BackupModal } from '../components/BackupModal';
import {
  exportToDesignatedSheet,
  getDesignatedSheetConfig,
  DesignatedSheetConfig,
} from '../services/googleSheetsService';
import { ExternalLink, Check, RefreshCw } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { students, history, rewards, selectedClassroom, isCloudSynced } = useStudents();
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetSyncFeedback, setSheetSyncFeedback] = useState<{
    success: boolean;
    message: string;
    url?: string;
  } | null>(null);

  // Load sheet config
  const [sheetConfig, setSheetConfig] = useState<DesignatedSheetConfig>(getDesignatedSheetConfig);

  const handleSyncToSheets = async () => {
    setIsSyncingSheets(true);
    setSheetSyncFeedback(null);
    try {
      const res = await exportToDesignatedSheet(students, history, rewards);
      const updatedConfig = getDesignatedSheetConfig();
      setSheetConfig(updatedConfig);
      setSheetSyncFeedback({
        success: true,
        message: `ซิงก์สำเร็จ! อัปเดตข้อมูลนักเรียน ${res.updatedStudentsCount} คน และประวัติ ${res.updatedHistoryCount} รายการ`,
        url: res.spreadsheetUrl,
      });
    } catch (err: any) {
      setSheetSyncFeedback({
        success: false,
        message: err.message || 'ไม่สามารถซิงก์ Google Sheets ได้',
      });
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const filteredStudents =
    selectedClassroom === 'all'
      ? students
      : students.filter((s) => s.classroom === selectedClassroom);

  // Statistics
  const totalStudents = filteredStudents.length;
  const totalStars = filteredStudents.reduce((acc, s) => acc + s.stars, 0);
  const maxStars = filteredStudents.length > 0 ? Math.max(...filteredStudents.map((s) => s.stars)) : 0;
  const avgStars = totalStudents > 0 ? (totalStars / totalStudents).toFixed(1) : '0';

  // Top 3 Leaderboard
  const sortedStudents = [...filteredStudents].sort((a, b) => b.stars - a.stars);
  const top3 = sortedStudents.slice(0, 3);

  // Recent History
  const recentHistory = history
    .filter((h) => (selectedClassroom === 'all' ? true : h.classroom === selectedClassroom))
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner with cosmic gradient and glow */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a0b2e] via-[#150a24] to-[#0f071a] border border-white/10 text-white p-6 sm:p-8 shadow-2xl shadow-purple-950/40">
        {/* Decorative background stars */}
        <div className="absolute -top-6 -right-6 text-white/5 select-none pointer-events-none text-9xl font-bold">
          ⭐
        </div>
        <div className="absolute bottom-2 right-24 text-white/5 select-none pointer-events-none text-6xl">
          ✨
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/30 backdrop-blur-xs text-xs font-semibold tracking-wide text-purple-300 mb-3 shadow-[0_0_12px_rgba(147,51,234,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Teacher Dashboard • Star Academy
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-heading text-white">
            สมุดสะสมดาวความดี ✨
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            {selectedClassroom === 'all'
              ? 'บันทึกความดี มอบดาว ชื่นชมความตั้งใจ ดูโปรไฟล์นักเรียน และแลกของรางวัล'
              : `ห้องเรียน ${selectedClassroom} • บันทึกคะแนนความดีและติดตามความก้าวหน้าของนักเรียน`}
          </p>

          {/* Quick Action Buttons inside Hero */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:gap-3">
            <Link
              href="/add-star"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-sm shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-white fill-white" />
              <span>เพิ่มดาวให้นักเรียน</span>
            </Link>
            <Link
              href="/students"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-2xl font-medium text-sm backdrop-blur-xs border border-white/10 transition-all hover:scale-105"
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span>จัดการและดูโปรไฟล์</span>
            </Link>
            <Link
              href="/portal"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 rounded-2xl font-bold text-sm backdrop-blur-xs border border-amber-400/30 transition-all hover:scale-105 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>หน้านักเรียนดูคะแนน</span>
            </Link>
            <Link
              href="/rewards"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 rounded-2xl font-medium text-sm backdrop-blur-xs border border-purple-500/30 transition-all hover:scale-105"
            >
              <Gift className="w-4 h-4 text-amber-400" />
              <span>ดูรางวัล ({rewards.length})</span>
            </Link>
            <button
              type="button"
              id="sync-to-sheets-button"
              onClick={handleSyncToSheets}
              disabled={isSyncingSheets}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-2xl font-bold text-sm backdrop-blur-xs border border-emerald-400/30 transition-all hover:scale-105 shadow-[0_4px_16px_rgba(16,185,129,0.3)] cursor-pointer"
              title="ส่งออกและซิงก์ข้อมูลนักเรียนและประวัติไปยัง Google Sheet ที่กำหนด"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheets ? 'กำลังซิงก์ Sheets...' : 'Sync to Sheets'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBackupOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-medium text-sm backdrop-blur-xs border border-white/10 transition-all hover:scale-105"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>จัดการฐานข้อมูล & ชีต</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync to Sheets Notification Banner */}
      {sheetSyncFeedback && (
        <div
          className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm animate-fade-in ${
            sheetSyncFeedback.success
              ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-200 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2.5 font-medium">
            {sheetSyncFeedback.success ? (
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <RefreshCw className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{sheetSyncFeedback.message}</span>
          </div>

          {sheetSyncFeedback.url && (
            <a
              href={sheetSyncFeedback.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors self-start sm:self-center shadow-md shadow-emerald-950/40"
            >
              <span>เปิดดูสเปรดชีต</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Quick Google Sheets Designated Status Bar */}
      <div className="bg-[#150a24]/90 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Google Sheet ปลายทาง:</span>
              <span className="text-emerald-400 font-medium truncate max-w-xs">
                {sheetConfig.spreadsheetTitle || (sheetConfig.spreadsheetId ? `ID: ${sheetConfig.spreadsheetId.substring(0, 15)}...` : 'ระบบสร้างให้อัตโนมัติ')}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              ซิงก์ล่าสุด:{' '}
              {sheetConfig.lastSyncedAt
                ? new Date(sheetConfig.lastSyncedAt).toLocaleString('th-TH')
                : 'ยังไม่มีการซิงก์ในรอบนี้'}{' '}
              • ข้อมูล: นักเรียน {students.length} คน, ประวัติ {history.length} รายการ
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sheetConfig.spreadsheetUrl && (
            <a
              href={sheetConfig.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium border border-white/10 flex items-center gap-1 transition-colors"
            >
              <span>เปิดไฟล์</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <Link
            href="/settings"
            className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-xl text-xs font-medium border border-purple-500/30 transition-colors"
          >
            ตั้งค่า Sheet ปลายทาง
          </Link>
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-[#150a24] p-5 rounded-2xl border border-white/10 shadow-lg shadow-purple-950/20 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">จำนวนนักเรียน</span>
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-white">
              {totalStudents}
            </span>
            <span className="text-xs text-slate-400 font-medium">คน</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            {selectedClassroom === 'all' ? 'ทุกชั้นเรียนรวมกัน' : `เฉพาะห้อง ${selectedClassroom}`}
          </div>
        </div>

        <div className="bg-[#150a24] p-5 rounded-2xl border border-white/10 shadow-lg shadow-purple-950/20 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">ดาวสะสมทั้งหมด</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-amber-400">
              {totalStars}
            </span>
            <span className="text-xs text-slate-400 font-medium">ดวง ⭐</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            คะแนนความดีที่มอบแล้ว
          </div>
        </div>

        <div className="bg-[#150a24] p-5 rounded-2xl border border-white/10 shadow-lg shadow-purple-950/20 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">ดาวสูงสุดเดี่ยว</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-indigo-300">
              {maxStars}
            </span>
            <span className="text-xs text-slate-400 font-medium">ดวง ⭐</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium truncate">
            {top3[0]?.name ? `${top3[0].nickname || top3[0].name.split(' ')[0]}` : 'ยังไม่มีข้อมูล'}
          </div>
        </div>

        <div className="bg-[#150a24] p-5 rounded-2xl border border-white/10 shadow-lg shadow-purple-950/20 hover:border-pink-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">ดาวเฉลี่ยต่อคน</span>
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-300 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-pink-300">
              {avgStars}
            </span>
            <span className="text-xs text-slate-400 font-medium">ดวง/คน</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            เป้าหมาย {rewards[0]?.requiredStars || 10} ดาวแลกรางวัล
          </div>
        </div>
      </div>

      {/* Middle section: Top 3 Podium & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 3 Podium Card (7 cols) */}
        <div className="lg:col-span-7 bg-[#150a24] rounded-3xl p-6 border border-white/10 shadow-lg shadow-purple-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-heading flex items-center gap-1.5">
                  <span>👑</span> 3 อันดับสูงสุด (Top 3)
                </h2>
                <p className="text-xs text-slate-400">คลิกที่นักเรียนเพื่อดูโปรไฟล์และประวัติ</p>
              </div>
            </div>
            <Link
              href="/leaderboard"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 group"
            >
              <span>ดูอันดับทั้งหมด</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Top 3 Podium Visual */}
          {top3.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              ยังไม่มีข้อมูลนักเรียนในห้องเรียนนี้
            </div>
          ) : (
            <div className="py-8 grid grid-cols-3 gap-3 sm:gap-4 items-end">
              {/* 2nd Place */}
              {top3[1] ? (
                <div
                  onClick={() => setProfileStudent(top3[1])}
                  className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-3xl text-center relative pt-8 flex flex-col items-center cursor-pointer group hover:bg-white/10 transition-all"
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-11 h-11 sm:w-12 sm:h-12 bg-slate-300 rounded-full border-4 border-[#120524] flex items-center justify-center font-bold text-[#120524] text-sm shadow-md">
                    2
                  </div>
                  <StudentAvatar
                    name={top3[1].name}
                    avatarUrl={top3[1].avatarUrl}
                    size="md"
                    className="border-2 border-slate-300 shadow-md mb-1.5 group-hover:scale-105 transition-transform"
                  />
                  <p className="font-bold text-slate-200 text-xs sm:text-sm truncate w-full px-1 group-hover:text-amber-300">
                    {top3[1].nickname || top3[1].name}
                  </p>
                  <p className="text-[10px] text-slate-400">{top3[1].classroom}</p>
                  <p className="text-xl sm:text-2xl font-black text-amber-400 drop-shadow-md mt-1">
                    {top3[1].stars} <span className="text-xs font-normal text-amber-300">⭐</span>
                  </p>
                  <div className="mt-2 h-1 w-12 bg-slate-300/50 mx-auto rounded-full" />
                </div>
              ) : (
                <div />
              )}

              {/* 1st Place */}
              {top3[0] ? (
                <div
                  onClick={() => setProfileStudent(top3[0])}
                  className="bg-white/10 border border-amber-400/30 p-5 sm:p-6 rounded-3xl text-center relative pt-10 ring-4 ring-amber-400/20 scale-105 flex flex-col items-center shadow-[0_0_30px_rgba(251,191,36,0.15)] cursor-pointer group hover:border-amber-400 transition-all"
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 sm:w-16 sm:h-16 bg-amber-400 rounded-full border-4 border-[#120524] flex items-center justify-center font-bold text-[#120524] text-lg sm:text-xl shadow-[0_0_20px_#fbbf24]">
                    1
                  </div>
                  <StudentAvatar
                    name={top3[0].name}
                    avatarUrl={top3[0].avatarUrl}
                    size="lg"
                    className="border-2 border-amber-400 shadow-[0_0_12px_#fbbf24] mb-1.5 group-hover:scale-105 transition-transform"
                  />
                  <p className="font-bold text-white text-xs sm:text-base truncate w-full px-1 group-hover:underline">
                    {top3[0].nickname || top3[0].name}
                  </p>
                  <p className="text-[10px] text-amber-300/80">{top3[0].classroom}</p>
                  <p className="text-2xl sm:text-3xl font-black text-amber-400 drop-shadow-md mt-1">
                    {top3[0].stars} <span className="text-xs font-normal text-amber-300">⭐</span>
                  </p>
                  <div className="mt-2 h-1.5 w-16 bg-amber-400 mx-auto rounded-full shadow-[0_0_8px_#fbbf24]" />
                </div>
              ) : (
                <div />
              )}

              {/* 3rd Place */}
              {top3[2] ? (
                <div
                  onClick={() => setProfileStudent(top3[2])}
                  className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-3xl text-center relative pt-8 flex flex-col items-center cursor-pointer group hover:bg-white/10 transition-all"
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-11 h-11 sm:w-12 sm:h-12 bg-orange-700 rounded-full border-4 border-[#120524] flex items-center justify-center font-bold text-white text-sm shadow-md">
                    3
                  </div>
                  <StudentAvatar
                    name={top3[2].name}
                    avatarUrl={top3[2].avatarUrl}
                    size="md"
                    className="border-2 border-orange-500 shadow-md mb-1.5 group-hover:scale-105 transition-transform"
                  />
                  <p className="font-bold text-slate-200 text-xs sm:text-sm truncate w-full px-1 group-hover:text-amber-300">
                    {top3[2].nickname || top3[2].name}
                  </p>
                  <p className="text-[10px] text-slate-400">{top3[2].classroom}</p>
                  <p className="text-xl sm:text-2xl font-black text-amber-400 drop-shadow-md mt-1">
                    {top3[2].stars} <span className="text-xs font-normal text-amber-300">⭐</span>
                  </p>
                  <div className="mt-2 h-1 w-12 bg-orange-700/50 mx-auto rounded-full" />
                </div>
              ) : (
                <div />
              )}
            </div>
          )}

          <div className="mt-2 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>อัปเดตแบบเรียลไทม์ตามจำนวนดาว</span>
            <Link href="/add-star" className="text-purple-400 font-semibold hover:text-purple-300 hover:underline">
              + ให้ดาวเพิ่ม
            </Link>
          </div>
        </div>

        {/* Recent Activity Log (5 cols) */}
        <div className="lg:col-span-5 bg-[#150a24] rounded-3xl p-6 border border-white/10 shadow-lg shadow-purple-950/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-heading">
                    ประวัติกิจกรรมล่าสุด
                  </h2>
                  <p className="text-xs text-slate-400">ประวัติการบันทึกดาว</p>
                </div>
              </div>
              <Link
                href="/history"
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {recentHistory.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  ยังไม่มีประวัติการให้ดาวในห้องนี้
                </div>
              ) : (
                recentHistory.map((item, idx) => {
                  const isPositive = item.amount > 0;
                  const matchingStudent = students.find((s) => s.id === item.studentId);

                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 relative cursor-pointer group"
                      onClick={() => matchingStudent && setProfileStudent(matchingStudent)}
                      title="คลิกเพื่อดูโปรไฟล์นักเรียน"
                    >
                      <div
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 z-10 ${
                          isPositive ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'
                        }`}
                      />
                      {idx !== recentHistory.length - 1 && (
                        <div className="absolute left-[4px] top-3.5 w-0.5 h-full bg-white/10" />
                      )}
                      <div className="flex-1 pb-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                            {item.studentName}{' '}
                            <span
                              className={isPositive ? 'text-emerald-400' : 'text-rose-400'}
                            >
                              {isPositive ? `+${item.amount}` : item.amount} ⭐
                            </span>
                          </p>
                          <span className="text-[10px] text-slate-500">
                            {new Date(item.timestamp).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.category}{' '}
                          <span className="text-purple-400">({item.classroom})</span>
                          {item.note && <span className="text-slate-500"> • {item.note}</span>}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10">
            <Link
              href="/add-star"
              className="w-full py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              บันทึกคะแนนความดีด่วน
            </Link>
          </div>
        </div>
      </div>

      {/* Student Profile Modal */}
      <StudentProfileModal
        student={profileStudent}
        isOpen={!!profileStudent}
        onClose={() => setProfileStudent(null)}
      />

      {/* Database & Google Sheets Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />
    </div>
  );
};

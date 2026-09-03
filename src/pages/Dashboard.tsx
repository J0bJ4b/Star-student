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
  MessageSquare,
  Tag,
  Calendar,
  ExternalLink,
  Check,
  RefreshCw,
  PlusCircle,
  CheckSquare,
  Quote,
} from 'lucide-react';
import { BackupModal } from '../components/BackupModal';
import { QuickAddModal } from '../components/QuickAddModal';
import {
  exportToDesignatedSheet,
  getDesignatedSheetConfig,
  DesignatedSheetConfig,
} from '../services/googleSheetsService';

export const Dashboard: React.FC = () => {
  const { students, history, rewards, selectedClassroom, isCloudSynced } = useStudents();
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
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

  // Last 10 Recent Transactions Activity Log
  const recentHistory = history
    .filter((h) => (selectedClassroom === 'all' ? true : h.classroom === selectedClassroom))
    .slice(0, 10);

  // Helper for formatting activity log timestamps
  const formatActivityTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    let relative = '';
    if (diffSec < 45) {
      relative = 'เมื่อสักครู่';
    } else if (diffSec < 3600) {
      relative = `${Math.floor(diffSec / 60)} นาทีที่แล้ว`;
    } else if (diffSec < 86400 && date.getDate() === now.getDate()) {
      relative = `${Math.floor(diffSec / 3600)} ชม. ที่แล้ว`;
    } else if (diffSec < 86400 * 2) {
      relative = 'เมื่อวานนี้';
    } else {
      relative = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    }

    const timeStr = date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const fullDateStr = date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    });

    return { relative, timeStr, fullDateStr };
  };

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
            <button
              type="button"
              id="hero-quick-add-button"
              onClick={() => setIsQuickAddOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-purple-600 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-white rounded-2xl font-extrabold text-sm shadow-[0_4px_20px_rgba(245,158,11,0.35)] transition-all hover:scale-105 active:scale-95 cursor-pointer border border-amber-300/30 ring-2 ring-purple-500/30"
            >
              <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200 animate-pulse" />
              <span>Quick Add (ให้ดาวหลายคน)</span>
            </button>
            <Link
              href="/add-star"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-sm shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-white fill-white" />
              <span>เพิ่มดาวทีละคน</span>
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

      {/* Middle section: Top 3 Podium & Detailed Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 3 Podium Card (5 cols on large screens) */}
        <div className="lg:col-span-5 bg-[#150a24] rounded-3xl p-6 border border-white/10 shadow-lg shadow-purple-950/20 flex flex-col justify-between">
          <div>
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
                <span>ดูอันดับ</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Top 3 Podium Visual */}
            {top3.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                ยังไม่มีข้อมูลนักเรียนในห้องเรียนนี้
              </div>
            ) : (
              <div className="py-8 grid grid-cols-3 gap-2 sm:gap-3 items-end">
                {/* 2nd Place */}
                {top3[1] ? (
                  <div
                    onClick={() => setProfileStudent(top3[1])}
                    className="bg-white/5 border border-white/10 p-3 sm:p-4 rounded-3xl text-center relative pt-7 flex flex-col items-center cursor-pointer group hover:bg-white/10 transition-all"
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-slate-300 rounded-full border-4 border-[#120524] flex items-center justify-center font-bold text-[#120524] text-xs sm:text-sm shadow-md">
                      2
                    </div>
                    <StudentAvatar
                      name={top3[1].name}
                      avatarUrl={top3[1].avatarUrl}
                      size="md"
                      className="border-2 border-slate-300 shadow-md mb-1.5 group-hover:scale-105 transition-transform"
                    />
                    <p className="font-bold text-slate-200 text-xs truncate w-full px-1 group-hover:text-amber-300">
                      {top3[1].nickname || top3[1].name}
                    </p>
                    <p className="text-[10px] text-slate-400">{top3[1].classroom}</p>
                    <p className="text-lg sm:text-xl font-black text-amber-400 drop-shadow-md mt-1">
                      {top3[1].stars} <span className="text-xs font-normal text-amber-300">⭐</span>
                    </p>
                    <div className="mt-2 h-1 w-10 bg-slate-300/50 mx-auto rounded-full" />
                  </div>
                ) : (
                  <div />
                )}

                {/* 1st Place */}
                {top3[0] ? (
                  <div
                    onClick={() => setProfileStudent(top3[0])}
                    className="bg-white/10 border border-amber-400/30 p-4 sm:p-5 rounded-3xl text-center relative pt-9 ring-4 ring-amber-400/20 scale-105 flex flex-col items-center shadow-[0_0_30px_rgba(251,191,36,0.15)] cursor-pointer group hover:border-amber-400 transition-all"
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-amber-400 rounded-full border-4 border-[#120524] flex items-center justify-center font-bold text-[#120524] text-base sm:text-lg shadow-[0_0_20px_#fbbf24]">
                      1
                    </div>
                    <StudentAvatar
                      name={top3[0].name}
                      avatarUrl={top3[0].avatarUrl}
                      size="lg"
                      className="border-2 border-amber-400 shadow-[0_0_12px_#fbbf24] mb-1.5 group-hover:scale-105 transition-transform"
                    />
                    <p className="font-bold text-white text-xs sm:text-sm truncate w-full px-1 group-hover:underline">
                      {top3[0].nickname || top3[0].name}
                    </p>
                    <p className="text-[10px] text-amber-300/80">{top3[0].classroom}</p>
                    <p className="text-xl sm:text-2xl font-black text-amber-400 drop-shadow-md mt-1">
                      {top3[0].stars} <span className="text-xs font-normal text-amber-300">⭐</span>
                    </p>
                    <div className="mt-2 h-1.5 w-14 bg-amber-400 mx-auto rounded-full shadow-[0_0_8px_#fbbf24]" />
                  </div>
                ) : (
                  <div />
                )}

                {/* 3rd Place */}
                {top3[2] ? (
                  <div
                    onClick={() => setProfileStudent(top3[2])}
                    className="bg-white/5 border border-white/10 p-3 sm:p-4 rounded-3xl text-center relative pt-7 flex flex-col items-center cursor-pointer group hover:bg-white/10 transition-all"
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-orange-700 rounded-full border-4 border-[#120524] flex items-center justify-center font-bold text-white text-xs sm:text-sm shadow-md">
                      3
                    </div>
                    <StudentAvatar
                      name={top3[2].name}
                      avatarUrl={top3[2].avatarUrl}
                      size="md"
                      className="border-2 border-orange-500 shadow-md mb-1.5 group-hover:scale-105 transition-transform"
                    />
                    <p className="font-bold text-slate-200 text-xs truncate w-full px-1 group-hover:text-amber-300">
                      {top3[2].nickname || top3[2].name}
                    </p>
                    <p className="text-[10px] text-slate-400">{top3[2].classroom}</p>
                    <p className="text-lg sm:text-xl font-black text-amber-400 drop-shadow-md mt-1">
                      {top3[2].stars} <span className="text-xs font-normal text-amber-300">⭐</span>
                    </p>
                    <div className="mt-2 h-1 w-10 bg-orange-700/50 mx-auto rounded-full" />
                  </div>
                ) : (
                  <div />
                )}
              </div>
            )}
          </div>

          <div className="mt-2 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>อัปเดตแบบเรียลไทม์</span>
            <Link href="/add-star" className="text-purple-400 font-semibold hover:text-purple-300 hover:underline">
              + ให้ดาวเพิ่ม
            </Link>
          </div>
        </div>

        {/* Detailed Activity Log (7 cols on large screens - Last 10 Transactions) */}
        <div className="lg:col-span-7 bg-[#150a24] rounded-3xl p-6 border border-white/10 shadow-lg shadow-purple-950/20 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shadow-sm">
                  <Clock className="w-4 h-4 text-purple-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white font-heading">
                      บันทึกกิจกรรมล่าสุด (Activity Log)
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      10 รายการล่าสุด
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    ประวัติการมอบดาว พร้อมหมายเหตุครูผู้สอนและเวลาบันทึก
                  </p>
                </div>
              </div>

              <Link
                href="/history"
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 group py-1 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* List of 10 Activity Items */}
            <div className="mt-4 space-y-3 max-h-[480px] overflow-y-auto pr-1.5 custom-scrollbar">
              {recentHistory.length === 0 ? (
                <div className="py-14 text-center text-slate-500 text-xs bg-black/20 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-2">
                  <Clock className="w-8 h-8 text-slate-600" />
                  <p>ยังไม่มีประวัติการให้ดาวในห้องนี้</p>
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(true)}
                    className="mt-1 px-3 py-1.5 bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 rounded-xl text-xs font-semibold transition-colors"
                  >
                    + เริ่มมอบดาวคนแรก
                  </button>
                </div>
              ) : (
                recentHistory.map((item, idx) => {
                  const isPositive = item.amount > 0;
                  const matchingStudent = students.find((s) => s.id === item.studentId);
                  const timeInfo = formatActivityTimestamp(item.timestamp);

                  return (
                    <div
                      key={item.id || `hist-${idx}`}
                      onClick={() => matchingStudent && setProfileStudent(matchingStudent)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 rounded-2xl p-3.5 transition-all duration-200 cursor-pointer group shadow-xs hover:shadow-md relative overflow-hidden"
                      title="คลิกเพื่อดูโปรไฟล์นักเรียน"
                    >
                      {/* Left color accent strip */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1 ${
                          isPositive ? 'bg-emerald-400' : 'bg-rose-500'
                        }`}
                      />

                      <div className="flex items-start justify-between gap-3 pl-1.5">
                        {/* Avatar & Student Name */}
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="shrink-0 mt-0.5">
                            <StudentAvatar
                              name={item.studentName}
                              avatarUrl={matchingStudent?.avatarUrl}
                              size="sm"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            {/* Student Name + Badges */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                                {item.studentName}
                              </span>
                              {matchingStudent?.nickname && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 font-medium shrink-0">
                                  ({matchingStudent.nickname})
                                </span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 text-slate-300 font-medium shrink-0">
                                ห้อง {item.classroom}
                              </span>
                            </div>

                            {/* Category & Date/Time Row */}
                            <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px] text-slate-400">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30 text-[10px]">
                                <Tag className="w-2.5 h-2.5 text-purple-400" />
                                {item.category}
                              </span>

                              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                <Calendar className="w-2.5 h-2.5 text-slate-500" />
                                {timeInfo.fullDateStr}
                              </span>

                              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                <Clock className="w-2.5 h-2.5 text-slate-500" />
                                {timeInfo.timeStr} น.
                              </span>

                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/40 text-slate-400 border border-white/5 font-mono">
                                {timeInfo.relative}
                              </span>
                            </div>

                            {/* Teacher's Note (Prominently Styled Box) */}
                            {item.note && item.note.trim() && (
                              <div className="mt-2 p-2.5 bg-[#0e0618]/90 border border-purple-500/25 rounded-xl text-xs text-slate-200 flex items-start gap-2 shadow-inner">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-[10px] text-purple-300 font-bold block uppercase tracking-wider mb-0.5">
                                    บันทึกของคุณครู (Teacher's Note):
                                  </span>
                                  <p className="text-slate-200 italic leading-relaxed text-xs break-words">
                                    "{item.note.trim()}"
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Stars Pill Badge */}
                        <div className="shrink-0 flex items-center">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm ${
                              isPositive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-950/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-rose-950/40'
                            }`}
                          >
                            <span>{isPositive ? `+${item.amount}` : item.amount}</span>
                            <span className="text-[11px]">⭐</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Activity Log Footer with Quick Add Button */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <span className="text-xs text-slate-400">
              รวมประวัติทั้งหมด{' '}
              <strong className="text-purple-300 font-bold">
                {history.filter((h) => selectedClassroom === 'all' || h.classroom === selectedClassroom).length}
              </strong>{' '}
              รายการ
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-gradient-to-r from-amber-500/20 via-purple-600/30 to-pink-600/20 hover:from-amber-500/30 hover:to-pink-600/30 text-amber-200 border border-amber-400/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Quick Add หลายคน</span>
              </button>
              <Link
                href="/add-star"
                className="flex-1 sm:flex-none px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors text-center"
              >
                <span>เพิ่มดาวทีละคน</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB): Quick Add Multi-Student Star Award */}
      <div className="fixed bottom-6 right-6 z-40 sm:bottom-8 sm:right-8">
        <button
          type="button"
          id="quick-add-fab-button"
          onClick={() => setIsQuickAddOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 sm:px-5 py-3.5 bg-gradient-to-r from-amber-500 via-purple-600 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-white rounded-full font-extrabold text-sm shadow-[0_8px_30px_rgba(147,51,234,0.5)] border border-amber-300/40 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-purple-900/30 backdrop-blur-sm"
          title="Quick Add: มอบดาวให้นักเรียนหลายคนพร้อมกันด้วย Checkbox"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-amber-200 fill-amber-200 animate-pulse group-hover:rotate-12 transition-transform" />
          </div>
          <span className="font-heading tracking-wide">Quick Add</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white font-medium backdrop-blur-xs">
            หลายคน
          </span>
        </button>
      </div>

      {/* Quick Add Stars Modal (Multiple Students Checkbox) */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />

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

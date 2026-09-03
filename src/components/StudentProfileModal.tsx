import React, { useState, useRef } from 'react';
import { Student, Reward } from '../types';
import { useStudents } from '../context/StudentContext';
import { StudentAvatar } from './StudentAvatar';
import { StudentQrModal } from './StudentQrModal';
import { compressImageFile } from '../utils/imageHelper';
import {
  X,
  Gift,
  Plus,
  Minus,
  Sparkles,
  Camera,
  Edit2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Share2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
} from 'lucide-react';

interface StudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEditStudent?: (student: Student) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  isOpen,
  onClose,
  onEditStudent,
}) => {
  const {
    students,
    rewards,
    addStars,
    deductStars,
    claimReward,
    updateStudentAvatar,
  } = useStudents();

  // Keep student data reactive in case stars or avatar change
  const currentStudent = students.find((s) => s.id === student?.id) || student;

  // Batch stars input state
  const [batchAmount, setBatchAmount] = useState<number>(5);
  const [batchReason, setBatchReason] = useState<string>('');
  const [isRedeemingOpen, setIsRedeemingOpen] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !currentStudent) return null;

  // Direct student link
  const directLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/portal/${currentStudent.id}`
      : `/portal/${currentStudent.id}`;

  const handleCopyDirectLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(directLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Display name formatting
  const nickname =
    currentStudent.nickname?.trim() ||
    currentStudent.name.replace(/^(ด\.ช\.|ด\.ญ\.|นาย|น\.ส\.|เด็กชาย|เด็กหญิง)\s*/, '').split(' ')[0] ||
    currentStudent.name;

  // Combine star history & claimed rewards into a single unified timeline
  type TimelineItem = {
    id: string;
    type: 'add' | 'deduct' | 'reward';
    title: string;
    detail?: string;
    amount: number;
    timestamp: number;
  };

  const timelineItems: TimelineItem[] = [
    ...currentStudent.starHistory.map((h, i) => ({
      id: `star-${h.timestamp}-${i}`,
      type: (h.amount >= 0 ? 'add' : 'deduct') as 'add' | 'deduct',
      title: h.category,
      detail: h.note,
      amount: h.amount,
      timestamp: h.timestamp,
    })),
    ...currentStudent.claimedRewards.map((r) => ({
      id: `reward-${r.id}`,
      type: 'reward' as const,
      title: `ใช้สิทธิ์แลก: ${r.rewardName}`,
      detail: `หักไป ${r.starsSpent} ดาว`,
      amount: -r.starsSpent,
      timestamp: r.claimedAt,
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  // Handle Photo Upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const compressedDataUrl = await compressImageFile(file, 280, 0.85);
      updateStudentAvatar(currentStudent.id, compressedDataUrl);
    } catch (err) {
      alert((err as Error).message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Batch Add Stars
  const handleBatchAdd = (e: React.MouseEvent) => {
    if (!batchAmount || batchAmount <= 0) return;
    const reason = batchReason.trim() || 'คะแนนพิเศษ / ความดีเพิ่มเติม';
    addStars(currentStudent.id, batchAmount, reason, undefined, e);
    setBatchReason('');
  };

  // Handle Batch Deduct Stars
  const handleBatchDeduct = () => {
    if (!batchAmount || batchAmount <= 0) return;
    const reason = batchReason.trim() || 'ปรับลดคะแนน';
    deductStars(currentStudent.id, batchAmount, reason);
    setBatchReason('');
  };

  // Handle Claim Reward
  const handleClaim = (reward: Reward) => {
    const res = claimReward(currentStudent.id, reward.id);
    setClaimFeedback(res);
    setTimeout(() => setClaimFeedback(null), 3500);
  };

  const formatDateTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const thaiYear = d.getFullYear() + 543;
    const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${thaiYear}`;
    const timeStr = d.toTimeString().split(' ')[0];
    return `${dateStr} ${timeStr}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#150a24] rounded-3xl shadow-2xl border border-white/10 overflow-hidden transform transition-all my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden File Input for Image Upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />

        {/* 1. Header Banner - Golden Amber gradient matching image */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white shrink-0 shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Student Avatar with Camera overlay */}
              <div className="relative shrink-0">
                <StudentAvatar
                  name={currentStudent.name}
                  avatarUrl={currentStudent.avatarUrl}
                  size="xl"
                  className="border-2 border-white shadow-lg bg-white/10"
                  editable
                  onUploadClick={() => fileInputRef.current?.click()}
                />
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-white animate-pulse">กำลังโหลด...</span>
                  </div>
                )}
              </div>

              {/* Names and Code */}
              <div className="min-w-0 text-white">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black font-heading tracking-wide drop-shadow-sm truncate">
                    {nickname}
                  </h2>
                  {onEditStudent && (
                    <button
                      type="button"
                      onClick={() => onEditStudent(currentStudent)}
                      title="แก้ไขข้อมูลนักเรียน"
                      className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-amber-50/90 font-medium truncate mt-0.5">
                  {currentStudent.name} (ห้อง {currentStudent.classroom}
                  {currentStudent.studentCode ? ` | รหัส: ${currentStudent.studentCode}` : ''})
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/90 hover:text-white hover:bg-black/20 transition-colors shrink-0"
              title="ปิด"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Direct Link Banner for Student/Parents */}
          <div className="bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-purple-900/60 p-3.5 rounded-2xl border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">
                  ลิงก์สำหรับส่งให้น้อง{nickname} หรือผู้ปกครองดูคะแนน
                </span>
                <span className="text-[11px] text-purple-200/80">
                  ดูประวัติดาว, อันดับในห้อง และเป้าหมายของรางวัล
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-amber-400/30 cursor-pointer"
                title="ดูและพิมพ์ QR Code บัตรนักเรียน"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>การ์ด QR</span>
              </button>
              <button
                type="button"
                onClick={handleCopyDirectLink}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/40 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอกลิงก์</span>
                  </>
                )}
              </button>
              <a
                href={directLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl transition-colors"
                title="เปิดดูหน้านี้"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick upload photo button if no avatar uploaded */}
          {!currentStudent.avatarUrl && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-amber-400/40 bg-amber-400/5 hover:bg-amber-400/10 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>ใส่รูปโปรไฟล์นักเรียน (คลิกเพื่อเลือกไฟล์ภาพจากเครื่อง)</span>
            </button>
          )}

          {/* 2. Card: "ใช้สิทธิ์แลกของรางวัล" */}
          <div className="bg-[#1f1035] rounded-2xl p-4 border border-purple-500/30 shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(147,51,234,0.4)]">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base font-heading">
                    ใช้สิทธิ์แลกของรางวัล
                  </h3>
                  <p className="text-xs text-purple-300 font-medium">
                    มีดาวสะสม: <span className="font-bold text-amber-400">{currentStudent.stars}</span> ดวง
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRedeemingOpen((prev) => !prev)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(147,51,234,0.35)] flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                <Gift className="w-4 h-4" />
                <span>แลกสิทธิ์</span>
                {isRedeemingOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Quick Reward Drawer */}
            {isRedeemingOpen && (
              <div className="mt-3 pt-3 border-t border-purple-500/20 space-y-2 animate-in fade-in duration-150">
                <p className="text-xs text-slate-300 font-medium">เลือกของรางวัลที่ต้องการแลก:</p>
                {rewards.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">ยังไม่มีรายการของรางวัลในระบบ</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {rewards.map((reward) => {
                      const canAfford = currentStudent.stars >= reward.requiredStars;
                      return (
                        <div
                          key={reward.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 text-xs transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-white truncate">{reward.name}</p>
                            <p className="text-[11px] text-amber-400 font-medium">
                              ใช้ {reward.requiredStars} ดาว ⭐
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={() => handleClaim(reward)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold shadow-xs transition-all hover:scale-105 shrink-0"
                          >
                            {canAfford ? 'แลกรับเลย' : 'ดาวไม่พอ'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {claimFeedback && (
                  <div
                    className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      claimFeedback.success
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {claimFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{claimFeedback.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Card: "เพิ่ม / ลด ทีละหลายๆ ดาว พร้อมระบุเหตุผล ⭐" */}
          <div className="rounded-2xl p-4 sm:p-5 border-2 border-amber-400/50 bg-amber-400/5 shadow-md space-y-3">
            <h3 className="text-sm font-bold text-amber-400 font-heading flex items-center gap-1.5">
              <span>เพิ่ม / ลด ทีละหลายๆ ดาว พร้อมระบุเหตุผล</span>
              <span>⭐</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Amount Input */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  จำนวนดาว
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={batchAmount}
                  onChange={(e) => setBatchAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-center text-sm font-bold rounded-xl border border-amber-400/40 bg-[#150a24] text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                />
              </div>

              {/* Reason Input */}
              <div className="sm:col-span-8">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  เหตุผล / หมายเหตุ
                </label>
                <input
                  type="text"
                  value={batchReason}
                  onChange={(e) => setBatchReason(e.target.value)}
                  placeholder="เช่น ชนะการประกวด, ช่วยงานโรงเรียน, ลืมการบ้าน..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-white/10 bg-[#150a24] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Deduct Button */}
              <button
                type="button"
                onClick={handleBatchDeduct}
                disabled={currentStudent.stars <= 0 || batchAmount <= 0}
                className="py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm font-bold transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Minus className="w-4 h-4" />
                <span>หักดาวหลายดวง</span>
              </button>

              {/* Add Button */}
              <button
                type="button"
                onClick={handleBatchAdd}
                disabled={batchAmount <= 0}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(245,158,11,0.35)] transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>มอบดาวหลายดวง</span>
              </button>
            </div>
          </div>

          {/* 4. Card: "ประวัติรับดาว & การใช้สิทธิ์แลกรางวัล" */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs sm:text-sm font-bold text-slate-200 font-heading">
                ประวัติรับดาว & การใช้สิทธิ์แลกรางวัล
              </h3>
              <span className="text-xs sm:text-sm font-black text-amber-400 font-heading flex items-center gap-1">
                <span>⭐</span> {currentStudent.stars} ดวง
              </span>
            </div>

            {timelineItems.length === 0 ? (
              <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5 text-slate-500 text-xs">
                ยังไม่มีประวัติการรับดาวหรือแลกรางวัลของนักเรียนคนนี้
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {timelineItems.map((item) => {
                  const isAdd = item.type === 'add';
                  const isReward = item.type === 'reward';

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 flex items-center justify-between gap-2.5 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isReward ? (
                          <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                            <Gift className="w-3.5 h-3.5" />
                          </div>
                        ) : isAdd ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                            <Minus className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {item.title}{' '}
                            <span
                              className={`text-[11px] font-bold ${
                                isReward
                                  ? 'text-purple-400'
                                  : isAdd
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              ({item.amount > 0 ? `+${item.amount}` : item.amount})
                            </span>
                          </p>
                          {item.detail && (
                            <p className="text-[10px] text-slate-400 truncate">{item.detail}</p>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {formatDateTime(item.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student QR Modal */}
      <StudentQrModal
        student={currentStudent}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
};

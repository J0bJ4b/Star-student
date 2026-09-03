import React, { useState } from 'react';
import { useStudents } from '../context/StudentContext';
import { Reward } from '../types';
import { RewardModal } from '../components/RewardModal';
import {
  Gift,
  Plus,
  Star,
  Sparkles,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  Users,
  Award,
} from 'lucide-react';

export const Rewards: React.FC = () => {
  const {
    rewards,
    students,
    deleteReward,
    claimReward,
    selectedClassroom,
    classrooms,
    setSelectedClassroom,
  } = useStudents();

  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const filteredStudents =
    selectedClassroom === 'all'
      ? students
      : students.filter((s) => s.classroom === selectedClassroom);

  const currentStudent = students.find((s) => s.id === selectedStudentId) || filteredStudents[0];

  const handleClaim = (reward: Reward) => {
    if (!currentStudent) return;
    if (window.confirm(`ยืนยันการแลกรางวัล "${reward.name}" ให้กับ "${currentStudent.name}" โดยใช้ ${reward.requiredStars} ดาว?`)) {
      const res = claimReward(currentStudent.id, reward.id);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleDeleteReward = (reward: Reward) => {
    if (window.confirm(`ต้องการลบของรางวัล "${reward.name}" ใช่หรือไม่?`)) {
      deleteReward(reward.id);
    }
  };

  // Claimed Rewards history aggregated
  const allClaimedList = students
    .flatMap((s) =>
      (s.claimedRewards || []).map((c) => ({
        ...c,
        studentName: s.name,
        classroom: s.classroom,
      }))
    )
    .sort((a, b) => b.claimedAt - a.claimedAt);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#150a24] p-5 rounded-3xl border border-white/10 shadow-lg shadow-purple-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs tracking-wide">
            <Gift className="w-4 h-4 text-amber-400" />
            <span>ระบบเป้าหมายและแลกของรางวัล</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-heading mt-0.5">
            ร้านค้าดาวแลกรางวัล 🎁
          </h1>
          <p className="text-xs text-slate-400">
            ตั้งเป้าหมายดาวแลกของรางวัล เพื่อสร้างแรงบันดาลใจและชื่นชมนักเรียน
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingReward(null);
            setIsRewardModalOpen(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-2xl font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มรางวัลใหม่</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Student Selector Card for Redemption */}
      <div className="bg-gradient-to-r from-purple-950/70 via-[#150a24] to-indigo-950/70 border border-white/10 text-white p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span className="font-heading font-bold text-sm sm:text-base text-white">
              เลือกนักเรียนเพื่อตรวจสอบสิทธิ์แลกรางวัล:
            </span>
          </div>

          {/* Classroom filter if needed */}
          <div className="flex items-center gap-2">
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="bg-white/5 text-purple-200 border border-white/10 rounded-xl px-2.5 py-1 text-xs font-medium focus:outline-none [&>option]:bg-[#150a24]"
            >
              <option value="all">
                ทุกชั้นเรียน
              </option>
              {classrooms.map((c) => (
                <option key={c} value={c}>
                  ห้อง {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs text-purple-300 mb-1 font-medium">
              รายชื่อนักเรียน:
            </label>
            <select
              value={currentStudent?.id || ''}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-white/5 text-white border border-white/10 text-sm font-semibold rounded-2xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm [&>option]:bg-[#150a24]"
            >
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.classroom}) — มี {s.stars} ⭐
                </option>
              ))}
            </select>
          </div>

          {currentStudent && (
            <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-2xl p-3 sm:px-6 flex items-center justify-between sm:justify-start gap-4">
              <div>
                <span className="text-[11px] text-purple-300 block">ดาวสะสมปัจจุบัน</span>
                <span className="text-2xl font-black text-amber-400 font-heading">
                  {currentStudent.stars} ⭐
                </span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <span className="text-[11px] text-purple-300 block">แลกแล้ว</span>
                <span className="text-sm font-bold text-white">
                  {currentStudent.claimedRewards?.length || 0} ครั้ง
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rewards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" />
            รายการของรางวัลทั้งหมด ({rewards.length})
          </h2>
          <span className="text-xs text-slate-400">
            แสดงสถานะเทียบกับ {currentStudent?.name || 'นักเรียน'}
          </span>
        </div>

        {rewards.length === 0 ? (
          <div className="bg-[#150a24] rounded-3xl p-12 text-center border border-white/10">
            <Gift className="w-12 h-12 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-medium">ยังไม่มีของรางวัลในระบบ</p>
            <button
              type="button"
              onClick={() => setIsRewardModalOpen(true)}
              className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
            >
              + เพิ่มรางวัลชิ้นแรก
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => {
              const studentStars = currentStudent?.stars || 0;
              const isEligible = studentStars >= reward.requiredStars;
              const neededStars = Number((reward.requiredStars - studentStars).toFixed(1));
              const progressPct = Math.min(
                100,
                Math.round((studentStars / reward.requiredStars) * 100)
              );

              return (
                <div
                  key={reward.id}
                  className={`bg-[#150a24] rounded-3xl p-5 border transition-all duration-200 shadow-lg shadow-purple-950/20 flex flex-col justify-between ${
                    isEligible
                      ? 'border-amber-400/40 ring-1 ring-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.1)]'
                      : 'border-white/10 hover:border-purple-500/30'
                  }`}
                >
                  <div>
                    {/* Header: Title & Edit/Delete icons */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center text-xl shrink-0">
                        🎁
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReward(reward);
                            setIsRewardModalOpen(true);
                          }}
                          className="p-1 hover:text-purple-300 rounded-lg hover:bg-white/5 transition-colors"
                          title="แก้ไขรางวัล"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReward(reward)}
                          className="p-1 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors"
                          title="ลบรางวัล"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-heading font-bold text-white text-base mt-3 leading-snug">
                      {reward.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {reward.description || 'รางวัลตอบแทนความตั้งใจและการทำความดี'}
                    </p>

                    {/* Required Stars Tag */}
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-400">ต้องใช้:</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-black font-heading flex items-center gap-1 shadow-[0_0_8px_rgba(251,191,36,0.15)]">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {reward.requiredStars} ดาว
                      </span>
                    </div>

                    {/* Progress Bar for selected student */}
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>
                          ความคืบหน้า ({studentStars} / {reward.requiredStars})
                        </span>
                        <span className="font-semibold text-purple-300">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isEligible
                              ? 'bg-emerald-400'
                              : 'bg-gradient-to-r from-purple-500 to-amber-400'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Claim Button */}
                  <div className="mt-5">
                    {isEligible ? (
                      <button
                        type="button"
                        onClick={() => handleClaim(reward)}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-1.5 hover:scale-102 active:scale-98"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                        <span>กดแลกรางวัลนี้ (หัก {reward.requiredStars} ⭐)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 bg-white/5 border border-white/5 text-slate-500 rounded-xl text-xs font-medium cursor-not-allowed text-center"
                      >
                        ดาวไม่พอ (ยังขาดอีก {neededStars} ⭐)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Claimed Rewards Log */}
      <div className="bg-[#150a24] rounded-3xl p-5 border border-white/10 shadow-lg shadow-purple-950/20 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <Clock className="w-4 h-4 text-purple-400" />
          <h3 className="font-heading font-bold text-sm text-white">
            ประวัติการแลกรางวัลล่าสุด ({allClaimedList.length} รายการ)
          </h3>
        </div>

        {allClaimedList.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            ยังไม่มีประวัติการแลกของรางวัล
          </div>
        ) : (
          <div className="divide-y divide-white/5 text-xs">
            {allClaimedList.slice(0, 10).map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    🎁
                  </div>
                  <div>
                    <span className="font-semibold text-white">{item.studentName}</span>
                    <span className="text-slate-400 ml-1.5">({item.classroom})</span>
                    <span className="text-emerald-400 font-medium ml-2">
                      แลก "{item.rewardName}"
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-bold">-{item.starsSpent} ⭐</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.claimedAt).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reward Modal */}
      <RewardModal
        reward={editingReward}
        isOpen={isRewardModalOpen}
        onClose={() => {
          setIsRewardModalOpen(false);
          setEditingReward(null);
        }}
      />
    </div>
  );
};

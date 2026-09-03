import React, { useState, useEffect } from 'react';
import { Reward } from '../types';
import { useStudents } from '../context/StudentContext';
import { X, Gift, Sparkles } from 'lucide-react';

interface RewardModalProps {
  reward?: Reward | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RewardModal: React.FC<RewardModalProps> = ({ reward, isOpen, onClose }) => {
  const { addReward, editReward } = useStudents();
  const [name, setName] = useState('');
  const [requiredStars, setRequiredStars] = useState<number>(10);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (reward) {
      setName(reward.name);
      setRequiredStars(reward.requiredStars);
      setDescription(reward.description);
    } else {
      setName('');
      setRequiredStars(10);
      setDescription('');
    }
  }, [reward, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || requiredStars < 1) return;

    if (reward) {
      editReward(reward.id, name.trim(), requiredStars, description.trim());
    } else {
      addReward(name.trim(), requiredStars, description.trim());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-[#150a24] rounded-3xl shadow-2xl border border-white/10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border-b border-white/10 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold font-heading text-white">
              {reward ? 'แก้ไขรางวัล' : 'เพิ่มรางวัลใหม่'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              ชื่อของรางวัล <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ดินสอไม้การ์ตูน, สิทธิ์นั่งข้างเพื่อน"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              จำนวนดาวที่ต้องใช้ (เป้าหมายดาว) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="0.5"
                value={requiredStars}
                onChange={(e) => setRequiredStars(parseFloat(e.target.value) || 1)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white font-semibold placeholder:text-slate-500"
              />
              <span className="absolute right-3.5 top-2.5 text-sm text-amber-400 font-medium">
                ⭐ ดวง
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="เช่น ให้สิทธิ์เมื่อสะสมดาวครบ สามารถรับได้ที่โต๊ะคุณครู"
              className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm placeholder:text-slate-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-sm font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all text-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              {reward ? 'บันทึกการแก้ไข' : 'เพิ่มรางวัล'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

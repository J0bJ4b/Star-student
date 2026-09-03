import React, { useState, useEffect, useRef } from 'react';
import { Student } from '../types';
import { useStudents } from '../context/StudentContext';
import { StudentAvatar } from './StudentAvatar';
import { compressImageFile } from '../utils/imageHelper';
import { X, UserCheck, GraduationCap, Camera, Trash2 } from 'lucide-react';

interface EditStudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({ student, isOpen, onClose }) => {
  const { editStudent, classrooms } = useStudents();
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [classroom, setClassroom] = useState('');
  const [customClass, setCustomClass] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isProcessingImg, setIsProcessingImg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setNickname(student.nickname || '');
      setStudentCode(student.studentCode || '');
      setClassroom(student.classroom);
      setCustomClass('');
      setAvatarUrl(student.avatarUrl);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImg(true);
      const compressed = await compressImageFile(file, 280, 0.85);
      setAvatarUrl(compressed);
    } catch (err) {
      alert((err as Error).message || 'ไม่สามารถอัปโหลดรูปภาพได้');
    } finally {
      setIsProcessingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalClass = classroom === '__new__' ? customClass.trim() : classroom.trim();
    editStudent(student.id, name.trim(), finalClass || student.classroom, {
      nickname: nickname.trim() || undefined,
      studentCode: studentCode.trim() || undefined,
      avatarUrl: avatarUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#150a24] rounded-3xl shadow-2xl border border-white/10 overflow-hidden transform transition-all my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />

        <div className="px-6 py-4 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border-b border-white/10 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold font-heading text-white">แก้ไขข้อมูลและโปรไฟล์นักเรียน</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Photo Avatar section */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <StudentAvatar
              name={name || student.name}
              avatarUrl={avatarUrl}
              size="lg"
              className="border-2 border-white/20"
            />
            <div className="space-y-1.5 min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200">รูปถ่ายโปรไฟล์นักเรียน</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImg}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{avatarUrl ? 'เปลี่ยนรูปภาพ' : 'อัปโหลดรูปภาพ'}</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs transition-colors"
                    title="ลบรูปภาพ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500">รองรับไฟล์ JPG, PNG หรือภาพถ่ายจากมือถือ</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                ชื่อเล่น (แสดงเด่นในโปรไฟล์)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="เช่น พีช, ข้าวหอม"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                รหัสนักเรียน / เลขที่
              </label>
              <input
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="เช่น 313, 01"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              ชื่อ - นามสกุล นักเรียน <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ด.ช. พีช วรเมธ"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              ชั้นเรียน / ห้อง <span className="text-rose-400">*</span>
            </label>
            <div className="space-y-2">
              <select
                value={classroom}
                onChange={(e) => setClassroom(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-white [&>option]:bg-[#150a24]"
              >
                {classrooms.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
                <option value="__new__">+ เพิ่มชั้นเรียนใหม่...</option>
              </select>

              {classroom === '__new__' && (
                <input
                  type="text"
                  value={customClass}
                  onChange={(e) => setCustomClass(e.target.value)}
                  placeholder="พิมพ์ชื่อชั้นเรียนใหม่ เช่น ป.3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-500/50 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-white placeholder:text-slate-500"
                  required
                />
              )}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-sm font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all text-sm flex items-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4" />
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

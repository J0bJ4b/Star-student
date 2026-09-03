import React, { useState } from 'react';
import { useStudents } from '../context/StudentContext';
import { Student } from '../types';
import { EditStudentModal } from '../components/EditStudentModal';
import { StudentProfileModal } from '../components/StudentProfileModal';
import { StudentAvatar } from '../components/StudentAvatar';
import { StudentQrModal } from '../components/StudentQrModal';
import { BatchQrPrintModal } from '../components/BatchQrPrintModal';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Star,
  Search,
  GraduationCap,
  Eye,
  Sparkles,
  FileSpreadsheet,
  Share2,
  Check,
  QrCode,
  Printer,
} from 'lucide-react';
import { BackupModal } from '../components/BackupModal';

export const Students: React.FC = () => {
  const {
    students,
    addStudent,
    deleteStudent,
    selectedClassroom,
    setSelectedClassroom,
    classrooms,
    addStars,
    deductStars,
  } = useStudents();

  // Add new student form state
  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newClassroom, setNewClassroom] = useState('ป.1/1');
  const [customClassroom, setCustomClassroom] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [qrModalStudent, setQrModalStudent] = useState<Student | null>(null);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);

  const handleCopyLink = (stId: string) => {
    const url = `${window.location.origin}/portal/${stId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedStudentId(stId);
      setTimeout(() => setCopiedStudentId(null), 2500);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const targetClass =
      newClassroom === '__new__' ? customClassroom.trim() || 'ป.1/1' : newClassroom.trim();
    addStudent(newName.trim(), targetClass, {
      nickname: newNickname.trim() || undefined,
      studentCode: newStudentCode.trim() || undefined,
    });

    setNewName('');
    setNewNickname('');
    setNewStudentCode('');
    if (newClassroom === '__new__') {
      setNewClassroom(targetClass);
      setCustomClassroom('');
    }
  };

  const handleDelete = (student: Student) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลของ "${student.name}" (ห้อง ${student.classroom})?`)) {
      deleteStudent(student.id);
      if (profileStudent?.id === student.id) setProfileStudent(null);
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchClass = selectedClassroom === 'all' || s.classroom === selectedClassroom;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      q === '' ||
      s.name.toLowerCase().includes(q) ||
      (s.nickname && s.nickname.toLowerCase().includes(q)) ||
      (s.studentCode && s.studentCode.includes(q)) ||
      s.classroom.toLowerCase().includes(q);
    return matchClass && matchQuery;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-[#150a24] p-5 rounded-3xl border border-white/10 shadow-lg shadow-purple-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs tracking-wide">
            <Users className="w-4 h-4 text-purple-400" />
            <span>ระบบทะเบียนนักเรียน & โปรไฟล์</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-heading mt-0.5">
            จัดการรายชื่อนักเรียน 📋
          </h1>
          <p className="text-xs text-slate-400">
            ใส่รูปถ่ายนักเรียน ดูข้อมูลโปรไฟล์ บันทึกดาว และจัดห้องเรียน
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsBatchPrintOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 rounded-xl text-xs font-semibold border border-amber-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="พิมพ์การ์ดและสติกเกอร์ QR Code นักเรียนทั้งห้องเรียน"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>พิมพ์การ์ด QR นักเรียน (A4)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsBackupOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="ส่งออกหรือซิงก์ข้อมูลไป Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>ซิงก์ Google Sheets</span>
          </button>
          <div className="px-3.5 py-1.5 bg-purple-600/20 text-purple-300 rounded-xl text-xs font-semibold border border-purple-500/30 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-purple-400" />
            <span>รวมทั้งหมด {students.length} คน</span>
          </div>
        </div>
      </div>

      {/* Add Student Box */}
      <div className="bg-gradient-to-r from-purple-950/40 via-[#150a24] to-indigo-950/40 p-5 rounded-3xl border border-white/10 shadow-lg shadow-purple-950/20">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white font-heading">
            เพิ่มนักเรียนใหม่เข้าสู่ระบบ
          </h2>
        </div>

        <form onSubmit={handleAddSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ชื่อ - นามสกุล นักเรียน * (เช่น ด.ช. พีช วรเมธ)"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs text-white placeholder:text-slate-500"
              />
            </div>

            <div className="sm:col-span-2">
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="ชื่อเล่น (เช่น พีช)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs text-white placeholder:text-slate-500"
              />
            </div>

            <div className="sm:col-span-2">
              <input
                type="text"
                value={newStudentCode}
                onChange={(e) => setNewStudentCode(e.target.value)}
                placeholder="รหัส (เช่น 313)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs text-white placeholder:text-slate-500"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={newClassroom}
                onChange={(e) => setNewClassroom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs text-white [&>option]:bg-[#150a24]"
              >
                {classrooms.map((c) => (
                  <option key={c} value={c}>
                    ห้อง {c}
                  </option>
                ))}
                <option value="__new__">+ เพิ่มชั้นเรียน/ห้องใหม่...</option>
              </select>

              {newClassroom === '__new__' && (
                <input
                  type="text"
                  value={customClassroom}
                  onChange={(e) => setCustomClassroom(e.target.value)}
                  placeholder="ระบุชั้นเรียนใหม่ เช่น ป.3"
                  className="mt-2 w-full px-3 py-2 rounded-xl border border-purple-500/50 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs text-white placeholder:text-slate-500"
                  required
                />
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-1.5 hover:scale-102 active:scale-98"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>บันทึกเพิ่มนักเรียน</span>
            </button>
          </div>
        </form>
      </div>

      {/* Table Filter and Search Header */}
      <div className="bg-[#150a24] p-4 rounded-2xl border border-white/10 shadow-lg shadow-purple-950/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, ชื่อเล่น, รหัส หรือ ชั้นเรียน..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Classroom Tabs / Select */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedClassroom('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              selectedClassroom === 'all'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-400 font-semibold shadow-[0_0_12px_rgba(147,51,234,0.3)]'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5'
            }`}
          >
            ทุกห้องเรียน ({students.length})
          </button>
          {classrooms.map((cls) => {
            const count = students.filter((s) => s.classroom === cls).length;
            const isSelected = selectedClassroom === cls;
            return (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClassroom(cls)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-400 font-semibold shadow-[0_0_12px_rgba(147,51,234,0.3)]'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5'
                }`}
              >
                ห้อง {cls} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-[#150a24] rounded-3xl border border-white/10 shadow-lg shadow-purple-950/20 overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            ไม่พบข้อมูลนักเรียนที่ตรงกับเงื่อนไข
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">รูป & นักเรียน (คลิกดูโปรไฟล์)</th>
                  <th className="py-3.5 px-4">ชั้นเรียน / รหัส</th>
                  <th className="py-3.5 px-4">ดาวสะสม</th>
                  <th className="py-3.5 px-4">ประวัติดาวล่าสุด</th>
                  <th className="py-3.5 px-4 text-center">ปรับดาวด่วน</th>
                  <th className="py-3.5 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {filteredStudents.map((student, idx) => (
                  <tr
                    key={student.id}
                    className="hover:bg-purple-600/5 transition-colors group cursor-pointer"
                    onClick={() => setProfileStudent(student)}
                  >
                    <td className="py-3.5 px-4 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <StudentAvatar
                          name={student.name}
                          avatarUrl={student.avatarUrl}
                          size="sm"
                          className="border border-white/20 group-hover:scale-105 transition-transform"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white group-hover:text-amber-300 transition-colors">
                              {student.name}
                            </span>
                            {student.nickname && (
                              <span className="px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                                {student.nickname}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-purple-400 hover:underline">
                            คลิกเพื่อดูโปรไฟล์ & ประวัติ ✨
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg bg-purple-600/20 text-purple-300 font-medium border border-purple-500/20 text-[11px]">
                          {student.classroom}
                        </span>
                        {student.studentCode && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            #{student.studentCode}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 font-bold text-xs shadow-[0_0_8px_rgba(251,191,36,0.15)]">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{student.stars}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {student.starHistory[0] ? (
                        <span>
                          {student.starHistory[0].category} (
                          {student.starHistory[0].amount > 0 ? '+' : ''}
                          {student.starHistory[0].amount})
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    {/* Quick Star Adjust Buttons */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => deductStars(student.id, 1, 'ปรับลดคะแนน')}
                          disabled={student.stars < 1}
                          className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 disabled:opacity-30 disabled:cursor-not-allowed border border-red-500/30 text-xs font-bold transition-all hover:scale-105"
                          title="ลด 1 ดาว"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() => deductStars(student.id, 0.5, 'ปรับลดคะแนน')}
                          disabled={student.stars < 0.5}
                          className="w-7 h-7 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 disabled:opacity-30 disabled:cursor-not-allowed border border-rose-500/30 text-xs font-bold transition-all hover:scale-105"
                          title="ลด 0.5 ดาว"
                        >
                          -½
                        </button>
                        <button
                          type="button"
                          onClick={(e) => addStars(student.id, 0.5, 'ประพฤติดี', undefined, e)}
                          className="w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all hover:scale-105 shadow-[0_0_8px_rgba(251,191,36,0.15)]"
                          title="เพิ่ม 0.5 ดาว"
                        >
                          +½
                        </button>
                        <button
                          type="button"
                          onClick={(e) => addStars(student.id, 1, 'ประพฤติดี', undefined, e)}
                          className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all hover:scale-105 shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
                          title="เพิ่ม 1 ดาว"
                        >
                          +1
                        </button>
                      </div>
                    </td>
                    {/* Actions: Profile / Edit / Delete */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQrModalStudent(student)}
                          className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-400/20 rounded-lg transition-colors cursor-pointer"
                          title="สร้างและพิมพ์ QR Code การ์ดนักเรียน"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(student.id)}
                          className="p-1.5 text-purple-300 hover:text-purple-100 hover:bg-purple-600/30 rounded-lg transition-colors"
                          title="คัดลอกลิงก์ให้นักเรียนคนนี้ดูคะแนน"
                        >
                          {copiedStudentId === student.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfileStudent(student)}
                          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="ดูโปรไฟล์นักเรียน"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingStudent(student)}
                          className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-600/20 rounded-lg transition-colors"
                          title="แก้ไขข้อมูลนักเรียน"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(student)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                          title="ลบนักเรียน"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      <EditStudentModal
        student={editingStudent}
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
      />

      {/* Student Profile Modal */}
      <StudentProfileModal
        student={profileStudent}
        isOpen={!!profileStudent}
        onClose={() => setProfileStudent(null)}
        onEditStudent={(st) => {
          setProfileStudent(null);
          setEditingStudent(st);
        }}
      />

      {/* Student QR Code Modal */}
      <StudentQrModal
        student={qrModalStudent}
        isOpen={!!qrModalStudent}
        onClose={() => setQrModalStudent(null)}
        onOpenBatchPrint={() => setIsBatchPrintOpen(true)}
      />

      {/* Batch QR Code Print Modal */}
      <BatchQrPrintModal
        students={students}
        classrooms={classrooms}
        initialClassroom={selectedClassroom !== 'all' ? selectedClassroom : undefined}
        isOpen={isBatchPrintOpen}
        onClose={() => setIsBatchPrintOpen(false)}
      />

      {/* Database & Google Sheets Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />
    </div>
  );
};

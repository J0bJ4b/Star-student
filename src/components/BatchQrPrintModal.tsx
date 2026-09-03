import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { getStudentPortalUrl, generateQrDataUrl } from '../utils/qrHelper';
import {
  X,
  Printer,
  QrCode,
  CheckSquare,
  Square,
  School,
  Sparkles,
  Star,
  Settings2,
  FileText,
  Layers,
  Smartphone,
  Check,
} from 'lucide-react';

interface BatchQrPrintModalProps {
  students: Student[];
  classrooms: string[];
  initialClassroom?: string;
  isOpen: boolean;
  onClose: () => void;
}

type CardLayout = 'compact' | 'standard' | 'large';

interface StudentQrMap {
  [studentId: string]: string; // studentId -> QR dataUrl
}

export const BatchQrPrintModal: React.FC<BatchQrPrintModalProps> = ({
  students,
  classrooms,
  initialClassroom,
  isOpen,
  onClose,
}) => {
  const [selectedClassroom, setSelectedClassroom] = useState<string>(
    initialClassroom || 'all'
  );
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [schoolTitle, setSchoolTitle] = useState('🌟 STAR ACADEMY • สมุดสะสมดาวความดี');
  const [layout, setLayout] = useState<CardLayout>('standard');
  const [qrMap, setQrMap] = useState<StudentQrMap>({});
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [includeAvatar, setIncludeAvatar] = useState(true);
  const [includeInstructions, setIncludeInstructions] = useState(true);

  // Filter students based on classroom
  const filteredStudents = students.filter(
    (s) => selectedClassroom === 'all' || s.classroom === selectedClassroom
  );

  // Initialize selected student IDs when modal opens or classroom filter changes
  useEffect(() => {
    if (isOpen) {
      if (initialClassroom && initialClassroom !== 'all') {
        setSelectedClassroom(initialClassroom);
      }
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  }, [isOpen, initialClassroom]);

  useEffect(() => {
    setSelectedStudentIds(filteredStudents.map((s) => s.id));
  }, [selectedClassroom]);

  // Generate QR codes for all selected students
  useEffect(() => {
    if (!isOpen || selectedStudentIds.length === 0) return;

    let isMounted = true;
    setIsGeneratingQr(true);

    const generateAll = async () => {
      const newQrMap: StudentQrMap = {};
      for (const id of selectedStudentIds) {
        if (qrMap[id]) {
          newQrMap[id] = qrMap[id];
          continue;
        }
        const portalUrl = getStudentPortalUrl(id);
        try {
          const dataUrl = await generateQrDataUrl(portalUrl, {
            width: 320,
            margin: 1,
            darkColor: '#000000',
            lightColor: '#ffffff',
            errorCorrectionLevel: 'M',
          });
          newQrMap[id] = dataUrl;
        } catch (err) {
          console.error(`Failed to generate QR for student ${id}`, err);
        }
      }

      if (isMounted) {
        setQrMap((prev) => ({ ...prev, ...newQrMap }));
        setIsGeneratingQr(false);
      }
    };

    generateAll();

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedStudentIds]);

  if (!isOpen) return null;

  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedStudentsToPrint = students.filter((s) =>
    selectedStudentIds.includes(s.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      {/* ON-SCREEN MODAL UI (HIDDEN DURING PRINT) */}
      <div className="no-print bg-[#180b2d] border border-purple-500/30 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-900/80 via-[#231042] to-indigo-950/80 px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-white text-lg leading-tight flex items-center gap-2">
                <span>พิมพ์การ์ด & สติกเกอร์ QR Code นักเรียน (A4)</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold">
                  {selectedStudentIds.length} คน
                </span>
              </h3>
              <p className="text-xs text-purple-200 mt-0.5">
                พิมพ์การ์ด QR Code ประจำตัวให้นักเรียนนำไปติดสมุดหรือแจกให้ผู้ปกครองสแกนดูคะแนน
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Toolbar & Settings */}
        <div className="p-4 sm:p-5 bg-[#140826] border-b border-white/10 space-y-4 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Classroom Filter */}
            <div className="md:col-span-4">
              <label className="text-xs font-semibold text-purple-300 block mb-1 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5" />
                <span>เลือกห้องเรียน:</span>
              </label>
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
              >
                <option value="all">ทุกห้องเรียน ({students.length} คน)</option>
                {classrooms.map((cls) => {
                  const count = students.filter((s) => s.classroom === cls).length;
                  return (
                    <option key={cls} value={cls}>
                      ห้อง {cls} ({count} คน)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Layout Size */}
            <div className="md:col-span-4">
              <label className="text-xs font-semibold text-purple-300 block mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>ขนาด & รูปแบบการ์ด:</span>
              </label>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as CardLayout)}
                className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
              >
                <option value="standard">การ์ดพกพา / บัตรนักเรียน (8 ใบต่อ A4)</option>
                <option value="compact">สติกเกอร์ติดสมุด (12 ใบต่อ A4)</option>
                <option value="large">การ์ดขนาดใหญ่ / เกียรติบัตร (4 ใบต่อ A4)</option>
              </select>
            </div>

            {/* School Title Header */}
            <div className="md:col-span-4">
              <label className="text-xs font-semibold text-purple-300 block mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>หัวข้อบนการ์ด:</span>
              </label>
              <input
                type="text"
                value={schoolTitle}
                onChange={(e) => setSchoolTitle(e.target.value)}
                placeholder="เช่น โรงเรียนของเรา • สมุดสะสมดาว"
                className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
            </div>
          </div>

          {/* Student Selection Chips and Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-200 border border-white/10 transition-colors font-medium cursor-pointer"
              >
                {selectedStudentIds.length === filteredStudents.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>ยกเลิกเลือกทั้งหมด</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                    <span>เลือกทั้งหมด ({filteredStudents.length})</span>
                  </>
                )}
              </button>

              <label className="inline-flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeAvatar}
                  onChange={(e) => setIncludeAvatar(e.target.checked)}
                  className="rounded border-white/20 bg-black/40 text-purple-600 focus:ring-0"
                />
                <span>แสดงรูปภาพ</span>
              </label>

              <label className="inline-flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeInstructions}
                  onChange={(e) => setIncludeInstructions(e.target.checked)}
                  className="rounded border-white/20 bg-black/40 text-purple-600 focus:ring-0"
                />
                <span>แสดงวิธีสแกน</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">
                {isGeneratingQr ? (
                  <span className="text-amber-400 animate-pulse">กำลังเตรียม QR Code...</span>
                ) : (
                  `พร้อมพิมพ์ ${selectedStudentsToPrint.length} ใบ (ประมาณ ${Math.ceil(
                    selectedStudentsToPrint.length / (layout === 'compact' ? 12 : layout === 'standard' ? 8 : 4)
                  )} หน้า A4)`
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>ตัวอย่างการ์ดพิมพ์ (Preview)</span>
            </span>
            <span className="text-[11px] text-slate-500">
              คลิกที่การ์ดเพื่อเลือก/ไม่เลือกนักเรียนรายคน
            </span>
          </div>

          {selectedStudentsToPrint.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              กรุณาเลือกนักเรียนอย่างน้อย 1 คนเพื่อพิมพ์การ์ด
            </div>
          ) : (
            <div
              className={`grid gap-3 ${
                layout === 'compact'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                  : layout === 'standard'
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2'
              }`}
            >
              {filteredStudents.map((st) => {
                const isSelected = selectedStudentIds.includes(st.id);
                const qrUrl = qrMap[st.id];

                return (
                  <div
                    key={st.id}
                    onClick={() => handleToggleStudent(st.id)}
                    className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer select-none text-center ${
                      isSelected
                        ? 'bg-[#220d3e] border-amber-400/50 shadow-lg shadow-purple-950/40 ring-1 ring-amber-400/30'
                        : 'bg-white/5 border-white/10 opacity-40 hover:opacity-75'
                    }`}
                  >
                    {/* Selection Indicator */}
                    <div className="absolute top-2.5 right-2.5">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border border-white/30" />
                      )}
                    </div>

                    <div className="text-[10px] font-bold text-amber-400/90 truncate px-4">
                      {schoolTitle}
                    </div>

                    {/* Student Info */}
                    <div className="my-2">
                      <div className="font-bold text-white text-xs truncate">{st.name}</div>
                      <div className="text-[11px] text-purple-200">
                        {st.nickname && <span className="text-amber-300 font-semibold">น้อง{st.nickname} • </span>}
                        <span>ห้อง {st.classroom}</span>
                        {st.studentCode && <span className="text-slate-400"> (#{st.studentCode})</span>}
                      </div>
                    </div>

                    {/* QR Preview */}
                    <div className="my-1.5 p-2 bg-white rounded-xl inline-block shadow-sm border border-slate-200">
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt="QR"
                          className={`${
                            layout === 'compact' ? 'w-24 h-24' : layout === 'standard' ? 'w-28 h-28' : 'w-36 h-36'
                          } mx-auto block`}
                        />
                      ) : (
                        <div className="w-24 h-24 flex items-center justify-center text-[10px] text-slate-400 animate-pulse">
                          สร้าง QR...
                        </div>
                      )}
                    </div>

                    {includeInstructions && (
                      <div className="text-[9px] text-slate-300 mt-1">
                        สแกนเพื่อดูประวัติดาวความดี ⭐
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer with Print Trigger */}
        <div className="bg-[#120524] px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            <span>เครื่องพิมพ์จะปรับขนาดการ์ดให้อัตโนมัติตามหน้า A4 (หมึกขาวดำหรือสี)</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={selectedStudentsToPrint.length === 0 || isGeneratingQr}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer hover:scale-102 active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ออกกระดาษ A4 ทันที ({selectedStudentsToPrint.length} ใบ)</span>
            </button>
          </div>
        </div>
      </div>

      {/* DEDICATED PRINT CONTAINER (SHOWN ONLY WHEN PRINTING ON PAPER) */}
      <div className="print-only hidden w-full bg-white text-black p-0 m-0">
        <div
          className={`grid ${
            layout === 'compact'
              ? 'grid-cols-3 gap-2.5'
              : layout === 'standard'
              ? 'grid-cols-2 gap-3.5'
              : 'grid-cols-2 gap-5'
          }`}
        >
          {selectedStudentsToPrint.map((st, idx) => {
            const qrUrl = qrMap[st.id];
            const portalUrl = getStudentPortalUrl(st.id);

            return (
              <div
                key={st.id}
                className={`print-card border-2 border-black rounded-xl p-3 text-center bg-white text-black break-inside-avoid relative flex flex-col justify-between ${
                  layout === 'compact'
                    ? 'min-h-[220px]'
                    : layout === 'standard'
                    ? 'min-h-[280px]'
                    : 'min-h-[380px]'
                }`}
              >
                {/* Top header */}
                <div>
                  <div className="text-[11px] font-bold tracking-tight text-slate-900 border-b border-black pb-1 mb-1">
                    {schoolTitle}
                  </div>

                  {/* Student Title */}
                  <div className="mt-1">
                    <div className="text-sm font-black text-black leading-tight">
                      {st.name}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-800">
                      {st.nickname && <span>น้อง{st.nickname} • </span>}
                      <span>ห้อง {st.classroom}</span>
                      {st.studentCode && <span> (รหัส #{st.studentCode})</span>}
                    </div>
                  </div>
                </div>

                {/* Center QR Code */}
                <div className="my-1 flex flex-col items-center justify-center">
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt="QR Code"
                      className={`mx-auto block ${
                        layout === 'compact'
                          ? 'w-24 h-24'
                          : layout === 'standard'
                          ? 'w-32 h-32'
                          : 'w-44 h-44'
                      }`}
                    />
                  ) : (
                    <div className="w-24 h-24 border border-dashed border-black flex items-center justify-center text-[10px]">
                      QR CODE
                    </div>
                  )}
                  <div className="text-[8px] font-mono text-slate-600 mt-0.5 truncate max-w-full">
                    {portalUrl}
                  </div>
                </div>

                {/* Bottom Footer */}
                <div className="border-t border-slate-400 pt-1 mt-1 text-[9px] text-slate-800 font-medium">
                  {includeInstructions ? (
                    <div>📱 ใช้กล้องมือถือ/LINE สแกนเพื่อดูคะแนนสะสมดาวความดี</div>
                  ) : (
                    <div>⭐ คะแนนดาวความดีสะสม</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

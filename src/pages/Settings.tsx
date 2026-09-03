import React, { useState, useEffect } from 'react';
import { useStudents } from '../context/StudentContext';
import {
  getDesignatedSheetConfig,
  setDesignatedSheet,
  verifyDesignatedSheet,
  createDesignatedSpreadsheet,
  exportToDesignatedSheet,
  DesignatedSheetConfig,
} from '../services/googleSheetsService';
import {
  FileSpreadsheet,
  Cloud,
  Check,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Plus,
  Save,
  Trash2,
  Database,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    students,
    history,
    rewards,
    categories,
    addCategory,
    isCloudSynced,
    isCloudLoading,
    forcePushToCloud,
  } = useStudents();

  // Sheets configuration state
  const [sheetConfig, setSheetConfig] = useState<DesignatedSheetConfig>(getDesignatedSheetConfig);
  const [customSheetInput, setCustomSheetInput] = useState(sheetConfig.spreadsheetId || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Category management
  const [newCategoryInput, setNewCategoryInput] = useState('');

  useEffect(() => {
    setSheetConfig(getDesignatedSheetConfig());
  }, []);

  // Handle saving designated spreadsheet
  const handleSaveDesignatedSheet = async () => {
    if (!customSheetInput.trim()) {
      setDesignatedSheet('');
      setSheetConfig(getDesignatedSheetConfig());
      setFeedback({
        type: 'info',
        text: 'ยกเลิกการกำหนดสเปรดชีตแล้ว (ระบบจะสร้างไฟล์ใหม่ให้อัตโนมัติเมื่อกดซิงก์)',
      });
      return;
    }

    setIsVerifying(true);
    setFeedback(null);

    try {
      const updatedConfig = setDesignatedSheet(customSheetInput);
      if (updatedConfig.spreadsheetId) {
        const verified = await verifyDesignatedSheet(updatedConfig.spreadsheetId);
        const finalConfig = setDesignatedSheet(updatedConfig.spreadsheetId, verified.title);
        setSheetConfig(finalConfig);
        setFeedback({
          type: 'success',
          text: `เชื่อมต่อกับ "${verified.title}" สำเร็จ! พร้อมซิงก์ข้อมูลนักเรียนและประวัติ`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'ไม่สามารถเข้าถึง Google Sheet ที่ระบุได้ กรุณาตรวจสอบ ID หรือสิทธิ์เข้าถึง',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle creating a brand new designated spreadsheet
  const handleCreateNewSheet = async () => {
    setIsCreatingNew(true);
    setFeedback(null);
    try {
      const created = await createDesignatedSpreadsheet();
      const updatedConfig = getDesignatedSheetConfig();
      setSheetConfig(updatedConfig);
      setCustomSheetInput(created.spreadsheetId);
      setFeedback({
        type: 'success',
        text: `สร้าง Google Sheet ใหม่ "${created.title}" บน Google Drive สำเร็จ!`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'ไม่สามารถสร้าง Google Sheet ใหม่ได้',
      });
    } finally {
      setIsCreatingNew(false);
    }
  };

  // Handle 'Sync to Sheets' action
  const handleSyncToSheets = async () => {
    setIsSyncing(true);
    setFeedback(null);

    try {
      const result = await exportToDesignatedSheet(
        students,
        history,
        rewards,
        sheetConfig.spreadsheetId || undefined
      );

      const updated = getDesignatedSheetConfig();
      setSheetConfig(updated);
      if (updated.spreadsheetId) {
        setCustomSheetInput(updated.spreadsheetId);
      }

      setFeedback({
        type: 'success',
        text: `ซิงก์ข้อมูลไป Google Sheets สำเร็จ! (นักเรียน ${result.updatedStudentsCount} คน, ประวัติบันทึก ${result.updatedHistoryCount} รายการ)`,
      });
    } catch (err: any) {
      console.error('Sync Error:', err);
      setFeedback({
        type: 'error',
        text: err.message || 'เกิดข้อผิดพลาดในการส่งออกข้อมูลไปยัง Google Sheet',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) return;
    addCategory(newCategoryInput.trim());
    setNewCategoryInput('');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
          <span>ตั้งค่าระบบ & การเชื่อมต่อ</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Settings
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          จัดการการเชื่อมต่อ Google Sheets API, Google Drive, ฐานข้อมูลคลาวด์ Firebase และหมวดหมู่ความดี
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 text-sm animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30'
              : feedback.type === 'info'
              ? 'bg-blue-500/10 text-blue-200 border border-blue-500/30'
              : 'bg-rose-500/10 text-rose-200 border border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-5 h-5 mt-0.5 text-emerald-400 shrink-0" />
          ) : feedback.type === 'info' ? (
            <HelpCircle className="w-5 h-5 mt-0.5 text-blue-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5 text-rose-400 shrink-0" />
          )}
          <div className="flex-1 font-medium">{feedback.text}</div>
        </div>
      )}

      {/* SECTION 1: GOOGLE SHEETS & DRIVE SERVICE MODULE */}
      <div className="bg-[#150a24]/90 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <span>บริการเชื่อมต่อ Google Sheets & Drive</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Service Module
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ส่งออกสถานะนักเรียนปัจจุบัน (Student State) และบันทึกประวัติการให้ดาว (History Logs) ลงใน Google Sheet ที่กำหนด
              </p>
            </div>
          </div>

          {/* PRIMARY SYNC BUTTON */}
          <button
            type="button"
            id="sync-to-sheets-button"
            onClick={handleSyncToSheets}
            disabled={isSyncing}
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-950/50 hover:scale-102 active:scale-98"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'กำลังส่งออกข้อมูล...' : 'Sync to Sheets (ซิงก์ทันที)'}</span>
          </button>
        </div>

        {/* Current Designated Sheet Info */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>กำหนด Google Sheet ปลายทาง (Designated Google Sheet URL หรือ ID)</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customSheetInput}
                  onChange={(e) => setCustomSheetInput(e.target.value)}
                  placeholder="วางลิงก์ Google Sheets หรือ Spreadsheet ID..."
                  className="flex-1 px-4 py-2.5 text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleSaveDesignatedSheet}
                  disabled={isVerifying}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isVerifying ? 'กำลังตรวจสอบ...' : 'บันทึก & ตรวจสอบ'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewSheet}
                  disabled={isCreatingNew}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 border border-white/10"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isCreatingNew ? 'กำลังสร้าง...' : 'สร้าง Sheet ใหม่'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                * หากปล่อยว่างไว้ เมื่อกดปุ่ม "Sync to Sheets" ระบบจะสร้างสมุดสเปรดชีตใหม่อัตโนมัติบน Google Drive ของคุณ
              </p>
            </div>

            {/* Active Connected Sheet Box */}
            {sheetConfig.spreadsheetId ? (
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-400 block">
                    สเปรดชีตที่กำหนดไว้ในปัจจุบัน:
                  </span>
                  <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-2">
                    <span>{sheetConfig.spreadsheetTitle || 'สมุดสะสมดาวความดี (Star Deeds)'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-md">
                    ID: {sheetConfig.spreadsheetId}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    ซิงก์ล่าสุด:{' '}
                    {sheetConfig.lastSyncedAt
                      ? new Date(sheetConfig.lastSyncedAt).toLocaleString('th-TH')
                      : 'ยังไม่มีการซิงก์ในรอบนี้'}
                  </div>
                </div>

                <a
                  href={sheetConfig.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetConfig.spreadsheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors self-start sm:self-center shadow-md shadow-emerald-950/40"
                >
                  <span>เปิดดูใน Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3 text-slate-400 text-xs">
                <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>ยังไม่ได้ระบุ Spreadsheet ID ปลายทาง (คุณสามารถกด "สร้าง Sheet ใหม่" หรือกด "Sync to Sheets" เพื่อให้ระบบสร้างไฟล์ให้ทันที)</span>
              </div>
            )}
          </div>

          {/* Details of Tabs being exported */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
            <span className="text-xs font-bold text-white block">แผ่นงาน (Tabs) ที่ส่งออกอัตโนมัติ:</span>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <span className="font-bold text-emerald-300 block text-xs">1. สรุปคะแนนนักเรียน (Student State)</span>
                <span className="text-[11px] text-slate-400">
                  รหัสนักเรียน, ชื่อ-สกุล, ชื่อเล่น, ห้องเรียน, คะแนนดาวปัจจุบัน, รางวัลที่แลก
                </span>
              </div>
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <span className="font-bold text-purple-300 block text-xs">2. ประวัติการให้ดาว (History Logs)</span>
                <span className="text-[11px] text-slate-400">
                  วัน-เวลา, ชื่อเด็ก, ห้อง, ดาวที่ได้รับ (+/-), หมวดความดี, หมายเหตุ
                </span>
              </div>
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <span className="font-bold text-amber-300 block text-xs">3. รายการของรางวัล (Rewards)</span>
                <span className="text-[11px] text-slate-400">
                  ชื่อของรางวัล, เกณฑ์ดาวที่ใช้แลก, รายละเอียด
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: FIREBASE FIRESTORE CLOUD DATABASE */}
      <div className="bg-[#150a24]/90 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-white flex items-center gap-2">
                <span>ฐานข้อมูล Firebase Firestore Cloud</span>
                {isCloudSynced && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                )}
              </h2>
              <p className="text-xs text-slate-400">
                ซิงก์ข้อมูลแบบ Real-time ข้ามอุปกรณ์ (โทรศัพท์มือถือ, แท็บเล็ต, สมาร์ตทีวี)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => forcePushToCloud()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 self-start sm:self-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ซิงก์ขึ้น Firebase ทันที</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-slate-400 block text-[11px]">สถานะ Real-time:</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
              <Check className="w-3.5 h-3.5" />
              {isCloudLoading ? 'กำลังเชื่อมต่อ...' : isCloudSynced ? 'ออนไลน์ & เชื่อมต่อแล้ว' : 'โหมดสำรองในเครื่อง'}
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-slate-400 block text-[11px]">จำนวนข้อมูลนักเรียน:</span>
            <span className="font-semibold text-white mt-0.5 block">{students.length} คน</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-slate-400 block text-[11px]">จำนวนประวัติบันทึก:</span>
            <span className="font-semibold text-white mt-0.5 block">{history.length} รายการ</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: CATEGORIES MANAGEMENT */}
      <div className="bg-[#150a24]/90 border border-white/10 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading text-white">
              หมวดหมู่ความดีในห้องเรียน (Good Deeds Categories)
            </h2>
            <p className="text-xs text-slate-400">
              เพิ่มหรือปรับแต่งหมวดหมู่สำหรับให้ดาวสะสมแก่นักเรียน
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <form onSubmit={handleAddCategorySubmit} className="flex gap-2">
            <input
              type="text"
              value={newCategoryInput}
              onChange={(e) => setNewCategoryInput(e.target.value)}
              placeholder="เพิ่มหมวดหมู่ความดีใหม่ (เช่น รักการอ่าน, มีสัมมาคารวะ)..."
              className="flex-1 px-4 py-2.5 text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มหมวดหมู่</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { useStudents } from '../context/StudentContext';
import {
  exportToDesignatedSheet,
  getDesignatedSheetConfig,
  setDesignatedSheet,
  createDesignatedSpreadsheet,
} from '../services/googleSheetsService';
import {
  X,
  Download,
  Upload,
  Copy,
  Check,
  RefreshCw,
  Database,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Share2,
  Cloud,
  ExternalLink,
  Sparkles,
  Wifi,
  WifiOff,
  Plus,
  Save,
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const {
    exportBackupJson,
    importBackupJson,
    resetToSampleData,
    students,
    rewards,
    history,
    isCloudSynced,
    isCloudLoading,
    cloudSyncError,
    roomKey,
    setRoomKey,
    forcePushToCloud,
    forcePullFromCloud,
    importFromSheet,
  } = useStudents();

  const [activeTab, setActiveTab] = useState<'firebase' | 'sheets' | 'export' | 'import' | 'reset'>('firebase');
  const [pastedJson, setPastedJson] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPushingCloud, setIsPushingCloud] = useState(false);
  const [isPullingCloud, setIsPullingCloud] = useState(false);
  const [isImportingSheet, setIsImportingSheet] = useState(false);
  const [roomKeyInput, setRoomKeyInput] = useState(roomKey);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );

  // Sheets state
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [sheetConfig, setSheetConfig] = useState(() => getDesignatedSheetConfig());
  const [customSheetInput, setCustomSheetInput] = useState(sheetConfig.spreadsheetId || '');

  useEffect(() => {
    if (isOpen) {
      const cfg = getDesignatedSheetConfig();
      setSheetConfig(cfg);
      setCustomSheetInput(cfg.spreadsheetId || '');
      setRoomKeyInput(roomKey);
    }
  }, [isOpen, roomKey]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    const jsonStr = exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `star-deeds-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatusMessage({
      type: 'success',
      text: 'ดาวน์โหลดไฟล์สำรองข้อมูล (JSON) สำเร็จเรียบร้อยแล้ว!',
    });
  };

  const handleCopy = () => {
    const jsonStr = exportBackupJson();
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setStatusMessage({
        type: 'success',
        text: 'คัดลอกรหัสข้อมูลสำรองลงคลิปบอร์ดแล้ว นำไปวางในเครื่องอื่นได้เลย',
      });
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importBackupJson(content);
        if (result.success) {
          setStatusMessage({
            type: 'success',
            text: result.message,
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: result.message,
          });
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportPasted = () => {
    if (!pastedJson.trim()) return;
    const result = importBackupJson(pastedJson);
    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: result.message,
      });
      setPastedJson('');
    } else {
      setStatusMessage({
        type: 'error',
        text: result.message,
      });
    }
  };

  const handleReset = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตข้อมูลเป็นชุดตัวอย่างเริ่มต้น?')) {
      resetToSampleData();
      setStatusMessage({
        type: 'success',
        text: 'รีเซ็ตข้อมูลเป็นตัวอย่างเริ่มต้นเรียบร้อยแล้ว และซิงก์ขึ้น Firebase อัตโนมัติ',
      });
    }
  };

  const handleForceCloudSync = async () => {
    setIsPushingCloud(true);
    setStatusMessage(null);
    try {
      const res = await forcePushToCloud();
      setStatusMessage({
        type: res.success ? 'success' : 'error',
        text: res.message || (res.success ? 'อัปเดตและซิงก์ข้อมูลขึ้น Firebase Firestore สำเร็จเรียบร้อย!' : 'เกิดข้อผิดพลาดในการซิงก์ขึ้นคลาวด์'),
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'เกิดข้อผิดพลาดในการซิงก์ขึ้นคลาวด์',
      });
    } finally {
      setIsPushingCloud(false);
    }
  };

  const handleForceCloudPull = async () => {
    setIsPullingCloud(true);
    setStatusMessage(null);
    try {
      const res = await forcePullFromCloud();
      setStatusMessage({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจากคลาวด์',
      });
    } finally {
      setIsPullingCloud(false);
    }
  };

  const handleSaveRoomKey = () => {
    if (!roomKeyInput.trim()) return;
    setRoomKey(roomKeyInput);
    setStatusMessage({
      type: 'success',
      text: `เปลี่ยนรหัสเชื่อมต่อห้องเรียนเป็น "${roomKeyInput.trim()}" และกำลังดึงข้อมูล...`,
    });
  };

  const handleImportFromSheet = async () => {
    setIsImportingSheet(true);
    setStatusMessage(null);
    try {
      const res = await importFromSheet();
      setStatusMessage({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Google Sheets',
      });
    } finally {
      setIsImportingSheet(false);
    }
  };

  const handleSyncToGoogleSheets = async () => {
    setIsSyncingSheet(true);
    setStatusMessage(null);

    try {
      const result = await exportToDesignatedSheet(
        students,
        history,
        rewards,
        customSheetInput.trim() || sheetConfig.spreadsheetId || undefined
      );

      const updated = getDesignatedSheetConfig();
      setSheetConfig(updated);
      setCustomSheetInput(updated.spreadsheetId || '');

      setStatusMessage({
        type: 'success',
        text: `ซิงก์ข้อมูลลง Google Sheets สำเร็จ! (นักเรียน ${result.updatedStudentsCount} คน, ประวัติ ${result.updatedHistoryCount} รายการ)`,
      });
    } catch (err: any) {
      console.error('Google Sheet Sync Error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'ไม่สามารถส่งออกข้อมูลไปยัง Google Sheets ได้',
      });
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const handleSaveModalSheet = () => {
    const updated = setDesignatedSheet(customSheetInput);
    setSheetConfig(updated);
    setStatusMessage({
      type: 'info',
      text: updated.spreadsheetId
        ? `บันทึกการกำหนดสเปรดชีต ID: ${updated.spreadsheetId} เรียบร้อยแล้ว`
        : 'ยกเลิกการกำหนดสเปรดชีต (ระบบจะสร้างไฟล์ใหม่อัตโนมัติ)',
    });
  };

  const handleCreateModalSheet = async () => {
    setIsSyncingSheet(true);
    setStatusMessage(null);
    try {
      const created = await createDesignatedSpreadsheet();
      const updated = getDesignatedSheetConfig();
      setSheetConfig(updated);
      setCustomSheetInput(created.spreadsheetId);
      setStatusMessage({
        type: 'success',
        text: `สร้าง Google Sheet ใหม่ "${created.title}" บน Google Drive เรียบร้อย!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'ไม่สามารถสร้าง Google Sheet ใหม่ได้',
      });
    } finally {
      setIsSyncingSheet(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#150a24] border border-white/10 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl shadow-purple-950/50 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">
                ระบบฐานข้อมูล & การจัดการข้อมูล
              </h3>
              <p className="text-xs text-slate-400">
                Firebase Firestore Real-time, Google Sheets & ไฟล์สำรองข้อมูล
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-white/5 px-4 overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('firebase');
              setStatusMessage(null);
            }}
            className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'firebase'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4 text-amber-400" />
            <span>Firebase คลาวด์</span>
            {isCloudSynced && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('sheets');
              setStatusMessage(null);
            }}
            className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'sheets'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Google Sheets</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setStatusMessage(null);
            }}
            className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'export'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            ดาวน์โหลด JSON
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setStatusMessage(null);
            }}
            className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'import'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            นำเข้าไฟล์
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('reset');
              setStatusMessage(null);
            }}
            className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'reset'
                ? 'border-rose-400 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            รีเซ็ต
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-sm ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : statusMessage.type === 'info'
                  ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
              ) : statusMessage.type === 'info' ? (
                <HelpCircle className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 text-rose-400 shrink-0" />
              )}
              <div className="text-xs sm:text-sm leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          {/* TAB 1: FIREBASE CLOUD */}
          {activeTab === 'firebase' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-900/40 via-purple-950/50 to-[#120524] p-4 rounded-2xl border border-purple-500/30 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-bold text-white text-sm">
                          Firebase Firestore Real-time Database
                        </h4>
                        {isCloudSynced ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                            <Wifi className="w-3 h-3" /> เชื่อมต่อคลาวด์แล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                            <WifiOff className="w-3 h-3" /> โหมด LocalStorage
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        ข้อมูลนักเรียน คะแนนดาว และของรางวัลจะซิงก์อัตโนมัติแบบ Real-time ทุกเครื่อง
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-400 block text-[11px]">สถานะการซิงก์:</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                      {isCloudLoading ? 'กำลังตรวจสอบคลาวด์...' : isCloudSynced ? 'ออนไลน์ & เรียลไทม์' : 'สำรองในเครื่อง'}
                    </span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-400 block text-[11px]">จำนวนนักเรียนในฐานข้อมูล:</span>
                    <span className="font-semibold text-white mt-0.5 block">
                      {students.length} คน ({history.length} รายการบันทึก)
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>รหัสเชื่อมต่อห้องเรียน (Room Sync Key):</span>
                  </label>
                  <span className="text-[10px] text-slate-400">ใส่รหัสเดียวกันในทุกเครื่องเพื่อซิงก์ข้อมูล</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomKeyInput}
                    onChange={(e) => setRoomKeyInput(e.target.value)}
                    placeholder="เช่น main_star_tracker, room_p2_1, school_demo"
                    className="flex-1 px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-xl text-white placeholder:text-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                  <button
                    type="button"
                    onClick={handleSaveRoomKey}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>เปลี่ยนรหัส</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2">
                <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  วิธีซิงก์ข้อมูลเมื่อเปิดในเครื่องใหม่ / โทรศัพท์เครื่องใหม่:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>ตรวจสอบว่ารหัสห้องเรียน (Room Key) ในเครื่องใหม่ตรงกับเครื่องแรก</li>
                  <li>หากข้อมูลยังไม่ขึ้นทันที ให้กดปุ่ม <strong>"ดึงข้อมูลจาก Cloud ทันที"</strong> ด้านล่าง</li>
                  <li>ระบบจะดาวน์โหลดรายชื่อนักเรียน คะแนนดาว และประวัติจากคลาวด์ลงเครื่องทันที</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleForceCloudPull}
                  disabled={isPullingCloud}
                  className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-xs shadow-lg shadow-emerald-950/40 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isPullingCloud ? 'animate-spin' : ''}`} />
                  <span>{isPullingCloud ? 'กำลังดึงข้อมูล...' : '🔄 ดึงข้อมูลจาก Cloud (เครื่องใหม่)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleForceCloudSync}
                  disabled={isPushingCloud}
                  className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-xs shadow-lg shadow-purple-950/40 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isPushingCloud ? 'animate-spin' : ''}`} />
                  <span>{isPushingCloud ? 'กำลังส่งข้อมูล...' : '☁️ ส่งข้อมูลเครื่องนี้ขึ้น Cloud'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE SHEETS */}
          {activeTab === 'sheets' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-950/50 via-[#10241b] to-[#120524] p-4 rounded-2xl border border-emerald-500/30">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-white text-sm">
                      บริการ Google Sheets & Drive Integration
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      ส่งออกสถานะนักเรียนปัจจุบัน (Student State) และบันทึกประวัติการให้ดาว (History Logs) ไปยัง Google Sheet ที่กำหนด
                    </p>
                  </div>
                </div>

                {/* Designated Spreadsheet Config */}
                <div className="mt-3 pt-3 border-t border-emerald-500/20 space-y-2">
                  <label className="block text-[11px] font-semibold text-emerald-300">
                    Google Sheet ปลายทาง (ระบุ Spreadsheet ID หรือลิงก์ Google Sheets):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSheetInput}
                      onChange={(e) => setCustomSheetInput(e.target.value)}
                      placeholder="วางลิงก์ Google Sheets หรือ ID..."
                      className="flex-1 px-3 py-2 text-xs bg-white/10 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={handleSaveModalSheet}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>บันทึก</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateModalSheet}
                      disabled={isSyncingSheet}
                      className="px-3 py-2 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 border border-white/10"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>สร้างใหม่</span>
                    </button>
                  </div>

                  {sheetConfig.spreadsheetId && (
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-300">
                      <span className="truncate">
                        กำหนดไว้: <span className="text-emerald-400 font-mono">{sheetConfig.spreadsheetId}</span>
                      </span>
                      {sheetConfig.spreadsheetUrl && (
                        <a
                          href={sheetConfig.spreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
                        >
                          <span>เปิดดู Sheet</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 text-xs text-slate-300">
                <div className="font-semibold text-white flex items-center justify-between">
                  <span>ข้อมูลที่ระบบส่งออกไปยัง Google Sheet (ครบถ้วนทุกรายละเอียด):</span>
                  <span className="text-[10px] text-emerald-400 font-normal">รวมรูปภาพ & QR Code พอร์ทัล</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 space-y-1">
                    <span className="text-emerald-400 font-bold block">1. สรุปคะแนน & โปรไฟล์</span>
                    <span className="text-slate-400 block text-[10px] leading-relaxed">
                      รูปภาพนักเรียน, QR Code, รหัส, ชื่อ-สกุล, ชื่อเล่น, ห้อง, ดาวสะสม, ลิงก์ Portal, ข้อมูลสำรอง JSON
                    </span>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 space-y-1">
                    <span className="text-amber-400 font-bold block">2. ประวัติการให้ดาว</span>
                    <span className="text-slate-400 block text-[10px] leading-relaxed">
                      วัน-เวลา, ชื่อนักเรียน, ห้อง, จำนวนดาว (+/-), หมวดความดี, บันทึกหมายเหตุ
                    </span>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 space-y-1">
                    <span className="text-teal-400 font-bold block">3. ประวัติการแลกรางวัล</span>
                    <span className="text-slate-400 block text-[10px] leading-relaxed">
                      วันเวลาที่แลก, ชื่อเด็ก, ของรางวัลที่แลก, จำนวนดาวที่ใช้
                    </span>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 space-y-1">
                    <span className="text-purple-400 font-bold block">4. รายการของรางวัล</span>
                    <span className="text-slate-400 block text-[10px] leading-relaxed">
                      ชื่อของรางวัล, ดาวที่ใช้แลก, สถานะ, คำอธิบาย
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  id="modal-sync-to-sheets"
                  onClick={handleSyncToGoogleSheets}
                  disabled={isSyncingSheet}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-xs shadow-lg shadow-emerald-950/40 cursor-pointer"
                >
                  <FileSpreadsheet className={`w-4 h-4 ${isSyncingSheet ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSheet ? 'กำลังส่งออก...' : '📤 ส่งข้อมูลไป Google Sheets'}</span>
                </button>

                <button
                  type="button"
                  id="modal-import-from-sheets"
                  onClick={handleImportFromSheet}
                  disabled={isImportingSheet}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/15 text-emerald-300 border border-emerald-500/30 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isImportingSheet ? 'animate-spin' : ''}`} />
                  <span>{isImportingSheet ? 'กำลังดึงข้อมูล...' : '📥 ดึงข้อมูลจาก Sheet เข้าระบบ'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: EXPORT JSON */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-purple-950/40 p-4 rounded-2xl text-sm text-purple-200 border border-purple-500/20 flex items-start gap-3">
                <Share2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-white">
                    ส่งต่อไฟล์สำรองข้อมูลออฟไลน์
                  </p>
                  <p className="text-xs text-purple-300 mt-1">
                    คุณครูสามารถกด <strong>"ดาวน์โหลดไฟล์ JSON"</strong> หรือกด <strong>"คัดลอกรหัสข้อมูล"</strong> เพื่อเก็บไว้ในเครื่อง ส่งต่อทาง LINE หรือเก็บสำรองไว้แบบออฟไลน์ได้เสมอ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-white/5 p-3 rounded-2xl border border-white/10">
                <div>
                  <span className="text-slate-400">จำนวนนักเรียน:</span>{' '}
                  <span className="font-semibold text-white">{students.length} คน</span>
                </div>
                <div>
                  <span className="text-slate-400">จำนวนรางวัล:</span>{' '}
                  <span className="font-semibold text-white">{rewards.length} รายการ</span>
                </div>
                <div>
                  <span className="text-slate-400">ประวัติบันทึกดาว:</span>{' '}
                  <span className="font-semibold text-white">{history.length} รายการ</span>
                </div>
                <div>
                  <span className="text-slate-400">บันทึกล่าสุด:</span>{' '}
                  <span className="font-semibold text-white">Firebase & เครื่อง</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-2xl font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  ดาวน์โหลดไฟล์ .json
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'คัดลอกเรียบร้อยแล้ว!' : 'คัดลอกรหัสข้อมูล'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: IMPORT JSON */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 p-3 rounded-xl text-xs text-amber-300 border border-amber-500/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  คำเตือน: การนำเข้าข้อมูลจะนำข้อมูลนักเรียน ดาว และประวัติมาบันทึกแทนชุดข้อมูลปัจจุบัน และจะซิงก์ขึ้น Firebase อัตโนมัติ
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  วิธีที่ 1: เลือกไฟล์ .json จากเครื่อง
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-slate-400 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer border border-white/10 rounded-xl p-1 bg-white/5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  วิธีที่ 2: วางรหัสสำรองข้อมูล (JSON String)
                </label>
                <textarea
                  rows={4}
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder="วางข้อความสำรองข้อมูลที่คัดลอกมาจากเครื่องอื่นที่นี่..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/5 text-white placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={handleImportPasted}
                  disabled={!pastedJson.trim()}
                  className="mt-2 w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm shadow-md shadow-purple-950/30"
                >
                  <Upload className="w-4 h-4" />
                  กู้คืนข้อมูลจากรหัสที่วาง
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: RESET */}
          {activeTab === 'reset' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-base">
                  รีเซ็ตเป็นข้อมูลตัวอย่างเริ่มต้น
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  ระบบจะล้างข้อมูลที่คุณสร้างและใส่ข้อมูลตัวอย่างนักเรียน ป.2/1, ป.2/2 และรางวัลจำลอง เพื่อให้ทดลองระบบใหม่ได้ทันที (จะซิงก์ขึ้นคลาวด์ด้วย)
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition-colors text-sm inline-flex items-center gap-2 shadow-lg shadow-rose-950/30"
              >
                <RefreshCw className="w-4 h-4" />
                ยืนยันการรีเซ็ตข้อมูล
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-white/5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            เชื่อมต่อ Firebase & Google Sheets พร้อมใช้งาน
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white font-medium"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

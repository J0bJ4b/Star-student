import React, { useState, useEffect } from 'react';
import { useStudents } from '../context/StudentContext';
import {
  getDesignatedSheetConfig,
  setDesignatedSheet,
  verifyDesignatedSheet,
  createDesignatedSpreadsheet,
  exportToDesignatedSheet,
  DesignatedSheetConfig,
  getEffectiveClientId,
  setCustomClientId,
  getAppsScriptUrl,
  setAppsScriptUrl,
  getSyncMethod,
  setSyncMethod,
  syncViaAppsScript,
  APPS_SCRIPT_TEMPLATE,
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
  Code,
  Copy,
  KeyRound,
  Globe,
  Info,
  ChevronDown,
  ChevronUp,
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

  // Sync Method State
  const [activeSyncMethod, setActiveSyncMethod] = useState<'appsscript' | 'oauth'>(getSyncMethod());
  const [appsScriptInput, setAppsScriptInput] = useState<string>(getAppsScriptUrl());
  const [customClientIdInput, setCustomClientIdInput] = useState<string>(getEffectiveClientId());
  const [copiedScript, setCopiedScript] = useState(false);
  const [showAppsScriptGuide, setShowAppsScriptGuide] = useState(true);
  const [showOAuthGuide, setShowOAuthGuide] = useState(true);

  // Category management
  const [newCategoryInput, setNewCategoryInput] = useState('');

  useEffect(() => {
    setSheetConfig(getDesignatedSheetConfig());
    setActiveSyncMethod(getSyncMethod());
    setAppsScriptInput(getAppsScriptUrl());
    setCustomClientIdInput(getEffectiveClientId());
  }, []);

  const handleSyncMethodChange = (method: 'appsscript' | 'oauth') => {
    setActiveSyncMethod(method);
    setSyncMethod(method);
    setFeedback({
      type: 'info',
      text:
        method === 'appsscript'
          ? 'เปลี่ยนวิธีเชื่อมต่อเป็น: Google Apps Script Webhook (แนะนำที่สุดบน Vercel)'
          : 'เปลี่ยนวิธีเชื่อมต่อเป็น: Google OAuth 2.0 (Google Sheets API)',
    });
  };

  const handleSaveAppsScriptUrl = () => {
    setAppsScriptUrl(appsScriptInput);
    setSyncMethod('appsscript');
    setActiveSyncMethod('appsscript');
    setFeedback({
      type: 'success',
      text: appsScriptInput.trim()
        ? 'บันทึก Google Apps Script Web App URL เรียบร้อยแล้ว! พร้อมกดปุ่ม Sync to Sheets ได้ทันที'
        : 'ยกเลิกการตั้งค่า Google Apps Script Web App URL แล้ว',
    });
  };

  const handleSaveCustomClientId = () => {
    setCustomClientId(customClientIdInput);
    setFeedback({
      type: 'success',
      text: customClientIdInput.trim()
        ? 'บันทึก Google OAuth Client ID เรียบร้อยแล้ว!'
        : 'รีเซ็ต Google OAuth Client ID กลับเป็นค่าเริ่มต้นแล้ว',
    });
  };

  const handleCopyAppsScript = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    }
  };

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

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app';

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
          <span>ตั้งค่าระบบ & การเชื่อมต่อ Google Sheets</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Settings
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          จัดการการเชื่อมต่อ Google Sheets, วิธี Publish ผ่าน Vercel / GitHub, ฐานข้อมูล Firebase และหมวดหมู่ความดี
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

      {/* SPECIAL NOTICE FOR VERCEL & GITHUB DEPLOYMENT */}
      <div className="bg-gradient-to-r from-amber-500/15 via-purple-900/30 to-indigo-950/40 border border-amber-400/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
            <Globe className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>ทำไม Publish ผ่าน Vercel แล้ว Error ไม่สามารถเชื่อมต่อ OAuth ได้?</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Google บังคับใช้ระบบความปลอดภัย <strong className="text-amber-300">Authorized JavaScript origins</strong> คือ
              จะยอมให้ Pop-up ขอสิทธิ์เปิดขึ้นมาได้เฉพาะโดเมนที่ลงทะเบียนไว้ใน Google Cloud Console เท่านั้น เมื่อคุณนำโค้ดไปรันบน Vercel
              (เช่น <code className="text-purple-300 bg-white/5 px-1 py-0.5 rounded">{currentOrigin}</code>)
              Google จึงขึ้นข้อความบล็อกว่า <span className="text-rose-400 font-mono">origin_mismatch</span> หรือ{' '}
              <span className="text-rose-400 font-mono">Not a valid origin for the client ID</span>
            </p>

            <div className="mt-3 p-3 bg-black/30 rounded-xl border border-white/10 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>ทางแก้ที่ง่ายและเร็วที่สุดบน Vercel: <strong>ใช้วิธีที่ 1 (Apps Script Webhook)</strong> ไม่ต้องยุ่งกับ OAuth เลย ใช้งานได้ทันที 100%</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: GOOGLE SHEETS SYNC MODULE WITH 2 METHODS */}
      <div className="bg-[#150a24]/90 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar with quick sync button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <span>เลือกวิธีเชื่อมต่อ Google Sheets</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeSyncMethod === 'appsscript' ? 'วิธี Apps Script Webhook' : 'วิธี Google OAuth 2.0'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                เลือกวิธีที่สะดวกสำหรับคุณเพื่อส่งออกข้อมูลนักเรียนและบันทึกดาวลง Google Sheet
              </p>
            </div>
          </div>

          {/* PRIMARY SYNC BUTTON */}
          <button
            type="button"
            id="sync-to-sheets-button"
            onClick={handleSyncToSheets}
            disabled={isSyncing}
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-950/50 hover:scale-102 active:scale-98 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'กำลังส่งออกข้อมูล...' : 'Sync to Sheets (ซิงก์ทันที)'}</span>
          </button>
        </div>

        {/* METHOD SELECTION TABS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* TAB 1: APPS SCRIPT (RECOMMENDED) */}
          <button
            type="button"
            onClick={() => handleSyncMethodChange('appsscript')}
            className={`p-4 rounded-2xl border text-left transition-all relative ${
              activeSyncMethod === 'appsscript'
                ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/40'
                : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">วิธีที่ 1: Google Apps Script Webhook</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-[10px] rounded-md">
                ★ แนะนำที่สุดบน Vercel
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              ไม่ต้องตั้งค่า OAuth ใน Google Cloud Console ไม่ติดปัญหา Error 100% เพียงแค่คัดลอกโค้ดไปวางใน Google Sheet ของคุณ 1 นาทีเสร็จ
            </p>
          </button>

          {/* TAB 2: GOOGLE OAUTH 2.0 */}
          <button
            type="button"
            onClick={() => handleSyncMethodChange('oauth')}
            className={`p-4 rounded-2xl border text-left transition-all relative ${
              activeSyncMethod === 'oauth'
                ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/40'
                : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-sm text-white">วิธีที่ 2: Google OAuth 2.0 Client ID</span>
              </div>
              <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 font-medium text-[10px] rounded-md">
                สำหรับ Google Cloud
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              เชื่อมต่อโดยตรงผ่าน Google Identity Services เหมาะสำหรับผู้ที่มี Google Cloud Console และได้เพิ่มโดเมน Vercel ใน Authorized origins แล้ว
            </p>
          </button>
        </div>

        {/* METHOD 1 CONTENT: APPS SCRIPT WEB APP CONFIG */}
        {activeSyncMethod === 'appsscript' && (
          <div className="space-y-4 bg-emerald-950/20 border border-emerald-500/30 p-5 rounded-2xl animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                <span>Web App URL ของ Google Apps Script:</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAppsScriptGuide(!showAppsScriptGuide)}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>{showAppsScriptGuide ? 'ซ่อนคู่มือวิธีทำ' : 'แสดงคู่มือวิธีทำ 3 ขั้นตอน'}</span>
                {showAppsScriptGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={appsScriptInput}
                onChange={(e) => setAppsScriptInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-4 py-2.5 text-xs bg-black/40 border border-emerald-500/40 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveAppsScriptUrl}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-md cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึก URL</span>
              </button>
            </div>

            {appsScriptInput && (
              <div className="text-[11px] text-emerald-300 flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>พร้อมใช้งาน: เมื่อกดปุ่ม "Sync to Sheets" ระบบจะยิงข้อมูลเข้า Apps Script นี้ทันทีโดยไม่ต้องผ่าน OAuth</span>
              </div>
            )}

            {/* STEP-BY-STEP INSTRUCTIONS ACCORDION */}
            {showAppsScriptGuide && (
              <div className="mt-4 pt-4 border-t border-emerald-500/20 space-y-3 text-xs">
                <span className="font-bold text-white block">
                  วิธีนำโค้ดไปใส่ใน Google Sheet (ทำครั้งเดียวใช้ได้ตลอดไป):
                </span>

                <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed pl-1">
                  <li>
                    เปิดไฟล์ <strong>Google Sheet</strong> ที่คุณต้องการใช้เก็บข้อมูล
                  </li>
                  <li>
                    ที่เมนูด้านบน กดเมนู <strong>ส่วนขยาย (Extensions)</strong> &gt; <strong>Apps Script</strong>
                  </li>
                  <li>
                    ลบโค้ดเดิมทั้งหมดในหน้านั้น แล้วกดปุ่ม{' '}
                    <button
                      type="button"
                      onClick={handleCopyAppsScript}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold hover:bg-emerald-500/50 transition-colors mx-1"
                    >
                      {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedScript ? 'คัดลอกโค้ดแล้ว!' : 'คัดลอกโค้ด Apps Script'}</span>
                    </button>{' '}
                    แล้วกดวาง (Ctrl+V)
                  </li>
                  <li>
                    กดปุ่ม <strong className="text-white">ทำให้ใช้งานได้ (Deploy)</strong> สีน้ำเงินมุมขวาบน &gt; เลือก{' '}
                    <strong className="text-white">การทำให้ใช้งานได้ใหม่ (New deployment)</strong>
                  </li>
                  <li>
                    กดรูปเฟือง &gt; เลือก <strong className="text-white">เว็บแอป (Web app)</strong>
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5 text-slate-400">
                      <li>คำอธิบาย: ระบบสะสมดาว Star Deeds</li>
                      <li>ดำเนินการในฐานะ: <strong className="text-white">ฉัน (Me)</strong></li>
                      <li>
                        ใครมีสิทธิ์เข้าถึง: <strong className="text-amber-300">ทุกคน (Anyone)</strong> *(สำคัญมาก เพื่อให้ Vercel ส่งข้อมูลได้)*
                      </li>
                    </ul>
                  </li>
                  <li>
                    กดปุ่ม <strong className="text-white">ทำให้ใช้งานได้ (Deploy)</strong> แล้วคัดลอก{' '}
                    <strong className="text-emerald-400">URL ของเว็บแอป (Web app URL)</strong> ที่ได้ นำมาวางในช่องด้านบนนี้แล้วกดบันทึก
                  </li>
                </ol>

                {/* Collapsible Code Preview */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>โค้ด Google Apps Script (พร้อมฟังก์ชันสร้าง 3 แผ่นงานอัตโนมัติ):</span>
                    <button
                      type="button"
                      onClick={handleCopyAppsScript}
                      className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedScript ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ดทั้งหมด'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-black/60 rounded-xl border border-white/10 text-[10px] text-emerald-300 font-mono overflow-x-auto max-h-48 custom-scrollbar">
                    {APPS_SCRIPT_TEMPLATE}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* METHOD 2 CONTENT: GOOGLE OAUTH 2.0 CONFIG */}
        {activeSyncMethod === 'oauth' && (
          <div className="space-y-4 bg-purple-950/20 border border-purple-500/30 p-5 rounded-2xl animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-purple-300 flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                <span>Google OAuth 2.0 Client ID:</span>
              </label>
              <button
                type="button"
                onClick={() => setShowOAuthGuide(!showOAuthGuide)}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>{showOAuthGuide ? 'ซ่อนวิธีแก้ Origin Mismatch' : 'วิธีแก้ Error บน Vercel'}</span>
                {showOAuthGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customClientIdInput}
                onChange={(e) => setCustomClientIdInput(e.target.value)}
                placeholder="xxxx-xxxx.apps.googleusercontent.com"
                className="flex-1 px-4 py-2.5 text-xs bg-black/40 border border-purple-500/40 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveCustomClientId}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-md cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึก Client ID</span>
              </button>
            </div>

            {/* OAUTH VERCEL GUIDE ACCORDION */}
            {showOAuthGuide && (
              <div className="mt-4 pt-4 border-t border-purple-500/20 space-y-3 text-xs">
                <span className="font-bold text-white block">
                  วิธีตั้งค่า Google Cloud Console ให้ไม่ Error บน Vercel:
                </span>

                <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed pl-1">
                  <li>
                    เข้าสู่ <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline font-semibold">Google Cloud Console</a>
                  </li>
                  <li>
                    ไปที่เมนู <strong>APIs &amp; Services</strong> &gt; <strong>Credentials</strong> &gt; เลือก Client ID ชนิด Web Application ของคุณ
                  </li>
                  <li>
                    ในหัวข้อ <strong className="text-amber-300">Authorized JavaScript origins (ต้นทาง JavaScript ที่ได้รับอนุญาต)</strong> ให้กด <strong>+ ADD URI</strong> แล้วใส่:
                    <div className="mt-1 p-2 bg-black/50 border border-purple-500/30 rounded-lg font-mono text-[11px] text-purple-300 flex items-center justify-between">
                      <span>{currentOrigin}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.clipboard) navigator.clipboard.writeText(currentOrigin);
                        }}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        คัดลอก
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      *(และสามารถเพิ่ม http://localhost:5173 หรือ http://localhost:3000 สำหรับเปิดทดสอบในเครื่อง)*
                    </span>
                  </li>
                  <li>
                    กด <strong>SAVE</strong> ด้านล่าง รอประมาณ 2-5 นาทีเพื่อให้ Google อัปเดตการอนุญาตโดเมน
                  </li>
                  <li>
                    นำ Client ID มาใส่ในช่องด้านบน หรือใส่ใน Vercel Environment Variables:
                    <code className="block mt-1 p-1.5 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-emerald-300">
                      VITE_GOOGLE_CLIENT_ID={customClientIdInput || 'your-client-id.apps.googleusercontent.com'}
                    </code>
                  </li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* DESIGNATED SPREADSHEET (APPLIES TO BOTH METHODS) */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>กำหนด Google Sheet ปลายทาง (Spreadsheet URL หรือ ID)</span>
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
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isVerifying ? 'กำลังตรวจสอบ...' : 'บันทึก & ตรวจสอบ'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNewSheet}
                    disabled={isCreatingNew}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 border border-white/10 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isCreatingNew ? 'กำลังสร้าง...' : 'สร้าง Sheet ใหม่ (OAuth)'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  * คุณสามารถนำลิงก์ Google Sheet ใดๆ ที่คุณมีสิทธิ์แก้ไขมาวางที่นี่ได้
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
                  <span className="font-bold text-emerald-300 block text-xs">1. สรุปคะแนนนักเรียน</span>
                  <span className="text-[11px] text-slate-400">
                    รหัสนักเรียน, ชื่อ-สกุล, ชื่อเล่น, ห้อง, ดาวสะสม, รางวัลที่แลก
                  </span>
                </div>
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <span className="font-bold text-purple-300 block text-xs">2. ประวัติการให้ดาว</span>
                  <span className="text-[11px] text-slate-400">
                    วัน-เวลา, ชื่อเด็ก, ห้อง, ดาวที่ได้รับ (+/-), หมวดหมู่, หมายเหตุ
                  </span>
                </div>
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <span className="font-bold text-amber-300 block text-xs">3. รายการของรางวัล</span>
                  <span className="text-[11px] text-slate-400">
                    ชื่อของรางวัล, เกณฑ์ดาวที่ใช้แลก, รายละเอียด
                  </span>
                </div>
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
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 self-start sm:self-center cursor-pointer"
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
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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


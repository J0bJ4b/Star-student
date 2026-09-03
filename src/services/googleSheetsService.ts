import firebaseConfig from '../../firebase-applet-config.json';
import { Student, StarHistoryItem, Reward } from '../types';

export const APPS_SCRIPT_TEMPLATE = `function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result = {
      status: 'success',
      students: [],
      history: [],
      rewards: [],
      sheetUrl: ss.getUrl(),
      timestamp: new Date().toISOString()
    };

    // 1. อ่านข้อมูลแผ่นงาน: สรุปคะแนนนักเรียน
    var studentSheet = ss.getSheetByName('สรุปคะแนนนักเรียน');
    if (studentSheet) {
      var data = studentSheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (!row || row.length < 3) continue;

        // ตรวจสอบว่ามี JSON สำรองฉบับเต็มในคอลัมน์ Q (row[16]) หรือไม่
        var parsedStudent = null;
        if (row[16] && typeof row[16] === 'string' && row[16].indexOf('{') === 0) {
          try {
            parsedStudent = JSON.parse(row[16]);
          } catch(err) {}
        }

        if (parsedStudent && parsedStudent.name) {
          result.students.push(parsedStudent);
        } else if ((row[5] && String(row[5]).trim() !== '') || (row[2] && String(row[2]).trim() !== '')) {
          // หากไม่มี JSON หรืออ่านจากเวอร์ชันเก่า ให้อ่านจากคอลัมน์มาตรฐาน
          var stdId = row[2] ? String(row[2]).trim() : ('std-' + (row[3] || i) + '-' + Math.random().toString(36).substring(2, 6));
          var stdCode = row[3] && row[3] !== '-' ? String(row[3]).trim() : undefined;
          var avatar = row[4] && row[4] !== '-' ? String(row[4]).trim() : undefined;
          var sName = String(row[5] || row[2] || '').trim();
          var nick = row[6] && row[6] !== '-' ? String(row[6]).trim() : undefined;
          var cRoom = String(row[7] || row[4] || 'ป.1/1').trim();
          var sStars = parseFloat(row[8] || row[5]) || 0;

          result.students.push({
            id: stdId,
            studentCode: stdCode,
            avatarUrl: avatar,
            name: sName,
            nickname: nick,
            classroom: cRoom,
            stars: sStars,
            starHistory: [],
            claimedRewards: []
          });
        }
      }
    }

    // 2. อ่านข้อมูลแผ่นงาน: ประวัติการให้ดาว
    var historySheet = ss.getSheetByName('ประวัติการให้ดาว');
    if (historySheet) {
      var hData = historySheet.getDataRange().getValues();
      for (var j = 1; j < hData.length; j++) {
        var hRow = hData[j];
        if ((hRow[3] && String(hRow[3]).trim() !== '') || (hRow[2] && String(hRow[2]).trim() !== '')) {
          var sNameH = String(hRow[3] || hRow[2]).trim();
          var amt = parseFloat(String(hRow[5] || hRow[4]).replace('+', '')) || 1;
          result.history.push({
            id: (hRow[8] && String(hRow[8]).trim()) || ('hist-' + j + '-' + Date.now()),
            studentId: hRow[2] ? String(hRow[2]).trim() : '',
            studentName: sNameH,
            classroom: String(hRow[4] || hRow[3] || '').trim(),
            amount: amt,
            category: String(hRow[6] || hRow[5] || 'ทำความดี'),
            note: (hRow[7] || hRow[6]) && (hRow[7] || hRow[6]) !== '-' ? String(hRow[7] || hRow[6]).trim() : undefined,
            timestamp: new Date().getTime() - (j * 60000)
          });
        }
      }
    }

    // 3. อ่านข้อมูลแผ่นงาน: รายการของรางวัล
    var rewardSheet = ss.getSheetByName('รายการของรางวัล');
    if (rewardSheet) {
      var rData = rewardSheet.getDataRange().getValues();
      for (var k = 1; k < rData.length; k++) {
        var rRow = rData[k];
        if ((rRow[2] && String(rRow[2]).trim() !== '') || (rRow[1] && String(rRow[1]).trim() !== '')) {
          result.rewards.push({
            id: (rRow[1] && String(rRow[1]).trim()) || ('rew-' + k),
            name: String(rRow[2] || rRow[1]).trim(),
            requiredStars: parseFloat(rRow[3] || rRow[2]) || 10,
            description: (rRow[5] || rRow[4]) && (rRow[5] || rRow[4]) !== '-' ? String(rRow[5] || rRow[4]).trim() : ''
          });
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. แผ่นงาน: สรุปคะแนนนักเรียน
    var studentSheet = ss.getSheetByName('สรุปคะแนนนักเรียน') || ss.insertSheet('สรุปคะแนนนักเรียน');
    studentSheet.clear();
    var studentHeaders = [
      'ลำดับ',
      'รูปภาพโปรไฟล์',
      'รหัสระบบ (ID)',
      'รหัสประจำตัว',
      'รูปภาพ (URL/Base64)',
      'ชื่อ - นามสกุล',
      'ชื่อเล่น',
      'ห้องเรียน',
      'ดาวสะสมปัจจุบัน (ดวง)',
      'จำนวนครั้งที่ได้รับดาว',
      'ประวัติดาวที่ได้รับล่าสุด',
      'จำนวนรางวัลที่แลกแล้ว (ชิ้น)',
      'รายการของรางวัลที่เคยแลก',
      'ลิงก์ Student Portal',
      'URL พอร์ทัลนักเรียน',
      'QR Code พอร์ทัล',
      'ข้อมูลสำรองฉบับเต็ม (JSON)',
      'เวลาที่บันทึกล่าสุด'
    ];

    var studentRows = [studentHeaders];
    var baseUrl = (data.portalBaseUrl || '').trim();

    if (data.students && data.students.length > 0) {
      data.students.forEach(function(s, idx) {
        var portalUrl = baseUrl ? (baseUrl + '/portal/' + s.id) : ('/portal/' + s.id);

        var imgFormula = '';
        if (s.avatarUrl && (s.avatarUrl.indexOf('http://') === 0 || s.avatarUrl.indexOf('https://') === 0)) {
          imgFormula = '=IMAGE("' + s.avatarUrl + '")';
        } else {
          var avatarSeed = encodeURIComponent(s.nickname || s.name || ('std-' + (idx + 1)));
          imgFormula = '=IMAGE("https://ui-avatars.com/api/?name=' + avatarSeed + '&background=7c3aed&color=fff&size=128&bold=true")';
        }

        var qrFormula = '=IMAGE("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(portalUrl) + '")';
        var portalLinkFormula = '=HYPERLINK("' + portalUrl + '", "คลิกเปิดพอร์ทัล")';

        var histSummary = (s.starHistory || []).slice(0, 5).map(function(h) {
          var dt = h.timestamp ? Utilities.formatDate(new Date(h.timestamp), 'GMT+7', 'dd/MM/yyyy') : '';
          return (h.amount > 0 ? '+' : '') + h.amount + '★ ' + h.category + (dt ? ' (' + dt + ')' : '');
        }).join('; ') || 'ยังไม่มีประวัติ';

        var rewardSummary = (s.claimedRewards || []).map(function(c) {
          var dt = c.claimedAt ? Utilities.formatDate(new Date(c.claimedAt), 'GMT+7', 'dd/MM/yyyy') : '';
          return c.rewardName + ' (' + c.starsSpent + '★' + (dt ? ' ' + dt : '') + ')';
        }).join('; ') || 'ยังไม่เคยแลก';

        studentRows.push([
          idx + 1,
          imgFormula,
          s.id,
          s.studentCode || '-',
          s.avatarUrl || '-',
          s.name,
          s.nickname || '-',
          s.classroom,
          s.stars,
          s.starHistory ? s.starHistory.length : 0,
          histSummary,
          s.claimedRewards ? s.claimedRewards.length : 0,
          rewardSummary,
          portalLinkFormula,
          portalUrl,
          qrFormula,
          JSON.stringify(s),
          Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy HH:mm:ss')
        ]);
      });
    }

    studentSheet.getRange(1, 1, studentRows.length, studentHeaders.length).setValues(studentRows);
    studentSheet.getRange(1, 1, 1, studentHeaders.length).setBackground('#ede9fe').setFontWeight('bold');
    if (studentRows.length > 1) {
      studentSheet.setRowHeights(2, studentRows.length - 1, 60);
    }
    studentSheet.setColumnWidth(2, 70); // Photo column
    studentSheet.setColumnWidth(16, 70); // QR Code column

    // 2. แผ่นงาน: ประวัติการให้ดาว
    var historySheet = ss.getSheetByName('ประวัติการให้ดาว') || ss.insertSheet('ประวัติการให้ดาว');
    historySheet.clear();
    var historyHeaders = [
      'ลำดับ',
      'วัน-เวลา',
      'รหัสนักเรียน (ID)',
      'ชื่อนักเรียน',
      'ห้องเรียน',
      'จำนวนดาว',
      'หมวดหมู่ความดี',
      'บันทึกเพิ่มเติม',
      'ID รายการ'
    ];
    var historyRows = [historyHeaders];
    if (data.history && data.history.length > 0) {
      data.history.forEach(function(h, idx) {
        historyRows.push([
          idx + 1,
          h.timestamp ? Utilities.formatDate(new Date(h.timestamp), 'GMT+7', 'dd/MM/yyyy HH:mm:ss') : Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy HH:mm:ss'),
          h.studentId || '-',
          h.studentName,
          h.classroom,
          h.amount > 0 ? '+' + h.amount : h.amount,
          h.category,
          h.note || '-',
          h.id || '-'
        ]);
      });
    }
    historySheet.getRange(1, 1, historyRows.length, historyHeaders.length).setValues(historyRows);
    historySheet.getRange(1, 1, 1, historyHeaders.length).setBackground('#fef3c7').setFontWeight('bold');

    // 3. แผ่นงาน: ประวัติการแลกของรางวัล
    var claimSheet = ss.getSheetByName('ประวัติการแลกของรางวัล') || ss.insertSheet('ประวัติการแลกของรางวัล');
    claimSheet.clear();
    var claimHeaders = [
      'ลำดับ',
      'วัน-เวลาที่แลก',
      'รหัสนักเรียน (ID)',
      'ชื่อนักเรียน',
      'ห้องเรียน',
      'ชื่อของรางวัล',
      'ดาวที่ใช้แลก (ดวง)',
      'ID รายการแลก'
    ];
    var claimRows = [claimHeaders];
    var claimIdx = 1;
    if (data.students && data.students.length > 0) {
      data.students.forEach(function(s) {
        if (s.claimedRewards && s.claimedRewards.length > 0) {
          s.claimedRewards.forEach(function(c) {
            claimRows.push([
              claimIdx++,
              c.claimedAt ? Utilities.formatDate(new Date(c.claimedAt), 'GMT+7', 'dd/MM/yyyy HH:mm:ss') : '-',
              s.id,
              s.name,
              s.classroom,
              c.rewardName,
              c.starsSpent,
              c.id || c.rewardId || '-'
            ]);
          });
        }
      });
    }
    if (claimRows.length === 1) {
      claimRows.push(['-', '-', '-', 'ยังไม่มีรายการแลกรางวัล', '-', '-', '-', '-']);
    }
    claimSheet.getRange(1, 1, claimRows.length, claimHeaders.length).setValues(claimRows);
    claimSheet.getRange(1, 1, 1, claimHeaders.length).setBackground('#dcfce7').setFontWeight('bold');

    // 4. แผ่นงาน: รายการของรางวัล
    var rewardSheet = ss.getSheetByName('รายการของรางวัล') || ss.insertSheet('รายการของรางวัล');
    rewardSheet.clear();
    var rewardHeaders = ['ลำดับ', 'ID รางวัล', 'ชื่อของรางวัล', 'ดาวที่ใช้แลก (ดวง)', 'สถานะ', 'คำอธิบาย'];
    var rewardRows = [rewardHeaders];
    if (data.rewards && data.rewards.length > 0) {
      data.rewards.forEach(function(r, idx) {
        rewardRows.push([
          idx + 1,
          r.id || ('rew-' + (idx + 1)),
          r.name,
          r.requiredStars,
          'พร้อมให้แลก',
          r.description || '-'
        ]);
      });
    }
    rewardSheet.getRange(1, 1, rewardRows.length, rewardHeaders.length).setValues(rewardRows);
    rewardSheet.getRange(1, 1, 1, rewardHeaders.length).setBackground('#e0f2fe').setFontWeight('bold');

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'อัปเดตข้อมูลนักเรียนทั้งหมดและรูปภาพสำเร็จ (' + (data.students ? data.students.length : 0) + ' คน)',
      sheetUrl: ss.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

declare global {
  interface Window {
    google?: any;
  }
}

const STORAGE_KEYS = {
  SHEET_ID: 'star_deeds_designated_sheet_id',
  SHEET_URL: 'star_deeds_designated_sheet_url',
  SHEET_TITLE: 'star_deeds_designated_sheet_title',
  LAST_SYNCED_AT: 'star_deeds_designated_sheet_synced_at',
  CUSTOM_CLIENT_ID: 'star_deeds_google_client_id',
  APPS_SCRIPT_URL: 'star_deeds_apps_script_url',
  SYNC_METHOD: 'star_deeds_sync_method', // 'oauth' | 'appsscript'
};

export function getEffectiveClientId(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(STORAGE_KEYS.CUSTOM_CLIENT_ID);
    if (custom && custom.trim()) return custom.trim();
  }
  const envObj = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  if (envObj?.VITE_GOOGLE_CLIENT_ID) {
    return envObj.VITE_GOOGLE_CLIENT_ID;
  }
  return firebaseConfig?.oAuthClientId || '';
}

export function setCustomClientId(id: string): void {
  if (typeof window === 'undefined') return;
  if (!id.trim()) {
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_CLIENT_ID);
  } else {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CLIENT_ID, id.trim());
  }
  // Reset token client to re-init with new client ID
  tokenClient = null;
  accessToken = null;
}

export function getAppsScriptUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEYS.APPS_SCRIPT_URL);
    if (saved && saved.trim()) return saved.trim();
  }
  const envObj = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  if (envObj?.VITE_GOOGLE_APPS_SCRIPT_URL) {
    return envObj.VITE_GOOGLE_APPS_SCRIPT_URL;
  }
  return '';
}

export function setAppsScriptUrl(url: string): void {
  if (typeof window === 'undefined') return;
  if (!url.trim()) {
    localStorage.removeItem(STORAGE_KEYS.APPS_SCRIPT_URL);
  } else {
    localStorage.setItem(STORAGE_KEYS.APPS_SCRIPT_URL, url.trim());
  }
}

export function getSyncMethod(): 'oauth' | 'appsscript' {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEYS.SYNC_METHOD);
    if (saved === 'appsscript' || saved === 'oauth') return saved;
  }
  // If apps script URL exists, prefer appsscript
  if (getAppsScriptUrl()) return 'appsscript';
  return 'oauth';
}

export function setSyncMethod(method: 'oauth' | 'appsscript'): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SYNC_METHOD, method);
  }
}

let tokenClient: any = null;
let accessToken: string | null = null;
let tokenExpiresAt: number = 0;

export interface DesignatedSheetConfig {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetTitle: string | null;
  lastSyncedAt: number | null;
}

export interface SyncToSheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle: string;
  updatedStudentsCount: number;
  updatedHistoryCount: number;
  timestamp: number;
}

function parseGisError(resp: any): Error {
  const err = resp?.error || '';
  const desc = resp?.error_description || resp?.details || '';
  console.error('Google Auth Error:', resp);

  if (
    err.includes('origin_mismatch') ||
    desc.includes('origin') ||
    err.includes('idpiframe_initialization_failed')
  ) {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'โดเมนของคุณ';
    return new Error(
      `เกิดข้อผิดพลาด OAuth (Origin Mismatch): โดเมน "${currentOrigin}" ยังไม่ได้ลงทะเบียนใน Authorized JavaScript origins ของ Google Cloud Console หรือยังไม่ได้ระบุ Client ID บน Vercel กรุณาตั้งค่าตามคำแนะนำในหน้า Settings หรือเลือกใช้วิธี Google Apps Script แทน`
    );
  }

  if (err === 'popup_closed_by_user') {
    return new Error('หน้าต่างยืนยันสิทธิ์ Google ถูกปิดก่อนทำรายการสำเร็จ');
  }

  if (err === 'access_denied') {
    return new Error('การเข้าถึงถูกปฏิเสธ: ไม่ได้รับอนุญาตสิทธิ์เข้าถึง Google Sheets');
  }

  return new Error(desc || err || 'ไม่สามารถเชื่อมต่อ Google OAuth ได้');
}

/**
 * Initializes Google Token Client using Google Identity Services (GIS)
 */
export function initGoogleAuth(onTokenReceived?: (token: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window is not defined'));
    }

    const clientId = getEffectiveClientId();
    if (!clientId) {
      return reject(
        new Error(
          'ไม่พบ Google OAuth Client ID กรุณาระบุในหน้าการตั้งค่า (Settings) หรือตัวแปร VITE_GOOGLE_CLIENT_ID'
        )
      );
    }

    const checkGsi = () => {
      if (window.google?.accounts?.oauth2) {
        try {
          tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: (resp: any) => {
              if (resp.error) {
                reject(parseGisError(resp));
                return;
              }
              accessToken = resp.access_token;
              tokenExpiresAt = Date.now() + (resp.expires_in ? resp.expires_in * 1000 : 3500 * 1000);
              if (onTokenReceived) onTokenReceived(resp.access_token);
              resolve();
            },
          });
          resolve();
        } catch (e: any) {
          reject(parseGisError({ error: e?.message || 'init_failed' }));
        }
      } else {
        setTimeout(checkGsi, 150);
      }
    };

    checkGsi();
  });
}

/**
 * Request access token via GIS popup
 */
export function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (accessToken && Date.now() < tokenExpiresAt) {
      return resolve(accessToken);
    }

    if (!tokenClient) {
      initGoogleAuth()
        .then(() => {
          tokenClient.callback = (resp: any) => {
            if (resp.error) {
              reject(parseGisError(resp));
              return;
            }
            accessToken = resp.access_token;
            tokenExpiresAt = Date.now() + (resp.expires_in ? resp.expires_in * 1000 : 3500 * 1000);
            resolve(resp.access_token);
          };
          tokenClient.requestAccessToken({ prompt: '' });
        })
        .catch(reject);
      return;
    }

    tokenClient.callback = (resp: any) => {
      if (resp.error) {
        reject(parseGisError(resp));
        return;
      }
      accessToken = resp.access_token;
      tokenExpiresAt = Date.now() + (resp.expires_in ? resp.expires_in * 1000 : 3500 * 1000);
      resolve(resp.access_token);
    };

    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export function isGoogleConnected(): boolean {
  return !!accessToken && Date.now() < tokenExpiresAt;
}

/**
 * Parses a spreadsheet ID from either a raw ID or a full Google Sheets URL
 */
export function parseSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Gets currently saved designated sheet config from localStorage
 */
export function getDesignatedSheetConfig(): DesignatedSheetConfig {
  const spreadsheetId = localStorage.getItem(STORAGE_KEYS.SHEET_ID);
  const spreadsheetUrl = localStorage.getItem(STORAGE_KEYS.SHEET_URL);
  const spreadsheetTitle = localStorage.getItem(STORAGE_KEYS.SHEET_TITLE);
  const rawLastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNCED_AT);
  const lastSyncedAt = rawLastSync ? parseInt(rawLastSync, 10) : null;

  return {
    spreadsheetId: spreadsheetId || null,
    spreadsheetUrl: spreadsheetUrl || (spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : null),
    spreadsheetTitle: spreadsheetTitle || null,
    lastSyncedAt: isNaN(lastSyncedAt as number) ? null : lastSyncedAt,
  };
}

/**
 * Sets the designated sheet ID or URL in localStorage
 */
export function setDesignatedSheet(input: string, title?: string): DesignatedSheetConfig {
  const cleanId = parseSpreadsheetId(input);
  if (!cleanId) {
    localStorage.removeItem(STORAGE_KEYS.SHEET_ID);
    localStorage.removeItem(STORAGE_KEYS.SHEET_URL);
    localStorage.removeItem(STORAGE_KEYS.SHEET_TITLE);
    return getDesignatedSheetConfig();
  }

  const url = `https://docs.google.com/spreadsheets/d/${cleanId}/edit`;
  localStorage.setItem(STORAGE_KEYS.SHEET_ID, cleanId);
  localStorage.setItem(STORAGE_KEYS.SHEET_URL, url);
  if (title) {
    localStorage.setItem(STORAGE_KEYS.SHEET_TITLE, title);
  }

  return getDesignatedSheetConfig();
}

/**
 * Verifies access to a designated spreadsheet via Google Sheets API
 */
export async function verifyDesignatedSheet(spreadsheetId: string): Promise<{ title: string; sheets: string[] }> {
  const token = await requestGoogleAccessToken();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถเข้าถึง Google Sheet ที่ระบุได้ กรุณาตรวจสอบ ID หรือสิทธิ์การเข้าถึง');
  }

  const data = await res.json();
  const title = data.properties?.title || 'Google Sheet';
  const sheets = (data.sheets || []).map((s: any) => s.properties?.title).filter(Boolean);

  // Update saved title
  localStorage.setItem(STORAGE_KEYS.SHEET_TITLE, title);

  return { title, sheets };
}

/**
 * Creates a brand new designated spreadsheet on Google Drive/Sheets
 */
export async function createDesignatedSpreadsheet(titlePrefix?: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> {
  const token = await requestGoogleAccessToken();
  const dateStr = new Date().toLocaleDateString('th-TH');
  const title = titlePrefix || `สมุดสะสมดาวความดี (Star Deeds) - ข้อมูลวันที่ ${dateStr}`;

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        { properties: { title: 'สรุปคะแนนนักเรียน' } },
        { properties: { title: 'ประวัติการให้ดาว' } },
        { properties: { title: 'ประวัติการแลกของรางวัล' } },
        { properties: { title: 'รายการของรางวัล' } },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถสร้าง Google Spreadsheet บน Google Drive ได้');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Save to config
  localStorage.setItem(STORAGE_KEYS.SHEET_ID, spreadsheetId);
  localStorage.setItem(STORAGE_KEYS.SHEET_URL, spreadsheetUrl);
  localStorage.setItem(STORAGE_KEYS.SHEET_TITLE, title);

  return { spreadsheetId, spreadsheetUrl, title };
}

/**
 * Ensures designated sheet contains the required sheet tabs
 */
async function ensureSheetTabsExist(token: string, spreadsheetId: string, requiredTabs: string[]): Promise<void> {
  try {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!metaRes.ok) return;

    const data = await metaRes.json();
    const existingTitles: string[] = (data.sheets || []).map((s: any) => s.properties?.title);
    const missing = requiredTabs.filter((t) => !existingTitles.includes(t));

    if (missing.length > 0) {
      const requests = missing.map((tabName) => ({
        addSheet: {
          properties: { title: tabName },
        },
      }));

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });
    }
  } catch (err) {
    console.warn('Tab verification notice:', err);
  }
}

/**
 * Service module: Syncs current state to Google Sheets via Google Apps Script Web App (Bypasses OAuth)
 */
export async function syncViaAppsScript(
  students: Student[],
  history: StarHistoryItem[],
  rewards: Reward[],
  targetUrl?: string
): Promise<SyncToSheetResult> {
  const url = (targetUrl || getAppsScriptUrl()).trim();
  if (!url) {
    throw new Error('กรุณาระบุ Web App URL ของ Google Apps Script ในหน้าการตั้งค่า (Settings)');
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const sortedStudents = [...students].sort((a, b) => b.stars - a.stars);
  const payload = {
    action: 'sync',
    updatedAt: new Date().toISOString(),
    portalBaseUrl: origin,
    students: sortedStudents,
    history,
    rewards,
  };

  let res: Response;
  try {
    // Note: Use text/plain to avoid CORS preflight OPTIONS which Apps Script does not support
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
  } catch (netErr: any) {
    throw new Error(
      `ไม่สามารถเชื่อมต่อไปยัง Apps Script ได้ (${netErr?.message || 'Network Error'}) กรุณาตรวจสอบว่าตั้งค่า Web App เป็น "ทุกคน (Anyone)" แล้วหรือไม่`
    );
  }

  if (!res.ok) {
    throw new Error(`Apps Script ตอบกลับด้วยสถานะผิดพลาด (HTTP ${res.status})`);
  }

  let result: any = {};
  try {
    result = await res.json();
  } catch {
    result = { status: 'success' };
  }

  const now = Date.now();
  const sheetUrl = result.sheetUrl || localStorage.getItem(STORAGE_KEYS.SHEET_URL) || url;
  localStorage.setItem(STORAGE_KEYS.LAST_SYNCED_AT, now.toString());
  if (result.sheetUrl) {
    localStorage.setItem(STORAGE_KEYS.SHEET_URL, result.sheetUrl);
  }

  return {
    spreadsheetId: parseSpreadsheetId(sheetUrl) || 'apps-script-sheet',
    spreadsheetUrl: sheetUrl,
    spreadsheetTitle: 'Google Sheet (Apps Script)',
    updatedStudentsCount: students.length,
    updatedHistoryCount: history.length,
    timestamp: now,
  };
}

/**
 * Service module: Exports current student state and history logs to a designated Google Sheet
 */
export async function exportToDesignatedSheet(
  students: Student[],
  history: StarHistoryItem[],
  rewards: Reward[],
  targetSpreadsheetId?: string
): Promise<SyncToSheetResult> {
  // If user configured Apps Script or chose Apps Script method, use it directly
  const method = getSyncMethod();
  const scriptUrl = getAppsScriptUrl();
  if (method === 'appsscript' && scriptUrl) {
    return syncViaAppsScript(students, history, rewards, scriptUrl);
  }

  const token = await requestGoogleAccessToken();
  const config = getDesignatedSheetConfig();

  let spreadsheetId = targetSpreadsheetId?.trim() || config.spreadsheetId;
  let spreadsheetUrl = '';
  let sheetTitle = config.spreadsheetTitle || 'สมุดสะสมดาวความดี (Star Deeds)';

  // If no designated sheet is set, create a new one automatically
  if (!spreadsheetId) {
    const created = await createDesignatedSpreadsheet();
    spreadsheetId = created.spreadsheetId;
    spreadsheetUrl = created.spreadsheetUrl;
    sheetTitle = created.title;
  } else {
    spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }

  // Ensure necessary tabs exist
  await ensureSheetTabsExist(token, spreadsheetId, [
    'สรุปคะแนนนักเรียน',
    'ประวัติการให้ดาว',
    'ประวัติการแลกของรางวัล',
    'รายการของรางวัล',
  ]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // 1. Prepare Current Student State (All fields, Image Formula, QR Code, Portal links, JSON)
  const studentRows: any[][] = [
    [
      'ลำดับ',
      'รูปภาพโปรไฟล์',
      'รหัสระบบ (ID)',
      'รหัสประจำตัว',
      'รูปภาพ (URL/Base64)',
      'ชื่อ - นามสกุล',
      'ชื่อเล่น',
      'ห้องเรียน',
      'ดาวสะสมปัจจุบัน (ดวง)',
      'จำนวนครั้งที่ได้รับดาว',
      'ประวัติดาวที่ได้รับล่าสุด',
      'จำนวนรางวัลที่แลกแล้ว (ชิ้น)',
      'รายการของรางวัลที่เคยแลก',
      'ลิงก์ Student Portal',
      'URL พอร์ทัลนักเรียน',
      'QR Code พอร์ทัล',
      'ข้อมูลสำรองฉบับเต็ม (JSON)',
      'เวลาที่บันทึกล่าสุด',
    ],
  ];

  const sortedStudents = [...students].sort((a, b) => b.stars - a.stars);
  sortedStudents.forEach((st, idx) => {
    const portalUrl = origin ? `${origin}/portal/${st.id}` : `/portal/${st.id}`;

    let imgFormula = '';
    if (st.avatarUrl && (st.avatarUrl.startsWith('http://') || st.avatarUrl.startsWith('https://'))) {
      imgFormula = `=IMAGE("${st.avatarUrl}")`;
    } else {
      const avatarSeed = encodeURIComponent(st.nickname || st.name || `std-${idx + 1}`);
      imgFormula = `=IMAGE("https://ui-avatars.com/api/?name=${avatarSeed}&background=7c3aed&color=fff&size=128&bold=true")`;
    }

    const qrFormula = `=IMAGE("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(portalUrl)}")`;
    const portalLinkFormula = `=HYPERLINK("${portalUrl}", "คลิกเปิดพอร์ทัล")`;

    const histSummary = (st.starHistory || [])
      .slice(0, 5)
      .map((h) => {
        const dt = h.timestamp ? new Date(h.timestamp).toLocaleDateString('th-TH') : '';
        return `${h.amount > 0 ? '+' : ''}${h.amount}★ ${h.category}${dt ? ` (${dt})` : ''}`;
      })
      .join('; ') || 'ยังไม่มีประวัติ';

    const rewardSummary = (st.claimedRewards || [])
      .map((c) => {
        const dt = c.claimedAt ? new Date(c.claimedAt).toLocaleDateString('th-TH') : '';
        return `${c.rewardName} (${c.starsSpent}★${dt ? ` ${dt}` : ''})`;
      })
      .join('; ') || 'ยังไม่เคยแลก';

    studentRows.push([
      idx + 1,
      imgFormula,
      st.id,
      st.studentCode || '-',
      st.avatarUrl || '-',
      st.name,
      st.nickname || '-',
      st.classroom,
      st.stars,
      st.starHistory?.length || 0,
      histSummary,
      st.claimedRewards?.length || 0,
      rewardSummary,
      portalLinkFormula,
      portalUrl,
      qrFormula,
      JSON.stringify(st),
      new Date().toLocaleString('th-TH'),
    ]);
  });

  // 2. Prepare History Logs
  const historyRows: any[][] = [
    [
      'ลำดับ',
      'วัน-เวลา',
      'รหัสนักเรียน (ID)',
      'ชื่อนักเรียน',
      'ห้องเรียน',
      'จำนวนดาว',
      'หมวดหมู่ความดี',
      'บันทึกเพิ่มเติม',
      'ID รายการ',
    ],
  ];

  history.forEach((h, idx) => {
    historyRows.push([
      idx + 1,
      new Date(h.timestamp).toLocaleString('th-TH'),
      h.studentId || '-',
      h.studentName,
      h.classroom,
      h.amount > 0 ? `+${h.amount}` : `${h.amount}`,
      h.category,
      h.note || '-',
      h.id || '-',
    ]);
  });

  // 3. Prepare Claimed Rewards Logs
  const claimRows: any[][] = [
    [
      'ลำดับ',
      'วัน-เวลาที่แลก',
      'รหัสนักเรียน (ID)',
      'ชื่อนักเรียน',
      'ห้องเรียน',
      'ชื่อของรางวัล',
      'ดาวที่ใช้แลก (ดวง)',
      'ID รายการแลก',
    ],
  ];

  let claimIdx = 1;
  sortedStudents.forEach((s) => {
    if (s.claimedRewards && s.claimedRewards.length > 0) {
      s.claimedRewards.forEach((c) => {
        claimRows.push([
          claimIdx++,
          c.claimedAt ? new Date(c.claimedAt).toLocaleString('th-TH') : '-',
          s.id,
          s.name,
          s.classroom,
          c.rewardName,
          c.starsSpent,
          c.id || c.rewardId || '-',
        ]);
      });
    }
  });

  if (claimRows.length === 1) {
    claimRows.push(['-', '-', '-', 'ยังไม่มีรายการแลกรางวัล', '-', '-', '-', '-']);
  }

  // 4. Prepare Rewards Catalog
  const rewardRows: any[][] = [
    ['ลำดับ', 'ID รางวัล', 'ชื่อของรางวัล', 'ดาวที่ใช้แลก (ดวง)', 'สถานะ', 'คำอธิบาย'],
  ];

  rewards.forEach((r, idx) => {
    rewardRows.push([
      idx + 1,
      r.id || `rew-${idx + 1}`,
      r.name,
      r.requiredStars,
      'พร้อมให้แลก',
      r.description || '-',
    ]);
  });

  // 5. Batch Update to Designated Spreadsheet
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: 'สรุปคะแนนนักเรียน!A1:R',
            values: studentRows,
          },
          {
            range: 'ประวัติการให้ดาว!A1:I',
            values: historyRows,
          },
          {
            range: 'ประวัติการแลกของรางวัล!A1:H',
            values: claimRows,
          },
          {
            range: 'รายการของรางวัล!A1:F',
            values: rewardRows,
          },
        ],
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถส่งออกข้อมูลไปยัง Google Sheet ได้ กรุณาตรวจสอบสิทธิ์การแก้ไข');
  }

  const now = Date.now();
  localStorage.setItem(STORAGE_KEYS.SHEET_ID, spreadsheetId);
  localStorage.setItem(STORAGE_KEYS.SHEET_URL, spreadsheetUrl);
  localStorage.setItem(STORAGE_KEYS.LAST_SYNCED_AT, now.toString());

  return {
    spreadsheetId,
    spreadsheetUrl,
    spreadsheetTitle: sheetTitle,
    updatedStudentsCount: students.length,
    updatedHistoryCount: history.length,
    timestamp: now,
  };
}

export interface SheetImportResult {
  students: Student[];
  history: StarHistoryItem[];
  rewards: Reward[];
  sheetUrl?: string;
  source: 'appsscript' | 'oauth';
}

/**
 * Service module: Imports students and history from Google Apps Script Web App
 */
export async function fetchDataFromAppsScript(customScriptUrl?: string): Promise<SheetImportResult> {
  const url = (customScriptUrl || getAppsScriptUrl())?.trim();
  if (!url) {
    throw new Error('ไม่พบ URL ของ Google Apps Script Web App');
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Apps Script ตอบกลับด้วยสถานะผิดพลาด (HTTP ${res.status})`);
  }

  const data = await res.json();
  if (data.status === 'error') {
    throw new Error(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Google Sheets');
  }

  if (!Array.isArray(data.students) || data.students.length === 0) {
    throw new Error('ไม่พบข้อมูลนักเรียนในแผ่นงาน "สรุปคะแนนนักเรียน" หรือสเปรดชีตยังว่างเปล่า');
  }

  const now = Date.now();
  if (data.sheetUrl) {
    localStorage.setItem(STORAGE_KEYS.SHEET_URL, data.sheetUrl);
  }
  localStorage.setItem(STORAGE_KEYS.LAST_SYNCED_AT, now.toString());

  return {
    students: data.students,
    history: Array.isArray(data.history) ? data.history : [],
    rewards: Array.isArray(data.rewards) && data.rewards.length > 0 ? data.rewards : [],
    sheetUrl: data.sheetUrl,
    source: 'appsscript',
  };
}


import firebaseConfig from '../../firebase-applet-config.json';
import { Student, StarHistoryItem, Reward } from '../types';

const CLIENT_ID = firebaseConfig.oAuthClientId;
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

declare global {
  interface Window {
    google?: any;
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

const STORAGE_KEYS = {
  SHEET_ID: 'star_deeds_designated_sheet_id',
  SHEET_URL: 'star_deeds_designated_sheet_url',
  SHEET_TITLE: 'star_deeds_designated_sheet_title',
  LAST_SYNCED_AT: 'star_deeds_designated_sheet_synced_at',
};

/**
 * Initializes Google Token Client using Google Identity Services (GIS)
 */
export function initGoogleAuth(onTokenReceived?: (token: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window is not defined'));
    }

    const checkGsi = () => {
      if (window.google?.accounts?.oauth2) {
        try {
          tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (resp: any) => {
              if (resp.error) {
                console.error('GIS Error:', resp);
                reject(new Error(resp.error_description || resp.error));
                return;
              }
              accessToken = resp.access_token;
              tokenExpiresAt = Date.now() + (resp.expires_in ? resp.expires_in * 1000 : 3500 * 1000);
              if (onTokenReceived) onTokenReceived(resp.access_token);
              resolve();
            },
          });
          resolve();
        } catch (e) {
          reject(e);
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
              reject(new Error(resp.error_description || resp.error));
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
        reject(new Error(resp.error_description || resp.error));
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
 * Service module: Exports current student state and history logs to a designated Google Sheet
 */
export async function exportToDesignatedSheet(
  students: Student[],
  history: StarHistoryItem[],
  rewards: Reward[],
  targetSpreadsheetId?: string
): Promise<SyncToSheetResult> {
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
  await ensureSheetTabsExist(token, spreadsheetId, ['สรุปคะแนนนักเรียน', 'ประวัติการให้ดาว', 'รายการของรางวัล']);

  // 1. Prepare Current Student State
  const studentRows: any[][] = [
    [
      'ลำดับ',
      'รหัสประจำตัว',
      'ชื่อ - นามสกุล',
      'ชื่อเล่น',
      'ห้องเรียน',
      'ดาวสะสมปัจจุบัน (ดวง)',
      'จำนวนครั้งที่ได้รับดาว',
      'ของรางวัลที่เคยแลก',
      'เวลาที่บันทึกล่าสุด',
    ],
  ];

  const sortedStudents = [...students].sort((a, b) => b.stars - a.stars);
  sortedStudents.forEach((st, idx) => {
    const claimedText = (st.claimedRewards || [])
      .map((c) => `${c.rewardName} (${c.starsSpent}★)`)
      .join(', ');

    studentRows.push([
      idx + 1,
      st.studentCode || '-',
      st.name,
      st.nickname || '-',
      st.classroom,
      st.stars,
      st.starHistory?.length || 0,
      claimedText || 'ยังไม่เคยแลก',
      new Date().toLocaleString('th-TH'),
    ]);
  });

  // 2. Prepare History Logs
  const historyRows: any[][] = [
    ['ลำดับ', 'วัน-เวลา', 'ชื่อนักเรียน', 'ห้องเรียน', 'จำนวนดาว', 'หมวดหมู่ความดี', 'หมายเหตุเพิ่มเติม'],
  ];

  history.forEach((h, idx) => {
    historyRows.push([
      idx + 1,
      new Date(h.timestamp).toLocaleString('th-TH'),
      h.studentName,
      h.classroom,
      h.amount > 0 ? `+${h.amount}` : `${h.amount}`,
      h.category,
      h.note || '-',
    ]);
  });

  // 3. Prepare Rewards State
  const rewardRows: any[][] = [
    ['ลำดับ', 'ชื่อของรางวัล', 'ดาวที่ใช้แลก (ดวง)', 'สถานะ', 'คำอธิบาย'],
  ];

  rewards.forEach((r, idx) => {
    rewardRows.push([
      idx + 1,
      r.name,
      r.requiredStars,
      'พร้อมให้แลก',
      r.description || '-',
    ]);
  });

  // 4. Batch Update to Designated Spreadsheet
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
            range: 'สรุปคะแนนนักเรียน!A1:I',
            values: studentRows,
          },
          {
            range: 'ประวัติการให้ดาว!A1:G',
            values: historyRows,
          },
          {
            range: 'รายการของรางวัล!A1:E',
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

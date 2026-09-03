import { Student, StarHistoryItem, Reward } from '../types';
import {
  requestGoogleAccessToken,
  getSyncMethod,
  getAppsScriptUrl,
  syncViaAppsScript,
  exportToDesignatedSheet,
  getDesignatedSheetConfig,
} from './googleSheetsService';

const DRIVE_BACKUP_STORAGE_KEYS = {
  AUTO_SYNC_ENABLED: 'star_deeds_drive_auto_sync_enabled',
  AUTO_SYNC_INTERVAL: 'star_deeds_drive_auto_sync_interval_mins', // 0 = every change, 5 = 5m, 15 = 15m, 30 = 30m, 60 = 60m
  LAST_DRIVE_BACKUP_TIME: 'star_deeds_last_drive_backup_time',
  LAST_DRIVE_BACKUP_STATUS: 'star_deeds_last_drive_backup_status',
  LAST_DRIVE_FILE_ID: 'star_deeds_last_drive_backup_file_id',
  LAST_DRIVE_FILE_NAME: 'star_deeds_last_drive_backup_file_name',
  LAST_DRIVE_FILE_LINK: 'star_deeds_last_drive_backup_file_link',
  BACKUP_TARGET_MODE: 'star_deeds_drive_backup_mode', // 'sheet' | 'json' | 'both'
};

export interface DriveAutoSyncConfig {
  enabled: boolean;
  intervalMinutes: number; // 0 means on every change, otherwise 5, 15, 30, 60
  backupMode: 'sheet' | 'json' | 'both';
  lastBackupTime: number | null;
  lastBackupStatus: 'success' | 'error' | 'idle' | 'syncing';
  lastError: string | null;
  lastBackupFileName: string | null;
  lastBackupFileLink: string | null;
}

export interface DriveBackupResult {
  success: boolean;
  message: string;
  timestamp: number;
  sheetUrl?: string;
  driveFileUrl?: string;
  fileName?: string;
}

/**
 * Gets the current Drive Auto Sync configuration from localStorage
 */
export function getDriveAutoSyncConfig(): DriveAutoSyncConfig {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      intervalMinutes: 0,
      backupMode: 'both',
      lastBackupTime: null,
      lastBackupStatus: 'idle',
      lastError: null,
      lastBackupFileName: null,
      lastBackupFileLink: null,
    };
  }

  const enabled = localStorage.getItem(DRIVE_BACKUP_STORAGE_KEYS.AUTO_SYNC_ENABLED) === 'true';
  const intervalStr = localStorage.getItem(DRIVE_BACKUP_STORAGE_KEYS.AUTO_SYNC_INTERVAL);
  const intervalMinutes = intervalStr !== null ? parseInt(intervalStr, 10) : 0; // Default: every change (0)
  const modeStr = (localStorage.getItem(DRIVE_BACKUP_STORAGE_KEYS.BACKUP_TARGET_MODE) as 'sheet' | 'json' | 'both') || 'both';
  const lastTimeStr = localStorage.getItem(DRIVE_BACKUP_STORAGE_KEYS.LAST_DRIVE_BACKUP_TIME);
  const lastBackupTime = lastTimeStr ? parseInt(lastTimeStr, 10) : null;
  const lastStatus = (localStorage.getItem(DRIVE_BACKUP_STORAGE_KEYS.LAST_DRIVE_BACKUP_STATUS) as any) || 'idle';
  const lastFileName = localStorage.getItem(DRIVE_BACKUP_STORAGE_KEYS.LAST_DRIVE_FILE_NAME);
  const lastFileLink = localStorage.getItem(DRIVE_BACKUP_STORAGE_KEYS.LAST_DRIVE_FILE_LINK);

  return {
    enabled,
    intervalMinutes: isNaN(intervalMinutes) ? 0 : intervalMinutes,
    backupMode: modeStr,
    lastBackupTime,
    lastBackupStatus: lastStatus,
    lastError: null,
    lastBackupFileName: lastFileName,
    lastBackupFileLink: lastFileLink,
  };
}

/**
 * Updates Drive Auto Sync configuration in localStorage
 */
export function setDriveAutoSyncConfig(config: Partial<DriveAutoSyncConfig>): DriveAutoSyncConfig {
  if (typeof window === 'undefined') return getDriveAutoSyncConfig();

  if (config.enabled !== undefined) {
    localStorage.setItem(DRIVE_BACKUP_STORAGE_KEYS.AUTO_SYNC_ENABLED, String(config.enabled));
  }
  if (config.intervalMinutes !== undefined) {
    localStorage.setItem(DRIVE_BACKUP_STORAGE_KEYS.AUTO_SYNC_INTERVAL, String(config.intervalMinutes));
  }
  if (config.backupMode !== undefined) {
    localStorage.setItem(DRIVE_BACKUP_STORAGE_KEYS.BACKUP_TARGET_MODE, config.backupMode);
  }
  if (config.lastBackupTime !== undefined) {
    if (config.lastBackupTime === null) {
      localStorage.removeItem(DRIVE_BACKUP_STORAGE_KEYS.LAST_DRIVE_BACKUP_TIME);
    } else {
      localStorage.setItem(DRIVE_BACKUP_STORAGE_KEYS.LAST_DRIVE_BACKUP_TIME, String(config.lastBackupTime));
    }
  }
  if (config.lastBackupStatus !== undefined) {
    localStorage.setItem(DRIVE_BACKUP_STORAGE_KEYS.LAST_DRIVE_BACKUP_STATUS, config.lastBackupStatus);
  }
  if (config.lastBackupFileName !== undefined) {
    if (config.lastBackupFileName === null) {
      localStorage.removeItem(DRIVE_BACKUP_STORAGE_KEYS.LAST_DRIVE_FILE_NAME);
    } else {
      localStorage.setItem(DRIVE_BACKUP_STORAGE_KEYS.LAST_DRIVE_FILE_NAME, config.lastBackupFileName);
    }
  }
  if (config.lastBackupFileLink !== undefined) {
    if (config.lastBackupFileLink === null) {
      localStorage.removeItem(DRIVE_BACKUP_STORAGE_KEYS.LAST_DRIVE_FILE_LINK);
    } else {
      localStorage.setItem(DRIVE_BACKUP_STORAGE_KEYS.LAST_DRIVE_FILE_LINK, config.lastBackupFileLink);
    }
  }

  return getDriveAutoSyncConfig();
}

/**
 * Uploads a JSON backup file to Google Drive using multipart upload
 */
export async function uploadJsonBackupToGoogleDrive(
  data: {
    students: Student[];
    history: StarHistoryItem[];
    rewards: Reward[];
    categories: string[];
    exportedAt: string;
  },
  customFileName?: string
): Promise<{ fileId: string; fileName: string; fileUrl: string }> {
  const token = await requestGoogleAccessToken();
  const dateStr = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
  const fileName = customFileName || `Star_Deeds_Backup_${dateStr}.json`;
  const fileContent = JSON.stringify(
    {
      ...data,
      app: 'Star Academy - Star Deeds Student Tracker',
      version: '2.5.0',
      syncedVia: 'Google Drive Auto-Sync',
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: `สำรองข้อมูลคะแนนความดีและประวัตินักเรียน Star Academy อัตโนมัติ ณ วันที่ ${new Date().toLocaleString('th-TH')}`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `ไม่สามารถอัปโหลดไฟล์สำรองข้อมูลไปยัง Google Drive ได้ (HTTP ${res.status})`);
  }

  const result = await res.json();
  const fileId = result.id;
  const fileUrl = result.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

  return {
    fileId,
    fileName: result.name || fileName,
    fileUrl,
  };
}

/**
 * Performs a full auto-sync to Google Drive and/or Google Sheets
 */
export async function performDriveAutoSync(
  students: Student[],
  history: StarHistoryItem[],
  rewards: Reward[],
  categories: string[]
): Promise<DriveBackupResult> {
  const config = getDriveAutoSyncConfig();
  const now = Date.now();
  let sheetUrl = '';
  let driveFileUrl = '';
  let fileName = '';

  try {
    const syncMethod = getSyncMethod();
    const appsScriptUrl = getAppsScriptUrl();

    // 1. Sync to Google Sheets if mode includes sheet or if using Apps Script
    if (config.backupMode === 'sheet' || config.backupMode === 'both') {
      if (syncMethod === 'appsscript' && appsScriptUrl) {
        const sheetRes = await syncViaAppsScript(students, history, rewards, appsScriptUrl);
        sheetUrl = sheetRes.spreadsheetUrl;
      } else {
        const sheetRes = await exportToDesignatedSheet(students, history, rewards);
        sheetUrl = sheetRes.spreadsheetUrl;
      }
    }

    // 2. Upload JSON snapshot to Google Drive if mode includes JSON or both (when OAuth token is available)
    if (config.backupMode === 'json' || config.backupMode === 'both') {
      try {
        const driveRes = await uploadJsonBackupToGoogleDrive({
          students,
          history,
          rewards,
          categories,
          exportedAt: new Date().toISOString(),
        });
        driveFileUrl = driveRes.fileUrl;
        fileName = driveRes.fileName;
      } catch (driveErr: any) {
        // If OAuth wasn't granted for raw Drive files but Sheets succeeded via Apps Script, don't fail completely
        if (sheetUrl) {
          console.warn('Drive raw file backup note (Sheets sync succeeded):', driveErr);
        } else {
          throw driveErr;
        }
      }
    }

    // Update config status
    setDriveAutoSyncConfig({
      lastBackupTime: now,
      lastBackupStatus: 'success',
      lastBackupFileName: fileName || (sheetUrl ? 'Google Spreadsheet' : 'Google Drive Backup'),
      lastBackupFileLink: driveFileUrl || sheetUrl || null,
    });

    return {
      success: true,
      message: `บันทึกข้อมูลไปยัง Google Drive / Sheets เรียบร้อยแล้ว (${students.length} คน, ${history.length} รายการ)`,
      timestamp: now,
      sheetUrl,
      driveFileUrl,
      fileName,
    };
  } catch (err: any) {
    console.error('Drive Auto-Sync failed:', err);
    setDriveAutoSyncConfig({
      lastBackupStatus: 'error',
    });
    return {
      success: false,
      message: err?.message || 'เกิดข้อผิดพลาดในการสำรองข้อมูลไปยัง Google Drive',
      timestamp: now,
    };
  }
}

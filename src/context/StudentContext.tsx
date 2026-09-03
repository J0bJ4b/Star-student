import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Student, Reward, StarHistoryItem, DEFAULT_CATEGORIES } from '../types';
import { triggerStarBurst, triggerBigCelebration, playChime } from '../utils/effects';
import { fetchDataFromAppsScript, getAppsScriptUrl } from '../services/googleSheetsService';

interface StudentContextType {
  students: Student[];
  rewards: Reward[];
  categories: string[];
  history: StarHistoryItem[];
  selectedClassroom: string;
  classrooms: string[];
  isCloudSynced: boolean;
  isCloudLoading: boolean;
  cloudSyncError: string | null;
  lastCloudSyncedAt: number | null;
  roomKey: string;
  setRoomKey: (key: string) => void;
  setSelectedClassroom: (classroom: string) => void;
  addStars: (studentId: string, amount: number, category: string, note?: string, event?: React.MouseEvent) => void;
  addStarsToMultiple: (
    studentIds: string[],
    amount: number,
    category: string,
    note?: string,
    event?: React.MouseEvent
  ) => { success: boolean; count: number; totalStarsAwarded: number };
  deductStars: (studentId: string, amount: number, category?: string, note?: string) => void;
  addStudent: (
    name: string,
    classroom: string,
    extra?: { nickname?: string; studentCode?: string; avatarUrl?: string }
  ) => Student;
  editStudent: (
    id: string,
    name: string,
    classroom: string,
    extra?: { nickname?: string; studentCode?: string; avatarUrl?: string }
  ) => void;
  updateStudentAvatar: (id: string, avatarUrl: string) => void;
  deleteStudent: (id: string) => void;
  addReward: (name: string, requiredStars: number, description: string) => void;
  editReward: (id: string, name: string, requiredStars: number, description: string) => void;
  deleteReward: (id: string) => void;
  claimReward: (studentId: string, rewardId: string) => { success: boolean; message: string };
  addCategory: (category: string) => void;
  clearHistory: () => void;
  exportBackupJson: () => string;
  importBackupJson: (jsonStr: string) => { success: boolean; message: string };
  resetToSampleData: () => void;
  forcePushToCloud: () => Promise<{ success: boolean; message: string }>;
  forcePullFromCloud: () => Promise<{ success: boolean; message: string; count?: number }>;
  importFromSheet: () => Promise<{ success: boolean; message: string; count?: number }>;
}

const STORAGE_KEYS = {
  STUDENTS: 'star_deeds_students_v2',
  REWARDS: 'star_deeds_rewards_v2',
  HISTORY: 'star_deeds_history_v2',
  CATEGORIES: 'star_deeds_categories_v2',
  ROOM_KEY: 'star_deeds_room_key_v2',
  LAST_CLOUD_SYNC: 'star_deeds_last_cloud_sync_at',
};

const INITIAL_REWARDS: Reward[] = [
  {
    id: 'rew-1',
    name: 'สติกเกอร์การ์ตูนสุดน่ารัก',
    requiredStars: 5,
    description: 'แผ่นสติกเกอร์ฮิตลายการ์ตูน สำหรับติดสมุดหรือกล่องดินสอ',
  },
  {
    id: 'rew-2',
    name: 'ดินสอเปลี่ยนไส้ / ยางลบแฟนซี',
    requiredStars: 10,
    description: 'อุปกรณ์เครื่องเขียนลวดลายพิเศษน่ารัก',
  },
  {
    id: 'rew-3',
    name: 'สิทธิ์เลือกที่นั่งในห้อง 1 สัปดาห์',
    requiredStars: 15,
    description: 'สามารถเลือกที่นั่งเรียนที่ชอบได้ 1 สัปดาห์เต็ม',
  },
  {
    id: 'rew-4',
    name: 'คูปองการบ้านลด 1 ข้อ',
    requiredStars: 20,
    description: 'ใช้ยกเว้นการบ้านได้ 1 ข้อในวิชาใดก็ได้',
  },
  {
    id: 'rew-5',
    name: 'มงกุฎหัวหน้าห้อง 1 วัน',
    requiredStars: 25,
    description: 'ได้รับแต่งตั้งเป็นหัวหน้าห้องประจำวัน พร้อมเข็มกลัดเกียรติยศ',
  },
  {
    id: 'rew-6',
    name: 'กล่องของขวัญปริศนา (Mystery Box)',
    requiredStars: 30,
    description: 'สิทธิ์เปิดกล่องของขวัญปริศนาชิ้นใหญ่ที่คุณครูเตรียมไว้',
  },
];

const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1',
    name: 'ด.ช. ธนกร พงษ์ไพศาล',
    nickname: 'บอส',
    studentCode: '101',
    classroom: 'ป.2/1',
    stars: 18,
    starHistory: [
      {
        id: 'h-1-1',
        studentId: 'std-1',
        studentName: 'ด.ช. ธนกร พงษ์ไพศาล',
        classroom: 'ป.2/1',
        timestamp: Date.now() - 3600000 * 2,
        amount: 1,
        category: 'ส่งงานครบ',
        note: 'การบ้านคณิตศาสตร์เสร็จเร็วและถูกต้อง',
      },
      {
        id: 'h-1-2',
        studentId: 'std-1',
        studentName: 'ด.ช. ธนกร พงษ์ไพศาล',
        classroom: 'ป.2/1',
        timestamp: Date.now() - 3600000 * 24,
        amount: 0.5,
        category: 'ตอบคำถามถูก',
      },
    ],
    claimedRewards: [
      {
        rewardId: 'rew-1',
        rewardName: 'สติกเกอร์การ์ตูนสุดน่ารัก',
        starsSpent: 5,
        claimedAt: Date.now() - 86400000 * 3,
      },
    ],
  },
  {
    id: 'std-2',
    name: 'ด.ญ. นลินทิพย์ สุวรรณฉัตร',
    nickname: 'ข้าวหอม',
    studentCode: '102',
    classroom: 'ป.2/1',
    stars: 26,
    starHistory: [
      {
        id: 'h-2-1',
        studentId: 'std-2',
        studentName: 'ด.ญ. นลินทิพย์ สุวรรณฉัตร',
        classroom: 'ป.2/1',
        timestamp: Date.now() - 3600000 * 5,
        amount: 2,
        category: 'ช่วยเหลือผู้อื่น',
        note: 'ช่วยเพื่อนเก็บขยะและกวาดห้องเรียนหลังเลิกเรียน',
      },
    ],
    claimedRewards: [],
  },
  {
    id: 'std-3',
    name: 'ด.ช. ภัทรดนัย วรโชติ',
    nickname: 'ไตเติ้ล',
    studentCode: '103',
    classroom: 'ป.2/1',
    stars: 12,
    starHistory: [],
    claimedRewards: [],
  },
  {
    id: 'std-4',
    name: 'ด.ญ. กัญญาณัฐ พิพัฒนกิจ',
    nickname: 'มายด์',
    studentCode: '104',
    classroom: 'ป.2/1',
    stars: 22,
    starHistory: [],
    claimedRewards: [],
  },
  {
    id: 'std-5',
    name: 'ด.ช. ชนน วงศ์สวัสดิ์',
    nickname: 'กันต์',
    studentCode: '105',
    classroom: 'ป.2/2',
    stars: 15,
    starHistory: [],
    claimedRewards: [],
  },
  {
    id: 'std-6',
    name: 'ด.ญ. ศศิชา วัฒนาชัย',
    nickname: 'ไอซ์',
    studentCode: '106',
    classroom: 'ป.2/2',
    stars: 29,
    starHistory: [],
    claimedRewards: [],
  },
  {
    id: 'std-7',
    name: 'ด.ช. ปวริศร์ ศิริวัฒน์',
    nickname: 'มังกร',
    studentCode: '107',
    classroom: 'ป.2/2',
    stars: 8,
    starHistory: [],
    claimedRewards: [],
  },
  {
    id: 'std-8',
    name: 'ด.ญ. มณฑิรา บุญชู',
    nickname: 'น้ำอุ่น',
    studentCode: '108',
    classroom: 'ป.3/1',
    stars: 24,
    starHistory: [],
    claimedRewards: [],
  },
  {
    id: 'std-9',
    name: 'ด.ช. รชต เตชะไพโรจน์',
    nickname: 'ภูผา',
    studentCode: '109',
    classroom: 'ป.3/1',
    stars: 14,
    starHistory: [],
    claimedRewards: [],
  },
  {
    id: 'std-10',
    name: 'ด.ช. วรเมธ สุขเกษม',
    nickname: 'พีช',
    studentCode: '313',
    classroom: 'ป.1/1',
    stars: 19,
    starHistory: [],
    claimedRewards: [],
  },
];

const INITIAL_HISTORY: StarHistoryItem[] = [
  {
    id: 'hist-1',
    studentId: 'std-4',
    studentName: 'ด.ญ. กัญญาณัฐ พิพัฒนกิจ',
    classroom: 'ป.2/1',
    timestamp: Date.now() - 3600000 * 1,
    amount: 1,
    category: 'ทำการบ้านครบ',
    note: 'เขียนลายมือเรียบร้อยมาก',
  },
  {
    id: 'hist-2',
    studentId: 'std-2',
    studentName: 'ด.ญ. นลินทิพย์ สุวรรณฉัตร',
    classroom: 'ป.2/1',
    timestamp: Date.now() - 3600000 * 2,
    amount: 1,
    category: 'ส่งงานครบ',
  },
  {
    id: 'hist-3',
    studentId: 'std-8',
    studentName: 'ด.ญ. มณฑิรา บุญชู',
    classroom: 'ป.3/1',
    timestamp: Date.now() - 3600000 * 4,
    amount: 1,
    category: 'ทำการบ้านครบ',
  },
  {
    id: 'hist-4',
    studentId: 'std-1',
    studentName: 'ด.ช. ธนกร พงษ์ไพศาล',
    classroom: 'ป.2/1',
    timestamp: Date.now() - 3600000 * 5,
    amount: 0.5,
    category: 'ตอบคำถามถูก',
    note: 'ช่วยตอบโจทย์เลขหน้าชั้น',
  },
  {
    id: 'hist-5',
    studentId: 'std-6',
    studentName: 'ด.ญ. ศศิชา วัฒนาชัย',
    classroom: 'ป.2/2',
    timestamp: Date.now() - 3600000 * 6,
    amount: 0.5,
    category: 'ประพฤติดี',
  },
];

const StudentContext = createContext<StudentContextType | undefined>(undefined);

// Firestore document path
const FIRESTORE_DOC_PATH = {
  collection: 'classrooms',
  docId: 'main_star_tracker',
};

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Room Sync ID (allows multiple classrooms/schools to have separate synced clouds)
  const [roomKey, setRoomKeyState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.ROOM_KEY);
      if (saved && saved.trim()) return saved.trim();
    }
    return 'main_star_tracker';
  });

  const [lastCloudSyncedAt, setLastCloudSyncedAt] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.LAST_CLOUD_SYNC);
      if (saved) return Number(saved);
    }
    return null;
  });

  // Local state initialized from LocalStorage first for instant rendering
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse students from localStorage', e);
      }
    }
    return INITIAL_STUDENTS;
  });

  const [rewards, setRewards] = useState<Reward[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REWARDS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse rewards from localStorage', e);
      }
    }
    return INITIAL_REWARDS;
  });

  const [history, setHistory] = useState<StarHistoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse history from localStorage', e);
      }
    }
    return INITIAL_HISTORY;
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse categories from localStorage', e);
      }
    }
    return [...DEFAULT_CATEGORIES];
  });

  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [isCloudLoading, setIsCloudLoading] = useState(true);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);

  // Ref to prevent initial local overwrites before cloud snapshot arrives
  const isInitializedFromCloudRef = useRef(false);

  const setRoomKey = (newKey: string) => {
    const cleanKey = (newKey.trim() || 'main_star_tracker').replace(/[^a-zA-Z0-9_-]/g, '_');
    setRoomKeyState(cleanKey);
    localStorage.setItem(STORAGE_KEYS.ROOM_KEY, cleanKey);
    setIsCloudLoading(true);
    isInitializedFromCloudRef.current = false;
  };

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewards));
  }, [rewards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  // Real-time listener to Firestore for current roomKey
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    setIsCloudLoading(true);

    try {
      const docRef = doc(db, 'classrooms', roomKey);

      unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          setIsCloudLoading(false);
          const now = Date.now();
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (Array.isArray(data.students)) setStudents(data.students);
            if (Array.isArray(data.rewards)) setRewards(data.rewards);
            if (Array.isArray(data.history)) setHistory(data.history);
            if (Array.isArray(data.categories)) setCategories(data.categories);
            setIsCloudSynced(true);
            setCloudSyncError(null);
            setLastCloudSyncedAt(now);
            localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_SYNC, now.toString());
            isInitializedFromCloudRef.current = true;
          } else {
            // First time this roomKey document is accessed
            isInitializedFromCloudRef.current = true;
            setDoc(
              docRef,
              {
                students,
                rewards,
                history,
                categories,
                roomKey,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            )
              .then(() => {
                setIsCloudSynced(true);
                setCloudSyncError(null);
                setLastCloudSyncedAt(now);
                localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_SYNC, now.toString());
              })
              .catch((err) => {
                console.warn('Initial Firestore push notice:', err);
                setIsCloudSynced(false);
                setCloudSyncError(err?.message || 'ไม่สามารถเชื่อมต่อ Firestore Cloud ได้');
              });
          }
        },
        (error) => {
          console.warn('Firestore subscription notice:', error);
          setIsCloudLoading(false);
          setIsCloudSynced(false);
          setCloudSyncError(error?.message || 'การเชื่อมต่อ Firebase Cloud ขัดข้อง');
        }
      );
    } catch (err: any) {
      console.warn('Firebase init error:', err);
      setIsCloudLoading(false);
      setIsCloudSynced(false);
      setCloudSyncError(err?.message || 'ไม่สามารถเริ่มต้น Firebase SDK ได้');
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [roomKey]);

  // Sync local changes to Firestore helper
  const syncToFirestore = async (
    newStudents: Student[],
    newRewards: Reward[],
    newHistory: StarHistoryItem[],
    newCats: string[]
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const docRef = doc(db, 'classrooms', roomKey);
      await setDoc(
        docRef,
        {
          students: newStudents,
          rewards: newRewards,
          history: newHistory,
          categories: newCats,
          roomKey,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      const now = Date.now();
      setIsCloudSynced(true);
      setCloudSyncError(null);
      setLastCloudSyncedAt(now);
      localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_SYNC, now.toString());
      return { success: true, message: 'ส่งข้อมูลขึ้น Cloud สำเร็จ' };
    } catch (e: any) {
      console.warn('Firestore write notice (local state preserved):', e);
      setIsCloudSynced(false);
      setCloudSyncError(e.message || 'บันทึกลงคลาวด์ไม่สำเร็จ');
      return { success: false, message: e.message || 'ไม่สามารถบันทึกลงคลาวด์ได้' };
    }
  };

  // Force Push: Pushes current device state to Cloud
  const forcePushToCloud = async (): Promise<{ success: boolean; message: string }> => {
    const result = await syncToFirestore(students, rewards, history, categories);
    return result;
  };

  // Force Pull: Reads directly from Firestore Cloud to update this machine
  const forcePullFromCloud = async (): Promise<{ success: boolean; message: string; count?: number }> => {
    try {
      setIsCloudLoading(true);
      const docRef = doc(db, 'classrooms', roomKey);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.students)) setStudents(data.students);
        if (Array.isArray(data.rewards)) setRewards(data.rewards);
        if (Array.isArray(data.history)) setHistory(data.history);
        if (Array.isArray(data.categories)) setCategories(data.categories);

        const now = Date.now();
        setIsCloudSynced(true);
        setCloudSyncError(null);
        setLastCloudSyncedAt(now);
        setIsCloudLoading(false);
        localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_SYNC, now.toString());

        const count = Array.isArray(data.students) ? data.students.length : 0;
        return {
          success: true,
          message: `ดึงข้อมูลจาก Cloud สำเร็จ! (${count} คน, ประวัติ ${data.history?.length || 0} รายการ)`,
          count,
        };
      } else {
        setIsCloudLoading(false);
        return {
          success: false,
          message: `ไม่พบข้อมูลห้อง "${roomKey}" บน Cloud (คุณสามารถกดปุ่ม "ส่งข้อมูลขึ้น Cloud" เพื่อสร้างได้)`,
        };
      }
    } catch (err: any) {
      setIsCloudLoading(false);
      setIsCloudSynced(false);
      setCloudSyncError(err?.message || 'ไม่สามารถดึงข้อมูลจาก Cloud ได้');
      return {
        success: false,
        message: `ดึงข้อมูลจาก Cloud ไม่สำเร็จ: ${err?.message || 'ข้อผิดพลาดเครือข่าย'}`,
      };
    }
  };

  // Import from Google Sheet / Apps Script Webhook
  const importFromSheet = async (): Promise<{ success: boolean; message: string; count?: number }> => {
    try {
      const scriptUrl = getAppsScriptUrl();
      if (!scriptUrl) {
        return {
          success: false,
          message: 'ยังไม่ได้ระบุ Google Apps Script Web App URL ในหน้า Settings',
        };
      }

      const imported = await fetchDataFromAppsScript(scriptUrl);
      if (imported.students.length > 0) {
        setStudents(imported.students);
        if (imported.history.length > 0) setHistory(imported.history);
        if (imported.rewards.length > 0) setRewards(imported.rewards);

        // Sync to cloud as well
        await syncToFirestore(
          imported.students,
          imported.rewards.length > 0 ? imported.rewards : rewards,
          imported.history.length > 0 ? imported.history : history,
          categories
        );

        return {
          success: true,
          message: `ดึงข้อมูลจาก Google Sheets สำเร็จ! (${imported.students.length} คน)`,
          count: imported.students.length,
        };
      } else {
        return { success: false, message: 'ไม่พบรายชื่อนักเรียนใน Google Sheet' };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'ไม่สามารถดึงข้อมูลจาก Google Sheet ได้',
      };
    }
  };

  // Derived classrooms
  const classrooms = Array.from(new Set(students.map((s) => s.classroom))).filter(Boolean).sort();

  // Add stars
  const addStars = (
    studentId: string,
    amount: number,
    category: string,
    note?: string,
    event?: React.MouseEvent
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const now = Date.now();
    const cleanAmount = Math.max(0, amount);
    const newStars = Math.max(0, Number((student.stars + cleanAmount).toFixed(1)));

    // Trigger visual confetti
    if (event) {
      triggerStarBurst({ x: event.clientX, y: event.clientY });
    } else {
      triggerStarBurst();
    }

    const historyItem: StarHistoryItem = {
      id: 'hist-' + now + '-' + Math.random().toString(36).substring(2, 6),
      studentId: student.id,
      studentName: student.name,
      classroom: student.classroom,
      timestamp: now,
      amount: cleanAmount,
      category,
      note: note?.trim(),
    };

    const nextStudents = students.map((s) => {
      if (s.id !== studentId) return s;
      return {
        ...s,
        stars: newStars,
        starHistory: [historyItem, ...(s.starHistory || [])],
      };
    });

    const nextHistory = [historyItem, ...history];

    setStudents(nextStudents);
    setHistory(nextHistory);
    playChime('star');

    // Check milestones
    if (newStars >= 10 && student.stars < 10) {
      triggerBigCelebration();
    } else if (newStars >= 20 && student.stars < 20) {
      triggerBigCelebration();
    } else if (newStars >= 30 && student.stars < 30) {
      triggerBigCelebration();
    }

    // Sync to Firestore
    syncToFirestore(nextStudents, rewards, nextHistory, categories);
  };

  // Add stars to multiple students simultaneously
  const addStarsToMultiple = (
    studentIds: string[],
    amount: number,
    category: string,
    note?: string,
    event?: React.MouseEvent
  ) => {
    if (!studentIds || studentIds.length === 0) {
      return { success: false, count: 0, totalStarsAwarded: 0 };
    }

    const cleanAmount = Math.max(0, amount);
    if (cleanAmount <= 0) {
      return { success: false, count: 0, totalStarsAwarded: 0 };
    }

    const now = Date.now();
    const idSet = new Set(studentIds);
    const newHistoryItems: StarHistoryItem[] = [];
    let milestoneReached = false;

    const nextStudents = students.map((s, idx) => {
      if (!idSet.has(s.id)) return s;

      const newStars = Math.max(0, Number((s.stars + cleanAmount).toFixed(1)));
      const historyItem: StarHistoryItem = {
        id: 'hist-' + now + '-' + idx + '-' + Math.random().toString(36).substring(2, 6),
        studentId: s.id,
        studentName: s.name,
        classroom: s.classroom,
        timestamp: now + idx,
        amount: cleanAmount,
        category,
        note: note?.trim(),
      };
      newHistoryItems.push(historyItem);

      if (
        (newStars >= 10 && s.stars < 10) ||
        (newStars >= 20 && s.stars < 20) ||
        (newStars >= 30 && s.stars < 30)
      ) {
        milestoneReached = true;
      }

      return {
        ...s,
        stars: newStars,
        starHistory: [historyItem, ...(s.starHistory || [])],
      };
    });

    const nextHistory = [...newHistoryItems.reverse(), ...history];

    setStudents(nextStudents);
    setHistory(nextHistory);
    playChime('star');

    if (event) {
      triggerStarBurst({ x: event.clientX, y: event.clientY });
    } else {
      triggerStarBurst();
    }

    if (milestoneReached || studentIds.length >= 3) {
      triggerBigCelebration();
    }

    syncToFirestore(nextStudents, rewards, nextHistory, categories);

    return {
      success: true,
      count: newHistoryItems.length,
      totalStarsAwarded: Number((cleanAmount * newHistoryItems.length).toFixed(1)),
    };
  };

  // Deduct stars
  const deductStars = (
    studentId: string,
    amount: number,
    category = 'ปรับลดคะแนน',
    note?: string
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student || student.stars <= 0) return;

    const now = Date.now();
    const cleanAmount = Math.max(0, amount);
    const newStars = Math.max(0, Number((student.stars - cleanAmount).toFixed(1)));

    const historyItem: StarHistoryItem = {
      id: 'hist-' + now + '-' + Math.random().toString(36).substring(2, 6),
      studentId: student.id,
      studentName: student.name,
      classroom: student.classroom,
      timestamp: now,
      amount: -cleanAmount,
      category,
      note: note?.trim(),
    };

    const nextStudents = students.map((s) => {
      if (s.id !== studentId) return s;
      return {
        ...s,
        stars: newStars,
        starHistory: [historyItem, ...(s.starHistory || [])],
      };
    });

    const nextHistory = [historyItem, ...history];

    setStudents(nextStudents);
    setHistory(nextHistory);
    playChime('unstar');

    syncToFirestore(nextStudents, rewards, nextHistory, categories);
  };

  // Student management
  const addStudent = (
    name: string,
    classroom: string,
    extra?: { nickname?: string; studentCode?: string; avatarUrl?: string }
  ) => {
    const newStudent: Student = {
      id: 'std-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      nickname: extra?.nickname?.trim() || undefined,
      studentCode: extra?.studentCode?.trim() || undefined,
      classroom: classroom.trim() || 'ป.1/1',
      stars: 0,
      avatarUrl: extra?.avatarUrl,
      starHistory: [],
      claimedRewards: [],
    };
    const nextStudents = [...students, newStudent];
    setStudents(nextStudents);
    syncToFirestore(nextStudents, rewards, history, categories);
    return newStudent;
  };

  const editStudent = (
    id: string,
    name: string,
    classroom: string,
    extra?: { nickname?: string; studentCode?: string; avatarUrl?: string }
  ) => {
    const nextStudents = students.map((s) => {
      if (s.id !== id) return s;
      return {
        ...s,
        name: name.trim(),
        nickname: extra?.nickname !== undefined ? extra.nickname.trim() : s.nickname,
        studentCode: extra?.studentCode !== undefined ? extra.studentCode.trim() : s.studentCode,
        classroom: classroom.trim(),
        avatarUrl: extra?.avatarUrl !== undefined ? extra.avatarUrl : s.avatarUrl,
      };
    });
    setStudents(nextStudents);
    syncToFirestore(nextStudents, rewards, history, categories);
  };

  const updateStudentAvatar = (id: string, avatarUrl: string) => {
    const nextStudents = students.map((s) => {
      if (s.id !== id) return s;
      return {
        ...s,
        avatarUrl,
      };
    });
    setStudents(nextStudents);
    syncToFirestore(nextStudents, rewards, history, categories);
  };

  const deleteStudent = (id: string) => {
    const nextStudents = students.filter((s) => s.id !== id);
    setStudents(nextStudents);
    syncToFirestore(nextStudents, rewards, history, categories);
  };

  // Reward management
  const addReward = (name: string, requiredStars: number, description: string) => {
    const newReward: Reward = {
      id: 'rew-' + Date.now(),
      name: name.trim(),
      requiredStars: Math.max(1, requiredStars),
      description: description.trim(),
    };
    const nextRewards = [...rewards, newReward].sort((a, b) => a.requiredStars - b.requiredStars);
    setRewards(nextRewards);
    syncToFirestore(students, nextRewards, history, categories);
  };

  const editReward = (id: string, name: string, requiredStars: number, description: string) => {
    const nextRewards = rewards
      .map((r) => (r.id === id ? { ...r, name: name.trim(), requiredStars, description: description.trim() } : r))
      .sort((a, b) => a.requiredStars - b.requiredStars);
    setRewards(nextRewards);
    syncToFirestore(students, nextRewards, history, categories);
  };

  const deleteReward = (id: string) => {
    const nextRewards = rewards.filter((r) => r.id !== id);
    setRewards(nextRewards);
    syncToFirestore(students, nextRewards, history, categories);
  };

  // Claim reward
  const claimReward = (studentId: string, rewardId: string) => {
    const student = students.find((s) => s.id === studentId);
    const reward = rewards.find((r) => r.id === rewardId);

    if (!student || !reward) {
      return { success: false, message: 'ไม่พบข้อมูลนักเรียนหรือของรางวัล' };
    }

    if (student.stars < reward.requiredStars) {
      return {
        success: false,
        message: `ดาวไม่เพียงพอ (ต้องการ ${reward.requiredStars} ดาว แต่มีเพียง ${student.stars} ดาว)`,
      };
    }

    const now = Date.now();
    const newStars = Number((student.stars - reward.requiredStars).toFixed(1));

    const claimRecord = {
      rewardId: reward.id,
      rewardName: reward.name,
      starsSpent: reward.requiredStars,
      claimedAt: now,
    };

    const historyItem: StarHistoryItem = {
      id: 'hist-' + now + '-' + Math.random().toString(36).substring(2, 6),
      studentId: student.id,
      studentName: student.name,
      classroom: student.classroom,
      timestamp: now,
      amount: -reward.requiredStars,
      category: 'แลกของรางวัล',
      note: `แลกรับ "${reward.name}" สำเร็จ`,
    };

    const nextStudents = students.map((s) => {
      if (s.id !== studentId) return s;
      return {
        ...s,
        stars: newStars,
        claimedRewards: [claimRecord, ...(s.claimedRewards || [])],
        starHistory: [historyItem, ...(s.starHistory || [])],
      };
    });

    const nextHistory = [historyItem, ...history];

    setStudents(nextStudents);
    setHistory(nextHistory);
    playChime('reward');
    triggerBigCelebration();

    syncToFirestore(nextStudents, rewards, nextHistory, categories);

    return {
      success: true,
      message: `แลกรางวัล "${reward.name}" สำเร็จ! (หักดาว ${reward.requiredStars} ดวง)`,
    };
  };

  // Category management
  const addCategory = (cat: string) => {
    const trimmed = cat.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    const nextCats = [...categories, trimmed];
    setCategories(nextCats);
    syncToFirestore(students, rewards, history, nextCats);
  };

  const clearHistory = () => {
    setHistory([]);
    syncToFirestore(students, rewards, [], categories);
  };

  // Backup & Restore
  const exportBackupJson = () => {
    const data = {
      appName: 'Star Deeds (สมุดสะสมดาวความดี)',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      roomKey,
      totalStudents: students.length,
      totalHistory: history.length,
      totalRewards: rewards.length,
      students,
      rewards,
      history,
      categories,
    };
    return JSON.stringify(data, null, 2);
  };

  const importBackupJson = (jsonStr: string) => {
    try {
      if (!jsonStr || !jsonStr.trim()) {
        return { success: false, message: 'กรุณาระบุข้อมูล JSON หรือเลือกไฟล์สำรองข้อมูล' };
      }

      const data = JSON.parse(jsonStr.trim());
      let parsedStudents: Student[] = [];
      let parsedRewards: Reward[] | undefined = undefined;
      let parsedHistory: StarHistoryItem[] | undefined = undefined;
      let parsedCategories: string[] | undefined = undefined;

      if (Array.isArray(data)) {
        // Direct student array
        parsedStudents = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.students)) {
          parsedStudents = data.students;
        }
        if (Array.isArray(data.rewards)) {
          parsedRewards = data.rewards;
        }
        if (Array.isArray(data.history)) {
          parsedHistory = data.history;
        }
        if (Array.isArray(data.categories)) {
          parsedCategories = data.categories;
        }
      }

      if (!parsedStudents || parsedStudents.length === 0) {
        return { success: false, message: 'ไฟล์ข้อมูลไม่ถูกต้อง: ไม่พบรายชื่อนักเรียนในโครงสร้างข้อมูล' };
      }

      // Validate & clean student objects
      const cleanedStudents: Student[] = parsedStudents.map((s, idx) => ({
        id: s.id || `std-${idx + 1}-${Date.now().toString(36)}`,
        name: String(s.name || `นักเรียน ${idx + 1}`).trim(),
        nickname: s.nickname ? String(s.nickname).trim() : undefined,
        studentCode: s.studentCode ? String(s.studentCode).trim() : undefined,
        classroom: String(s.classroom || 'ป.1/1').trim(),
        avatarUrl: s.avatarUrl ? String(s.avatarUrl).trim() : undefined,
        stars: typeof s.stars === 'number' ? s.stars : parseFloat(s.stars) || 0,
        starHistory: Array.isArray(s.starHistory) ? s.starHistory : [],
        claimedRewards: Array.isArray(s.claimedRewards) ? s.claimedRewards : [],
      }));

      const finalRewards = parsedRewards && parsedRewards.length > 0 ? parsedRewards : rewards;
      const finalHistory = parsedHistory ? parsedHistory : history;
      const finalCategories = parsedCategories && parsedCategories.length > 0 ? parsedCategories : categories;

      setStudents(cleanedStudents);
      if (parsedRewards && parsedRewards.length > 0) setRewards(finalRewards);
      if (parsedHistory) setHistory(finalHistory);
      if (parsedCategories && parsedCategories.length > 0) setCategories(finalCategories);

      syncToFirestore(cleanedStudents, finalRewards, finalHistory, finalCategories);

      return {
        success: true,
        message: `นำเข้าข้อมูลและกู้คืนสำเร็จเรียบร้อย! (นักเรียน ${cleanedStudents.length} คน, รางวัล ${finalRewards.length} รายการ, ประวัติ ${finalHistory.length} รายการ)`,
      };
    } catch (err: any) {
      return { success: false, message: `ไม่สามารถอ่านไฟล์ JSON ได้: ${err?.message || 'รูปแบบไม่ถูกต้อง'}` };
    }
  };

  const resetToSampleData = () => {
    setStudents(INITIAL_STUDENTS);
    setRewards(INITIAL_REWARDS);
    setHistory(INITIAL_HISTORY);
    setCategories([...DEFAULT_CATEGORIES]);
    syncToFirestore(INITIAL_STUDENTS, INITIAL_REWARDS, INITIAL_HISTORY, [...DEFAULT_CATEGORIES]);
  };

  return (
    <StudentContext.Provider
      value={{
        students,
        rewards,
        categories,
        history,
        selectedClassroom,
        classrooms,
        isCloudSynced,
        isCloudLoading,
        cloudSyncError,
        lastCloudSyncedAt,
        roomKey,
        setRoomKey,
        setSelectedClassroom,
        addStars,
        addStarsToMultiple,
        deductStars,
        addStudent,
        editStudent,
        updateStudentAvatar,
        deleteStudent,
        addReward,
        editReward,
        deleteReward,
        claimReward,
        addCategory,
        clearHistory,
        exportBackupJson,
        importBackupJson,
        resetToSampleData,
        forcePushToCloud,
        forcePullFromCloud,
        importFromSheet,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudents = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudents must be used within a StudentProvider');
  }
  return context;
};

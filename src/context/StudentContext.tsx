import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Student, Reward, StarHistoryItem, DEFAULT_CATEGORIES } from '../types';
import { triggerStarBurst, triggerBigCelebration, playChime } from '../utils/effects';

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
  setSelectedClassroom: (classroom: string) => void;
  addStars: (studentId: string, amount: number, category: string, note?: string, event?: React.MouseEvent) => void;
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
  forcePushToCloud: () => Promise<void>;
}

const STORAGE_KEYS = {
  STUDENTS: 'star_deeds_students_v2',
  REWARDS: 'star_deeds_rewards_v2',
  HISTORY: 'star_deeds_history_v2',
  CATEGORIES: 'star_deeds_categories_v2',
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

  // Real-time listener to Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      const docRef = doc(db, FIRESTORE_DOC_PATH.collection, FIRESTORE_DOC_PATH.docId);

      unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          setIsCloudLoading(false);
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (Array.isArray(data.students)) setStudents(data.students);
            if (Array.isArray(data.rewards)) setRewards(data.rewards);
            if (Array.isArray(data.history)) setHistory(data.history);
            if (Array.isArray(data.categories)) setCategories(data.categories);
            setIsCloudSynced(true);
            setCloudSyncError(null);
          } else {
            // First time: initialize Firestore with existing local data
            setDoc(
              docRef,
              {
                students,
                rewards,
                history,
                categories,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            )
              .then(() => {
                setIsCloudSynced(true);
                setCloudSyncError(null);
              })
              .catch((err) => {
                console.warn('Initial Firestore push notice:', err);
                // Fallback to local storage
                setIsCloudSynced(false);
              });
          }
        },
        (error) => {
          console.warn('Firestore subscription notice:', error);
          setIsCloudLoading(false);
          setIsCloudSynced(false);
          setCloudSyncError(error.message);
        }
      );
    } catch (err) {
      console.warn('Firebase init error:', err);
      setIsCloudLoading(false);
      setIsCloudSynced(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sync local changes to Firestore helper
  const syncToFirestore = async (newStudents: Student[], newRewards: Reward[], newHistory: StarHistoryItem[], newCats: string[]) => {
    try {
      const docRef = doc(db, FIRESTORE_DOC_PATH.collection, FIRESTORE_DOC_PATH.docId);
      await setDoc(
        docRef,
        {
          students: newStudents,
          rewards: newRewards,
          history: newHistory,
          categories: newCats,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setIsCloudSynced(true);
      setCloudSyncError(null);
    } catch (e: any) {
      console.warn('Firestore write notice (local state preserved):', e);
      setIsCloudSynced(false);
      setCloudSyncError(e.message || 'บันทึกลงคลาวด์ไม่สำเร็จ');
    }
  };

  const forcePushToCloud = async () => {
    await syncToFirestore(students, rewards, history, categories);
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
      version: '2.0',
      exportedAt: new Date().toISOString(),
      students,
      rewards,
      history,
      categories,
    };
    return JSON.stringify(data, null, 2);
  };

  const importBackupJson = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.students || !Array.isArray(data.students)) {
        return { success: false, message: 'ไฟล์ข้อมูลไม่ถูกต้อง (ไม่พบรายชื่อนักเรียน)' };
      }

      setStudents(data.students);
      if (Array.isArray(data.rewards)) setRewards(data.rewards);
      if (Array.isArray(data.history)) setHistory(data.history);
      if (Array.isArray(data.categories)) setCategories(data.categories);

      syncToFirestore(
        data.students,
        Array.isArray(data.rewards) ? data.rewards : rewards,
        Array.isArray(data.history) ? data.history : history,
        Array.isArray(data.categories) ? data.categories : categories
      );

      return { success: true, message: `นำเข้าข้อมูลสำเร็จ (${data.students.length} คน)` };
    } catch (err) {
      return { success: false, message: 'ไม่สามารถอ่านไฟล์ JSON ได้: รูปแบบผิดพลาด' };
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
        setSelectedClassroom,
        addStars,
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

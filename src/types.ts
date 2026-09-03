export interface StarHistoryItem {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  timestamp: number;
  amount: number; // +1, +0.5, -0.5, -1
  category: string;
  note?: string;
}

export interface Student {
  id: string;
  name: string;
  nickname?: string;
  studentCode?: string;
  classroom: string;
  stars: number;
  avatarUrl?: string;
  starHistory: {
    id?: string;
    studentId?: string;
    studentName?: string;
    classroom?: string;
    timestamp: number;
    amount: number;
    category: string;
    note?: string;
  }[];
  claimedRewards: {
    id?: string;
    rewardId: string;
    rewardName: string;
    starsSpent: number;
    claimedAt: number;
  }[];
}

export interface Reward {
  id: string;
  name: string;
  requiredStars: number;
  description: string;
  icon?: string;
}

export const DEFAULT_CATEGORIES = [
  'ส่งงานครบ',
  'ประพฤติดี',
  'ช่วยเหลือเพื่อน',
  'ตอบคำถามถูก',
  'ทำการบ้านครบ',
  'มีน้ำใจและจิตสาธารณะ',
  'เข้าเรียนตรงเวลา',
] as const;

export type StarCategory = typeof DEFAULT_CATEGORIES[number] | string;

# 🌟 ระบบเก็บคะแนนความดี (Star Deeds)

เว็บแอปพลิเคชันจัดการคะแนนความดีสำหรับนักเรียนในห้องเรียน พร้อมระบบสะสมดาว แลกของรางวัล สรุปอันดับคะแนน (Leaderboard) และ Student Portal

---

## 🚀 การนำขึ้นใช้งานบน GitHub และ Vercel (Deployment Guide)

### 1. นำขึ้น GitHub (Push to GitHub)
```bash
git init
git add .
git commit -m "Initial commit - Star Deeds classroom reward system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/star-deeds.git
git push -u origin main
```

---

### 2. นำขึ้น Vercel (Deploy on Vercel)

1. เข้าเว็บไซต์ [Vercel](https://vercel.com) แล้วกด **Add New...** > **Project**
2. เลือก Import คลังข้อมูล GitHub ที่คุณเพิ่ง Push ขึ้นไป
3. ตั้งค่า **Framework Preset**: เลือก `Vite`
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. (ถ้ามี) ตั้งค่า **Environment Variables** (ดูรายละเอียดด้านล่าง)
7. กด **Deploy**

---

## 📊 การเชื่อมต่อ Google Sheets บน Vercel

เมื่อนำแอปไปรันบน Vercel มี 2 วิธีให้เลือกในการเชื่อมต่อ Google Sheets:

### 🌟 วิธีที่ 1: Google Apps Script Webhook (แนะนำที่สุดสำหรับ Vercel — ใช้ง่าย 100%)
ไม่ต้องตั้งค่า Google Cloud Console และไม่ติดปัญหาเรื่อง Domain / Origin Error:

1. เปิดไฟล์ Google Sheet ของคุณ
2. เมนูด้านบนเลือก **ส่วนขยาย (Extensions)** > **Apps Script**
3. ลบโค้ดเดิมทั้งหมด แล้วนำโค้ด Apps Script (ดูได้ในหน้า **Settings** ของเว็บแอป) ไปวาง
4. กด **ทำให้ใช้งานได้ (Deploy)** > **การทำให้ใช้งานได้ใหม่ (New deployment)**
   - ชนิด: **เว็บแอป (Web app)**
   - ดำเนินการในฐานะ: **ฉัน (Me)**
   - ใครมีสิทธิ์เข้าถึง: **ทุกคน (Anyone)** *(สำคัญมาก)*
5. คัดลอก **Web App URL** มาใส่ในหน้า Settings ของแอป หรือใส่ใน Vercel Environment Variables:
   ```env
   VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
   ```

---

### 🔑 วิธีที่ 2: Google OAuth 2.0 Client ID (สำหรับ Google Cloud Console)
หากต้องการใช้ปุ่ม Pop-up ขอสิทธิ์ Google โดยตรง:

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **Credentials**
2. แก้ไข OAuth 2.0 Client ID ชนิด **Web application**
3. ในส่วน **Authorized JavaScript origins** กด **+ ADD URI** แล้วใส่ URL ของ Vercel (เช่น `https://your-app.vercel.app`)
4. บันทึก Client ID ในหน้า Settings หรือระบุใน Vercel Environment Variables:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

---

## 🛠️ คำสั่งสำหรับนักพัฒนา (Development)

```bash
# ติดตั้ง dependencies
npm install

# รัน Development Server
npm run dev

# ตรวจสอบ TypeScript Linting
npm run lint

# ทดสอบ Build สำหรับ Production
npm run build
```

---

## 📁 โครงสร้างโปรเจกต์ (Project Architecture)

- `src/pages/` - หน้าหลัก (Dashboard, Students, Leaderboard, Rewards, History, Settings, StudentPortal)
- `src/components/` - คอมโพเนนต์ต่างๆ เช่น Navigation, StarModals, BackupModal, ParticleEffects
- `src/context/` - State Management จัดการนักเรียน, ประวัติ, ของรางวัล, และ Firebase Real-time Listener
- `src/services/` - Google Sheets & Google Drive Integration Services
- `vercel.json` - Single Page Application rewrite config สำหรับ Vercel Routing

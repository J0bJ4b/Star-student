import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useStudents } from '../context/StudentContext';
import {
  LayoutDashboard,
  Sparkles,
  Users,
  Trophy,
  Gift,
  Award,
  History,
  Database,
  Menu,
  X,
  School,
  Cloud,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';
import { BackupModal } from './BackupModal';

export const Navbar: React.FC = () => {
  const [location] = useLocation();
  const { selectedClassroom, setSelectedClassroom, classrooms, isCloudSynced } = useStudents();
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'หน้าหลัก', icon: LayoutDashboard },
    { href: '/add-star', label: 'เพิ่มดาว', icon: Sparkles },
    { href: '/students', label: 'จัดการนักเรียน', icon: Users },
    { href: '/leaderboard', label: 'อันดับความดี', icon: Trophy },
    { href: '/portal', label: 'นักเรียนดูคะแนน', icon: Award },
    { href: '/rewards', label: 'ของรางวัล', icon: Gift },
    { href: '/history', label: 'ประวัติการให้ดาว', icon: History },
    { href: '/settings', label: 'ตั้งค่า & ซิงก์', icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#150a24]/90 backdrop-blur-md border-b border-white/10 shadow-lg shadow-purple-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.3)] group-hover:scale-105 transition-transform">
                <span className="text-xl">✨</span>
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-lg text-white tracking-tight leading-none group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                  Star Academy
                </span>
                <span className="text-[10px] text-purple-400/90 font-medium tracking-wider uppercase mt-0.5">
                  Teacher Dashboard
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/' ? location === '/' : location.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-purple-600/25 text-purple-300 font-semibold border border-purple-500/40 shadow-[0_0_12px_rgba(147,51,234,0.2)]'
                        : 'text-slate-400 hover:text-purple-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-purple-300 stroke-[2.2]' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side controls: Classroom filter & Backup button */}
            <div className="hidden sm:flex items-center gap-2.5">
              {/* Classroom Dropdown */}
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                <School className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-slate-500 text-[11px]">ห้อง:</span>
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="bg-transparent border-0 font-medium focus:ring-0 focus:outline-none cursor-pointer pr-1 text-xs text-white [&>option]:bg-[#150a24] [&>option]:text-white"
                >
                  <option value="all">ทุกชั้นเรียน</option>
                  {classrooms.map((cls) => (
                    <option key={cls} value={cls}>
                      ห้อง {cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* Database & Cloud Sync Button */}
              <button
                type="button"
                onClick={() => setIsBackupOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 border border-purple-500/30 rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-102 active:scale-98"
                title="ฐานข้อมูล Firebase, Google Sheets & สำรองข้อมูล"
              >
                <div className="relative">
                  <Cloud className="w-4 h-4 text-amber-400" />
                  {isCloudSynced && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </div>
                <span>ฐานข้อมูล & ชีต</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={() => setIsBackupOpen(true)}
                className="p-2 text-purple-300 hover:bg-white/5 rounded-xl"
                title="สำรองข้อมูล"
              >
                <Database className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#150a24] px-4 pt-2 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="pb-2 border-b border-white/10">
              <label className="block text-xs font-medium text-slate-400 mb-1">เลือกชั้นเรียน:</label>
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-white [&>option]:bg-[#150a24] [&>option]:text-white"
              >
                <option value="all">ทุกชั้นเรียน</option>
                {classrooms.map((cls) => (
                  <option key={cls} value={cls}>
                    ห้อง {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/' ? location === '/' : location.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-purple-600/30 text-purple-300 font-semibold border border-purple-500/40 shadow-xs'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Backup Modal */}
      <BackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />
    </>
  );
};

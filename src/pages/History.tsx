import React, { useState, useMemo } from 'react';
import { useStudents } from '../context/StudentContext';
import {
  History as HistoryIcon,
  Search,
  Filter,
  ArrowUpDown,
  Star,
  Trash2,
  Calendar,
  Sparkles,
  PieChart,
  FileSpreadsheet,
} from 'lucide-react';
import { BackupModal } from '../components/BackupModal';

export const HistoryPage: React.FC = () => {
  const { history, clearHistory, categories, selectedClassroom, classrooms, setSelectedClassroom } =
    useStudents();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'stars-desc'>('latest');
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Filter & Sort
  const filteredHistory = useMemo(() => {
    let list = [...history];

    if (selectedClassroom !== 'all') {
      list = list.filter((h) => h.classroom === selectedClassroom);
    }

    if (categoryFilter !== 'all') {
      list = list.filter((h) => h.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (h) =>
          h.studentName.toLowerCase().includes(q) ||
          h.classroom.toLowerCase().includes(q) ||
          (h.note && h.note.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'latest') {
      list.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => a.timestamp - b.timestamp);
    } else if (sortBy === 'stars-desc') {
      list.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    }

    return list;
  }, [history, selectedClassroom, categoryFilter, searchQuery, sortBy]);

  // Overall Statistics
  const totalRecords = filteredHistory.length;
  const totalStarsGiven = filteredHistory
    .filter((h) => h.amount > 0)
    .reduce((acc, h) => acc + h.amount, 0);
  const avgStarsPerRecord =
    totalRecords > 0 ? (totalStarsGiven / Math.max(1, totalRecords)).toFixed(1) : '0';

  // Category Breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; stars: number }> = {};
    filteredHistory.forEach((h) => {
      const cat = h.category || 'ทั่วไป';
      if (!map[cat]) map[cat] = { count: 0, stars: 0 };
      map[cat].count += 1;
      map[cat].stars += h.amount;
    });

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        count: data.count,
        stars: Number(data.stars.toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredHistory]);

  const handleClear = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการให้ดาวทั้งหมด? (คะแนนสะสมของนักเรียนจะไม่ได้รับผลกระทบ)')) {
      clearHistory();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#150a24] p-5 rounded-3xl border border-white/10 shadow-lg shadow-purple-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs tracking-wide">
            <HistoryIcon className="w-4 h-4 text-purple-400" />
            <span>ประวัติและการติดตามความดี</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-heading mt-0.5">
            ประวัติการให้ดาวความดี 📜
          </h1>
          <p className="text-xs text-slate-400">
            แสดงบันทึก วันเวลา เหตุผล สถิติตามหมวดหมู่ และรายละเอียดทั้งหมด
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsBackupOpen(true)}
            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="ส่งออกประวัติไปยัง Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>ซิงก์ Google Sheets</span>
          </button>

          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3.5 py-2 text-rose-300 hover:text-rose-200 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างบันทึกประวัติ</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#150a24] p-5 rounded-2xl border border-white/10 shadow-lg shadow-purple-950/20">
          <div className="text-xs text-slate-400 font-medium">จำนวนครั้งที่บันทึก</div>
          <div className="text-2xl sm:text-3xl font-bold font-heading text-white mt-1">
            {totalRecords} <span className="text-xs font-normal text-slate-500">ครั้ง</span>
          </div>
        </div>

        <div className="bg-[#150a24] p-5 rounded-2xl border border-white/10 shadow-lg shadow-purple-950/20">
          <div className="text-xs text-slate-400 font-medium">ดาวที่มอบทั้งหมด</div>
          <div className="text-2xl sm:text-3xl font-bold font-heading text-amber-400 mt-1 flex items-center gap-1">
            {totalStarsGiven} <span className="text-xs font-normal text-slate-500">ดวง ⭐</span>
          </div>
        </div>

        <div className="bg-[#150a24] p-5 rounded-2xl border border-white/10 shadow-lg shadow-purple-950/20">
          <div className="text-xs text-slate-400 font-medium">เฉลี่ยต่อการบันทึก</div>
          <div className="text-2xl sm:text-3xl font-bold font-heading text-purple-300 mt-1">
            {avgStarsPerRecord} <span className="text-xs font-normal text-slate-500">ดวง/ครั้ง</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Breakdown Pills */}
      {categoryStats.length > 0 && (
        <div className="bg-[#150a24] p-5 rounded-3xl border border-white/10 shadow-lg shadow-purple-950/20 space-y-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white font-heading">
              สถิติแยกตามหมวดหมู่ความดี
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {categoryStats.map((item) => {
              const isSelected = categoryFilter === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setCategoryFilter(isSelected ? 'all' : item.name)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-purple-600/30 border-purple-400 ring-1 ring-purple-400/30 text-purple-200 shadow-[0_0_12px_rgba(147,51,234,0.3)]'
                      : 'bg-white/5 border-white/5 hover:border-purple-500/30 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-white truncate">{item.name}</div>
                  <div className="mt-1 flex items-baseline justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">{item.count} ครั้ง</span>
                    <span className="font-bold text-amber-400 text-xs">{item.stars} ⭐</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-[#150a24] p-4 rounded-2xl border border-white/10 shadow-lg shadow-purple-950/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, ห้อง หรือโน้ต..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Classroom */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">ห้อง:</span>
          <select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="w-full bg-transparent border-0 focus:outline-none text-xs text-white font-medium [&>option]:bg-[#150a24]"
          >
            <option value="all">ทุกชั้นเรียน</option>
            {classrooms.map((c) => (
              <option key={c} value={c}>
                ห้อง {c}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">หมวด:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-transparent border-0 focus:outline-none text-xs text-white font-medium [&>option]:bg-[#150a24]"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">เรียง:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-transparent border-0 focus:outline-none text-xs text-white font-medium [&>option]:bg-[#150a24]"
          >
            <option value="latest">บันทึกล่าสุดก่อน</option>
            <option value="oldest">เก่าที่สุดก่อน</option>
            <option value="stars-desc">จำนวนดาวมากสุด</option>
          </select>
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-[#150a24] rounded-3xl border border-white/10 shadow-lg shadow-purple-950/20 overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            ไม่พบประวัติการบันทึกตามเงื่อนไขที่เลือก
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">วันและเวลา</th>
                  <th className="py-3 px-4">ชื่อนักเรียน</th>
                  <th className="py-3 px-4">ชั้นเรียน</th>
                  <th className="py-3 px-4">หมวดหมู่ / เหตุผล</th>
                  <th className="py-3 px-4">จำนวนดาว</th>
                  <th className="py-3 px-4">บันทึกเพิ่มเติม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {new Date(item.timestamp).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {item.studentName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-purple-600/20 text-purple-300 border border-purple-500/20 font-medium text-[11px]">
                        {item.classroom}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-300">{item.category}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs ${
                          item.amount > 0
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        <Star className="w-3 h-3 fill-current" />
                        <span>
                          {item.amount > 0 ? `+${item.amount}` : item.amount} ดวง
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {item.note ? item.note : <span className="text-slate-600">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Database & Google Sheets Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />
    </div>
  );
};

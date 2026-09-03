import React from 'react';
import { Route, Switch, Redirect } from 'wouter';
import { StudentProvider } from './context/StudentContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { AddStar } from './pages/AddStar';
import { Students } from './pages/Students';
import { Leaderboard } from './pages/Leaderboard';
import { Rewards } from './pages/Rewards';
import { HistoryPage } from './pages/History';
import { SettingsPage } from './pages/Settings';
import { StudentPortal } from './pages/StudentPortal';

export default function App() {
  return (
    <StudentProvider>
      <div className="min-h-screen bg-[#0f071a] bg-gradient-to-br from-[#1a0b2e] via-[#120524] to-[#0f071a] text-slate-200 flex flex-col selection:bg-purple-600 selection:text-white">
        {/* Navigation Bar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/add-star" component={AddStar} />
            <Route path="/students" component={Students} />
            <Route path="/leaderboard" component={Leaderboard} />
            <Route path="/rewards" component={Rewards} />
            <Route path="/history" component={HistoryPage} />
            <Route path="/portal/:id" component={StudentPortal} />
            <Route path="/portal" component={StudentPortal} />
            <Route path="/settings" component={SettingsPage} />
            <Route>
              <Redirect to="/" />
            </Route>
          </Switch>
        </main>

        {/* Footer */}
        <footer className="mt-auto py-6 border-t border-white/5 bg-[#150a24]/60 backdrop-blur-xs text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <span className="text-amber-400">✨</span>
              <span className="font-heading font-semibold text-purple-300">
                Star Academy • ระบบเก็บคะแนนความดี
              </span>
              <span className="text-slate-500">— สำหรับคุณครูและห้องเรียน</span>
            </div>
            <div className="text-slate-500 text-[11px]">
              บันทึกอัตโนมัติในเบราว์เซอร์ • พร้อมระบบส่งออกสำรองข้อมูล
            </div>
          </div>
        </footer>
      </div>
    </StudentProvider>
  );
}

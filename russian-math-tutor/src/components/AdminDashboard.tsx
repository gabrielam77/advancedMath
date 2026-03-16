/**
 * AdminDashboard — password-gated panel.
 * Lists all users, shows per-user stats, allows delete, and exports JSON.
 * Password is validated against REACT_APP_ADMIN_PASSWORD env variable.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { UserProfile, StudentProgress } from '../types';
import { MongoDBService } from '../services/MongoDBService';

interface AdminDashboardProps {
  onClose: () => void;
}

interface UserRow extends UserProfile {
  progress?: StudentProgress & { userId: string };
}

const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD ?? '';

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [authed, setAuthed] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');

  const [users, setUsers]   = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dbStatus] = useState(MongoDBService.isAvailable() ? '🟢 MongoDB מחובר' : '🟡 מצב offline (localStorage)');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [allUsers, allProgress] = await Promise.all([
      AuthService.getAllUsers(),
      UserService.getAllProgress(),
    ]);
    const progressMap = new Map(allProgress.map(p => [p.userId, p]));
    const rows: UserRow[] = allUsers.map(u => ({ ...u, progress: progressMap.get(u.userId) }));
    setUsers(rows);
    setLoading(false);
  }, []);

  useEffect(() => { if (authed) loadData(); }, [authed, loadData]);

  const handleLogin = () => {
    if (!ADMIN_PASSWORD) {
      // No password configured — allow access but warn
      setAuthed(true); return;
    }
    if (passInput === ADMIN_PASSWORD) { setAuthed(true); }
    else { setPassError('סיסמה שגויה'); }
  };

  const handleDelete = async (user: UserRow) => {
    if (!window.confirm(`למחוק את ${user.displayName} (@${user.username})?`)) return;
    setDeleting(user.userId);
    await UserService.deleteAccount(user.userId, user.username);
    await loadData();
    if (selectedUser?.userId === user.userId) setSelectedUser(null);
    setDeleting(null);
  };

  const handleExport = () => {
    const data = JSON.stringify(users, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `math-tutor-users-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const totalQ = users.reduce((s, u) => s + (u.progress?.totalQuestionsAnswered ?? 0), 0);
  const avgAcc = users.length
    ? Math.round(users.reduce((s, u) => {
        const p = u.progress;
        if (!p || p.totalQuestionsAnswered === 0) return s;
        return s + (p.correctAnswers / p.totalQuestionsAnswered) * 100;
      }, 0) / Math.max(1, users.filter(u => (u.progress?.totalQuestionsAnswered ?? 0) > 0).length))
    : 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] flex items-start justify-center overflow-y-auto p-4">
      <motion.div dir="rtl" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-4 border-purple-400 my-4 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">👥 לוח בקרה — ניהול משתמשים</h1>
            <p className="text-indigo-200 text-sm">{dbStatus}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-3xl font-black">✕</button>
        </div>

        {/* Password gate */}
        {!authed ? (
          <div className="p-8 flex flex-col items-center gap-4 max-w-sm mx-auto">
            <span className="text-5xl">🔐</span>
            <h2 className="text-xl font-black text-gray-700 dark:text-gray-200">הכנס סיסמת מנהל</h2>
            <input type="password" value={passInput} onChange={e => { setPassInput(e.target.value); setPassError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="סיסמה..."
              className="w-full px-4 py-3 rounded-xl border-2 border-purple-300 focus:border-purple-500 outline-none text-right bg-white dark:bg-slate-800 dark:text-white font-semibold" />
            {passError && <p className="text-red-500 font-bold">❌ {passError}</p>}
            {!ADMIN_PASSWORD && <p className="text-yellow-600 text-sm font-bold text-center">⚠️ לא הוגדרה סיסמת מנהל ב-.env — גישה חופשית</p>}
            <button onClick={handleLogin}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black rounded-2xl shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all">
              🚀 כניסה
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Stats overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'משתמשים', value: users.length, icon: '👤', color: 'bg-blue-100 dark:bg-blue-900/40 border-blue-300' },
                { label: 'שאלות סה"כ', value: totalQ, icon: '📝', color: 'bg-green-100 dark:bg-green-900/40 border-green-300' },
                { label: 'דיוק ממוצע', value: `${avgAcc}%`, icon: '🎯', color: 'bg-purple-100 dark:bg-purple-900/40 border-purple-300' },
                { label: 'סשנים סה"כ', value: users.reduce((s, u) => s + (u.progress?.sessionHistory?.length ?? 0), 0), icon: '📅', color: 'bg-orange-100 dark:bg-orange-900/40 border-orange-300' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className={`${color} border-2 rounded-2xl p-4 text-center`}>
                  <div className="text-3xl">{icon}</div>
                  <div className="text-2xl font-black text-gray-800 dark:text-gray-100">{value}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-bold">{label}</div>
                </div>
              ))}
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap gap-3">
              <button onClick={loadData} disabled={loading}
                className="px-4 py-2 bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold rounded-xl border-2 border-blue-300 transition-all">
                {loading ? '⏳ טוען...' : '🔄 רענן'}
              </button>
              <button onClick={handleExport}
                className="px-4 py-2 bg-green-100 dark:bg-green-900/40 hover:bg-green-200 dark:hover:bg-green-900 text-green-700 dark:text-green-300 font-bold rounded-xl border-2 border-green-300 transition-all">
                📥 ייצוא JSON
              </button>
            </div>

            {/* Users table */}
            {loading ? (
              <div className="text-center py-8 text-gray-400 font-bold animate-pulse">טוען נתוני משתמשים...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-5xl mb-3">👤</div>
                <p className="font-bold text-lg">אין משתמשים רשומים</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border-2 border-gray-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    <tr>
                      {['', 'שם', 'משתמש', 'הצטרפות', 'שאלות', 'נכונות', 'דיוק', 'סשנים', ''].map((h, i) => (
                        <th key={i} className="px-3 py-3 text-right font-black whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => {
                      const p = u.progress;
                      const acc = p && p.totalQuestionsAnswered > 0
                        ? Math.round((p.correctAnswers / p.totalQuestionsAnswered) * 100) : 0;
                      const accColor = acc >= 80 ? 'text-green-600' : acc >= 60 ? 'text-yellow-600' : 'text-red-600';
                      return (
                        <tr key={u.userId}
                          className={`border-b border-gray-100 dark:border-slate-700 cursor-pointer transition-colors
                            ${i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800'}
                            hover:bg-indigo-50 dark:hover:bg-indigo-900/20`}
                          onClick={() => setSelectedUser(u)}>
                          <td className="px-3 py-3 text-2xl">{u.avatarEmoji}</td>
                          <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">{u.displayName}</td>
                          <td className="px-3 py-3 text-gray-500 dark:text-gray-400">@{u.username}</td>
                          <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {new Date(u.createdAt).toLocaleDateString('he-IL')}
                          </td>
                          <td className="px-3 py-3 font-bold text-center text-gray-800 dark:text-gray-200">{p?.totalQuestionsAnswered ?? 0}</td>
                          <td className="px-3 py-3 font-bold text-center text-green-600">{p?.correctAnswers ?? 0}</td>
                          <td className={`px-3 py-3 font-black text-center ${accColor}`}>{p?.totalQuestionsAnswered ? `${acc}%` : '—'}</td>
                          <td className="px-3 py-3 font-bold text-center text-gray-700 dark:text-gray-300">{p?.sessionHistory?.length ?? 0}</td>
                          <td className="px-3 py-3">
                            <button onClick={e => { e.stopPropagation(); handleDelete(u); }}
                              disabled={deleting === u.userId}
                              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-lg border border-red-300 transition-all disabled:opacity-50 whitespace-nowrap">
                              {deleting === u.userId ? '⏳' : '🗑️ מחק'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* User detail panel */}
            <AnimatePresence>
              {selectedUser && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl p-6 border-2 border-indigo-200 dark:border-indigo-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <span className="text-3xl">{selectedUser.avatarEmoji}</span>
                      {selectedUser.displayName}
                      <span className="text-gray-500 font-normal text-sm">@{selectedUser.username}</span>
                    </h3>
                    <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-700 text-xl font-black">✕</button>
                  </div>

                  {selectedUser.progress ? (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        הצטרפות: {new Date(selectedUser.createdAt).toLocaleDateString('he-IL')} | רצף: {selectedUser.progress.streak} ימים
                      </p>
                      <h4 className="font-black text-gray-700 dark:text-gray-300 mb-2">📜 סשנים אחרונים</h4>
                      {selectedUser.progress.sessionHistory.length === 0 ? (
                        <p className="text-gray-400 text-sm">אין סשנים עדיין</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedUser.progress.sessionHistory.slice(0, 10).map(s => (
                            <div key={s.id} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl px-4 py-2 text-sm border border-gray-100 dark:border-slate-700">
                              <span className="text-gray-500">{new Date(s.date).toLocaleDateString('he-IL')}</span>
                              <span className="font-bold text-gray-700 dark:text-gray-300">{s.category}</span>
                              <span className={`font-black ${s.accuracy >= 80 ? 'text-green-600' : s.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {Math.round(s.accuracy)}%
                              </span>
                              <span className="text-gray-500">{s.totalQuestions} שאלות</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">אין נתוני התקדמות</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}

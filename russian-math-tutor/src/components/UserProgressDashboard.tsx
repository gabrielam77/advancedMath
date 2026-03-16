import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ProgressService } from '../services/ProgressService';
import { QuestionCategory } from '../types';

const CAT_LABELS: Record<QuestionCategory, string> = {
  [QuestionCategory.ADDITION]: 'חיבור ➕',
  [QuestionCategory.SUBTRACTION]: 'חיסור ➖',
  [QuestionCategory.MULTIPLICATION]: 'כפל ✖️',
  [QuestionCategory.DIVISION]: 'חילוק ➗',
  [QuestionCategory.MIXED]: 'מעורב 🔀',
};

const CAT_COLORS: Record<QuestionCategory, string> = {
  [QuestionCategory.ADDITION]: 'from-emerald-400 to-green-500',
  [QuestionCategory.SUBTRACTION]: 'from-blue-400 to-cyan-500',
  [QuestionCategory.MULTIPLICATION]: 'from-purple-400 to-violet-500',
  [QuestionCategory.DIVISION]: 'from-orange-400 to-amber-500',
  [QuestionCategory.MIXED]: 'from-pink-400 to-rose-500',
};

interface UserProgressDashboardProps {
  /** If provided, refreshes when this value changes */
  refreshKey?: number;
}

export function UserProgressDashboard({ refreshKey }: UserProgressDashboardProps) {
  const { currentUser } = useAuth();
  const ps = ProgressService.getInstance();

  // Recompute stats whenever refreshKey changes so stale data is never shown.
  const [stats, setStats] = useState(() => ps.getStatsSummary());
  useEffect(() => {
    setStats(ps.getStatsSummary());
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const accuracy = Math.round(stats.overallAccuracy);
  const accuracyColor = accuracy >= 80 ? 'text-green-500' : accuracy >= 60 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div dir="rtl" className="space-y-4">
      {/* Welcome banner */}
      {currentUser && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white text-center shadow-xl border-4 border-yellow-300">
          <span className="text-3xl">{currentUser.avatarEmoji}</span>
          <p className="font-black text-lg mt-1">שלום, {currentUser.displayName}! 👋</p>
        </div>
      )}

      {/* Overall stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'שאלות', value: stats.totalQuestions, icon: '📝', color: 'from-blue-400 to-cyan-400' },
          { label: 'נכונות', value: stats.correctAnswers, icon: '✅', color: 'from-green-400 to-emerald-400' },
          { label: 'דיוק', value: `${accuracy}%`, icon: '🎯', color: `from-purple-400 to-pink-400` },
          { label: 'רצף ימים', value: stats.streak, icon: '🔥', color: 'from-orange-400 to-amber-400' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white text-center shadow-lg border-2 border-white/40`}>
            <div className="text-3xl">{icon}</div>
            <div className="text-2xl font-black mt-1">{value}</div>
            <div className="text-xs font-bold opacity-80">{label}</div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/40 shadow-lg">
        <h3 className="text-white font-black text-lg mb-3 text-center">📊 לפי קטגוריה</h3>
        <div className="space-y-2">
          {(Object.values(QuestionCategory) as QuestionCategory[]).map(cat => {
            const p = stats.categoriesProgress[cat];
            const pct = p.attempted > 0 ? Math.round((p.correct / p.attempted) * 100) : 0;
            return (
              <div key={cat}>
                <div className="flex justify-between text-white text-sm font-bold mb-1">
                  <span>{CAT_LABELS[cat]}</span>
                  <span>{p.attempted > 0 ? `${pct}% (${p.correct}/${p.attempted})` : '—'}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 }}
                    className={`h-3 rounded-full bg-gradient-to-r ${CAT_COLORS[cat]}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      {stats.totalSessions > 0 && (
        <div className="bg-gradient-to-br from-yellow-300 to-orange-300 dark:from-yellow-900 dark:to-orange-900 rounded-2xl p-4 shadow-lg border-2 border-yellow-400">
          <h3 className="font-black text-gray-800 dark:text-yellow-200 mb-2">💡 תובנות</h3>
          {ps.getInsights().map((ins, i) => (
            <p key={i} className="text-gray-700 dark:text-yellow-100 text-sm font-semibold">• {ins}</p>
          ))}
          <p className="text-gray-700 dark:text-yellow-100 text-sm font-semibold mt-1">• סה״כ {stats.totalSessions} סשנים</p>
        </div>
      )}
    </div>
  );
}

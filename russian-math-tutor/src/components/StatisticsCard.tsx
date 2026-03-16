import React from 'react';
import { QuestionCategory } from '../types';
import { motion } from 'framer-motion';

interface StatisticsCardProps {
  totalQuestions: number;
  correctAnswers: number;
  overallAccuracy: number;
  streak: number;
  categoriesProgress: Record<QuestionCategory, {
    attempted: number;
    correct: number;
    accuracy: number;
  }>;
  weakestCategory?: QuestionCategory | null;
  strongestCategory?: QuestionCategory | null;
}

const categoryNames: Record<QuestionCategory, string> = {
  [QuestionCategory.ADDITION]: 'חיבור',
  [QuestionCategory.SUBTRACTION]: 'חיסור',
  [QuestionCategory.MULTIPLICATION]: 'כפל',
  [QuestionCategory.DIVISION]: 'חילוק',
  [QuestionCategory.MIXED]: 'מעורב',
};

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  totalQuestions,
  correctAnswers,
  overallAccuracy,
  streak,
  categoriesProgress,
  weakestCategory,
  strongestCategory,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-cyan-50 to-fuchsia-100 dark:from-slate-900 dark:to-purple-950 rounded-3xl p-8 shadow-2xl border-4 border-fuchsia-500 dark:border-purple-700"
    >
      <h3 className="text-3xl font-black text-purple-700 dark:text-yellow-300 mb-6 text-center">
        📊 הסטטיסטיקות שלך
      </h3>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 shadow-xl text-center">
          <div className="text-5xl font-black text-white">
            {totalQuestions}
          </div>
          <div className="text-base text-white font-bold mt-2">📝 סה"כ שאלות</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl p-5 shadow-xl text-center">
          <div className="text-5xl font-black text-white">
            {overallAccuracy.toFixed(0)}%
          </div>
          <div className="text-base text-white font-bold mt-2">✅ דיוק כללי</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-fuchsia-700 rounded-2xl p-5 shadow-xl text-center">
          <div className="text-5xl font-black text-white">
            {correctAnswers}
          </div>
          <div className="text-base text-white font-bold mt-2">🎯 תשובות נכונות</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-rose-700 rounded-2xl p-5 shadow-xl text-center">
          <div className="text-5xl font-black text-white">
            {streak} 🔥
          </div>
          <div className="text-base text-white font-bold mt-2">📅 רצף ימים</div>
        </div>
      </div>

      {/* Category Progress */}
      <div className="space-y-3 mb-6">
        <h4 className="font-black text-xl text-purple-700 dark:text-yellow-300 text-center">📈 התקדמות לפי קטגוריה</h4>
        {Object.entries(categoriesProgress).map(([category, progress]) => {
          if (progress.attempted === 0) return null;
          
          return (
            <div key={category} className="space-y-2 bg-white/50 dark:bg-black/20 rounded-xl p-3">
              <div className="flex justify-between text-base font-bold">
                <span className="text-purple-700 dark:text-yellow-300">
                  {categoryNames[category as QuestionCategory]}
                </span>
                <span className="text-purple-600 dark:text-pink-300">
                  {progress.accuracy.toFixed(0)}%
                </span>
              </div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden border-2 border-purple-300 dark:border-purple-500">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.accuracy}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 rounded-full"
                />
              </div>
              <div className="text-sm font-bold text-purple-600 dark:text-pink-300 text-center">
                ✅ {progress.correct} / {progress.attempted} נכונות
              </div>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      {(weakestCategory || strongestCategory) && (
        <div className="space-y-3 pt-4 border-t-4 border-purple-300 dark:border-purple-500">
          <h4 className="font-black text-xl text-purple-700 dark:text-yellow-300 mb-3 text-center">💡 תובנות</h4>
          
          {strongestCategory && (
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-200 to-emerald-300 dark:from-green-800 dark:to-emerald-900 rounded-2xl shadow-lg border-2 border-green-400 dark:border-green-500">
              <span className="text-3xl">💪</span>
              <div className="text-base">
                <span className="font-black text-green-800 dark:text-green-300">נקודת חוזק: </span>
                <span className="font-bold text-green-900 dark:text-green-200">
                  {categoryNames[strongestCategory]}
                </span>
              </div>
            </div>
          )}
          
          {weakestCategory && (
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-orange-200 to-yellow-300 dark:from-orange-800 dark:to-yellow-900 rounded-2xl shadow-lg border-2 border-orange-400 dark:border-orange-500">
              <span className="text-3xl">📚</span>
              <div className="text-base">
                <span className="font-black text-orange-800 dark:text-orange-300">נקודת חולשה: </span>
                <span className="font-bold text-orange-900 dark:text-orange-200">
                  {categoryNames[weakestCategory]}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

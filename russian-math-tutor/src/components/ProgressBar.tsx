import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  total: number;
  correctCount: number;
  incorrectCount: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  correctCount,
  incorrectCount,
}) => {
  const progress = (current / total) * 100;
  const accuracy = current > 0 ? (correctCount / current) * 100 : 0;

  return (
    <div className="space-y-4 bg-white/80 dark:bg-purple-900/50 rounded-2xl p-5 shadow-xl border-4 border-yellow-300 dark:border-purple-500">
      <div className="flex justify-between items-center text-lg font-black text-purple-700 dark:text-yellow-300">
        <span>📊 התקדמות: {current} / {total}</span>
        <span>🎯 דיוק: {accuracy.toFixed(0)}%</span>
      </div>

      {/* Main Progress Bar */}
      <div className="relative h-8 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden border-4 border-purple-300 dark:border-purple-600 shadow-lg">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-green-400 via-blue-500 to-purple-500 rounded-full"
        />
        
        {/* Shimmer effect */}
        <motion.div
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
        />
      </div>

      {/* Statistics */}
      <div className="flex gap-6 text-base justify-center">
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className="flex items-center gap-2 bg-green-200 dark:bg-green-800 px-4 py-2 rounded-full shadow-md"
        >
          <div className="w-5 h-5 bg-green-500 rounded-full shadow-lg" />
          <span className="font-black text-green-800 dark:text-green-200">✅ נכון: {correctCount}</span>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className="flex items-center gap-2 bg-red-200 dark:bg-red-800 px-4 py-2 rounded-full shadow-md"
        >
          <div className="w-5 h-5 bg-red-500 rounded-full shadow-lg" />
          <span className="font-black text-red-800 dark:text-red-200">❌ שגוי: {incorrectCount}</span>
        </motion.div>
      </div>
    </div>
  );
};

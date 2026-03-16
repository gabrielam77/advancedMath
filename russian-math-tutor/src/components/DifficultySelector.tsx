import React from 'react';
import { DifficultyLevel } from '../types';
import { motion } from 'framer-motion';

interface DifficultySelectorProps {
  selectedDifficulty?: DifficultyLevel;
  onSelect: (difficulty?: DifficultyLevel) => void;
}

const difficultyInfo: Record<DifficultyLevel, { name: string; icon: string; description: string; gradient: string; shadow: string }> = {
  [DifficultyLevel.EASY]: { 
    name: 'קל', 
    icon: '😊', 
    description: '1-10',
    gradient: 'bg-gradient-to-br from-green-400 to-lime-500',
    shadow: 'shadow-green-500/50'
  },
  [DifficultyLevel.MEDIUM]: { 
    name: 'בינוני', 
    icon: '🤔', 
    description: '1-20',
    gradient: 'bg-gradient-to-br from-yellow-400 to-orange-500',
    shadow: 'shadow-yellow-500/50'
  },
  [DifficultyLevel.HARD]: { 
    name: 'קשה', 
    icon: '😤', 
    description: '1-100',
    gradient: 'bg-gradient-to-br from-red-400 to-rose-600',
    shadow: 'shadow-red-500/50'
  },
};

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selectedDifficulty,
  onSelect,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-black text-purple-700 dark:text-yellow-300 text-center">🏆 בחר רמת קושי</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center">
        {/* All Difficulties Option */}
        <motion.button
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(undefined)}
          className={`p-5 rounded-2xl border-4 transition-all shadow-xl ${
            !selectedDifficulty
              ? 'border-yellow-400 bg-gradient-to-br from-purple-200 to-pink-300 shadow-purple-500/50'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
          }`}
        >
          <div className="text-4xl mb-2">🌈</div>
          <div className="font-black text-lg text-gray-800 dark:text-gray-200 text-center">הכל</div>
          <div className="text-sm font-bold text-purple-600 dark:text-pink-300 mt-1 text-center">
            כל הרמות
          </div>
        </motion.button>

        {/* Individual Difficulties */}
        {Object.entries(difficultyInfo).map(([key, info]) => {
          const difficulty = key as DifficultyLevel;
          
          return (
            <motion.button
              key={difficulty}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(difficulty)}
              className={`p-5 rounded-2xl border-4 transition-all shadow-xl ${info.shadow} ${
                selectedDifficulty === difficulty
                  ? `border-yellow-400 ${info.gradient} text-white`
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="text-4xl mb-2">{info.icon}</div>
              <div className={`font-black text-lg text-center ${selectedDifficulty === difficulty ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                {info.name}
              </div>
              <div className={`text-sm font-bold mt-1 text-center ${selectedDifficulty === difficulty ? 'text-white' : 'text-purple-600 dark:text-pink-300'}`}>
                {info.description}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

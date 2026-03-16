import React from 'react';
import { QuestionCategory } from '../types';
import { motion } from 'framer-motion';

interface CategorySelectorProps {
  selectedCategory?: QuestionCategory;
  onSelect: (category?: QuestionCategory) => void;
  questionCounts: Record<QuestionCategory, number>;
}

const categoryInfo: Record<QuestionCategory, { name: string; icon: string; gradient: string; shadow: string }> = {
  [QuestionCategory.ADDITION]: { 
    name: 'חיבור', 
    icon: '➕', 
    gradient: 'bg-gradient-to-br from-green-400 to-emerald-600',
    shadow: 'shadow-green-500/50'
  },
  [QuestionCategory.SUBTRACTION]: { 
    name: 'חיסור', 
    icon: '➖', 
    gradient: 'bg-gradient-to-br from-red-400 to-pink-600',
    shadow: 'shadow-red-500/50'
  },
  [QuestionCategory.MULTIPLICATION]: { 
    name: 'כפל', 
    icon: '✖️', 
    gradient: 'bg-gradient-to-br from-blue-400 to-indigo-600',
    shadow: 'shadow-blue-500/50'
  },
  [QuestionCategory.DIVISION]: { 
    name: 'חילוק', 
    icon: '➗', 
    gradient: 'bg-gradient-to-br from-purple-400 to-pink-600',
    shadow: 'shadow-purple-500/50'
  },
  [QuestionCategory.MIXED]: { 
    name: 'מעורב', 
    icon: '🎲', 
    gradient: 'bg-gradient-to-br from-orange-400 to-yellow-600',
    shadow: 'shadow-orange-500/50'
  },
};

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onSelect,
  questionCounts,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-black text-purple-700 dark:text-yellow-300 text-center">🎨 בחר קטגוריה</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 justify-items-center">
        {/* All Categories Option */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(undefined)}
          className={`p-5 rounded-2xl border-4 transition-all shadow-xl ${
            !selectedCategory
              ? 'border-yellow-400 bg-gradient-to-br from-yellow-200 to-orange-300 shadow-yellow-500/50'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
          }`}
        >
          <div className="text-4xl mb-2">🌈</div>
          <div className="font-black text-lg text-gray-800 dark:text-gray-200 text-center">הכל</div>
          <div className="text-sm font-bold text-purple-600 dark:text-pink-300 mt-1 text-center">
            {Object.values(questionCounts).reduce((a, b) => a + b, 0)} שאלות
          </div>
        </motion.button>

        {/* Individual Categories */}
        {Object.entries(categoryInfo).map(([key, info]) => {
          const category = key as QuestionCategory;
          const count = questionCounts[category] || 0;
          
          return (
            <motion.button
              key={category}
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(category)}
              className={`p-5 rounded-2xl border-4 transition-all shadow-xl ${info.shadow} ${
                selectedCategory === category
                  ? `border-yellow-400 ${info.gradient}`
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              }`}
            >
              <div className={`w-16 h-16 ${info.gradient} rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-2 shadow-lg ${info.shadow}`}>
                {info.icon}
              </div>
              <div className="font-black text-lg text-gray-800 dark:text-gray-200 text-center">{info.name}</div>
              <div className="text-sm font-bold text-purple-600 dark:text-pink-300 mt-1 text-center">
                {count} שאלות
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

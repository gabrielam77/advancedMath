import React from 'react';
import { Question } from '../types';
import { motion } from 'framer-motion';

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  questionNumber,
  totalQuestions,
}) => {
  // רקעים צבעוניים שמשתנים לפי מספר השאלה
  const backgrounds = [
    'bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-500',
    'bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500',
    'bg-gradient-to-br from-green-400 via-teal-400 to-blue-500',
    'bg-gradient-to-br from-purple-400 via-pink-400 to-rose-500',
    'bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500',
  ];
  
  const currentBg = backgrounds[questionNumber % backgrounds.length];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: 0.8, opacity: 0, rotate: 5 }}
      transition={{ 
        type: "spring",
        stiffness: 200,
        damping: 15
      }}
      className={`${currentBg} rounded-3xl p-10 shadow-2xl text-white relative overflow-hidden border-4 border-yellow-300`}
    >
      {/* כוכבים מנצנצים */}
      <div className="absolute top-4 left-4 text-3xl animate-pulse">⭐</div>
      <div className="absolute top-4 right-4 text-3xl animate-pulse delay-200">✨</div>
      <div className="absolute bottom-4 left-4 text-3xl animate-pulse delay-400">💫</div>
      <div className="absolute bottom-4 right-4 text-3xl animate-pulse delay-600">🌟</div>
      
      <div className="text-center relative z-10">
        <motion.div 
          className="text-lg font-black mb-4 bg-white/30 rounded-full px-6 py-2 inline-block backdrop-blur-sm"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          שאלה {questionNumber} מתוך {totalQuestions} 🎯
        </motion.div>
        
        <motion.div
          key={question.id}
          initial={{ y: 30, opacity: 0, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 150,
            damping: 10
          }}
          className="text-8xl font-black my-8 tracking-wider drop-shadow-2xl"
        >
          {question.expression} = ?
        </motion.div>

        <div className="flex items-center justify-center gap-3 mt-6">
          <motion.div 
            className="w-4 h-4 bg-white rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          />
          <motion.div 
            className="w-4 h-4 bg-white rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div 
            className="w-4 h-4 bg-white rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

import React, { useRef, useEffect } from 'react';
import { Question } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface AnswerHistoryProps {
  questions: Question[];
}

export const AnswerHistory: React.FC<AnswerHistoryProps> = ({ questions }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [questions.length]);

  const answeredQuestions = questions.filter(q => typeof q.userAnswer !== 'undefined');

  return (
    <div className="bg-gradient-to-br from-white to-pink-100 dark:from-purple-900 dark:to-indigo-900 rounded-2xl p-5 shadow-2xl h-full flex flex-col border-4 border-pink-300 dark:border-purple-500">
      <h3 className="text-2xl font-black text-purple-700 dark:text-yellow-300 mb-4">
        📜 היסטוריית תשובות
      </h3>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-3 custom-scrollbar"
      >
        {answeredQuestions.length === 0 ? (
          <p className="text-purple-500 dark:text-pink-300 text-lg font-bold italic text-center py-8">
            🤔 אין תשובות עדיין
          </p>
        ) : (
          <AnimatePresence>
            {answeredQuestions.map((q, index) => (
              <motion.div
                key={q.id}
                initial={{ x: -20, opacity: 0, scale: 0.9 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, type: "spring" }}
                className={`p-4 rounded-2xl border-4 shadow-lg ${
                  q.isCorrect
                    ? 'border-green-400 bg-gradient-to-r from-green-100 to-emerald-200 dark:border-green-600 dark:from-green-900/40 dark:to-emerald-900/40'
                    : 'border-red-400 bg-gradient-to-r from-red-100 to-pink-200 dark:border-red-600 dark:from-red-900/40 dark:to-pink-900/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-black text-lg text-gray-800 dark:text-gray-200">
                      {q.expression} = ?
                    </div>
                    <div className="text-base text-gray-700 dark:text-gray-300 mt-2 font-bold">
                      התשובה שלך: <span className="font-black text-purple-600 dark:text-yellow-300">{q.userAnswer}</span>
                    </div>
                    {!q.isCorrect && (
                      <div className="text-base text-red-700 dark:text-red-300 mt-2 font-bold">
                        התשובה הנכונה: <span className="font-black text-red-800 dark:text-red-200">{q.correctAnswer}</span>
                      </div>
                    )}
                  </div>
                  <div className="mr-3">
                    {q.isCorrect ? (
                      <span className="text-3xl">✅</span>
                    ) : (
                      <span className="text-3xl">❌</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(236, 72, 153, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #ec4899, #8b5cf6);
          border-radius: 10px;
          border: 2px solid transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #db2777, #7c3aed);
        }
      `}</style>
    </div>
  );
};

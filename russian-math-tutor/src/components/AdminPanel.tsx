import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { QuestionTemplate, QuestionCategory, DifficultyLevel } from '../types';
import { QuestionDatabaseService } from '../services/QuestionDatabaseService';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const db = QuestionDatabaseService.getInstance();
  const [questions, setQuestions] = useState<QuestionTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionTemplate | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<QuestionTemplate>>({
    category: QuestionCategory.ADDITION,
    difficulty: DifficultyLevel.EASY,
    expression: '',
    correctAnswer: 0,
    hint: '',
    tags: [],
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = () => {
    const allQuestions = db.getAllQuestions();
    setQuestions(allQuestions);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      const results = db.searchQuestions(searchTerm);
      setQuestions(results);
    } else {
      loadQuestions();
    }
  };

  const handleAddQuestion = () => {
    if (newQuestion.expression && newQuestion.correctAnswer !== undefined) {
      db.addQuestion(newQuestion as Omit<QuestionTemplate, 'id' | 'createdAt'>);
      loadQuestions();
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleDeleteQuestion = (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק שאלה זו?')) {
      db.deleteQuestion(id);
      loadQuestions();
    }
  };

  const handleExport = () => {
    const data = db.exportQuestions();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const result = db.importQuestions(content);
        if (result.success) {
          alert(`${result.count} שאלות יובאו בהצלחה!`);
          loadQuestions();
        } else {
          alert(`שגיאה: ${result.error}`);
        }
      };
      reader.readAsText(file);
    }
  };

  const resetForm = () => {
    setNewQuestion({
      category: QuestionCategory.ADDITION,
      difficulty: DifficultyLevel.EASY,
      expression: '',
      correctAnswer: 0,
      hint: '',
      tags: [],
    });
  };

  const categoryNames: Record<QuestionCategory, string> = {
    [QuestionCategory.ADDITION]: 'חיבור',
    [QuestionCategory.SUBTRACTION]: 'חיסור',
    [QuestionCategory.MULTIPLICATION]: 'כפל',
    [QuestionCategory.DIVISION]: 'חילוק',
    [QuestionCategory.MIXED]: 'מעורב',
  };

  const difficultyNames: Record<DifficultyLevel, string> = {
    [DifficultyLevel.EASY]: 'קל',
    [DifficultyLevel.MEDIUM]: 'בינוני',
    [DifficultyLevel.HARD]: 'קשה',
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-6xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <Dialog.Title className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                ניהול שאלות
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
              >
                + הוסף שאלה
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                📥 ייצא
              </button>
              <label className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition cursor-pointer">
                📤 ייבא
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="חפש שאלות..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  🔍
                </button>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              סה"כ {questions.length} שאלות
            </div>

            <div className="grid gap-3">
              {questions.map((q) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {q.expression} = {q.correctAnswer}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                          {categoryNames[q.category]}
                        </span>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                          {difficultyNames[q.difficulty]}
                        </span>
                        {q.tags?.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                      >
                        מחק
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Dialog.Panel>
      </div>

      {/* Add Question Modal */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6">
            <Dialog.Title className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              הוסף שאלה חדשה
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ביטוי
                </label>
                <input
                  type="text"
                  value={newQuestion.expression}
                  onChange={(e) => setNewQuestion({ ...newQuestion, expression: e.target.value })}
                  placeholder="2 + 2"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  תשובה נכונה
                </label>
                <input
                  type="number"
                  value={newQuestion.correctAnswer}
                  onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  קטגוריה
                </label>
                <select
                  value={newQuestion.category}
                  onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value as QuestionCategory })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  {Object.entries(categoryNames).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  רמת קושי
                </label>
                <select
                  value={newQuestion.difficulty}
                  onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value as DifficultyLevel })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  {Object.entries(difficultyNames).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddQuestion}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                >
                  הוסף
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
                >
                  ביטול
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Dialog>
  );
};

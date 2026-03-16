import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceController } from './components/VoiceController';
import { CategorySelector } from './components/CategorySelector';
import { DifficultySelector } from './components/DifficultySelector';
import { AdminPanel } from './components/AdminPanel';
import { DragonMascot } from './components/DragonMascot';
import { LoginPage } from './components/LoginPage';
import { UserAvatar } from './components/UserAvatar';
import { UserProfilePage } from './components/UserProfilePage';
import { UserProgressDashboard } from './components/UserProgressDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { QuestionCategory, DifficultyLevel } from './types';
import { QuestionService } from './services/QuestionService';
import { ProgressService } from './services/ProgressService';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';

type AppState = 'login' | 'setup' | 'session' | 'stats' | 'profile' | 'admin';

function App() {
  const { theme, toggleTheme } = useTheme();
  const { isLoggedIn, isLoading } = useAuth();
  const progressService = ProgressService.getInstance();

  const [appState, setAppState] = useState<AppState>('login');
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | undefined>();
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | undefined>();
  const [questionCount, setQuestionCount] = useState(10);
  const [showAdmin, setShowAdmin] = useState(false);   // question DB admin panel
  const [showUserAdmin, setShowUserAdmin] = useState(false); // user management
  const [statsRefresh, setStatsRefresh] = useState(0);

  const categories = QuestionService.getAvailableCategories();

  const handleLoginSuccess = () => setAppState('setup');
  const handleStartSession = () => setAppState('session');
  const handleSessionComplete = () => {
    setStatsRefresh(r => r + 1);
    setAppState('stats');
  };
  const handleBackToSetup = () => {
    setStatsRefresh(r => r + 1);
    setAppState('setup');
  };

  // Redirect to login if not logged in and not on login page
  const effectiveState: AppState =
    isLoading ? 'login' :
    !isLoggedIn && appState !== 'login' ? 'login' :
    appState;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-400 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="text-6xl">🌟</motion.div>
      </div>
    );
  }

  if (effectiveState === 'login') {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  if (effectiveState === 'profile') {
    return <UserProfilePage onBack={() => setAppState('setup')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-400 dark:from-indigo-950 dark:via-purple-950 dark:to-slate-950 transition-colors duration-500 relative">
      {/* Decorative background */}
      {theme === 'light' && (
        <div className="clouds-background">
          <div className="cloud">☁️</div>
          <div className="cloud">☁️</div>
          <div className="cloud">☁️</div>
          <div className="cloud">☁️</div>
        </div>
      )}
      {theme === 'dark' && (
        <div className="stars-background">
          <div className="star">⭐</div>
          <div className="star">✨</div>
          <div className="star">💫</div>
          <div className="star">🌟</div>
          <div className="star">⭐</div>
          <div className="star">✨</div>
        </div>
      )}

      <div className="relative z-10">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
        }} />

        <div className="relative z-20">
          {/* ── Header ── */}
          <header className="bg-gradient-to-r from-fuchsia-300 to-rose-300 dark:from-slate-900 dark:to-purple-950 shadow-2xl border-b-4 border-fuchsia-400 dark:border-purple-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.1, 1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="text-6xl filter drop-shadow-lg">
                    {theme === 'light' ? '🎓' : '🌟'}
                  </motion.div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent drop-shadow-md">
                      מאמן מתמטיקה
                    </h1>
                    <p className="text-base text-purple-700 dark:text-yellow-300 font-semibold">
                      עוזר קולי ללימוד מתמטיקה
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Theme toggle */}
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={toggleTheme}
                    className="p-3 rounded-full bg-yellow-200 dark:bg-indigo-800 hover:bg-yellow-300 dark:hover:bg-indigo-700 transition-all shadow-lg text-3xl"
                    aria-label="Toggle theme">
                    {theme === 'light' ? '🌙' : '☀️'}
                  </motion.button>

                  {/* Question DB admin */}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAdmin(true)}
                    className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-black shadow-xl border-2 border-white">
                    ⚙️ ניהול
                  </motion.button>

                  {/* User avatar / dropdown */}
                  <UserAvatar
                    onProfileClick={() => setAppState('profile')}
                    onAdminClick={() => setShowUserAdmin(true)}
                  />
                </div>
              </div>
            </div>
          </header>

          {/* ── Main ── */}
          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnimatePresence mode="wait">
              {/* Setup */}
              {effectiveState === 'setup' && (
                <motion.div key="setup"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="space-y-8">
                  <div className="flex justify-center mb-8">
                    <DragonMascot mood="happy" message="היי! בוא נלמד מתמטיקה ביחד! 🎓" />
                  </div>

                  <div className="grid lg:grid-cols-3 gap-6 items-start justify-items-center">
                    <div className="lg:col-span-2 space-y-6 w-full">
                      <div className="bg-gradient-to-br from-fuchsia-100 to-pink-200 dark:from-purple-950 dark:to-fuchsia-950 rounded-2xl p-6 shadow-2xl border-4 border-fuchsia-400 dark:border-fuchsia-700">
                        <CategorySelector selectedCategory={selectedCategory} onSelect={setSelectedCategory} questionCounts={categories} />
                      </div>

                      <div className="bg-gradient-to-br from-cyan-100 to-blue-200 dark:from-indigo-950 dark:to-blue-950 rounded-2xl p-6 shadow-2xl border-4 border-cyan-400 dark:border-blue-700">
                        <DifficultySelector selectedDifficulty={selectedDifficulty} onSelect={setSelectedDifficulty} />
                      </div>

                      <div className="bg-gradient-to-br from-amber-100 to-orange-200 dark:from-orange-950 dark:to-amber-950 rounded-2xl p-6 shadow-2xl border-4 border-amber-400 dark:border-orange-700">
                        <h3 className="text-2xl font-black text-purple-700 dark:text-yellow-300 mb-4">🔢 מספר שאלות</h3>
                        <div className="flex items-center gap-4">
                          <input type="range" min="5" max="30" value={questionCount}
                            onChange={e => setQuestionCount(parseInt(e.target.value))}
                            className="flex-1 h-3 bg-gradient-to-r from-pink-300 to-purple-300 dark:from-purple-700 dark:to-pink-700 rounded-full appearance-none cursor-pointer" />
                          <span className="text-4xl font-black text-purple-600 dark:text-yellow-400 min-w-[4rem] text-center bg-yellow-200 dark:bg-purple-800 rounded-xl px-3 py-2 shadow-lg">
                            {questionCount}
                          </span>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }} whileTap={{ scale: 0.95 }}
                        animate={{ boxShadow: ['0 0 30px rgba(16,185,129,0.7)', '0 0 60px rgba(16,185,129,1)', '0 0 30px rgba(16,185,129,0.7)'] }}
                        transition={{ boxShadow: { duration: 2, repeat: Infinity }, rotate: { duration: 0.5 } }}
                        onClick={handleStartSession}
                        className="w-full py-6 bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 text-white text-2xl font-black rounded-2xl shadow-2xl border-4 border-yellow-400">
                        ✨🎯 התחל תרגול! 🚀✨
                      </motion.button>
                    </div>

                    {/* Right: per-user progress */}
                    <div className="w-full">
                      <UserProgressDashboard refreshKey={statsRefresh} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Session */}
              {effectiveState === 'session' && (
                <motion.div key="session"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <VoiceController
                    category={selectedCategory} difficulty={selectedDifficulty}
                    questionCount={questionCount}
                    onSessionComplete={handleSessionComplete} onBack={handleBackToSetup} />
                </motion.div>
              )}

              {/* Stats */}
              {effectiveState === 'stats' && (
                <motion.div key="stats"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="max-w-4xl mx-auto">
                  <div className="flex justify-center mb-8">
                    <DragonMascot mood="happy" message="וואו! עבדת מעולה! אתה אלוף! 🏆🎉" />
                  </div>

                  <div className="bg-gradient-to-br from-amber-200 to-fuchsia-300 dark:from-purple-950 dark:to-fuchsia-950 rounded-3xl p-8 shadow-2xl text-center space-y-6 border-4 border-fuchsia-500 dark:border-fuchsia-700">
                    <motion.div className="text-8xl"
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 1, repeat: 3 }}>
                      🎉🌟🎊
                    </motion.div>
                    <h2 className="text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">כל הכבוד!</h2>
                    <p className="text-2xl text-purple-700 dark:text-yellow-300 font-bold">סיימת את הסשן בהצלחה! 🏆</p>

                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-6">
                      <motion.button whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}
                        onClick={handleBackToSetup}
                        className="py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-lg rounded-2xl font-black shadow-xl border-4 border-yellow-300">
                        🔄 תרגול נוסף
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1, rotate: -5 }} whileTap={{ scale: 0.9 }}
                        onClick={handleBackToSetup}
                        className="py-4 bg-gradient-to-r from-purple-400 to-pink-500 text-white text-lg rounded-2xl font-black shadow-xl border-4 border-pink-300">
                        📊 סטטיסטיקות
                      </motion.button>
                    </div>
                  </div>

                  <div className="mt-8">
                    <UserProgressDashboard refreshKey={statsRefresh} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Footer */}
          <footer className="mt-auto py-6 text-center bg-gradient-to-r from-rose-300 to-orange-300 dark:from-slate-900 dark:to-indigo-950 border-t-4 border-orange-400 dark:border-indigo-700">
            <p className="text-lg text-purple-700 dark:text-yellow-300 font-bold">🎤 דברו בבירור ובבהירות. ודאו שהמיקרופון מופעל! 🎤</p>
            <p className="mt-2 text-sm text-purple-600 dark:text-pink-300">נבנה עם ❤️ בעזרת React, TypeScript, ו-Framer Motion ✨</p>
          </footer>

          {/* Question DB admin panel */}
          {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

          {/* User management admin dashboard */}
          {showUserAdmin && <AdminDashboard onClose={() => setShowUserAdmin(false)} />}
        </div>
      </div>
    </div>
  );
}

export default App;

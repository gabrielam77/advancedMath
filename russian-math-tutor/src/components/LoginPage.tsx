import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/AuthService';
import { DragonMascot } from './DragonMascot';

const AVATARS = [
  '🦁','🐯','🐻','🦊','🐼','🐨','🦋','🐸',
  '🦄','🐉','🌟','🚀','🎮','🎨','⭐','🌈',
];

type Tab = 'login' | 'register';

interface LoginPageProps { onSuccess: () => void }

const INPUT = 'w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none bg-white/80 text-gray-800 font-semibold text-right placeholder:text-gray-400 transition-all';

export function LoginPage({ onSuccess }: LoginPageProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<Tab>('login');

  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [regName, setRegName]     = useState('');
  const [regUser, setRegUser]     = useState('');
  const [regPass, setRegPass]     = useState('');
  const [regConf, setRegConf]     = useState('');
  const [regAvatar, setRegAvatar] = useState('🦁');

  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [dragonMsg, setDragonMsg]   = useState('ברוך הבא! 🎓 בוא נלמד מתמטיקה ביחד!');
  const [dragonMood, setDragonMood] = useState<'happy'|'encouraging'|'neutral'>('happy');

  const switchTab = (t: Tab) => {
    setTab(t); setError('');
    if (t === 'register') { setDragonMsg('צור חשבון חדש ובוא נתחיל! 🌟'); setDragonMood('encouraging'); }
    else                  { setDragonMsg('ברוך הבא! 🎓 בוא נלמד מתמטיקה ביחד!'); setDragonMood('happy'); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser.trim() || !loginPass) { setError('נא למלא את כל השדות'); return; }
    setLoading(true); setError('');
    const r = await login(loginUser, loginPass);
    setLoading(false);
    if (r.success) { setDragonMsg('ברוך הבא! 🎉'); setDragonMood('happy'); setTimeout(onSuccess, 600); }
    else           { setError(r.error ?? 'שגיאה'); setDragonMsg('נסה שוב 💪'); setDragonMood('encouraging'); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = AuthService.validateRegistration(regUser, regPass, regConf, regName);
    if (err) { setError(err); setDragonMsg('בדוק את הפרטים 😊'); setDragonMood('encouraging'); return; }
    setLoading(true); setError('');
    const r = await register(regUser, regPass, regName, regAvatar);
    setLoading(false);
    if (r.success) { setDragonMsg('ברוך הבא! 🎊🌟'); setDragonMood('happy'); setTimeout(onSuccess, 600); }
    else           { setError(r.error ?? 'שגיאה'); setDragonMsg('נסה שם משתמש אחר 😅'); setDragonMood('encouraging'); }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-400 dark:from-indigo-950 dark:via-purple-950 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center gap-8">

        {/* Dragon */}
        <motion.div className="flex-shrink-0 flex flex-col items-center gap-4"
          initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <motion.div className="text-5xl font-black text-white drop-shadow-lg text-center"
            animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3, repeat: Infinity }}>
            🎓 מאמן מתמטיקה
          </motion.div>
          <DragonMascot mood={dragonMood} message={dragonMsg} />
        </motion.div>

        {/* Card */}
        <motion.div className="w-full max-w-md bg-white/20 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border-4 border-white/50"
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>

          {/* Tabs */}
          <div className="flex rounded-2xl overflow-hidden mb-8 border-4 border-white/50">
            {(['login','register'] as Tab[]).map(t => (
              <button key={t} onClick={() => switchTab(t)}
                className={`flex-1 py-3 text-lg font-black transition-all duration-300 ${tab === t ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'bg-white/30 text-white hover:bg-white/40'}`}>
                {t === 'login' ? '🔑 כניסה' : '✨ הרשמה'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Login */}
            {tab === 'login' && (
              <motion.form key="login" onSubmit={handleLogin} className="space-y-4"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <div>
                  <label className="block text-white font-bold mb-1">שם משתמש</label>
                  <input className={INPUT} placeholder="הכנס שם משתמש" value={loginUser} onChange={e => setLoginUser(e.target.value)} autoComplete="username" />
                </div>
                <div>
                  <label className="block text-white font-bold mb-1">סיסמה</label>
                  <input type="password" className={INPUT} placeholder="הכנס סיסמה" value={loginPass} onChange={e => setLoginPass(e.target.value)} autoComplete="current-password" />
                </div>
                {error && <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-100 border-2 border-red-400 rounded-xl px-4 py-2 text-red-700 font-bold text-center">❌ {error}</motion.div>}
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="w-full py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white text-xl font-black rounded-2xl shadow-xl border-4 border-yellow-300 disabled:opacity-60">
                  {loading ? '⏳ מתחבר...' : '🚀 כניסה!'}
                </motion.button>
                <p className="text-center text-white/80 text-sm">
                  אין לך חשבון?{' '}
                  <button type="button" onClick={() => switchTab('register')} className="text-yellow-300 font-black hover:underline">הירשם כאן</button>
                </p>
              </motion.form>
            )}

            {/* Register */}
            {tab === 'register' && (
              <motion.form key="register" onSubmit={handleRegister} className="space-y-3"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                <div>
                  <label className="block text-white font-bold mb-1">שם תצוגה</label>
                  <input className={INPUT} placeholder="איך לקרוא לך?" value={regName} onChange={e => setRegName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-white font-bold mb-1">שם משתמש</label>
                  <input className={INPUT} placeholder="אנגלית / עברית / מספרים" value={regUser} onChange={e => setRegUser(e.target.value)} dir="ltr" autoComplete="username" />
                </div>
                <div>
                  <label className="block text-white font-bold mb-1">סיסמה</label>
                  <input type="password" className={INPUT} placeholder="לפחות 4 תווים" value={regPass} onChange={e => setRegPass(e.target.value)} autoComplete="new-password" />
                </div>
                <div>
                  <label className="block text-white font-bold mb-1">אישור סיסמה</label>
                  <input type="password" className={INPUT} placeholder="חזור על הסיסמה" value={regConf} onChange={e => setRegConf(e.target.value)} autoComplete="new-password" />
                </div>
                <div>
                  <label className="block text-white font-bold mb-2">בחר אווטאר 🎭</label>
                  <div className="grid grid-cols-8 gap-1">
                    {AVATARS.map(em => (
                      <button key={em} type="button" onClick={() => setRegAvatar(em)}
                        className={`text-2xl p-1 rounded-xl transition-all ${regAvatar === em ? 'bg-yellow-300 scale-125 shadow-lg' : 'bg-white/30 hover:bg-white/50'}`}>
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
                {error && <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-100 border-2 border-red-400 rounded-xl px-4 py-2 text-red-700 font-bold text-center">❌ {error}</motion.div>}
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white text-xl font-black rounded-2xl shadow-xl border-4 border-yellow-300 disabled:opacity-60">
                  {loading ? '⏳ יוצר חשבון...' : '🌟 צור חשבון!'}
                </motion.button>
                <p className="text-center text-white/80 text-sm">
                  כבר יש לך חשבון?{' '}
                  <button type="button" onClick={() => switchTab('login')} className="text-yellow-300 font-black hover:underline">היכנס כאן</button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

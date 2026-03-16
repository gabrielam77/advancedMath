import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface UserAvatarProps {
  onProfileClick: () => void;
  onAdminClick: () => void;
}

export function UserAvatar({ onProfileClick, onAdminClick }: UserAvatarProps) {
  const { currentUser, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!currentUser) return null;

  return (
    <div ref={ref} className="relative">
      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-white/30 hover:bg-white/50 backdrop-blur-sm px-3 py-2 rounded-2xl border-2 border-white/60 shadow-lg transition-all">
        <span className="text-2xl">{currentUser.avatarEmoji}</span>
        <span className="text-white font-black text-sm hidden sm:block max-w-[120px] truncate">{currentUser.displayName}</span>
        <span className="text-white text-xs">{open ? '▲' : '▼'}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div dir="rtl"
            initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border-4 border-purple-300 overflow-hidden z-50">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 text-white text-center">
              <div className="text-3xl">{currentUser.avatarEmoji}</div>
              <div className="font-black truncate">{currentUser.displayName}</div>
              <div className="text-xs text-white/70">@{currentUser.username}</div>
            </div>
            <button onClick={() => { setOpen(false); onProfileClick(); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 text-gray-700 font-bold transition-colors">
              <span className="text-xl">👤</span> פרופיל שלי
            </button>
            <button onClick={() => { setOpen(false); onAdminClick(); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 font-bold transition-colors">
              <span className="text-xl">👥</span> ניהול משתמשים
            </button>
            <div className="border-t border-gray-100" />
            <button onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 font-bold transition-colors">
              <span className="text-xl">🚪</span> התנתק
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

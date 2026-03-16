import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { DeleteAccountModal } from './DeleteAccountModal';

const AVATARS = [
  '🦁','🐯','🐻','🦊','🐼','🐨','🦋','🐸',
  '🦄','🐉','🌟','🚀','🎮','🎨','⭐','🌈',
];

interface UserProfilePageProps {
  onBack: () => void;
}

export function UserProfilePage({ onBack }: UserProfilePageProps) {
  const { currentUser, updateUser, deleteAccount } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser?.displayName ?? '');
  const [avatar, setAvatar]           = useState(currentUser?.avatarEmoji ?? '🦁');
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!currentUser) return null;

  const handleSave = async () => {
    if (!displayName.trim() || displayName.trim().length < 2) return;
    setSaving(true);
    await updateUser({ displayName: displayName.trim(), avatarEmoji: avatar });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const joinDate = new Date(currentUser.createdAt).toLocaleDateString('he-IL', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-400 dark:from-indigo-950 dark:via-purple-950 dark:to-slate-950 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">

        {/* Card */}
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border-4 border-white/50 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}
              className="p-2 bg-white/30 hover:bg-white/50 rounded-xl text-white font-black text-xl">
              ← חזור
            </motion.button>
            <h1 className="text-3xl font-black text-white drop-shadow">👤 הפרופיל שלי</h1>
          </div>

          {/* Avatar preview */}
          <div className="flex justify-center">
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
              className="text-7xl bg-white/30 rounded-full p-4 shadow-xl border-4 border-white/60">
              {avatar}
            </motion.div>
          </div>

          {/* Join date */}
          <p className="text-center text-white/80 text-sm font-bold">הצטרפת ב: {joinDate}</p>
          <p className="text-center text-white/70 text-sm">@{currentUser.username}</p>

          {/* Display name */}
          <div>
            <label className="block text-white font-bold mb-2">שם תצוגה</label>
            <input className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none bg-white/80 text-gray-800 font-semibold text-right"
              value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={30} />
          </div>

          {/* Avatar picker */}
          <div>
            <label className="block text-white font-bold mb-2">אווטאר</label>
            <div className="grid grid-cols-8 gap-1">
              {AVATARS.map(em => (
                <button key={em} type="button" onClick={() => setAvatar(em)}
                  className={`text-2xl p-1 rounded-xl transition-all ${avatar === em ? 'bg-yellow-300 scale-125 shadow-lg' : 'bg-white/30 hover:bg-white/50'}`}>
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xl font-black rounded-2xl shadow-xl border-4 border-yellow-300 disabled:opacity-60">
            {saving ? '⏳ שומר...' : saved ? '✅ נשמר!' : '💾 שמור שינויים'}
          </motion.button>

          {/* Delete button */}
          <button onClick={() => setShowDeleteModal(true)}
            className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-600 font-black rounded-2xl border-2 border-red-300 transition-all">
            🗑️ מחק חשבון
          </button>
        </div>
      </motion.div>

      {showDeleteModal && (
        <DeleteAccountModal
          displayName={currentUser.displayName}
          onConfirm={async () => { await deleteAccount(); onBack(); }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

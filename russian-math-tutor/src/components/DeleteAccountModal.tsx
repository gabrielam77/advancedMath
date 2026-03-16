import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragonMascot } from './DragonMascot';

interface DeleteAccountModalProps {
  displayName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteAccountModal({ displayName, onConfirm, onCancel }: DeleteAccountModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onCancel}>
        <motion.div dir="rtl" onClick={e => e.stopPropagation()}
          initial={{ scale: 0.8, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 40 }}
          className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full border-4 border-red-300 text-center space-y-4">
          <DragonMascot mood="encouraging" message="אל תעזוב אותי... 😢" />
          <h2 className="text-2xl font-black text-gray-800">מחיקת חשבון</h2>
          <p className="text-gray-600 font-semibold">
            האם אתה בטוח שברצונך למחוק את החשבון של <span className="text-purple-600 font-black">{displayName}</span>?
          </p>
          <p className="text-red-500 text-sm font-bold">⚠️ כל הנתונים והסטטיסטיקות יימחקו לצמיתות!</p>
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 font-black rounded-2xl hover:from-gray-300 hover:to-gray-400 transition-all">
              ❌ ביטול
            </button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleConfirm} disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white font-black rounded-2xl shadow-lg hover:from-red-600 hover:to-rose-600 transition-all disabled:opacity-60">
              {loading ? '⏳...' : '🗑️ מחק'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DragonMascotProps {
  mood: 'happy' | 'encouraging' | 'neutral';
  message?: string;
}

export const DragonMascot: React.FC<DragonMascotProps> = ({ mood, message }) => {
  const animations = {
    happy: {
      y: [0, -20, 0, -15, 0],
      rotate: [0, 5, -5, 0],
      transition: { duration: 0.8, repeat: 2 }
    },
    encouraging: {
      x: [-5, 5, -5, 5, 0],
      transition: { duration: 0.5, repeat: 1 }
    },
    neutral: {
      y: [0, -5, 0],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const }
    }
  };

  const getMouthPath = () => {
    switch (mood) {
      case 'happy':
        return "M 80 80 Q 100 95 120 80"; // חיוך גדול
      case 'encouraging':
        return "M 80 85 Q 100 82 120 85"; // חיוך קטן ומעודד
      default:
        return "M 80 85 Q 100 85 120 85"; // ניטרלי
    }
  };

  return (
    <div className="relative inline-block">
      {/* בועת דיבור */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="absolute -top-24 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl px-6 py-4 shadow-2xl border-4 border-purple-400 z-10 min-w-[250px]"
          >
            <p className="text-lg font-black text-purple-800 text-center whitespace-normal">
              {message}
            </p>
            {/* חץ למטה */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[16px] border-t-white" />
            <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[18px] border-t-purple-400" style={{ zIndex: -1 }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* דרקון */}
      <motion.div
        animate={animations[mood]}
        className="relative dragon-mascot"
      >
        <svg width="200" height="200" viewBox="0 0 200 200" className="filter drop-shadow-lg">
          {/* כנפיים (רקע) */}
          <g className="dragon-wings">
            <ellipse cx="50" cy="110" rx="35" ry="45" fill="#D6BCFA" opacity="0.9" />
            <ellipse cx="150" cy="110" rx="35" ry="45" fill="#D6BCFA" opacity="0.9" />
          </g>

          {/* זנב */}
          <path 
            d="M 140 130 Q 165 135 175 115 Q 180 105 175 95" 
            stroke="#9F7AEA" 
            strokeWidth="12" 
            fill="none" 
            strokeLinecap="round"
          />
          <circle cx="175" cy="95" r="8" fill="#E9D8FD" />
          <circle cx="175" cy="95" r="5" fill="#9F7AEA" />

          {/* גוף הדרקון */}
          <ellipse cx="100" cy="120" rx="60" ry="55" fill="#9F7AEA" />
          <ellipse cx="100" cy="120" rx="50" ry="45" fill="#B794F4" />
          
          {/* רגליים */}
          <ellipse cx="80" cy="165" rx="12" ry="20" fill="#9F7AEA" />
          <ellipse cx="120" cy="165" rx="12" ry="20" fill="#9F7AEA" />
          <ellipse cx="80" cy="175" rx="15" ry="8" fill="#8B5CF6" />
          <ellipse cx="120" cy="175" rx="15" ry="8" fill="#8B5CF6" />

          {/* ראש */}
          <circle cx="100" cy="70" r="45" fill="#B794F4" />
          <circle cx="100" cy="70" r="38" fill="#C4B5FD" />
          
          {/* אוזניים/קרניים */}
          <polygon points="75,35 80,20 85,35" fill="#E9D8FD" stroke="#9F7AEA" strokeWidth="2" />
          <polygon points="115,35 120,20 125,35" fill="#E9D8FD" stroke="#9F7AEA" strokeWidth="2" />
          
          {/* עיניים */}
          <circle cx="85" cy="65" r="10" fill="white" />
          <circle cx="115" cy="65" r="10" fill="white" />
          <circle cx="87" cy="67" r="6" fill="black" />
          <circle cx="117" cy="67" r="6" fill="black" />
          
          {/* ניצוץ בעיניים */}
          <circle cx="89" cy="65" r="2" fill="white" />
          <circle cx="119" cy="65" r="2" fill="white" />
          
          {/* לחיים */}
          <circle cx="70" cy="80" r="8" fill="#FCA5A5" opacity="0.6" />
          <circle cx="130" cy="80" r="8" fill="#FCA5A5" opacity="0.6" />
          
          {/* אף */}
          <ellipse cx="100" cy="80" rx="8" ry="6" fill="#9F7AEA" />
          
          {/* פה */}
          <path 
            d={getMouthPath()} 
            stroke="#8B5CF6" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round"
          />
          
          {/* לשון (רק במצב שמח) */}
          {mood === 'happy' && (
            <ellipse cx="100" cy="90" rx="8" ry="6" fill="#FCA5A5" />
          )}

          {/* קשקשים על הגוף */}
          <circle cx="90" cy="110" r="4" fill="#E9D8FD" opacity="0.7" />
          <circle cx="110" cy="115" r="4" fill="#E9D8FD" opacity="0.7" />
          <circle cx="100" cy="130" r="4" fill="#E9D8FD" opacity="0.7" />
          
          {/* בטן */}
          <ellipse cx="100" cy="135" rx="35" ry="30" fill="#DDD6FE" opacity="0.6" />
        </svg>
      </motion.div>
    </div>
  );
};

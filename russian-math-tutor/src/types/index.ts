// Types for the Russian Math Tutor application

export interface Question {
  id: string;
  expression: string; // "2 + 1"
  correctAnswer: number;
  userAnswer?: number;
  isCorrect?: boolean;
}

export interface Session {
  currentLabel: 1 | 2;
  questions: Question[];
  currentQuestionIndex: number;
  errors: Question[];
  isComplete: boolean;
}

export interface VoiceConfig {
  lang: string;
  voice?: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface SessionState {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  currentQuestion?: Question;
  sessionData?: Session;
}

// Russian number mappings for speech recognition
export const RUSSIAN_NUMBERS: Record<string, number> = {
  'ноль': 0,
  'один': 1,
  'два': 2,
  'три': 3,
  'четыре': 4,
  'пять': 5,
  'шесть': 6,
  'семь': 7,
  'восемь': 8,
  'девять': 9,
  'десять': 10,
  'одиннадцать': 11,
  'двенадцать': 12,
  'тринадцать': 13,
  'четырнадцать': 14,
  'пятнадцать': 15,
  'шестнадцать': 16,
  'семнадцать': 17,
  'восемнадцать': 18,
  'девятнадцать': 19,
  'двадцать': 20
};
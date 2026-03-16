// Types for the Hebrew Math Tutor application

export enum QuestionCategory {
  ADDITION = 'addition',
  SUBTRACTION = 'subtraction',
  MULTIPLICATION = 'multiplication',
  DIVISION = 'division',
  MIXED = 'mixed'
}

export enum DifficultyLevel {
  EASY = 'easy',      // 1-10
  MEDIUM = 'medium',  // 1-20
  HARD = 'hard'       // 1-100
}

export interface Question {
  id: string;
  expression: string; // "2 + 1"
  correctAnswer: number;
  userAnswer?: number;
  isCorrect?: boolean;
  category?: QuestionCategory;
  difficulty?: DifficultyLevel;
}

export interface QuestionTemplate {
  id: string;
  category: QuestionCategory;
  difficulty: DifficultyLevel;
  expression: string;
  correctAnswer: number;
  hint?: string;
  tags?: string[];
  createdAt?: string;
}

export interface QuestionBank {
  version: string;
  questions: QuestionTemplate[];
  categories: Record<QuestionCategory, number>;
}

export interface Session {
  currentLabel: 1 | 2;
  questions: Question[];
  currentQuestionIndex: number;
  errors: Question[];
  isComplete: boolean;
  category?: QuestionCategory;
  difficulty?: DifficultyLevel;
  startTime?: string;
  endTime?: string;
}

export interface StudentProgress {
  totalQuestionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  categoriesProgress: Record<QuestionCategory, {
    attempted: number;
    correct: number;
    accuracy: number;
  }>;
  lastSessionDate: string;
  streak: number;
  sessionHistory: SessionSummary[];
}

export interface SessionSummary {
  id: string;
  date: string;
  category: QuestionCategory;
  difficulty: DifficultyLevel;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  duration: number;
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

// Hebrew number mappings for speech recognition
export const HEBREW_NUMBERS: Record<string, number> = {
  'אפס': 0,
  'אחד': 1,
  'שניים': 2,
  'שתיים': 2,
  'שלוש': 3,
  'שלושה': 3,
  'אַרבע': 4,
  'ארבע': 4,
  'ארבעה': 4,
  'חמש': 5,
  'חמישה': 5,
  'שש': 6,
  'שישה': 6,
  'שבע': 7,
  'שבעה': 7,
  'שמונה': 8,
  'תשע': 9,
  'תשעה': 9,
  'עשר': 10,
  'עשרה': 10,
  'אחת עשרה': 11,
  'אחד עשר': 11,
  'שתיים עשרה': 12,
  'שניים עשר': 12,
  'שלוש עשרה': 13,
  'שלושה עשר': 13,
  'ארבע עשרה': 14,
  'ארבעה עשר': 14,
  'חמש עשרה': 15,
  'חמישה עשר': 15,
  'שש עשרה': 16,
  'שישה עשר': 16,
  'שבע עשרה': 17,
  'שבעה עשר': 17,
  'שמונה עשרה': 18,
  'שמונה עשר': 18,
  'תשע עשרה': 19,
  'תשעה עשר': 19,
  'עשרים': 20
};
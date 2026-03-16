import { StudentProgress, SessionSummary, QuestionCategory, DifficultyLevel } from '../types';
import { StorageUtils, STORAGE_KEYS } from '../utils/storage';

export class ProgressService {
  private static instance: ProgressService;
  private progress: StudentProgress;

  private constructor() {
    this.progress = this.loadProgress();
  }

  public static getInstance(): ProgressService {
    if (!ProgressService.instance) {
      ProgressService.instance = new ProgressService();
    }
    return ProgressService.instance;
  }

  /**
   * Load progress from localStorage or initialize
   */
  private loadProgress(): StudentProgress {
    const stored = StorageUtils.get<StudentProgress>(STORAGE_KEYS.PROGRESS);
    
    if (stored) {
      return stored;
    }

    // Initialize new progress
    const progress: StudentProgress = {
      totalQuestionsAnswered: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      categoriesProgress: {
        [QuestionCategory.ADDITION]: { attempted: 0, correct: 0, accuracy: 0 },
        [QuestionCategory.SUBTRACTION]: { attempted: 0, correct: 0, accuracy: 0 },
        [QuestionCategory.MULTIPLICATION]: { attempted: 0, correct: 0, accuracy: 0 },
        [QuestionCategory.DIVISION]: { attempted: 0, correct: 0, accuracy: 0 },
        [QuestionCategory.MIXED]: { attempted: 0, correct: 0, accuracy: 0 },
      },
      lastSessionDate: new Date().toISOString(),
      streak: 0,
      sessionHistory: [],
    };

    this.saveProgress(progress);
    return progress;
  }

  /**
   * Save progress to localStorage
   */
  private saveProgress(progress: StudentProgress): boolean {
    return StorageUtils.set(STORAGE_KEYS.PROGRESS, progress);
  }

  /**
   * Record a question answer
   */
  public recordAnswer(category: QuestionCategory, isCorrect: boolean): void {
    this.progress.totalQuestionsAnswered++;
    
    if (isCorrect) {
      this.progress.correctAnswers++;
    } else {
      this.progress.incorrectAnswers++;
    }

    // Update category progress
    const categoryProgress = this.progress.categoriesProgress[category];
    categoryProgress.attempted++;
    if (isCorrect) {
      categoryProgress.correct++;
    }
    categoryProgress.accuracy = (categoryProgress.correct / categoryProgress.attempted) * 100;

    this.saveProgress(this.progress);
  }

  /**
   * Complete a session and update statistics
   */
  public completeSession(summary: Omit<SessionSummary, 'id'>): void {
    const sessionSummary: SessionSummary = {
      ...summary,
      id: this.generateSessionId(),
    };

    this.progress.sessionHistory.unshift(sessionSummary);
    
    // Keep only last 50 sessions
    if (this.progress.sessionHistory.length > 50) {
      this.progress.sessionHistory = this.progress.sessionHistory.slice(0, 50);
    }

    // Update streak
    this.updateStreak();
    
    // Update last session date
    this.progress.lastSessionDate = summary.date;

    this.saveProgress(this.progress);
  }

  /**
   * Update learning streak
   */
  private updateStreak(): void {
    if (this.progress.sessionHistory.length === 0) {
      this.progress.streak = 0;
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const lastSession = new Date(this.progress.lastSessionDate).toISOString().split('T')[0];
    
    const daysDiff = Math.floor(
      (new Date(today).getTime() - new Date(lastSession).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      // Same day, maintain streak
      return;
    } else if (daysDiff === 1) {
      // Consecutive day, increase streak
      this.progress.streak++;
    } else {
      // Missed days, reset streak
      this.progress.streak = 1;
    }
  }

  /**
   * Get current progress
   */
  public getProgress(): StudentProgress {
    return { ...this.progress };
  }

  /**
   * Get overall accuracy
   */
  public getOverallAccuracy(): number {
    if (this.progress.totalQuestionsAnswered === 0) {
      return 0;
    }
    return (this.progress.correctAnswers / this.progress.totalQuestionsAnswered) * 100;
  }

  /**
   * Get category accuracy
   */
  public getCategoryAccuracy(category: QuestionCategory): number {
    return this.progress.categoriesProgress[category].accuracy;
  }

  /**
   * Get weakest category
   */
  public getWeakestCategory(): QuestionCategory | null {
    let weakest: QuestionCategory | null = null;
    let lowestAccuracy = 100;

    Object.entries(this.progress.categoriesProgress).forEach(([category, progress]) => {
      if (progress.attempted > 0 && progress.accuracy < lowestAccuracy) {
        lowestAccuracy = progress.accuracy;
        weakest = category as QuestionCategory;
      }
    });

    return weakest;
  }

  /**
   * Get strongest category
   */
  public getStrongestCategory(): QuestionCategory | null {
    let strongest: QuestionCategory | null = null;
    let highestAccuracy = 0;

    Object.entries(this.progress.categoriesProgress).forEach(([category, progress]) => {
      if (progress.attempted > 0 && progress.accuracy > highestAccuracy) {
        highestAccuracy = progress.accuracy;
        strongest = category as QuestionCategory;
      }
    });

    return strongest;
  }

  /**
   * Get recent sessions
   */
  public getRecentSessions(count: number = 10): SessionSummary[] {
    return this.progress.sessionHistory.slice(0, count);
  }

  /**
   * Get sessions by category
   */
  public getSessionsByCategory(category: QuestionCategory): SessionSummary[] {
    return this.progress.sessionHistory.filter(s => s.category === category);
  }

  /**
   * Get sessions by difficulty
   */
  public getSessionsByDifficulty(difficulty: DifficultyLevel): SessionSummary[] {
    return this.progress.sessionHistory.filter(s => s.difficulty === difficulty);
  }

  /**
   * Get statistics summary
   */
  public getStatsSummary() {
    return {
      totalQuestions: this.progress.totalQuestionsAnswered,
      correctAnswers: this.progress.correctAnswers,
      incorrectAnswers: this.progress.incorrectAnswers,
      overallAccuracy: this.getOverallAccuracy(),
      streak: this.progress.streak,
      lastSession: this.progress.lastSessionDate,
      categoriesProgress: this.progress.categoriesProgress,
      weakestCategory: this.getWeakestCategory(),
      strongestCategory: this.getStrongestCategory(),
      totalSessions: this.progress.sessionHistory.length,
    };
  }

  /**
   * Reset all progress
   */
  public resetProgress(): boolean {
    this.progress = this.loadProgress();
    StorageUtils.remove(STORAGE_KEYS.PROGRESS);
    this.progress = this.loadProgress();
    return true;
  }

  /**
   * Export progress data
   */
  public exportProgress(): string {
    return JSON.stringify(this.progress, null, 2);
  }

  /**
   * Import progress data
   */
  public importProgress(jsonData: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonData) as StudentProgress;
      
      if (!data.categoriesProgress || !data.sessionHistory) {
        return { success: false, error: 'Invalid progress data format' };
      }

      this.progress = data;
      this.saveProgress(this.progress);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Get learning insights
   */
  public getInsights(): string[] {
    const insights: string[] = [];
    const weakest = this.getWeakestCategory();
    const strongest = this.getStrongestCategory();
    
    if (weakest) {
      insights.push(`נקודת חולשה: ${this.getCategoryNameHebrew(weakest)}`);
    }
    
    if (strongest) {
      insights.push(`נקודת חוזק: ${this.getCategoryNameHebrew(strongest)}`);
    }
    
    if (this.progress.streak > 0) {
      insights.push(`רצף למידה: ${this.progress.streak} ימים!`);
    }
    
    const accuracy = this.getOverallAccuracy();
    if (accuracy >= 90) {
      insights.push('עבודה מצוינת! דיוק גבוה מאוד');
    } else if (accuracy < 70) {
      insights.push('המשך להתאמן - אתה משתפר!');
    }

    return insights;
  }

  /**
   * Get category name in Hebrew
   */
  private getCategoryNameHebrew(category: QuestionCategory): string {
    const names: Record<QuestionCategory, string> = {
      [QuestionCategory.ADDITION]: 'חיבור',
      [QuestionCategory.SUBTRACTION]: 'חיסור',
      [QuestionCategory.MULTIPLICATION]: 'כפל',
      [QuestionCategory.DIVISION]: 'חילוק',
      [QuestionCategory.MIXED]: 'מעורב',
    };
    return names[category];
  }
}

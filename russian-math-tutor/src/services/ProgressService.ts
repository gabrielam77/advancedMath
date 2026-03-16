import { StudentProgress, SessionSummary, QuestionCategory, DifficultyLevel } from '../types';
import { StorageUtils, STORAGE_KEYS } from '../utils/storage';

export class ProgressService {
  private static instance: ProgressService;
  private progress: StudentProgress;
  private userId: string = 'guest';

  private constructor() {
    this.progress = this.loadFromStorage();
  }

  public static getInstance(): ProgressService {
    if (!ProgressService.instance) {
      ProgressService.instance = new ProgressService();
    }
    return ProgressService.instance;
  }

  // ─── User switching ────────────────────────────────────────────────────────

  /**
   * Called by AuthContext after login / logout.
   * Loads localStorage data immediately, then syncs from MongoDB in the background.
   */
  public switchUser(userId: string): void {
    this.userId = userId;
    this.progress = this.loadFromStorage();
    // Background MongoDB sync — doesn't block the UI
    this.syncFromMongoDB().catch(e => console.warn('Progress sync error:', e));
  }

  private async syncFromMongoDB(): Promise<void> {
    if (this.userId === 'guest') return;
    try {
      // Dynamic import avoids circular deps at init time
      const { UserService } = await import('./UserService');
      const remote = await UserService.getProgress(this.userId);
      if (remote) {
        this.progress = remote;
        // Keep localStorage in sync
        StorageUtils.set(this.storageKey(), remote);
      }
    } catch {
      // Network not available — localStorage data is fine
    }
  }

  // ─── Storage helpers ───────────────────────────────────────────────────────

  private storageKey(): string {
    return this.userId === 'guest' ? STORAGE_KEYS.PROGRESS : `mth_progress_${this.userId}`;
  }

  private loadFromStorage(): StudentProgress {
    const stored = StorageUtils.get<StudentProgress>(this.storageKey());
    if (stored) return stored;

    const fresh: StudentProgress = {
      totalQuestionsAnswered: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      categoriesProgress: {
        [QuestionCategory.ADDITION]:       { attempted: 0, correct: 0, accuracy: 0 },
        [QuestionCategory.SUBTRACTION]:    { attempted: 0, correct: 0, accuracy: 0 },
        [QuestionCategory.MULTIPLICATION]: { attempted: 0, correct: 0, accuracy: 0 },
        [QuestionCategory.DIVISION]:       { attempted: 0, correct: 0, accuracy: 0 },
        [QuestionCategory.MIXED]:          { attempted: 0, correct: 0, accuracy: 0 },
      },
      lastSessionDate: new Date().toISOString(),
      streak: 0,
      sessionHistory: [],
    };
    StorageUtils.set(this.storageKey(), fresh);
    return fresh;
  }

  /** Saves to localStorage immediately; fires MongoDB sync in the background. */
  private saveProgress(progress: StudentProgress): boolean {
    const ok = StorageUtils.set(this.storageKey(), progress);
    if (this.userId !== 'guest') {
      import('./UserService')
        .then(({ UserService }) => UserService.saveProgress(this.userId, progress))
        .catch(e => console.warn('MongoDB progress save failed:', e));
    }
    return ok;
  }

  // ─── Public API (unchanged surface) ───────────────────────────────────────

  public recordAnswer(category: QuestionCategory, isCorrect: boolean): void {
    this.progress.totalQuestionsAnswered++;
    if (isCorrect) {
      this.progress.correctAnswers++;
    } else {
      this.progress.incorrectAnswers++;
    }
    const cp = this.progress.categoriesProgress[category];
    cp.attempted++;
    if (isCorrect) cp.correct++;
    cp.accuracy = (cp.correct / cp.attempted) * 100;
    this.saveProgress(this.progress);
  }

  public completeSession(summary: Omit<SessionSummary, 'id'>): void {
    const sessionSummary: SessionSummary = { ...summary, id: this.generateSessionId() };
    this.progress.sessionHistory.unshift(sessionSummary);
    if (this.progress.sessionHistory.length > 50) {
      this.progress.sessionHistory = this.progress.sessionHistory.slice(0, 50);
    }
    // Update lastSessionDate BEFORE calling updateStreak so the persisted
    // value is always consistent with sessionHistory[0].
    this.progress.lastSessionDate = summary.date;
    this.updateStreak();
    this.saveProgress(this.progress);
  }

  private updateStreak(): void {
    const h = this.progress.sessionHistory;
    if (h.length === 0) { this.progress.streak = 0; return; }

    // First session ever — streak starts at 1 regardless of lastSessionDate
    // initialization (which defaults to "today" and would cause diff === 0
    // to leave streak at 0 with the old lastSessionDate-based approach).
    if (h.length === 1) { this.progress.streak = 1; return; }

    const latest   = new Date(h[0].date).toISOString().split('T')[0];
    const previous = new Date(h[1].date).toISOString().split('T')[0];
    const diff = Math.floor(
      (new Date(latest).getTime() - new Date(previous).getTime()) / 86_400_000
    );
    if      (diff === 0) { /* same-day session — streak count unchanged */ }
    else if (diff === 1) { this.progress.streak++; }
    else                 { this.progress.streak = 1; }
  }

  public getProgress(): StudentProgress { return { ...this.progress }; }

  public getOverallAccuracy(): number {
    if (this.progress.totalQuestionsAnswered === 0) return 0;
    return (this.progress.correctAnswers / this.progress.totalQuestionsAnswered) * 100;
  }

  public getCategoryAccuracy(category: QuestionCategory): number {
    return this.progress.categoriesProgress[category].accuracy;
  }

  public getWeakestCategory(): QuestionCategory | null {
    let weakest: QuestionCategory | null = null;
    let lowest = 100;
    Object.entries(this.progress.categoriesProgress).forEach(([cat, p]) => {
      if (p.attempted > 0 && p.accuracy < lowest) { lowest = p.accuracy; weakest = cat as QuestionCategory; }
    });
    return weakest;
  }

  public getStrongestCategory(): QuestionCategory | null {
    let strongest: QuestionCategory | null = null;
    let highest = 0;
    Object.entries(this.progress.categoriesProgress).forEach(([cat, p]) => {
      if (p.attempted > 0 && p.accuracy > highest) { highest = p.accuracy; strongest = cat as QuestionCategory; }
    });
    return strongest;
  }

  public getRecentSessions(count: number = 10): SessionSummary[] {
    return this.progress.sessionHistory.slice(0, count);
  }

  public getSessionsByCategory(category: QuestionCategory): SessionSummary[] {
    return this.progress.sessionHistory.filter(s => s.category === category);
  }

  public getSessionsByDifficulty(difficulty: DifficultyLevel): SessionSummary[] {
    return this.progress.sessionHistory.filter(s => s.difficulty === difficulty);
  }

  public getStatsSummary() {
    return {
      totalQuestions:     this.progress.totalQuestionsAnswered,
      correctAnswers:     this.progress.correctAnswers,
      incorrectAnswers:   this.progress.incorrectAnswers,
      overallAccuracy:    this.getOverallAccuracy(),
      streak:             this.progress.streak,
      lastSession:        this.progress.lastSessionDate,
      categoriesProgress: this.progress.categoriesProgress,
      weakestCategory:    this.getWeakestCategory(),
      strongestCategory:  this.getStrongestCategory(),
      totalSessions:      this.progress.sessionHistory.length,
    };
  }

  public resetProgress(): boolean {
    StorageUtils.remove(this.storageKey());
    this.progress = this.loadFromStorage();
    return true;
  }

  public exportProgress(): string { return JSON.stringify(this.progress, null, 2); }

  public importProgress(json: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(json) as StudentProgress;
      if (!data.categoriesProgress || !data.sessionHistory) {
        return { success: false, error: 'Invalid progress data format' };
      }
      this.progress = data;
      this.saveProgress(this.progress);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }

  public getInsights(): string[] {
    const insights: string[] = [];
    const weakest   = this.getWeakestCategory();
    const strongest = this.getStrongestCategory();
    if (weakest)   insights.push(`נקודת חולשה: ${this.categoryHebrew(weakest)}`);
    if (strongest) insights.push(`נקודת חוזק: ${this.categoryHebrew(strongest)}`);
    if (this.progress.streak > 0) insights.push(`רצף למידה: ${this.progress.streak} ימים!`);
    const acc = this.getOverallAccuracy();
    if (acc >= 90)      insights.push('עבודה מצוינת! דיוק גבוה מאוד');
    else if (acc < 70)  insights.push('המשך להתאמן - אתה משתפר!');
    return insights;
  }

  private categoryHebrew(cat: QuestionCategory): string {
    const map: Record<QuestionCategory, string> = {
      [QuestionCategory.ADDITION]: 'חיבור', [QuestionCategory.SUBTRACTION]: 'חיסור',
      [QuestionCategory.MULTIPLICATION]: 'כפל', [QuestionCategory.DIVISION]: 'חילוק',
      [QuestionCategory.MIXED]: 'מעורב',
    };
    return map[cat];
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}

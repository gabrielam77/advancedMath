import { QuestionTemplate, QuestionBank, QuestionCategory, DifficultyLevel } from '../types';
import { StorageUtils, STORAGE_KEYS } from '../utils/storage';
import defaultQuestions from '../data/questions.json';

export class QuestionDatabaseService {
  private static instance: QuestionDatabaseService;
  private questionBank: QuestionBank;

  private constructor() {
    this.questionBank = this.loadQuestions();
  }

  public static getInstance(): QuestionDatabaseService {
    if (!QuestionDatabaseService.instance) {
      QuestionDatabaseService.instance = new QuestionDatabaseService();
    }
    return QuestionDatabaseService.instance;
  }

  /**
   * Load questions from localStorage or use defaults
   */
  private loadQuestions(): QuestionBank {
    const stored = StorageUtils.get<QuestionBank>(STORAGE_KEYS.QUESTIONS);
    
    if (stored && stored.version === defaultQuestions.version) {
      return stored;
    }

    // Initialize with default questions
    const bank: QuestionBank = {
      version: defaultQuestions.version,
      questions: defaultQuestions.questions as QuestionTemplate[],
      categories: defaultQuestions.categories as Record<QuestionCategory, number>,
    };

    this.saveQuestions(bank);
    return bank;
  }

  /**
   * Save questions to localStorage
   */
  private saveQuestions(bank: QuestionBank): boolean {
    return StorageUtils.set(STORAGE_KEYS.QUESTIONS, bank);
  }

  /**
   * Get all questions
   */
  public getAllQuestions(): QuestionTemplate[] {
    return [...this.questionBank.questions];
  }

  /**
   * Get questions by category
   */
  public getQuestionsByCategory(category: QuestionCategory): QuestionTemplate[] {
    return this.questionBank.questions.filter(q => q.category === category);
  }

  /**
   * Get questions by difficulty
   */
  public getQuestionsByDifficulty(difficulty: DifficultyLevel): QuestionTemplate[] {
    return this.questionBank.questions.filter(q => q.difficulty === difficulty);
  }

  /**
   * Get questions by category and difficulty
   */
  public getQuestions(
    category?: QuestionCategory,
    difficulty?: DifficultyLevel
  ): QuestionTemplate[] {
    let questions = this.questionBank.questions;

    if (category) {
      questions = questions.filter(q => q.category === category);
    }

    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }

    return questions;
  }

  /**
   * Get random questions
   */
  public getRandomQuestions(
    count: number,
    category?: QuestionCategory,
    difficulty?: DifficultyLevel
  ): QuestionTemplate[] {
    const availableQuestions = this.getQuestions(category, difficulty);
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Get question by ID
   */
  public getQuestionById(id: string): QuestionTemplate | undefined {
    return this.questionBank.questions.find(q => q.id === id);
  }

  /**
   * Add new question
   */
  public addQuestion(question: Omit<QuestionTemplate, 'id' | 'createdAt'>): QuestionTemplate {
    const newQuestion: QuestionTemplate = {
      ...question,
      id: this.generateId(question.category, question.difficulty),
      createdAt: new Date().toISOString(),
    };

    this.questionBank.questions.push(newQuestion);
    this.updateCategoryCounts();
    this.saveQuestions(this.questionBank);

    return newQuestion;
  }

  /**
   * Update existing question
   */
  public updateQuestion(id: string, updates: Partial<QuestionTemplate>): boolean {
    const index = this.questionBank.questions.findIndex(q => q.id === id);
    
    if (index === -1) {
      return false;
    }

    this.questionBank.questions[index] = {
      ...this.questionBank.questions[index],
      ...updates,
      id, // Preserve original ID
    };

    this.updateCategoryCounts();
    this.saveQuestions(this.questionBank);

    return true;
  }

  /**
   * Delete question
   */
  public deleteQuestion(id: string): boolean {
    const initialLength = this.questionBank.questions.length;
    this.questionBank.questions = this.questionBank.questions.filter(q => q.id !== id);

    if (this.questionBank.questions.length < initialLength) {
      this.updateCategoryCounts();
      this.saveQuestions(this.questionBank);
      return true;
    }

    return false;
  }

  /**
   * Import questions from JSON
   */
  public importQuestions(jsonData: string): { success: boolean; count: number; error?: string } {
    try {
      const data = JSON.parse(jsonData) as QuestionBank;
      
      if (!data.questions || !Array.isArray(data.questions)) {
        return { success: false, count: 0, error: 'Invalid format: missing questions array' };
      }

      // Merge with existing questions (avoid duplicates)
      const existingIds = new Set(this.questionBank.questions.map(q => q.id));
      const newQuestions = data.questions.filter(q => !existingIds.has(q.id));

      this.questionBank.questions.push(...newQuestions);
      this.updateCategoryCounts();
      this.saveQuestions(this.questionBank);

      return { success: true, count: newQuestions.length };
    } catch (error) {
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Export questions to JSON
   */
  public exportQuestions(): string {
    return JSON.stringify(this.questionBank, null, 2);
  }

  /**
   * Reset to default questions
   */
  public resetToDefaults(): boolean {
    this.questionBank = {
      version: defaultQuestions.version,
      questions: defaultQuestions.questions as QuestionTemplate[],
      categories: defaultQuestions.categories as Record<QuestionCategory, number>,
    };

    return this.saveQuestions(this.questionBank);
  }

  /**
   * Get category statistics
   */
  public getCategoryStats(): Record<QuestionCategory, number> {
    return { ...this.questionBank.categories };
  }

  /**
   * Update category counts
   */
  private updateCategoryCounts(): void {
    const counts: Record<QuestionCategory, number> = {
      [QuestionCategory.ADDITION]: 0,
      [QuestionCategory.SUBTRACTION]: 0,
      [QuestionCategory.MULTIPLICATION]: 0,
      [QuestionCategory.DIVISION]: 0,
      [QuestionCategory.MIXED]: 0,
    };

    this.questionBank.questions.forEach(q => {
      counts[q.category]++;
    });

    this.questionBank.categories = counts;
  }

  /**
   * Generate unique ID for new question
   */
  private generateId(category: QuestionCategory, difficulty: DifficultyLevel): string {
    const prefix = category.substring(0, 3);
    const diff = difficulty.substring(0, 3);
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${diff}-${timestamp}-${random}`;
  }

  /**
   * Search questions by text
   */
  public searchQuestions(searchTerm: string): QuestionTemplate[] {
    const term = searchTerm.toLowerCase();
    return this.questionBank.questions.filter(q => 
      q.expression.toLowerCase().includes(term) ||
      q.category.toLowerCase().includes(term) ||
      q.difficulty.toLowerCase().includes(term) ||
      q.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  }

  /**
   * Get question count
   */
  public getQuestionCount(): number {
    return this.questionBank.questions.length;
  }
}

import { Question, Session, QuestionCategory, DifficultyLevel, QuestionTemplate } from '../types';
import { QuestionDatabaseService } from './QuestionDatabaseService';

export class QuestionService {
  private static db = QuestionDatabaseService.getInstance();

  public static createSession(
    category?: QuestionCategory,
    difficulty?: DifficultyLevel,
    questionCount: number = 10
  ): Session {
    const templates = this.db.getRandomQuestions(questionCount, category, difficulty);
    
    const questions: Question[] = templates.map((template, index) => ({
      id: template.id,
      expression: template.expression,
      correctAnswer: template.correctAnswer,
      category: template.category,
      difficulty: template.difficulty,
    }));

    return {
      currentLabel: 1, // Keep for backward compatibility
      questions,
      currentQuestionIndex: 0,
      errors: [],
      isComplete: false,
      category,
      difficulty,
      startTime: new Date().toISOString(),
    };
  }

  public static validateAnswer(question: Question, userAnswer: number): Question {
    const isCorrect = userAnswer === question.correctAnswer;
    return {
      ...question,
      userAnswer,
      isCorrect
    };
  }

  public static getNextQuestion(session: Session): Question | null {
    if (session.currentQuestionIndex >= session.questions.length) {
      return null;
    }
    return session.questions[session.currentQuestionIndex];
  }

  public static processAnswer(session: Session, userAnswer: number): Session {
    const currentQuestion = session.questions[session.currentQuestionIndex];
    const validatedQuestion = this.validateAnswer(currentQuestion, userAnswer);
    
    // Update the question in the session
    const updatedQuestions = [...session.questions];
    updatedQuestions[session.currentQuestionIndex] = validatedQuestion;

    // Add to errors if incorrect
    const updatedErrors = [...session.errors];
    if (!validatedQuestion.isCorrect) {
      updatedErrors.push(validatedQuestion);
    }

    // Move to next question
    const nextIndex = session.currentQuestionIndex + 1;
    const isComplete = nextIndex >= session.questions.length;

    const updatedSession: Session = {
      ...session,
      questions: updatedQuestions,
      currentQuestionIndex: nextIndex,
      errors: updatedErrors,
      isComplete,
    };

    if (isComplete) {
      updatedSession.endTime = new Date().toISOString();
    }

    return updatedSession;
  }

  public static getSessionSummary(session: Session): {
    totalQuestions: number;
    incorrectCount: number;
    errors: Question[];
  } {
    return {
      totalQuestions: session.questions.length,
      incorrectCount: session.errors.length,
      errors: session.errors
    };
  }

  public static formatQuestionForSpeech(question: Question): string {
    // Convert math expression to Hebrew speech
    const parts = question.expression.split(' ');
    let speech = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      
      if (part === '+') {
        speech += 'פלוס ';
      } else if (part === '-') {
        speech += 'מינוס ';
      } else if (part === '×' || part === '*') {
        speech += 'כפול ';
      } else if (part === '÷' || part === '/') {
        speech += 'חלקי ';
      } else {
        // It's a number
        const number = parseInt(part, 10);
        speech += this.numberToHebrewWord(number) + ' ';
      }
    }

    return speech.trim();
  }

  public static formatErrorsForSpeech(errors: Question[]): string {
    if (errors.length === 0) return '';

    let speech = 'התשובות הנכונות הן: ';
    
    errors.forEach((error, index) => {
      const questionSpeech = this.formatQuestionForSpeech(error);
      const answerSpeech = this.numberToHebrewWord(error.correctAnswer);
      
      speech += `${questionSpeech} שווה ${answerSpeech}`;
      
      if (index < errors.length - 1) {
        speech += ', ';
      }
    });

    return speech;
  }

  private static numberToHebrewWord(num: number): string {
    const hebrewNumbers: Record<number, string> = {
      0: 'אפס',
      1: 'אחד',
      2: 'שניים',
      3: 'שלוש',
      4: 'אַרבע',
      5: 'חמש',
      6: 'שש',
      7: 'שבע',
      8: 'שמונה',
      9: 'תשע',
      10: 'עשר',
      11: 'אחת עשרה',
      12: 'שתיים עשרה',
      13: 'שלוש עשרה',
      14: 'ארבע עשרה',
      15: 'חמש עשרה',
      16: 'שש עשרה',
      17: 'שבע עשרה',
      18: 'שמונה עשרה',
      19: 'תשע עשרה',
      20: 'עשרים',
      21: 'עשרים ואחד',
      30: 'שלושים',
      40: 'ארבעים',
      50: 'חמישים',
      60: 'שישים',
      70: 'שבעים',
      80: 'שמונים',
      90: 'תשעים',
      100: 'מאה'
    };

    if (hebrewNumbers[num]) {
      return hebrewNumbers[num];
    }

    // Handle numbers > 20
    if (num > 20 && num < 100) {
      const tens = Math.floor(num / 10) * 10;
      const ones = num % 10;
      if (ones === 0) {
        return hebrewNumbers[tens] || num.toString();
      }
      return `${hebrewNumbers[tens]} ו${hebrewNumbers[ones]}`;
    }

    return num.toString();
  }

  // New methods for enhanced functionality

  /**
   * Get available categories with question counts
   */
  public static getAvailableCategories(): Record<QuestionCategory, number> {
    return this.db.getCategoryStats();
  }

  /**
   * Get all questions from database
   */
  public static getAllQuestions(): QuestionTemplate[] {
    return this.db.getAllQuestions();
  }

  /**
   * Search questions
   */
  public static searchQuestions(term: string): QuestionTemplate[] {
    return this.db.searchQuestions(term);
  }

  /**
   * Create an adaptive session that prioritises previously-wrong questions.
   *
   * Up to 60 % of the session will be review questions (shuffled in among
   * fresh ones so the user can't tell which is which).  Questions that no
   * longer exist in the database are silently skipped.
   */
  public static createAdaptiveSession(
    weakQuestionIds: string[],
    category?: QuestionCategory,
    difficulty?: DifficultyLevel,
    questionCount: number = 10
  ): Session {
    // Resolve weak-question templates; filter to match current category/difficulty
    const weakTemplates = weakQuestionIds
      .map(id => this.db.getQuestionById(id))
      .filter((t): t is QuestionTemplate => t !== undefined)
      .filter(t => {
        if (category && t.category !== category) return false;
        if (difficulty && t.difficulty !== difficulty) return false;
        return true;
      });

    // Shuffle and cap at 60 % of the session
    const shuffledWeak = [...weakTemplates].sort(() => Math.random() - 0.5);
    const maxReview = Math.ceil(questionCount * 0.6);
    const reviewTemplates = shuffledWeak.slice(0, Math.min(maxReview, shuffledWeak.length));
    const usedIds = new Set(reviewTemplates.map(t => t.id));

    // Fill the rest with fresh questions
    const remainingCount = questionCount - reviewTemplates.length;
    const freshTemplates = remainingCount > 0
      ? this.db
          .getRandomQuestions(remainingCount + 5, category, difficulty)
          .filter(t => !usedIds.has(t.id))
          .slice(0, remainingCount)
      : [];

    // Interleave so review questions aren't bunched at the start
    const allTemplates = [...reviewTemplates, ...freshTemplates]
      .sort(() => Math.random() - 0.5);

    const reviewIdSet = new Set(reviewTemplates.map(t => t.id));
    const questions: Question[] = allTemplates.map(template => ({
      id: template.id,
      expression: template.expression,
      correctAnswer: template.correctAnswer,
      category: template.category,
      difficulty: template.difficulty,
      isReview: reviewIdSet.has(template.id),
    }));

    return {
      currentLabel: 1,
      questions,
      currentQuestionIndex: 0,
      errors: [],
      isComplete: false,
      category,
      difficulty,
      startTime: new Date().toISOString(),
    };
  }
}
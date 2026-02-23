import { Question, Session } from '../types';

export class QuestionService {
  // Label 1 questions: addition by 1
  private static readonly LABEL1_QUESTIONS = [
    { expression: '2 + 1', answer: 3 },
    { expression: '5 + 1', answer: 6 },
    { expression: '7 + 1', answer: 8 },
    { expression: '3 + 1', answer: 4 },
    { expression: '9 + 1', answer: 10 }
  ];

  // Label 2 questions: addition by 2
  private static readonly LABEL2_QUESTIONS = [
    { expression: '2 + 2', answer: 4 },
    { expression: '5 + 2', answer: 7 },
    { expression: '7 + 2', answer: 9 },
    { expression: '4 + 2', answer: 6 },
    { expression: '9 + 2', answer: 11 }
  ];

  public static createSession(label: 1 | 2): Session {
    const questionData = label === 1 ? this.LABEL1_QUESTIONS : this.LABEL2_QUESTIONS;
    
    const questions: Question[] = questionData.map((q, index) => ({
      id: `${label}-${index + 1}`,
      expression: q.expression,
      correctAnswer: q.answer
    }));

    return {
      currentLabel: label,
      questions,
      currentQuestionIndex: 0,
      errors: [],
      isComplete: false
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

    return {
      ...session,
      questions: updatedQuestions,
      currentQuestionIndex: nextIndex,
      errors: updatedErrors,
      isComplete
    };
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
    // Convert math expression to Russian speech
    const parts = question.expression.split(' ');
    let speech = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      
      if (part === '+') {
        speech += 'плюс ';
      } else if (part === '-') {
        speech += 'минус ';
      } else if (part === '×' || part === '*') {
        speech += 'умножить на ';
      } else if (part === '÷' || part === '/') {
        speech += 'разделить на ';
      } else {
        // It's a number
        const number = parseInt(part, 10);
        speech += this.numberToRussianWord(number) + ' ';
      }
    }

    return speech.trim();
  }

  public static formatErrorsForSpeech(errors: Question[]): string {
    if (errors.length === 0) return '';

    let speech = 'Правильные ответы: ';
    
    errors.forEach((error, index) => {
      const questionSpeech = this.formatQuestionForSpeech(error);
      const answerSpeech = this.numberToRussianWord(error.correctAnswer);
      
      speech += `${questionSpeech} равно ${answerSpeech}`;
      
      if (index < errors.length - 1) {
        speech += ', ';
      }
    });

    return speech;
  }

  private static numberToRussianWord(num: number): string {
    const russianNumbers: Record<number, string> = {
      0: 'ноль',
      1: 'один',
      2: 'два',
      3: 'три',
      4: 'четыре',
      5: 'пять',
      6: 'шесть',
      7: 'семь',
      8: 'восемь',
      9: 'девять',
      10: 'десять',
      11: 'одиннадцать',
      12: 'двенадцать',
      13: 'тринадцать',
      14: 'четырнадцать',
      15: 'пятнадцать',
      16: 'шестнадцать',
      17: 'семнадцать',
      18: 'восемнадцать',
      19: 'девятнадцать',
      20: 'двадцать'
    };

    return russianNumbers[num] || num.toString();
  }
}
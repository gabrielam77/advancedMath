import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { Question, Session, QuestionCategory, DifficultyLevel, SessionSummary } from '../types';
import { QuestionService } from '../services/QuestionService';
import { ProgressService } from '../services/ProgressService';
import { QuestionDisplay } from './QuestionDisplay';
import { ProgressBar } from './ProgressBar';
import { AnswerHistory } from './AnswerHistory';
import { DragonMascot } from './DragonMascot';
import { motion } from 'framer-motion';

interface VoiceControllerProps {
  category?: QuestionCategory;
  difficulty?: DifficultyLevel;
  questionCount: number;
  onSessionComplete: () => void;
  onBack: () => void;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({ 
  category, 
  difficulty, 
  questionCount, 
  onSessionComplete,
  onBack 
}) => {
  const progressService = ProgressService.getInstance();
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState<string>('לחצו על "התחל" כדי להתחיל');
  const [dragonMessage, setDragonMessage] = useState<string>('');
  const [dragonMood, setDragonMood] = useState<'happy' | 'encouraging' | 'neutral'>('neutral');
  
  const { isListening, isSpeaking, isSupported, speak, listen, parseNumber, stop, error } = useVoiceRecognition();

  // Declared here so it can be referenced in the useEffect below startSession.
  const startedRef = useRef(false);

  const startSession = useCallback(async () => {
    if (!isSupported) {
      setStatus('פונקציות קול לא נתמכות בדפדפן זה');
      return;
    }

    try {
      setIsSessionActive(true);
      setStatus('מתחילים שיעור...');
      
      const newSession = QuestionService.createSession(category, difficulty, questionCount);
      setSession(newSession);
      
      await speak('שלום! בואו נפתור תרגילים.');
      await askNextQuestion(newSession);
      
    } catch (err) {
      setStatus(`שגיאה: ${err instanceof Error ? err.message : 'שגיאה לא ידועה'}`);
      setIsSessionActive(false);
    }
  }, [isSupported, speak, category, difficulty, questionCount]);

  // Auto-start exactly once on mount. Using a ref prevents the effect from
  // re-firing if startSession's identity changes (it closes over props).
  useEffect(() => {
    if (!startedRef.current && !isSessionActive && !session) {
      startedRef.current = true;
      startSession();
    }
  }, [startSession, isSessionActive, session]); // eslint-disable-line react-hooks/exhaustive-deps

  const askNextQuestion = useCallback(async (currentSession: Session) => {
    const question = QuestionService.getNextQuestion(currentSession);
    
    if (!question) {
      // Ensure endTime is stamped so duration calculation in handleSessionComplete is non-zero.
      const completedSession: Session = currentSession.endTime
        ? currentSession
        : { ...currentSession, endTime: new Date().toISOString() };
      await handleSessionComplete(completedSession);
      return;
    }

    setCurrentQuestion(question);
    const questionText = QuestionService.formatQuestionForSpeech(question);
    
    try {
      await speak(questionText);
      setStatus(`שאלה: ${question.expression} = ?`);
      
      // Listen for answer
      const speechResult = await listen();
      const answer = parseNumber(speechResult);
      
      if (answer !== null) {
        await processAnswer(currentSession, answer);
      } else {
        setStatus('לא הצלחתי לזהות את התשובה. נסו שוב.');
        await speak('לא הצלחתי לזהות את התשובה. אנא חזרו על זה.');
        // Ask the same question again
        setTimeout(() => askNextQuestion(currentSession), 1000);
      }
      
    } catch (err) {
      setStatus(`שגיאה בעיבוד השאלה: ${err instanceof Error ? err.message : 'שגיאה לא ידועה'}`);
    }
  }, [speak, listen, parseNumber]);

  const processAnswer = useCallback(async (currentSession: Session, answer: number) => {
    const updatedSession = QuestionService.processAnswer(currentSession, answer);
    setSession(updatedSession);

    const currentQ = updatedSession.questions[updatedSession.currentQuestionIndex - 1];
    
    // Record answer in progress service
    if (currentQ.category) {
      progressService.recordAnswer(currentQ.category, currentQ.isCorrect || false);
    }

    if (currentQ.isCorrect) {
      setDragonMood('happy');
      setDragonMessage('כל הכבוד! אתה מדהים! 🎉');
      await speak('נכון! כל הכבוד!');
      setStatus(`נכון! ${currentQ.expression} = ${currentQ.correctAnswer}`);
    } else {
      setDragonMood('encouraging');
      setDragonMessage('לא נורא, פעם הבאה תצליח! אני מאמין בך! 💪');
      await speak('לא נכון. לא נורא, פעם הבאה תצליח!');
      setStatus(`לא נכון. ${currentQ.expression} = ${currentQ.correctAnswer}`);
    }

    // Continue with next question after a short pause
    setTimeout(() => {
      setDragonMessage(''); // נקה את ההודעה
      setDragonMood('neutral');
      if (updatedSession.isComplete) {
        handleSessionComplete(updatedSession);
      } else {
        askNextQuestion(updatedSession);
      }
    }, 3000);
  }, [speak]);

  const handleSessionComplete = useCallback(async (completedSession: Session) => {
    const summary = QuestionService.getSessionSummary(completedSession);
    
    // Save session to progress service
    const correctCount = summary.totalQuestions - summary.incorrectCount;
    const accuracy = (correctCount / summary.totalQuestions) * 100;
    const duration = completedSession.startTime && completedSession.endTime
      ? new Date(completedSession.endTime).getTime() - new Date(completedSession.startTime).getTime()
      : 0;

    const sessionSummary: Omit<SessionSummary, 'id'> = {
      date: new Date().toISOString(),
      category: completedSession.category || QuestionCategory.MIXED,
      difficulty: completedSession.difficulty || DifficultyLevel.EASY,
      totalQuestions: summary.totalQuestions,
      correctAnswers: correctCount,
      accuracy,
      duration,
    };

    progressService.completeSession(sessionSummary);

    // Report results
    const resultText = `בסך הכל היו ${summary.totalQuestions} שאלות, תשובות שגויות: ${summary.incorrectCount}`;
    await speak(resultText);
    setStatus(resultText);

    if (summary.incorrectCount > 0) {
      // Report errors
      const errorsText = QuestionService.formatErrorsForSpeech(summary.errors);
      await speak(errorsText);
    }

    await speak('עבדת מצוין!');
    setStatus('השיעור הסתיים! עבדת מצוין!');
    setIsSessionActive(false);
    
    // Call parent callback
    setTimeout(() => {
      onSessionComplete();
    }, 2000);
  }, [speak, onSessionComplete]);

  const stopSession = useCallback(() => {
    stop();
    setIsSessionActive(false);
    setSession(null);
    setCurrentQuestion(null);
    setStatus('השיעור הופסק');
  }, [stop]);

  if (!isSupported) {
    return (
      <div className="max-w-4xl mx-auto bg-red-50 dark:bg-red-900/20 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">שגיאה</h2>
        <p className="text-red-600 dark:text-red-300">
          הדפדפן שלך לא תומך בפונקציות קול. אנא נסה להשתמש ב-Chrome או דפדפן מודרני אחר.
        </p>
      </div>
    );
  }

  const answeredCount = session?.questions.filter(q => typeof q.userAnswer !== 'undefined').length || 0;
  const correctCount = session?.questions.filter(q => q.isCorrect === true).length || 0;
  const incorrectCount = session?.questions.filter(q => q.isCorrect === false).length || 0;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Session Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* דרקון ושאלה */}
        <div className="flex justify-center items-start gap-8 mb-8">
          <div className="flex-shrink-0">
            <DragonMascot mood={dragonMood} message={dragonMessage} />
          </div>
          {currentQuestion && (
            <div className="flex-1 max-w-md">
              <QuestionDisplay
                question={currentQuestion}
                questionNumber={session?.currentQuestionIndex || 1}
                totalQuestions={session?.questions.length || questionCount}
              />
            </div>
          )}
        </div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              מאמן מתמטיקה
            </h2>
            <button
              onClick={() => {
                stop();
                onBack();
              }}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
            >
              ← חזור
            </button>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-r-4 border-blue-500">
            <p className="text-gray-800 dark:text-gray-200">{status}</p>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-r-4 border-red-500">
              <p className="text-red-700 dark:text-red-300">שגיאה: {error}</p>
            </div>
          )}

          {/* Indicators */}
          <div className="flex gap-4 justify-center mt-6">
            {isListening && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-semibold"
              >
                🎤 מאזין...
              </motion.div>
            )}
            {isSpeaking && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-semibold"
              >
                🔊 מדבר...
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Progress Bar */}
        {session && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <ProgressBar
              current={answeredCount}
              total={session.questions.length}
              correctCount={correctCount}
              incorrectCount={incorrectCount}
            />
          </div>
        )}
      </div>

      {/* History Sidebar */}
      <div className="lg:col-span-1">
        {session && (
          <div className="h-[600px]">
            <AnswerHistory questions={session.questions} />
          </div>
        )}
      </div>
    </div>
  );
};
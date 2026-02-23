import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { Question, Session } from '../types';
import { QuestionService } from '../services/QuestionService';

interface VoiceControllerProps {
  onSessionComplete: () => void;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({ onSessionComplete }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState<string>('לחצו על "התחל" כדי להתחיל');
  
  const { isListening, isSpeaking, isSupported, speak, listen, parseNumber, stop, error } = useVoiceRecognition();

  const startSession = useCallback(async () => {
    if (!isSupported) {
      setStatus('פונקציות קול לא נתמכות בדפדפן זה');
      return;
    }

    try {
      setIsSessionActive(true);
      setStatus('מתחילים שיעור...');
      
      // Start with Label 1
      const newSession = QuestionService.createSession(1);
      setSession(newSession);
      
      await speak('שלום! בואו נפתור תרגילים.');
      await askNextQuestion(newSession);
      
    } catch (err) {
      setStatus(`שגיאה: ${err instanceof Error ? err.message : 'שגיאה לא ידועה'}`);
      setIsSessionActive(false);
    }
  }, [isSupported, speak]);

  const askNextQuestion = useCallback(async (currentSession: Session) => {
    const question = QuestionService.getNextQuestion(currentSession);
    
    if (!question) {
      await handleSessionComplete(currentSession);
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
    
    if (currentQ.isCorrect) {
      await speak('נכון!');
      setStatus(`נכון! ${currentQ.expression} = ${currentQ.correctAnswer}`);
    } else {
      await speak(`לא נכון. התשובה הנכונה היא: ${QuestionService.formatQuestionForSpeech({ ...currentQ, expression: `${currentQ.expression} = ${currentQ.correctAnswer}` })}`);
      setStatus(`לא נכון. ${currentQ.expression} = ${currentQ.correctAnswer}`);
    }

    // Continue with next question after a short pause
    setTimeout(() => {
      if (updatedSession.isComplete) {
        handleSessionComplete(updatedSession);
      } else {
        askNextQuestion(updatedSession);
      }
    }, 2000);
  }, [speak]);

  const handleSessionComplete = useCallback(async (completedSession: Session) => {
    const summary = QuestionService.getSessionSummary(completedSession);
    
    // Report results
    const resultText = `בסך הכל היו ${summary.totalQuestions} שאלות, תשובות שגויות: ${summary.incorrectCount}`;
    await speak(resultText);
    setStatus(resultText);

    if (summary.incorrectCount > 0) {
      // Report errors and restart current label
      const errorsText = QuestionService.formatErrorsForSpeech(summary.errors);
      await speak(errorsText);
      await speak('חוזרים על זה.');
      
      // Restart current label
      setTimeout(() => {
        const newSession = QuestionService.createSession(completedSession.currentLabel);
        setSession(newSession);
        askNextQuestion(newSession);
      }, 2000);
      
    } else {
      // Move to next label or complete
      if (completedSession.currentLabel === 1) {
        await speak('עוברים לשלב הבא.');
        setTimeout(() => {
          const newSession = QuestionService.createSession(2);
          setSession(newSession);
          askNextQuestion(newSession);
        }, 2000);
      } else {
        // All done!
        await speak('עבדת מצוין!');
        setStatus('השיעור הסתיים! עבדת מצוין!');
        setIsSessionActive(false);
        onSessionComplete();
      }
    }
  }, [speak, onSessionComplete]);

  const stopSession = useCallback(() => {
    stop();
    setIsSessionActive(false);
    setSession(null);
    setCurrentQuestion(null);
    setStatus('השיעור הופסק');
  }, [stop]);

  const historyContainerRef = useRef<HTMLDivElement | null>(null);
  const answeredQuestions = useMemo(() => {
    if (!session) return [] as Question[];
    return session.questions.filter(q => typeof q.userAnswer !== 'undefined');
  }, [session]);

  useEffect(() => {
    if (historyContainerRef.current) {
      historyContainerRef.current.scrollTop = historyContainerRef.current.scrollHeight;
    }
  }, [answeredQuestions.length]);

  if (!isSupported) {
    return (
      <div className="voice-controller error">
        <h2>שגיאה</h2>
        <p>הדפדפן שלך לא תומך בפונקציות קול. אנא נסה להשתמש ב-Chrome או דפדפן מודרני אחר.</p>
      </div>
    );
  }

  return (
    <div className="voice-controller">
      <div className="status-section">
        <h2>מאמן מתמטיקה</h2>
        <p className="status">{status}</p>
        {error && <p className="error">שגיאה: {error}</p>}
      </div>

      <div className="controls">
        {!isSessionActive ? (
          <button 
            onClick={startSession}
            className="start-button"
            disabled={isSpeaking}
          >
            התחל
          </button>
        ) : (
          <button 
            onClick={stopSession}
            className="stop-button"
          >
            עצור
          </button>
        )}
      </div>

      <div className="indicators">
        {isListening && <div className="indicator listening">🎤 מאזין...</div>}
        {isSpeaking && <div className="indicator speaking">🔊 מדבר...</div>}
      </div>

      {session && (
        <div className="session-info">
          <p>רמה: {session.currentLabel}</p>
          <p>שאלה: {session.currentQuestionIndex + 1} מתוך {session.questions.length}</p>
          {currentQuestion && (
            <div className="current-question">
              <h3>{currentQuestion.expression} = ?</h3>
            </div>
          )}

          <div className="answer-history" ref={historyContainerRef} aria-label="היסטוריית תשובות">
            <h4>היסטוריית תשובות</h4>
            {answeredQuestions.length === 0 ? (
              <p className="answer-history-empty">אין תשובות עדיין</p>
            ) : (
              <ul className="answer-list">
                {answeredQuestions.map((q) => (
                  <li key={q.id} className={`answer-item ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                    <span className="answer-expression">{q.expression}</span>
                    <span className="answer-user">התשובה שלך: {String(q.userAnswer)}</span>
                    <span className="answer-result">{q.isCorrect ? '✔ נכון' : `✘ התשובה הנכונה: ${q.correctAnswer}`}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
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
  const [status, setStatus] = useState<string>('Нажмите "Начать" для запуска');
  
  const { isListening, isSpeaking, isSupported, speak, listen, parseNumber, stop, error } = useVoiceRecognition();

  const startSession = useCallback(async () => {
    if (!isSupported) {
      setStatus('Голосовые функции не поддерживаются в этом браузере');
      return;
    }

    try {
      setIsSessionActive(true);
      setStatus('Начинаем урок...');
      
      // Start with Label 1
      const newSession = QuestionService.createSession(1);
      setSession(newSession);
      
      await speak('Привет! Давайте решать примеры.');
      await askNextQuestion(newSession);
      
    } catch (err) {
      setStatus(`Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
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
      setStatus(`Вопрос: ${question.expression} = ?`);
      
      // Listen for answer
      const speechResult = await listen();
      const answer = parseNumber(speechResult);
      
      if (answer !== null) {
        await processAnswer(currentSession, answer);
      } else {
        setStatus('Не удалось распознать ответ. Попробуйте еще раз.');
        await speak('Не удалось распознать ответ. Повторите, пожалуйста.');
        // Ask the same question again
        setTimeout(() => askNextQuestion(currentSession), 1000);
      }
      
    } catch (err) {
      setStatus(`Ошибка при обработке вопроса: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    }
  }, [speak, listen, parseNumber]);

  const processAnswer = useCallback(async (currentSession: Session, answer: number) => {
    const updatedSession = QuestionService.processAnswer(currentSession, answer);
    setSession(updatedSession);

    const currentQ = updatedSession.questions[updatedSession.currentQuestionIndex - 1];
    
    if (currentQ.isCorrect) {
      await speak('Правильно!');
      setStatus(`Правильно! ${currentQ.expression} = ${currentQ.correctAnswer}`);
    } else {
      await speak(`Неправильно. Правильный ответ: ${QuestionService.formatQuestionForSpeech({ ...currentQ, expression: `${currentQ.expression} = ${currentQ.correctAnswer}` })}`);
      setStatus(`Неправильно. ${currentQ.expression} = ${currentQ.correctAnswer}`);
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
    const resultText = `Всего было ${summary.totalQuestions} вопросов, неправильных ответов: ${summary.incorrectCount}`;
    await speak(resultText);
    setStatus(resultText);

    if (summary.incorrectCount > 0) {
      // Report errors and restart current label
      const errorsText = QuestionService.formatErrorsForSpeech(summary.errors);
      await speak(errorsText);
      await speak('Повторяем.');
      
      // Restart current label
      setTimeout(() => {
        const newSession = QuestionService.createSession(completedSession.currentLabel);
        setSession(newSession);
        askNextQuestion(newSession);
      }, 2000);
      
    } else {
      // Move to next label or complete
      if (completedSession.currentLabel === 1) {
        await speak('Переходим к следующему уровню.');
        setTimeout(() => {
          const newSession = QuestionService.createSession(2);
          setSession(newSession);
          askNextQuestion(newSession);
        }, 2000);
      } else {
        // All done!
        await speak('Ты хорошо поработал!');
        setStatus('Урок завершен! Ты хорошо поработал!');
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
    setStatus('Урок остановлен');
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
        <h2>Ошибка</h2>
        <p>Ваш браузер не поддерживает голосовые функции. Попробуйте использовать Chrome или другой современный браузер.</p>
      </div>
    );
  }

  return (
    <div className="voice-controller">
      <div className="status-section">
        <h2>Математический тренажер</h2>
        <p className="status">{status}</p>
        {error && <p className="error">Ошибка: {error}</p>}
      </div>

      <div className="controls">
        {!isSessionActive ? (
          <button 
            onClick={startSession}
            className="start-button"
            disabled={isSpeaking}
          >
            Начать
          </button>
        ) : (
          <button 
            onClick={stopSession}
            className="stop-button"
          >
            Остановить
          </button>
        )}
      </div>

      <div className="indicators">
        {isListening && <div className="indicator listening">🎤 Слушаю...</div>}
        {isSpeaking && <div className="indicator speaking">🔊 Говорю...</div>}
      </div>

      {session && (
        <div className="session-info">
          <p>Уровень: {session.currentLabel}</p>
          <p>Вопрос: {session.currentQuestionIndex + 1} из {session.questions.length}</p>
          {currentQuestion && (
            <div className="current-question">
              <h3>{currentQuestion.expression} = ?</h3>
            </div>
          )}

          <div className="answer-history" ref={historyContainerRef} aria-label="История ответов">
            <h4>История ответов</h4>
            {answeredQuestions.length === 0 ? (
              <p className="answer-history-empty">Пока нет ответов</p>
            ) : (
              <ul className="answer-list">
                {answeredQuestions.map((q) => (
                  <li key={q.id} className={`answer-item ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                    <span className="answer-expression">{q.expression}</span>
                    <span className="answer-user">Ваш ответ: {String(q.userAnswer)}</span>
                    <span className="answer-result">{q.isCorrect ? '✔ Верно' : `✘ Правильно: ${q.correctAnswer}`}</span>
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
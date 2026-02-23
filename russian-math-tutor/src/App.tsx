import React, { useState } from 'react';
import './App.css';
import { VoiceController } from './components/VoiceController';

function App() {
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const handleSessionComplete = () => {
    setSessionsCompleted(prev => prev + 1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎓 Математический тренажер</h1>
        <p>Голосовой помощник для изучения математики</p>
        {sessionsCompleted > 0 && (
          <p className="sessions-counter">
            Завершено сессий: {sessionsCompleted}
          </p>
        )}
      </header>
      
      <main className="App-main">
        <VoiceController onSessionComplete={handleSessionComplete} />
      </main>

      <footer className="App-footer">
        <p>
          Говорите четко и ясно. Убедитесь, что микрофон включен.
        </p>
      </footer>
    </div>
  );
}

export default App;
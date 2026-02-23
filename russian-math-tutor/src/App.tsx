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
        <h1>🎓 מאמן מתמטיקה</h1>
        <p>עוזר קולי ללימוד מתמטיקה</p>
        {sessionsCompleted > 0 && (
          <p className="sessions-counter">
            סשנים שהושלמו: {sessionsCompleted}
          </p>
        )}
      </header>
      
      <main className="App-main">
        <VoiceController onSessionComplete={handleSessionComplete} />
      </main>

      <footer className="App-footer">
        <p>
          דברו בבירור ובבהירות. ודאו שהמיקרופון מופעל.
        </p>
      </footer>
    </div>
  );
}

export default App;
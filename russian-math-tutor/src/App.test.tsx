/**
 * Smoke test: App renders without crashing and shows the login page first.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import App from './App';

Object.defineProperty(window, 'SpeechRecognition', { value: undefined, writable: true });
Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined, writable: true });

function WrappedApp() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  );
}

test('App renders login page on first load', () => {
  render(<WrappedApp />);
  const loginElements = screen.getAllByText(/כניסה/i);
  expect(loginElements.length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText(/🔑 כניסה/)).toBeInTheDocument();
});

test('App renders registration tab', () => {
  render(<WrappedApp />);
  expect(screen.getByText(/✨ הרשמה/)).toBeInTheDocument();
});

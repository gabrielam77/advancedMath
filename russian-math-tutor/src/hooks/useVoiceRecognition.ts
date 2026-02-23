import { useState, useCallback, useRef } from 'react';
import { VoiceService } from '../services/VoiceService';

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  speak: (text: string) => Promise<void>;
  listen: () => Promise<string>;
  parseNumber: (speech: string) => number | null;
  stop: () => void;
  error: string | null;
}

export const useVoiceRecognition = (): UseVoiceRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const voiceServiceRef = useRef<VoiceService | null>(null);

  // Initialize voice service
  if (!voiceServiceRef.current) {
    voiceServiceRef.current = new VoiceService();
  }

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!voiceServiceRef.current) return;

    try {
      setError(null);
      setIsSpeaking(true);
      await voiceServiceRef.current.speak(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speech synthesis failed');
      throw err;
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const listen = useCallback(async (): Promise<string> => {
    if (!voiceServiceRef.current) {
      throw new Error('Voice service not available');
    }

    try {
      setError(null);
      setIsListening(true);
      const result = await voiceServiceRef.current.listen();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speech recognition failed');
      throw err;
    } finally {
      setIsListening(false);
    }
  }, []);

  const parseNumber = useCallback((speech: string): number | null => {
    if (!voiceServiceRef.current) return null;
    return voiceServiceRef.current.parseRussianNumber(speech);
  }, []);

  const stop = useCallback(() => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stop();
    }
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  const isSupported = voiceServiceRef.current?.isSupported() ?? false;

  return {
    isListening,
    isSpeaking,
    isSupported,
    speak,
    listen,
    parseNumber,
    stop,
    error
  };
};
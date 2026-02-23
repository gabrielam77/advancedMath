import { VoiceConfig, HEBREW_NUMBERS } from '../types';

export class VoiceService {
  private synthesis: SpeechSynthesis;
  private recognition: SpeechRecognition | null = null;
  private config: VoiceConfig;
  private hebrewVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.config = {
      lang: 'he-IL',
      rate: 0.8, // Slower for learning
      pitch: 1.0,
      volume: 1.0
    };
    
    this.initializeRecognition();
    this.loadHebrewVoice();
  }

  private initializeRecognition(): void {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new SpeechRecognition();
    }

    if (this.recognition) {
      this.recognition.lang = 'he-IL';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
    }
  }

  private loadHebrewVoice(): void {
    const loadVoices = () => {
      const voices = this.synthesis.getVoices();
      this.hebrewVoice = voices.find(voice => 
        voice.lang.startsWith('he') || 
        voice.name.toLowerCase().includes('hebrew')
      ) || null;
    };

    loadVoices();
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoices;
    }
  }

  public speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!text.trim()) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.config.lang;
      utterance.rate = this.config.rate;
      utterance.pitch = this.config.pitch;
      utterance.volume = this.config.volume;

      if (this.hebrewVoice) {
        utterance.voice = this.hebrewVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      this.synthesis.speak(utterance);
    });
  }

  public listen(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      this.recognition.onresult = (event) => {
        const result = event.results[0][0].transcript.toLowerCase().trim();
        resolve(result);
      };

      this.recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        // If no result was captured, resolve with empty string
        setTimeout(() => resolve(''), 100);
      };

      try {
        this.recognition.start();
      } catch (error) {
        reject(new Error('Failed to start speech recognition'));
      }
    });
  }

  public parseHebrewNumber(speech: string): number | null {
    const cleaned = speech.toLowerCase().trim();
    
    // Direct lookup in Hebrew numbers
    if (HEBREW_NUMBERS[cleaned]) {
      return HEBREW_NUMBERS[cleaned];
    }

    // Try to parse as Arabic numeral
    const numericValue = parseInt(cleaned, 10);
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 20) {
      return numericValue;
    }

    // Handle partial matches or variations
    for (const [hebrew, number] of Object.entries(HEBREW_NUMBERS)) {
      if (cleaned.includes(hebrew) || hebrew.includes(cleaned)) {
        return number;
      }
    }

    return null;
  }

  public stop(): void {
    this.synthesis.cancel();
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  public isSupported(): boolean {
    return !!(this.synthesis && this.recognition);
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices().filter(voice => 
      voice.lang.startsWith('he')
    );
  }

  public setVoice(voice: SpeechSynthesisVoice): void {
    this.hebrewVoice = voice;
  }

  public updateConfig(newConfig: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
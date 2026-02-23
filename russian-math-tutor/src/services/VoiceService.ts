import { VoiceConfig, RUSSIAN_NUMBERS } from '../types';

export class VoiceService {
  private synthesis: SpeechSynthesis;
  private recognition: SpeechRecognition | null = null;
  private config: VoiceConfig;
  private russianVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.config = {
      lang: 'ru-RU',
      rate: 0.8, // Slower for learning
      pitch: 1.0,
      volume: 1.0
    };
    
    this.initializeRecognition();
    this.loadRussianVoice();
  }

  private initializeRecognition(): void {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new SpeechRecognition();
    }

    if (this.recognition) {
      this.recognition.lang = 'ru-RU';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
    }
  }

  private loadRussianVoice(): void {
    const loadVoices = () => {
      const voices = this.synthesis.getVoices();
      this.russianVoice = voices.find(voice => 
        voice.lang.startsWith('ru') || 
        voice.name.toLowerCase().includes('russian')
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

      if (this.russianVoice) {
        utterance.voice = this.russianVoice;
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

  public parseRussianNumber(speech: string): number | null {
    const cleaned = speech.toLowerCase().trim();
    
    // Direct lookup in Russian numbers
    if (RUSSIAN_NUMBERS[cleaned]) {
      return RUSSIAN_NUMBERS[cleaned];
    }

    // Try to parse as Arabic numeral
    const numericValue = parseInt(cleaned, 10);
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 20) {
      return numericValue;
    }

    // Handle partial matches or variations
    for (const [russian, number] of Object.entries(RUSSIAN_NUMBERS)) {
      if (cleaned.includes(russian) || russian.includes(cleaned)) {
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
      voice.lang.startsWith('ru')
    );
  }

  public setVoice(voice: SpeechSynthesisVoice): void {
    this.russianVoice = voice;
  }

  public updateConfig(newConfig: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
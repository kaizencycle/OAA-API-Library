import { useState, useEffect, useCallback } from 'react';

/**
 * useSpeechRecognition Hook
 * 
 * Provides browser-native speech recognition for voice input.
 * Uses the Web Speech API (webkitSpeechRecognition or SpeechRecognition).
 * 
 * @param onResult - Callback function called with transcribed text
 * @returns Object with: supported (boolean), listening (boolean), start (function), stop (function)
 * 
 * @example
 * ```tsx
 * const { supported, listening, start } = useSpeechRecognition((text) => {
 *   console.log('User said:', text);
 *   sendToJade(text);
 * });
 * 
 * return (
 *   <button onClick={start} disabled={!supported || listening}>
 *     {listening ? 'Listening...' : 'Speak'}
 *   </button>
 * );
 * ```
 */
export function useSpeechRecognition(onResult: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Check for browser support on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const isSupported = 
      'webkitSpeechRecognition' in window || 
      'SpeechRecognition' in window;
    
    setSupported(isSupported);
  }, []);

  const start = useCallback(() => {
    if (!supported || listening) return;

    const SR: any =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) return;

    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setListening(true);
    };

    rec.onend = () => {
      setListening(false);
      setRecognition(null);
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
      setRecognition(null);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      console.log(`Recognized: "${transcript}" (confidence: ${(confidence * 100).toFixed(1)}%)`);
      onResult(transcript);
    };

    setRecognition(rec);
    rec.start();
  }, [supported, listening, onResult]);

  const stop = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  return { supported, listening, start, stop };
}

/**
 * useTextToSpeech Hook
 * 
 * Provides browser-native text-to-speech synthesis.
 * Uses the Web Speech API (speechSynthesis).
 * 
 * @returns Object with: supported (boolean), speaking (boolean), speak (function), cancel (function)
 * 
 * @example
 * ```tsx
 * const { speaking, speak, cancel } = useTextToSpeech();
 * 
 * // Speak Jade's response
 * speak("I see a pattern forming in your cycles...");
 * ```
 */
export function useTextToSpeech() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSupported('speechSynthesis' in window);
  }, []);

  const speak = useCallback((text: string, options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voiceName?: string;
  }) => {
    if (!supported || typeof window === 'undefined') return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = options?.rate ?? 0.95;
    utterance.pitch = options?.pitch ?? 1.1;
    utterance.volume = options?.volume ?? 1.0;
    utterance.lang = 'en-US';

    // Try to find a preferred voice
    if (options?.voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => 
        v.name.toLowerCase().includes(options.voiceName!.toLowerCase())
      );
      if (voice) utterance.voice = voice;
    } else {
      // Default: try to find a feminine voice for Jade
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.toLowerCase().includes('samantha') || 
        v.name.toLowerCase().includes('victoria') ||
        v.name.toLowerCase().includes('karen') ||
        (v.name.toLowerCase().includes('female') && v.lang.startsWith('en'))
      );
      if (preferredVoice) utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [supported]);

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  return { supported, speaking, speak, cancel };
}

export default useSpeechRecognition;

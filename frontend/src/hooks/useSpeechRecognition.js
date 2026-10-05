import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeechRecognition({ onResult, lang = 'en-US' } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
      if (onResult && event.results[0].isFinal) {
        onResult(currentTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.warn('[SpeechRecognition Error]', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied by user or browser.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please speak clearly into the microphone.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [isSupported, lang, onResult]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Web Speech API is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    setTranscript('');
    setError(null);
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.warn('Recognition start exception:', err);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
  };
}

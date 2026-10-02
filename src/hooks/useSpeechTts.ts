import { useState, useEffect, useRef, useCallback } from 'react';
import {
  findClosestVoice,
  sanitizeMarkdownForSpeech,
  unlockAudioSession,
  LANGUAGE_LOCALES,
} from '../utils/speechTts';

export interface UseSpeechTtsOptions {
  langCode: string;
  guideTitle: string;
}

export function useSpeechTts({ langCode, guideTitle }: UseSpeechTtsOptions) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [activeVoice, setActiveVoice] = useState<SpeechSynthesisVoice | null>(null);

  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices asynchronously
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      const matched = findClosestVoice(langCode, available);
      setActiveVoice(matched);
    };

    updateVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [langCode]);

  // Stop playback when language changes
  useEffect(() => {
    stop();
    // Update matched voice for new language
    if (voices.length > 0) {
      const matched = findClosestVoice(langCode, voices);
      setActiveVoice(matched);
    }
  }, [langCode]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Configure MediaSession for background audio & OS lockscreen controls
  const updateMediaSession = useCallback(
    (actionState: 'playing' | 'paused' | 'none') => {
      if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

      const langInfo = LANGUAGE_LOCALES[langCode];
      navigator.mediaSession.metadata = new MediaMetadata({
        title: guideTitle,
        artist: `KayBiT_Util · ${langInfo?.name || langCode} Narration`,
        album: 'Camera & GPS Utility Architectural Guide',
      });

      navigator.mediaSession.playbackState = actionState;

      try {
        navigator.mediaSession.setActionHandler('play', () => {
          resume();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          pause();
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          stop();
        });
      } catch {
        // Some handlers might not be supported on older webviews
      }
    },
    [guideTitle, langCode]
  );

  // Play a specific chunk
  const speakChunk = useCallback(
    (index: number) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      if (index >= chunksRef.current.length || !isPlayingRef.current) {
        setIsSpeaking(false);
        setIsPaused(false);
        chunkIndexRef.current = 0;
        setCurrentChunkIndex(0);
        updateMediaSession('none');
        return;
      }

      const text = chunksRef.current[index];
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      // Assign matching voice
      const voice = activeVoice || findClosestVoice(langCode, voices);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        const config = LANGUAGE_LOCALES[langCode];
        utterance.lang = config?.primaryLocale || langCode;
      }

      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        chunkIndexRef.current = index;
        setCurrentChunkIndex(index);
        updateMediaSession('playing');
      };

      utterance.onend = () => {
        if (isPlayingRef.current) {
          const nextIndex = index + 1;
          speakChunk(nextIndex);
        }
      };

      utterance.onerror = (event) => {
        // Canceled errors are expected during pause/stop
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          console.warn('TTS playback error:', event.error);
        }
        if (event.error !== 'canceled' && isPlayingRef.current) {
          const nextIndex = index + 1;
          speakChunk(nextIndex);
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [activeVoice, langCode, voices, speechRate, updateMediaSession]
  );

  // Start speaking markdown content
  const speak = useCallback(
    (markdownContent: string) => {
      if (!isSupported) return;
      unlockAudioSession();

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const chunks = sanitizeMarkdownForSpeech(markdownContent);
      if (chunks.length === 0) return;

      chunksRef.current = chunks;
      setTotalChunks(chunks.length);
      isPlayingRef.current = true;
      chunkIndexRef.current = 0;
      setCurrentChunkIndex(0);

      speakChunk(0);
    },
    [isSupported, speakChunk]
  );

  // Pause speech
  const pause = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      updateMediaSession('paused');
    }
  }, [updateMediaSession]);

  // Resume speech
  const resume = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      updateMediaSession('playing');
    } else if (!isSpeaking && chunksRef.current.length > 0) {
      // If stopped or completed, restart from current index
      isPlayingRef.current = true;
      speakChunk(chunkIndexRef.current);
    }
  }, [isSpeaking, speakChunk, updateMediaSession]);

  // Stop speech completely
  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    isPlayingRef.current = false;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    chunkIndexRef.current = 0;
    setCurrentChunkIndex(0);
    updateMediaSession('none');
  }, [updateMediaSession]);

  // Change playback speed
  const changeRate = useCallback(
    (rate: number) => {
      setSpeechRate(rate);
      if (isSpeaking && !isPaused) {
        // Restart current chunk at new rate
        window.speechSynthesis.cancel();
        speakChunk(chunkIndexRef.current);
      }
    },
    [isSpeaking, isPaused, speakChunk]
  );

  return {
    isSupported,
    isSpeaking,
    isPaused,
    currentChunkIndex,
    totalChunks,
    speechRate,
    activeVoice,
    speak,
    pause,
    resume,
    stop,
    changeRate,
  };
}

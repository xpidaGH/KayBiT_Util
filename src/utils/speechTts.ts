/**
 * Native Web Speech Synthesis (TTS) Engine for KayBiT_Util
 * Handles cross-browser voice matching, mobile webview playback, 
 * chunked utterance streaming, and MediaSession background audio controls.
 */

export interface LanguageLocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  primaryLocale: string;
  alternateLocales: string[];
}

export const LANGUAGE_LOCALES: Record<string, LanguageLocaleConfig> = {
  en: { code: 'en', name: 'English', nativeName: 'English', primaryLocale: 'en-US', alternateLocales: ['en-GB', 'en-AU', 'en-CA', 'en'] },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', primaryLocale: 'fr-FR', alternateLocales: ['fr-CA', 'fr-BE', 'fr-CH', 'fr'] },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', primaryLocale: 'de-DE', alternateLocales: ['de-AT', 'de-CH', 'de'] },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', primaryLocale: 'it-IT', alternateLocales: ['it-CH', 'it'] },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', primaryLocale: 'es-ES', alternateLocales: ['es-MX', 'es-US', 'es-AR', 'es'] },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', primaryLocale: 'pt-BR', alternateLocales: ['pt-PT', 'pt'] },
  id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', primaryLocale: 'id-ID', alternateLocales: ['id', 'ms-MY', 'ms'] },
  sw: { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', primaryLocale: 'sw-KE', alternateLocales: ['sw-TZ', 'sw'] },
  tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', primaryLocale: 'tr-TR', alternateLocales: ['tr'] },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', primaryLocale: 'ru-RU', alternateLocales: ['ru'] },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', primaryLocale: 'zh-CN', alternateLocales: ['zh-TW', 'zh-HK', 'zh'] },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', primaryLocale: 'ja-JP', alternateLocales: ['ja'] },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', primaryLocale: 'ar-SA', alternateLocales: ['ar-EG', 'ar-AE', 'ar'] },
  ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', primaryLocale: 'ur-PK', alternateLocales: ['ur-IN', 'ur'] },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', primaryLocale: 'hi-IN', alternateLocales: ['hi'] },
  vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', primaryLocale: 'vi-VN', alternateLocales: ['vi'] },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', primaryLocale: 'ko-KR', alternateLocales: ['ko'] },
  fa: { code: 'fa', name: 'Farsi', nativeName: 'فارسی', primaryLocale: 'fa-IR', alternateLocales: ['fa'] },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी', primaryLocale: 'mr-IN', alternateLocales: ['mr', 'hi-IN'] },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', primaryLocale: 'bn-BD', alternateLocales: ['bn-IN', 'bn'] },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', primaryLocale: 'ta-IN', alternateLocales: ['ta-LK', 'ta-SG', 'ta'] },
  te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', primaryLocale: 'te-IN', alternateLocales: ['te'] },
};

/**
 * Clean markdown for smooth speech playback
 */
export function sanitizeMarkdownForSpeech(markdown: string): string[] {
  // Strip code blocks or summarize them
  const noCodeBlocks = markdown.replace(/```[\s\S]*?```/g, ' [Code sample omitted for audio narration] ');
  
  // Break into clean paragraphs
  const rawParagraphs = noCodeBlocks
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && p !== '---');

  const speechChunks: string[] = [];

  for (const para of rawParagraphs) {
    let clean = para
      .replace(/^#{1,6}\s+/gm, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove inline code ticks
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Replace links with text
      .replace(/^[-*+]\s+/gm, '') // Remove bullet points
      .replace(/^\d+\.\s+/gm, '') // Remove numbered list prefixes
      .trim();

    if (!clean) continue;

    // Split long paragraphs into sentences (< 180 chars) to circumvent the 15-second speech synthesis cutoff bug
    if (clean.length > 180) {
      const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
      let currentBuffer = '';
      for (const s of sentences) {
        if ((currentBuffer + ' ' + s).length > 180) {
          if (currentBuffer.trim()) speechChunks.push(currentBuffer.trim());
          currentBuffer = s;
        } else {
          currentBuffer = currentBuffer ? `${currentBuffer} ${s}` : s;
        }
      }
      if (currentBuffer.trim()) speechChunks.push(currentBuffer.trim());
    } else {
      speechChunks.push(clean);
    }
  }

  return speechChunks;
}

/**
 * Intelligent voice matching for any language code
 */
export function findClosestVoice(
  langCode: string,
  availableVoices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!availableVoices || availableVoices.length === 0) return null;

  const config = LANGUAGE_LOCALES[langCode];
  const targetLocales = config
    ? [
        config.primaryLocale.toLowerCase(),
        ...config.alternateLocales.map((l) => l.toLowerCase()),
        langCode.toLowerCase(),
      ]
    : [langCode.toLowerCase()];

  // 1. Exact match on normalized BCP-47 locale (e.g., 'es-es')
  for (const locale of targetLocales) {
    const match = availableVoices.find(
      (v) => v.lang.toLowerCase().replace('_', '-') === locale
    );
    if (match) return match;
  }

  // 2. Prefix match (e.g., 'es' matches 'es-US' or 'es-419')
  for (const locale of targetLocales) {
    const prefix = locale.split('-')[0];
    const match = availableVoices.find((v) =>
      v.lang.toLowerCase().replace('_', '-').startsWith(prefix)
    );
    if (match) return match;
  }

  // 3. Name search (voices often have localized language names in their title)
  if (config) {
    const nameMatch = availableVoices.find(
      (v) =>
        v.name.toLowerCase().includes(config.name.toLowerCase()) ||
        v.name.toLowerCase().includes(config.nativeName.toLowerCase())
    );
    if (nameMatch) return nameMatch;
  }

  // 4. Default system fallback
  return availableVoices.find((v) => v.default) || availableVoices[0] || null;
}

/**
 * Cross-browser Audio Session unlock for mobile WebViews & iOS Safari
 */
let audioContextUnlocked = false;
export function unlockAudioSession(): void {
  if (audioContextUnlocked || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      audioContextUnlocked = true;
    }
  } catch {
    // Graceful fallback if AudioContext restricted
  }
}

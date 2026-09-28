import { ScriptStats, SupportedLanguage } from '../../types/nlp';
import { LanguageDetector } from './LanguageDetector';
import { SentenceSegmenter } from './SentenceSegmenter';

export class TextAnalyzer {
  /**
   * Analyzes raw or processed text to generate live production stats.
   * Words Per Minute average: 135-150 wpm for narration.
   */
  public static analyze(text: string, speedFactor = 1.0): ScriptStats {
    if (!text || !text.trim()) {
      return {
        wordCount: 0,
        characterCount: 0,
        sentenceCount: 0,
        paragraphCount: 0,
        chunkCount: 0,
        estimatedDurationSeconds: 0,
      };
    }

    const trimmed = text.trim();
    const characterCount = trimmed.length;

    // Word count accounting for Latin and Devanagari space-separated words
    const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
    const wordCount = words.length;

    // Sentences
    const sentences = SentenceSegmenter.splitSentences(trimmed);
    const sentenceCount = sentences.length;

    // Paragraphs
    const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const paragraphCount = paragraphs.length;

    // Chunks
    const chunks = SentenceSegmenter.chunkText(trimmed, 550);
    const chunkCount = chunks.length;

    // Estimated duration calculation: ~140 words per minute base
    // Multiply by speed factor (e.g. 1.5x speed -> duration / 1.5)
    const baseWpm = 140;
    const effectiveWpm = baseWpm * (speedFactor > 0 ? speedFactor : 1.0);
    const durationMinutes = wordCount / effectiveWpm;
    const estimatedDurationSeconds = Math.max(1, Math.round(durationMinutes * 60));

    return {
      wordCount,
      characterCount,
      sentenceCount,
      paragraphCount,
      chunkCount,
      estimatedDurationSeconds,
    };
  }

  /**
   * Performs full NLP pipeline analysis on the script
   */
  public static fullAnalysis(
    rawText: string,
    forcedLang: SupportedLanguage = 'AUTO',
    speed = 1.0
  ): {
    detectedLanguage: SupportedLanguage;
    stats: ScriptStats;
    suggestedPacing: string;
  } {
    const detectedLanguage = forcedLang === 'AUTO' ? LanguageDetector.detect(rawText) : forcedLang;
    const stats = this.analyze(rawText, speed);

    let suggestedPacing = 'Standard 1.0x narration pace';
    if (detectedLanguage === 'HINGLISH') {
      suggestedPacing = '1.15x - 1.25x (Optimal for tech & educational Hinglish)';
    } else if (detectedLanguage === 'HINDI') {
      suggestedPacing = '1.0x (Clear, articulate cadence for documentaries)';
    }

    return {
      detectedLanguage,
      stats,
      suggestedPacing,
    };
  }
}

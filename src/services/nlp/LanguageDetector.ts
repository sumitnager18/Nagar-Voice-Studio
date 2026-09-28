import { SupportedLanguage } from '../../types/nlp';

export class LanguageDetector {
  /**
   * Detects whether text is primarily English, Hindi (Devanagari), or Hinglish (mixed script or code-switched).
   * Critical rule from spec: NEVER translate or force Devanagari conversion for Hinglish code-switching.
   */
  public static detect(text: string): SupportedLanguage {
    if (!text || text.trim().length === 0) return 'ENGLISH';

    const devanagariRegex = /[\u0900-\u097F]/g;
    const latinRegex = /[a-zA-Z]/g;

    const devanagariMatches = text.match(devanagariRegex) || [];
    const latinMatches = text.match(latinRegex) || [];

    const devanagariCount = devanagariMatches.length;
    const latinCount = latinMatches.length;
    const totalScriptChars = devanagariCount + latinCount;

    if (totalScriptChars === 0) return 'ENGLISH';

    const devanagariRatio = devanagariCount / totalScriptChars;
    const latinRatio = latinCount / totalScriptChars;

    // Both scripts present in noticeable proportion -> HINGLISH
    if (devanagariRatio > 0.12 && latinRatio > 0.12) {
      return 'HINGLISH';
    }

    // Romanized Hinglish common keywords check
    const hinglishMarkers = /\b(ke baare mein|karenge|sikhenge|aaj hum|hai|hain|hota hai|kisi bhi|is video me|dosto|shuru karte hain)\b/i;
    if (latinRatio > 0.8 && hinglishMarkers.test(text)) {
      return 'HINGLISH';
    }

    if (devanagariRatio >= 0.7) {
      return 'HINDI';
    }

    return 'ENGLISH';
  }
}

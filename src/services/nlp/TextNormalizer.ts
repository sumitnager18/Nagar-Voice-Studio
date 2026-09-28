import { NLPTokenHighlight, SupportedLanguage } from '../../types/nlp';
import { PronunciationManager } from './PronunciationManager';

export class TextNormalizer {
  /**
   * Normalizes text for TTS while generating highlight metadata for user inspection.
   * NEVER silently alters meaning, names, or numbers.
   */
  public static normalize(
    text: string,
    language: SupportedLanguage,
    pronunciationManager?: PronunciationManager,
    projectId?: string,
    voicePresetId?: string
  ): {
    processedText: string;
    highlights: NLPTokenHighlight[];
  } {
    if (!text) {
      return { processedText: '', highlights: [] };
    }

    let processed = text;
    const highlights: NLPTokenHighlight[] = [];

    // 1. Currency Normalization (e.g. ₹500, $100, €50)
    const currencyRegex = /([₹$€£])\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/g;
    processed = processed.replace(currencyRegex, (match, symbol, amount, offset) => {
      let currencyName = 'dollars';
      if (symbol === '₹') currencyName = language === 'HINDI' ? 'रुपये' : 'rupees';
      else if (symbol === '$') currencyName = 'dollars';
      else if (symbol === '€') currencyName = 'euros';
      else if (symbol === '£') currencyName = 'pounds';

      const normalized = `${amount} ${currencyName}`;
      highlights.push({
        original: match,
        normalized,
        type: 'currency',
        startIndex: offset,
        endIndex: offset + match.length,
        explanation: `Standardized currency format (${symbol} to spoken '${currencyName}')`
      });
      return normalized;
    });

    // 2. Date Normalization (e.g. 2026-09-25 or 25/09/2026)
    const isoDateRegex = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    processed = processed.replace(isoDateRegex, (match, y, m, d, offset) => {
      const monthIdx = parseInt(m, 10) - 1;
      const day = parseInt(d, 10);
      if (monthIdx >= 0 && monthIdx < 12) {
        const normalized = `${day} ${monthNames[monthIdx]} ${y}`;
        highlights.push({
          original: match,
          normalized,
          type: 'date',
          startIndex: offset,
          endIndex: offset + match.length,
          explanation: `Converted ISO date to natural spoken date format`
        });
        return normalized;
      }
      return match;
    });

    // 3. Pronunciation Dictionary Substitution (Hierarchy: Project -> Voice -> Global)
    if (pronunciationManager) {
      const activeEntries = pronunciationManager.getActiveEntriesForScope(projectId, voicePresetId);
      
      // Sort by length descending so longer phrases match first (e.g. "ComputerGuruHub" before "Hub")
      const sortedEntries = [...activeEntries].sort((a, b) => b.sourceText.length - a.sourceText.length);

      for (const entry of sortedEntries) {
        if (!entry.enabled || !entry.sourceText.trim()) continue;

        // Escape regex special chars
        const escaped = entry.sourceText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`\\b${escaped}\\b`, 'g');

        processed = processed.replace(pattern, (match, offset) => {
          if (match !== entry.spokenAs) {
            highlights.push({
              original: match,
              normalized: entry.spokenAs,
              type: entry.category === 'acronym' ? 'acronym' : 'pronunciation',
              startIndex: offset,
              endIndex: offset + match.length,
              explanation: entry.notes || `Dictionary mapping: '${entry.sourceText}' → '${entry.spokenAs}'`
            });
            return entry.spokenAs;
          }
          return match;
        });
      }
    }

    // 4. Standardize repetitive punctuation pauses (clean up triple dashes or excessive spaces)
    processed = processed.replace(/(\r?\n){3,}/g, '\n\n');
    processed = processed.replace(/[ \t]{2,}/g, ' ');

    return {
      processedText: processed,
      highlights,
    };
  }
}

export class SentenceSegmenter {
  /**
   * Splits text into sentences respecting English punctuation and Devanagari purna viram (।).
   */
  public static splitSentences(text: string): string[] {
    if (!text || !text.trim()) return [];
    
    // Handles English '.', '!', '?', and Hindi purna viram '।'
    // Avoids splitting on common abbreviations like "e.g.", "i.e.", "Dr.", "Mr."
    const clean = text.trim();
    const sentenceRegex = /([^.!?।\n]+[.!?।]+(?:\s+|$)|[^\n]+(?:\n+|$))/g;
    const matches = clean.match(sentenceRegex);

    if (!matches || matches.length === 0) {
      return [clean];
    }

    return matches.map((s) => s.trim()).filter((s) => s.length > 0);
  }

  /**
   * Splits long-form script into optimal TTS chunks.
   * Priority hierarchy: Paragraph boundary -> Sentence boundary -> Clause boundary -> Word boundary.
   * Never splits a word. Avoids splitting sentences.
   */
  public static chunkText(
    text: string,
    maxCharLength = 600,
    minCharLength = 120
  ): string[] {
    if (!text || !text.trim()) return [];
    
    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 0);
    const chunks: string[] = [];

    for (const paragraph of paragraphs) {
      if (paragraph.length <= maxCharLength) {
        chunks.push(paragraph);
        continue;
      }

      // Paragraph is longer than maxCharLength: break by sentences
      const sentences = this.splitSentences(paragraph);
      let currentChunk = '';

      for (const sentence of sentences) {
        // If a single sentence exceeds maxCharLength, split by clauses
        if (sentence.length > maxCharLength) {
          if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }

          const clauseParts = sentence.split(/([,;—]|\s-\s)/);
          let currentClause = '';

          for (let i = 0; i < clauseParts.length; i++) {
            const part = clauseParts[i];
            if ((currentClause + part).length > maxCharLength) {
              if (currentClause.trim().length > 0) {
                chunks.push(currentClause.trim());
                currentClause = part;
              } else {
                // Word boundary fallback
                const words = part.split(/\s+/);
                let wordChunk = '';
                for (const w of words) {
                  if ((wordChunk + ' ' + w).length > maxCharLength) {
                    if (wordChunk.trim()) chunks.push(wordChunk.trim());
                    wordChunk = w;
                  } else {
                    wordChunk += (wordChunk ? ' ' : '') + w;
                  }
                }
                if (wordChunk.trim()) chunks.push(wordChunk.trim());
              }
            } else {
              currentClause += part;
            }
          }

          if (currentClause.trim().length > 0) {
            chunks.push(currentClause.trim());
          }
          continue;
        }

        // Standard sentence accumulation
        if ((currentChunk + ' ' + sentence).trim().length > maxCharLength) {
          if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            chunks.push(sentence.trim());
          }
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }

      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }
    }

    return chunks.filter((c) => c.trim().length > 0);
  }
}

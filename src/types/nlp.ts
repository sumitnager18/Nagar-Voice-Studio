export type SupportedLanguage = 'AUTO' | 'HINDI' | 'ENGLISH' | 'HINGLISH';

export interface PronunciationEntry {
  id: string;
  sourceText: string; // e.g. "ComputerGuruHub" or "AI"
  spokenAs: string; // e.g. "Computer Guru Hub" or "A I"
  ipa?: string; // IPA notation if available
  scope: 'global' | 'project' | 'voice_preset' | 'sentence';
  projectId?: string;
  voicePresetId?: string;
  enabled: boolean;
  category?: 'technical' | 'acronym' | 'brand' | 'phonetic' | 'general';
  notes?: string;
}

export interface NLPTokenHighlight {
  original: string;
  normalized: string;
  type: 'number' | 'date' | 'currency' | 'acronym' | 'pronunciation' | 'pause';
  startIndex: number;
  endIndex: number;
  explanation: string;
}

export interface NLPProcessingResult {
  originalText: string;
  processedText: string;
  detectedLanguage: SupportedLanguage;
  highlights: NLPTokenHighlight[];
  stats: ScriptStats;
  appliedDictionaryRules: PronunciationEntry[];
}

export interface ScriptStats {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  chunkCount: number;
  estimatedDurationSeconds: number; // based on avg 140 wpm (or speed factor)
}

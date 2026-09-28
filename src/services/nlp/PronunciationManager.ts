import { PronunciationEntry } from '../../types/nlp';

export const DEFAULT_PRONUNCIATION_ENTRIES: PronunciationEntry[] = [
  {
    id: 'pr-cgh',
    sourceText: 'ComputerGuruHub',
    spokenAs: 'Computer Guru Hub',
    scope: 'global',
    enabled: true,
    category: 'brand',
    notes: 'Preserves brand pronunciation for CGH channel & tutorials'
  },
  {
    id: 'pr-ai',
    sourceText: 'AI',
    spokenAs: 'A I',
    scope: 'global',
    enabled: true,
    category: 'acronym',
    notes: 'Artificial Intelligence abbreviation pronounced as distinct letters'
  },
  {
    id: 'pr-nlp',
    sourceText: 'NLP',
    spokenAs: 'N L P',
    scope: 'global',
    enabled: true,
    category: 'acronym',
    notes: 'Natural Language Processing acronym'
  },
  {
    id: 'pr-gpu',
    sourceText: 'GPU',
    spokenAs: 'G P U',
    scope: 'global',
    enabled: true,
    category: 'acronym',
    notes: 'Graphics Processing Unit'
  },
  {
    id: 'pr-cpu',
    sourceText: 'CPU',
    spokenAs: 'C P U',
    scope: 'global',
    enabled: true,
    category: 'acronym',
    notes: 'Central Processing Unit'
  },
  {
    id: 'pr-ram',
    sourceText: 'RAM',
    spokenAs: 'R A M',
    scope: 'global',
    enabled: true,
    category: 'acronym',
    notes: 'Random Access Memory'
  },
  {
    id: 'pr-api',
    sourceText: 'API',
    spokenAs: 'A P I',
    scope: 'global',
    enabled: true,
    category: 'acronym',
    notes: 'Application Programming Interface'
  },
  {
    id: 'pr-json',
    sourceText: 'JSON',
    spokenAs: 'J S O N',
    scope: 'global',
    enabled: true,
    category: 'technical',
    notes: 'Standard JS Object Notation phonetic clarification'
  },
  {
    id: 'pr-python',
    sourceText: 'Python',
    spokenAs: 'Python',
    ipa: 'ˈpaɪθɑːn',
    scope: 'global',
    enabled: true,
    category: 'technical',
    notes: 'Ensure proper vowel sound in Hinglish/Hindi context'
  },
  {
    id: 'pr-html',
    sourceText: 'HTML',
    spokenAs: 'H T M L',
    scope: 'global',
    enabled: true,
    category: 'acronym',
    notes: 'HyperText Markup Language'
  },
  {
    id: 'pr-css',
    sourceText: 'CSS',
    spokenAs: 'C S S',
    scope: 'global',
    enabled: true,
    category: 'acronym',
    notes: 'Cascading Style Sheets'
  },
  {
    id: 'pr-sql',
    sourceText: 'SQL',
    spokenAs: 'S Q L',
    scope: 'global',
    enabled: true,
    category: 'technical',
    notes: 'Structured Query Language'
  }
];

export class PronunciationManager {
  private entries: PronunciationEntry[] = [];

  constructor(initialEntries?: PronunciationEntry[]) {
    this.entries = initialEntries ? [...initialEntries] : [...DEFAULT_PRONUNCIATION_ENTRIES];
  }

  public getEntries(): PronunciationEntry[] {
    return [...this.entries];
  }

  public setEntries(entries: PronunciationEntry[]): void {
    this.entries = [...entries];
  }

  public addEntry(entry: Omit<PronunciationEntry, 'id'>): PronunciationEntry {
    const newEntry: PronunciationEntry = {
      ...entry,
      id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    this.entries.push(newEntry);
    return newEntry;
  }

  public updateEntry(id: string, updates: Partial<PronunciationEntry>): boolean {
    const index = this.entries.findIndex((e) => e.id === id);
    if (index === -1) return false;
    this.entries[index] = { ...this.entries[index], ...updates };
    return true;
  }

  public deleteEntry(id: string): boolean {
    const prevLen = this.entries.length;
    this.entries = this.entries.filter((e) => e.id !== id);
    return this.entries.length !== prevLen;
  }

  public toggleEntry(id: string): boolean {
    const entry = this.entries.find((e) => e.id === id);
    if (!entry) return false;
    entry.enabled = !entry.enabled;
    return true;
  }

  /**
   * Applies hierarchy: Global -> Project -> Voice Preset -> Sentence
   */
  public getActiveEntriesForScope(projectId?: string, voicePresetId?: string): PronunciationEntry[] {
    return this.entries.filter((entry) => {
      if (!entry.enabled) return false;
      if (entry.scope === 'global') return true;
      if (entry.scope === 'project' && entry.projectId === projectId) return true;
      if (entry.scope === 'voice_preset' && entry.voicePresetId === voicePresetId) return true;
      return false;
    });
  }

  /**
   * Export dictionary to JSON
   */
  public exportToJson(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  /**
   * Import dictionary from JSON
   */
  public importFromJson(jsonString: string): { importedCount: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        return { importedCount: 0, error: 'Expected an array of pronunciation entries' };
      }
      let count = 0;
      for (const item of parsed) {
        if (item.sourceText && item.spokenAs) {
          const exists = this.entries.find((e) => e.sourceText.toLowerCase() === item.sourceText.toLowerCase());
          if (!exists) {
            this.addEntry({
              sourceText: item.sourceText,
              spokenAs: item.spokenAs,
              ipa: item.ipa,
              scope: item.scope || 'global',
              enabled: item.enabled ?? true,
              category: item.category || 'general',
              notes: item.notes,
            });
            count++;
          }
        }
      }
      return { importedCount: count };
    } catch (err: any) {
      return { importedCount: 0, error: err.message || 'Invalid JSON format' };
    }
  }
}

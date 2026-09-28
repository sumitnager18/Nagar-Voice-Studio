import { Voice, VoiceDNA, VoicePreset } from '../../types/tts';

export const INITIAL_VOICES: Voice[] = [
  // 1. Ian Cartwell Reference Target (Section 7, 38, 39)
  {
    id: 'voice-ref-ian-cartwell',
    provider: 'elevenlabs',
    providerVoiceId: 'REFERENCE_TARGET_IAN_CARTWELL',
    name: 'Ian Cartwell',
    type: 'reference',
    languageCode: 'en-US',
    gender: 'male',
    description: 'Reference target — not an official ElevenLabs voice. Reference only unless authorized reference material is supplied.',
    sampleText: 'Welcome to Nagar Voice Studio. This is a descriptive reference target profile.',
    favorite: false,
    status: 'reference_only',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    language: 'English (US)',
    accent: 'British / Mid-Atlantic Reference',
    pitch: 'Medium-Low',
    persona: 'Ian Cartwell Reference Profile',
    bestUse: 'Reference comparison target (requires authorized audio to synthesize)',
    metadata: {
      referenceTarget: {
        provider: 'ElevenLabs',
        status: 'Reference Only',
        rightsStatus: 'Reference Only',
        notes: 'Descriptive reference target only. Does NOT claim or scrape official ElevenLabs voice data.'
      }
    }
  },

  // 2. Ian Cartwell — Production Target (Section 8, 9, 38, 39)
  {
    id: 'voice-prod-ian-cartwell-target',
    provider: 'gemini',
    providerVoiceId: 'voice_drmus5974igo', // Real created Gemini 3.8 Flash TTS voice ID
    name: 'Ian Cartwell — Production Target',
    type: 'designed',
    languageCode: 'en-US',
    gender: 'male',
    description: 'Professional mature male narrator with a polished, articulate, warm and confident vocal presence. Medium-low register, controlled resonance, clear consonants, natural conversational pacing, restrained emotional expression, authoritative but approachable delivery, suitable for documentary narration, technology videos, educational explanations and professional YouTube voiceover. Avoid exaggerated announcer delivery. Maintain natural breaths and subtle human variation.',
    sampleText: 'Welcome to Nagar Voice Studio. Today we are exploring how artificial intelligence is changing the way we learn.',
    favorite: true,
    status: 'available',
    createdAt: '2026-09-25T10:47:00Z',
    updatedAt: '2026-09-25T10:47:00Z',
    language: 'English (US / Neutral)',
    accent: 'Polished Documentary',
    pitch: 'Medium-Low',
    persona: 'Ian Cartwell Inspired — Gemini Production Target',
    bestUse: 'Documentary narration, technology videos, educational explanations, YouTube voiceover',
    metadata: {
      model: 'models/gemini-3.8-flash-tts',
      isProductionPreset: true,
      presetName: 'Ian Cartwell Production Target — Gemini',
      prompt: 'Professional mature male narrator with a polished, articulate, warm and confident vocal presence. Medium-low register, controlled resonance, clear consonants, natural conversational pacing, restrained emotional expression, authoritative but approachable delivery.',
      acousticDna: {
        pitch: -10,
        timbre: 'Controlled resonance, polished articulate baritone',
        ageImpression: 'Mature (Late 30s to 40s)',
        energy: 78,
        warmth: 88,
        authority: 90,
        emotionRange: 'Restrained, authoritative, nuanced',
        speakingSpeed: 1.0,
        clarity: 98,
        breathiness: 15,
        roughness: 8,
        narrationStyle: 'Documentary & High-Trust Explainer',
        bestUse: 'Documentary, Tech & Science YouTube videos',
        pronunciationProfile: 'Polished articulate delivery with subtle natural breaths'
      }
    },
    dnaProfile: {
      pitch: -10,
      timbre: 'Controlled resonance, polished articulate baritone',
      ageImpression: 'Mature (Late 30s to 40s)',
      energy: 78,
      warmth: 88,
      authority: 90,
      emotionRange: 'Restrained, authoritative, nuanced',
      speakingSpeed: 1.0,
      clarity: 98,
      breathiness: 15,
      roughness: 8,
      narrationStyle: 'Documentary & High-Trust Explainer',
      bestUse: 'Documentary, Tech & Science YouTube videos',
      pronunciationProfile: 'Polished articulate delivery with subtle natural breaths'
    }
  },

  // 3. CGH ARJUN Production Presets (Section 19, 20)
  {
    id: 'voice-cgh-arjun-doc',
    provider: 'gemini',
    providerVoiceId: 'Puck',
    name: 'CGH ARJUN — YouTube Documentary',
    type: 'prebuilt',
    languageCode: 'hi-IN',
    gender: 'male',
    description: 'Historical/reference production identity for ComputerGuruHub. High-clarity documentary technical delivery with balanced Indian English and Hindi. (Reference production identity — not claimed identical to Clipchamp).',
    sampleText: 'Python एक high-level programming language है, जिसका उपयोग automation, data analysis और artificial intelligence में किया जाता है।',
    favorite: true,
    status: 'available',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    language: 'Hindi (India) + Hinglish',
    accent: 'Indian (Delhi / NCR)',
    pitch: 'Medium (120 Hz)',
    persona: 'ComputerGuruHub Lead Narrator',
    bestUse: 'ComputerGuruHub tutorials, coding walkthroughs & technical explainers',
    metadata: {
      isProductionPreset: true,
      productionPreset: {
        presetName: 'CGH ARJUN — YouTube Documentary',
        pace: 1.25,
        historicalIdentity: 'Clipchamp Arjun reference mapped to Gemini 3.8 high-clarity technical delivery'
      }
    }
  },
  {
    id: 'voice-cgh-arjun-edu',
    provider: 'gemini',
    providerVoiceId: 'Puck',
    name: 'CGH ARJUN — Educational',
    type: 'prebuilt',
    languageCode: 'hi-IN',
    gender: 'male',
    description: 'Instructional tech narration with elevated pace (~1.5x preferred) for programming, data structures, and developer workflows.',
    sampleText: 'इस ट्यूटोरियल में हम React components और state management को विस्तार से समझेंगे।',
    favorite: true,
    status: 'available',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    language: 'Hindi (India) + English',
    accent: 'Indian Tech Presenter',
    pitch: 'Medium',
    persona: 'ComputerGuruHub Educator',
    bestUse: 'Rapid software tutorials and coding lectures',
    metadata: {
      isProductionPreset: true,
      productionPreset: {
        presetName: 'CGH ARJUN — Educational',
        pace: 1.5,
        historicalIdentity: 'Clipchamp reference educational calibration'
      }
    }
  },
  {
    id: 'voice-cgh-arjun-story',
    provider: 'gemini',
    providerVoiceId: 'Puck',
    name: 'CGH ARJUN — Storytelling',
    type: 'prebuilt',
    languageCode: 'hi-IN',
    gender: 'male',
    description: 'Expressive and engaging Hindi narrative pacing for story-driven tech case studies and historical biographies.',
    sampleText: 'यह कहानी है उस आविष्कार की, जिसने हमारे संवाद करने के पूरे तरीके को हमेशा के लिए बदल दिया।',
    favorite: false,
    status: 'available',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    language: 'Hindi (Devanagari)',
    accent: 'Storyteller Indian',
    pitch: 'Medium-Low',
    persona: 'Narrative Storyteller',
    bestUse: 'Documentary narratives and story-driven case studies',
    metadata: {
      isProductionPreset: true,
      productionPreset: {
        presetName: 'CGH ARJUN — Storytelling',
        pace: 1.0,
        historicalIdentity: 'Clipchamp storytelling preset mapped to Gemini'
      }
    }
  },

  // 4. CGH PRESENTER Production Presets (Section 19, 20)
  {
    id: 'voice-cgh-presenter-doc',
    provider: 'gemini',
    providerVoiceId: 'Puck',
    name: 'CGH PRESENTER — Documentary',
    type: 'prebuilt',
    languageCode: 'hi-IN',
    gender: 'male',
    description: 'Persistent production identity for ComputerGuruHub documentary features. Authoritative, intelligent, and composed delivery.',
    sampleText: 'आज हम artificial intelligence और machine learning के basic concepts को step-by-step समझेंगे।',
    favorite: true,
    status: 'available',
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z',
    language: 'Hinglish (Natural Mixed)',
    accent: 'Contemporary Indian Urban',
    pitch: 'Medium',
    persona: 'Modern Tech Educator & Anchor',
    bestUse: 'Natural Hindi, Natural English, Natural Hinglish, YouTube lessons',
    metadata: {
      isProductionPreset: true,
      productionPreset: {
        presetName: 'CGH PRESENTER — Documentary',
        pace: 1.1,
        historicalIdentity: 'ComputerGuruHub Production Presenter'
      }
    }
  },
  {
    id: 'voice-cgh-presenter-edu',
    provider: 'gemini',
    providerVoiceId: 'Puck',
    name: 'CGH PRESENTER — Educational',
    type: 'prebuilt',
    languageCode: 'hi-IN',
    gender: 'male',
    description: 'High-energy educational presenter identity. Clear pronunciation of technical acronyms in mixed Hinglish context.',
    sampleText: 'नमस्ते दोस्तों! इस वीडियो में हम REST APIs और backend integration के बारे में सीखेंगे।',
    favorite: true,
    status: 'available',
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z',
    language: 'Hinglish',
    accent: 'Indian Urban Technical',
    pitch: 'Medium',
    persona: 'ComputerGuruHub Educational Lead',
    bestUse: 'Rapid developer tutorials and API walkthroughs',
    metadata: {
      isProductionPreset: true,
      productionPreset: {
        presetName: 'CGH PRESENTER — Educational',
        pace: 1.25,
        historicalIdentity: 'ComputerGuruHub Technical Presets'
      }
    }
  },

  // 5. CGH FISH Production Preset (Section 19, 20)
  {
    id: 'voice-cgh-fish-doc',
    provider: 'fish_audio_ref',
    providerVoiceId: 'Charon',
    name: 'CGH FISH — Documentary',
    type: 'reference',
    languageCode: 'hi-IN',
    gender: 'male',
    description: 'Reference production identity. Does not claim exact Fish Audio equivalence without authorized reference.',
    sampleText: 'उस रात हिमालय की घाटी में एक अजीब घटना घटी, जिसने पूरे विज्ञान जगत को हैरान कर दिया।',
    favorite: false,
    status: 'reference_only',
    createdAt: '2026-09-05T00:00:00Z',
    updatedAt: '2026-09-05T00:00:00Z',
    language: 'Hindi + English',
    accent: 'Deep Cinematic Indian',
    pitch: 'Low (108 Hz)',
    persona: 'Atmospheric Documentary Voice',
    bestUse: 'Documentary narration, mystery, historical features',
    metadata: {
      referenceTarget: {
        provider: 'Fish Audio',
        status: 'Reference Only',
        rightsStatus: 'Reference Only',
        notes: 'Reference production identity. Does not claim exact Fish Audio equivalence.'
      }
    }
  },

  // 6. Google Flagship Prebuilt Voices (Section 19)
  {
    id: 'voice-gemini-puck',
    provider: 'gemini',
    providerVoiceId: 'Puck',
    name: 'Puck',
    type: 'prebuilt',
    languageCode: 'en-US',
    gender: 'male',
    description: 'Flagship Google voice featuring clear consonants, energetic projection, and high intelligibility for complex topics.',
    sampleText: 'Welcome to Nagar Voice Studio. Today we are going to explore how artificial intelligence is changing the way we learn.',
    favorite: true,
    status: 'available',
    createdAt: '2026-09-15T00:00:00Z',
    updatedAt: '2026-09-15T00:00:00Z',
    language: 'Multilingual (English / Hindi)',
    accent: 'Neutral / Direct',
    pitch: 'Medium-Low',
    persona: 'Dynamic Instructor & Tech Presenter',
    bestUse: 'Technology videos, YouTube narration, science lessons, dialogues',
    metadata: { liveGoogleVoice: true }
  },
  {
    id: 'voice-gemini-kore',
    provider: 'gemini',
    providerVoiceId: 'Kore',
    name: 'Kore',
    type: 'prebuilt',
    languageCode: 'en-US',
    gender: 'female',
    description: 'Flagship Google voice with exceptionally natural warmth, melodic phrasing, and balanced emotional resonance.',
    sampleText: 'नमस्ते! आज हम जानेंगे कि कृत्रिम बुद्धिमत्ता हमारे सीखने के तरीके को कैसे बदल रही है।',
    favorite: true,
    status: 'available',
    createdAt: '2026-09-15T00:00:00Z',
    updatedAt: '2026-09-15T00:00:00Z',
    language: 'Multilingual (Hindi / English)',
    accent: 'Neutral / Versatile',
    pitch: 'Medium-High',
    persona: 'Warm Storyteller & Documentary Anchor',
    bestUse: 'Audiobooks, educational lessons, explainers, Hindi storytelling',
    metadata: { liveGoogleVoice: true }
  },
  {
    id: 'voice-gemini-charon',
    provider: 'gemini',
    providerVoiceId: 'Charon',
    name: 'Charon',
    type: 'prebuilt',
    languageCode: 'en-US',
    gender: 'male',
    description: 'Deep authoritative male voice with dramatic low-end resonance and deliberate, intense pacing.',
    sampleText: 'The discovery changed modern physics forever, opening doors to previously unimagined dimensions.',
    favorite: false,
    status: 'available',
    createdAt: '2026-09-15T00:00:00Z',
    updatedAt: '2026-09-15T00:00:00Z',
    language: 'English / Hindi',
    accent: 'Deep Global Baritone',
    pitch: 'Low (Deep Baritone)',
    persona: 'Authoritative Anchor',
    bestUse: 'Documentary, scientific deep dives, history',
    metadata: { liveGoogleVoice: true }
  },
  {
    id: 'voice-gemini-fenrir',
    provider: 'gemini',
    providerVoiceId: 'Fenrir',
    name: 'Fenrir',
    type: 'prebuilt',
    languageCode: 'en-US',
    gender: 'male',
    description: 'Gravelly, grounded, deep bass voice for dramatic narration, trailers, and intense storytelling.',
    sampleText: 'Deep in the frozen mountains, an ancient secret lay waiting to be awakened.',
    favorite: false,
    status: 'available',
    createdAt: '2026-09-15T00:00:00Z',
    updatedAt: '2026-09-15T00:00:00Z',
    language: 'English / Hindi',
    accent: 'Deep Global',
    pitch: 'Low (Bass)',
    persona: 'Solemn Narrator',
    bestUse: 'Mystery, suspense, historical documentaries',
    metadata: { liveGoogleVoice: true }
  },
  {
    id: 'voice-gemini-aoede',
    provider: 'gemini',
    providerVoiceId: 'Aoede',
    name: 'Aoede',
    type: 'prebuilt',
    languageCode: 'en-US',
    gender: 'female',
    description: 'Bright, engaging, sophisticated female voice with pristine diction and conversational clarity.',
    sampleText: 'Welcome! Let us examine the architectural fundamentals of real-time audio systems.',
    favorite: false,
    status: 'available',
    createdAt: '2026-09-15T00:00:00Z',
    updatedAt: '2026-09-15T00:00:00Z',
    language: 'English / International',
    accent: 'Polished Studio',
    pitch: 'Medium-High',
    persona: 'Academic Presenter',
    bestUse: 'Instructional walkthroughs, literature, technical courses',
    metadata: { liveGoogleVoice: true }
  }
];

export const INITIAL_VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'preset-cgh-arjun-doc',
    voiceId: 'voice-cgh-arjun-doc',
    name: 'CGH Arjun — YouTube Documentary',
    provider: 'gemini',
    speed: 1.25,
    style: 'Speak as a calm Indian documentary narrator. Use natural pauses, moderate authority, clear pronunciation of technical terms, and restrained emotion.',
    emotion: 'Calm',
    pitch: 'Medium',
    language: 'Hindi (India)',
    pauseProfile: 'natural',
    energy: 'medium',
    useCase: 'YouTube documentary voiceover, technical investigations',
    notes: 'Reference production identity with ~1.25x pace preference.',
    isBuiltIn: true
  },
  {
    id: 'preset-cgh-arjun-edu',
    voiceId: 'voice-cgh-arjun-edu',
    name: 'CGH Arjun — Educational',
    provider: 'gemini',
    speed: 1.5,
    style: 'Speak in an upbeat, clear, instructional tone for software programming tutorials. Emphasize keywords and code terms clearly.',
    emotion: 'Authoritative',
    pitch: 'Medium',
    language: 'Hindi (India)',
    pauseProfile: 'instructional',
    energy: 'high',
    useCase: 'Computer science tutorials, coding walkthroughs, Python scripts',
    notes: 'Preferred 1.5x production speed for developer tutorials.',
    isBuiltIn: true
  },
  {
    id: 'preset-cgh-presenter-doc',
    voiceId: 'voice-cgh-presenter-doc',
    name: 'CGH Presenter — Documentary',
    provider: 'gemini',
    speed: 1.1,
    style: 'Speak as a calm Hindi documentary narrator. Use natural pauses, moderate authority, clear pronunciation and subtle emphasis.',
    emotion: 'Calm',
    pitch: 'Medium',
    language: 'Hinglish',
    pauseProfile: 'natural',
    energy: 'medium',
    useCase: 'Documentary voiceover with natural Hindi/English code-switching',
    notes: 'Consistent narrator identity across long script chunks.',
    isBuiltIn: true
  },
  {
    id: 'preset-ian-cartwell-target',
    voiceId: 'voice-prod-ian-cartwell-target',
    name: 'Ian Cartwell Production Target',
    provider: 'gemini',
    speed: 1.0,
    style: 'Professional mature male narrator with a polished, articulate, warm and confident vocal presence. Medium-low register, clear consonants, restrained emotional expression.',
    emotion: 'Serious',
    pitch: 'Medium-Low',
    language: 'en-US',
    pauseProfile: 'natural',
    energy: 'medium',
    useCase: 'Technology documentaries and educational explainers',
    notes: 'Production target created via real Gemini 3.8 voice design.',
    isBuiltIn: true
  }
];

const LOCAL_STORAGE_CUSTOM_VOICES_KEY = 'nagar_voice_custom_voices_v2';

export class VoiceLibraryRepository {
  private static voices: Voice[] = [...INITIAL_VOICES];
  private static presets: VoicePreset[] = [...INITIAL_VOICE_PRESETS];
  private static initialized = false;

  public static initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Load any custom voices saved locally
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_CUSTOM_VOICES_KEY);
      if (stored) {
        const customVoices: Voice[] = JSON.parse(stored);
        for (const cv of customVoices) {
          this.addVoice(cv, false);
        }
      }
    } catch (e) {
      console.warn('Failed to load stored custom voices from localStorage:', e);
    }
  }

  private static persistCustomVoices(): void {
    try {
      // Only persist designed and replicated custom voices
      const customVoices = this.voices.filter((v) => v.type === 'designed' || v.type === 'replicated');
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_VOICES_KEY, JSON.stringify(customVoices));
    } catch (e) {
      console.warn('Failed to persist custom voices:', e);
    }
  }

  // Fetch live Google voices from server endpoint GET /api/voices
  public static async fetchLiveGoogleVoices(): Promise<{ liveCount: number; error?: string }> {
    this.initialize();
    try {
      const res = await fetch('/api/voices');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { liveCount: 0, error: err.error || `HTTP ${res.status}` };
      }

      const data = await res.json();
      const liveVoices: Voice[] = data.voices || [];

      // Merge into local list without overriding pre-existing custom voices
      for (const lv of liveVoices) {
        const exists = this.voices.some((v) => v.providerVoiceId === lv.providerVoiceId || v.id === lv.id);
        if (!exists) {
          this.voices.push(lv);
        }
      }

      return { liveCount: liveVoices.length };
    } catch (err: any) {
      return { liveCount: 0, error: err.message || 'Network error fetching live voices' };
    }
  }

  public static getVoices(): Voice[] {
    this.initialize();
    return [...this.voices];
  }

  public static getPresets(): VoicePreset[] {
    this.initialize();
    return [...this.presets];
  }

  public static getVoiceById(id: string): Voice | undefined {
    this.initialize();
    return this.voices.find((v) => v.id === id || v.providerVoiceId === id);
  }

  public static getPresetById(id: string): VoicePreset | undefined {
    this.initialize();
    return this.presets.find((p) => p.id === id);
  }

  public static addVoice(voice: Voice, persist = true): void {
    this.initialize();
    const existingIdx = this.voices.findIndex((v) => v.id === voice.id || v.providerVoiceId === voice.providerVoiceId);
    if (existingIdx >= 0) {
      this.voices[existingIdx] = { ...this.voices[existingIdx], ...voice };
    } else {
      this.voices.unshift(voice);
    }

    if (persist) {
      this.persistCustomVoices();
    }
  }

  public static addPreset(preset: VoicePreset): void {
    this.initialize();
    const existingIdx = this.presets.findIndex((p) => p.id === preset.id);
    if (existingIdx >= 0) {
      this.presets[existingIdx] = preset;
    } else {
      this.presets.unshift(preset);
    }
  }

  public static toggleFavorite(voiceId: string): boolean {
    this.initialize();
    const voice = this.voices.find((v) => v.id === voiceId || v.providerVoiceId === voiceId);
    if (!voice) return false;
    voice.favorite = !voice.favorite;
    this.persistCustomVoices();
    return voice.favorite;
  }

  public static async deleteVoice(voiceId: string): Promise<boolean> {
    this.initialize();
    const target = this.voices.find((v) => v.id === voiceId);
    
    // If it's a provider custom voice (voice_...), also attempt server deletion
    if (target && target.providerVoiceId && target.providerVoiceId.startsWith('voice_')) {
      try {
        await fetch(`/api/voices/${target.providerVoiceId}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Server voice delete warning:', err);
      }
    }

    const initialLen = this.voices.length;
    this.voices = this.voices.filter((v) => v.id !== voiceId && v.providerVoiceId !== voiceId);
    this.persistCustomVoices();
    return this.voices.length !== initialLen;
  }

  public static exportVoicesJson(): string {
    this.initialize();
    return JSON.stringify({ voices: this.voices, presets: this.presets }, null, 2);
  }

  public static importVoicesJson(jsonString: string): { importedVoices: number; importedPresets: number; error?: string } {
    this.initialize();
    try {
      const data = JSON.parse(jsonString);
      let vCount = 0;
      let pCount = 0;

      if (Array.isArray(data.voices)) {
        for (const v of data.voices) {
          if (v.name && (v.id || v.providerVoiceId)) {
            this.addVoice(v);
            vCount++;
          }
        }
      }
      if (Array.isArray(data.presets)) {
        for (const p of data.presets) {
          if (p.name && p.id) {
            this.addPreset(p);
            pCount++;
          }
        }
      }
      return { importedVoices: vCount, importedPresets: pCount };
    } catch (err: any) {
      return { importedVoices: 0, importedPresets: 0, error: err.message || 'Invalid format' };
    }
  }
}
